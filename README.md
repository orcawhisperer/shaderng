# shadercn-angular

Angular port of [shadercn](https://github.com/shadcn-labs/shadercn): free, copy-paste WebGPU shader components built on [vgpu](https://vgpu.labs.vercel.dev/) and [TypeGPU](https://typegpu.com/).

This is an unofficial community port. The GPU programs, renderer, and orb presets come from shadercn (MIT) and are based on original shader work by [XorDev](https://x.com/XorDev), used with permission. See [CREDITS.md](CREDITS.md).

## Features

- **33 orb shaders** — the full shadercn set, from Dispersion to Abyss
- **Angular 22** — standalone components, signal inputs, zoneless change detection
- **WebGPU** — the original `renderer.ts` scene loop, wrapped as `<shader-orb>`
- **Typed inputs** — `state`, `size`, `params`, `colors`, volumes, and DPR
- **Docs + playground** — live previews, per-orb prop tables, and copyable templates

## Quick start

```bash
npm install
npm start
```

Requires **Node.js 22.22.3+**. Open `http://localhost:4200`. Chrome or Edge 113+ with WebGPU is required to render the orbs.

```bash
npm test
npm run build
```

## Use an orb in your Angular app

```ts
import { Component } from "@angular/core";
import { Orb01 } from "@/components/orbs/orb-01";

@Component({
  imports: [Orb01],
  template: `<orb-01 [size]="280" state="idle" />`,
})
export class Hero {}
```

Drive states (`idle`, `thinking`, `speaking`) ease the shader uniforms. Override any uniform through `params` and `colors`:

```html
<orb-01
  [size]="420"
  state="speaking"
  [params]="{ speed: 1.2, turb: 0.55 }"
  [colors]="{ tint: '#c4b5fd' }"
/>
```

## Add the components to another project

1. Install the GPU runtime:

   ```bash
   npm i vgpu typegpu
   npm i -D unplugin-typegpu @babel/core @babel/preset-typescript @webgpu/types @angular-builders/custom-esbuild
   ```

2. Copy `src/components/orbs` into your app and add the `@/*` path alias.

3. Register the TypeGPU esbuild plugin (see `tools/typegpu.esbuild.ts` and `angular.json`). GPU files use `"use gpu"` functions that must be transformed at build time.

Each orb folder is `gpu.ts` (TypeGPU shader), `meta.ts` (uniforms, colors, state presets), and an Angular wrapper. Shared runtime files:

- `renderer.ts` — WebGPU scene, springs, and frame loop (from shadercn)
- `shader-orb.ts` — canvas host
- `canvas.ts` — public types
- `orb-base.ts` — shared inputs

## Deploy on Vercel

Vercel serves the Angular production build from `dist/shadercn-angular/browser`. Client-side routes (`/docs`, `/playground`, …) rewrite to `index.html`.

```bash
npx vercel --prod
```

Or import the Git repo in the [Vercel dashboard](https://vercel.com/new). Requires Node.js 22.22.3+. WebGPU still needs Chrome or Edge 113+.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Dev server on port 4200 |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Production build |
| `npm run generate:orbs` | Regenerate Angular wrappers from shadercn sources |

## License

[MIT](LICENSE), same as shadercn. Keep the XorDev notices in `gpu.ts` files.
