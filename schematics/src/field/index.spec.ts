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

describe("ng g shaderng:field", () => {
  it("copies the named fields", async () => {
    const { testRunner, tree } = await withRuntime();
    const result = await testRunner.runSchematic("field", { fields: "aurora,flow" }, tree);
    assert.ok(result.exists("src/components/fields/aurora/gpu.ts"));
    assert.ok(result.exists("src/components/fields/flow/flow.ts"));
    assert.ok(!result.exists("src/components/fields/grid/gpu.ts"));
    assert.match(
      result.readText("src/components/fields/aurora/gpu.ts"),
      /Original to shaderng, MIT/,
    );
  });

  it("keeps an existing field unless --force is passed", async () => {
    const { testRunner, tree } = await withRuntime();
    const first = await testRunner.runSchematic("field", { fields: "grid" }, tree);
    first.overwrite("src/components/fields/grid/meta.ts", "// tweaked\n");
    const kept = await testRunner.runSchematic("field", { fields: "grid" }, first);
    assert.equal(kept.readText("src/components/fields/grid/meta.ts"), "// tweaked\n");
    const forced = await testRunner.runSchematic("field", { fields: "grid", force: true }, kept);
    assert.match(forced.readText("src/components/fields/grid/meta.ts"), /gridField/);
  });

  it("requires the runtime to be installed first", async () => {
    await assert.rejects(
      runner().runSchematic("field", { fields: "aurora" }, freshAppTree()),
      /Run "ng add shaderng" first/,
    );
  });

  it("explains itself when no field is named", async () => {
    const { testRunner, tree } = await withRuntime();
    await assert.rejects(testRunner.runSchematic("field", {}, tree), /Name at least one field/);
  });

  it("lists the available fields with --list without touching the tree", async () => {
    const { testRunner, tree } = await withRuntime();
    const messages: string[] = [];
    testRunner.logger.subscribe((entry) => messages.push(entry.message));
    const result = await testRunner.runSchematic("field", { list: true }, tree);
    assert.equal(result.exists("src/components/fields/aurora/gpu.ts"), false);
    assert.ok(messages.some((message) => message.includes("aurora")));
    assert.ok(messages.some((message) => message.includes("caustics")));
  });

  it("records copied files in shaderng.json", async () => {
    const { testRunner, tree } = await withRuntime();
    const result = await testRunner.runSchematic("field", { fields: "waves" }, tree);
    const lock = readJson<{ files: Record<string, string> }>(result, "shaderng.json");
    assert.ok(lock.files["src/components/fields/waves/gpu.ts"]);
  });
});
