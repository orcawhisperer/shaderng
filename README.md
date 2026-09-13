# shaderng

Unofficial Angular port of [shadercn](https://github.com/shadcn-labs/shadercn): copy-paste WebGPU shader orbs built on [vgpu](https://vgpu.labs.vercel.dev/) and [TypeGPU](https://typegpu.com/).

The name is **shaderng** (`shader` + Angular’s `ng`), not `shadercn-ng` or `shadercn-angular`. Those read like a dump of the React repo. This is still a port — the GPU programs are not ours.

## Credits (please keep these)

1. **[XorDev](https://x.com/XorDev)** — original shader work for all 33 orbs, used with permission.
2. **[shadercn](https://github.com/shadcn-labs/shadercn) / Shadcn Labs** — React registry, renderer, presets (MIT).
3. **vgpu** and **TypeGPU** — the GPU runtime.
4. **Angular** — this port’s component model.

See [CREDITS.md](CREDITS.md) and the in-app [Credits](https://orcawhisperer.github.io/shaderng/docs/credits) page (URL depends on the GitHub repo name).

## Original to shaderng

shadercn feeds voice levels through `volumes`. shaderng measures them from live audio for you:

```html
<!-- microphone -->
<orb-01 [size]="280" state="speaking" [listen]="true" />

<!-- the assistant's voice: a WebRTC remote stream, TTS output, an <audio> element, or a Web Audio node -->
<orb-01 [size]="280" state="speaking" [audio]="remoteStream" />
```

`[audio]` accepts `"microphone" | MediaStream | AudioNode | HTMLMediaElement`; `[listen]` is shorthand for the microphone. Sources you pass in are never stopped or closed by the orb.

Also original here: one shared WebGPU device and frame loop for every mounted orb, the TypeGPU esbuild intercept Angular needs, and `prefers-reduced-motion` pause.

## Features

- **33 orb shaders** — the full shadercn set, from Dispersion to Abyss
- **Angular 22** — standalone components, signal inputs, zoneless change detection
- **WebGPU** — the original `renderer.ts` scene loop, wrapped as `<shader-orb>`
- **Typed inputs** — `state`, `size`, `params`, `colors`, `audio` / `listen`, volumes, and DPR
- **Docs + playground** — live previews, credits, per-orb prop tables

## Quick start

```bash
git clone https://github.com/orcawhisperer/shaderng.git
cd shaderng
npm install
npm start
```

Requires **Node.js 22.22.3+**. Open `http://localhost:4200`. Chrome or Edge 113+ with WebGPU is required to render the orbs.

```bash
npm test
npm run build
npm run build:pages   # GitHub Pages output + 404.html fallback
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

## GitHub Pages

Pages must be enabled **before** the deploy job can succeed. A 404 from `actions/deploy-pages` means the site is not turned on yet.

1. Open [Settings → Pages](https://github.com/orcawhisperer/shaderng/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions** and save.
3. Re-run the **GitHub Pages** workflow (Actions → GitHub Pages → Run workflow), or push to `main`.

The site URL is `https://orcawhisperer.github.io/shaderng/`. The workflow sets `<base href>` from the repo name and copies `index.html` to `404.html` so Angular routes work.

Local Pages build:

```bash
BASE_HREF=/shaderng/ npm run build:pages
```

## Deploy on Vercel

Vercel serves the Angular production build from `dist/shaderng/browser`. Client-side routes rewrite to `index.html`.

```bash
npx vercel --prod
```

## Add the components to another project

1. Install the GPU runtime:

   ```bash
   npm i vgpu typegpu
   npm i -D unplugin-typegpu @babel/core @babel/preset-typescript @webgpu/types @angular-builders/custom-esbuild
   ```

2. Fetch the shared runtime and one orb (the [installation page](https://shaderng.vercel.app/docs/installation) has the full, copyable list, and every component page has its own `degit` line):

   ```bash
   npx degit orcawhisperer/shaderng/src/components/orbs/orb-01 src/components/orbs/orb-01
   ```

   Add the `@/*` → `src/*` path alias to `tsconfig.json`.

3. Register the TypeGPU esbuild plugin (see `tools/typegpu.esbuild.ts` and `angular.json`). GPU files use `"use gpu"` functions that must be transformed at build time.

Each orb folder is `gpu.ts` (TypeGPU shader), `meta.ts` (uniforms, colors, state presets), and an Angular wrapper. Shared runtime files:

- `renderer.ts` — WebGPU scene, springs, and the shared device + frame loop (shaderng-maintained fork of shadercn's)
- `shader-orb.ts` — canvas host, `[audio]`, reduced-motion, `shaderOrbFallback`
- `canvas.ts` — public types
- `orb-base.ts` — shared inputs
- `src/lib/audio-drive.ts` — volume measurement for any audio source

## Syncing with shadercn

`npm run generate:orbs` regenerates `gpu.ts`, `meta.ts`, the wrappers and the catalog from a shadercn checkout (`SHADERCN_DIR`, default `/tmp/shadercn`). `renderer.ts` is not regenerated: it carries the shared-device work and is diffed against upstream by hand.

The **Sync shadercn upstream** workflow runs weekly (and on demand) and opens a PR on the `sync/shadercn` branch when anything changed. It needs _Settings → Actions → General → Allow GitHub Actions to create and approve pull requests_ enabled once.

## Scripts

| Command                           | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| `npm start`                       | Dev server on port 4200                              |
| `npm test`                        | Unit tests (Vitest)                                  |
| `npm run typecheck`               | `tsc --noEmit` for app and spec configs              |
| `npm run format` / `format:check` | Prettier (upstream `gpu.ts` / `meta.ts` are ignored) |
| `npm run build`                   | Production build                                     |
| `npm run build:pages`             | GitHub Pages build                                   |
| `npm run generate:orbs`           | Regenerate orbs from `$SHADERCN_DIR` (see above)     |

## License

Two licenses apply. Read both before shipping.

- **MIT** ([LICENSE](LICENSE)) — the runtime (`renderer.ts`), orb presets, Angular wrappers, docs site, esbuild intercept, `[listen]`, and reduced-motion handling.
- **Non-commercial, attribution required** — every `src/components/orbs/*/gpu.ts`. Those are XorDev’s shaders, ported with permission. The header in each file is the license: _“Non-commercial use only, with attribution to XorDev; keep this notice with the file.”_ Copying an orb into your app copies that restriction. Commercial use of the shader programs needs XorDev’s permission.
