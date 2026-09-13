import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from "@angular/core";

import type {
  OrbColorValues,
  OrbDrive,
  OrbParamValues,
  OrbPreset,
  OrbState,
  OrbVariant,
} from "@/components/orbs/renderer";
import { createOrbRenderer } from "@/components/orbs/renderer";
import { type OrbAudioSource, startAudioDrive } from "@/lib/audio-drive";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const WEBGPU_HELP =
  "WebGPU is not available in this browser. Try Chrome or Edge 113+ with hardware acceleration.";

/** Cheap synchronous check; `requestAdapter()` can still fail later, which `onError` covers. */
export const hasWebGPU = (): boolean => typeof navigator !== "undefined" && "gpu" in navigator;

/**
 * Marks the template shown instead of the canvas when WebGPU is missing or fails:
 *
 * ```html
 * <orb-01>
 *   <ng-template shaderOrbFallback let-message let-tint="tint">
 *     <img src="/orb-01-poster.png" alt="" />
 *   </ng-template>
 * </orb-01>
 * ```
 *
 * A template rather than `<ng-content>` because the generated `<orb-xx>` wrappers sit between
 * you and `<shader-orb>`, and re-projected content always counts as "provided", which would
 * suppress the built-in fallback.
 */
@Directive({ selector: "ng-template[shaderOrbFallback]" })
export class ShaderOrbFallback {
  readonly template = inject<TemplateRef<ShaderOrbFallbackContext>>(TemplateRef);
}

export interface ShaderOrbFallbackContext {
  /** Why the canvas is not showing. */
  $implicit: string;
  /** The orb's first color after `colors` overrides. */
  tint: string;
}

