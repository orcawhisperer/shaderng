import type { OrbVariant } from "@/components/orbs/canvas";
import { paintParams, paintShader } from "@/components/fields/paint/gpu";

/*
 * Paint: Bob Ross-style watercolor auroras over a forested fjord.
 * Inspired by "Aurora Paint" by Noztol, ported and enhanced for shaderng (MIT).
 */

export const meta = {
  description:
    "watercolor auroras drifting over a forested fjord with paint splatters, pine silhouettes, and water reflections",
  files: ["paint.ts", "meta.ts", "gpu.ts"],
  slug: "paint",
  title: "Paint",
} as const;

export const paintField: OrbVariant = {
  colors: [
    { default: "#2dd4bf", key: "aurora1", label: "Aurora Teal" },
    { default: "#10b981", key: "aurora2", label: "Aurora Emerald" },
    { default: "#a78bfa", key: "aurora3", label: "Aurora Violet" },
    { default: "#040a14", key: "land", label: "Silhouettes" },
    { default: "#132247", key: "sky", label: "Night Sky" },
    { default: "#0c263d", key: "water", label: "Fjord Water" },
    { default: "#050a14", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    { default: 0.4, integrate: true, key: "speed", label: "Drift", max: 2, min: 0, step: 0.02 },
    { default: 60, key: "bleed", label: "Paper bleed", max: 120, min: 20, step: 1 },
    { default: 0.34, key: "water", label: "Water level", max: 0.55, min: 0.15, step: 0.01 },
    { default: 1.0, key: "glow", label: "Glow", max: 2.5, min: 0.2, step: 0.05 },
    { default: 0.6, key: "stars", label: "Paint splatters", max: 1.5, min: 0, step: 0.05 },
    { default: 1.0, key: "wind", label: "Wind sway", max: 2.5, min: 0, step: 0.05 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: paintShader,
  // The painting itself changes, not just its exposure: thinking floods the paper so
  // pigment bleeds into soft wet-on-wet washes, speaking dries it back to sharper strokes
  // with more spatter thrown across the sheet.
  statePresets: {
    idle: {
      bleed: 55,
      glow: 1,
      speed: 0.35,
      stars: 0.5,
      water: 0.32,
      wind: 0.8,
    },
    thinking: {
      bleed: 88,
      glow: 1.4,
      speed: 0.8,
      stars: 0.35,
      water: 0.44,
      wind: 1.4,
    },
    speaking: {
      bleed: 38,
      glow: 1.8,
      speed: 1.1,
      stars: 1.1,
      water: 0.26,
      wind: 1.8,
    },
  },
  themeColors: {
    dark: {
      aurora1: "#2dd4bf",
      aurora2: "#10b981",
      aurora3: "#a78bfa",
      base: "#050a14",
      land: "#040a14",
      sky: "#132247",
      water: "#0c263d",
    },
    light: {
      aurora1: "#0ea5e9",
      aurora2: "#10b981",
      aurora3: "#8b5cf6",
      base: "#faf7f2",
      land: "#0f172a",
      sky: "#1e293b",
      water: "#111c2e",
    },
  },
  themeParams: {
    dark: {
      fill: 0,
    },
    light: {
      fill: 0,
    },
  },
  uniforms: paintParams,
};
