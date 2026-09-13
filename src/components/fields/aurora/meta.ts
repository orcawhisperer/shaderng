import type { OrbVariant } from "@/components/orbs/canvas";
import { auroraParams, auroraShader } from "@/components/fields/aurora/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "three curtains of light drifting across the sky, leaning toward the pointer",
  files: ["aurora.ts", "meta.ts", "gpu.ts"],
  slug: "aurora",
  title: "Aurora",
} as const;

export const auroraField: OrbVariant = {
  colors: [
    { default: "#2dd4bf", key: "low", label: "Low curtain" },
    { default: "#a78bfa", key: "mid", label: "Mid curtain" },
    { default: "#f472b6", key: "high", label: "High curtain" },
    { default: "#0b1020", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    { default: 0.4, integrate: true, key: "speed", label: "Drift", max: 3, min: 0, step: 0.02 },
    { default: 0.35, key: "curl", label: "Curl", max: 1, min: 0, step: 0.01 },
    { default: 0.12, key: "width", label: "Curtain width", max: 0.5, min: 0.02, step: 0.005 },
    { default: 0.5, key: "height", label: "Height", max: 1, min: 0, step: 0.01 },
    { default: 1.2, key: "glow", label: "Glow", max: 3, min: 0, step: 0.02 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: auroraShader,
  statePresets: {
    idle: {
      speed: 0.3,
      glow: 1,
    },
    thinking: {
      speed: 0.8,
      curl: 0.55,
    },
    speaking: {
      speed: 1,
      glow: 1.6,
    },
  },
  themeColors: {
    dark: {
      base: "#0b1020",
      high: "#f472b6",
      low: "#2dd4bf",
      mid: "#a78bfa",
    },
    light: {
      base: "#f8fafc",
      high: "#db2777",
      low: "#0284c7",
      mid: "#7c3aed",
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
  uniforms: auroraParams,
};
