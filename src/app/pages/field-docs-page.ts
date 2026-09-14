import { Component, computed, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { map } from "rxjs";

import { FieldPreview } from "@/app/orbs/field-preview";
import { CodeBlock } from "@/app/ui/code-block";
import type { OrbVariant } from "@/components/orbs/renderer";
import { FIELD_CATALOG_MAP, isFieldSlug } from "@/lib/field-catalog";
import { loadField } from "@/lib/field-loaders";
import { fieldInstallCommand, ngGenerateFieldCommand } from "@/lib/snippet";

const classNameFor = (slug: string): string =>
  `Field${slug.slice(0, 1).toUpperCase()}${slug.slice(1)}`;

@Component({
  selector: "app-field-docs-page",
  imports: [FieldPreview, CodeBlock, RouterLink],
  template: `
    @if (item(); as field) {
      <article class="mx-auto max-w-3xl space-y-8">
        <p class="text-muted-foreground text-sm">
          <a routerLink="/docs/fields" class="hover:text-foreground">Fields</a>
          <span class="mx-1">/</span>
          {{ field.title }}
        </p>
        <div>
          <p class="text-muted-foreground text-sm">{{ field.name }}</p>
          <h1 class="text-3xl font-semibold tracking-tight">{{ field.title }}</h1>
          <p class="text-muted-foreground mt-2 text-lg capitalize">{{ field.description }}</p>
        </div>

        <app-field-preview className="min-h-[24rem]" [slug]="field.slug" />

        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-muted-foreground"
            >Move pointer over canvas to test responsiveness.</span
          >
          <a
            [routerLink]="['/playground']"
            [queryParams]="{ field: field.slug }"
            class="inline-flex items-center gap-1.5 rounded-md border bg-background hover:bg-muted px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <span>Open in Playground</span>
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

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">Install</h2>
          <p class="text-muted-foreground text-sm">
            After
            <code class="bg-muted rounded px-1 py-0.5">ng add shaderng</code> (see the
            <a class="text-foreground underline underline-offset-4" routerLink="/docs/installation"
              >installation guide</a
            >). Original to shaderng, MIT — usable commercially, unlike the orb shaders.
          </p>
          <app-code-block [code]="install()" />
          <p class="text-muted-foreground text-sm">Or fetch the folder directly with degit:</p>
          <app-code-block [code]="installDegit()" />
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">Usage</h2>
          <p class="text-muted-foreground text-sm">
            The host is absolutely positioned, like
            <code class="bg-muted rounded px-1 py-0.5">&lt;shader-background&gt;</code>. Give the
            parent <code class="bg-muted rounded px-1 py-0.5">position: relative</code> and a
            height, and put content on top with its own stacking.
          </p>
          <app-code-block [code]="usage()" />
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">Pointer and voice</h2>
          <p class="text-muted-foreground text-sm">
            The runtime follows the pointer over the window (so it still works with
            <code class="bg-muted rounded px-1 py-0.5">pointer-events: none</code>) and eases it
            into the shader as <code class="bg-muted rounded px-1 py-0.5">mouse</code>.
            <code class="bg-muted rounded px-1 py-0.5">[audio]</code> /
            <code class="bg-muted rounded px-1 py-0.5">[listen]</code> drive the same volumes the
            orbs use. Pass <code class="bg-muted rounded px-1 py-0.5">[mouse]</code> yourself to
            override tracking.
          </p>
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

          <section class="space-y-3">
            <h2 class="text-xl font-semibold">Colors and themes</h2>
            <p class="text-muted-foreground text-sm">
              Fields automatically adapt to your application's light or dark mode via
              <code class="bg-muted rounded px-1 py-0.5">theme="auto"</code> (default), or can be
              locked with <code class="bg-muted rounded px-1 py-0.5">[theme]="'light'"</code> or
              <code class="bg-muted rounded px-1 py-0.5">[theme]="'dark'"</code>. Override any color
              via <code class="bg-muted rounded px-1 py-0.5">colors</code>.
            </p>
            <div class="overflow-x-auto rounded-xl border">
              <table class="w-full text-left text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="px-3 py-2 font-medium">Color key</th>
                    <th class="px-3 py-2 font-medium">Role</th>
                    <th class="px-3 py-2 font-medium">Dark default</th>
                    <th class="px-3 py-2 font-medium">Light default</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of v.colors; track c.key) {
                    <tr class="border-t">
                      <td class="px-3 py-2 font-mono text-xs">{{ c.key }}</td>
                      <td class="px-3 py-2">{{ c.label }}</td>
                      <td class="px-3 py-2 font-mono text-xs">
                        <span class="inline-flex items-center gap-1.5">
                          <span
                            class="inline-block size-3 rounded-full border border-border/80"
                            [style.background-color]="v.themeColors?.dark?.[c.key] ?? c.default"
                          ></span>
                          <span>{{ v.themeColors?.dark?.[c.key] ?? c.default }}</span>
                        </span>
                      </td>
                      <td class="px-3 py-2 font-mono text-xs">
                        <span class="inline-flex items-center gap-1.5">
                          <span
                            class="inline-block size-3 rounded-full border border-border/80"
                            [style.background-color]="v.themeColors?.light?.[c.key] ?? c.default"
                          ></span>
                          <span>{{ v.themeColors?.light?.[c.key] ?? c.default }}</span>
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      </article>
    } @else {
      <p class="text-muted-foreground">Unknown field.</p>
    }
  `,
})
export class FieldDocsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get("slug") ?? "")),
    { initialValue: this.route.snapshot.paramMap.get("slug") ?? "" },
  );

  protected readonly variant = signal<OrbVariant | null>(null);

  protected readonly item = computed(() => {
    const slug = this.slug();
    return isFieldSlug(slug) ? FIELD_CATALOG_MAP[slug] : null;
  });

  protected readonly usage = computed(() => {
    const slug = this.item()?.slug ?? "aurora";
    const className = classNameFor(slug);
    return `import { ${className} } from "@/components/fields/${slug}";

@Component({
  imports: [${className}],
  template: \`
    <section class="relative h-80">
      <field-${slug} state="thinking" />
      <h1 class="relative">Hello</h1>
    </section>
  \`,
})
export class Hero {}`;
  });

  protected readonly install = computed(() =>
    ngGenerateFieldCommand(this.item()?.slug ?? "aurora"),
  );
  protected readonly installDegit = computed(() =>
    fieldInstallCommand(this.item()?.slug ?? "aurora"),
  );

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      let cancelled = false;
      this.variant.set(null);
      if (!isFieldSlug(slug)) {
        return;
      }
      void loadField(slug)
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
