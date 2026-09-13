import { contentChild, Directive, input } from "@angular/core";

import type {
  OrbColorValues,
  OrbParamValues,
  OrbPreset,
  OrbState,
  OrbVariant,
} from "@/components/orbs/renderer";
import { ShaderOrbFallback } from "@/components/orbs/shader-orb";
import type { OrbAudioSource } from "@/lib/audio-drive";

/**
 * The inputs every orb element accepts, mirrored onto `<shader-orb>`. Shared by the generated
 * `<orb-xx>` wrappers (through {@link OrbBase}) and `<shader-background>`.
 */
@Directive()
export abstract class OrbInputs {
  /** A saved look from the playground; explicit inputs on the element override it. */
  readonly preset = input<OrbPreset | undefined>(undefined);
  /** Defaults to the preset's size, then 280. */
  readonly size = input<number | undefined>(undefined);
  readonly state = input<OrbState | undefined>(undefined);
  /** Saved or explicit look theme: 'light', 'dark', or 'auto' (follows document / system). */
  readonly theme = input<"light" | "dark" | "auto">("auto");
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
  readonly audio = input<OrbAudioSource | undefined>(undefined);
  readonly listen = input(false);
  readonly paused = input(false);
  readonly pauseOffscreen = input(true);
  readonly respectReducedMotion = input(true);
  readonly maxDpr = input(2);
  readonly maxFps = input(0);
  readonly trackPointer = input(true);
  readonly mouse = input<{ x: number; y: number } | undefined>(undefined);
  readonly className = input<string | undefined>(undefined);
  readonly style = input<Record<string, string> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  /** `<ng-template shaderOrbFallback>` placed inside the orb tag; forwarded to `<shader-orb>`. */
  readonly fallbackTemplate = contentChild(ShaderOrbFallback);
}

@Directive()
export abstract class OrbBase extends OrbInputs {
  abstract readonly variant: OrbVariant;
}

export const ORB_TEMPLATE = `
<shader-orb
  [variant]="variant"
  [preset]="preset()"
  [theme]="theme()"
  [size]="size() ?? preset()?.size ?? 280"
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
