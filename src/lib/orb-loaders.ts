import type { Type } from "@angular/core";

import type { OrbBase } from "@/components/orbs/orb-base";
import type { OrbVariant } from "@/components/orbs/renderer";
import { isOrbSlug, type OrbSlug } from "@/lib/orb-catalog";

export interface OrbEntry {
  Component: Type<OrbBase>;
  variant: OrbVariant;
}

export const ORB_LOADERS: Record<OrbSlug, () => Promise<OrbEntry>> = {
  "orb-01": () =>
    import("@/components/orbs/orb-01").then((m) => ({
      Component: m.Orb01,
      variant: m.orb01Orb,
    })),
  "orb-02": () =>
    import("@/components/orbs/orb-02").then((m) => ({
      Component: m.Orb02,
      variant: m.orb02Orb,
    })),
  "orb-03": () =>
    import("@/components/orbs/orb-03").then((m) => ({
      Component: m.Orb03,
      variant: m.orb03Orb,
    })),
  "orb-04": () =>
    import("@/components/orbs/orb-04").then((m) => ({
      Component: m.Orb04,
      variant: m.orb04Orb,
    })),
  "orb-05": () =>
    import("@/components/orbs/orb-05").then((m) => ({
      Component: m.Orb05,
      variant: m.orb05Orb,
    })),
  "orb-06": () =>
    import("@/components/orbs/orb-06").then((m) => ({
      Component: m.Orb06,
      variant: m.orb06Orb,
    })),
  "orb-07": () =>
    import("@/components/orbs/orb-07").then((m) => ({
      Component: m.Orb07,
      variant: m.orb07Orb,
    })),
  "orb-08": () =>
    import("@/components/orbs/orb-08").then((m) => ({
      Component: m.Orb08,
      variant: m.orb08Orb,
    })),
  "orb-09": () =>
    import("@/components/orbs/orb-09").then((m) => ({
      Component: m.Orb09,
      variant: m.orb09Orb,
    })),
  "orb-10": () =>
    import("@/components/orbs/orb-10").then((m) => ({
      Component: m.Orb10,
      variant: m.orb10Orb,
    })),
  "orb-11": () =>
    import("@/components/orbs/orb-11").then((m) => ({
      Component: m.Orb11,
      variant: m.orb11Orb,
    })),
  "orb-12": () =>
    import("@/components/orbs/orb-12").then((m) => ({
      Component: m.Orb12,
      variant: m.orb12Orb,
    })),
  "orb-13": () =>
    import("@/components/orbs/orb-13").then((m) => ({
      Component: m.Orb13,
      variant: m.orb13Orb,
    })),
  "orb-14": () =>
    import("@/components/orbs/orb-14").then((m) => ({
      Component: m.Orb14,
      variant: m.orb14Orb,
    })),
  "orb-15": () =>
    import("@/components/orbs/orb-15").then((m) => ({
      Component: m.Orb15,
      variant: m.orb15Orb,
    })),
  "orb-16": () =>
    import("@/components/orbs/orb-16").then((m) => ({
      Component: m.Orb16,
      variant: m.orb16Orb,
    })),
  "orb-17": () =>
    import("@/components/orbs/orb-17").then((m) => ({
      Component: m.Orb17,
      variant: m.orb17Orb,
    })),
  "orb-18": () =>
    import("@/components/orbs/orb-18").then((m) => ({
      Component: m.Orb18,
      variant: m.orb18Orb,
    })),
  "orb-19": () =>
    import("@/components/orbs/orb-19").then((m) => ({
      Component: m.Orb19,
      variant: m.orb19Orb,
    })),
  "orb-20": () =>
    import("@/components/orbs/orb-20").then((m) => ({
      Component: m.Orb20,
      variant: m.orb20Orb,
    })),
  "orb-21": () =>
    import("@/components/orbs/orb-21").then((m) => ({
      Component: m.Orb21,
      variant: m.orb21Orb,
    })),
  "orb-22": () =>
    import("@/components/orbs/orb-22").then((m) => ({
      Component: m.Orb22,
      variant: m.orb22Orb,
    })),
  "orb-23": () =>
    import("@/components/orbs/orb-23").then((m) => ({
      Component: m.Orb23,
      variant: m.orb23Orb,
    })),
  "orb-24": () =>
    import("@/components/orbs/orb-24").then((m) => ({
      Component: m.Orb24,
      variant: m.orb24Orb,
    })),
  "orb-25": () =>
    import("@/components/orbs/orb-25").then((m) => ({
      Component: m.Orb25,
      variant: m.orb25Orb,
    })),
  "orb-26": () =>
    import("@/components/orbs/orb-26").then((m) => ({
      Component: m.Orb26,
      variant: m.orb26Orb,
    })),
  "orb-27": () =>
    import("@/components/orbs/orb-27").then((m) => ({
      Component: m.Orb27,
      variant: m.orb27Orb,
    })),
  "orb-28": () =>
    import("@/components/orbs/orb-28").then((m) => ({
      Component: m.Orb28,
      variant: m.orb28Orb,
    })),
  "orb-29": () =>
    import("@/components/orbs/orb-29").then((m) => ({
      Component: m.Orb29,
      variant: m.orb29Orb,
    })),
  "orb-30": () =>
    import("@/components/orbs/orb-30").then((m) => ({
      Component: m.Orb30,
      variant: m.orb30Orb,
    })),
  "orb-31": () =>
    import("@/components/orbs/orb-31").then((m) => ({
      Component: m.Orb31,
      variant: m.orb31Orb,
    })),
  "orb-32": () =>
    import("@/components/orbs/orb-32").then((m) => ({
      Component: m.Orb32,
      variant: m.orb32Orb,
    })),
  "orb-33": () =>
    import("@/components/orbs/orb-33").then((m) => ({
      Component: m.Orb33,
      variant: m.orb33Orb,
    })),
};

export const loadOrb = (slug: string): Promise<OrbEntry> => {
  if (!isOrbSlug(slug)) {
    return Promise.reject(new Error(`Unknown orb "${slug}"`));
  }
  return ORB_LOADERS[slug]();
};
