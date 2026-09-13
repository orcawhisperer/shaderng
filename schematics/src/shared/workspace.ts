import { SchematicsException, type Tree } from "@angular-devkit/schematics";
import {
  readWorkspace,
  type ProjectDefinition,
  type WorkspaceDefinition,
} from "@schematics/angular/utility";

export interface ResolvedProject {
  /** Mutate `project` through this and persist with `writeWorkspace(tree, workspace)`. */
  workspace: WorkspaceDefinition;
  name: string;
  project: ProjectDefinition;
  /** Workspace-relative folder the project lives in, `""` for the root project. */
  root: string;
  /** Workspace-relative folder the `@/*` alias points at, usually `src`. */
  sourceRoot: string;
}

const APPLICATION_BUILDERS = new Set([
  "@angular/build:application",
  "@angular-devkit/build-angular:application",
  "@angular-builders/custom-esbuild:application",
]);

export const CUSTOM_ESBUILD_BUILD = "@angular-builders/custom-esbuild:application";
export const CUSTOM_ESBUILD_SERVE = "@angular-builders/custom-esbuild:dev-server";
export const PLUGIN_FILE = "tools/typegpu.esbuild.ts";

const trimSlashes = (path: string): string => path.replace(/^\/+|\/+$/g, "");

export const joinPath = (...parts: string[]): string =>
  parts
    .map(trimSlashes)
    .filter((part) => part.length > 0)
    .join("/");

const pickProject = (workspace: WorkspaceDefinition, requested?: string): string => {
  if (requested) {
    if (!workspace.projects.has(requested)) {
      throw new SchematicsException(`Project "${requested}" does not exist in angular.json.`);
    }
    return requested;
  }
  const applications = [...workspace.projects.entries()].filter(
    ([, project]) => project.extensions["projectType"] === "application",
  );
  const [first] = applications;
  if (!first) {
    throw new SchematicsException(
      "No application project found in angular.json. Pass --project to pick one.",
    );
  }
  return first[0];
};

export const resolveProject = async (tree: Tree, requested?: string): Promise<ResolvedProject> => {
  const workspace = await readWorkspace(tree);
  const name = pickProject(workspace, requested);
  const project = workspace.projects.get(name)!;
  if (project.extensions["projectType"] !== "application") {
    throw new SchematicsException(
      `Project "${name}" is a library. shaderng copies source files into an application.`,
    );
  }
  const root = trimSlashes(project.root ?? "");
  const sourceRoot = trimSlashes(project.sourceRoot ?? joinPath(root, "src"));
  return { workspace, name, project, root, sourceRoot };
};

/** Throws unless the project builds with an esbuild application builder the plugin can hook. */
export const assertEsbuildBuilder = (resolved: ResolvedProject): void => {
  const builder = resolved.project.targets.get("build")?.builder;
  if (!builder || !APPLICATION_BUILDERS.has(builder)) {
    throw new SchematicsException(
      `Project "${resolved.name}" builds with "${builder ?? "no builder"}". shaderng needs the ` +
        `esbuild application builder (@angular/build:application); the TypeGPU plugin cannot run ` +
        `under the webpack browser builder.`,
    );
  }
};

/**
 * Switches build/serve to @angular-builders/custom-esbuild and registers the TypeGPU plugin.
 * Idempotent: running twice leaves one plugin entry.
 */
export const configureBuilders = (
  resolved: ResolvedProject,
): { pluginPath: string; changed: boolean } => {
  const { project, root } = resolved;
  const pluginPath = joinPath(root, PLUGIN_FILE);
  let changed = false;

  const build = project.targets.get("build");
  if (build) {
    if (build.builder !== CUSTOM_ESBUILD_BUILD) {
      build.builder = CUSTOM_ESBUILD_BUILD;
      changed = true;
    }
    build.options ??= {};
    const plugins = Array.isArray(build.options["plugins"]) ? build.options["plugins"] : [];
    if (!plugins.includes(pluginPath)) {
      build.options["plugins"] = [...plugins, pluginPath];
      changed = true;
    }
    const allowed = Array.isArray(build.options["allowedCommonJsDependencies"])
      ? build.options["allowedCommonJsDependencies"]
      : [];
    const missing = ["typegpu", "vgpu"].filter((name) => !allowed.includes(name));
    if (missing.length > 0) {
      build.options["allowedCommonJsDependencies"] = [...allowed, ...missing];
      changed = true;
    }
  }

  const serve = project.targets.get("serve");
  if (serve && serve.builder !== CUSTOM_ESBUILD_SERVE) {
    // Only the matching dev-server knows how to forward the plugins to the build.
    if (
      serve.builder === "@angular/build:dev-server" ||
      serve.builder === "@angular-devkit/build-angular:dev-server"
    ) {
      serve.builder = CUSTOM_ESBUILD_SERVE;
      changed = true;
    }
  }

  return { pluginPath, changed };
};
