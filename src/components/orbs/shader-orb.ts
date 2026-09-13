import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  untracked,
  viewChild,
} from "@angular/core";

import type {
  OrbColorValues,
  OrbDrive,
  OrbParamValues,
  OrbState,
  OrbVariant,
} from "@/components/orbs/renderer";
import { createOrbRenderer } from "@/components/orbs/renderer";
import { startMicDrive } from "@/lib/mic-drive";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const WEBGPU_HELP =
  "WebGPU is not available in this browser. Try Chrome or Edge 113+ with hardware acceleration.";

@Component({
  selector: "shader-orb",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="cn('relative', className())"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style]="style()"
    >
      <canvas
        #canvas
        class="block size-full transition-opacity duration-300"
        role="img"
        [style.opacity]="painted() ? 1 : 0"
        [attr.aria-label]="label()"
        [attr.aria-busy]="painted() ? null : true"
      ></canvas>
      @if (errorMessage()) {
        <p
          class="text-muted-foreground absolute inset-0 flex items-center justify-center p-4 text-center text-sm"
          role="status"
        >
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
})
export class ShaderOrb {
  readonly variant = input.required<OrbVariant>();
  readonly state = input<OrbState>("idle");
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
  readonly listen = input(false);
  readonly paused = input(false);
  readonly pauseOffscreen = input(true);
  readonly respectReducedMotion = input(true);
  readonly maxDpr = input(2);
  readonly className = input<string | undefined>(undefined);
  readonly style = input<Record<string, string> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  private readonly reducedMotion = prefersReducedMotion();
  protected readonly painted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly cn = cn;
  protected readonly label = computed(
    () => this.ariaLabel() ?? `${this.variant().label} shader orb, ${this.state()}`,
  );

  private readonly drive: OrbDrive = { state: "idle" };

  constructor() {
    effect(() => {
      this.drive.state = this.state();
      this.drive.params = this.params();
      this.drive.colors = this.colors();
      this.drive.statePresets = this.statePresets();
      this.drive.stateColors = this.stateColors();
      this.drive.stateVolumes = this.stateVolumes();
      if (!this.listen()) {
        this.drive.volumes = this.volumes();
      }
      const reduce = this.respectReducedMotion() && this.reducedMotion();
      this.drive.paused = this.paused() || (reduce && !this.listen());
    });

    effect((onCleanup) => {
      if (!this.listen()) {
        return;
      }
      let stopped = false;
      let dispose: (() => void) | undefined;
      void startMicDrive((volumes) => {
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
          if (untracked(() => this.errorMessage())) {
            return;
          }
          const message =
            error instanceof Error ? error.message : "Microphone permission was denied";
          console.error(`[${SITE.log}] microphone failed:`, error);
          this.errorMessage.set(message);
        });
      onCleanup(() => {
        stopped = true;
        dispose?.();
      });
    });

    effect((onCleanup) => {
      const canvas = this.canvasRef()?.nativeElement;
      const variant = this.variant();
      const maxDpr = this.maxDpr();
      const pauseOffscreen = this.pauseOffscreen();
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
        onError: (error) => report("stopped rendering", error),
        onFirstFrame: () => this.painted.set(true),
        pauseOffscreen,
        variant,
      });

      void renderer.ready.catch((error: unknown) => report("failed to start", error));

      onCleanup(() => renderer.dispose());
    });
  }
}
