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

    // Only this pixel's own cell is evaluated, so a dot wider than the cell gets sliced
    // off at the boundary and turns into a square. Keep it just inside.
    const radius = std.min(
      spacing * u.p_dot * (0.55 + 0.25 * tide + lift) * breathe,
      spacing * 0.46,
    );
    const dLocal = std.length(local);

    // Edge width tracks pixel size so tight spacings stay smooth instead of aliasing, but
    // never widens past the dot itself or the whole cell smears.
    const px = 2.5 / std.max(u.res.y, 1);
    const edge = std.min(std.max(spacing * 0.06, px), radius * 0.8);
    const dot = 1 - std.smoothstep(radius - edge, radius + edge, dLocal);

    // A diagonal band of accent colour sweeping across the lattice, so the field still
    // has somewhere to look when nothing is touching it.
    const sweepPhase = std.fract(centre.x * 0.42 + centre.y * 0.3 - u.time * 0.11) - 0.5;
    const sweep = std.exp(-sweepPhase * sweepPhase * 26);

    // Dots near the pointer or in a ring take the accent colour.
    const accent = std.clamp(near * 0.8 + lift * 0.6 + sweep * 0.4, 0, 1);
    const dotCol = std.mix(u.c_dot, u.c_accent, accent);
    const strength = std.mix(0.45, 1, std.clamp(accent + voice * 0.4, 0, 1));

    // Each dot reads as a lit bead rather than a flat stamp: a highlight offset toward
    // the upper left, plus a soft emissive halo bleeding past the rim.
    const hi = std.length(local.add(d.vec2f(radius * 0.3, radius * 0.3)));
    const shade = 0.78 + 0.5 * (1 - std.smoothstep(0, radius * 1.7, hi));
    // Compact falloff rather than a gaussian: a gaussian's tails never quite reach zero,
    // and with one dot per cell that adds up to a flat veil over the whole canvas.
    const halo = std.pow(std.clamp(1 - dLocal / std.max(radius * 2.4, 0.0001), 0, 1), 2.5);
    const glow = std.clamp(halo * (0.16 + 0.6 * accent) * strength, 0, 1);

    const alpha = std.clamp(dot * strength + glow * 0.5 + u.p_fill, 0, 1);
    const bg = std.mix(u.c_base.mul(u.p_fill), u.c_accent, glow);
    const col = bg.mul(1 - dot).add(dotCol.mul(dot * strength * shade));
    return d.vec4f(std.clamp(col, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("gridFragment");

export const gridShader = tgpu.resolve([gridFragment]);
