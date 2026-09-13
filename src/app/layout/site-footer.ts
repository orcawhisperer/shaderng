import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { SITE } from "@/lib/site";

@Component({
  selector: "app-site-footer",
  imports: [RouterLink],
  template: `
    <footer class="border-t border-border/60">
      <div class="container-wrapper px-4 xl:px-6">
        <div class="text-muted-foreground flex min-h-14 flex-col items-center justify-center gap-1 py-6 text-center text-xs leading-loose sm:text-sm">
          <p>
            {{ site.name }} is an unofficial Angular port of
            <a
              class="text-foreground mx-1 font-medium underline underline-offset-4"
              [href]="site.original"
              rel="noreferrer"
              target="_blank"
              >{{ site.originalName }}</a
            >
            by Shadcn Labs.
          </p>
          <p>
            GPU programs based on original work by
            <a
              class="text-foreground mx-1 font-medium underline underline-offset-4"
              [href]="site.xordev"
              rel="noreferrer"
              target="_blank"
              >XorDev</a
            >, used with permission.
            <a routerLink="/docs/credits" class="text-foreground mx-1 font-medium underline underline-offset-4">Full credits</a>
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooter {
  protected readonly site = SITE;
}
