import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { freshAppTree, runner } from "../testing/workspace";

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
