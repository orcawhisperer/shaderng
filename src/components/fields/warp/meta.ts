import type { OrbVariant } from "@/components/orbs/canvas";
import { warpParams, warpShader } from "@/components/fields/warp/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "relativistic hyperspace starfield and warp tunnel with pointer flight steering",
  files: ["warp.ts", "meta.ts", "gpu.ts"],
  slug: "warp",
  title: "Warp",
} as const;

export const warpField: OrbVariant = {
  colors: [
    { default: "#67e8f9", key: "streak", label: "Star streaks" },
    { default: "#e879f9", key: "flare", label: "Core flare" },
    { default: "#818cf8", key: "ring", label: "Warp rings" },
    { default: "#030712", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    {
      default: 1.0,
      integrate: true,
      key: "speed",
      label: "Warp speed",
      max: 4,
      min: 0.1,
      step: 0.05,
    },
    { default: 1.0, key: "stars", label: "Star density", max: 2, min: 0.2, step: 0.05 },
    { default: 1.2, key: "streak", label: "Streak length", max: 3, min: 0.2, step: 0.05 },
    { default: 0.8, key: "rings", label: "Warp rings", max: 2, min: 0, step: 0.05 },
    { default: 0.8, key: "steer", label: "Pointer steering", max: 2, min: 0, step: 0.05 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: warpShader,
  statePresets: {
    idle: {
      rings: 0.5,
      speed: 0.7,
      streak: 0.9,
    },
    thinking: {
      rings: 1.2,
      speed: 1.4,
      steer: 1.2,
      streak: 1.8,
    },
    speaking: {
      rings: 1.6,
      speed: 2.2,
      streak: 2.5,
    },
  },
  themeColors: {
    dark: {
      base: "#030712",
      flare: "#e879f9",
      ring: "#818cf8",
      streak: "#67e8f9",
    },
    light: {
      base: "#f8fafc",
      flare: "#be123c",
      ring: "#4338ca",
      streak: "#0284c7",
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
  uniforms: warpParams,
};
