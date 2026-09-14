import { NgComponentOutlet } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";

import { ORB_STATES, type OrbState } from "@/components/orbs/canvas";
import { loadField, type FieldEntry } from "@/lib/field-loaders";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<OrbState, string> = {
  idle: "Idle",
  speaking: "Speaking",
  thinking: "Thinking",
};

@Component({
  selector: "app-field-preview",
  imports: [NgComponentOutlet],
  template: `
    <div [class]="hostClass()">
      @if (entry(); as current) {
        <ng-container
          [ngComponentOutlet]="current.Component"
          [ngComponentOutletInputs]="inputs()"
        />
      } @else if (loadError()) {
        <p class="text-muted-foreground relative z-10 max-w-md px-6 text-center text-sm">
          {{ loadError() }}
        </p>
      } @else {
        <p class="text-muted-foreground relative z-10 text-sm">Loading shader…</p>
      }

      <div class="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        <label>
          <span class="sr-only">Field state</span>
          <select
            class="bg-background/90 h-7 w-[6.8rem] rounded-md border px-2 text-xs backdrop-blur"
            [value]="state()"
            (change)="onState($event)"
          >
            @for (value of states; track value) {
              <option [value]="value">{{ labels[value] }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          (click)="toggleTheme()"
          class="bg-background/90 hover:bg-muted text-foreground inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium backdrop-blur transition-colors"
          [attr.aria-label]="'Toggle theme, currently ' + effectiveTheme()"
        >
          @if (effectiveTheme() === "dark") {
            <span>🌙 Dark</span>
          } @else {
            <span>☀️ Light</span>
          }
        </button>
      </div>
    </div>
  `,
})
export class FieldPreview {
  readonly slug = input.required<string>();
  readonly className = input("");
  readonly theme = input<"light" | "dark" | "auto">("auto");

  protected readonly states = ORB_STATES;
  protected readonly labels = STATE_LABELS;
  protected readonly state = signal<OrbState>("idle");
  protected readonly localTheme = signal<"light" | "dark" | null>(null);
  protected readonly entry = signal<FieldEntry | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly effectiveTheme = computed<"light" | "dark">(() => {
    const local = this.localTheme();
    if (local) {
      return local;
    }
    const prop = this.theme();
    if (prop === "light" || prop === "dark") {
      return prop;
    }
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  protected readonly hostClass = computed(() =>
    cn(
      "relative min-h-[22rem] overflow-hidden rounded-xl border transition-colors",
      this.effectiveTheme() === "light"
        ? "bg-slate-50 border-slate-200"
        : "bg-[#09090b] border-border",
      this.className(),
    ),
  );

  protected readonly inputs = computed(() => ({
    ariaLabel: `${this.slug()} field, ${this.state()}`,
    state: this.state(),
    theme: this.effectiveTheme(),
  }));

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      let cancelled = false;
      this.entry.set(null);
      this.loadError.set(null);
      void loadField(slug)
        .then((loaded) => {
          if (!cancelled) {
            this.entry.set(loaded);
          }
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          console.error(`[shaderng] failed to load ${slug}`, error);
          this.loadError.set(error instanceof Error ? error.message : `Failed to load ${slug}`);
        });
      onCleanup(() => {
        cancelled = true;
      });
    });
  }

  protected onState(event: Event) {
    this.state.set((event.target as HTMLSelectElement).value as OrbState);
  }

  protected toggleTheme() {
    this.localTheme.set(this.effectiveTheme() === "dark" ? "light" : "dark");
  }
}
