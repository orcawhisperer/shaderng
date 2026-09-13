import { chain, type Rule, type SchematicContext, type Tree } from "@angular-devkit/schematics";
import {
  addDependency,
  DependencyType,
  ExistingBehavior,
  InstallBehavior,
  writeWorkspace,
} from "@schematics/angular/utility";

import { copyOrbs, orbClassName, orbTargetDir, parseOrbSelection } from "../shared/orbs";
import {
  copyDirectory,
  readVersions,
  RUNTIME_SOURCE_DIR,
  RUNTIME_TOOLS_DIR,
  type CopyResult,
} from "../shared/package-files";
import { declaresPaths, ensurePathAlias, PATH_ALIAS } from "../shared/tsconfig";
import {
  assertEsbuildBuilder,
  configureBuilders,
  joinPath,
  PLUGIN_FILE,
  resolveProject,
  type ResolvedProject,
} from "../shared/workspace";
import type { NgAddOptions } from "./schema";

const DOCS_URL = "https://shaderng.vercel.app/docs/installation";

const addDependencies = (skipInstall: boolean): Rule[] => {
  const versions = readVersions();
  const install = skipInstall ? InstallBehavior.None : InstallBehavior.Auto;
  const rule = (type: DependencyType) => (entry: [string, string]) =>
    addDependency(entry[0], entry[1], { type, install, existing: ExistingBehavior.Skip });
  return [
    ...Object.entries(versions.dependencies).map(rule(DependencyType.Default)),
    ...Object.entries(versions.devDependencies).map(rule(DependencyType.Dev)),
  ];
};

const copyRuntime =
  (resolved: ResolvedProject, overwrite: boolean): Rule =>
  (tree, context) => {
    const source = copyDirectory(tree, RUNTIME_SOURCE_DIR, resolved.sourceRoot, { overwrite });
    const tools = copyDirectory(tree, RUNTIME_TOOLS_DIR, joinPath(resolved.root, "tools"), {
      overwrite,
      // The plugin resolves "@/..." imports itself; point it at this project's sourceRoot.
      transform: (path, content) =>
        path.endsWith("typegpu.esbuild.ts") && resolved.sourceRoot !== "src"
          ? content.replace(
              'const SOURCE_ROOT = "src";',
              `const SOURCE_ROOT = "${resolved.sourceRoot}";`,
            )
          : content,
    });
    const total: CopyResult = {
      written: [...source.written, ...tools.written],
      skipped: [...source.skipped, ...tools.skipped],
    };
    context.logger.info(
      `Runtime: ${total.written.length} file(s) written to ${resolved.sourceRoot}/.`,
    );
    if (total.skipped.length > 0) {
      context.logger.info(
        `Kept ${total.skipped.length} existing runtime file(s); pass --force to overwrite them.`,
      );
    }
  };

const wireBuilders =
  (resolved: ResolvedProject): Rule =>
  async (tree, context) => {
    const { pluginPath, changed } = configureBuilders(resolved);
    if (changed) {
      await writeWorkspace(tree, resolved.workspace);
      context.logger.info(
        `angular.json: "${resolved.name}" now builds with @angular-builders/custom-esbuild and ${pluginPath}.`,
      );
    }
  };

const addPathAlias =
  (resolved: ResolvedProject): Rule =>
  (tree, context) => {
    const rootTsconfig = tree.exists("tsconfig.json")
      ? "tsconfig.json"
      : joinPath(resolved.root, "tsconfig.json");
    const buildTsconfig = resolved.project.targets.get("build")?.options?.["tsConfig"];
    const targets = new Set<string>([rootTsconfig]);
    // `paths` is not merged through `extends`: a tsconfig.app.json with its own paths needs the alias too.
    if (typeof buildTsconfig === "string" && declaresPaths(tree, buildTsconfig)) {
      targets.add(buildTsconfig);
    }
    for (const path of targets) {
      const outcome = ensurePathAlias(tree, path, resolved.sourceRoot);
      switch (outcome) {
        case "added":
          context.logger.info(
            `${path}: added path alias ${PATH_ALIAS} -> ./${resolved.sourceRoot}/*.`,
          );
          break;
        case "conflict":
          context.logger.warn(
            `${path} already maps ${PATH_ALIAS} somewhere else. The copied files import ` +
              `"@/components/orbs/..." and "@/lib/..."; point the alias at ./${resolved.sourceRoot}/* ` +
              `or rewrite those imports.`,
          );
          break;
        case "missing":
          context.logger.warn(
            `${path} not found; add "paths": { "${PATH_ALIAS}": ["./${resolved.sourceRoot}/*"] } to your tsconfig.`,
          );
          break;
        case "present":
          break;
      }
    }
  };

const addOrbs =
  (resolved: ResolvedProject, slugs: string[], overwrite: boolean): Rule =>
  (tree, context) => {
    if (slugs.length === 0) {
      return;
    }
    copyOrbs(tree, context, resolved, slugs, overwrite);
  };

const printNextSteps =
  (resolved: ResolvedProject, slugs: string[]): Rule =>
  (_tree: Tree, context: SchematicContext) => {
    const [first] = slugs;
    const usage = first
      ? [
          "",
          "Use it:",
          `  import { ${orbClassName(first)} } from "@/components/orbs/${first}";`,
          `  <${first} [size]="280" state="speaking" [listen]="true" />`,
        ]
      : ["", "Copy an orb:", "  ng g shaderng:orb orb-01"];
    const copied =
      slugs.length > 0
        ? `Orbs: ${slugs.map((slug) => orbTargetDir(resolved, slug)).join(", ")}`
        : "Orbs: none yet";
    context.logger.info(
      [
        "",
        `shaderng is set up in "${resolved.name}".`,
        `  Runtime: ${resolved.sourceRoot}/components/orbs, ${resolved.sourceRoot}/lib, ${joinPath(resolved.root, PLUGIN_FILE)}`,
        `  ${copied}`,
        ...usage,
        "",
        "The WebGPU runtime adds ~500 kB to the initial bundle; a new project's 500 kB warning",
        "budget will flag it (the 1 MB error budget will not). Raise it in angular.json or load",
        "the orb behind a dynamic import().",
        "",
        "More orbs: ng g shaderng:orb orb-07   (list them with ng g shaderng:orb --list)",
        `Docs: ${DOCS_URL}`,
      ].join("\n"),
    );
  };

export function ngAdd(options: NgAddOptions): Rule {
  return async (tree: Tree) => {
    const resolved = await resolveProject(tree, options.project);
    assertEsbuildBuilder(resolved);
    const slugs = parseOrbSelection(options.orbs);
    const force = options.force ?? false;

    return chain([
      ...addDependencies(options.skipInstall ?? false),
      copyRuntime(resolved, force),
      wireBuilders(resolved),
      addPathAlias(resolved),
      addOrbs(resolved, slugs, force),
      printNextSteps(resolved, slugs),
    ]);
  };
}
