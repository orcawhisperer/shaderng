import { Component } from "@angular/core";

@Component({
  selector: "app-site-footer",
  template: `
    <footer class="border-t border-border/60">
      <div class="container-wrapper px-4 xl:px-6">
        <div class="text-muted-foreground flex min-h-14 items-center justify-center py-6 text-center text-xs leading-loose sm:text-sm">
          Angular port of
          <a
            class="text-foreground mx-1 font-medium underline underline-offset-4"
            href="https://github.com/shadcn-labs/shadercn"
            rel="noreferrer"
            target="_blank"
            >shadercn</a
          >
          by Shadcn Labs. Shaders based on original work by
          <a
            class="text-foreground mx-1 font-medium underline underline-offset-4"
            href="https://x.com/XorDev"
            rel="noreferrer"
            target="_blank"
            >XorDev</a
          >.
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooter {}
