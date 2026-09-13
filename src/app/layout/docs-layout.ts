import { NgTemplateOutlet } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

import { ORB_CATALOG } from "@/lib/orb-catalog";

@Component({
  selector: "app-docs-layout",
  imports: [NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="container-wrapper px-4 xl:px-6">
      <div class="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <details class="border-border bg-card mb-6 rounded-xl border lg:hidden">
          <summary class="cursor-pointer px-4 py-3 text-sm font-medium">Browse docs</summary>
          <div class="border-border max-h-[50vh] overflow-y-auto border-t px-2 py-3">
            <ng-container [ngTemplateOutlet]="docsNav" />
          </div>
        </details>
        <aside
          class="no-scrollbar hidden h-[calc(100svh-var(--header-height))] overflow-y-auto py-8 lg:sticky lg:top-(--header-height) lg:block"
        >
          <ng-container [ngTemplateOutlet]="docsNav" />
        </aside>
        <div class="min-w-0 py-8 lg:py-10">
          <router-outlet />
        </div>
      </div>
    </div>

    <ng-template #docsNav>
      <nav class="flex flex-col gap-6 pr-4 text-sm">
        <div>
          <p class="mb-2 text-xs font-medium tracking-wide uppercase">Get started</p>
          <div class="flex flex-col gap-1">
            @for (item of intro; track item.href) {
              <a
                [routerLink]="item.href"
                routerLinkActive="bg-muted text-foreground"
                [routerLinkActiveOptions]="{ exact: true }"
                class="text-muted-foreground hover:text-foreground rounded-md px-2 py-1.5"
              >
                {{ item.label }}
              </a>
            }
          </div>
        </div>
        <div>
          <p class="mb-2 text-xs font-medium tracking-wide uppercase">Orbs</p>
          <div class="flex flex-col gap-0.5">
            @for (orb of orbs; track orb.slug) {
              <a
                [routerLink]="['/docs/components', orb.slug]"
                routerLinkActive="bg-muted text-foreground"
                class="text-muted-foreground hover:text-foreground rounded-md px-2 py-1.5"
              >
                {{ orb.title }}
                <span class="text-muted-foreground/70 ml-1 text-xs">{{ orb.name }}</span>
              </a>
            }
          </div>
        </div>
      </nav>
    </ng-template>
  `,
})
export class DocsLayout {
  protected readonly intro = [
    { href: "/docs", label: "Introduction" },
    { href: "/docs/installation", label: "Installation" },
    { href: "/docs/components", label: "Components" },
    { href: "/docs/background", label: "Background" },
    { href: "/docs/changelog", label: "Changelog" },
    { href: "/docs/credits", label: "Credits" },
  ];
  protected readonly orbs = ORB_CATALOG;
}
