import { Component, computed, input, signal } from "@angular/core";

import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type CopyStatus = "idle" | "copied" | "failed";

@Component({
  selector: "app-copy-button",
  template: `
    <button
      type="button"
      [class]="buttonClass()"
      [attr.aria-label]="status() === 'idle' ? label() : statusLabel()"
      aria-live="polite"
      (click)="copy()"
    >
      @switch (status()) {
        @case ("copied") {
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Copied</span>
        }
        @case ("failed") {
          <span>Copy failed</span>
        }
        @default {
          <ng-content />
        }
      }
    </button>
  `,
})
export class CopyButton {
  readonly value = input.required<string>();
  readonly className = input<string>("");
  readonly variant = input<"default" | "outline">("outline");
  readonly label = input<string>("Copy");
  protected readonly status = signal<CopyStatus>("idle");
  protected readonly statusLabel = computed(() =>
    this.status() === "copied" ? "Copied" : "Copy failed. Select the text and copy it manually.",
  );
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly buttonClass = computed(() =>
    cn(
      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors",
      this.variant() === "default"
        ? "bg-primary text-primary-foreground border-transparent"
        : "hover:bg-muted bg-background",
      this.status() === "failed" && "text-destructive",
      this.className(),
    ),
  );

  async copy() {
    const ok = await copyText(this.value());
    this.status.set(ok ? "copied" : "failed");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.status.set("idle"), ok ? 1600 : 2600);
  }
}
