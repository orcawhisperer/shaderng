import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";

import type { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";

import { fingerprint, readLockfile, type Lockfile } from "../shared/lockfile";
import { resolveProject } from "../shared/workspace";
import { freshAppTree, readJson, runner } from "../testing/workspace";
import { KNOWN_HASHES, refreshFiles } from "./index";

const RENDERER = "src/components/orbs/renderer.ts";
const BACKGROUND = "src/components/orbs/shader-background.ts";
const PLUGIN = "tools/typegpu.esbuild.ts";

const installed = async (orbs = "orb-01") => {
  const testRunner = runner();
  const tree = await testRunner.runSchematic("ng-add", { orbs, skipInstall: true }, freshAppTree());
  return { testRunner, tree };
};

const logged = (testRunner: SchematicTestRunner) => {
  const messages: string[] = [];
  testRunner.logger.subscribe((entry) => messages.push(entry.message));
  return messages;
};

describe("shaderng.json lockfile", () => {
  it("is written by ng add with a hash for every copied file", async () => {
    const { tree } = await installed();
    const lock = readJson<Lockfile>(tree, "shaderng.json");
    assert.match(lock.version, /^\d+\.\d+\.\d+/);
    assert.equal(lock.sourceRoot, "src");
    assert.equal(lock.files[RENDERER], fingerprint(tree.readText(RENDERER)));
    assert.equal(lock.files[PLUGIN], fingerprint(tree.readText(PLUGIN)));
    assert.ok(lock.files["src/components/orbs/orb-01/gpu.ts"]);
    assert.ok(!lock.files["src/components/orbs/orb-02/gpu.ts"]);
  });

  it("grows when ng g shaderng:orb adds orbs", async () => {
    const { testRunner, tree } = await installed();
    const result = await testRunner.runSchematic("orb", { orbs: "orb-02" }, tree);
    const lock = readJson<Lockfile>(result, "shaderng.json");
    assert.ok(lock.files["src/components/orbs/orb-02/gpu.ts"]);
    assert.ok(lock.files["src/components/orbs/orb-01/gpu.ts"]);
  });

  it("does not claim files ng add skipped", async () => {
    const tree = freshAppTree({ [RENDERER]: "// mine\n" });
    const result = await runner().runSchematic("ng-add", { orbs: "", skipInstall: true }, tree);
    const lock = readJson<Lockfile>(result, "shaderng.json");
    assert.equal(lock.files[RENDERER], undefined);
    assert.equal(result.readText(RENDERER), "// mine\n");
  });
});

describe("ng g shaderng:update", () => {
  it("reports everything current right after ng add", async () => {
    const { testRunner, tree } = await installed();
    const messages = logged(testRunner);
    const result = await testRunner.runSchematic("update", {}, tree);
    assert.ok(messages.some((message) => /0 updated, 0 added/.test(message)));
    assert.ok(!messages.some((message) => /local edits/.test(message)));
    assert.equal(result.readText(RENDERER), tree.readText(RENDERER));
  });

  it("replaces files shaderng wrote, keeps edited ones, and adds missing ones", async () => {
    const { testRunner, tree } = await installed();
    // An older shaderng wrote this renderer: the lockfile knows its hash.
    tree.overwrite(RENDERER, "// stale renderer\n");
    const lock = readJson<Lockfile>(tree, "shaderng.json");
    lock.files[RENDERER] = fingerprint("// stale renderer\n");
    tree.overwrite("shaderng.json", JSON.stringify(lock));
    // The project edited its own copy of shader-orb.
    tree.overwrite("src/components/orbs/shader-orb.ts", "// edited by the app\n");
    tree.delete(BACKGROUND);

    const messages = logged(testRunner);
    const result = await testRunner.runSchematic("update", {}, tree);
    assert.match(result.readText(RENDERER), /createOrbRenderer/);
    assert.equal(result.readText("src/components/orbs/shader-orb.ts"), "// edited by the app\n");
    assert.match(result.readText(BACKGROUND), /ShaderBackground/);
    assert.ok(messages.some((message) => /1 updated, 1 added/.test(message)));
    assert.ok(messages.some((message) => message.includes("! src/components/orbs/shader-orb.ts")));
    const after = readLockfile(result, await resolveProject(result))!;
    assert.equal(after.files[RENDERER], fingerprint(result.readText(RENDERER)));
    assert.equal(after.files[BACKGROUND], fingerprint(result.readText(BACKGROUND)));
  });

  it("takes edited files too with --force", async () => {
    const { testRunner, tree } = await installed();
    tree.overwrite(RENDERER, "// edited\n");
    const result = await testRunner.runSchematic("update", { force: true }, tree);
    assert.match(result.readText(RENDERER), /createOrbRenderer/);
  });

  it("refreshes installed orbs only", async () => {
    const { testRunner, tree } = await installed("orb-01");
    tree.overwrite("src/components/orbs/orb-01/meta.ts", "// stale meta\n");
    const lock = readJson<Lockfile>(tree, "shaderng.json");
    lock.files["src/components/orbs/orb-01/meta.ts"] = fingerprint("// stale meta\n");
    tree.overwrite("shaderng.json", JSON.stringify(lock));
    const messages = logged(testRunner);
    const result = await testRunner.runSchematic("update", {}, tree);
    assert.match(result.readText("src/components/orbs/orb-01/meta.ts"), /orb01Orb/);
    assert.ok(!result.exists("src/components/orbs/orb-02/meta.ts"));
    assert.ok(messages.some((message) => /non-commercial/i.test(message)));
  });

  it("warns and does nothing when the runtime is not installed", async () => {
    const testRunner = runner();
    const messages = logged(testRunner);
    const tree = freshAppTree();
    const result = await testRunner.runSchematic("update", {}, tree);
    assert.ok(messages.some((message) => /nothing to update/.test(message)));
    assert.ok(!result.exists("shaderng.json"));
  });
});

describe("refreshFiles without a lockfile", () => {
  it("recognises a published version by hash, plugin rewrite included", async () => {
    const { tree } = await installed();
    const angular = readJson<{ projects: Record<string, { sourceRoot: string }> }>(
      freshAppTree(),
      "angular.json",
    );
    angular.projects["demo"]!.sourceRoot = "app/src";
    const custom = await runner().runSchematic(
      "ng-add",
      { orbs: "", skipInstall: true },
      freshAppTree({ "angular.json": JSON.stringify(angular) }),
    );
    // Pretend 0.1.0 shipped these contents; the plugin is stored as published, i.e. with "src".
    const oldRenderer = "// renderer as published\n";
    const oldPlugin = 'const SOURCE_ROOT = "src";\n// plugin as published\n';
    const known = {
      "0.1.0": {
        "runtime/src/components/orbs/renderer.ts": fingerprint(oldRenderer),
        "runtime/tools/typegpu.esbuild.ts": fingerprint(oldPlugin),
      },
    };
    custom.overwrite("app/src/components/orbs/renderer.ts", oldRenderer);
    custom.overwrite(PLUGIN, oldPlugin.replace('"src"', '"app/src"'));
    custom.overwrite("app/src/components/orbs/shader-orb.ts", "// edited\n");
    custom.delete("shaderng.json");

    const resolved = await resolveProject(custom);
    const lock: Lockfile = { version: "0.1.0", sourceRoot: "app/src", files: {} };
    const report = refreshFiles(custom, resolved, lock, false, known);
    assert.deepEqual(report.updated.sort(), ["app/src/components/orbs/renderer.ts", PLUGIN]);
    assert.deepEqual(report.kept, ["app/src/components/orbs/shader-orb.ts"]);
    assert.match(custom.readText(PLUGIN), /const SOURCE_ROOT = "app\/src";/);
  });

  it("ships hashes for the published 0.1.0 files", () => {
    const files = KNOWN_HASHES["0.1.0"]!;
    assert.ok(Object.keys(files).length > 100);
    assert.match(files["runtime/src/components/orbs/renderer.ts"]!, /^[0-9a-f]{64}$/);
    assert.ok(files["orbs/orb-33/gpu.ts"]);
  });
});

describe("ng update shaderng", () => {
  it("runs the refresh through the migration collection", async () => {
    const { tree } = await installed();
    tree.delete(BACKGROUND);
    const migrations = new SchematicTestRunner(
      "shaderng-migrations",
      join(__dirname, "..", "migrations", "migration-collection.json"),
    );
    const result: Tree = await migrations.runSchematic("refresh-files-0-2-0", {}, tree);
    assert.match(result.readText(BACKGROUND), /ShaderBackground/);
  });
});
