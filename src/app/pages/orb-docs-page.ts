import { Component, computed, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { map } from "rxjs";

import { OrbPreview } from "@/app/orbs/orb-preview";
import type { OrbVariant } from "@/components/orbs/renderer";
import { ORB_CATALOG_MAP, ORB_SLUGS, type OrbSlug } from "@/lib/orb-catalog";
import { loadOrb } from "@/lib/orb-loaders";

@Component({
  selector: "app-orb-docs-page",
  imports: [OrbPreview, RouterLink],
  template: `
    @if (item(); as orb) {
      <article class="mx-auto max-w-3xl space-y-8">
        <p class="text-muted-foreground text-sm">
          <a routerLink="/docs/components" class="hover:text-foreground">Components</a>
          <span class="mx-1">/</span>
          Orbs
        </p>
        <div>
          <p class="text-muted-foreground text-sm">{{ orb.name }}</p>
          <h1 class="text-3xl font-semibold tracking-tight">{{ orb.title }}</h1>
          <p class="text-muted-foreground mt-2 text-lg capitalize">{{ orb.description }}</p>
        </div>

        <app-orb-preview [slug]="orb.slug" />

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">Usage</h2>
          <pre class="bg-code overflow-x-auto rounded-lg p-4 font-mono text-sm"><code>import {{ '{' }} {{ className() }} {{ '}' }} from "@/components/orbs/{{ orb.slug }}";

&#64;Component({{ '{' }}
  imports: [{{ className() }}],
  template: \`&lt;{{ orb.slug }} [size]="280" state="idle" /&gt;\`,
{{ '}' }})
export class Example {{ '{' }}{{ '}' }}</code></pre>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">Component inputs</h2>
          <div class="overflow-x-auto rounded-xl border">
            <table class="w-full text-left text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-3 py-2 font-medium">Input</th>
                  <th class="px-3 py-2 font-medium">Type</th>
                  <th class="px-3 py-2 font-medium">Default</th>
                </tr>
              </thead>
              <tbody>
                @for (row of componentInputs; track row.name) {
                  <tr class="border-t">
                    <td class="px-3 py-2 font-mono text-xs">{{ row.name }}</td>
                    <td class="text-muted-foreground px-3 py-2">{{ row.type }}</td>
                    <td class="text-muted-foreground px-3 py-2">{{ row.fallback }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        @if (variant(); as v) {
          <section class="space-y-3">
            <h2 class="text-xl font-semibold">Shader params</h2>
            <p class="text-muted-foreground text-sm">
              Pass any of these through <code class="bg-muted rounded px-1 py-0.5">params</code>.
            </p>
            <div class="overflow-x-auto rounded-xl border">
              <table class="w-full text-left text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="px-3 py-2 font-medium">Param</th>
                    <th class="px-3 py-2 font-medium">Label</th>
                    <th class="px-3 py-2 font-medium">Range</th>
                    <th class="px-3 py-2 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of v.params; track p.key) {
                    <tr class="border-t">
                      <td class="px-3 py-2 font-mono text-xs">{{ p.key }}</td>
                      <td class="px-3 py-2">{{ p.label }}</td>
                      <td class="text-muted-foreground px-3 py-2">{{ p.min }} – {{ p.max }}</td>
                      <td class="text-muted-foreground px-3 py-2">{{ p.default }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <p class="text-muted-foreground text-sm">
          Based on original work by
          <a class="text-foreground underline underline-offset-4" href="https://x.com/XorDev" rel="noreferrer" target="_blank">XorDev</a>.
        </p>
      </article>
    } @else {
      <p class="text-muted-foreground">Unknown orb.</p>
    }
  `,
})
export class OrbDocsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get("slug") ?? "")),
    { initialValue: this.route.snapshot.paramMap.get("slug") ?? "" },
  );

  protected readonly variant = signal<OrbVariant | null>(null);

  protected readonly item = computed(() => {
    const slug = this.slug();
    return ORB_SLUGS.includes(slug as OrbSlug) ? ORB_CATALOG_MAP[slug as OrbSlug] : null;
  });

  protected readonly className = computed(() => `Orb${(this.item()?.slug ?? "orb-01").slice(-2)}`);

  protected readonly componentInputs = [
    { name: "state", type: '"idle" | "thinking" | "speaking"', fallback: '"idle"' },
    { name: "size", type: "number", fallback: "280" },
    { name: "params", type: "Partial<Record<string, number>>", fallback: "—" },
    { name: "colors", type: "Partial<Record<string, string>>", fallback: "—" },
    { name: "listen", type: "boolean", fallback: "false" },
    { name: "paused", type: "boolean", fallback: "false" },
    { name: "pauseOffscreen", type: "boolean", fallback: "true" },
    { name: "respectReducedMotion", type: "boolean", fallback: "true" },
    { name: "maxDpr", type: "number", fallback: "2" },
  ];

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      let cancelled = false;
      this.variant.set(null);
      void loadOrb(slug)
        .then((entry) => {
          if (!cancelled) {
            this.variant.set(entry.variant);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            console.error(`[shaderng] failed to load ${slug} docs`, error);
          }
        });
      onCleanup(() => {
        cancelled = true;
      });
    });
  }
}