@Component({
  selector: "shader-orb",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <div
      [class]="cn('shader-orb-root', className())"
      [style.width.px]="width() ?? resolvedSize()"
      [style.height.px]="height() ?? resolvedSize()"
      [style]="style()"
    >
      @if (!unsupported()) {
        <canvas
          #canvas
          class="shader-orb-canvas"
          role="img"
          [style.opacity]="painted() ? 1 : 0"
          [attr.aria-label]="label()"
          [attr.aria-busy]="painted() ? null : true"
        ></canvas>
      }
      @if (unsupported() || errorMessage()) {
        <div class="shader-orb-overlay" role="img" [attr.aria-label]="label()">
          @if (fallbackTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template"
              [ngTemplateOutletContext]="{ $implicit: errorMessage() ?? WEBGPU_HELP, tint: tint() }"
            />
          } @else {
            <div class="shader-orb-fallback" [style.--orb-tint]="tint()" aria-hidden="true"></div>
            @if (fallbackMessage()) {
              <p class="shader-orb-message text-muted-foreground" role="status">
                {{ errorMessage() ?? WEBGPU_HELP }}
              </p>
            }
          }
        </div>
      }
    </div>
  `,
  /* Layout lives here rather than in utility classes so the orb works in apps without Tailwind. */
  styles: `
    .shader-orb-root {
      position: relative;
    }
    .shader-orb-canvas {
      display: block;
      width: 100%;
      height: 100%;
      transition: opacity 300ms;
    }
    .shader-orb-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      text-align: center;
    }
    .shader-orb-message {
      margin: 0;
      font-size: 0.75rem;
      line-height: 1rem;
      opacity: 0.8;
    }
    .shader-orb-fallback {
      --orb-tint: #8b8ba3;
      width: 62%;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(
        circle at 36% 32%,
        color-mix(in srgb, var(--orb-tint) 55%, white) 0%,
        var(--orb-tint) 38%,
        color-mix(in srgb, var(--orb-tint) 45%, black) 100%
      );
      box-shadow:
        0 0 48px color-mix(in srgb, var(--orb-tint) 45%, transparent),
        inset 0 -12px 32px color-mix(in srgb, black 35%, transparent);
    }
    @media (prefers-reduced-motion: no-preference) {
      .shader-orb-fallback {
        animation: shader-orb-breathe 4s ease-in-out infinite;
      }
    }
    @keyframes shader-orb-breathe {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.04);
      }
    }
  `,
})
export class ShaderOrb {
  readonly variant = input.required<OrbVariant>();
  /** A saved look; explicit inputs override it and `params` / `colors` merge on top of it. */
  readonly preset = input<OrbPreset | undefined>(undefined);
  readonly state = input<OrbState | undefined>(undefined);
  readonly size = input<number | undefined>(undefined);
  readonly params = input<OrbParamValues | undefined>(undefined);
  readonly colors = input<OrbColorValues | undefined>(undefined);
  readonly statePresets = input<Partial<Record<OrbState, Record<string, number>>> | undefined>(
    undefined,
  );
  readonly stateColors = input<Partial<Record<OrbState, Record<string, string>>> | undefined>(
    undefined,
  );
  readonly stateVolumes = input<
    Partial<Record<OrbState, { input?: number; output?: number }>> | undefined
  >(undefined);
  readonly volumes = input<{ input?: number; output?: number } | undefined>(undefined);
  /**
   * Drive `volumes` from live audio: the microphone, a WebRTC/TTS `MediaStream`, a Web Audio
   * node, or an `<audio>`/`<video>` element. Takes precedence over `volumes` and `listen`.
   */
  readonly audio = input<OrbAudioSource | undefined>(undefined);
  /** Shorthand for `[audio]="'microphone'"`. */
  readonly listen = input(false);
  readonly paused = input(false);
  readonly pauseOffscreen = input(true);
  readonly respectReducedMotion = input(true);
  readonly maxDpr = input(2);
  /** Cap on paints per second; `0` paints every frame. */
  readonly maxFps = input(0);
  /** Follow the pointer over the canvas into the shader's `mouse` uniform. */
  readonly trackPointer = input(true);
  /** Pointer position in canvas uv space (0..1, top-left origin); overrides tracking. */
  readonly mouse = input<{ x: number; y: number } | undefined>(undefined);
  /** Rectangular canvases (fields, `fit="fill"` backgrounds); default to `size` for both. */
  readonly width = input<number | undefined>(undefined);
  readonly height = input<number | undefined>(undefined);
  readonly className = input<string | undefined>(undefined);
  readonly style = input<Record<string, string> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Set by the `<orb-xx>` wrappers from their own `<ng-template shaderOrbFallback>` child. */
  readonly fallback = input<TemplateRef<ShaderOrbFallbackContext> | undefined>(undefined);
  /** Show the reason under the built-in fallback orb; backgrounds turn this off. */
  readonly fallbackMessage = input(true);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  private readonly projectedFallback = contentChild(ShaderOrbFallback);
  protected readonly fallbackTemplate = computed(
    () => this.fallback() ?? this.projectedFallback()?.template,
  );
  private readonly reducedMotion = prefersReducedMotion();
  protected readonly painted = signal(false);
  /** Rendering failed or stopped: the canvas is replaced by the fallback. */
  protected readonly errorMessage = signal<string | null>(null);
  /** The audio source failed; the orb keeps rendering on synthesized volumes. */
  protected readonly audioError = signal<string | null>(null);
  /** No `navigator.gpu` at all: show the fallback at once instead of after a failed init. */
  protected readonly unsupported = signal(!hasWebGPU());
  protected readonly WEBGPU_HELP = WEBGPU_HELP;
  protected readonly cn = cn;
  protected readonly resolvedState = computed(() => this.state() ?? this.preset()?.state ?? "idle");
  protected readonly resolvedSize = computed(() => this.size() ?? this.preset()?.size);
  private readonly resolvedParams = computed<OrbParamValues | undefined>(() => {
    const fromPreset = this.preset()?.params;
    const explicit = this.params();
    return fromPreset || explicit ? { ...fromPreset, ...explicit } : undefined;
  });
  private readonly resolvedColors = computed<OrbColorValues | undefined>(() => {
    const fromPreset = this.preset()?.colors;
    const explicit = this.colors();
    return fromPreset || explicit ? { ...fromPreset, ...explicit } : undefined;
  });
  private readonly resolvedVolumes = computed(() => this.volumes() ?? this.preset()?.volumes);
  /** The orb's first color (usually `tint`) after `colors` overrides, for the CSS fallback. */
  protected readonly tint = computed(() => {
    const first = this.variant().colors[0];
    if (!first) {
      return "#8b8ba3";
    }
    return this.resolvedColors()?.[first.key] ?? first.default;
  });
  protected readonly label = computed(
    () => this.ariaLabel() ?? `${this.variant().label} shader orb, ${this.resolvedState()}`,
  );
  /** The audio source in effect: `audio` wins, then `listen` means the microphone. */
  private readonly audioSource = computed<OrbAudioSource | undefined>(
    () => this.audio() ?? (this.listen() ? "microphone" : undefined),
  );

  private readonly drive: OrbDrive = { state: "idle" };

  constructor() {
    effect(() => {
      const listening = this.audioSource() !== undefined;
      this.drive.state = this.resolvedState();
      this.drive.params = this.resolvedParams();
      this.drive.colors = this.resolvedColors();
      this.drive.statePresets = this.statePresets();
      this.drive.stateColors = this.stateColors();
      this.drive.stateVolumes = this.stateVolumes();
      if (!listening) {
        this.drive.volumes = this.resolvedVolumes();
      }
      const reduce = this.respectReducedMotion() && this.reducedMotion();
      // Live audio is content the visitor asked for; reduced motion only stops the idle loop.
      this.drive.paused = this.paused() || (reduce && !listening);
      this.drive.mouse = this.mouse();
    });

    effect((onCleanup) => {
      const source = this.audioSource();
      if (source === undefined) {
        return;
      }
      let stopped = false;
      let dispose: (() => void) | undefined;
      void startAudioDrive(source, (volumes) => {
        if (!stopped) {
          this.drive.volumes = volumes;
        }
      })
        .then((stop) => {
          if (stopped) {
            stop();
            return;
          }
          dispose = stop;
        })
        .catch((error: unknown) => {
          if (stopped) {
            return;
          }
          const message =
            error instanceof Error
              ? error.message
              : source === "microphone"
                ? "Microphone permission was denied"
                : "Audio source failed";
          console.error(`[${SITE.log}] audio drive failed:`, error);
          this.audioError.set(message);
        });
      onCleanup(() => {
        stopped = true;
        this.audioError.set(null);
        dispose?.();
        // Volumes fall back to `volumes` / synthesized values once the source is gone.
        this.drive.volumes = untracked(() => this.resolvedVolumes());
      });
    });

    effect((onCleanup) => {
      const canvas = this.canvasRef()?.nativeElement;
      const variant = this.variant();
      const maxDpr = this.maxDpr();
      const maxFps = this.maxFps();
      const pauseOffscreen = this.pauseOffscreen();
      const trackPointer = this.trackPointer();
      if (!canvas) {
        return;
      }

      this.painted.set(false);
      this.errorMessage.set(null);

      const report = (phase: string, error: unknown) => {
        const message = error instanceof Error ? error.message : "WebGPU failed to start";
        console.error(`[${SITE.log}] ${variant.key} ${phase}:`, error);
        this.errorMessage.set(/gpu|webgpu|adapter/i.test(message) ? WEBGPU_HELP : message);
      };

      const renderer = createOrbRenderer({
        canvas,
        drive: () => this.drive,
        maxDpr,
        maxFps,
        onError: (error) => report("stopped rendering", error),
        onFirstFrame: () => this.painted.set(true),
        pauseOffscreen,
        trackPointer,
        variant,
      });

      void renderer.ready.catch((error: unknown) => report("failed to start", error));

      onCleanup(() => renderer.dispose());
    });
  }
}
