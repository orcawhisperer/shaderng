import { d, std, tgpu } from "typegpu";

/*
 * Aurora: three curtains of light drifting across the frame. Original to shaderng, MIT.
 * Rectangular by design: coordinates are aspect-corrected, nothing here is a sphere.
 */

export const auroraParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_high: d.vec3f,
  c_low: d.vec3f,
  c_mid: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_curl: d.f32,
  p_fill: d.f32,
  p_glow: d.f32,
  p_height: d.f32,
  p_speed: d.f32,
  p_width: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: auroraParams },
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
  for (let i = 0; i < 4; i += 1) {
    value += amplitude * noise2(q);
    q = q.mul(2.03).add(d.vec2f(1.7, 9.2));
    amplitude *= 0.5;
  }
  return value;
});

/** One curtain: a soft band whose centre line wanders with noise. */
const curtain = tgpu.fn(
  [d.vec2f, d.f32, d.f32, d.f32],
  d.f32,
)((p, seed, phase, sway) => {
  "use gpu";
  const u = layout.$.params;
  const centre =
    (fbm(d.vec2f(p.x * 0.9 + seed, phase * 0.35 + seed * 3)) - 0.5) * u.p_curl * 2 + sway;
  const dist = std.abs(p.y - centre) / std.max(u.p_width, 0.02);
  const body = std.exp(-dist * dist);
  // Vertical rays inside the band; the input level sharpens them.
  const rays = 0.55 + 0.45 * noise2(d.vec2f(p.x * 6 + phase * 0.8 + seed * 7, seed));
  const rayMix = std.mix(0.4, 1, std.clamp(u.inputVol, 0, 1));
  return body * std.mix(1, rays, rayMix);
});

const auroraFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const p = input.uv.sub(0.5).mul(d.vec2f(aspect, 1));
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1));

    // The pointer leans the whole sky a little toward itself.
    const sway = m.y * 0.15 + (p.x - m.x) * m.y * 0.1;
    const phase = u.p_speed + u.anim * 0.3;
    const lift = (u.p_height - 0.5) * 0.8;

    const a = curtain(p.add(d.vec2f(0, lift)), 0.3, phase, sway);
    const b = curtain(p.add(d.vec2f(0.4, lift - 0.12)), 1.7, phase * 0.8, sway * 0.6);
    const c = curtain(p.add(d.vec2f(-0.3, lift + 0.15)), 4.1, phase * 1.15, sway * 1.3);

    let col = d.vec3f();
    col = col.add(u.c_low.mul(a));
    col = col.add(u.c_mid.mul(b));
    col = col.add(u.c_high.mul(c));

    const curtainSum = std.max(a + b + c, 0.001);
    const ribbonCol = u.c_low.mul(a).add(u.c_mid.mul(b)).add(u.c_high.mul(c)).div(curtainSum);

    const loud = 1 + 0.6 * std.clamp(u.outputVol, 0, 1);
    const light = std.clamp((a + b + c) * u.p_glow * loud, 0, 1);
    col = col.mul(u.p_glow * loud);

    // Faint stars in the dark, only where no curtain is.
    const star = std.pow(hash21(std.floor(input.uv.mul(u.res).div(3))), 40) * (1 - light);
    col = col.add(d.vec3f(star * 0.6));

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = darkBase.add(col);
    const lightCol = std.mix(u.c_base, ribbonCol, light);
    const finalCol = std.mix(darkCol, lightCol, isLight);

    const alpha = std.clamp(std.max(light, star * (1 - isLight)) + u.p_fill, 0, 1);
    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("auroraFragment");

export const auroraShader = tgpu.resolve([auroraFragment]);
