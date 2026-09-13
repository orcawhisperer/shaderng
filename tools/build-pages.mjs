import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const baseHref = process.env.BASE_HREF ?? "/shaderng/";
const ng = spawnSync(
  "npx",
  ["ng", "build", "--configuration", "production", `--base-href=${baseHref}`],
  { stdio: "inherit", env: process.env },
);

if (ng.status !== 0) {
  process.exit(ng.status ?? 1);
}

const browser = path.join("dist", "shadercn-angular", "browser");
copyFileSync(path.join(browser, "index.html"), path.join(browser, "404.html"));
writeFileSync(path.join(browser, ".nojekyll"), "");
console.log(`GitHub Pages build ready at ${browser} (base href ${baseHref})`);
