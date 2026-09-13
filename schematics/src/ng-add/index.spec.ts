import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parse } from "jsonc-parser";

import { FRESH_APP, freshAppTree, readJson, runner } from "../testing/workspace";

interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface AngularJson {
  projects: Record<
    string,
    {
      architect: Record<string, { builder: string; options?: Record<string, unknown> }>;
    }
  >;
}

const run = (options: Record<string, unknown> = {}, tree = freshAppTree()) =>
  runner().runSchematic("ng-add", options, tree);

describe("ng add shaderng", () => {
  it("copies the runtime files into sourceRoot and tools/", async () => {
    const tree = await run({ orbs: "" });
    for (const file of [
      "src/components/orbs/renderer.ts",
      "src/components/orbs/canvas.ts",
      "src/components/orbs/orb-base.ts",
      "src/components/orbs/shader-orb.ts",
      "src/components/orbs/shader-background.ts",
      "src/components/fields/field-base.ts",
      "src/lib/audio-drive.ts",
      "src/lib/mic-drive.ts",
      "src/lib/reduced-motion.ts",
      "src/lib/site.ts",
      "src/lib/utils.ts",
      "src/webgpu.d.ts",
      "tools/typegpu.esbuild.ts",
    ]) {
      assert.ok(tree.exists(file), `${file} should be created`);
    }
    assert.ok(!tree.exists("src/components/orbs/orb-01/gpu.ts"), "no orb with --orbs ''");
  });

  it("adds runtime and build dependencies with the pinned versions and schedules one install", async () => {
    const testRunner = runner();
    const tree = await testRunner.runSchematic("ng-add", {}, freshAppTree());
    const pkg = readJson<PackageJson>(tree, "package.json");
    for (const name of ["vgpu", "typegpu", "clsx", "tailwind-merge"]) {
      assert.match(pkg.dependencies[name] ?? "", /^\^/, `${name} in dependencies`);
    }
    for (const name of [
      "@angular-builders/custom-esbuild",
      "unplugin-typegpu",
      "@babel/core",
      "@babel/preset-typescript",
      "@webgpu/types",
    ]) {
      assert.match(pkg.devDependencies[name] ?? "", /^\^/, `${name} in devDependencies`);
    }
    assert.equal(pkg.dependencies["rxjs"], "~7.8.0", "existing dependencies are untouched");
    const installs = testRunner.tasks.filter((task) => task.name === "node-package");
    assert.equal(installs.length, 1);
  });

  it("does not schedule an install with --skip-install", async () => {
    const testRunner = runner();
    await testRunner.runSchematic("ng-add", { skipInstall: true }, freshAppTree());
    assert.equal(testRunner.tasks.length, 0);
  });

  it("switches build and serve to custom-esbuild and registers the plugin once", async () => {
    const first = await run();
    const architect = readJson<AngularJson>(first, "angular.json").projects["demo"]!.architect;
    assert.equal(architect["build"]!.builder, "@angular-builders/custom-esbuild:application");
    assert.equal(architect["serve"]!.builder, "@angular-builders/custom-esbuild:dev-server");
    assert.deepEqual(architect["build"]!.options!["plugins"], ["tools/typegpu.esbuild.ts"]);
    assert.deepEqual(architect["build"]!.options!["allowedCommonJsDependencies"], [
      "typegpu",
      "vgpu",
    ]);
    assert.equal(architect["build"]!.options!["browser"], "src/main.ts", "other options kept");

    const second = await run({ orbs: "" }, first);
    const again = readJson<AngularJson>(second, "angular.json").projects["demo"]!.architect;
    assert.deepEqual(again["build"]!.options!["plugins"], ["tools/typegpu.esbuild.ts"]);
  });

  it("adds the @/* path alias while keeping the tsconfig comments", async () => {
    const tree = await run();
    const text = tree.readText("tsconfig.json");
    assert.ok(text.startsWith("/* To learn more about Typescript"), "leading comment survives");
    const json = parse(text) as { compilerOptions: { paths: Record<string, string[]> } };
    assert.deepEqual(json.compilerOptions.paths, { "@/*": ["./src/*"] });
    assert.equal(tree.readText("tsconfig.app.json"), FRESH_APP["tsconfig.app.json"]);
  });

  it("leaves a conflicting @/* alias alone and warns", async () => {
    const tsconfig = FRESH_APP["tsconfig.json"].replace(
      '"module": "preserve"',
      '"module": "preserve",\n    "paths": { "@/*": ["./app/*"] }',
    );
    const warnings: string[] = [];
    const testRunner = runner();
    testRunner.logger.subscribe((entry) => {
      if (entry.level === "warn") {
        warnings.push(entry.message);
      }
    });
    const tree = await testRunner.runSchematic(
      "ng-add",
      { orbs: "" },
      freshAppTree({ "tsconfig.json": tsconfig }),
    );
    const json = parse(tree.readText("tsconfig.json")) as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    assert.deepEqual(json.compilerOptions.paths, { "@/*": ["./app/*"] });
    assert.ok(warnings.some((message) => message.includes("already maps @/*")));
  });

  it("copies orb-01 by default and the requested orbs otherwise", async () => {
    const defaults = await run();
    assert.ok(defaults.exists("src/components/orbs/orb-01/gpu.ts"));
    assert.ok(defaults.exists("src/components/orbs/orb-01/orb-01.ts"));
    assert.ok(!defaults.exists("src/components/orbs/orb-02/gpu.ts"));

    const picked = await run({ orbs: "orb-07, 12" });
    assert.ok(!picked.exists("src/components/orbs/orb-01/gpu.ts"));
    assert.ok(picked.exists("src/components/orbs/orb-07/meta.ts"));
    assert.ok(picked.exists("src/components/orbs/orb-12/index.ts"));

    const all = await run({ orbs: "all" });
    assert.equal(all.getDir("src/components/orbs").subdirs.length, 33);
  });

  it("rejects unknown orbs with the list of valid ones", async () => {
    await assert.rejects(run({ orbs: "orb-99" }), /Unknown orb: orb-99[\s\S]*orb-01, orb-02/);
  });

  it("keeps locally edited runtime files unless --force is passed", async () => {
    const tree = await run({ orbs: "" });
    tree.overwrite("src/lib/site.ts", "// local edit\n");
    const kept = await run({ orbs: "" }, tree);
    assert.equal(kept.readText("src/lib/site.ts"), "// local edit\n");
    const forced = await run({ orbs: "", force: true }, kept);
    assert.match(forced.readText("src/lib/site.ts"), /export const SITE/);
  });

  it("points the esbuild plugin at a non-standard sourceRoot", async () => {
    const angular = JSON.parse(FRESH_APP["angular.json"]) as {
      projects: Record<string, { root: string; sourceRoot: string }>;
    };
    angular.projects["demo"]!.sourceRoot = "app/src";
    const tree = await run(
      { orbs: "" },
      freshAppTree({ "angular.json": JSON.stringify(angular, null, 2) }),
    );
    assert.ok(tree.exists("app/src/components/orbs/shader-orb.ts"));
    assert.match(tree.readText("tools/typegpu.esbuild.ts"), /const SOURCE_ROOT = "app\/src";/);
    const json = parse(tree.readText("tsconfig.json")) as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    assert.deepEqual(json.compilerOptions.paths, { "@/*": ["./app/src/*"] });
  });

  it("refuses the webpack browser builder", async () => {
    const angular = FRESH_APP["angular.json"].replace(
      "@angular/build:application",
      "@angular-devkit/build-angular:browser",
    );
    await assert.rejects(
      run({}, freshAppTree({ "angular.json": angular })),
      /needs the esbuild application builder/,
    );
  });

  it("copies named fields when --fields is set", async () => {
    const tree = await run({ orbs: "", fields: "aurora" });
    assert.ok(tree.exists("src/components/fields/aurora/gpu.ts"));
    assert.ok(!tree.exists("src/components/fields/flow/gpu.ts"));
  });

  it("refuses a library project", async () => {
    const angular = FRESH_APP["angular.json"].replace('"application"', '"library"');
    await assert.rejects(
      run({ project: "demo" }, freshAppTree({ "angular.json": angular })),
      /is a library/,
    );
  });
});
