import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { SITE } from "@/lib/site";

@Component({
  selector: "app-docs-page",
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-3xl space-y-6">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Introduction</h1>
      <p class="text-muted-foreground text-lg">
        {{ site.name }} is GPU-powered shader components for Angular. Built on
        <a
          class="text-foreground underline underline-offset-4"
          [href]="site.vgpu"
          rel="noreferrer"
          target="_blank"
          >vgpu</a
        >
        and
        <a
          class="text-foreground underline underline-offset-4"
          [href]="site.typegpu"
          rel="noreferrer"
          target="_blank"
          >TypeGPU</a
        >, ported from
        <a
          class="text-foreground underline underline-offset-4"
          [href]="site.original"
          rel="noreferrer"
          target="_blank"
          >{{ site.originalName }}</a
        >.
      </p>
      <p>
        Same copy-paste model as shadercn: you own the shader source. Each orb is a standalone
        Angular component with typed inputs for uniforms, colors, idle / thinking / speaking, and
        shaderng’s microphone
        <code class="bg-muted rounded px-1 py-0.5 text-sm">listen</code> input.
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        @for (item of features; track item.title) {
          <div class="rounded-xl border p-4">
            <h2 class="font-medium">{{ item.title }}</h2>
            <p class="text-muted-foreground mt-1 text-sm">{{ item.description }}</p>
          </div>
        }
      </div>
      <p>
        Start with
        <a routerLink="/docs/installation" class="underline underline-offset-4">installation</a>,
        read <a routerLink="/docs/credits" class="underline underline-offset-4">credits</a>, or open
        the <a routerLink="/playground" class="underline underline-offset-4">playground</a>.
      </p>
    </article>
  `,
})
export class DocsPage {
  protected readonly site = SITE;
  protected readonly features = [
    {
      title: "Zero config",
      description: "Drop an orb into a template and it renders on WebGPU with sensible defaults.",
    },
    {
      title: "Typed inputs",
      description:
        "Every visual parameter is an Angular input — size, state, params, colors, and listen.",
    },
    {
      title: "Own the code",
      description:
        "Copy the orb folder into your project. No runtime lock-in beyond vgpu and TypeGPU.",
    },
    {
      title: "33 orbs",
      description:
        "The full shadercn orb set, from Dispersion to Abyss, with the original GPU shaders.",
    },
  ];
}
