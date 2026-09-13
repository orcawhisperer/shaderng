import { applyShare, decodeShare, encodeShare, type ShareKey } from "./playground-url";
import type { SnippetDraft } from "./snippet";

const variant = {
  colors: [{ default: "#ffffff", key: "tint", label: "Tint" }],
  params: [
    { default: 0.5, key: "speed", label: "Speed", max: 10, min: 0, step: 0.1 },
    { default: 1, key: "glow", label: "Glow", max: 2, min: 0, step: 0.1 },
  ],
  statePresets: { speaking: { speed: 2 } },
  stateColors: {},
};

const preset: SnippetDraft = {
  autoDrive: true,
  colors: { tint: "#ffffff" },
  input: 0,
  output: 0.3,
  params: { speed: 0.5, glow: 1 },
};

const fromQuery = (query: Partial<Record<ShareKey, string>>) =>
  decodeShare((key) => query[key] ?? null);

describe("encodeShare", () => {
  it("omits params and colors equal to the preset", () => {
    expect(
      encodeShare(variant, { draft: preset, size: 420, slug: "orb-01", state: "idle" }),
    ).toEqual({ c: null, field: null, orb: "orb-01", p: null, size: "420", state: "idle", v: null });
  });

  it("writes only the differences, hex colors without the hash", () => {
    const draft: SnippetDraft = {
      ...preset,
      autoDrive: false,
      input: 0.25,
      output: 0.8,
      colors: { tint: "#FF00AA" },
      params: { speed: 1.25, glow: 1 },
    };
    expect(encodeShare(variant, { draft, size: 300, slug: "orb-07", state: "idle" })).toEqual({
      c: "tint:FF00AA",
      field: null,
      orb: "orb-07",
      p: "speed:1.25",
      size: "300",
      state: "idle",
      v: "0.25,0.8",
    });
  });

  it("compares against the state's own preset", () => {
    const draft: SnippetDraft = { ...preset, params: { speed: 2, glow: 1 } };
    expect(
      encodeShare(variant, { draft, size: 420, slug: "orb-01", state: "speaking" }).p,
    ).toBeNull();
  });
});

describe("decodeShare", () => {
  it("round-trips an encoded share", () => {
    const draft: SnippetDraft = {
      ...preset,
      autoDrive: false,
      input: 0.25,
      output: 0.8,
      colors: { tint: "#ff00aa" },
      params: { speed: 1.25, glow: 1 },
    };
    const query = encodeShare(variant, { draft, size: 300, slug: "orb-07", state: "thinking" });
    const share = decodeShare((key) => query[key]);
    expect(share).toEqual({
      orb: "orb-07",
      state: "thinking",
      size: 300,
      params: { speed: 1.25 },
      colors: { tint: "#ff00aa" },
      volumes: { input: 0.25, output: 0.8 },
    });
    expect(applyShare(variant, preset, share)).toEqual(draft);
  });

  it("drops anything malformed instead of throwing", () => {
    expect(
      fromQuery({
        orb: "orb-99",
        state: "shouting",
        size: "abc",
        p: "speed:NaN,glow:abc,:1",
        c: "tint:notahex",
        v: "1",
      }),
    ).toEqual({});
  });

  it("clamps shared values into the orb's ranges", () => {
    const share = fromQuery({ p: "speed:99,unknown:3", v: "5,-1" });
    const draft = applyShare(variant, preset, share);
    expect(draft.params).toEqual({ speed: 10, glow: 1 });
    expect(draft.autoDrive).toBe(false);
    expect(draft.input).toBe(1);
    expect(draft.output).toBe(0);
  });
});
