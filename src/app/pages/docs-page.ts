import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-docs-page",
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-3xl space-y-6">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Introduction</h1>
      <p class="text-muted-foreground text-lg">
        GPU-powered shader components for Angular. Built on
        <a class="text-foreground underline underline-offset-4" href="https://vgpu.labs.vercel.dev/" rel="noreferrer" target="_blank">vgpu</a>
        and
        <a class="text-foreground underline underline-offset-4" href="https://typegpu.com/" rel="noreferrer" target="_blank">TypeGPU</a>,
        ported from
        <a class="text-foreground underline underline-offset-4" href="https://github.com/shadcn-labs/shadercn" rel="noreferrer" target="_blank">shadercn</a>.
      </p>
      <p>
        <strong>shadercn-angular</strong> follows the same copy-paste model as shadercn: you own the
        shader source. Each orb is a standalone Angular component with typed inputs for uniforms,
        colors, and the idle / thinking / speaking drive states.
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
        <a routerLink="/docs/installation" class="underline underline-offset-4">installation</a>
        or jump into the
        <a routerLink="/playground" class="underline underline-offset-4">playground</a>.
      </p>
    </article>
  `,
})
export class DocsPage {
  protected readonly features = [
    {
      title: "Zero config",
      description: "Drop an orb into a template and it renders on WebGPU with sensible defaults.",
    },
    {
      title: "Typed inputs",
      description: "Every visual parameter is an Angular input — size, state, params, and colors.",
    },
    {
      title: "Own the code",
      description: "Copy the orb folder into your project. No runtime lock-in beyond vgpu and TypeGPU.",
    },
    {
      title: "33 orbs",
      description: "The full shadercn orb set, from Dispersion to Abyss, with the original GPU shaders.",
    },
  ];
}
