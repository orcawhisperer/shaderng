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

      <label class="absolute bottom-4 left-4 z-10">
        <span class="sr-only">Field state</span>
        <select
          class="bg-background/90 h-8 w-[8.5rem] rounded-md border px-2 text-sm backdrop-blur"
          [value]="state()"
          (change)="onState($event)"
        >
          @for (value of states; track value) {
            <option [value]="value">{{ labels[value] }}</option>
          }
        </select>
      </label>
    </div>
  `,
})
export class FieldPreview {
  readonly slug = input.required<string>();
  readonly className = input("");

  protected readonly states = ORB_STATES;
  protected readonly labels = STATE_LABELS;
  protected readonly state = signal<OrbState>("idle");
  protected readonly entry = signal<FieldEntry | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly hostClass = computed(() =>
    cn("bg-background relative min-h-[22rem] overflow-hidden rounded-xl border", this.className()),
  );

  protected readonly inputs = computed(() => ({
    ariaLabel: `${this.slug()} field, ${this.state()}`,
    state: this.state(),
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
}
