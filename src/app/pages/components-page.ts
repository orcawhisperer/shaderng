import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { ORB_CATALOG } from "@/lib/orb-catalog";

@Component({
  selector: "app-components-page",
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-4xl space-y-6">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Components</h1>
      <p class="text-muted-foreground text-lg">
        {{ catalog.length }} GPU-powered animated orbs. Open any orb for a live preview, inputs, and
        copy-paste usage. After
        <code class="bg-muted rounded px-1 py-0.5 text-base">ng add shaderng</code>, each one is a
        single <code class="bg-muted rounded px-1 py-0.5 text-base">ng g shaderng:orb</code> away.
        Rectangular, MIT-licensed backgrounds live under
        <a class="text-foreground underline underline-offset-4" routerLink="/docs/fields">fields</a
        >.
      </p>

      <!-- Instant Filter Bar -->
      <div class="relative">
        <input
          type="search"
          placeholder="Filter orbs by name, number, or style (e.g. '07', 'dispersion', 'glow')..."
          class="w-full rounded-lg border bg-background px-4 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
        />
        @if (search()) {
          <span class="absolute right-3 top-2.5 text-xs text-muted-foreground">
            {{ filtered().length }} matching
          </span>
        }
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        @for (orb of filtered(); track orb.slug) {
          <a
            class="hover:bg-muted/40 rounded-xl border p-4 transition-colors"
            [routerLink]="['/docs/components', orb.slug]"
          >
            <div class="flex items-baseline justify-between gap-2">
              <h2 class="font-medium">{{ orb.title }}</h2>
              <span class="text-muted-foreground text-xs font-mono">{{ orb.name }}</span>
            </div>
            <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{{ orb.description }}</p>
          </a>
        } @empty {
          <div class="col-span-2 py-8 text-center text-muted-foreground text-sm">
            No orbs match "{{ search() }}".
          </div>
        }
      </div>
    </article>
  `,
})
export class ComponentsPage {
  protected readonly catalog = ORB_CATALOG;
  protected readonly search = signal("");

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) {
      return this.catalog;
    }
    return this.catalog.filter(
      (orb) =>
        orb.title.toLowerCase().includes(q) ||
        orb.name.toLowerCase().includes(q) ||
        orb.slug.toLowerCase().includes(q) ||
        orb.description.toLowerCase().includes(q),
    );
  });
}
