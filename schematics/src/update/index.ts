import { readFileSync } from "node:fs";
import { join } from "node:path";

import { chain, type Rule, type SchematicContext, type Tree } from "@angular-devkit/schematics";
import {
  addDependency,
  DependencyType,
  ExistingBehavior,
  InstallBehavior,
} from "@schematics/angular/utility";

import {
  lockfileFor,
  normalizeForHash,
  packageVersion,
  projectPathFor,
  sha256,
  writeLockfile,
  type Lockfile,
} from "../shared/lockfile";
import { LICENSE_NOTICE } from "../shared/orbs";
import {
  availableOrbs,
  FILES_ROOT,
  listFiles,
  ORBS_DIR,
  readVersions,
  RUNTIME_SOURCE_DIR,
  RUNTIME_TOOLS_DIR,
  transformForProject,
} from "../shared/package-files";
import { joinPath, resolveProject, type ResolvedProject } from "../shared/workspace";
import knownHashes from "./known-hashes.json";
import type { UpdateOptions } from "./schema";

const RUNTIME_MARKER = "components/orbs/shader-orb.ts";

/** sha256 of every `files/` path as published, per version, for installs made before the lockfile. */
export type KnownHashes = Record<string, Record<string, string>>;
export const KNOWN_HASHES: KnownHashes = knownHashes;

const isKnownVersion = (known: KnownHashes, packagePath: string, content: string): boolean => {
  const hash = sha256(content);
  return Object.values(known).some((files) => files[packagePath] === hash);
};

export interface UpdateReport {
  added: string[];
  updated: string[];
  unchanged: string[];
  /** Files with local edits that were left alone. */
  kept: string[];
}

/** Package files to consider: the runtime plus every orb the project already has. */
const packageFiles = (tree: Tree, resolved: ResolvedProject): string[] => {
  const files = [
    ...listFiles(RUNTIME_SOURCE_DIR).map((rel) => `runtime/src/${rel}`),
    ...listFiles(RUNTIME_TOOLS_DIR).map((rel) => `runtime/tools/${rel}`),
  ];
  for (const slug of availableOrbs()) {
    if (tree.exists(joinPath(resolved.sourceRoot, "components/orbs", slug, `${slug}.ts`))) {
      files.push(...listFiles(join(ORBS_DIR, slug)).map((rel) => `orbs/${slug}/${rel}`));
    }
  }
  return files;
};

/**
 * Brings every shaderng-owned file up to this package's version. A file is replaced when it is
 * missing, matches what shaderng last wrote (lockfile), or matches a published release
 * (known hashes); anything else carries local edits and is kept unless `force` is set.
 */
export const refreshFiles = (
  tree: Tree,
  resolved: ResolvedProject,
  lock: Lockfile,
  force: boolean,
  known: KnownHashes = KNOWN_HASHES,
): UpdateReport => {
  const report: UpdateReport = { added: [], updated: [], unchanged: [], kept: [] };
  const transform = transformForProject(resolved.sourceRoot);

  for (const packagePath of packageFiles(tree, resolved)) {
    const target = projectPathFor(resolved, packagePath);
    const next = transform(target, readFileSync(join(FILES_ROOT, packagePath), "utf8"));
    const nextHash = sha256(next);
    const current = tree.read(target);

    if (!current) {
      tree.create(target, next);
      report.added.push(target);
      lock.files[target] = nextHash;
      continue;
    }
    const currentText = current.toString("utf8");
    const currentHash = sha256(currentText);
    if (currentHash === nextHash) {
      report.unchanged.push(target);
      lock.files[target] = nextHash;
      continue;
    }
    const untouched =
      lock.files[target] === currentHash ||
      isKnownVersion(known, packagePath, normalizeForHash(target, currentText));
    if (untouched || force) {
      tree.overwrite(target, next);
      report.updated.push(target);
      lock.files[target] = nextHash;
    } else {
      report.kept.push(target);
    }
  }
  return report;
};

/** Adds packages a newer runtime needs; versions already in package.json are left as they are. */
const updateDependencies = (): Rule => {
  const versions = readVersions();
  const rule = (type: DependencyType) => (entry: [string, string]) =>
    addDependency(entry[0], entry[1], {
      type,
      existing: ExistingBehavior.Skip,
      install: InstallBehavior.Auto,
    });
  return chain([
    ...Object.entries(versions.dependencies).map(rule(DependencyType.Default)),
    ...Object.entries(versions.devDependencies).map(rule(DependencyType.Dev)),
  ]);
};

const report = (context: SchematicContext, resolved: ResolvedProject, result: UpdateReport) => {
  const version = packageVersion();
  context.logger.info(
    `shaderng ${version}: ${result.updated.length} updated, ${result.added.length} added, ` +
      `${result.unchanged.length} already current in "${resolved.name}".`,
  );
  for (const path of result.added) {
    context.logger.info(`  + ${path}`);
  }
  for (const path of result.updated) {
    context.logger.info(`  ~ ${path}`);
  }
  if (result.kept.length > 0) {
    context.logger.warn(
      [
        `${result.kept.length} file(s) have local edits and were left alone:`,
        ...result.kept.map((path) => `  ! ${path}`),
        `Compare them with the package copy under node_modules/shaderng/files/, or re-run with`,
        `"ng g shaderng:update --force" to take the new versions.`,
      ].join("\n"),
    );
  }
  if (result.updated.some((path) => path.includes("/components/orbs/orb-"))) {
    context.logger.warn(LICENSE_NOTICE);
  }
};

/**
 * `ng g shaderng:update`, also run by `ng update shaderng` through the migration collection.
 */
export function update(options: UpdateOptions = {}): Rule {
  return async (tree: Tree, context) => {
    const resolved = await resolveProject(tree, options.project);
    if (!tree.exists(joinPath(resolved.sourceRoot, RUNTIME_MARKER))) {
      context.logger.warn(
        `shaderng runtime not found in "${resolved.name}" ` +
          `(${joinPath(resolved.sourceRoot, RUNTIME_MARKER)} is missing); nothing to update. ` +
          `Run "ng add shaderng" to install it.`,
      );
      return;
    }
    const lock = lockfileFor(tree, resolved);
    const result = refreshFiles(tree, resolved, lock, options.force ?? false);
    lock.version = packageVersion();
    lock.sourceRoot = resolved.sourceRoot;
    writeLockfile(tree, resolved, lock);
    report(context, resolved, result);
    return updateDependencies();
  };
}
