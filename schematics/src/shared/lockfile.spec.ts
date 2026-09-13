import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fingerprint, normalizeForHash } from "./lockfile";

describe("fingerprint", () => {
  it("ignores what Prettier changes", () => {
    const ours = `import { a, b } from "x";\nexport const f = (n: number) => {\n  return [a, b, n];\n};\n`;
    const theirs = `import {a, b} from 'x'\nexport const f = (n: number) => { return [a, b, n] }\n`;
    assert.equal(fingerprint(ours), fingerprint(theirs));
  });

  it("changes when the code does", () => {
    assert.notEqual(fingerprint(`const a = 1;\n`), fingerprint(`const a = 2;\n`));
    assert.notEqual(fingerprint(`const a = "x";\n`), fingerprint(`const a = "y";\n`));
  });
});

describe("normalizeForHash", () => {
  it("undoes the per-project SOURCE_ROOT rewrite in the esbuild plugin only", () => {
    const rewritten = `const SOURCE_ROOT = "app/src";\nrest`;
    assert.equal(
      normalizeForHash("tools/typegpu.esbuild.ts", rewritten),
      `const SOURCE_ROOT = "src";\nrest`,
    );
    assert.equal(normalizeForHash("src/other.ts", rewritten), rewritten);
  });
});
