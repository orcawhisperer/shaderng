import type { OrbState, OrbVariant } from "@/components/orbs/renderer";
import { SITE } from "@/lib/site";

export interface SnippetDraft {
  autoDrive: boolean;
  colors: Record<string, string>;
  input: number;
  output: number;
  params: Record<string, number>;
}

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));

export const buildAngularSnippet = ({
  draft,
  listen = false,
  size,
  slug,
  state,
  variant,
}: {
  draft: SnippetDraft;
  listen?: boolean;
  size: number;
  slug: string;
  state: OrbState;
  variant: Pick<OrbVariant, "params" | "colors" | "statePresets" | "stateColors">;
}): string => {
  const component = `Orb${slug.slice(-2)}`;
  const params = variant.params
    .filter((p) => draft.params[p.key] !== (variant.statePresets?.[state]?.[p.key] ?? p.default))
    .map((p) => `${p.key}: ${formatNumber(draft.params[p.key])}`);
  const colors = variant.colors
    .filter((c) => draft.colors[c.key] !== (variant.stateColors?.[state]?.[c.key] ?? c.default))
    .map((c) => `${c.key}: "${draft.colors[c.key]}"`);

  const lines = [
    `    <${slug}`,
    `      [size]="${size}"`,
    `      state="${state}"`,
    ...(params.length > 0 ? [`      [params]="{ ${params.join(", ")} }"`] : []),
    ...(colors.length > 0 ? [`      [colors]="{ ${colors.join(", ")} }"`] : []),
    ...(listen ? [`      [listen]="true"`] : []),
    ...(!listen && !draft.autoDrive
      ? [
          `      [volumes]="{ input: ${formatNumber(draft.input)}, output: ${formatNumber(draft.output)} }"`,
        ]
      : []),
    "    />",
  ];

  return `import { ${component} } from "@/components/orbs/${slug}";

@Component({
  imports: [${component}],
  template: \`
${lines.join("\n")}
  \`,
})
export class Example {}`;
};

export const formatControlValue = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));

/** GitHub `owner/repo` of this site, derived from SITE.github so a fork only edits one place. */
const repoSlug = (): string => new URL(SITE.github).pathname.replace(/^\/|\.git$|\/$/g, "");

/** Files every orb depends on, relative to the repo root. */
export const RUNTIME_PATHS = [
  "src/components/orbs/renderer.ts",
  "src/components/orbs/canvas.ts",
  "src/components/orbs/orb-base.ts",
  "src/components/orbs/shader-orb.ts",
  "src/lib/audio-drive.ts",
  "src/lib/mic-drive.ts",
  "src/lib/reduced-motion.ts",
  "src/lib/site.ts",
  "src/lib/utils.ts",
  "tools/typegpu.esbuild.ts",
] as const;

/**
 * A runnable shell command that fetches one orb folder from GitHub with degit,
 * which downloads a subdirectory without cloning the whole repository.
 */
export const orbInstallCommand = (slug: string): string =>
  `npx degit ${repoSlug()}/src/components/orbs/${slug} src/components/orbs/${slug}`;

/** The one-time commands that fetch the shared runtime files. */
export const runtimeInstallCommands = (): string =>
  [
    "npm i vgpu typegpu",
    "npm i -D unplugin-typegpu @babel/core @babel/preset-typescript @webgpu/types @angular-builders/custom-esbuild",
    ...RUNTIME_PATHS.map((path) => `npx degit ${repoSlug()}/${path} ${path}`),
  ].join("\n");
