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

## Requirements

- Angular 22 with the esbuild application builder (`@angular/build:application`)
- Node.js 22.12 or later
- WebGPU in the browser at runtime (Chrome / Edge 113+)

## Licenses

The runtime, presets and Angular wrappers are MIT. Every `gpu.ts` is XorDev's shader, ported
with permission, and is **non-commercial use only, with attribution**. Keep the header notice in
each `gpu.ts`; commercial use of the shader programs needs XorDev's permission. See
<https://shaderng.vercel.app/docs/credits>.
