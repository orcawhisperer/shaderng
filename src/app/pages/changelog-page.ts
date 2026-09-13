import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { SITE } from "@/lib/site";

@Component({
  selector: "app-changelog-page",
  template: `
    <article class="mx-auto max-w-3xl space-y-6">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Changelog</h1>
      <section class="space-y-3">
        <h2 class="text-xl font-semibold">shaderng</h2>
        <p class="text-muted-foreground">
          Unofficial Angular 22 port of
          <a class="text-foreground underline underline-offset-4" [href]="site.original">{{
            site.originalName
          }}</a
          >.
        </p>
        <ul class="list-disc space-y-1 pl-5">
          <li>33 orb shaders with the original TypeGPU GPU programs (XorDev / shadercn)</li>
          <li>
            WebGPU renderer from shadercn, wrapped as
            <code class="bg-muted rounded px-1 py-0.5 text-sm">&lt;shader-orb&gt;</code>, with one
            device and one frame loop shared by every mounted orb
          </li>
          <li>Standalone Angular components with typed signal inputs</li>
          <li>
            Original:
            <code class="bg-muted rounded px-1 py-0.5 text-sm">[audio]</code> drive from the
            microphone, a MediaStream, an audio element or a Web Audio node (<code
              class="bg-muted rounded px-1 py-0.5 text-sm"
              >[listen]</code
            >
            is the microphone shorthand), reduced-motion pause, Angular TypeGPU esbuild intercept
          </li>
          <li>
            Instant fallback where WebGPU is missing, shareable playground links, per-route titles
          </li>
          <li>Gallery, playground, credits, and docs site</li>
        </ul>
        <p class="text-muted-foreground">
          <a routerLink="/docs/credits" class="underline underline-offset-4">Credits</a>
        </p>
      </section>
    </article>
  `,
  imports: [RouterLink],
})
export class ChangelogPage {
  protected readonly site = SITE;
}
