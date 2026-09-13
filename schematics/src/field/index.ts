import { SchematicsException, type Rule, type Tree } from "@angular-devkit/schematics";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { copyFields, fieldClassName, parseFieldSelection } from "../shared/fields";
import { lockfileFor, packageVersion, recordFiles, writeLockfile } from "../shared/lockfile";
import { availableFields, RUNTIME_SOURCE_DIR } from "../shared/package-files";
import { joinPath, resolveProject, type ResolvedProject } from "../shared/workspace";
import type { FieldOptions } from "./schema";

const RUNTIME_MARKER = "components/orbs/shader-orb.ts";
const FIELD_BASE = "components/fields/field-base.ts";

/** `field-base.ts` ships with the runtime; copy it if this project was installed before fields. */
const ensureFieldBase = (tree: Tree, resolved: ResolvedProject): string | undefined => {
  const target = joinPath(resolved.sourceRoot, FIELD_BASE);
  if (tree.exists(target)) {
    return undefined;
  }
  tree.create(target, readFileSync(join(RUNTIME_SOURCE_DIR, FIELD_BASE), "utf8"));
  const lock = lockfileFor(tree, resolved);
  lock.version = packageVersion();
  recordFiles(tree, lock, [target]);
  writeLockfile(tree, resolved, lock);
  return target;
};

export function field(options: FieldOptions): Rule {
  return async (tree: Tree, context) => {
    const known = availableFields();
    if (options.list) {
      context.logger.info(["Available fields:", ...known.map((slug) => `  ${slug}`)].join("\n"));
      return;
    }
    const slugs = parseFieldSelection(options.fields);
    if (slugs.length === 0) {
      throw new SchematicsException(
        `Name at least one field, e.g. "ng g shaderng:field aurora". Available: ${known.join(", ")}, or "all".`,
      );
    }

    const resolved = await resolveProject(tree, options.project);
    if (!tree.exists(joinPath(resolved.sourceRoot, RUNTIME_MARKER))) {
      throw new SchematicsException(
        `The shaderng runtime is not installed in "${resolved.name}" ` +
          `(${joinPath(resolved.sourceRoot, RUNTIME_MARKER)} is missing). Run "ng add shaderng" first.`,
      );
    }

    const base = ensureFieldBase(tree, resolved);
    if (base) {
      context.logger.info(`Copied ${base} (needed by every field).`);
    }
    const result = copyFields(tree, context, resolved, slugs, options.force ?? false);
    if (result.written.length > 0) {
      const [first] = slugs;
      context.logger.info(
        [
          "",
          `Copied ${slugs.join(", ")} into ${joinPath(resolved.sourceRoot, "components/fields")}.`,
          `  import { ${fieldClassName(first!)} } from "@/components/fields/${first}";`,
          `  <field-${first} state="thinking" />`,
        ].join("\n"),
      );
    }
  };
}
