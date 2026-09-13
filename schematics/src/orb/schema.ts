export interface OrbOptions {
  orbs?: string;
  project?: string;
  force?: boolean;
  list?: boolean;
  /** A playground link whose look is written as `<name>.preset.ts`. */
  preset?: string;
  name?: string;
}
