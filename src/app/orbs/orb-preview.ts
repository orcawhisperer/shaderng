import { NgComponentOutlet } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { ORB_STATES, type OrbState } from "@/components/orbs/canvas";
import { loadOrb, type OrbEntry } from "@/lib/orb-loaders";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<OrbState, string> = {
  idle: "Idle",
  speaking: "Speaking",
  thinking: "Thinking",
};

@Component({
  selector: "app-orb-preview",
  imports: [NgComponentOutlet, RouterLink],
  template: `
    <div [class]="hostClass()">
      @if (entry(); as current) {
        <ng-container
          [ngComponentOutlet]="current.Component"
          [ngComponentOutletInputs]="inputs()"
        />
      } @else {
        <p class="text-muted-foreground text-sm">Loading shader…</p>
      }

      <label class="absolute bottom-4 left-4">
        <span class="sr-only">Orb state</span>
        <select
          class="bg-background h-8 w-[8.5rem] rounded-md border px-2 text-sm"
          [value]="state()"
          (change)="onState($event)"
        >
          @for (value of states; track value) {
            <option [value]="value">{{ labels[value] }}</option>
          }
        </select>
      </label>

      <a
        class="bg-primary text-primary-foreground absolute right-4 bottom-4 inline-flex h-8 items-center rounded-md px-3 text-sm"
        [routerLink]="'/playground'"
        [queryParams]="{ orb: slug(), state: state() }"
      >
        Open in playground
      </a>
    </div>
  `,
})
export class OrbPreview {
  readonly slug = input.required<string>();
  readonly size = input(280);
  readonly className = input("");

  protected readonly states = ORB_STATES;
  protected readonly labels = STATE_LABELS;
  protected readonly state = signal<OrbState>("idle");
  protected readonly entry = signal<OrbEntry | null>(null);

  protected readonly hostClass = computed(() =>
    cn(
      "bg-background relative flex min-h-[26rem] items-center justify-center overflow-hidden rounded-xl border p-6",
      this.className(),
    ),
  );

  protected readonly inputs = computed(() => ({
    ariaLabel: `${this.slug()} orb, ${this.state()}`,
    size: this.size(),
    state: this.state(),
  }));

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      let cancelled = false;
      this.entry.set(null);
      void loadOrb(slug).then((loaded) => {
        if (!cancelled) {
          this.entry.set(loaded);
        }
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
