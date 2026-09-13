import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { orbKeys, parsePresetLink, presetExportName, renderPresetFile } from "./preset";

describe("parsePresetLink", () => {
  it("reads a full playground link", () => {
    const preset = parsePresetLink(
      "https://shaderng.vercel.app/playground?orb=orb-12&state=thinking&size=200&p=speed:1.5,glow:0.25&c=tint:00ff00&v=0.2,1.4",
    );
    assert.deepEqual(preset, {
      slug: "orb-12",
      state: "thinking",
      size: 200,
      params: { speed: 1.5, glow: 0.25 },
      colors: { tint: "#00ff00" },
      volumes: { input: 0.2, output: 1 },
    });
  });

  it("accepts a query string with or without the question mark", () => {
    assert.deepEqual(parsePresetLink("?state=speaking"), { state: "speaking" });
    assert.deepEqual(parsePresetLink("state=idle&size=10"), { state: "idle" });
  });

  it("drops malformed values instead of throwing", () => {
    assert.deepEqual(parsePresetLink("orb=orb-1&state=loud&p=speed:abc,ok:1&c=tint:red"), {
      params: { ok: 1 },
    });
  });
});

describe("orbKeys", () => {
  it("reads param and colour keys from the bundled meta.ts", () => {
    const keys = orbKeys("orb-07");
    assert.ok(keys.params.includes("twist"));
    assert.ok(keys.params.includes("camDist"));
    assert.deepEqual(keys.colors, ["tint"]);
    assert.deepEqual(orbKeys("orb-99"), { params: [], colors: [] });
  });
});

describe("renderPresetFile", () => {
  it("names the export after the orb and the look", () => {
    assert.equal(presetExportName("orb-03", "hero"), "orb03Hero");
    assert.equal(presetExportName("orb-33", "dark-mode-2"), "orb33DarkMode2");
  });

  it("emits only the fields that were set", () => {
    const source = renderPresetFile(
      "orb-03",
      "hero",
      { state: "idle", colors: { tint: "#ffffff" } },
      "?x",
    );
    assert.match(source, /import type \{ OrbPreset \} from "@\/components\/orbs\/renderer";/);
    assert.match(source, /state: "idle",\n  colors: \{\n    tint: "#ffffff",\n  \},\n\};/);
    assert.doesNotMatch(source, /params|size|volumes/);
  });
});
