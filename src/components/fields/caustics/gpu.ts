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

    // Fold the plane through a few sine layers; the product of the folds is the caustic.
    let light = d.f32(1);
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
      light *= 0.5 + 0.5 * std.sin(p.x * 2.1 + p.y * 1.7 + t * 0.3);
    }

    const focus = std.max(u.p_focus, 0.1);
    const bright = std.pow(std.clamp(light * 1.6, 0, 1), focus);
    const loud = 1 + 0.7 * std.clamp(u.outputVol, 0, 1);

    const depth = std.clamp(0.5 + 0.5 * std.sin(p.x * 0.7 + p.y * 0.9), 0, 1);
    const water = u.c_water.mul(0.35 + 0.35 * depth);
    const col = water.add(u.c_light.mul(bright * loud));

    const alpha = std.clamp(std.max(bright * loud, 0.25) + u.p_fill, 0, 1);
    const base = u.c_base.mul(u.p_fill).mul(1 - bright);
    return d.vec4f(std.clamp(base.add(col), d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("causticsFragment");

export const causticsShader = tgpu.resolve([causticsFragment]);
