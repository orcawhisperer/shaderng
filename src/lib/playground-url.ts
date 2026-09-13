import { ORB_STATES, type OrbState, type OrbVariant } from "@/components/orbs/renderer";
import { isOrbSlug, type OrbSlug } from "@/lib/orb-catalog";
import type { SnippetDraft } from "@/lib/snippet";

/**
 * Everything the playground needs to rebuild a look. Only values that differ from the
 * orb's preset for that state are written, so a shared URL stays short and stays valid
 * when a preset changes upstream.
 */
export interface PlaygroundShare {
  orb?: OrbSlug;
  state?: OrbState;
  size?: number;
  params?: Record<string, number>;
  colors?: Record<string, string>;
  /** Manual `[volumes]`; absent means auto-drive. */
  volumes?: { input: number; output: number };
}

/** Query keys. `orb` and `state` are the ones the first release already used. */
export const SHARE_KEYS = ["orb", "state", "size", "p", "c", "v"] as const;
export type ShareKey = (typeof SHARE_KEYS)[number];

export type ShareQuery = Record<ShareKey, string | null>;

const num = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));

const parseNum = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const encodePairs = (pairs: Record<string, string>): string | null => {
  const entries = Object.entries(pairs);
  return entries.length ? entries.map(([k, v]) => `${k}:${v}`).join(",") : null;
};

const decodePairs = (raw: string): [string, string][] =>
  raw
    .split(",")
    .map((pair) => pair.split(":", 2) as [string, string])
    .filter(([key, value]) => key && value !== undefined && /^[\w-]+$/.test(key));

/**
 * The query for one state's draft of `variant`. Params and colors equal to the preset are
 * omitted; `v` is only present for manual volumes.
 */
export const encodeShare = (
  variant: Pick<OrbVariant, "params" | "colors" | "statePresets" | "stateColors">,
  input: { slug: string; state: OrbState; size: number; draft: SnippetDraft },
): ShareQuery => {
  const { draft, size, slug, state } = input;
  const params: Record<string, string> = {};
  for (const p of variant.params) {
    const value = draft.params[p.key];
    const preset = variant.statePresets?.[state]?.[p.key] ?? p.default;
    if (value !== undefined && value !== preset) {
      params[p.key] = num(value);
    }
  }
  const colors: Record<string, string> = {};
  for (const c of variant.colors) {
    const value = draft.colors[c.key];
    const preset = variant.stateColors?.[state]?.[c.key] ?? c.default;
    if (value && value.toLowerCase() !== preset.toLowerCase()) {
      colors[c.key] = value.replace(/^#/, "");
    }
  }
  return {
    orb: slug,
    state,
    size: String(size),
    p: encodePairs(params),
    c: encodePairs(colors),
    v: draft.autoDrive ? null : `${num(draft.input)},${num(draft.output)}`,
  };
};

/** Parses a query back into a share. Unknown or malformed values are dropped, never thrown. */
export const decodeShare = (get: (key: ShareKey) => string | null): PlaygroundShare => {
  const share: PlaygroundShare = {};

  const orb = get("orb");
  if (isOrbSlug(orb)) {
    share.orb = orb;
  }

  const state = get("state");
  const knownState = ORB_STATES.find((value) => value === state);
  if (knownState) {
    share.state = knownState;
  }

  const size = get("size");
  const parsedSize = size ? parseNum(size) : undefined;
  if (parsedSize !== undefined && parsedSize >= 40 && parsedSize <= 2000) {
    share.size = Math.round(parsedSize);
  }

  const p = get("p");
  if (p) {
    const params: Record<string, number> = {};
    for (const [key, value] of decodePairs(p)) {
      const parsed = parseNum(value);
      if (parsed !== undefined) {
        params[key] = parsed;
      }
    }
    if (Object.keys(params).length) {
      share.params = params;
    }
  }

  const c = get("c");
  if (c) {
    const colors: Record<string, string> = {};
    for (const [key, value] of decodePairs(c)) {
      if (/^[0-9a-f]{6}$/i.test(value)) {
        colors[key] = `#${value.toLowerCase()}`;
      }
    }
    if (Object.keys(colors).length) {
      share.colors = colors;
    }
  }

  const v = get("v");
  if (v) {
    const [input, output] = v.split(",").map(parseNum);
    if (input !== undefined && output !== undefined) {
      share.volumes = {
        input: Math.min(1, Math.max(0, input)),
        output: Math.min(1, Math.max(0, output)),
      };
    }
  }

  return share;
};

/**
 * Lays a share over a draft: params and colors the orb does not have are ignored, so a link
 * made for one orb applied to another only carries what both understand.
 */
export const applyShare = (
  variant: Pick<OrbVariant, "params" | "colors">,
  draft: SnippetDraft,
  share: PlaygroundShare,
): SnippetDraft => {
  const params = { ...draft.params };
  for (const p of variant.params) {
    const value = share.params?.[p.key];
    if (value !== undefined) {
      params[p.key] = Math.min(p.max, Math.max(p.min, value));
    }
  }
  const colors = { ...draft.colors };
  for (const c of variant.colors) {
    const value = share.colors?.[c.key];
    if (value !== undefined) {
      colors[c.key] = value;
    }
  }
  return {
    ...draft,
    params,
    colors,
    ...(share.volumes
      ? { autoDrive: false, input: share.volumes.input, output: share.volumes.output }
      : {}),
  };
};
