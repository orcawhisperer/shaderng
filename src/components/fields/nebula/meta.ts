import type { OrbVariant } from "@/components/orbs/canvas";
import { nebulaParams, nebulaShader } from "@/components/fields/nebula/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "volumetric cosmic dust and glowing stellar nurseries with a parallax starfield",
  files: ["nebula.ts", "meta.ts", "gpu.ts"],
  slug: "nebula",
  title: "Nebula",
} as const;

export const nebulaField: OrbVariant = {
  colors: [
    { default: "#fbbf24", key: "core", label: "Stellar core" },
    { default: "#c084fc", key: "dust", label: "Cosmic dust" },
    { default: "#38bdf8", key: "gas", label: "Ionized gas" },
    { default: "#050510", key: "base", label: "Deep space base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    {
      default: 0.4,
      integrate: true,
      key: "speed",
      label: "Cosmic drift",
      max: 3,
      min: 0,
      step: 0.02,
    },
    { default: 1.5, key: "scale", label: "Scale", max: 4, min: 0.5, step: 0.05 },
    { default: 1.4, key: "density", label: "Cloud density", max: 3, min: 0.2, step: 0.05 },
    { default: 1.2, key: "glow", label: "Core radiance", max: 3, min: 0.1, step: 0.05 },
    { default: 0.6, key: "drift", label: "Parallax drift", max: 2, min: 0, step: 0.05 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: nebulaShader,
  // The camera effectively moves between states: thinking pulls back into deep fine
  // structure with strong parallax, speaking pushes right up into the bright core.
  statePresets: {
    idle: {
      density: 1.1,
      drift: 0.4,
      glow: 0.9,
      scale: 1.3,
      speed: 0.28,
    },
    thinking: {
      density: 1.8,
      drift: 1.1,
      glow: 1.5,
      scale: 2.4,
      speed: 0.85,
    },
    speaking: {
      density: 1.9,
      drift: 0.7,
      glow: 1.7,
      scale: 1.1,
      speed: 1.2,
    },
  },
  themeColors: {
    dark: {
      base: "#050510",
      core: "#fbbf24",
      dust: "#c084fc",
      gas: "#38bdf8",
    },
    light: {
      base: "#f8fafc",
      core: "#d97706",
      dust: "#4f46e5",
      gas: "#0284c7",
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
  uniforms: nebulaParams,
};
