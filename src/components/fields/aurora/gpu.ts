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

/** ACES filmic curve: overlapping curtains roll off in colour instead of clipping to white. */
const aces = tgpu.fn(
  [d.vec3f],
  d.vec3f,
)((x) => {
  "use gpu";
  const a = x.mul(x.mul(2.51).add(0.03));
  const b = x.mul(x.mul(2.43).add(0.59)).add(0.14);
  return std.clamp(a.div(b), d.vec3f(0), d.vec3f(1));
});

/**
 * One curtain. Returns the emission and how high up the ribbon this pixel sits, because
 * an aurora's colour changes with altitude: oxygen green low down, nitrogen violet above.
 */
const curtain = tgpu.fn(
  [d.vec2f, d.f32, d.f32, d.f32],
  d.vec2f,
)((p, seed, phase, sway) => {
  "use gpu";
  const u = layout.$.params;
  // The lower edge of the ribbon wanders across the frame.
  const edge =
    (fbm(d.vec2f(p.x * 0.9 + seed, phase * 0.35 + seed * 3)) - 0.5) * u.p_curl * 2 + sway;
  const width = std.max(u.p_width, 0.02);

  // Height above that edge. Screen y grows downward, so up is negative.
  const h = edge - p.y;
  // A hard underside with a long fade upward is the entire silhouette of an aurora; a
  // symmetric band just reads as fog.
  const under = std.exp(-(h * h) / (width * width * 0.3));
  const over = std.exp(-h / (width * 2.4));
  const body = std.mix(under, over, std.step(0, h));

  // Vertical ray filaments: high frequency across x, drifting slowly, sharpened into
  // threads instead of the broad lumps a low-frequency noise gives.
  const coarse = noise2(d.vec2f(p.x * 34 + seed * 11, phase * 0.5 + seed));
  const rays = std.pow(std.clamp(coarse * 1.25, 0, 1), 1.8);
  const rayMix = std.mix(0.45, 0.9, std.clamp(u.inputVol, 0, 1));

  return d.vec2f(body * std.mix(1, rays, rayMix), std.clamp(h / (width * 3), 0, 1));
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

    // Brightness travelling along the curtains so they shimmer instead of sitting still.
    const sh1 = 0.72 + 0.28 * std.sin(p.x * 4.5 - phase * 1.7);

    const ca = curtain(p.add(d.vec2f(0, lift)), 0.3, phase, sway);
    const cb = curtain(p.add(d.vec2f(0.4, lift - 0.12)), 1.7, phase * 0.8, sway * 0.6);
    const cc = curtain(p.add(d.vec2f(-0.3, lift + 0.15)), 4.1, phase * 1.15, sway * 1.3);

    const a = ca.x * sh1;
    const b = cb.x * sh1 * 0.8;
    const c = cc.x * 0.65;

    // Colour climbs with altitude inside each ribbon rather than each ribbon being one
    // flat hue, which is what stops the three of them merging into a single wash.
    const colA = std.mix(u.c_low, u.c_mid, ca.y);
    const colB = std.mix(u.c_mid, u.c_high, cb.y);
    const colC = std.mix(u.c_low, u.c_high, cc.y);

    const curtainSum = std.max(a + b + c, 0.001);
    const ribbonCol = colA.mul(a).add(colB.mul(b)).add(colC.mul(c)).div(curtainSum);

    const loud = 1 + 0.6 * std.clamp(u.outputVol, 0, 1);
    const light = std.clamp((a + b + c) * u.p_glow * loud * 0.7, 0, 1);
    let col = colA
      .mul(a)
      .add(colB.mul(b))
      .add(colC.mul(c))
      .mul(u.p_glow * loud * 0.45);

    // Airglow: the faint band of light that sits on the horizon under every aurora.
    const horizon = std.exp(-std.abs(p.y - 0.46) * 9) * 0.16 * u.p_glow;
    col = col.add(std.mix(u.c_low, u.c_mid, 0.5).mul(horizon));

    // Round, resolution-independent stars, dimmed where a curtain covers them.
    const starUV = p.mul(34);
    const cell = std.floor(starUV);
    const frac = std.fract(starUV);
    const jx = hash21(cell);
    const jy = hash21(cell.add(d.vec2f(31.7, 13.9)));
    const seed = hash21(cell.mul(1.3).add(7.1));
    const ds = std.length(frac.sub(d.vec2f(jx * 0.7 + 0.15, jy * 0.7 + 0.15)));
    const twinkle = 0.5 + 0.5 * std.sin(u.time * 2.1 + seed * 37);
    const star = std.smoothstep(0.09, 0, ds) * std.pow(seed, 11) * twinkle * (1 - light);
    col = col.add(std.mix(d.vec3f(1), u.c_high, 0.25).mul(star * 1.4));

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));

    // Tone map the dark path so crossing curtains keep their colour instead of clipping.
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = darkBase.add(aces(col.mul(1.15)));
    const lightCol = std.mix(u.c_base, ribbonCol, light);
    let finalCol = std.mix(darkCol, lightCol, isLight);

    // Sub-LSB dither: the sky is one big smooth gradient and will band without it.
    finalCol = finalCol.add(d.vec3f((hash21(input.uv.mul(u.res)) - 0.5) * 0.004));

    const alpha = std.clamp(std.max(light, star * (1 - isLight)) + u.p_fill, 0, 1);
    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("auroraFragment");

export const auroraShader = tgpu.resolve([auroraFragment]);
