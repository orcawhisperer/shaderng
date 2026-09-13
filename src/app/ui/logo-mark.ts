import { Component, input } from "@angular/core";

import { cn } from "@/lib/utils";

@Component({
  selector: "app-logo-mark",
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      [class]="cn('size-6', className())"
    >
      <rect width="32" height="32" rx="8" class="fill-foreground" />
      <circle cx="16" cy="16" r="8.25" class="stroke-background" stroke-width="1.5" />
      <ellipse cx="16" cy="16" rx="4.6" ry="8.25" class="stroke-background" stroke-width="1.15" opacity="0.85" />
      <circle cx="13.2" cy="12.6" r="1.7" class="fill-background" />
    </svg>
  `,
})
export class LogoMark {
  readonly className = input("");
  protected readonly cn = cn;
}
