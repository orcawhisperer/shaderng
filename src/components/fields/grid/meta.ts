import type { OrbVariant } from "@/components/orbs/canvas";
import { gridParams, gridShader } from "@/components/fields/grid/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "a lattice of dots that ripples away from the pointer and breathes with the voice",
  files: ["grid.ts", "meta.ts", "gpu.ts"],
  slug: "grid",
  title: "Grid",
} as const;

export const gridField: OrbVariant = {
  colors: [
    { default: "#94a3b8", key: "dot", label: "Dot" },
    { default: "#38bdf8", key: "accent", label: "Accent" },
    { default: "#0f172a", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    {
      default: 0.6,
      integrate: true,
      key: "speed",
      label: "Ripple speed",
      max: 3,
      min: 0,
      step: 0.02,
    },
    { default: 0.06, key: "spacing", label: "Spacing", max: 0.25, min: 0.02, step: 0.005 },
    { default: 0.28, key: "dot", label: "Dot size", max: 0.5, min: 0.05, step: 0.01 },
    { default: 28, key: "ripple", label: "Ripple frequency", max: 80, min: 4, step: 1 },
    { default: 0.35, key: "reach", label: "Pointer reach", max: 1.5, min: 0.05, step: 0.01 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: gridShader,
  // The lattice itself changes density: thinking packs it into a fine mesh with tight fast
  // ripples, speaking spaces it out into big bold dots with broad slow rings.
  statePresets: {
    idle: {
      dot: 0.24,
      reach: 0.3,
      ripple: 22,
      spacing: 0.075,
      speed: 0.35,
    },
    thinking: {
      dot: 0.2,
      reach: 0.55,
      ripple: 42,
      spacing: 0.05,
      speed: 1.15,
    },
    speaking: {
      dot: 0.36,
      reach: 0.8,
      ripple: 16,
      spacing: 0.09,
      speed: 1.45,
    },
  },
  themeColors: {
    dark: {
      accent: "#38bdf8",
      base: "#0f172a",
      dot: "#94a3b8",
    },
    light: {
      accent: "#0284c7",
      base: "#f8fafc",
      dot: "#64748b",
    },
  },
  themeParams: {
    dark: {
      fill: 0,
    },
    light: {
      fill: 1.0,
    },
  },
  uniforms: gridParams,
};
