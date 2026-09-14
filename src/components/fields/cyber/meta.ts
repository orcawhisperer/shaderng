import type { OrbVariant } from "@/components/orbs/canvas";
import { cyberParams, cyberShader } from "@/components/fields/cyber/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description:
    "infinite 3D synthwave grid receding to a glowing neon horizon with interactive camera tilt",
  files: ["cyber.ts", "meta.ts", "gpu.ts"],
  slug: "cyber",
  title: "Cyber",
} as const;

export const cyberField: OrbVariant = {
  colors: [
    { default: "#06b6d4", key: "grid", label: "Grid wire" },
    { default: "#ec4899", key: "glow", label: "Horizon glow" },
    { default: "#3b82f6", key: "sky", label: "Sky gradient" },
    { default: "#030712", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    {
      default: 0.6,
      integrate: true,
      key: "speed",
      label: "Grid speed",
      max: 3,
      min: 0,
      step: 0.02,
    },
    { default: 1.0, key: "grid", label: "Grid scale", max: 3, min: 0.2, step: 0.05 },
    { default: 1.2, key: "glow", label: "Neon glow", max: 3, min: 0.1, step: 0.05 },
    { default: 0.5, key: "horizon", label: "Horizon height", max: 0.8, min: 0.2, step: 0.02 },
    { default: 0.8, key: "tilt", label: "Pointer tilt", max: 2, min: 0, step: 0.05 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: cyberShader,
  statePresets: {
    idle: {
      glow: 1.0,
      speed: 0.4,
    },
    thinking: {
      glow: 1.6,
      speed: 1.0,
      tilt: 1.2,
    },
    speaking: {
      glow: 2.0,
      grid: 1.2,
      speed: 1.4,
    },
  },
  themeColors: {
    dark: {
      base: "#030712",
      glow: "#ec4899",
      grid: "#06b6d4",
      sky: "#3b82f6",
    },
    light: {
      base: "#f8fafc",
      glow: "#be123c",
      grid: "#0284c7",
      sky: "#c7d2fe",
    },
  },
  themeParams: {
    dark: {
      fill: 1.0,
    },
    light: {
      fill: 1.0,
    },
  },
  uniforms: cyberParams,
};
