// Compiles every orb and field shader with a real WebGPU implementation (Dawn, through the
// `webgpu` package that vgpu's node adapter brings in) and builds a render pipeline for each
// against vgpu's fullscreen vertex stage. Catches WGSL errors that TypeScript cannot see and
// interface mismatches (entry points, bindings). With --render it also draws one frame with
// default uniforms and fails shaders that output nothing.
//
//   node tools/check-shaders.mjs                 # compile + pipeline, all shaders
//   node tools/check-shaders.mjs aurora orb-07   # a subset
//   node tools/check-shaders.mjs --render        # also draw (needs a real Vulkan/Metal/D3D device)
//
// The default uses Dawn's null backend, which runs the full Tint front end and pipeline
// validation without any GPU driver, so it works in CI. --render needs a real device.
import { build } from "esbuild";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const render = args.includes("--render");
const only = new Set(args.filter((arg) => !arg.startsWith("--")));

const variantsOf = (dir, suffix) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => existsSync(join(dir, name, "meta.ts")))
        .map((slug) => ({ slug, file: join(dir, slug, "meta.ts"), suffix }))
    : [];
const entries = [
  ...variantsOf(join(root, "src/components/orbs"), "Orb"),
  ...variantsOf(join(root, "src/components/fields"), "Field"),
].filter((entry) => only.size === 0 || only.has(entry.slug));

// One bundle that re-exports every variant, plus typegpu's data helpers for the byte image.
const camel = (slug) => slug.replace(/-(\w)/g, (_m, c) => c.toUpperCase());
const entrySource = [
  'export { d } from "typegpu";',
  ...entries.map(
    (e, i) =>
      `import * as m${i} from ${JSON.stringify(e.file)}; export const v${i} = m${i}.${camel(e.slug)}${e.suffix};`,
  ),
  `export const all = [${entries.map((_e, i) => `v${i}`).join(", ")}];`,
].join("\n");

