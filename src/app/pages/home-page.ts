import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { HomeShowcase } from "@/app/orbs/home-showcase";
import { CloneOptions } from "@/app/ui/clone-options";
import { CopyButton } from "@/app/ui/copy-button";
import { LogoMark } from "@/app/ui/logo-mark";
import { SITE } from "@/lib/site";

@Component({
  selector: "app-home-page",
  imports: [HomeShowcase, CloneOptions, CopyButton, LogoMark, RouterLink],
  template: `
    <section class="container-wrapper relative">
      <div class="container flex flex-col items-center gap-4 py-16 text-center md:py-20 lg:py-24">
        <app-logo-mark className="size-12" />
        <p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Angular · WebGPU · TypeGPU
        </p>
        <h1 class="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Beautiful shaders, in Angular
        </h1>
        <p class="text-muted-foreground max-w-2xl text-lg sm:text-xl">
          {{ site.name }} is a copy-paste WebGPU orb kit for Angular.
          <br class="hidden sm:block" />
          GPU programs from
          <a class="text-foreground underline underline-offset-4" [href]="site.original" rel="noreferrer" target="_blank">{{ site.originalName }}</a>,
          based on
          <a class="text-foreground underline underline-offset-4" [href]="site.xordev" rel="noreferrer" target="_blank">XorDev</a>.
        </p>

        <div class="bg-code text-code-foreground relative mt-4 w-full max-w-xl overflow-hidden rounded-lg text-left text-sm">
          <pre class="px-4 py-3.5 font-mono">
            <code class="text-muted-foreground">
              <span class="select-none">$ </span>npm i vgpu typegpu
            </code>
          </pre>
          <app-copy-button
            className="absolute top-2 right-2 size-7 px-0"
            label="Copy install command"
            value="npm i vgpu typegpu"
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
      <div class="container mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
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
  protected readonly originals = [
    {
      title: "Listen",
      description: "A [listen] input drives orb volumes from the microphone. shadercn does not have this.",
    },
    {
      title: "Angular TypeGPU",
      description: "gpu.ts is transformed in the Angular esbuild pipeline, which otherwise swallows unplugin-typegpu.",
    },
    {
      title: "Reduced motion",
      description: "Orbs pause when the OS asks for prefers-reduced-motion, unless you are using Listen.",
    },
  ];
}
