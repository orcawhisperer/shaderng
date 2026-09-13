import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Tree } from "@angular-devkit/schematics";

import { PACKAGE_ROOT } from "./package-files";
import { joinPath, type ResolvedProject } from "./workspace";

export const LOCKFILE = "shaderng.json";

/**
 * What shaderng last wrote into the project, so `ng update` can tell an untouched file (safe
 * to replace) from one the project edited (kept, with a warning). Paths are workspace-relative.
 */
export interface Lockfile {
  /** Version of the shaderng package that last wrote files. */
  version: string;
  sourceRoot: string;
  /** Project path -> {@link fingerprint} of the content shaderng wrote there. */
  files: Record<string, string>;
}

export const sha256 = (content: string | Buffer): string =>
  createHash("sha256").update(content).digest("hex");

/**
 * Formatting-insensitive view of a source file. The Angular CLI runs Prettier over every file
 * a schematic writes when the workspace has Prettier, so the bytes on disk differ from the
 * bytes shaderng wrote in quotes, wrapping, semicolons and trailing commas. Those are all
 * dropped here; what remains still changes whenever the code itself does.
 */
export const normalizeFormatting = (content: string | Buffer): string =>
  content
    .toString("utf8")
    .replace(/'/g, '"')
    .replace(/[\s;,]/g, "");

/** sha256 of {@link normalizeFormatting}: the hash stored in the lockfile and known-hash table. */
export const fingerprint = (content: string | Buffer): string =>
  sha256(normalizeFormatting(content));

export const packageVersion = (): string =>
  (JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")) as { version: string })
    .version;

export const lockfilePath = (resolved: ResolvedProject): string =>
  joinPath(resolved.root, LOCKFILE);

export const readLockfile = (tree: Tree, resolved: ResolvedProject): Lockfile | undefined => {
  const buffer = tree.read(lockfilePath(resolved));
  if (!buffer) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(buffer.toString("utf8")) as Partial<Lockfile>;
    if (typeof parsed.version !== "string" || typeof parsed.files !== "object" || !parsed.files) {
      return undefined;
    }
    return {
      version: parsed.version,
      sourceRoot: parsed.sourceRoot ?? resolved.sourceRoot,
      files: parsed.files,
    };
  } catch {
    return undefined;
  }
};

export const writeLockfile = (tree: Tree, resolved: ResolvedProject, lock: Lockfile): void => {
  const sorted: Lockfile = {
    version: lock.version,
    sourceRoot: lock.sourceRoot,
    files: Object.fromEntries(Object.entries(lock.files).sort(([a], [b]) => a.localeCompare(b))),
  };
  const path = lockfilePath(resolved);
  const content = `${JSON.stringify(sorted, null, 2)}\n`;
  if (tree.exists(path)) {
    tree.overwrite(path, content);
  } else {
    tree.create(path, content);
  }
};

/** Records the current tree content of `paths` in `lock.files`. */
export const recordFiles = (tree: Tree, lock: Lockfile, paths: readonly string[]): void => {
  for (const path of paths) {
    const buffer = tree.read(path);
    if (buffer) {
      lock.files[path] = fingerprint(buffer);
    }
  }
};

/** A lockfile to start from: the existing one, or an empty one for this version. */
export const lockfileFor = (tree: Tree, resolved: ResolvedProject): Lockfile =>
  readLockfile(tree, resolved) ?? {
    version: packageVersion(),
    sourceRoot: resolved.sourceRoot,
    files: {},
  };

/**
 * Where a file bundled in the package lands in the project. Package paths are relative to
 * `files/`: `runtime/src/<rel>`, `runtime/tools/<rel>`, `orbs/<slug>/<rel>` or
 * `fields/<slug>/<rel>`.
 */
export const projectPathFor = (resolved: ResolvedProject, packagePath: string): string => {
  if (packagePath.startsWith("runtime/src/")) {
    return joinPath(resolved.sourceRoot, packagePath.slice("runtime/src/".length));
  }
  if (packagePath.startsWith("runtime/tools/")) {
    return joinPath(resolved.root, "tools", packagePath.slice("runtime/tools/".length));
  }
  if (packagePath.startsWith("orbs/") || packagePath.startsWith("fields/")) {
    return joinPath(resolved.sourceRoot, "components", packagePath);
  }
  throw new Error(`unexpected package path ${packagePath}`);
};

/** The esbuild plugin is rewritten per project; undo that before comparing with a known hash. */
export const normalizeForHash = (projectPath: string, content: string): string =>
  projectPath.endsWith("typegpu.esbuild.ts")
    ? content.replace(/const SOURCE_ROOT = "[^"]*";/, 'const SOURCE_ROOT = "src";')
    : content;
