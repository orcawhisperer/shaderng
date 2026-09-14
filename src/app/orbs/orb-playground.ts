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
  type Type,
  untracked,
} from "@angular/core";
import { Router } from "@angular/router";

import { ORB_STATES, type OrbState, type OrbVariant } from "@/components/orbs/canvas";
import { CopyButton } from "@/app/ui/copy-button";
import { FIELD_CATALOG, FIELD_SLUGS, isFieldSlug } from "@/lib/field-catalog";
import { loadField } from "@/lib/field-loaders";
import { ORB_CATALOG, ORB_SLUGS, isOrbSlug } from "@/lib/orb-catalog";
import { loadOrb } from "@/lib/orb-loaders";
import { applyShare, encodeShare, type PlaygroundShare } from "@/lib/playground-url";
import { SITE } from "@/lib/site";
import {
  buildAngularSnippet,
  buildFieldAngularSnippet,
  formatControlValue,
  ngGenerateFieldCommand,
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

const draftFromPreset = (
  variant: OrbVariant,
  state: OrbState,
  theme?: "light" | "dark",
): SnippetDraft => {
  const themeParam = theme ? variant.themeParams?.[theme] : undefined;
  const themeColor = theme ? variant.themeColors?.[theme] : undefined;

  const params: Record<string, number> = {};
  for (const p of variant.params) {
    params[p.key] = variant.statePresets?.[state]?.[p.key] ?? themeParam?.[p.key] ?? p.default;
  }
  const colors: Record<string, string> = {};
  for (const c of variant.colors) {
    colors[c.key] = variant.stateColors?.[state]?.[c.key] ?? themeColor?.[c.key] ?? c.default;
  }
  const [input, output] = DRIVE_SEED[state];
  return { autoDrive: true, colors, input, output, params };
};

const draftsFromPreset = (variant: OrbVariant, theme?: "light" | "dark"): Drafts => ({
  idle: draftFromPreset(variant, "idle", theme),
  speaking: draftFromPreset(variant, "speaking", theme),
  thinking: draftFromPreset(variant, "thinking", theme),
});

export interface PlaygroundEntry {
  Component: Type<unknown>;
  variant: OrbVariant;
}

@Component({
  selector: "app-orb-playground",
  imports: [NgComponentOutlet, NgTemplateOutlet, CopyButton],
  template: `
    @if (entry(); as current) {
      <div class="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div
          class="border-border relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-xl border transition-colors"
          [class.bg-slate-50]="theme() === 'light'"
          [class.bg-background]="theme() === 'dark'"
        >
          <ng-container
            [ngComponentOutlet]="current.Component"
            [ngComponentOutletInputs]="inputs()"
          />

          @if (showFps()) {
            <div
              class="bg-background/85 text-muted-foreground absolute top-3 left-3 z-10 flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-xs backdrop-blur shadow-sm"
            >
              <span class="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WebGPU</span>
              <span>·</span>
              <span class="text-foreground font-semibold">{{ fps() }} FPS</span>
              <span>·</span>
              <span>{{ mode() === "field" ? "Field" : "Orb" }}: {{ slug() }}</span>
            </div>
          }

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

          <div
            class="bg-background/80 border-border/80 absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded-lg border p-2 backdrop-blur lg:inset-x-4 lg:bottom-4"
          >
            <div class="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                class="rounded px-2.5 py-1 font-medium transition-colors"
                [class]="
                  mode() === 'orb'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                "
                (click)="setMode('orb')"
              >
                Orbs (33)
              </button>
              <button
                type="button"
                class="rounded px-2.5 py-1 font-medium transition-colors"
                [class]="
                  mode() === 'field'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                "
                (click)="setMode('field')"
              >
                Fields ({{ fields.length }})
              </button>
            </div>

            <select
              class="bg-background h-8 w-28 rounded-md border px-2 text-sm lg:w-36 font-medium"
              (change)="selectShader($any($event.target).value)"
            >
              @if (mode() === "orb") {
                @for (item of orbs; track item.slug) {
                  <option [value]="item.slug" [selected]="item.slug === slug()">
                    {{ item.title }}
                  </option>
                }
              } @else {
                @for (item of fields; track item.slug) {
                  <option [value]="item.slug" [selected]="item.slug === slug()">
                    {{ item.title }} ({{ item.name }})
                  </option>
                }
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

            <div class="ml-auto flex items-center gap-1.5 flex-wrap">
              <button
                class="inline-flex h-8 items-center rounded-md border px-2.5 text-sm"
                type="button"
                [class]="listen() ? 'bg-secondary font-medium' : 'hover:bg-muted bg-background'"
                [attr.aria-pressed]="listen()"
                (click)="toggleListen()"
              >
                {{ listen() ? "Listening" : "Listen" }}
              </button>
              <button
                class="hover:bg-muted bg-background inline-flex h-8 items-center rounded-md border px-2.5 text-sm"
                type="button"
                (click)="paused.set(!paused())"
              >
                {{ paused() ? "Play" : "Pause" }}
              </button>
              <button
                class="hover:bg-muted bg-background inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-sm"
                type="button"
                title="Capture high-res PNG wallpaper"
                (click)="captureSnapshot()"
              >
                <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Snapshot</span>
              </button>
              <button
                class="hover:bg-muted bg-background inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors"
                type="button"
                [attr.aria-label]="'Toggle theme, currently ' + theme()"
                (click)="toggleTheme()"
              >
                @if (theme() === "dark") {
                  <span>🌙 Dark</span>
                } @else {
                  <span>☀️ Light</span>
                }
              </button>
              <button
                class="hover:bg-muted bg-background inline-flex h-8 items-center rounded-md border px-2 text-xs font-mono"
                [class]="showFps() ? 'bg-secondary' : ''"
                type="button"
                title="Toggle FPS HUD"
                (click)="toggleFps()"
              >
                FPS
              </button>
              <app-copy-button label="Copy link to this look" [value]="shareUrl()">
                Copy link
              </app-copy-button>
              <app-copy-button
                [label]="
                  mode() === 'orb'
                    ? 'Copy the ng generate command that saves this look as a preset'
                    : 'Copy the ng generate field command'
                "
                [value]="presetCommand()"
              >
                {{ mode() === "orb" ? "Preset command" : "Install command" }}
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
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold">{{ current.variant.label }}</span>
            <span class="text-muted-foreground text-xs uppercase tracking-wider">
              {{ mode() === "field" ? "Field (MIT)" : "Orb" }}
            </span>
          </div>
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
          @if (mode() === "orb") {
            <div class="flex flex-col gap-2 p-4 text-xs">
              <span class="flex items-center justify-between">
                <span class="text-muted-foreground">Orb Size</span>
                <span class="tabular-nums font-mono">{{ size() }}px</span>
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
          } @else {
            <div class="bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
              <span class="font-medium text-foreground">Rectangular MIT Field:</span>
              Fills its positioned parent container (<code class="bg-muted rounded px-1 font-mono"
                >fit="fill"</code
              >). Responsive to aspect ratio, cursor tilt, and voice volume.
            </div>
          }

          @if (current.variant.colors.length > 0 && draft(); as live) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                >Colors</span
              >
              @for (c of current.variant.colors; track c.key) {
                <label class="flex items-center justify-between gap-3 text-xs">
                  <span>{{ c.label }}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[11px] text-muted-foreground">{{
                      live.colors[c.key]
                    }}</span>
                    <input
                      class="size-7 cursor-pointer rounded border bg-transparent"
                      type="color"
                      [value]="live.colors[c.key]"
                      (input)="patchColor(c.key, $any($event.target).value)"
                    />
                  </div>
                </label>
              }
            </div>
          }

          @if (listen()) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                >Audio Drive</span
              >
              <p class="text-muted-foreground text-xs leading-relaxed">
                Microphone is actively driving <code class="bg-muted rounded px-1">volumes</code>.
                Speak or play audio to watch the shader respond in real time.
              </p>
            </div>
          } @else if (draft(); as live) {
            <div class="flex flex-col gap-3 p-4">
              <span class="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                >Audio Drive</span
              >
              <button
                class="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium"
                [class]="live.autoDrive ? 'bg-secondary' : 'bg-background'"
                type="button"
                (click)="patchDraft({ autoDrive: !live.autoDrive })"
              >
                {{ live.autoDrive ? "Auto volumes (Synthesized)" : "Manual volume sliders" }}
              </button>
              @if (!live.autoDrive) {
                <label class="flex flex-col gap-2 text-xs">
                  <span class="flex items-center justify-between">
                    <span>Input Volume</span>
                    <span class="tabular-nums font-mono">{{ format(live.input) }}</span>
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
                    <span>Output Volume</span>
                    <span class="tabular-nums font-mono">{{ format(live.output) }}</span>
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
              <span class="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                >Shader Uniforms</span
              >
              @for (p of current.variant.params; track p.key) {
                <label class="flex flex-col gap-2 text-xs">
                  <span class="flex items-center justify-between">
                    <span>{{ p.label }}</span>
                    <span class="tabular-nums font-mono">{{ format(live.params[p.key]) }}</span>
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
  readonly initialMode = input<"orb" | "field">("orb");
  readonly initialSlug = input<string>(ORB_SLUGS[0]);
  readonly initialState = input<OrbState>("idle");
  /** Params, colors, volumes and size from a shared link; applied once, to the first load. */
  readonly initialShare = input<PlaygroundShare | undefined>(undefined);

  private readonly router = inject(Router);
  private shareApplied = false;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;
  private fpsTimer: ReturnType<typeof requestAnimationFrame> | undefined;
  private lastFpsTime = 0;
  private frameCount = 0;

  protected readonly orbs = ORB_CATALOG;
  protected readonly fields = FIELD_CATALOG;
  protected readonly states = ORB_STATES;
  protected readonly labels = STATE_LABELS;
  protected readonly format = formatControlValue;

  protected readonly mode = linkedSignal<"orb" | "field">(() => {
    const share = this.initialShare();
    if (share?.field) {
      return "field";
    }
    return this.initialMode();
  });

  protected readonly slug = linkedSignal<string>(() => {
    const share = this.initialShare();
    if (share?.field) {
      return share.field;
    }
    if (share?.orb) {
      return share.orb;
    }
    return this.initialSlug();
  });

  protected readonly state = linkedSignal(() => this.initialState());
  protected readonly size = signal(420);
  protected readonly paused = signal(false);
  protected readonly listen = signal(false);
  protected readonly panelOpen = signal(false);
  protected readonly showFps = signal(false);
  protected readonly fps = signal(60);
  protected readonly theme = signal<"light" | "dark">(
    typeof document !== "undefined" && !document.documentElement.classList.contains("dark")
      ? "light"
      : "dark",
  );

  protected readonly entry = signal<PlaygroundEntry | null>(null);
  protected readonly drafts = signal<Drafts | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly draft = computed(() => this.drafts()?.[this.state()] ?? null);

  protected readonly snippet = computed(() => {
    const entry = this.entry();
    const draft = this.draft();
    if (!entry || !draft) {
      return "";
    }
    if (this.mode() === "field") {
      return buildFieldAngularSnippet({
        draft,
        listen: this.listen(),
        slug: this.slug(),
        state: this.state(),
        variant: entry.variant,
      });
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
      isField: this.mode() === "field",
      size: this.size(),
      slug: this.slug(),
      state: this.state(),
    });
  });

  /** Preset / generate CLI command */
  protected readonly presetCommand = computed(() => {
    if (this.mode() === "field") {
      return ngGenerateFieldCommand(this.slug());
    }
    return ngPresetCommand(this.slug(), this.shareUrl());
  });

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
      ariaLabel: `${this.slug()} ${this.mode()}, ${this.state()}`,
      colors: draft?.colors,
      listen: this.listen(),
      params: draft?.params,
      paused: this.paused(),
      size: this.mode() === "orb" ? this.size() : undefined,
      state: this.state(),
      theme: this.theme(),
      volumes:
        this.listen() || draft?.autoDrive
          ? undefined
          : { input: draft?.input ?? 0, output: draft?.output ?? 0 },
    };
  });

  constructor() {
    effect((onCleanup) => {
      const currentMode = this.mode();
      const currentSlug = this.slug();
      let cancelled = false;
      this.loadError.set(null);

      const loader = currentMode === "field" ? loadField(currentSlug) : loadOrb(currentSlug);

      loader
        .then((loaded) => {
          if (cancelled) {
            return;
          }
          this.entry.set(loaded);
          const drafts = draftsFromPreset(
            loaded.variant,
            untracked(() => this.theme()),
          );
          const share = untracked(() => this.initialShare());
          if (share && !this.shareApplied) {
            this.shareApplied = true;
            const state = untracked(() => this.state());
            drafts[state] = applyShare(loaded.variant, drafts[state], share);
            if (share.size && currentMode === "orb") {
              this.size.set(share.size);
            }
          }
          this.drafts.set(drafts);
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          console.error(`[${SITE.log}] failed to load ${currentSlug}`, error);
          this.entry.set(null);
          this.loadError.set(
            error instanceof Error ? error.message : `Failed to load ${currentSlug}`,
          );
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
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.syncTimer);
      if (this.fpsTimer) {
        cancelAnimationFrame(this.fpsTimer);
      }
    });

    const max = Math.max(120, window.innerWidth - 96);
    this.size.update((prev) => Math.min(prev, max));
  }

  protected setMode(next: "orb" | "field") {
    if (this.mode() === next) {
      return;
    }
    this.mode.set(next);
    if (next === "field") {
      this.slug.set(isFieldSlug(this.slug()) ? this.slug() : FIELD_SLUGS[0]);
    } else {
      this.slug.set(isOrbSlug(this.slug()) ? this.slug() : ORB_SLUGS[0]);
    }
  }

  protected numberValue(event: Event) {
    return Number((event.target as HTMLInputElement).value);
  }

  protected selectShader(next: string) {
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

  protected toggleFps() {
    const next = !this.showFps();
    this.showFps.set(next);
    if (next) {
      this.startFpsTracker();
    } else if (this.fpsTimer) {
      cancelAnimationFrame(this.fpsTimer);
    }
  }

  private startFpsTracker() {
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    const loop = (now: number) => {
      this.frameCount += 1;
      if (now - this.lastFpsTime >= 1000) {
        this.fps.set(Math.round((this.frameCount * 1000) / (now - this.lastFpsTime)));
        this.frameCount = 0;
        this.lastFpsTime = now;
      }
      if (this.showFps()) {
        this.fpsTimer = requestAnimationFrame(loop);
      }
    };
    this.fpsTimer = requestAnimationFrame(loop);
  }

  protected captureSnapshot() {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.slug()}-${this.state()}-shaderng.png`;
      a.click();
    } catch (err) {
      console.warn("[shaderng] canvas capture not supported:", err);
    }
  }

  protected toggleTheme() {
    const next = this.theme() === "dark" ? "light" : "dark";
    this.theme.set(next);
    const entry = this.entry();
    if (entry) {
      this.drafts.set(draftsFromPreset(entry.variant, next));
    }
  }

  protected reset(variant: OrbVariant) {
    this.drafts.set(draftsFromPreset(variant, this.theme()));
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
