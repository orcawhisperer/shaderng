// Builds the publishable `shaderng` npm package (the `ng add` schematics) into dist/schematics.
//
// The schematic copies source files into the consumer's project, so this script bundles the
// runtime listed in src/lib/runtime-files.json plus every orb folder, and records the dependency
// versions this repository is currently pinned to so `ng add` installs the same ones.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "schematics");
const out = join(root, "dist", "schematics");
const filesOut = join(out, "files");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const runtime = readJson(join(root, "src/lib/runtime-files.json"));
const rootPackage = readJson(join(root, "package.json"));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", join(source, "tsconfig.json")], {
  stdio: "inherit",
});

for (const file of ["collection.json", "package.json", "README.md"]) {
  cpSync(join(source, file), join(out, file));
}
cpSync(join(root, "LICENSE"), join(out, "LICENSE"));
for (const schematic of ["ng-add", "orb"]) {
  cpSync(join(source, "src", schematic, "schema.json"), join(out, schematic, "schema.json"));
}

for (const relative of [...runtime.source, ...runtime.tools]) {
  const from = join(root, relative);
  if (!existsSync(from)) {
    throw new Error(`runtime file listed in runtime-files.json is missing: ${relative}`);
  }
  const to = join(filesOut, "runtime", relative);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
}

const orbsDir = join(root, "src/components/orbs");
const slugs = readdirSync(orbsDir)
  .filter((name) => /^orb-\d{2}$/.test(name))
  .sort();
for (const slug of slugs) {
  cpSync(join(orbsDir, slug), join(filesOut, "orbs", slug), { recursive: true });
}

const pick = (names) =>
  Object.fromEntries(
    names.map((name) => {
      const version = rootPackage.dependencies?.[name] ?? rootPackage.devDependencies?.[name];
      if (!version) {
        throw new Error(`${name} is listed in runtime-files.json but not in package.json`);
      }
      return [name, version];
    }),
  );
writeFileSync(
  join(out, "versions.json"),
  `${JSON.stringify(
    { dependencies: pick(runtime.dependencies), devDependencies: pick(runtime.devDependencies) },
    null,
    2,
  )}\n`,
);

const pkg = readJson(join(out, "package.json"));
console.log(
  `built ${pkg.name}@${pkg.version} -> dist/schematics (${slugs.length} orbs, ${
    runtime.source.length + runtime.tools.length
  } runtime files)`,
);
