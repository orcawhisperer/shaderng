import type { OrbState, OrbVariant } from "@/components/orbs/renderer";

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
    .filter(
      (p) =>
        draft.params[p.key] !==
        (variant.statePresets?.[state]?.[p.key] ?? p.default),
    )
    .map((p) => `${p.key}: ${formatNumber(draft.params[p.key])}`);
  const colors = variant.colors
    .filter(
      (c) =>
        draft.colors[c.key] !==
        (variant.stateColors?.[state]?.[c.key] ?? c.default),
    )
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
