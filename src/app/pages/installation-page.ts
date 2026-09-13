import { Component } from "@angular/core";

import { CloneOptions } from "@/app/ui/clone-options";
import { CodeBlock } from "@/app/ui/code-block";
import { SITE } from "@/lib/site";

@Component({
  selector: "app-installation-page",
  imports: [CloneOptions, CodeBlock],
  template: `
    <article class="mx-auto max-w-3xl space-y-8">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Installation</h1>
      <p class="text-muted-foreground text-lg">
        Add GPU shader components to an Angular 22 app. Components use
        <a class="text-foreground underline underline-offset-4" href="https://vgpu.labs.vercel.dev/">vgpu</a>
        as the shader runtime and
        <a class="text-foreground underline underline-offset-4" href="https://typegpu.com/">TypeGPU</a>
        for type-safe GPU code.
      </p>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Clone</h2>
        <p class="text-muted-foreground">
          Source lives at
          <a class="text-foreground underline underline-offset-4" [href]="site.github" rel="noreferrer" target="_blank">{{ site.github }}</a>.
          Copy HTTPS, SSH, or the raw git URL.
        </p>
        <app-clone-options />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Prerequisites</h2>
        <ul class="text-muted-foreground list-disc space-y-1 pl-5">
          <li>Angular 22 with the application builder (esbuild)</li>
          <li>A Chromium browser with WebGPU (Chrome / Edge 113+)</li>
          <li>Node.js 22.22.3 or later</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">1. Install dependencies</h2>
        <app-code-block [code]="installDeps" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">2. Enable the TypeGPU esbuild plugin</h2>
        <p class="text-muted-foreground">
          GPU files use <code class="bg-muted rounded px-1 py-0.5 text-sm">"use gpu"</code> functions
          that must be transformed at build time. Point the Angular application builder at
          <code class="bg-muted rounded px-1 py-0.5 text-sm">tools/typegpu.esbuild.ts</code>.
        </p>
        <app-code-block [code]="esbuildPlugin" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">3. Copy the components</h2>
        <p class="text-muted-foreground">
          Copy <code class="bg-muted rounded px-1 py-0.5 text-sm">src/components/orbs</code> into your
          app and add a path alias for <code class="bg-muted rounded px-1 py-0.5 text-sm">@/*</code>.
          Each orb needs the shared runtime (<code class="bg-muted rounded px-1 py-0.5 text-sm">renderer.ts</code>,
          <code class="bg-muted rounded px-1 py-0.5 text-sm">shader-orb.ts</code>,
          <code class="bg-muted rounded px-1 py-0.5 text-sm">canvas.ts</code>,
          <code class="bg-muted rounded px-1 py-0.5 text-sm">orb-base.ts</code>) plus that orb's folder.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">4. Use it</h2>
        <app-code-block [code]="usage" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">5. Microphone drive (shaderng original)</h2>
        <p class="text-muted-foreground">
          shadercn feeds voice levels as <code class="bg-muted rounded px-1 py-0.5 text-sm">volumes</code>.
          shaderng adds a microphone listener that writes those volumes for you:
        </p>
        <app-code-block [code]="listenSnippet" />
      </section>
    </article>
  `,
})
export class InstallationPage {
  protected readonly site = SITE;
  protected readonly installDeps = `npm i vgpu typegpu
npm i -D unplugin-typegpu @babel/core @babel/preset-typescript @webgpu/types @angular-builders/custom-esbuild`;
  protected readonly esbuildPlugin = `"builder": "@angular-builders/custom-esbuild:application",
"options": {
  "plugins": ["tools/typegpu.esbuild.ts"]
}`;
  protected readonly usage = `import { Orb01 } from "@/components/orbs/orb-01";

@Component({
  imports: [Orb01],
  template: \`<orb-01 [size]="280" state="idle" />\`,
})
export class Hero {}`;
  protected readonly listenSnippet = `<orb-01 state="speaking" [listen]="true" />`;
}
