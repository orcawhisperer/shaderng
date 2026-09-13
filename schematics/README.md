# shaderng

GPU shader orbs for Angular 22, installed with `ng add`. An unofficial Angular port of
[shadercn](https://github.com/shadcn-labs/shadercn); shaders by [XorDev](https://x.com/XorDev).

Docs and live playground: <https://shaderng.vercel.app>

## Install

```bash
ng add shaderng
```

This copies the runtime into your project (`src/components/orbs/*`, `src/lib/*`,
`tools/typegpu.esbuild.ts`), adds `vgpu`, `typegpu` and the build-time TypeGPU tooling to
`package.json`, switches the project to `@angular-builders/custom-esbuild` with the TypeGPU plugin,
adds the `@/*` path alias, and copies the orbs you pick (`orb-01` by default).

```bash
ng add shaderng --orbs orb-01,orb-07   # pick orbs
ng add shaderng --orbs all             # all 33
ng add shaderng --orbs ""              # runtime only
```

Add more orbs later:

```bash
ng g shaderng:orb orb-12
ng g shaderng:orb 12,13,14
ng g shaderng:orb --list
```

Save a look from the [playground](https://shaderng.vercel.app/playground) ("Copy preset command"):

```bash
ng g shaderng:orb orb-07 --preset "https://shaderng.vercel.app/playground?orb=orb-07&state=speaking&p=twist:2.5" --name hero
# writes src/components/orbs/orb-07/hero.preset.ts -> <orb-07 [preset]="orb07Hero" />
```

## Update

```bash
npm i -D shaderng@latest
ng update shaderng        # or: ng g shaderng:update [--force]
```

The files `ng add` copies are yours to edit. Everything the schematics write is recorded with a
hash in `shaderng.json`; the update replaces files you have not touched, adds new ones, and lists
the edited ones instead of overwriting them. Formatting differences do not count as edits.

## Use

```ts
import { Component } from "@angular/core";
import { Orb01 } from "@/components/orbs/orb-01";

@Component({
  imports: [Orb01],
  template: `<orb-01 [size]="280" state="speaking" [listen]="true" />`,
})
export class Hero {}
```

`[listen]` drives the orb from the microphone; `[audio]` accepts any `MediaStream`, Web Audio
node or `<audio>` element. Where WebGPU is missing the orb shows a CSS fallback, replaceable with
`<ng-template shaderOrbFallback>`.

As a background:

```html
<section class="relative">
  <shader-background [variant]="orb12Orb" state="thinking" fit="cover" [scale]="1.2" />
  <h1 class="relative">Hello</h1>
</section>
```

`ShaderBackground` (from `@/components/orbs/shader-background`) fills its positioned parent, crops
(`cover`) or fits (`contain`) the orb, and paints at 30 fps unless `maxFps` says otherwise.

## Requirements

- Angular 22 with the esbuild application builder (`@angular/build:application`)
- Node.js 22.12 or later
- WebGPU in the browser at runtime (Chrome / Edge 113+)

## Licenses

The runtime, presets and Angular wrappers are MIT. Every `gpu.ts` is XorDev's shader, ported
with permission, and is **non-commercial use only, with attribution**. Keep the header notice in
each `gpu.ts`; commercial use of the shader programs needs XorDev's permission. See
<https://shaderng.vercel.app/docs/credits>.
