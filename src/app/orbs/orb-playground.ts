import { NgComponentOutlet, NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from "@angular/core";
import { Router } from "@angular/router";

import { ORB_STATES, type OrbState, type OrbVariant } from "@/components/orbs/canvas";
import { CopyButton } from "@/app/ui/copy-button";
import { loadOrb, type OrbEntry } from "@/lib/orb-loaders";
import { ORB_CATALOG, ORB_SLUGS } from "@/lib/orb-catalog";
import { applyShare, encodeShare, type PlaygroundShare } from "@/lib/playground-url";
import { SITE } from "@/lib/site";
import {
  buildAngularSnippet,
  formatControlValue,
  ngPresetCommand,
  type SnippetDraft,
} from "@/lib/snippet";

/** Slider drags fire many times a second; the URL only needs the resting value. */
const URL_SYNC_MS = 200;

const STATE_LABELS: Record<OrbState, string> = {
  idle: "Idle",
  speaking: "Speaking",
  thinking: "Thinking",
};

const DRIVE_SEED: Record<OrbState, [number, number]> = {
  idle: [0, 0.3],
  speaking: [0.7, 0.8],
  thinking: [0.4, 0.5],
};

type Drafts = Record<OrbState, SnippetDraft>;

const draftFromPreset = (variant: OrbVariant, state: OrbState): SnippetDraft => {
  const params: Record<string, number> = {};
  for (const p of variant.params) {
    params[p.key] = variant.statePresets?.[state]?.[p.key] ?? p.default;
  }
  const colors: Record<string, string> = {};
  for (const c of variant.colors) {
    colors[c.key] = variant.stateColors?.[state]?.[c.key] ?? c.default;
  }
  const [input, output] = DRIVE_SEED[state];
  return { autoDrive: true, colors, input, output, params };
};

const draftsFromPreset = (variant: OrbVariant): Drafts => ({
  idle: draftFromPreset(variant, "idle"),
  speaking: draftFromPreset(variant, "speaking"),
  thinking: draftFromPreset(variant, "thinking"),
});

@Component({
  selector: "app-orb-playground",
  imports: [NgComponentOutlet, NgTemplateOutlet, CopyButton],
  template: `
    @if (entry(); as current) {
      <div class="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div
          class="border-border bg-background relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-xl border"
        >
          <ng-container
            [ngComponentOutlet]="current.Component"
            [ngComponentOutletInputs]="inputs()"
          />

          <button
            class="bg-background hover:bg-muted absolute top-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm shadow-sm lg:hidden"
            type="button"
            (click)="panelOpen.set(!panelOpen())"
          >
            Customize
          </button>

          @if (panelOpen()) {
            <div class="bg-background absolute inset-0 z-10 flex flex-col lg:hidden">
              <ng-container [ngTemplateOutlet]="panel" />
            </div>
          }

          <div class="absolute inset-x-3 bottom-3 flex items-center gap-2 lg:inset-x-4 lg:bottom-4">
            <select
              class="bg-background h-8 w-24 rounded-md border px-2 text-sm lg:w-28"
              (change)="selectOrb($any($event.target).value)"
            >
              @for (item of catalog; track item.slug) {
                <option [value]="item.slug" [selected]="item.slug === slug()">
                  {{ item.title }}
                </option>
              }
            </select>
            <select
              class="bg-background h-8 w-28 rounded-md border px-2 text-sm lg:w-32"
              (change)="selectState($any($event.target).value)"
            >
              @for (value of states; track value) {
                <option [value]="value" [selected]="value === state()">
                  {{ labels[value] }}
                </option>
              }
            </select>
            <div class="ml-auto flex items-center gap-2">
              <button
                class="inline-flex h-8 items-center rounded-md border px-3 text-sm"
                type="button"
                [class]="listen() ? 'bg-secondary' : 'hover:bg-muted bg-background'"
                [attr.aria-pressed]="listen()"
                (click)="toggleListen()"
              >
                {{ listen() ? "Listening" : "Listen" }}
              </button>
              <button
                class="hover:bg-muted bg-background inline-flex h-8 items-center rounded-md border px-3 text-sm"
                type="button"
                (click)="paused.set(!paused())"
              >
                {{ paused() ? "Play" : "Pause" }}
              </button>
              <app-copy-button label="Copy link to this look" [value]="shareUrl()">
                Copy link
              </app-copy-button>
              <app-copy-button
                label="Copy the ng generate command that saves this look as a preset"
                [value]="presetCommand()"
              >
                Copy preset command
              </app-copy-button>
              <app-copy-button variant="default" [value]="snippet()">Copy template</app-copy-button>
            </div>
          </div>
        </div>

        <aside class="hidden h-full min-h-0 flex-col overflow-hidden rounded-xl border lg:flex">
          <ng-container [ngTemplateOutlet]="panel" />
        </aside>
      </div>

      <ng-template #panel>
        <div class="bg-card flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <span class="text-sm font-medium">{{ current.variant.label }}</span>
          <div class="flex items-center gap-2">
            <button
              class="hover:bg-muted inline-flex h-8 items-center rounded-md px-3 text-sm"
              type="button"
              (click)="reset(current.variant)"
            >
              Reset
            </button>
            <button
              class="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md lg:hidden"
              type="button"
              (click)="panelOpen.set(false)"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="divide-border flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
          <div class="flex flex-col gap-2 p-4 text-xs">
            <span class="flex items-center justify-between">
              <span class="text-muted-foreground">Size</span>
              <span class="tabular-nums">{{ size() }}px</span>
            </span>
            <input
              type="range"
              min="120"
              max="720"
              step="10"
              [value]="size()"
              (input)="size.set(numberValue($event))"
            />
          </div>

          @if (current.variant.colors.length > 0 && draft(); as live) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs">Colors</span>
              @for (c of current.variant.colors; track c.key) {
                <label class="flex items-center justify-between gap-3 text-xs">
                  <span>{{ c.label }}</span>
                  <input
                    class="size-7 cursor-pointer rounded border bg-transparent"
                    type="color"
                    [value]="live.colors[c.key]"
                    (input)="patchColor(c.key, $any($event.target).value)"
                  />
                </label>
              }
            </div>
          }

          @if (listen()) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs">Drive</span>
              <p class="text-muted-foreground text-xs leading-relaxed">
                Microphone is driving <code class="bg-muted rounded px-1">volumes</code>. Speak or
                play audio — this is original to shaderng, not shadercn.
              </p>
            </div>
          } @else if (draft(); as live) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs">Drive</span>
              <button
                class="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs"
                [class]="live.autoDrive ? 'bg-secondary' : 'bg-background'"
                type="button"
                (click)="patchDraft({ autoDrive: !live.autoDrive })"
              >
                {{ live.autoDrive ? "Auto volumes" : "Manual volumes" }}
              </button>
              @if (!live.autoDrive) {
                <label class="flex flex-col gap-2 text-xs">
                  <span class="flex items-center justify-between">
                    <span>Input</span>
                    <span class="tabular-nums">{{ format(live.input) }}</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    [value]="live.input"
                    (input)="patchDraft({ input: numberValue($event) })"
                  />
                </label>
                <label class="flex flex-col gap-2 text-xs">
                  <span class="flex items-center justify-between">
                    <span>Output</span>
                    <span class="tabular-nums">{{ format(live.output) }}</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    [value]="live.output"
                    (input)="patchDraft({ output: numberValue($event) })"
                  />
                </label>
              }
            </div>
          }

          @if (draft(); as live) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs">Params</span>
              @for (p of current.variant.params; track p.key) {
                <label class="flex flex-col gap-2 text-xs">
                  <span class="flex items-center justify-between">
                    <span>{{ p.label }}</span>
                    <span class="tabular-nums">{{ format(live.params[p.key]) }}</span>
                  </span>
                  <input
                    type="range"
                    [min]="p.min"
                    [max]="p.max"
                    [step]="p.step"
                    [value]="live.params[p.key]"
                    (input)="patchParam(p.key, numberValue($event))"
                  />
                </label>
              }
            </div>
          }
        </div>
      </ng-template>
    } @else if (loadError()) {
      <div
        class="text-muted-foreground flex h-full items-center justify-center px-6 text-center text-sm"
      >
        {{ loadError() }}
      </div>
    } @else {
      <div class="text-muted-foreground flex h-full items-center justify-center text-sm">
        Loading playground…
      </div>
    }
  `,
})
export class OrbPlayground {
  readonly initialSlug = input<string>(ORB_SLUGS[0]);
  readonly initialState = input<OrbState>("idle");
  /** Params, colors, volumes and size from a shared link; applied once, to the first load. */
  readonly initialShare = input<PlaygroundShare | undefined>(undefined);

  private readonly router = inject(Router);
  private shareApplied = false;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly catalog = ORB_CATALOG;
  protected readonly states = ORB_STATES;
  protected readonly labels = STATE_LABELS;
  protected readonly format = formatControlValue;

  protected readonly slug = linkedSignal(() => this.initialSlug());
  protected readonly state = linkedSignal(() => this.initialState());
  protected readonly size = signal(420);
  protected readonly paused = signal(false);
  protected readonly listen = signal(false);
  protected readonly panelOpen = signal(false);
  protected readonly entry = signal<OrbEntry | null>(null);
  protected readonly drafts = signal<Drafts | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly draft = computed(() => this.drafts()?.[this.state()] ?? null);

  protected readonly snippet = computed(() => {
    const entry = this.entry();
    const draft = this.draft();
    if (!entry || !draft) {
      return "";
    }
    return buildAngularSnippet({
      draft,
      listen: this.listen(),
      size: this.size(),
      slug: this.slug(),
      state: this.state(),
      variant: entry.variant,
    });
  });

  /** The query that reproduces the current look; null values drop the key from the URL. */
  private readonly shareQuery = computed(() => {
    const entry = this.entry();
    const draft = this.draft();
    if (!entry || !draft) {
      return null;
    }
    return encodeShare(entry.variant, {
      draft,
      size: this.size(),
      slug: this.slug(),
      state: this.state(),
    });
  });

  /** `ng g shaderng:orb <slug> --preset "<link>"`: the look as a `.preset.ts` in a project. */
  protected readonly presetCommand = computed(() => ngPresetCommand(this.slug(), this.shareUrl()));

  protected readonly shareUrl = computed(() => {
    const query = this.shareQuery();
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== null) {
        params.set(key, value);
      }
    }
    const tree = this.router.createUrlTree(["/playground"]);
    const path = this.router.serializeUrl(tree).replace(/^\//, "");
    return `${new URL(path, document.baseURI).href}?${params}`;
  });

  protected readonly inputs = computed(() => {
    const draft = this.draft();
    return {
      ariaLabel: `${this.slug()} orb, ${this.state()}`,
      colors: draft?.colors,
      listen: this.listen(),
      params: draft?.params,
      paused: this.paused(),
      size: this.size(),
      state: this.state(),
      volumes:
        this.listen() || draft?.autoDrive
          ? undefined
          : { input: draft?.input ?? 0, output: draft?.output ?? 0 },
    };
  });

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      let cancelled = false;
      this.loadError.set(null);
      void loadOrb(slug)
        .then((loaded) => {
          if (cancelled) {
            return;
          }
          this.entry.set(loaded);
          const drafts = draftsFromPreset(loaded.variant);
          const share = untracked(() => this.initialShare());
          if (share && !this.shareApplied) {
            this.shareApplied = true;
            const state = untracked(() => this.state());
            drafts[state] = applyShare(loaded.variant, drafts[state], share);
            if (share.size) {
              this.size.set(share.size);
            }
          }
          this.drafts.set(drafts);
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          console.error(`[${SITE.log}] failed to load ${slug}`, error);
          this.entry.set(null);
          this.loadError.set(error instanceof Error ? error.message : `Failed to load ${slug}`);
        });
      onCleanup(() => {
        cancelled = true;
      });
    });

    // Keep the address bar in step with the look, so the URL is always shareable as-is.
    effect(() => {
      const query = this.shareQuery();
      if (!query) {
        return;
      }
      clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        void this.router.navigate([], {
          queryParams: query,
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      }, URL_SYNC_MS);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.syncTimer));

    const max = Math.max(120, window.innerWidth - 96);
    this.size.update((prev) => Math.min(prev, max));
  }

  protected numberValue(event: Event) {
    return Number((event.target as HTMLInputElement).value);
  }

  protected selectOrb(next: string) {
    this.slug.set(next);
  }

  protected selectState(next: OrbState) {
    this.state.set(next);
  }

  protected toggleListen() {
    const next = !this.listen();
    this.listen.set(next);
    if (next) {
      this.state.set("speaking");
    }
  }

  protected reset(variant: OrbVariant) {
    this.drafts.set(draftsFromPreset(variant));
  }

  protected patchDraft(patch: Partial<SnippetDraft>) {
    const state = this.state();
    this.drafts.update((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, [state]: { ...prev[state], ...patch } };
    });
  }

  protected patchParam(key: string, value: number) {
    const draft = this.draft();
    if (!draft) {
      return;
    }
    this.patchDraft({ params: { ...draft.params, [key]: value } });
  }

  protected patchColor(key: string, value: string) {
    const draft = this.draft();
    if (!draft) {
      return;
    }
    this.patchDraft({ colors: { ...draft.colors, [key]: value } });
  }
}
