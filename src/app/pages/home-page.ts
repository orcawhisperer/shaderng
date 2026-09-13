import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { HomeShowcase } from "@/app/orbs/home-showcase";
import { CloneOptions } from "@/app/ui/clone-options";
import { CopyButton } from "@/app/ui/copy-button";
import { LogoMark } from "@/app/ui/logo-mark";
import { auroraField } from "@/components/fields/aurora";
import { ShaderBackground } from "@/components/orbs/shader-background";
import { SITE } from "@/lib/site";
import { ngAddCommand } from "@/lib/snippet";

@Component({
  selector: "app-home-page",
  imports: [HomeShowcase, CloneOptions, CopyButton, LogoMark, RouterLink, ShaderBackground],
  template: `
    <section class="container-wrapper relative overflow-hidden">
      <shader-background [variant]="aurora" fit="fill" state="thinking" />
      <div
        class="from-background/80 via-background/70 to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
      ></div>
      <div
        class="relative container flex flex-col items-center gap-4 py-16 text-center md:py-20 lg:py-24"
      >
        <app-logo-mark className="size-12" />
        <p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Angular · WebGPU · TypeGPU
        </p>
        <h1 class="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Beautiful shaders, in Angular
        </h1>
        <p class="text-muted-foreground max-w-2xl text-lg sm:text-xl">
          {{ site.name }} is a WebGPU orb kit for Angular, one
          <code class="text-foreground">ng add</code> away.
          <br class="hidden sm:block" />
          GPU programs from
          <a
            class="text-foreground underline underline-offset-4"
            [href]="site.original"
            rel="noreferrer"
            target="_blank"
            >{{ site.originalName }}</a
          >, based on
          <a
            class="text-foreground underline underline-offset-4"
            [href]="site.xordev"
            rel="noreferrer"
            target="_blank"
            >XorDev</a
          >.
        </p>

        <div
          class="bg-code text-code-foreground relative mt-4 w-full max-w-xl overflow-hidden rounded-lg text-left text-sm"
        >
          <pre
            class="px-4 py-3.5 font-mono"
          ><code class="text-muted-foreground"><span class="select-none">$ </span>{{ ngAdd }}</code></pre>
          <app-copy-button
            className="absolute top-2 right-2 size-7 px-0"
            label="Copy install command"
            [value]="ngAdd"
          >
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </app-copy-button>
        </div>

        <div class="mt-4 w-full max-w-xl">
          <p class="text-muted-foreground mb-2 text-left text-sm">Clone the repo</p>
          <app-clone-options />
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a
            routerLink="/docs/installation"
            class="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
          >
            Get Started
          </a>
          <a
            routerLink="/docs/credits"
            class="hover:bg-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
          >
            Credits
          </a>
        </div>
      </div>
    </section>

    <section class="container-wrapper pb-8 lg:pb-12">
      <div class="container">
        <app-home-showcase />
      </div>
    </section>

    <section class="container-wrapper pb-16">
      <div class="container mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of originals; track item.title) {
          <div class="rounded-xl border p-4 text-left">
            <h2 class="font-medium">{{ item.title }}</h2>
            <p class="text-muted-foreground mt-1 text-sm">{{ item.description }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class HomePage {
  protected readonly site = SITE;
  protected readonly ngAdd = ngAddCommand();
  protected readonly aurora = auroraField;
  protected readonly originals = [
    {
      title: "ng add",
      description:
        "ng add shaderng installs the runtime, wires the TypeGPU esbuild plugin and copies the orbs you pick. ng g shaderng:orb adds more.",
    },
    {
      title: "Fields",
      description:
        "Five original MIT shaders drawn for rectangles, not spheres. <field-aurora> and friends fill a hero; the pointer leans them, the voice swells them. ng g shaderng:field.",
    },
    {
      title: "Backgrounds and presets",
      description:
        "<shader-background> puts any orb behind a hero at 30 fps. Save a playground look with --preset and bind it with [preset].",
    },
    {
      title: "Live audio",
      description:
        "[audio] drives orb volumes from the microphone, a WebRTC or TTS stream, an <audio> element, or a Web Audio node. shadercn does not have this.",
    },
    {
      title: "Angular TypeGPU",
      description:
        "gpu.ts is transformed in the Angular esbuild pipeline, which otherwise swallows unplugin-typegpu.",
    },
    {
      title: "Reduced motion",
      description:
        "Orbs pause when the OS asks for prefers-reduced-motion, unless you are using Listen.",
    },
    {
      title: "ng update",
      description:
        "The copied files are yours. shaderng.json records what was written, so an update refreshes untouched files and leaves your edits alone.",
    },
  ];
}
