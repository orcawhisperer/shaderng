export const FIELD_SLUGS = ["aurora", "flow", "grid", "waves", "caustics"] as const;

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
];

export const FIELD_CATALOG_MAP = Object.fromEntries(
  FIELD_CATALOG.map((item) => [item.slug, item]),
) as Record<FieldSlug, FieldCatalogItem>;
