import type { OrbVariant } from "@/components/orbs/canvas";
import { singularityParams, singularityShader } from "@/components/fields/singularity/gpu";

/*
 * Singularity: cinematic Einsteinian black hole with a volumetric blackbody accretion torus,
 * orbiting plasma hot-spots, a prismatic photon sphere, and a gravitationally lensed nebula.
 * Original to shaderng (MIT).
 */

export const meta = {
  description:
    "cinematic black hole with a blackbody accretion torus, orbiting plasma hot-spots, a prismatic photon ring, and a lensed nebula",
  files: ["singularity.ts", "meta.ts", "gpu.ts"],
  slug: "singularity",
  title: "Singularity",
} as const;

export const singularityField: OrbVariant = {
  colors: [
    { default: "#a5f3fc", key: "photon", label: "Photon Ring" },
    { default: "#fbbf24", key: "disk1", label: "Inner Plasma" },
    { default: "#e0421f", key: "disk2", label: "Outer Disk" },
    { default: "#000000", key: "hole", label: "Event Horizon" },
    { default: "#0a0d1f", key: "cosmos", label: "Nebula" },
    { default: "#dbeafe", key: "star", label: "Lensed Stars" },
    { default: "#01030a", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    { default: 0.95, key: "mass", label: "Mass (rs)", max: 1.8, min: 0.4, step: 0.05 },
    { default: 0.6, integrate: true, key: "spin", label: "Spin", max: 2.5, min: 0, step: 0.05 },
    { default: 1.1, key: "glow", label: "Emission", max: 3, min: 0.2, step: 0.05 },
    { default: 0.34, key: "tilt", label: "Disk tilt", max: 1, min: 0, step: 0.02 },
    { default: 0.5, key: "jets", label: "Polar jets", max: 2.5, min: 0, step: 0.05 },
    { default: 0.9, key: "stars", label: "Lensed stars", max: 2, min: 0, step: 0.05 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: singularityShader,
  statePresets: {
    // Near edge-on, slow lapping plasma, jets barely lit: a calm giant.
    idle: {
      glow: 0.95,
      jets: 0.25,
      mass: 0.95,
      spin: 0.4,
      tilt: 0.2,
    },
    // Tips over to reveal the whole whirlpool and spins up hard.
    thinking: {
      glow: 1.7,
      jets: 1.0,
      mass: 1.05,
      spin: 1.7,
      tilt: 0.62,
    },
    // Slams back to edge-on so the ring and jets fire straight at the camera.
    speaking: {
      glow: 2.6,
      jets: 2.3,
      mass: 1.2,
      spin: 2.1,
      tilt: 0.1,
    },
  },
  themeColors: {
    dark: {
      base: "#01030a",
      cosmos: "#0a0d1f",
      disk1: "#fbbf24",
      disk2: "#e0421f",
      hole: "#000000",
      photon: "#a5f3fc",
      star: "#dbeafe",
    },
    light: {
      base: "#f5f3ee",
      cosmos: "#8fa3bf",
      disk1: "#ea8c0b",
      disk2: "#c2410c",
      hole: "#0b1120",
      photon: "#0ea5e9",
      star: "#1e3a5f",
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
  uniforms: singularityParams,
};
