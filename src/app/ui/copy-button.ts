import { Component, computed, input, signal } from "@angular/core";

import { cn } from "@/lib/utils";

@Component({
  selector: "app-copy-button",
  template: `
    <button
      type="button"
      [class]="buttonClass()"
      [attr.aria-label]="copied() ? 'Copied' : label()"
      (click)="copy()"
    >
      @if (copied()) {
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Copied</span>
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class CopyButton {
  readonly value = input.required<string>();
  readonly className = input<string>("");
  readonly variant = input<"default" | "outline">("outline");
  readonly label = input<string>("Copy");
  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly buttonClass = computed(() =>
    cn(
      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors",
      this.variant() === "default"
        ? "bg-primary text-primary-foreground border-transparent"
        : "hover:bg-muted bg-background",
      this.className(),
    ),
  );

  copy() {
    void navigator.clipboard.writeText(this.value()).then(() => {
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), 1600);
    });
  }
}
