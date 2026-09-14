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
  // Each state changes the shape of the curtains, not just how bright they are: idle is
  // wide, low and lazy, thinking pulls them into narrow tight threads, speaking throws
  // them into big dramatic swings. Width stays modest throughout -- wide curtains have
  // long upward tails that overlap into a single pale wash.
  statePresets: {
    idle: {
      curl: 0.25,
      glow: 1.25,
      height: 0.38,
      speed: 0.25,
      width: 0.09,
    },
    thinking: {
      curl: 0.5,
      glow: 1.45,
      height: 0.5,
      speed: 0.85,
      width: 0.05,
    },
    speaking: {
      curl: 0.88,
      glow: 1.7,
      height: 0.58,
      speed: 1.1,
      width: 0.07,
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
