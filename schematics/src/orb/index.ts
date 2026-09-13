import {
  SchematicsException,
  type Rule,
  type SchematicContext,
  type Tree,
} from "@angular-devkit/schematics";

import { lockfileFor, packageVersion, recordFiles, writeLockfile } from "../shared/lockfile";
import { copyOrbs, orbClassName, orbTargetDir, parseOrbSelection } from "../shared/orbs";
import { availableOrbs } from "../shared/package-files";
import {
  assertPresetName,
  parsePresetLink,
  presetExportName,
  pruneUnknownKeys,
  renderPresetFile,
} from "../shared/preset";
import { joinPath, resolveProject, type ResolvedProject } from "../shared/workspace";
import type { OrbOptions } from "./schema";

const RUNTIME_MARKER = "components/orbs/shader-orb.ts";

/** Writes `<name>.preset.ts` next to the orb from a playground link. */
const writePreset = (
  tree: Tree,
  context: SchematicContext,
  resolved: ResolvedProject,
  slug: string,
  link: string,
  name: string,
  force: boolean,
): void => {
  const parsed = parsePresetLink(link);
  const { preset, dropped } = pruneUnknownKeys(slug, parsed);
  if (dropped.length > 0) {
    context.logger.warn(`${slug} does not declare ${dropped.join(", ")}; left out of the preset.`);
  }
  const hasContent =
    preset.state !== undefined ||
    preset.size !== undefined ||
    preset.params !== undefined ||
    preset.colors !== undefined ||
    preset.volumes !== undefined;
  if (!hasContent) {
    throw new SchematicsException(
      `Nothing to save from "${link}": no state, size, params, colors or volumes were found.`,
    );
  }
  const path = joinPath(orbTargetDir(resolved, slug), `${name}.preset.ts`);
  const content = renderPresetFile(slug, name, preset, link);
  if (tree.exists(path)) {
    if (!force) {
      throw new SchematicsException(`${path} already exists; pass --force to overwrite it.`);
    }
    tree.overwrite(path, content);
  } else {
    tree.create(path, content);
  }
  const lock = lockfileFor(tree, resolved);
  lock.version = packageVersion();
  recordFiles(tree, lock, [path]);
  writeLockfile(tree, resolved, lock);
  context.logger.info(
    [
      "",
      `Saved the "${name}" look to ${path}.`,
      `  import { ${presetExportName(slug, name)} } from "@/components/orbs/${slug}/${name}.preset";`,
      `  <${slug} [preset]="${presetExportName(slug, name)}" />`,
    ].join("\n"),
  );
};

export function orb(options: OrbOptions): Rule {
  return async (tree: Tree, context) => {
    const known = availableOrbs();
    if (options.list) {
      context.logger.info(["Available orbs:", ...known.map((slug) => `  ${slug}`)].join("\n"));
      return;
    }
    let slugs = parseOrbSelection(options.orbs);
    const link = options.preset?.trim();
    if (link) {
      const fromLink = parsePresetLink(link).slug;
      if (slugs.length === 0 && fromLink) {
        slugs = parseOrbSelection(fromLink);
      }
      if (slugs.length !== 1) {
        throw new SchematicsException(
          `--preset saves a look for exactly one orb; name it, e.g. "ng g shaderng:orb orb-07 --preset <link>".`,
        );
      }
    }
    if (slugs.length === 0) {
      throw new SchematicsException(
        `Name at least one orb, e.g. "ng g shaderng:orb orb-07". Available: ${known.join(", ")}, or "all".`,
      );
    }

    const resolved = await resolveProject(tree, options.project);
    if (!tree.exists(joinPath(resolved.sourceRoot, RUNTIME_MARKER))) {
      throw new SchematicsException(
        `The shaderng runtime is not installed in "${resolved.name}" ` +
          `(${joinPath(resolved.sourceRoot, RUNTIME_MARKER)} is missing). Run "ng add shaderng" first.`,
      );
    }

    const result = copyOrbs(tree, context, resolved, slugs, options.force ?? false);
    if (result.written.length > 0) {
      const [first] = slugs;
      context.logger.info(
        [
          "",
          `Copied ${slugs.join(", ")} into ${joinPath(resolved.sourceRoot, "components/orbs")}.`,
          `  import { ${orbClassName(first!)} } from "@/components/orbs/${first}";`,
          `  <${first} [size]="280" state="idle" />`,
        ].join("\n"),
      );
    }

    if (link) {
      const name = assertPresetName(options.name ?? "look");
      writePreset(tree, context, resolved, slugs[0]!, link, name, options.force ?? false);
    }
  };
}
