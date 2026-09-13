import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SchematicsException } from "@angular-devkit/schematics";

import { ORBS_DIR } from "./package-files";

const STATES = ["idle", "thinking", "speaking"] as const;
export type PresetState = (typeof STATES)[number];

/** Mirrors `OrbPreset` in the runtime; kept structural so the package has no runtime import. */
export interface ParsedPreset {
  slug?: string;
  state?: PresetState;
  size?: number;
  params?: Record<string, number>;
  colors?: Record<string, string>;
  volumes?: { input: number; output: number };
}

const parseNum = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pairs = (raw: string): [string, string][] =>
  raw
    .split(",")
    .map((pair) => pair.split(":", 2) as [string, string])
    .filter(([key, value]) => /^[\w-]+$/.test(key) && value !== undefined && value !== "");

/**
 * Reads a playground link (`https://shaderng.vercel.app/playground?orb=orb-07&state=…`), a bare
 * query string, or just `orb=…&p=…`. Same grammar as the site's `decodeShare`: `p` and `c` are
 * `key:value` lists, `c` values are hex without `#`, `v` is `input,output`.
 */
export const parsePresetLink = (link: string): ParsedPreset => {
  const trimmed = link.trim();
  let query: string;
  if (/^https?:\/\//i.test(trimmed)) {
    query = new URL(trimmed).search;
  } else {
    query = trimmed.includes("?") ? trimmed.slice(trimmed.indexOf("?")) : trimmed;
  }
  const search = new URLSearchParams(query.replace(/^\?/, ""));
  const preset: ParsedPreset = {};

  const orb = search.get("orb");
  if (orb && /^orb-\d{2}$/.test(orb)) {
    preset.slug = orb;
  }
  const state = search.get("state");
  const knownState = STATES.find((value) => value === state);
  if (knownState) {
    preset.state = knownState;
  }
  const size = search.get("size");
  const parsedSize = size ? parseNum(size) : undefined;
  if (parsedSize !== undefined && parsedSize >= 40 && parsedSize <= 2000) {
    preset.size = Math.round(parsedSize);
  }
  const p = search.get("p");
  if (p) {
    const params: Record<string, number> = {};
    for (const [key, value] of pairs(p)) {
      const parsed = parseNum(value);
      if (parsed !== undefined) {
        params[key] = parsed;
      }
    }
    if (Object.keys(params).length) {
      preset.params = params;
    }
  }
  const c = search.get("c");
  if (c) {
    const colors: Record<string, string> = {};
    for (const [key, value] of pairs(c)) {
      if (/^[0-9a-f]{6}$/i.test(value)) {
        colors[key] = `#${value.toLowerCase()}`;
      }
    }
    if (Object.keys(colors).length) {
      preset.colors = colors;
    }
  }
  const v = search.get("v");
  if (v) {
    const [input, output] = v.split(",").map(parseNum);
    if (input !== undefined && output !== undefined) {
      const clamp = (n: number) => Math.min(1, Math.max(0, n));
      preset.volumes = { input: clamp(input), output: clamp(output) };
    }
  }
  return preset;
};

/** The text of the first bracketed array after `label:` in `source`, or `""`. */
const arrayAfter = (source: string, label: string): string => {
  const opener = `${label}: [`;
  const start = source.indexOf(opener);
  if (start < 0) {
    return "";
  }
  let depth = 0;
  for (let i = start + opener.length; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "[") {
      depth += 1;
    } else if (ch === "]") {
      if (depth === 0) {
        return source.slice(start, i);
      }
      depth -= 1;
    }
  }
  return "";
};

const keysIn = (section: string): string[] =>
  [...section.matchAll(/\bkey:\s*"([\w-]+)"/g)].map((match) => match[1]!);

/** Param and colour keys an orb declares, read from its bundled `meta.ts`. */
export const orbKeys = (slug: string): { params: string[]; colors: string[] } => {
  const file = join(ORBS_DIR, slug, "meta.ts");
  if (!existsSync(file)) {
    return { params: [], colors: [] };
  }
  const source = readFileSync(file, "utf8");
  return {
    params: keysIn(arrayAfter(source, "params")),
    colors: keysIn(arrayAfter(source, "colors")),
  };
};

/**
 * Drops params and colours the orb does not declare, returning their names so the caller can
 * warn: a link made for one orb may carry keys another orb lacks.
 */
export const pruneUnknownKeys = (
  slug: string,
  preset: ParsedPreset,
): { preset: ParsedPreset; dropped: string[] } => {
  const known = orbKeys(slug);
  const dropped: string[] = [];
  const params = Object.fromEntries(
    Object.entries(preset.params ?? {}).filter(([key]) => {
      const keep = known.params.includes(key);
      if (!keep) {
        dropped.push(`params.${key}`);
      }
      return keep;
    }),
  );
  const colors = Object.fromEntries(
    Object.entries(preset.colors ?? {}).filter(([key]) => {
      const keep = known.colors.includes(key);
      if (!keep) {
        dropped.push(`colors.${key}`);
      }
      return keep;
    }),
  );
  return {
    dropped,
    preset: {
      ...preset,
      params: Object.keys(params).length ? params : undefined,
      colors: Object.keys(colors).length ? colors : undefined,
    },
  };
};

export const assertPresetName = (name: string): string => {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new SchematicsException(
      `Preset name "${name}" must be lower-case letters, digits and dashes, starting with a letter.`,
    );
  }
  return name;
};

/** `orb07` + PascalCase(name): the exported constant. */
export const presetExportName = (slug: string, name: string): string =>
  `orb${slug.slice(-2)}${name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));

const formatRecord = (record: Record<string, number | string>, indent: string): string =>
  Object.entries(record)
    .map(([key, value]) => {
      const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return `${indent}${safeKey}: ${typeof value === "number" ? formatNumber(value) : JSON.stringify(value)},`;
    })
    .join("\n");

/** Source of `<name>.preset.ts` for an orb. */
export const renderPresetFile = (
  slug: string,
  name: string,
  preset: ParsedPreset,
  link: string,
): string => {
  const lines: string[] = [];
  if (preset.state) {
    lines.push(`  state: "${preset.state}",`);
  }
  if (preset.size !== undefined) {
    lines.push(`  size: ${preset.size},`);
  }
  if (preset.params && Object.keys(preset.params).length) {
    lines.push(`  params: {\n${formatRecord(preset.params, "    ")}\n  },`);
  }
  if (preset.colors && Object.keys(preset.colors).length) {
    lines.push(`  colors: {\n${formatRecord(preset.colors, "    ")}\n  },`);
  }
  if (preset.volumes) {
    lines.push(
      `  volumes: { input: ${formatNumber(preset.volumes.input)}, output: ${formatNumber(preset.volumes.output)} },`,
    );
  }
  const exportName = presetExportName(slug, name);
  const source = /^https?:\/\//i.test(link.trim())
    ? link.trim()
    : `?${link.trim().replace(/^\?/, "")}`;
  return `import type { OrbPreset } from "@/components/orbs/renderer";

/**
 * "${name}" look for <${slug}>, saved from the shaderng playground:
 * ${source}
 *
 * Usage: <${slug} [preset]="${exportName}" />
 */
export const ${exportName}: OrbPreset = {
${lines.join("\n")}
};
`;
};
