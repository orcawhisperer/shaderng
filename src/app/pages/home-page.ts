import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { HomeShowcase } from "@/app/orbs/home-showcase";
import { CloneOptions } from "@/app/ui/clone-options";
import { CopyButton } from "@/app/ui/copy-button";
import { LogoMark } from "@/app/ui/logo-mark";
import { auroraField } from "@/components/fields/aurora";
import { causticsField } from "@/components/fields/caustics";
import { cyberField } from "@/components/fields/cyber";
import { flowField } from "@/components/fields/flow";
import { gridField } from "@/components/fields/grid";
import { nebulaField } from "@/components/fields/nebula";
import { warpField } from "@/components/fields/warp";
import { wavesField } from "@/components/fields/waves";
import type { OrbVariant } from "@/components/orbs/canvas";
import { ShaderBackground } from "@/components/orbs/shader-background";
import { SITE } from "@/lib/site";
import { ngAddCommand } from "@/lib/snippet";

@Component({
  selector: "app-home-page",
  imports: [HomeShowcase, CloneOptions, CopyButton, LogoMark, RouterLink, ShaderBackground],
  template: `
    <section class="container-wrapper relative overflow-hidden">
      <shader-background [variant]="activeHeroVariant()" fit="fill" state="thinking" />
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
          <code class="text-foreground font-mono">ng add</code> away.
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
            class="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-4 text-sm font-medium shadow-xs"
          >
            Get Started
          </a>
          <a
            routerLink="/playground"
            class="hover:bg-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors"
          >
            Playground
          </a>
          <a
            routerLink="/docs/fields"
            class="hover:bg-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors"
          >
            Fields (MIT)
          </a>
          <a
            routerLink="/docs/credits"
            class="hover:bg-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors"
          >
            Credits
          </a>
        </div>

        <div class="mt-4 flex items-center justify-center">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-md shadow-xs transition-colors"
          >
            <span class="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-medium text-foreground">Background:</span>
            <select
              class="bg-transparent font-medium text-foreground cursor-pointer focus:outline-none text-xs"
              [value]="activeHero()"
              (change)="activeHero.set($any($event.target).value)"
            >
              @for (key of heroKeys; track key) {
                <option [value]="key" class="bg-background text-foreground">
                  {{ heroOptions[key].label }}
                </option>
              }
            </select>
            <span class="text-border">|</span>
            <a
              routerLink="/playground"
              [queryParams]="{ field: activeHero() }"
              class="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>Customize</span>
              <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
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

  protected readonly heroOptions: Record<string, { label: string; variant: OrbVariant }> = {
    aurora: { label: "Aurora", variant: auroraField },
    cyber: { label: "Cyber 3D", variant: cyberField },
    nebula: { label: "Cosmic Nebula", variant: nebulaField },
    warp: { label: "Hyperspace Warp", variant: warpField },
    waves: { label: "Waves", variant: wavesField },
    caustics: { label: "Caustics", variant: causticsField },
    flow: { label: "Flow", variant: flowField },
    grid: { label: "Grid", variant: gridField },
  };

  protected readonly heroKeys = Object.keys(this.heroOptions);
  protected readonly activeHero = signal("aurora");
  protected readonly activeHeroVariant = computed(
    () => this.heroOptions[this.activeHero()].variant,
  );

  protected readonly originals = [
    {
      title: "ng add",
      description:
        "ng add shaderng installs the runtime, wires the TypeGPU esbuild plugin and copies the orbs you pick. ng g shaderng:orb adds more.",
    },
    {
      title: "8 MIT Field Shaders",
      description:
        "Original MIT shaders drawn for rectangles, not spheres. Cyber 3D grid, Cosmic Nebula, Hyperspace Warp, Aurora, and more fill any hero. Responsive to pointer tilt and voice.",
    },
    {
      title: "Universal Playground",
      description:
        "Interactive live playground supporting both 33 Orbs and 8 rectangular Fields. Tweak uniforms, tune colors, drive audio from microphone, and export HD wallpapers.",
    },
    {
      title: "Live Audio Reactive",
      description:
        "[audio] drives orb volumes from the microphone, a WebRTC or TTS stream, an <audio> element, or a Web Audio node with zero lag.",
    },
    {
      title: "Shared GPU Scene",
      description:
        "Single WebGPU device and unified requestAnimationFrame frame loop across all mounted shaders. Won't crash browser GPU device limits.",
    },
    {
      title: "Reduced Motion & A11y",
      description:
        "Shaders automatically pause when OS prefers-reduced-motion is active. Fully typed signals, OnPush zoneless change detection in Angular 22.",
    },
  ];
}
