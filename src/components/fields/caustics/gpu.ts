import { d, std, tgpu } from "typegpu";

/*
 * Caustics: light through slow water, folding onto itself. Original to shaderng, MIT.
 */

const FOLDS = 5;

export const causticsParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_light: d.vec3f,
  c_water: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_fill: d.f32,
  p_focus: d.f32,
  p_scale: d.f32,
  p_speed: d.f32,
  p_stir: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: causticsParams },
  })
  .$idx(0);

/** Filmic tone curve, so overlapping caustic filaments roll off instead of clipping. */
const aces = tgpu.fn(
  [d.vec3f],
  d.vec3f,
)((x) => {
  "use gpu";
  const a = x.mul(x.mul(2.51).add(0.03));
  const b = x.mul(x.mul(2.43).add(0.59)).add(0.14);
  return std.clamp(a.div(b), d.vec3f(), d.vec3f(1));
});

const causticsFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const p0 = input.uv.sub(0.5).mul(d.vec2f(aspect, 1)).mul(u.p_scale);
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1)).mul(u.p_scale);

    // The pointer stirs the surface: a swirl that fades with distance.
    const toMouse = p0.sub(m);
    const r2 = std.dot(toMouse, toMouse);
    const swirl = std.exp(-r2 * 2) * u.p_stir;
    const rot = d.vec2f(
      toMouse.x * std.cos(swirl) - toMouse.y * std.sin(swirl),
      toMouse.x * std.sin(swirl) + toMouse.y * std.cos(swirl),
    );
    let p = d.vec2f(m.add(rot));

    const t = u.p_speed + u.anim * 0.25;
    const breath = 1 + 0.4 * std.clamp(u.inputVol, 0, 1);

    // Fold the plane through a few sine layers. Each fold contributes a thin bright ridge
    // where it crosses zero -- multiplying the folds together instead just averages to
    // grey. Sampling the crossing at three slightly offset phases splits each filament
    // into R/G/B, which is where real caustics get their prismatic edges.
    let web = d.vec3f();
    let haze = d.f32(0);
    for (let i = 0; i < FOLDS; i += 1) {
      const k = d.f32(i) + 1;
      p = p.add(
        d
          .vec2f(
            std.sin(p.y * k * breath + t * (0.6 + k * 0.1)),
            std.cos(p.x * k * breath - t * 0.5),
          )
          .div(k),
      );
      const s = std.sin(p.x * 2.1 + p.y * 1.7 + t * 0.3);
      const sv = d.vec3f(s + 0.055, s, s - 0.055);
      const e = d.vec3f(0.02);
      web = web.add(e.div(e.add(sv.mul(sv))).div(k));
      // Same ridge with a much wider falloff: the light the filaments bleed into the water.
      haze += 0.45 / (0.45 + s * s) / k;
    }

    const focus = std.max(u.p_focus, 0.1);
    const loud = 1 + 0.7 * std.clamp(u.outputVol, 0, 1);
    const shaped = std.pow(
      std.clamp(web.mul(0.55), d.vec3f(), d.vec3f(1)),
      d.vec3f(0.3 + focus * 0.7),
    );
    const bright = std.dot(shaped, d.vec3f(0.299, 0.587, 0.114));

    const depth = std.clamp(0.5 + 0.5 * std.sin(p.x * 0.7 + p.y * 0.9), 0, 1);
    const water = u.c_water.mul(0.35 + 0.35 * depth).add(u.c_light.mul(haze * 0.09));
    const col = aces(water.add(u.c_light.mul(shaped).mul(loud * 1.7)));

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill).mul(1 - bright);
    const darkCol = darkBase.add(col);

    const waterBlend = std.mix(u.c_base, u.c_water, depth * 0.45);
    const lightCol = std.mix(waterBlend, u.c_light, std.clamp(bright * loud * 0.7, 0, 1));
    const finalCol = std.mix(darkCol, lightCol, isLight);

    const alpha = std.clamp(std.max(bright * loud, 0.25) + u.p_fill, 0, 1);
    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("causticsFragment");

export const causticsShader = tgpu.resolve([causticsFragment]);
