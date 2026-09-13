import { SchematicsException, type Rule, type Tree } from "@angular-devkit/schematics";

import { copyOrbs, orbClassName, parseOrbSelection } from "../shared/orbs";
import { availableOrbs } from "../shared/package-files";
import { joinPath, resolveProject } from "../shared/workspace";
import type { OrbOptions } from "./schema";

const RUNTIME_MARKER = "components/orbs/shader-orb.ts";

export function orb(options: OrbOptions): Rule {
  return async (tree: Tree, context) => {
    const known = availableOrbs();
    if (options.list) {
      context.logger.info(["Available orbs:", ...known.map((slug) => `  ${slug}`)].join("\n"));
      return;
    }
    const slugs = parseOrbSelection(options.orbs);
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
  };
}
