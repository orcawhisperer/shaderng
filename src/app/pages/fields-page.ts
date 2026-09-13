import { Component } from "@angular/core";
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
          the voice swells them. After
          <code class="bg-muted rounded px-1 py-0.5 text-base">ng add shaderng</code>, each one is
          <code class="bg-muted rounded px-1 py-0.5 text-base">ng g shaderng:field</code>.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        @for (field of catalog; track field.slug) {
          <div class="overflow-hidden rounded-xl border">
            <app-field-preview
              className="min-h-[14rem] rounded-none border-0"
              [slug]="field.slug"
            />
            <a
              class="hover:bg-muted/40 block border-t p-4 transition-colors"
              [routerLink]="['/docs/fields', field.slug]"
            >
              <div class="flex items-baseline justify-between gap-2">
                <h2 class="font-medium">{{ field.title }}</h2>
                <span class="text-muted-foreground text-xs">{{ field.name }}</span>
              </div>
              <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{{ field.description }}</p>
            </a>
          </div>
        }
      </div>

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
}
