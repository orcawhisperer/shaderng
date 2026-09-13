# Credits

**shaderng** is an unofficial Angular port of [shadercn](https://github.com/shadcn-labs/shadercn). Give credit in this order:

1. **[XorDev](https://x.com/XorDev)** — original shader work for all 33 orbs, used with permission. Every `gpu.ts` is **non-commercial use only, with attribution**; keep the notice in the file. The MIT license in this repo does not cover the shader programs.
2. **[shadercn](https://github.com/shadcn-labs/shadercn) / Shadcn Labs** — React registry, renderer, orb presets, and copy-paste component model (MIT).
3. **[vgpu](https://vgpu.labs.vercel.dev/)** — WebGPU shader runtime.
4. **[TypeGPU](https://typegpu.com/)** — typed `"use gpu"` functions.
5. **[Angular](https://angular.dev/)** — component model used by this port.

## Original to shaderng

- `[audio]` / `[listen]` — `volumes` measured from the microphone, a `MediaStream`, an audio element, or a Web Audio node (not in shadercn)
- One shared WebGPU device and frame loop across every mounted orb
- TypeGPU transform that works with Angular’s esbuild compiler (`tools/typegpu.esbuild.ts`)
- `prefers-reduced-motion` pause on `<shader-orb>`

## Orb index

| Orb      | Title         | Based on                        |
| -------- | ------------- | ------------------------------- |
| `orb-01` | Dispersion    | [@XorDev](https://x.com/XorDev) |
| `orb-02` | Rocaille      | [@XorDev](https://x.com/XorDev) |
| `orb-03` | Ecliptic      | [@XorDev](https://x.com/XorDev) |
| `orb-04` | Chromatic     | [@XorDev](https://x.com/XorDev) |
| `orb-05` | Iridescent    | [@XorDev](https://x.com/XorDev) |
| `orb-06` | Moiré         | [@XorDev](https://x.com/XorDev) |
| `orb-07` | Torsion       | [@XorDev](https://x.com/XorDev) |
| `orb-08` | Nacre         | [@XorDev](https://x.com/XorDev) |
| `orb-09` | Spectra       | [@XorDev](https://x.com/XorDev) |
| `orb-10` | Weave         | [@XorDev](https://x.com/XorDev) |
| `orb-11` | Hydrogen      | [@XorDev](https://x.com/XorDev) |
| `orb-12` | Nebula        | [@XorDev](https://x.com/XorDev) |
| `orb-13` | Ion           | [@XorDev](https://x.com/XorDev) |
| `orb-14` | Dither        | [@XorDev](https://x.com/XorDev) |
| `orb-15` | Muons         | [@XorDev](https://x.com/XorDev) |
| `orb-16` | Caustic       | [@XorDev](https://x.com/XorDev) |
| `orb-17` | Granular      | [@XorDev](https://x.com/XorDev) |
| `orb-18` | Lattice       | [@XorDev](https://x.com/XorDev) |
| `orb-19` | Plasma        | [@XorDev](https://x.com/XorDev) |
| `orb-20` | Falls         | [@XorDev](https://x.com/XorDev) |
| `orb-21` | Nimbus        | [@XorDev](https://x.com/XorDev) |
| `orb-22` | Vectors       | [@XorDev](https://x.com/XorDev) |
| `orb-23` | Phosphor      | [@XorDev](https://x.com/XorDev) |
| `orb-24` | Voxel         | [@XorDev](https://x.com/XorDev) |
| `orb-25` | Cascade       | [@XorDev](https://x.com/XorDev) |
| `orb-26` | Reaction      | [@XorDev](https://x.com/XorDev) |
| `orb-27` | Constellation | [@XorDev](https://x.com/XorDev) |
| `orb-28` | Bitdumb       | [@XorDev](https://x.com/XorDev) |
| `orb-29` | Mosaic        | [@XorDev](https://x.com/XorDev) |
| `orb-30` | Droste        | [@XorDev](https://x.com/XorDev) |
| `orb-31` | Corona        | [@XorDev](https://x.com/XorDev) |
| `orb-32` | Galaxy        | [@XorDev](https://x.com/XorDev) |
| `orb-33` | Abyss         | [@XorDev](https://x.com/XorDev) |
