import { Component, computed, effect, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { CodeBlock } from "@/app/ui/code-block";
import { ShaderBackground, type ShaderBackgroundFit } from "@/components/orbs/canvas";
import type { OrbState, OrbVariant } from "@/components/orbs/renderer";
import { ORB_CATALOG, type OrbSlug } from "@/lib/orb-catalog";
import { loadOrb } from "@/lib/orb-loaders";

@Component({
  selector: "app-background-page",
  imports: [CodeBlock, RouterLink, ShaderBackground],
  template: `
    <article class="mx-auto max-w-3xl space-y-8">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Background</h1>
      <p class="text-muted-foreground text-lg">
        <code class="bg-muted rounded px-1 py-0.5 text-base">&lt;shader-background&gt;</code> puts
        any orb behind your content. It fills its positioned parent, crops or fits the orb to the
        box, and paints at 30 fps by default. Same inputs as the orbs, plus
        <code class="bg-muted rounded px-1 py-0.5 text-base">fit</code> and
        <code class="bg-muted rounded px-1 py-0.5 text-base">scale</code>.
      </p>

      <section
        class="relative flex h-72 flex-col items-center justify-center overflow-hidden rounded-xl border text-center sm:h-80"
      >
        @if (variant(); as current) {
          <shader-background
            [variant]="current"
            [fit]="fit()"
            [scale]="scale()"
            [state]="state()"
          />
        }
        <p class="relative text-2xl font-semibold tracking-tight sm:text-3xl">Text sits on top.</p>
        <p class="text-muted-foreground relative mt-1 text-sm">
          The orb keeps rendering underneath; nothing here is an image.
        </p>
      </section>

      <div class="grid gap-3 text-sm sm:grid-cols-4">
        <label class="flex flex-col gap-1">
          <span class="text-muted-foreground">Orb</span>
          <select
            class="bg-background h-9 rounded-md border px-2"
            (change)="slug.set($any($event.target).value)"
          >
            @for (item of catalog; track item.slug) {
              <option [value]="item.slug" [selected]="item.slug === slug()">
                {{ item.title }} · {{ item.name }}
              </option>
            }
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-muted-foreground">State</span>
          <select
            class="bg-background h-9 rounded-md border px-2"
            [value]="state()"
            (change)="state.set($any($event.target).value)"
          >
            <option value="idle">idle</option>
            <option value="thinking">thinking</option>
            <option value="speaking">speaking</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-muted-foreground">Fit</span>
          <select
            class="bg-background h-9 rounded-md border px-2"
            [value]="fit()"
            (change)="fit.set($any($event.target).value)"
          >
            <option value="cover">cover</option>
            <option value="contain">contain</option>
            <option value="fill">fill</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-muted-foreground">Scale {{ scale() }}</span>
          <input
            class="h-9"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            [value]="scale()"
            (input)="scale.set(+$any($event.target).value)"
          />
        </label>
      </div>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Usage</h2>
        <p class="text-muted-foreground">
          Pass the orb's variant object, exported next to each component. The parent needs
          <code class="bg-muted rounded px-1 py-0.5 text-sm">position: relative</code> and content
          above it needs its own stacking (<code class="bg-muted rounded px-1 py-0.5 text-sm"
            >relative</code
          >
          is enough).
        </p>
        <app-code-block [code]="usage()" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Inputs</h2>
        <div class="overflow-x-auto rounded-xl border">
          <table class="w-full text-left text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-3 py-2 font-medium">Input</th>
                <th class="px-3 py-2 font-medium">Default</th>
                <th class="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (row of inputs; track row.name) {
                <tr class="border-t">
                  <td class="px-3 py-2 font-mono text-xs">{{ row.name }}</td>
                  <td class="px-3 py-2 font-mono text-xs">{{ row.default }}</td>
                  <td class="text-muted-foreground px-3 py-2">{{ row.notes }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-muted-foreground text-sm">
          Everything an orb accepts also works here:
          <code class="bg-muted rounded px-1 py-0.5">state</code>,
          <code class="bg-muted rounded px-1 py-0.5">params</code>,
          <code class="bg-muted rounded px-1 py-0.5">colors</code>,
          <code class="bg-muted rounded px-1 py-0.5">audio</code> /
          <code class="bg-muted rounded px-1 py-0.5">listen</code>,
          <code class="bg-muted rounded px-1 py-0.5">preset</code>, the fallback template. See any
          <a class="text-foreground underline underline-offset-4" routerLink="/docs/components"
            >component page</a
          >
          for the full table. Rectangular fields live under
          <a class="text-foreground underline underline-offset-4" routerLink="/docs/fields"
            >/docs/fields</a
          >
          and already wrap this component with
          <code class="bg-muted rounded px-1 py-0.5">fit="fill"</code>.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">As a block</h2>
        <p class="text-muted-foreground">
          The host is absolutely positioned so it disappears behind a hero with no extra markup. To
          use it as a normal block, give it a position and a height:
        </p>
        <app-code-block [code]="blockCss" />
      </section>
    </article>
  `,
})
export class BackgroundPage {
  protected readonly catalog = ORB_CATALOG;
  protected readonly slug = signal<OrbSlug>("orb-12");
  protected readonly state = signal<OrbState>("thinking");
  protected readonly fit = signal<ShaderBackgroundFit>("cover");
  protected readonly scale = signal(1);
  protected readonly variant = signal<OrbVariant | null>(null);

  protected readonly inputs = [
    { name: "variant", default: "required", notes: "The orb to draw, e.g. orb12Orb." },
    {
      name: "fit",
      default: '"cover"',
      notes:
        "cover fills the box and crops the orb; contain fits the whole orb; fill gives the shader the whole rectangle (fields).",
    },
    {
      name: "scale",
      default: "1",
      notes: "Zoom on top of fit. 1.4 pushes the rim past the edges.",
    },
    { name: "maxFps", default: "30", notes: "Paint cap. 0 paints every frame like an orb does." },
    {
      name: "pauseOffscreen",
      default: "true",
      notes: "Stops painting while scrolled out of view.",
    },
  ];

  protected readonly usage = computed(() => {
    const slug = this.slug();
    const name = `orb${slug.slice(-2)}Orb`;
    const fit = this.fit() === "cover" ? "" : `\n      fit="${this.fit()}"`;
    const scale = this.scale() === 1 ? "" : `\n      [scale]="${this.scale()}"`;
    return `import { ${name} } from "@/components/orbs/${slug}";
import { ShaderBackground } from "@/components/orbs/shader-background";

@Component({
  imports: [ShaderBackground],
  template: \`
    <section class="relative">
      <shader-background [variant]="orb" state="${this.state()}"${fit}${scale} />
      <h1 class="relative">Hello</h1>
    </section>
  \`,
})
export class Hero {
  protected readonly orb = ${name};
}`;
  });

  protected readonly blockCss = `shader-background {
  position: relative;
  height: 320px;
}`;

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      let stale = false;
      void loadOrb(slug).then((entry) => {
        if (!stale) {
          this.variant.set(entry.variant);
        }
      });
      onCleanup(() => {
        stale = true;
      });
    });
  }
}
