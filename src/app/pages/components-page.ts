import { Component } from "@angular/core";
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
      <div class="grid gap-3 sm:grid-cols-2">
        @for (orb of catalog; track orb.slug) {
          <a
            class="hover:bg-muted/40 rounded-xl border p-4 transition-colors"
            [routerLink]="['/docs/components', orb.slug]"
          >
            <div class="flex items-baseline justify-between gap-2">
              <h2 class="font-medium">{{ orb.title }}</h2>
              <span class="text-muted-foreground text-xs">{{ orb.name }}</span>
            </div>
            <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{{ orb.description }}</p>
          </a>
        }
      </div>
    </article>
  `,
})
export class ComponentsPage {
  protected readonly catalog = ORB_CATALOG;
}
