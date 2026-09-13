# shaderng

[![npm](https://img.shields.io/npm/v/shaderng)](https://www.npmjs.com/package/shaderng)
[![CI](https://github.com/orcawhisperer/shaderng/actions/workflows/ci.yml/badge.svg)](https://github.com/orcawhisperer/shaderng/actions/workflows/ci.yml)

Unofficial Angular port of [shadercn](https://github.com/shadcn-labs/shadercn): WebGPU shader orbs built on [vgpu](https://vgpu.labs.vercel.dev/) and [TypeGPU](https://typegpu.com/), installed into your project with one command.

```bash
ng add shaderng              # runtime + orb-01
ng g shaderng:orb orb-07     # more orbs; --list shows all 33
ng g shaderng:field aurora   # rectangular MIT backgrounds
ng update shaderng           # later: refresh the copied files you have not edited
```

Docs and playground: <https://shaderng.vercel.app>

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

Also original here: eight **fields** (cyber, nebula, warp, aurora, flow, grid, waves, caustics) drawn for rectangles and MIT-licensed, `<shader-background>` (any orb or field as a full-bleed page or hero background), `[preset]` looks saved straight from the playground, an eased `mouse` uniform from the window pointer, one shared WebGPU device and frame loop for every mounted shader, the TypeGPU esbuild intercept Angular needs, dual-mode light/dark theme color adaptation, and `prefers-reduced-motion` pause.

```html
<section class="relative h-80">
  <field-aurora state="thinking" />
  <h1 class="relative">Hello</h1>
</section>

<section class="relative">
  <shader-background [variant]="orb12Orb" state="thinking" fit="cover" [scale]="1.2" />
  <h1 class="relative">Hello</h1>
</section>

<orb-07 [preset]="orb07Hero" />
<!-- ng g shaderng:orb orb-07 --preset "<playground link>" --name hero -->
```

## Features

- **33 orb shaders** — the full shadercn set, from Dispersion to Abyss
- **8 field shaders** — original MIT backgrounds drawn for rectangles, not spheres
- **Adaptive themes** — dual-mode light and dark color palettes across all fields and orbs
- **Angular 22** — standalone components, signal inputs, zoneless change detection
- **WebGPU** — the original `renderer.ts` scene loop, wrapped as `<shader-orb>`
- **Typed inputs** — `state`, `size`, `params`, `colors`, `preset`, `audio` / `listen`, volumes, DPR and `maxFps`
- **Backgrounds** — `<shader-background>` covers, contains or fills any box at 30 fps
- **Docs + playground** — live previews, credits, per-orb and per-field prop tables

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

```bash
ng add shaderng                        # runtime + orb-01
ng add shaderng --orbs orb-01,orb-07   # pick orbs; "all" for all 33; "" for runtime only
ng g shaderng:orb 12                   # add more later; --list prints them
ng g shaderng:field aurora             # rectangular MIT background; --list prints them
ng g shaderng:orb orb-07 --preset "https://shaderng.vercel.app/playground?orb=orb-07&state=speaking&p=twist:2.5" --name hero
ng update shaderng                     # after npm i -D shaderng@latest: refresh untouched files
```

`ng add` installs `vgpu`, `typegpu` and the build-time TypeGPU tooling, copies the runtime into `src/components/orbs`, `src/lib` and `tools/typegpu.esbuild.ts`, switches the project to `@angular-builders/custom-esbuild` with the plugin registered, adds the `@/*` path alias, and copies the orbs you name. Existing files are kept unless you pass `--force`. It needs the esbuild application builder (the default since Angular 17).

`--preset` takes a playground link ("Copy preset command" in the playground produces the whole line) and writes `<name>.preset.ts` next to the orb: an `OrbPreset` for `<orb-07 [preset]="orb07Hero" />`.

Every file the schematics write is recorded with a hash in `shaderng.json`. `ng update shaderng` (or `ng g shaderng:update` at any time) replaces the files you have not edited, adds new ones, and lists the edited ones instead of overwriting them; `--force` takes everything. Projects installed before the lockfile existed are recognised from the published hashes in `schematics/src/update/known-hashes.json`; regenerate an entry for a new release with `node tools/hash-package-files.mjs <unpacked>/files <version>`.

The package lives in [`schematics/`](schematics) and is built into `dist/schematics` by `npm run build:schematics` from the same source files this site ships, so an upstream sync flows into the next publish. `npm run pack:schematics` produces a tarball you can `ng add ./dist/shaderng-0.3.0.tgz` locally.

Releasing: bump `version` in `schematics/package.json`, merge, then `git tag v<version> && git push origin v<version>`. The [publish workflow](.github/workflows/publish.yml) tests, packs and runs `npm publish --provenance`, authenticating through npm trusted publishing (GitHub OIDC; the workflow is registered on npmjs.com, no token stored). "Run workflow" on `main` with dry-run unticked publishes the version on `main` without a tag.

Without `ng add`, the [installation page](https://shaderng.vercel.app/docs/installation) has the equivalent manual steps: install the packages, `degit` the runtime files and one folder per orb, register `tools/typegpu.esbuild.ts` in `angular.json`, and add the `@/*` → `src/*` alias. GPU files use `"use gpu"` functions that must be transformed at build time.

Each orb folder is `gpu.ts` (TypeGPU shader), `meta.ts` (uniforms, colors, state presets), and an Angular wrapper. Shared runtime files:

- `renderer.ts` — WebGPU scene, springs, and the shared device + frame loop (shaderng-maintained fork of shadercn's)
- `shader-orb.ts` — canvas host, `[audio]`, `[preset]`, reduced-motion, `shaderOrbFallback`
- `shader-background.ts` — `<shader-background>`: an orb or field sized to fill its parent (`cover` / `contain` / `fill`)
- `canvas.ts` — public types
- `orb-base.ts` — shared inputs
- `field-base.ts` — `<field-xx>` wrappers, `fit="fill"`
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
| `npm run build:schematics`        | Build the `ng add` package into `dist/schematics`    |
| `npm run test:schematics`         | Run the schematic tests against the built package    |
| `npm run pack:schematics`         | Build and `npm pack` the package into `dist/`        |
| `npm run generate:orbs`           | Regenerate orbs from `$SHADERCN_DIR` (see above)     |
| `npm run check:shaders`           | Compile every orb and field with Dawn (null backend) |

## License

Two licenses apply. Read both before shipping.

- **MIT** ([LICENSE](LICENSE)) — the runtime (`renderer.ts`), orb presets, Angular wrappers, docs site, esbuild intercept, `[listen]`, reduced-motion handling, and every `src/components/fields/*/gpu.ts`.
- **Non-commercial, attribution required** — every `src/components/orbs/*/gpu.ts`. Those are XorDev’s shaders, ported with permission. The header in each file is the license: _“Non-commercial use only, with attribution to XorDev; keep this notice with the file.”_ Copying an orb into your app copies that restriction. Commercial use of the shader programs needs XorDev’s permission.
