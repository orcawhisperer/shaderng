import { transformSync } from "@babel/core";
import type { OnResolveArgs, Plugin } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";
import typegpuBabel from "unplugin-typegpu/babel";

const GPU_IMPORT = /(?:^|[\\/])gpu(?:\.[cm]?[jt]sx?)?$/;

/** Where the `@/*` path alias points, relative to the workspace root. `ng add shaderng` rewrites this. */
const SOURCE_ROOT = "src";

const toGpuFile = (args: OnResolveArgs, workspaceRoot: string): string | null => {
  if (!GPU_IMPORT.test(args.path)) {
    return null;
  }

  let filePath: string;
  if (args.path.startsWith("@/")) {
    filePath = path.join(workspaceRoot, SOURCE_ROOT, args.path.slice(2));
  } else if (path.isAbsolute(args.path)) {
    filePath = args.path;
  } else {
    filePath = path.resolve(args.resolveDir, args.path);
  }

  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
    filePath = filePath.replace(/\.(?:mjs|js)$/, ".ts");
  } else if (!filePath.endsWith(".ts")) {
    filePath = `${filePath}.ts`;
  }

  return filePath;
};

const plugin: Plugin = {
  name: "typegpu-gpu-ts",
  setup(build) {
    const workspaceRoot = build.initialOptions.absWorkingDir ?? process.cwd();

    build.onResolve({ filter: GPU_IMPORT }, (args) => {
      const filePath = toGpuFile(args, workspaceRoot);
      if (!filePath) {
        return null;
      }
      // Drop the .ts suffix so Angular's onLoad (filter: /[jt]sx?$/) does not steal this file.
      return {
        namespace: "typegpu-gpu",
        path: filePath.replace(/\.ts$/, ""),
        pluginData: { gpuTs: filePath },
      };
    });

    build.onLoad({ filter: /.*/, namespace: "typegpu-gpu" }, async (args) => {
      const sourcePath =
        (args.pluginData as { gpuTs?: string } | undefined)?.gpuTs ?? `${args.path}.ts`;
      const source = await readFile(sourcePath, "utf8");
      const result = transformSync(source, {
        babelrc: false,
        configFile: false,
        filename: sourcePath,
        plugins: [typegpuBabel],
        presets: ["@babel/preset-typescript"],
        sourceMaps: "inline",
      });
      if (!result?.code) {
        throw new Error(`TypeGPU transform produced no output for ${args.path}`);
      }
      return {
        contents: result.code,
        loader: "js",
        resolveDir: path.dirname(sourcePath),
      };
    });
  },
};

export default function typegpuPlugins() {
  return [plugin];
}
