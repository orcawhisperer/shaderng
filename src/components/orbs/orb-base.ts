import { contentChild, Directive, input } from "@angular/core";

import type {
  OrbColorValues,
  OrbParamValues,
  OrbState,
  OrbVariant,
} from "@/components/orbs/renderer";
import { ShaderOrbFallback } from "@/components/orbs/shader-orb";
import type { OrbAudioSource } from "@/lib/audio-drive";

@Directive()
export abstract class OrbBase {
  abstract readonly variant: OrbVariant;

  readonly size = input(280);
  readonly state = input<OrbState>("idle");
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
  readonly className = input<string | undefined>(undefined);
  readonly style = input<Record<string, string> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  /** `<ng-template shaderOrbFallback>` placed inside the orb tag; forwarded to `<shader-orb>`. */
  readonly fallbackTemplate = contentChild(ShaderOrbFallback);
}

export const ORB_TEMPLATE = `
<shader-orb
  [variant]="variant"
  [size]="size()"
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
  [className]="className()"
  [style]="style()"
  [ariaLabel]="ariaLabel()"
  [fallback]="fallbackTemplate()?.template"
/>
`;
