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
  statePresets: {
    idle: {
      speed: 0.4,
    },
    thinking: {
      speed: 1.1,
      reach: 0.5,
    },
    speaking: {
      speed: 1.4,
      dot: 0.34,
    },
  },
  uniforms: gridParams,
};
