import { d, std, tgpu } from "typegpu";

/*
 * Flow: domain-warped noise, smoke that never repeats. Original to shaderng, MIT.
 */

export const flowParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_deep: d.vec3f,
  c_light: d.vec3f,
  c_mid: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_contrast: d.f32,
  p_fill: d.f32,
  p_pull: d.f32,
  p_scale: d.f32,
  p_speed: d.f32,
  p_warp: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: flowParams },
  })
  .$idx(0);

const hash21 = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  const q = std.fract(p.mul(d.vec2f(123.34, 456.21)));
  const r = q.add(std.dot(q, q.add(45.32)));
  return std.fract(r.x * r.y);
});

const noise2 = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  const i = std.floor(p);
  const f = std.fract(p);
  const u = f.mul(f).mul(f.mul(-2).add(3));
  const a = hash21(i);
  const b = hash21(i.add(d.vec2f(1, 0)));
  const c = hash21(i.add(d.vec2f(0, 1)));
  const e = hash21(i.add(d.vec2f(1, 1)));
  return std.mix(std.mix(a, b, u.x), std.mix(c, e, u.x), u.y);
});

const fbm = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  let value = d.f32(0);
  let amplitude = d.f32(0.5);
  let q = d.vec2f(p);
  for (let i = 0; i < 5; i += 1) {
    value += amplitude * noise2(q);
    // Rotate a little each octave so the grid never shows.
    q = d.vec2f(q.x * 1.6 - q.y * 1.2, q.x * 1.2 + q.y * 1.6).add(d.vec2f(3.1, 7.3));
    amplitude *= 0.5;
  }
  return value;
});

const flowFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    let p = d.vec2f(input.uv.sub(0.5).mul(d.vec2f(aspect, 1)).mul(u.p_scale));
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1)).mul(u.p_scale);

    // The pointer pulls the smoke toward itself, falling off with distance.
    const toMouse = m.sub(p);
    const pull = std.exp(-std.dot(toMouse, toMouse) * 1.5) * u.p_pull;
    p = p.add(toMouse.mul(pull));

    const t = u.p_speed + u.anim * 0.2;
    const warp = u.p_warp * (1 + 0.5 * std.clamp(u.inputVol, 0, 1));

    const q = d.vec2f(fbm(p.add(d.vec2f(0, t * 0.3))), fbm(p.add(d.vec2f(5.2, 1.3 + t * 0.2))));
    const r = d.vec2f(
      fbm(p.add(q.mul(warp)).add(d.vec2f(1.7, 9.2 + t * 0.15))),
      fbm(p.add(q.mul(warp)).add(d.vec2f(8.3, 2.8 - t * 0.12))),
    );
    const v = fbm(p.add(r.mul(warp)));

    const contrast = std.max(u.p_contrast, 0.1);
    const shade = std.pow(std.clamp(v * 1.4 - 0.15, 0, 1), contrast);
    const veil = std.clamp(std.length(q) * 0.9, 0, 1);

    let col = std.mix(u.c_deep, u.c_mid, shade);
    col = std.mix(col, u.c_light, std.clamp(r.x * r.y * 2.2, 0, 1) * shade);
    const loud = 1 + 0.5 * std.clamp(u.outputVol, 0, 1);
    col = col.mul(loud);

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = darkBase.mul(1 - shade).add(col.mul(std.max(shade, 0.35)));
    const lightCol = std.mix(u.c_base, col, std.clamp(shade * 0.9 + veil * 0.2, 0, 1));
    const finalCol = std.mix(darkCol, lightCol, isLight);

    const alpha = std.clamp(std.max(shade, veil * 0.35) + u.p_fill, 0, 1);
    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("flowFragment");

export const flowShader = tgpu.resolve([flowFragment]);
