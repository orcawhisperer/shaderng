import { Directive, input } from "@angular/core";

import { OrbInputs } from "@/components/orbs/orb-base";
import type { OrbVariant } from "@/components/orbs/renderer";

/**
 * A field is a rectangular shader: it fills whatever box it is given instead of drawing a
 * sphere. The `<field-xx>` wrappers extend this and render through `<shader-background>` with
 * `fit="fill"`, so every orb input (`state`, `[preset]`, `[audio]`, `paused`, ...) works.
 */
@Directive()
export abstract class FieldBase extends OrbInputs {
  abstract readonly variant: OrbVariant;
  /** Full-bleed canvases have many more pixels than an orb. */
  override readonly maxDpr = input(1.5);
  /** Backgrounds default to 30 paints per second; `0` paints every frame. */
  override readonly maxFps = input(30);
}

export const FIELD_TEMPLATE = `
<shader-background
  fit="fill"
  [variant]="variant"
  [preset]="preset()"
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
  [fallback]="fallbackTemplate()?.template"
/>
`;

/** Same footprint as `<shader-background>`: absolute, filling the positioned parent. */
export const FIELD_STYLES = `
  :host {
    display: block;
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
`;

export const FIELD_HOST = { "aria-hidden": "true" };
