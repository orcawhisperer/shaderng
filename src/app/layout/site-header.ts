import { Component, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { filter } from "rxjs";

import { ThemeService } from "@/lib/theme";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/components", label: "Components" },
  { href: "/playground", label: "Playground" },
];

@Component({
  selector: "app-site-header",
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="bg-background sticky top-0 z-50 w-full border-b border-border/60">
      <div class="container-wrapper px-4 xl:px-6">
        <div class="relative flex h-(--header-height) items-center gap-3">
          <a routerLink="/" class="flex items-center gap-2 font-semibold tracking-tight">
            <span
              class="bg-foreground text-background flex size-6 items-center justify-center rounded-md text-[11px] font-semibold"
              >ng</span
            >
            <span>shader<span class="text-muted-foreground font-normal">ng</span></span>
          </a>

          <nav class="ml-4 hidden items-center gap-1 lg:flex">
            @for (item of nav; track item.href) {
              <a
                [routerLink]="item.href"
                routerLinkActive="bg-muted text-foreground"
                [routerLinkActiveOptions]="{ exact: item.href === '/docs' }"
                class="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
              >
                {{ item.label }}
              </a>
            }
          </nav>

          <div class="ml-auto flex items-center gap-1">
            <button
              class="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md lg:hidden"
              type="button"
              (click)="menuOpen.set(!menuOpen())"
              [attr.aria-expanded]="menuOpen()"
              [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'"
            >
              @if (menuOpen()) {
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              } @else {
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            </button>
            <a
              class="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
              href="https://github.com/shadcn-labs/shadercn"
              rel="noreferrer"
              target="_blank"
            >
              shadercn
            </a>
            <a
              class="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
              [href]="github"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <button
              class="hover:bg-muted size-8 rounded-md"
              type="button"
              (click)="theme.toggle()"
              [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (theme.theme() === "dark") {
                <svg class="mx-auto size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 3v1m0 16v1m8.66-9.66-.7.7M4.04 4.04l-.7.7M21 12h-1M4 12H3m16.66 4.66-.7-.7M4.04 19.96l-.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              } @else {
                <svg class="mx-auto size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              }
            </button>
          </div>
        </div>
      </div>
      @if (menuOpen()) {
        <nav class="border-border bg-background border-t px-4 py-3 lg:hidden">
          <div class="flex flex-col gap-1">
            @for (item of nav; track item.href) {
              <a
                [routerLink]="item.href"
                routerLinkActive="bg-muted text-foreground"
                [routerLinkActiveOptions]="{ exact: item.href === '/docs' }"
                class="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm"
                (click)="menuOpen.set(false)"
              >
                {{ item.label }}
              </a>
            }
          </div>
        </nav>
      }
    </header>
  `,
})
export class SiteHeader {
  protected readonly nav = NAV;
  protected readonly theme = inject(ThemeService);
  protected readonly menuOpen = signal(false);
  protected readonly github = SITE.github;

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}
