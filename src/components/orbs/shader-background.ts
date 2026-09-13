import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  type TemplateRef,
} from "@angular/core";

import { OrbInputs } from "@/components/orbs/orb-base";
import type { OrbVariant } from "@/components/orbs/renderer";
import { ShaderOrb, type ShaderOrbFallbackContext } from "@/components/orbs/shader-orb";

export type ShaderBackgroundFit = "cover" | "contain" | "fill";

/**
 * An orb as a full-bleed background: fills its positioned parent and keeps rendering while
 * the shader stays square underneath, so no GPU program changes are needed.
 *
 * ```html
 * <section class="relative">
 *   <shader-background [variant]="orb07Orb" state="thinking" />
 *   <h1 class="relative">Hello</h1>
 * </section>
 * ```
 *
 * The host is `position: absolute; inset: 0` by default; give it a `position` and a height of
 * its own in CSS to use it as a block instead. It is decorative (`aria-hidden`) and paints at
 * 30 fps unless `maxFps` says otherwise.
 */
@Component({
  selector: "shader-background",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShaderOrb],
  host: { "aria-hidden": "true" },
  template: `
    @if (side() > 0) {
      <shader-orb
        class="shader-background-orb"
        [variant]="variant()"
        [preset]="preset()"
        [size]="side()"
        [width]="fill() ? box().width : undefined"
        [height]="fill() ? box().height : undefined"
        [state]="state()"
        [params]="params()"
        [colors]="colors()"
        [statePresets]="statePresets()"
        [stateColors]="stateColors()"
        [stateVolumes]="stateVolumes()"
        [volumes]="volumes()"
        [audio]="audio()"
        [listen]="listen()"
        [paused]="paused()"
        [pauseOffscreen]="pauseOffscreen()"
        [respectReducedMotion]="respectReducedMotion()"
        [maxDpr]="maxDpr()"
        [maxFps]="maxFps()"
        [trackPointer]="trackPointer()"
        [mouse]="mouse()"
        [className]="className()"
        [style]="style()"
        [ariaLabel]="ariaLabel()"
        [fallback]="fallback() ?? fallbackTemplate()?.template"
        [fallbackMessage]="false"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .shader-background-orb {
      display: block;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  `,
})
export class ShaderBackground extends OrbInputs {
  /** The orb to draw, e.g. `orb07Orb` from `@/components/orbs/orb-07`. */
  readonly variant = input.required<OrbVariant>();
  /**
   * `cover` fills the box and crops the orb's edges; `contain` fits the whole orb inside;
   * `fill` gives the shader the whole rectangle, for fields (`src/components/fields`) that are
   * drawn aspect-aware rather than as a sphere.
   */
  readonly fit = input<ShaderBackgroundFit>("cover");
  /** Zoom on top of `fit`, e.g. `1.4` to push the orb's rim past the edges. */
  readonly scale = input(1);
  /** Backgrounds default to 30 paints per second; `0` paints every frame. */
  override readonly maxFps = input(30);
  /** A fallback template passed down by a wrapper (`<field-xx>`); content templates also work. */
  readonly fallback = input<TemplateRef<ShaderOrbFallbackContext> | undefined>(undefined);
  /** A full-bleed canvas has many more pixels than an orb, so cap device pixels lower. */
  override readonly maxDpr = input(1.5);

  protected readonly box = signal({ width: 0, height: 0 });
  protected readonly fill = computed(() => this.fit() === "fill");

  /** Side of the square the orb renders at, from the host's box, `fit` and `scale`. */
  protected readonly side = computed(() => {
    const { width, height } = this.box();
    if (width <= 0 || height <= 0) {
      return 0;
    }
    const fit = this.fit();
    if (fit === "fill") {
      return 1;
    }
    const base = fit === "cover" ? Math.max(width, height) : Math.min(width, height);
    return Math.max(1, Math.round(base * this.scale()));
  });

  constructor() {
    super();
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const measure = () => {
      const rect = host.getBoundingClientRect();
      this.box.set({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }
}
