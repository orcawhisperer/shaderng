import { ORB_CATALOG, ORB_SLUGS, isOrbSlug } from "./orb-catalog";
import { loadOrb } from "./orb-loaders";
import {
  buildAngularSnippet,
  orbInstallCommand,
  RUNTIME_PATHS,
  runtimeInstallCommands,
  type SnippetDraft,
} from "./snippet";
import { cn } from "./utils";

describe("orb catalog", () => {
  it("ships 33 orbs", () => {
    expect(ORB_SLUGS).toHaveLength(33);
    expect(ORB_CATALOG).toHaveLength(33);
  });

  it("keeps sequential slugs", () => {
    expect(ORB_SLUGS[0]).toBe("orb-01");
    expect(ORB_SLUGS[32]).toBe("orb-33");
  });

  it("describes every orb", () => {
    const blank = ORB_CATALOG.filter((item) => !item.description.trim());
    expect(blank.map((item) => item.slug)).toEqual([]);
  });

  it("narrows slugs", () => {
    expect(isOrbSlug("orb-07")).toBe(true);
    expect(isOrbSlug("orb-99")).toBe(false);
    expect(isOrbSlug(undefined)).toBe(false);
  });

  it("rejects unknown orbs instead of falling back", async () => {
    await expect(loadOrb("orb-99")).rejects.toThrow('Unknown orb "orb-99"');
  });
});

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("buildAngularSnippet", () => {
  const variant = {
    colors: [{ default: "#ffffff", key: "tint", label: "Tint" }],
    key: "orb-01",
    label: "ORB-01",
    note: "test",
    params: [{ default: 0.5, key: "speed", label: "Speed", max: 10, min: 0, step: 0.1 }],
  };

  const draft: SnippetDraft = {
    autoDrive: true,
    colors: { tint: "#ffffff" },
    input: 0,
    output: 0.3,
    params: { speed: 0.5 },
  };

  it("emits an Angular component snippet", () => {
    const snippet = buildAngularSnippet({
      draft,
      size: 280,
      slug: "orb-01",
      state: "idle",
      variant,
    });
    expect(snippet).toContain("import { Orb01 }");
    expect(snippet).toContain("<orb-01");
    expect(snippet).toContain('state="idle"');
  });

  it("includes param overrides", () => {
    const snippet = buildAngularSnippet({
      draft: { ...draft, params: { speed: 1.25 } },
      size: 420,
      slug: "orb-01",
      state: "idle",
      variant,
    });
    expect(snippet).toContain('[params]="{ speed: 1.25 }"');
  });

  it("includes listen when enabled", () => {
    const snippet = buildAngularSnippet({
      draft,
      listen: true,
      size: 280,
      slug: "orb-01",
      state: "speaking",
      variant,
    });
    expect(snippet).toContain('[listen]="true"');
    expect(snippet).not.toContain("[volumes]");
  });
});

describe("install commands", () => {
  it("fetches one orb folder from the GitHub repo with degit", () => {
    expect(orbInstallCommand("orb-07")).toBe(
      "npx degit orcawhisperer/shaderng/src/components/orbs/orb-07 src/components/orbs/orb-07",
    );
  });

  it("lists every runtime file the orbs import", () => {
    const commands = runtimeInstallCommands();
    expect(commands.startsWith("npm i vgpu typegpu\n")).toBe(true);
    for (const path of RUNTIME_PATHS) {
      expect(commands).toContain(`npx degit orcawhisperer/shaderng/${path} ${path}`);
    }
  });
});
