import type { OrbState, OrbVariant } from "@/components/orbs/renderer";
import runtimeFiles from "@/lib/runtime-files.json";
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

export const buildFieldAngularSnippet = ({
  draft,
  listen = false,
  slug,
  state,
  variant,
}: {
  draft: SnippetDraft;
  listen?: boolean;
  slug: string;
  state: OrbState;
  variant: Pick<OrbVariant, "params" | "colors" | "statePresets" | "stateColors">;
}): string => {
  const component = `Field${slug.slice(0, 1).toUpperCase()}${slug.slice(1)}`;
  const params = variant.params
    .filter((p) => draft.params[p.key] !== (variant.statePresets?.[state]?.[p.key] ?? p.default))
    .map((p) => `${p.key}: ${formatNumber(draft.params[p.key])}`);
  const colors = variant.colors
    .filter((c) => draft.colors[c.key] !== (variant.stateColors?.[state]?.[c.key] ?? c.default))
    .map((c) => `${c.key}: "${draft.colors[c.key]}"`);

  const lines = [
    `    <field-${slug}`,
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

  return `import { ${component} } from "@/components/fields/${slug}";

@Component({
  imports: [${component}],
  template: \`
    <section class="relative h-80">
${lines.join("\n")}
      <h1 class="relative">Hello</h1>
    </section>
  \`,
})
export class Hero {}`;
};

export const formatControlValue = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));

/** GitHub `owner/repo` of this site, derived from SITE.github so a fork only edits one place. */
const repoSlug = (): string => new URL(SITE.github).pathname.replace(/^\/|\.git$|\/$/g, "");

/** Files every orb depends on, relative to the repo root. */
export const RUNTIME_PATHS: readonly string[] = [...runtimeFiles.source, ...runtimeFiles.tools];

/** The npm package name published for `ng add`. */
export const NG_ADD_PACKAGE = "shaderng";

/** The schematic that copies a single orb after `ng add`, e.g. `ng g shaderng:orb orb-07`. */
export const ngAddCommand = (): string => `ng add ${NG_ADD_PACKAGE}`;

export const ngGenerateOrbCommand = (slug: string): string => `ng g ${NG_ADD_PACKAGE}:orb ${slug}`;

/** The schematic that copies a rectangular field, e.g. `ng g shaderng:field aurora`. */
export const ngGenerateFieldCommand = (slug: string): string =>
  `ng g ${NG_ADD_PACKAGE}:field ${slug}`;

/** Writes the look behind a playground link into the project as `<name>.preset.ts`. */
export const ngPresetCommand = (slug: string, shareUrl: string, name = "look"): string =>
  `${ngGenerateOrbCommand(slug)} --preset "${shareUrl}" --name ${name}`;

/** Refreshes the copied runtime and orb files after the package itself was updated. */
export const ngUpdateCommand = (): string => `ng update ${NG_ADD_PACKAGE}`;

/**
 * A runnable shell command that fetches one orb folder from GitHub with degit,
 * which downloads a subdirectory without cloning the whole repository.
 */
export const orbInstallCommand = (slug: string): string =>
  `npx degit ${repoSlug()}/src/components/orbs/${slug} src/components/orbs/${slug}`;

export const fieldInstallCommand = (slug: string): string =>
  `npx degit ${repoSlug()}/src/components/fields/${slug} src/components/fields/${slug}`;

/** The one-time commands that fetch the shared runtime files. */
export const runtimeInstallCommands = (): string =>
  [
    `npm i ${runtimeFiles.dependencies.join(" ")}`,
    `npm i -D ${runtimeFiles.devDependencies.join(" ")}`,
    ...RUNTIME_PATHS.map((path) => `npx degit ${repoSlug()}/${path} ${path}`),
  ].join("\n");
