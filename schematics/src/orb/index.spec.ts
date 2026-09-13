import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { freshAppTree, readJson, runner } from "../testing/workspace";

const withRuntime = async () => {
  const testRunner = runner();
  const tree = await testRunner.runSchematic(
    "ng-add",
    { orbs: "", skipInstall: true },
    freshAppTree(),
  );
  return { testRunner, tree };
};

describe("ng g shaderng:orb", () => {
  it("copies the named orbs, accepting bare numbers", async () => {
    const { testRunner, tree } = await withRuntime();
    const result = await testRunner.runSchematic("orb", { orbs: "orb-03,5" }, tree);
    assert.ok(result.exists("src/components/orbs/orb-03/gpu.ts"));
    assert.ok(result.exists("src/components/orbs/orb-05/orb-05.ts"));
    assert.ok(!result.exists("src/components/orbs/orb-01/gpu.ts"));
  });

  it("keeps an existing orb unless --force is passed", async () => {
    const { testRunner, tree } = await withRuntime();
    const first = await testRunner.runSchematic("orb", { orbs: "orb-02" }, tree);
    first.overwrite("src/components/orbs/orb-02/meta.ts", "// tweaked\n");
    const kept = await testRunner.runSchematic("orb", { orbs: "orb-02" }, first);
    assert.equal(kept.readText("src/components/orbs/orb-02/meta.ts"), "// tweaked\n");
    const forced = await testRunner.runSchematic("orb", { orbs: "orb-02", force: true }, kept);
    assert.match(forced.readText("src/components/orbs/orb-02/meta.ts"), /orb02Orb/);
  });

  it("requires the runtime to be installed first", async () => {
    await assert.rejects(
      runner().runSchematic("orb", { orbs: "orb-01" }, freshAppTree()),
      /Run "ng add shaderng" first/,
    );
  });

  it("explains itself when no orb is named", async () => {
    const { testRunner, tree } = await withRuntime();
    await assert.rejects(testRunner.runSchematic("orb", {}, tree), /Name at least one orb/);
  });

  it("lists the available orbs with --list without touching the tree", async () => {
    const { testRunner, tree } = await withRuntime();
    const messages: string[] = [];
    testRunner.logger.subscribe((entry) => messages.push(entry.message));
    const result = await testRunner.runSchematic("orb", { list: true }, tree);
    assert.equal(result.getDir("src/components/orbs").subdirs.length, 0);
    assert.ok(messages.some((message) => message.includes("orb-33")));
  });
});

describe("ng g shaderng:orb --preset", () => {
  const link =
    "https://shaderng.vercel.app/playground?orb=orb-07&state=speaking&size=320&p=twist:2.5,tilt:-0.4,nope:1&c=tint:ff8800&v=0.4,0.9";

  it("writes <name>.preset.ts next to the orb, installing the orb if needed", async () => {
    const { testRunner, tree } = await withRuntime();
    const messages: string[] = [];
    testRunner.logger.subscribe((entry) => messages.push(entry.message));
    const result = await testRunner.runSchematic("orb", { preset: link, name: "hero-glow" }, tree);
    assert.ok(result.exists("src/components/orbs/orb-07/gpu.ts"));
    const source = result.readText("src/components/orbs/orb-07/hero-glow.preset.ts");
    assert.match(source, /export const orb07HeroGlow: OrbPreset = \{/);
    assert.match(source, /state: "speaking",/);
    assert.match(source, /size: 320,/);
    assert.match(source, /twist: 2\.5,/);
    assert.match(source, /tilt: -0\.4,/);
    assert.match(source, /tint: "#ff8800",/);
    assert.match(source, /volumes: \{ input: 0\.4, output: 0\.9 \}/);
    assert.doesNotMatch(source.slice(source.indexOf("export const")), /nope/);
    assert.ok(messages.some((message) => message.includes("params.nope")));
    const lock = readJson<{ files: Record<string, string> }>(result, "shaderng.json");
    assert.ok(lock.files["src/components/orbs/orb-07/hero-glow.preset.ts"]);
  });

  it("accepts a bare query string and defaults the name to look", async () => {
    const { testRunner, tree } = await withRuntime();
    const result = await testRunner.runSchematic(
      "orb",
      { orbs: "orb-01", preset: "state=thinking&p=speed:2" },
      tree,
    );
    assert.match(
      result.readText("src/components/orbs/orb-01/look.preset.ts"),
      /export const orb01Look: OrbPreset/,
    );
  });

  it("refuses an existing preset file unless --force is passed", async () => {
    const { testRunner, tree } = await withRuntime();
    const first = await testRunner.runSchematic("orb", { preset: link }, tree);
    await assert.rejects(
      testRunner.runSchematic("orb", { preset: link }, first),
      /already exists; pass --force/,
    );
  });

  it("rejects bad names, empty looks and ambiguous orbs", async () => {
    const { testRunner, tree } = await withRuntime();
    await assert.rejects(
      testRunner.runSchematic("orb", { preset: link, name: "Hero Glow" }, tree),
      /Preset name/,
    );
    await assert.rejects(
      testRunner.runSchematic("orb", { orbs: "orb-01", preset: "orb=orb-01" }, tree),
      /Nothing to save/,
    );
    await assert.rejects(
      testRunner.runSchematic("orb", { orbs: "orb-01,orb-02", preset: link }, tree),
      /exactly one orb/,
    );
  });
});
