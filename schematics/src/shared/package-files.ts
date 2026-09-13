import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { SchematicsException, type Tree } from "@angular-devkit/schematics";

/**
 * The built package root: `<package>/shared/package-files.js` sits one level below it.
 * `files/` and `versions.json` are generated there by `tools/build-schematics.mjs`.
 */
const PACKAGE_ROOT = join(__dirname, "..");
const FILES_ROOT = join(PACKAGE_ROOT, "files");

export const RUNTIME_SOURCE_DIR = join(FILES_ROOT, "runtime", "src");
export const RUNTIME_TOOLS_DIR = join(FILES_ROOT, "runtime", "tools");
export const ORBS_DIR = join(FILES_ROOT, "orbs");

export interface PackageVersions {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export const readVersions = (): PackageVersions => {
  const file = join(PACKAGE_ROOT, "versions.json");
  if (!existsSync(file)) {
    throw new SchematicsException(
      `shaderng is missing ${file}; the package was not built with tools/build-schematics.mjs.`,
    );
  }
  return JSON.parse(readFileSync(file, "utf8")) as PackageVersions;
};

/** Every file below `dir`, as paths relative to `dir` using forward slashes. */
export const listFiles = (dir: string): string[] => {
  if (!existsSync(dir)) {
    throw new SchematicsException(`shaderng package is incomplete: ${dir} does not exist.`);
  }
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        out.push(relative(dir, full).split(sep).join("/"));
      }
    }
  };
  walk(dir);
  return out;
};

export interface CopyResult {
  written: string[];
  skipped: string[];
}

/**
 * Copies every file below `fromDir` to `toDir` inside the tree. Existing files are left alone
 * unless `overwrite` is set, so re-running `ng add` never clobbers local edits silently.
 */
export const copyDirectory = (
  tree: Tree,
  fromDir: string,
  toDir: string,
  options: { overwrite?: boolean; transform?: (path: string, content: string) => string } = {},
): CopyResult => {
  const result: CopyResult = { written: [], skipped: [] };
  for (const rel of listFiles(fromDir)) {
    const target = `${toDir}/${rel}`.replace(/\/{2,}/g, "/");
    let content = readFileSync(join(fromDir, rel), "utf8");
    content = options.transform?.(target, content) ?? content;
    if (tree.exists(target)) {
      if (!options.overwrite) {
        result.skipped.push(target);
        continue;
      }
      tree.overwrite(target, content);
    } else {
      tree.create(target, content);
    }
    result.written.push(target);
  }
  return result;
};

/** Slugs of the orbs bundled with this package, e.g. `orb-01` … `orb-33`. */
export const availableOrbs = (): string[] => {
  if (!existsSync(ORBS_DIR)) {
    return [];
  }
  return readdirSync(ORBS_DIR)
    .filter((name) => /^orb-\d{2}$/.test(name) && statSync(join(ORBS_DIR, name)).isDirectory())
    .sort();
};
