import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { ORB_CATALOG } from "@/lib/orb-catalog";
import { SITE } from "@/lib/site";

@Component({
  selector: "app-credits-page",
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-3xl space-y-10">
      <p class="text-muted-foreground text-sm">Docs</p>
      <div class="space-y-3">
        <h1 class="text-3xl font-semibold tracking-tight">Credits</h1>
        <p class="text-muted-foreground text-lg">
          {{ site.name }} is an unofficial Angular port. The shaders are not ours. This page exists
          so that stays obvious.
        </p>
      </div>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">XorDev</h2>
        <p class="text-muted-foreground">
          Every orb GPU program is based on original shader work by
          <a class="text-foreground underline underline-offset-4" [href]="site.xordev" rel="noreferrer" target="_blank">XorDev</a>,
          used with permission. Keep the copyright notice in each
          <code class="bg-muted rounded px-1 py-0.5 text-sm">gpu.ts</code> file.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">shadercn / Shadcn Labs</h2>
        <p class="text-muted-foreground">
          The React registry, copy-paste orb layout, renderer, presets, and site structure come from
          <a class="text-foreground underline underline-offset-4" [href]="site.original" rel="noreferrer" target="_blank">{{ site.originalName }}</a>
          by Shadcn Labs (MIT). {{ site.name }} would not exist without that work.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">vgpu and TypeGPU</h2>
        <p class="text-muted-foreground">
          Runtime rendering uses
          <a class="text-foreground underline underline-offset-4" [href]="site.vgpu" rel="noreferrer" target="_blank">vgpu</a>
          and typed GPU functions from
          <a class="text-foreground underline underline-offset-4" [href]="site.typegpu" rel="noreferrer" target="_blank">TypeGPU</a>.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Angular</h2>
        <p class="text-muted-foreground">
          The component wrappers, docs, and playground are built with
          <a class="text-foreground underline underline-offset-4" [href]="site.angular" rel="noreferrer" target="_blank">Angular</a>
          22 (standalone components, signal inputs, zoneless change detection).
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Original to {{ site.name }}</h2>
        <ul class="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <code class="bg-muted rounded px-1 py-0.5 text-sm">[listen]</code>
            — microphone-reactive input/output volumes (not in shadercn)
          </li>
          <li>A TypeGPU esbuild intercept so Angular actually transforms <code class="bg-muted rounded px-1 py-0.5 text-sm">gpu.ts</code></li>
          <li>Prefers-reduced-motion pause on <code class="bg-muted rounded px-1 py-0.5 text-sm">&lt;shader-orb&gt;</code></li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Orb index</h2>
        <div class="overflow-x-auto rounded-xl border">
          <table class="w-full text-left text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-3 py-2 font-medium">Orb</th>
                <th class="px-3 py-2 font-medium">Name</th>
                <th class="px-3 py-2 font-medium">Based on</th>
              </tr>
            </thead>
            <tbody>
              @for (orb of orbs; track orb.slug) {
                <tr class="border-t">
                  <td class="px-3 py-2 font-mono text-xs">
                    <a class="underline underline-offset-2" [routerLink]="['/docs/components', orb.slug]">{{ orb.title }}</a>
                  </td>
                  <td class="px-3 py-2">{{ orb.name }}</td>
                  <td class="px-3 py-2">
                    <a class="underline underline-offset-2" [href]="site.xordev" rel="noreferrer" target="_blank">XorDev</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </article>
  `,
})
export class CreditsPage {
  protected readonly site = SITE;
  protected readonly orbs = ORB_CATALOG;
}