// Inside the workspace so bare imports (typegpu) resolve against node_modules.
const out = join(root, "dist", ".check-shaders");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "entry.mjs"), entrySource);
const { default: typegpuPlugins } = await import(
  pathToFileURL(join(root, "tools/typegpu.esbuild.ts"))
);
await build({
  entryPoints: [join(out, "entry.mjs")],
  outfile: join(out, "bundle.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
  absWorkingDir: root,
  alias: { "@": join(root, "src") },
  plugins: typegpuPlugins(),
  logLevel: "error",
});
const { d, all } = await import(pathToFileURL(join(out, "bundle.mjs")));

// Dawn resolves its promises from the libuv loop; without a live handle Node exits mid-await.
// The bundle must be imported before the device exists: the other order trips a Dawn/ESM
// threading assertion on Linux.
const keepAlive = setInterval(() => {}, 20);
const { create, globals } = require("webgpu");
Object.assign(globalThis, globals);
const adapter = await create(render ? [] : ["backend=null"]).requestAdapter();
if (!adapter) {
  console.log("check-shaders: no WebGPU adapter available; skipping.");
  clearInterval(keepAlive);
  process.exit(0);
}
const device = await adapter.requestDevice();
console.log(
  `check-shaders: ${adapter.info.description || adapter.info.vendor || "Dawn null backend"}`,
);

// vgpu prepends this fullscreen vertex stage to fragment-only effects.
const VERTEX = `
struct VOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  var pos = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var uv = array<vec2f, 3>(vec2f(0.0, 1.0), vec2f(2.0, 1.0), vec2f(0.0, -1.0));
  var out: VOut; out.position = vec4f(pos[vi], 0.0, 1.0); out.uv = uv[vi]; return out;
}`;

const WIDTH = 128; // rows must be 256-byte aligned for the readback copy
const HEIGHT = 72;

const hex = (value) => {
  const n = Number.parseInt(value.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Default uniform bytes: every param at its default, colours as declared, a mid-frame state. */
const uniformBytes = (variant) => {
  const schema = variant.uniforms;
  const size = Math.ceil(d.sizeOf(schema) / 16) * 16;
  const words = new Float32Array(size / 4);
  const at = (field) => d.memoryLayoutOf(schema, (f) => f[field]).offset / 4;
  words[at("time")] = 3.2;
  words[at("anim")] = 7.5;
  words[at("inputVol")] = 0.3;
  words[at("outputVol")] = 0.5;
  words[at("res")] = WIDTH;
  words[at("res") + 1] = HEIGHT;
  words[at("mouse")] = 0.5;
  words[at("mouse") + 1] = 0.5;
  for (const p of variant.params) {
    words[at(`p_${p.key}`)] = p.integrate ? p.default * 5 : p.default;
  }
  for (const c of variant.colors) {
    const [r, g, b] = hex(c.default);
    const slot = at(`c_${c.key}`);
    words[slot] = r;
    words[slot + 1] = g;
    words[slot + 2] = b;
  }
  return words;
};

const fragmentEntry = (wgsl) => /@fragment\s+fn\s+(\w+)/.exec(wgsl)?.[1];

let failures = 0;
for (const variant of all) {
  const label = variant.key.padEnd(10);
  const module = device.createShaderModule({ code: `${VERTEX}\n${variant.shader}` });
  const step = (name) =>
    process.env.CHECK_SHADERS_DEBUG && console.log(`  ${variant.key}: ${name}`);
  step("compilation info");
  const info = await module.getCompilationInfo();
  const errors = info.messages.filter((m) => m.type === "error");
  if (errors.length) {
    failures += 1;
    console.log(`FAIL ${label} WGSL:`);
    for (const m of errors) {
      console.log(`     :${m.lineNum}:${m.linePos} ${m.message}`);
    }
    continue;
  }

  step("pipeline");
  device.pushErrorScope("validation");
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: {
      module,
      entryPoint: fragmentEntry(variant.shader),
      targets: [{ format: "rgba8unorm" }],
    },
    primitive: { topology: "triangle-list" },
  });
  if (!render) {
    // Pipeline creation is where Dawn validates the fragment interface and bind group layout.
    const validation = await device.popErrorScope();
    if (validation) {
      failures += 1;
      console.log(`FAIL ${label} pipeline: ${validation.message}`);
    } else {
      console.log(`ok   ${label} compiled, pipeline valid`);
    }
    continue;
  }
  const words = uniformBytes(variant);
  const uniform = device.createBuffer({
    size: words.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniform, 0, words);
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  });
  const target = device.createTexture({
    size: [WIDTH, HEIGHT],
    format: "rgba8unorm",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  });
  const bytesPerRow = WIDTH * 4;
  const readback = device.createBuffer({
    size: bytesPerRow * HEIGHT,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      { view: target.createView(), loadOp: "clear", storeOp: "store", clearValue: [0, 0, 0, 0] },
    ],
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(3);
  pass.end();
  encoder.copyTextureToBuffer({ texture: target }, { buffer: readback, bytesPerRow }, [
    WIDTH,
    HEIGHT,
  ]);
  step("submit");
  device.queue.submit([encoder.finish()]);
  step("pop error scope");
  const validation = await device.popErrorScope();
  if (validation) {
    failures += 1;
    console.log(`FAIL ${label} pipeline: ${validation.message}`);
    continue;
  }
  step("map");
  await readback.mapAsync(GPUMapMode.READ);
  step("mapped");
  const pixels = new Uint8Array(readback.getMappedRange());
  let lit = 0;
  let alphaSum = 0;
  let nan = false;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    alphaSum += a;
    if (a > 8 && pixels[i] + pixels[i + 1] + pixels[i + 2] > 24) {
      lit += 1;
    }
  }
  readback.unmap();
  const total = WIDTH * HEIGHT;
  const coverage = lit / total;
  const meanAlpha = alphaSum / total / 255;
  const verdict = coverage > 0.005 ? "ok  " : "FAIL";
  if (verdict === "FAIL") {
    failures += 1;
  }
  console.log(
    `${verdict} ${label} lit ${(coverage * 100).toFixed(1).padStart(5)}%  mean alpha ${meanAlpha.toFixed(2)}${nan ? "  NaN" : ""}`,
  );
  target.destroy();
  uniform.destroy();
  readback.destroy();
}
device.destroy();
clearInterval(keepAlive);
if (failures > 0) {
  console.log(`${failures} shader(s) failed`);
  process.exit(1);
}
