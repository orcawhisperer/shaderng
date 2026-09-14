export const FIELD_SLUGS = [
  "aurora",
  "flow",
  "grid",
  "waves",
  "caustics",
  "cyber",
  "nebula",
  "warp",
  "paint",
  "singularity",
] as const;

export type FieldSlug = (typeof FIELD_SLUGS)[number];

export const isFieldSlug = (value: unknown): value is FieldSlug =>
  typeof value === "string" && (FIELD_SLUGS as readonly string[]).includes(value);

export interface FieldCatalogItem {
  slug: FieldSlug;
  title: string;
  description: string;
  /** One-word hook for cards and nav. */
  name: string;
}

export const FIELD_CATALOG: FieldCatalogItem[] = [
  {
    description: "three curtains of light drifting across the sky, leaning toward the pointer",
    name: "Curtains",
    slug: "aurora",
    title: "Aurora",
  },
  {
    description: "domain-warped smoke that never repeats, pulled toward the pointer",
    name: "Smoke",
    slug: "flow",
    title: "Flow",
  },
  {
    description: "a lattice of dots that ripples away from the pointer and breathes with the voice",
    name: "Lattice",
    slug: "grid",
    title: "Grid",
  },
  {
    description: "stacked lines that swell with the voice, a waveform without the oscilloscope",
    name: "Lines",
    slug: "waves",
    title: "Waves",
  },
  {
    description: "light through slow water, folding onto itself; the pointer stirs the surface",
    name: "Water",
    slug: "caustics",
    title: "Caustics",
  },
  {
    description:
      "infinite 3D synthwave grid receding to a glowing neon horizon with interactive camera tilt",
    name: "Synthwave",
    slug: "cyber",
    title: "Cyber",
  },
  {
    description: "volumetric cosmic dust and glowing stellar nurseries with a parallax starfield",
    name: "Cosmic",
    slug: "nebula",
    title: "Nebula",
  },
  {
    description: "relativistic hyperspace starfield and warp tunnel with pointer flight steering",
    name: "Hyperspace",
    slug: "warp",
    title: "Warp",
  },
  {
    description:
      "watercolor auroras drifting over a forested fjord with paint splatters, pine silhouettes, and water reflections",
    name: "Painterly",
    slug: "paint",
    title: "Paint",
  },
  {
    description:
      "Einsteinian gravitational lensing black hole with relativistic accretion disk, Doppler beaming, and photon sphere",
    name: "Black Hole",
    slug: "singularity",
    title: "Singularity",
  },
];

export const FIELD_CATALOG_MAP = Object.fromEntries(
  FIELD_CATALOG.map((item) => [item.slug, item]),
) as Record<FieldSlug, FieldCatalogItem>;
