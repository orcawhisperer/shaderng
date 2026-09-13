import type { Tree } from "@angular-devkit/schematics";
import { applyEdits, modify, parse, type ParseError } from "jsonc-parser";

export const PATH_ALIAS = "@/*";

type Json = Record<string, unknown>;

const readJsonc = (tree: Tree, path: string): Json | undefined => {
  const buffer = tree.read(path);
  if (!buffer) {
    return undefined;
  }
  const errors: ParseError[] = [];
  const value = parse(buffer.toString("utf8"), errors, { allowTrailingComma: true }) as unknown;
  if (errors.length > 0 || typeof value !== "object" || value === null) {
    return undefined;
  }
  return value as Json;
};

const compilerPaths = (json: Json): Record<string, unknown> | undefined => {
  const options = json["compilerOptions"];
  if (typeof options !== "object" || options === null) {
    return undefined;
  }
  const paths = (options as Json)["paths"];
  return typeof paths === "object" && paths !== null
    ? (paths as Record<string, unknown>)
    : undefined;
};

export type AliasOutcome = "added" | "present" | "conflict" | "missing";

/**
 * Ensures `compilerOptions.paths["@/*"]` points at `<target>/*`, editing in place so comments
 * (Angular's default tsconfig has two) and formatting survive.
 */
export const ensurePathAlias = (tree: Tree, tsconfigPath: string, target: string): AliasOutcome => {
  const json = readJsonc(tree, tsconfigPath);
  if (!json) {
    return "missing";
  }
  const wanted = `./${target}/*`.replace(/\/{2,}/g, "/");
  const existing = compilerPaths(json)?.[PATH_ALIAS];
  if (Array.isArray(existing)) {
    const normalized = existing.map((entry) => String(entry).replace(/^\.\//, ""));
    return normalized.includes(wanted.replace(/^\.\//, "")) ? "present" : "conflict";
  }

  const text = tree.read(tsconfigPath)!.toString("utf8");
  const edits = modify(text, ["compilerOptions", "paths", PATH_ALIAS], [wanted], {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  });
  tree.overwrite(tsconfigPath, applyEdits(text, edits));
  return "added";
};

/** True when this tsconfig declares its own `paths`, which would shadow the root alias. */
export const declaresPaths = (tree: Tree, tsconfigPath: string): boolean => {
  const json = readJsonc(tree, tsconfigPath);
  return json !== undefined && compilerPaths(json) !== undefined;
};
