import { Component } from "@angular/core";

@Component({
  selector: "app-changelog-page",
  template: `
    <article class="mx-auto max-w-3xl space-y-6">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Changelog</h1>
      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Angular port</h2>
        <p class="text-muted-foreground">
          Initial Angular 22 port of
          <a class="text-foreground underline underline-offset-4" href="https://github.com/shadcn-labs/shadercn">shadercn</a>.
        </p>
        <ul class="list-disc space-y-1 pl-5">
          <li>33 orb shaders with the original TypeGPU GPU programs</li>
          <li>Shared WebGPU renderer from shadercn, wrapped as <code class="bg-muted rounded px-1 py-0.5 text-sm">&lt;shader-orb&gt;</code></li>
          <li>Standalone Angular components with typed signal inputs</li>
          <li>Gallery, playground, and docs site</li>
        </ul>
      </section>
    </article>
  `,
})
export class ChangelogPage {}
