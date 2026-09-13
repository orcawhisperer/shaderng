import { HostTree, type Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import { join } from "node:path";

/** Mirrors `ng new demo --defaults --style=css` on Angular CLI 22.1, including the tsconfig comments. */
export const FRESH_APP = {
  "angular.json": JSON.stringify(
    {
      $schema: "./node_modules/@angular/cli/lib/config/schema.json",
      version: 1,
      cli: { packageManager: "npm" },
      newProjectRoot: "projects",
      projects: {
        demo: {
          projectType: "application",
          schematics: {},
          root: "",
          sourceRoot: "src",
          prefix: "app",
          architect: {
            build: {
              builder: "@angular/build:application",
              options: {
                browser: "src/main.ts",
                tsConfig: "tsconfig.app.json",
                assets: [{ glob: "**/*", input: "public" }],
                styles: ["src/styles.css"],
              },
              configurations: {
                production: {
                  budgets: [
                    { type: "initial", maximumWarning: "500kB", maximumError: "1MB" },
                    { type: "anyComponentStyle", maximumWarning: "4kB", maximumError: "8kB" },
                  ],
                  outputHashing: "all",
                },
                development: { optimization: false, extractLicenses: false, sourceMap: true },
              },
              defaultConfiguration: "production",
            },
            serve: {
              builder: "@angular/build:dev-server",
              configurations: {
                production: { buildTarget: "demo:build:production" },
                development: { buildTarget: "demo:build:development" },
              },
              defaultConfiguration: "development",
            },
            test: { builder: "@angular/build:unit-test" },
          },
        },
      },
    },
    null,
    2,
  ),
  "tsconfig.json": `/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  },
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
`,
  "tsconfig.app.json": `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": []
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts"
  ]
}
`,
  "package.json": JSON.stringify(
    {
      name: "demo",
      version: "0.0.0",
      private: true,
      dependencies: {
        "@angular/common": "^22.1.0",
        "@angular/core": "^22.1.0",
        rxjs: "~7.8.0",
        tslib: "^2.3.0",
      },
      devDependencies: {
        "@angular/build": "^22.1.8",
        "@angular/cli": "^22.1.8",
        typescript: "~6.0.2",
      },
    },
    null,
    2,
  ),
  "src/main.ts": "",
} as const;

export const freshAppTree = (overrides: Record<string, string> = {}): Tree => {
  const tree = new HostTree();
  for (const [path, content] of Object.entries({ ...FRESH_APP, ...overrides })) {
    tree.create(path, content);
  }
  return tree;
};

/** The compiled collection sits one level above the compiled spec (`<pkg>/ng-add/index.spec.js`). */
export const runner = () =>
  new SchematicTestRunner("shaderng", join(__dirname, "..", "collection.json"));

export const readJson = <T = Record<string, unknown>>(tree: Tree, path: string): T =>
  JSON.parse(tree.readText(path)) as T;
