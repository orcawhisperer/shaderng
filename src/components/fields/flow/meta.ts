import type { OrbVariant } from "@/components/orbs/canvas";
import { flowParams, flowShader } from "@/components/fields/flow/gpu";

/* Original to shaderng. MIT, like the runtime: usable commercially, unlike the orb shaders. */

export const meta = {
  description: "domain-warped smoke that never repeats, pulled toward the pointer",
  files: ["flow.ts", "meta.ts", "gpu.ts"],
  slug: "flow",
  title: "Flow",
} as const;

export const flowField: OrbVariant = {
  colors: [
    { default: "#1e1b4b", key: "deep", label: "Deep" },
    { default: "#7c3aed", key: "mid", label: "Mid" },
    { default: "#f0abfc", key: "light", label: "Light" },
    { default: "#0b0a14", key: "base", label: "Base" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    { default: 0.5, integrate: true, key: "speed", label: "Speed", max: 3, min: 0, step: 0.02 },
    { default: 1.6, key: "scale", label: "Scale", max: 5, min: 0.3, step: 0.05 },
    { default: 2.5, key: "warp", label: "Warp", max: 6, min: 0, step: 0.05 },
    { default: 1.2, key: "contrast", label: "Contrast", max: 4, min: 0.2, step: 0.05 },
    { default: 0.6, key: "pull", label: "Pointer pull", max: 2, min: 0, step: 0.02 },
    { default: 0, key: "fill", label: "Base fill", max: 1, min: 0, step: 0.01 },
  ],
  shader: flowShader,
  statePresets: {
    idle: {
      speed: 0.35,
      warp: 2,
    },
    thinking: {
      speed: 0.9,
      warp: 3.5,
    },
    speaking: {
      speed: 1.2,
      contrast: 0.9,
    },
  },
  uniforms: flowParams,
};
