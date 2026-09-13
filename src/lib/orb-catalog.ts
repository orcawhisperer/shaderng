export const ORB_SLUGS = [
  "orb-01",
  "orb-02",
  "orb-03",
  "orb-04",
  "orb-05",
  "orb-06",
  "orb-07",
  "orb-08",
  "orb-09",
  "orb-10",
  "orb-11",
  "orb-12",
  "orb-13",
  "orb-14",
  "orb-15",
  "orb-16",
  "orb-17",
  "orb-18",
  "orb-19",
  "orb-20",
  "orb-21",
  "orb-22",
  "orb-23",
  "orb-24",
  "orb-25",
  "orb-26",
  "orb-27",
  "orb-28",
  "orb-29",
  "orb-30",
  "orb-31",
  "orb-32",
  "orb-33"
] as const;

export type OrbSlug = (typeof ORB_SLUGS)[number];

export const ORB_STATE_VALUES = ["idle", "thinking", "speaking"] as const;

export interface OrbCatalogItem {
  slug: OrbSlug;
  title: string;
  name: string;
  description: string;
}

export const ORB_CATALOG: OrbCatalogItem[] = [
  {
    "description": "cut-glass orb with a dispersive, turbulent interior",
    "name": "Dispersion",
    "slug": "orb-01",
    "title": "ORB-01"
  },
  {
    "description": "ornate scrollwork on a rolling dome",
    "name": "Rocaille",
    "slug": "orb-02",
    "title": "ORB-02"
  },
  {
    "description": "",
    "name": "Ecliptic",
    "slug": "orb-03",
    "title": "ORB-03"
  },
  {
    "description": "a hollow shell of light, faceted by a voxel lattice",
    "name": "Chromatic",
    "slug": "orb-04",
    "title": "ORB-04"
  },
  {
    "description": "rainbow rings travelling through a lattice of lenses",
    "name": "Iridescent",
    "slug": "orb-05",
    "title": "ORB-05"
  },
  {
    "description": "",
    "name": "Moiré",
    "slug": "orb-06",
    "title": "ORB-06"
  },
  {
    "description": "",
    "name": "Torsion",
    "slug": "orb-07",
    "title": "ORB-07"
  },
  {
    "description": "mother-of-pearl contour bands, each layer its own hue",
    "name": "Nacre",
    "slug": "orb-08",
    "title": "ORB-08"
  },
  {
    "description": "torn rings of rainbow light worn as the ball's latitudes",
    "name": "Spectra",
    "slug": "orb-09",
    "title": "ORB-09"
  },
  {
    "description": "a lattice of light knitted into the ball's own skin",
    "name": "Weave",
    "slug": "orb-10",
    "title": "ORB-10"
  },
  {
    "description": "quantum orbital, rainbow chroma",
    "name": "Hydrogen",
    "slug": "orb-11",
    "title": "ORB-11"
  },
  {
    "description": "",
    "name": "Nebula",
    "slug": "orb-12",
    "title": "ORB-12"
  },
  {
    "description": "plasma globe: crawling lightning filaments",
    "name": "Ion",
    "slug": "orb-13",
    "title": "ORB-13"
  },
  {
    "description": "a lit plasma dome quantized to chunky two-tone pixels",
    "name": "Dither",
    "slug": "orb-14",
    "title": "ORB-14"
  },
  {
    "description": "an iridescent particle-track web worn as the ball's skin",
    "name": "Muons",
    "slug": "orb-15",
    "title": "ORB-15"
  },
  {
    "description": "",
    "name": "Caustic",
    "slug": "orb-16",
    "title": "ORB-16"
  },
  {
    "description": "a grainy many-coloured storm with band shear and lightning",
    "name": "Granular",
    "slug": "orb-17",
    "title": "ORB-17"
  },
  {
    "description": "a crystal folded out of one eighth of space, tumbling",
    "name": "Lattice",
    "slug": "orb-18",
    "title": "ORB-18"
  },
  {
    "description": "",
    "name": "Plasma",
    "slug": "orb-19",
    "title": "ORB-19"
  },
  {
    "description": "a water film rushing down the ball, fountain-style",
    "name": "Falls",
    "slug": "orb-20",
    "title": "ORB-20"
  },
  {
    "description": "light diffusing through a cloud",
    "name": "Nimbus",
    "slug": "orb-21",
    "title": "ORB-21"
  },
  {
    "description": "field lines swirling around the ball about a wandering axis",
    "name": "Vectors",
    "slug": "orb-22",
    "title": "ORB-22"
  },
  {
    "description": "an ASCII glyph matrix in CRT green, wrapped on the ball",
    "name": "Phosphor",
    "slug": "orb-23",
    "title": "ORB-23"
  },
  {
    "description": "",
    "name": "Voxel",
    "slug": "orb-24",
    "title": "ORB-24"
  },
  {
    "description": "the folds of a warped field, drawn by their own steepness",
    "name": "Cascade",
    "slug": "orb-25",
    "title": "ORB-25"
  },
  {
    "description": "a crazed web of coloured threads knotted to a cell grid",
    "name": "Reaction",
    "slug": "orb-26",
    "title": "ORB-26"
  },
  {
    "description": "",
    "name": "Constellation",
    "slug": "orb-27",
    "title": "ORB-27"
  },
  {
    "description": "nested binary grids shuttering on a tumbling bit-sphere",
    "name": "Bitdumb",
    "slug": "orb-28",
    "title": "ORB-28"
  },
  {
    "description": "",
    "name": "Mosaic",
    "slug": "orb-29",
    "title": "ORB-29"
  },
  {
    "description": "a meadow folding into itself toward a blue vanishing point",
    "name": "Droste",
    "slug": "orb-30",
    "title": "ORB-30"
  },
  {
    "description": "raymarched shell, volumetric godrays",
    "name": "Corona",
    "slug": "orb-31",
    "title": "ORB-31"
  },
  {
    "description": "a galaxy marched as gas and dust inside the ball",
    "name": "Galaxy",
    "slug": "orb-32",
    "title": "ORB-32"
  },
  {
    "description": "a thermal image, risograph-printed on the ball",
    "name": "Abyss",
    "slug": "orb-33",
    "title": "ORB-33"
  }
] as OrbCatalogItem[];

export const ORB_CATALOG_MAP = Object.fromEntries(
  ORB_CATALOG.map((item) => [item.slug, item]),
) as Record<OrbSlug, OrbCatalogItem>;
