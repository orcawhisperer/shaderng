import type { Type } from "@angular/core";

import type { FieldBase } from "@/components/fields/field-base";
import type { OrbVariant } from "@/components/orbs/renderer";
import { isFieldSlug, type FieldSlug } from "@/lib/field-catalog";

export interface FieldEntry {
  Component: Type<FieldBase>;
  variant: OrbVariant;
}

export const FIELD_LOADERS: Record<FieldSlug, () => Promise<FieldEntry>> = {
  aurora: () =>
    import("@/components/fields/aurora").then((m) => ({
      Component: m.FieldAurora,
      variant: m.auroraField,
    })),
  flow: () =>
    import("@/components/fields/flow").then((m) => ({
      Component: m.FieldFlow,
      variant: m.flowField,
    })),
  grid: () =>
    import("@/components/fields/grid").then((m) => ({
      Component: m.FieldGrid,
      variant: m.gridField,
    })),
  waves: () =>
    import("@/components/fields/waves").then((m) => ({
      Component: m.FieldWaves,
      variant: m.wavesField,
    })),
  caustics: () =>
    import("@/components/fields/caustics").then((m) => ({
      Component: m.FieldCaustics,
      variant: m.causticsField,
    })),
  cyber: () =>
    import("@/components/fields/cyber").then((m) => ({
      Component: m.FieldCyber,
      variant: m.cyberField,
    })),
  nebula: () =>
    import("@/components/fields/nebula").then((m) => ({
      Component: m.FieldNebula,
      variant: m.nebulaField,
    })),
  warp: () =>
    import("@/components/fields/warp").then((m) => ({
      Component: m.FieldWarp,
      variant: m.warpField,
    })),
  paint: () =>
    import("@/components/fields/paint").then((m) => ({
      Component: m.FieldPaint,
      variant: m.paintField,
    })),
  singularity: () =>
    import("@/components/fields/singularity").then((m) => ({
      Component: m.FieldSingularity,
      variant: m.singularityField,
    })),
};

export const loadField = (slug: string): Promise<FieldEntry> => {
  if (!isFieldSlug(slug)) {
    return Promise.reject(new Error(`Unknown field "${slug}"`));
  }
  return FIELD_LOADERS[slug]();
};
