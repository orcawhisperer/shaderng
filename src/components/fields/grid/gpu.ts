import { d, std, tgpu } from "typegpu";

/*
 * Grid: a lattice of dots that ripples away from the pointer and breathes with the voice.
 * Original to shaderng, MIT.
 */

export const gridParams = d.struct({
  anim: d.f32,
  c_accent: d.vec3f,
  c_base: d.vec3f,
  c_dot: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_dot: d.f32,
  p_fill: d.f32,
  p_reach: d.f32,
  p_ripple: d.f32,
  p_spacing: d.f32,
  p_speed: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: gridParams },
  })
  .$idx(0);

const gridFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const p = input.uv.sub(0.5).mul(d.vec2f(aspect, 1));
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1));

    // Cells are `spacing` fractions of the height; the pointer sits on a dot, not between two.
    const spacing = std.max(u.p_spacing, 0.01);
    const cell = std.floor(p.div(spacing).add(0.5));
    const centre = cell.mul(spacing);
    const local = p.sub(centre);

    const toMouse = centre.sub(m);
    const dist = std.length(toMouse);
    const reach = std.max(u.p_reach, 0.05);
    const near = std.exp(-(dist * dist) / (reach * reach));

    // Rings travelling out from the pointer; the voice adds a second, faster set.
    const phase = u.p_speed;
    const ring = 0.5 + 0.5 * std.sin(dist * u.p_ripple - phase * 4);
    const pulse = 0.5 + 0.5 * std.sin(dist * u.p_ripple * 2.5 - u.anim * 6);
    const voice = std.clamp(u.outputVol, 0, 1);
    const lift = ring * near + pulse * voice * 0.6 * std.exp(-dist * 1.2);

    // A slow tide across the whole lattice so it is never static.
    const tide = 0.5 + 0.5 * std.sin(centre.x * 3 + centre.y * 2 + u.time * 0.6);
    const breathe = 1 + 0.35 * std.clamp(u.inputVol, 0, 1);

    const radius = spacing * u.p_dot * (0.55 + 0.25 * tide + lift) * breathe;
    const edge = spacing * 0.08;
    const dot = 1 - std.smoothstep(radius - edge, radius + edge, std.length(local));

    // Dots near the pointer or in a ring take the accent colour.
    const accent = std.clamp(near * 0.8 + lift * 0.6, 0, 1);
    const dotCol = std.mix(u.c_dot, u.c_accent, accent);
    const strength = std.mix(0.45, 1, std.clamp(accent + voice * 0.4, 0, 1));

    const alpha = std.clamp(dot * strength + u.p_fill, 0, 1);
    const col = u.c_base
      .mul(u.p_fill)
      .mul(1 - dot)
      .add(dotCol.mul(dot * strength));
    return d.vec4f(std.clamp(col, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("gridFragment");

export const gridShader = tgpu.resolve([gridFragment]);
