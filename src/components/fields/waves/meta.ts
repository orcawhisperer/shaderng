import type { OrbVariant } from "@/components/orbs/canvas";
import { wavesParams, wavesShader } from "@/components/fields/waves/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "stacked lines that swell with the voice, a waveform without the oscilloscope",
  files: ["waves.ts", "meta.ts", "gpu.ts"],
  slug: "waves",
  title: "Waves",
} as const;

export const wavesField: OrbVariant = {
  colors: [
    { default: "#22d3ee", key: "from", label: "From" },
    { default: "#f472b6", key: "to", label: "To" },
    { default: "#0b1020", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    { default: 0.8, integrate: true, key: "speed", label: "Speed", max: 4, min: 0, step: 0.02 },
    { default: 7, key: "lines", label: "Lines", max: 12, min: 1, step: 1 },
    { default: 0.5, key: "amplitude", label: "Amplitude", max: 2, min: 0, step: 0.02 },
    { default: 4, key: "frequency", label: "Frequency", max: 12, min: 0.5, step: 0.1 },
    { default: 0.7, key: "spread", label: "Spread", max: 1.2, min: 0.1, step: 0.01 },
    { default: 0.006, key: "thickness", label: "Thickness", max: 0.04, min: 0.001, step: 0.001 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: wavesShader,
  statePresets: {
    idle: {
      speed: 0.5,
      amplitude: 0.35,
    },
    thinking: {
      speed: 1.2,
      frequency: 5,
    },
    speaking: {
      speed: 1.6,
      amplitude: 0.8,
    },
  },
  themeColors: {
    dark: {
      base: "#0b1020",
      from: "#22d3ee",
      to: "#f472b6",
    },
    light: {
      base: "#f8fafc",
      from: "#0284c7",
      to: "#be123c",
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
  uniforms: wavesParams,
};
