import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Override with SHADERCN_DIR=/path/to/shadercn-checkout to sync from another clone.
const sourceOrbs = join(process.env.SHADERCN_DIR ?? "/tmp/shadercn", "registry/components/orbs");
if (!existsSync(sourceOrbs)) {
  console.error(
    `shadercn sources not found at ${sourceOrbs}. Clone https://github.com/shadcn-labs/shadercn and set SHADERCN_DIR.`,
  );
  process.exit(1);
}
const destOrbs = join(root, "src/components/orbs");

const NAMES = {
  "orb-01": "Dispersion",
  "orb-02": "Rocaille",
  "orb-03": "Ecliptic",
  "orb-04": "Chromatic",
  "orb-05": "Iridescent",
  "orb-06": "Moiré",
  "orb-07": "Torsion",
  "orb-08": "Nacre",
  "orb-09": "Spectra",
  "orb-10": "Weave",
  "orb-11": "Hydrogen",
  "orb-12": "Nebula",
  "orb-13": "Ion",
  "orb-14": "Dither",
  "orb-15": "Muons",
  "orb-16": "Caustic",
  "orb-17": "Granular",
  "orb-18": "Lattice",
  "orb-19": "Plasma",
  "orb-20": "Falls",
  "orb-21": "Nimbus",
  "orb-22": "Vectors",
  "orb-23": "Phosphor",
  "orb-24": "Voxel",
  "orb-25": "Cascade",
  "orb-26": "Reaction",
  "orb-27": "Constellation",
  "orb-28": "Bitdumb",
  "orb-29": "Mosaic",
  "orb-30": "Droste",
  "orb-31": "Corona",
  "orb-32": "Galaxy",
  "orb-33": "Abyss",
};

const slugs = readdirSync(sourceOrbs)
  .filter((name) => name.startsWith("orb-"))
  .sort();

mkdirSync(destOrbs, { recursive: true });
// renderer.ts is maintained here, not copied: shaderng shares one GPU device and one frame
// loop across every mounted orb, which the upstream per-canvas renderer does not do. Diff
// upstream's renderer.ts by hand when syncing.
if (existsSync(join(sourceOrbs, "renderer.ts"))) {
  console.log("skipping renderer.ts (maintained locally); diff upstream manually if needed");
}

const catalog = [];
const loaderLines = [];
const exportLines = [];

for (const slug of slugs) {
  const n = slug.slice(-2);
  const className = `Orb${n}`;
  const variantName = `orb${n}Orb`;
  const dest = join(destOrbs, slug);
  mkdirSync(dest, { recursive: true });
  cpSync(join(sourceOrbs, slug, "gpu.ts"), join(dest, "gpu.ts"));

  let meta = readFileSync(join(sourceOrbs, slug, "meta.ts"), "utf8");
  meta = meta.replace(
    'files: ["index.tsx", "meta.ts", "gpu.ts"]',
    `files: ["${slug}.ts", "meta.ts", "gpu.ts"]`,
  );
  writeFileSync(join(dest, "meta.ts"), meta);

  const title = meta.match(/title:\s*"([^"]+)"/)?.[1] ?? slug.toUpperCase();
  // Prettier wraps long values onto the next line, so allow whitespace after the colon.
  const description = meta.match(/description:\s*"([^"]+)"/)?.[1] ?? "";
  if (!description) {
    console.warn(`${slug}: no description found in meta.ts`);
  }

  writeFileSync(
    join(dest, `${slug}.ts`),
    `import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { ${variantName} } from "@/components/orbs/${slug}/meta";

export { meta, ${variantName} } from "@/components/orbs/${slug}/meta";

@Component({
  selector: "${slug}",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class ${className} extends OrbBase {
  override readonly variant = ${variantName};
}
`,
  );

  writeFileSync(
    join(dest, "index.ts"),
    `export { ${className}, ${variantName}, meta } from "./${slug}";
`,
  );

  catalog.push({
    description,
    name: NAMES[slug] ?? title,
    slug,
    title,
  });

  loaderLines.push(
    `  "${slug}": () =>\n    import("@/components/orbs/${slug}").then((m) => ({\n      Component: m.${className},\n      variant: m.${variantName},\n    })),`,
  );
  exportLines.push(
    `export { ${className}, ${variantName}, meta as meta${n} } from "@/components/orbs/${slug}";`,
  );
}

writeFileSync(
  join(root, "src/lib/orb-catalog.ts"),
  `export const ORB_SLUGS = ${JSON.stringify(
    catalog.map((item) => item.slug),
    null,
    2,
  )} as const;

export type OrbSlug = (typeof ORB_SLUGS)[number];

export const isOrbSlug = (value: unknown): value is OrbSlug =>
  typeof value === "string" && (ORB_SLUGS as readonly string[]).includes(value);

export interface OrbCatalogItem {
  slug: OrbSlug;
  title: string;
  name: string;
  description: string;
}

export const ORB_CATALOG: OrbCatalogItem[] = ${JSON.stringify(catalog, null, 2)} as OrbCatalogItem[];

export const ORB_CATALOG_MAP = Object.fromEntries(
  ORB_CATALOG.map((item) => [item.slug, item]),
) as Record<OrbSlug, OrbCatalogItem>;
`,
);

writeFileSync(
  join(root, "src/lib/orb-loaders.ts"),
  `import type { Type } from "@angular/core";

import type { OrbBase } from "@/components/orbs/orb-base";
import type { OrbVariant } from "@/components/orbs/renderer";
import { isOrbSlug, type OrbSlug } from "@/lib/orb-catalog";

export interface OrbEntry {
  Component: Type<OrbBase>;
  variant: OrbVariant;
}

export const ORB_LOADERS: Record<OrbSlug, () => Promise<OrbEntry>> = {
${loaderLines.join("\n")}
};

export const loadOrb = (slug: string): Promise<OrbEntry> => {
  if (!isOrbSlug(slug)) {
    return Promise.reject(new Error(\`Unknown orb "\${slug}"\`));
  }
  return ORB_LOADERS[slug]();
};
`,
);

writeFileSync(join(destOrbs, "index.ts"), `${exportLines.join("\n")}\n`);

console.log(`generated ${slugs.length} orb components`);
