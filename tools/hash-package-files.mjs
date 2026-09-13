// Prints the known-hash table entry for a built or unpacked shaderng package, e.g.
//   npm pack shaderng@0.1.0 && tar xzf shaderng-0.1.0.tgz
//   node tools/hash-package-files.mjs package/files 0.1.0
// Merge the output into schematics/src/update/known-hashes.json when a version is published,
// so `ng update` can recognise untouched files from that release in projects without a
// shaderng.json lockfile. Requires `npm run build:schematics` first (uses the compiled hasher).
import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { fingerprint } = createRequire(import.meta.url)(
  join(root, "dist/schematics/shared/lockfile.js"),
);

const [filesDir, version] = process.argv.slice(2);
if (!filesDir || !version) {
  console.error("usage: node tools/hash-package-files.mjs <package>/files <version>");
  process.exit(1);
}

const hashes = {};
const walk = (dir) => {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else {
      hashes[relative(filesDir, full).split(sep).join("/")] = fingerprint(readFileSync(full));
    }
  }
};
walk(filesDir);
console.log(JSON.stringify({ [version]: hashes }, null, 2));
