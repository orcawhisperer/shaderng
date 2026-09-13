import { SchematicsException, type SchematicContext, type Tree } from "@angular-devkit/schematics";
import { join } from "node:path";

import { availableOrbs, copyDirectory, ORBS_DIR, type CopyResult } from "./package-files";
import { joinPath, type ResolvedProject } from "./workspace";

export const LICENSE_NOTICE =
  "Each gpu.ts is XorDev's shader, ported with permission: non-commercial use only, with " +
  "attribution. Keep the header notice in the file. The runtime and wrappers are MIT.";

/**
 * Turns `"orb-01, orb-7"`, `["orb-01"]` or `"all"` into canonical slugs, rejecting unknown ones
 * with the full list so a typo does not silently install nothing.
 */
export const parseOrbSelection = (selection: string | string[] | undefined): string[] => {
  const known = availableOrbs();
  const raw = Array.isArray(selection) ? selection : (selection ?? "").split(",");
  const requested = raw.map((entry) => entry.trim().toLowerCase()).filter((entry) => entry !== "");
  if (requested.length === 0) {
    return [];
  }
  if (requested.includes("all") || requested.includes("*")) {
    return known;
  }
  const slugs = requested.map((entry) => {
    const digits = /^(?:orb-?)?(\d{1,2})$/.exec(entry)?.[1];
    return digits ? `orb-${digits.padStart(2, "0")}` : entry;
  });
  const unknown = slugs.filter((slug) => !known.includes(slug));
  if (unknown.length > 0) {
    throw new SchematicsException(
      `Unknown orb${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. ` +
        `Available: ${known.join(", ")}, or "all".`,
    );
  }
  return [...new Set(slugs)];
};

export const orbTargetDir = (resolved: ResolvedProject, slug: string): string =>
  joinPath(resolved.sourceRoot, "components", "orbs", slug);

export const copyOrbs = (
  tree: Tree,
  context: SchematicContext,
  resolved: ResolvedProject,
  slugs: string[],
  overwrite: boolean,
): CopyResult => {
  const total: CopyResult = { written: [], skipped: [] };
  for (const slug of slugs) {
    const result = copyDirectory(tree, join(ORBS_DIR, slug), orbTargetDir(resolved, slug), {
      overwrite,
    });
    total.written.push(...result.written);
    total.skipped.push(...result.skipped);
    if (result.skipped.length > 0 && result.written.length === 0) {
      context.logger.info(`${slug} is already present; pass --force to overwrite it.`);
    }
  }
  if (total.written.length > 0) {
    context.logger.warn(LICENSE_NOTICE);
  }
  return total;
};

/** `Orb07` for `orb-07`: the exported component class name. */
export const orbClassName = (slug: string): string => `Orb${slug.slice(-2)}`;
