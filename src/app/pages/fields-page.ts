import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { FieldPreview } from "@/app/orbs/field-preview";
import { FIELD_CATALOG } from "@/lib/field-catalog";

@Component({
  selector: "app-fields-page",
  imports: [FieldPreview, RouterLink],
  template: `
    <article class="mx-auto max-w-4xl space-y-8">
      <p class="text-muted-foreground text-sm">Docs</p>
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Fields</h1>
        <p class="text-muted-foreground mt-2 text-lg">
          Rectangular shaders, original to shaderng and MIT-licensed. They fill whatever box you
          give them — a hero, a page, a card — instead of drawing a sphere. The pointer leans them;
          the voice swells them. Every field features native light and dark mode palettes. After
          <code class="bg-muted rounded px-1 py-0.5 text-base">ng add shaderng</code>, each one is
          <code class="bg-muted rounded px-1 py-0.5 text-base">ng g shaderng:field</code>.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative flex-1 max-w-sm">
          <svg
            class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Filter fields (e.g. cyber, wave, grid)..."
            [value]="search()"
            (input)="onSearch($event)"
            class="bg-background h-9 w-full rounded-md border pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <span class="text-muted-foreground text-xs font-mono">
            {{ filteredCatalog().length }} of {{ catalog.length }}
          </span>
          <div class="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 transition-colors"
              [class.bg-background]="themeFilter() === 'auto'"
              [class.shadow-xs]="themeFilter() === 'auto'"
              (click)="themeFilter.set('auto')"
            >
              Auto
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 transition-colors"
              [class.bg-background]="themeFilter() === 'dark'"
              [class.shadow-xs]="themeFilter() === 'dark'"
              (click)="themeFilter.set('dark')"
            >
              🌙 Dark
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 transition-colors"
              [class.bg-background]="themeFilter() === 'light'"
              [class.shadow-xs]="themeFilter() === 'light'"
              (click)="themeFilter.set('light')"
            >
              ☀️ Light
            </button>
          </div>
        </div>
      </div>

      @if (filteredCatalog().length === 0) {
        <div class="rounded-xl border border-dashed p-8 text-center">
          <p class="text-muted-foreground text-sm">No fields matching "{{ search() }}".</p>
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (field of filteredCatalog(); track field.slug) {
            <div class="overflow-hidden rounded-xl border bg-card flex flex-col">
              <app-field-preview
                className="min-h-[15rem] rounded-none border-0"
                [slug]="field.slug"
                [theme]="themeFilter()"
              />
              <div class="flex flex-1 flex-col justify-between border-t p-4">
                <a
                  class="hover:opacity-80 transition-opacity block"
                  [routerLink]="['/docs/fields', field.slug]"
                >
                  <div class="flex items-baseline justify-between gap-2">
                    <h2 class="font-medium text-foreground text-base">{{ field.title }}</h2>
                    <span class="text-muted-foreground text-xs font-mono uppercase">{{
                      field.name
                    }}</span>
                  </div>
                  <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {{ field.description }}
                  </p>
                </a>
                <div
                  class="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs"
                >
                  <a
                    class="font-medium text-primary hover:underline"
                    [routerLink]="['/docs/fields', field.slug]"
                  >
                    View docs &rarr;
                  </a>
                  <a
                    class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
                    [routerLink]="['/playground']"
                    [queryParams]="{ field: field.slug }"
                  >
                    <span>Playground</span>
                    <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <p class="text-muted-foreground text-sm">
        Need a sphere behind content instead?
        <a class="text-foreground underline underline-offset-4" routerLink="/docs/background"
          >&lt;shader-background&gt;</a
        >
        still takes any orb, with <code class="bg-muted rounded px-1 py-0.5">fit="cover"</code>.
        Fields use <code class="bg-muted rounded px-1 py-0.5">fit="fill"</code> so the shader sees
        the whole rectangle.
      </p>
    </article>
  `,
})
export class FieldsPage {
  protected readonly catalog = FIELD_CATALOG;
  protected readonly search = signal("");
  protected readonly themeFilter = signal<"auto" | "light" | "dark">("auto");

  protected readonly filteredCatalog = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) {
      return this.catalog;
    }
    return this.catalog.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    );
  });

  protected onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
