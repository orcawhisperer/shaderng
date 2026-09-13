import {
  ChangeDetectionStrategy,
  Component,
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
import { cn } from "@/lib/utils";

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
        [style.opacity]="painted() ? 1 : 0"
        [attr.aria-label]="ariaLabel()"
      ></canvas>
      @if (errorMessage()) {
        <p
          class="text-muted-foreground absolute inset-0 flex items-center justify-center p-4 text-center text-sm"
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
  readonly statePresets =
    input<Partial<Record<OrbState, Record<string, number>>> | undefined>(undefined);
  readonly stateColors =
    input<Partial<Record<OrbState, Record<string, string>>> | undefined>(undefined);
  readonly stateVolumes =
    input<Partial<Record<OrbState, { input?: number; output?: number }>> | undefined>(
      undefined,
    );
  readonly volumes = input<{ input?: number; output?: number } | undefined>(undefined);
  readonly paused = input(false);
  readonly pauseOffscreen = input(true);
  readonly maxDpr = input(2);
  readonly className = input<string | undefined>(undefined);
  readonly style = input<Record<string, string> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  protected readonly painted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly cn = cn;

  private readonly drive: OrbDrive = { state: "idle" };

  constructor() {
    effect(() => {
      this.drive.state = this.state();
      this.drive.params = this.params();
      this.drive.colors = this.colors();
      this.drive.statePresets = this.statePresets();
      this.drive.stateColors = this.stateColors();
      this.drive.stateVolumes = this.stateVolumes();
      this.drive.volumes = this.volumes();
      this.drive.paused = this.paused();
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

      const renderer = createOrbRenderer({
        canvas,
        drive: () => this.drive,
        maxDpr,
        onFirstFrame: () => this.painted.set(true),
        pauseOffscreen,
        variant,
      });

      void renderer.ready.catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "WebGPU failed to start";
        console.error(`[shadercn-angular] ${untracked(() => this.variant().key)} failed to start:`, error);
        this.errorMessage.set(
          /gpu|webgpu|adapter/i.test(message)
            ? "WebGPU is not available in this browser. Try Chrome or Edge 113+ with hardware acceleration."
            : message,
        );
      });

      onCleanup(() => renderer.dispose());
    });
  }
}
