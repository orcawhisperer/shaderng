import { SchematicsException, type SchematicContext, type Tree } from "@angular-devkit/schematics";
import { join } from "node:path";

import { lockfileFor, packageVersion, recordFiles, writeLockfile } from "./lockfile";
import { availableFields, copyDirectory, FIELDS_DIR, type CopyResult } from "./package-files";
import { joinPath, type ResolvedProject } from "./workspace";

export const FIELD_NOTICE =
  "Fields are original to shaderng and MIT-licensed, unlike the orb shaders.";

/**
 * Turns `"aurora, flow"` or `"all"` into canonical slugs, rejecting unknown ones with the
 * full list so a typo does not silently install nothing.
 */
export const parseFieldSelection = (selection: string | string[] | undefined): string[] => {
  const known = availableFields();
  const raw = Array.isArray(selection) ? selection : (selection ?? "").split(",");
  const requested = raw.map((entry) => entry.trim().toLowerCase()).filter((entry) => entry !== "");
  if (requested.length === 0) {
    return [];
  }
  if (requested.includes("all") || requested.includes("*")) {
    return known;
  }
  const unknown = requested.filter((slug) => !known.includes(slug));
  if (unknown.length > 0) {
    throw new SchematicsException(
      `Unknown field${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. ` +
        `Available: ${known.join(", ")}, or "all".`,
    );
  }
  return [...new Set(requested)];
};

export const fieldTargetDir = (resolved: ResolvedProject, slug: string): string =>
  joinPath(resolved.sourceRoot, "components", "fields", slug);

export const copyFields = (
  tree: Tree,
  context: SchematicContext,
  resolved: ResolvedProject,
  slugs: string[],
  overwrite: boolean,
): CopyResult => {
  const total: CopyResult = { written: [], skipped: [] };
  for (const slug of slugs) {
    const result = copyDirectory(tree, join(FIELDS_DIR, slug), fieldTargetDir(resolved, slug), {
      overwrite,
    });
    total.written.push(...result.written);
    total.skipped.push(...result.skipped);
    if (result.skipped.length > 0 && result.written.length === 0) {
      context.logger.info(`${slug} is already present; pass --force to overwrite it.`);
    }
  }
  if (total.written.length > 0) {
    const lock = lockfileFor(tree, resolved);
    lock.version = packageVersion();
    recordFiles(tree, lock, total.written);
    writeLockfile(tree, resolved, lock);
    context.logger.info(FIELD_NOTICE);
  }
  return total;
};

/** `FieldAurora` for `aurora`: the exported component class name. */
export const fieldClassName = (slug: string): string =>
  `Field${slug.slice(0, 1).toUpperCase()}${slug.slice(1)}`;
