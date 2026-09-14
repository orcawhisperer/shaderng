import type { OrbVariant } from "@/components/orbs/canvas";
import { causticsParams, causticsShader } from "@/components/fields/caustics/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "light through slow water, folding onto itself; the pointer stirs the surface",
  files: ["caustics.ts", "meta.ts", "gpu.ts"],
  slug: "caustics",
  title: "Caustics",
} as const;

export const causticsField: OrbVariant = {
  colors: [
    { default: "#e0f2fe", key: "light", label: "Light" },
    { default: "#0369a1", key: "water", label: "Water" },
    { default: "#082f49", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    { default: 0.5, integrate: true, key: "speed", label: "Speed", max: 3, min: 0, step: 0.02 },
    { default: 2.5, key: "scale", label: "Scale", max: 8, min: 0.5, step: 0.1 },
    { default: 2, key: "focus", label: "Focus", max: 6, min: 0.1, step: 0.1 },
    { default: 0.8, key: "stir", label: "Stir", max: 3, min: 0, step: 0.05 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: causticsShader,
  // Thinking zooms into a fine, agitated, tightly focused mesh; speaking pulls back out to
  // broad soft pools of blooming light.
  statePresets: {
    idle: {
      focus: 2.2,
      scale: 2,
      speed: 0.3,
      stir: 0.5,
    },
    thinking: {
      focus: 3.2,
      scale: 4.2,
      speed: 0.95,
      stir: 1.6,
    },
    speaking: {
      focus: 1.3,
      scale: 1.6,
      speed: 1.2,
      stir: 0.9,
    },
  },
  themeColors: {
    dark: {
      base: "#082f49",
      light: "#e0f2fe",
      water: "#0369a1",
    },
    light: {
      base: "#f0f9ff",
      light: "#0369a1",
      water: "#0284c7",
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
  uniforms: causticsParams,
};
