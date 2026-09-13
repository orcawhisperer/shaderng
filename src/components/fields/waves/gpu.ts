import { d, std, tgpu } from "typegpu";

/*
 * Waves: stacked lines that swell with the voice, a waveform without the oscilloscope.
 * Original to shaderng, MIT.
 */

const LINES = 12;

export const wavesParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_from: d.vec3f,
  c_to: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_amplitude: d.f32,
  p_fill: d.f32,
  p_frequency: d.f32,
  p_lines: d.f32,
  p_speed: d.f32,
  p_spread: d.f32,
  p_thickness: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: wavesParams },
  })
  .$idx(0);

/** Height of line `k` at `x`: three sines of different speed, plus a bump under the pointer. */
const lineHeight = tgpu.fn(
  [d.f32, d.f32, d.f32, d.f32],
  d.f32,
)((x, k, phase, amp) => {
  "use gpu";
  const u = layout.$.params;
  const f = u.p_frequency;
  const a = std.sin(x * f + phase + k * 0.7);
  const b = std.sin(x * f * 1.9 - phase * 1.3 + k * 1.9) * 0.5;
  const c = std.sin(x * f * 0.45 + phase * 0.6 - k * 0.4) * 0.8;
  const aspect = u.res.x / std.max(u.res.y, 1);
  const mx = (u.mouse.x - 0.5) * aspect;
  const dx = x - mx;
  const bump = std.exp(-dx * dx * 6) * (0.5 - u.mouse.y) * 0.5;
  return (a + b + c) * amp * 0.25 + bump;
});

const wavesFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const p = input.uv.sub(0.5).mul(d.vec2f(aspect, 1));

    const voice = std.clamp(u.outputVol, 0, 1);
    const breath = std.clamp(u.inputVol, 0, 1);
    const amp = u.p_amplitude * (0.35 + 0.65 * voice + 0.3 * breath);
    const phase = u.p_speed + u.anim * 0.4;
    const count = std.clamp(u.p_lines, 1, d.f32(LINES));
    const thickness = std.max(u.p_thickness, 0.001);
    const spread = u.p_spread;

    let glow = d.f32(0);
    let core = d.f32(0);
    let tint = d.vec3f();
    for (let i = 0; i < LINES; i += 1) {
      const k = d.f32(i);
      if (k < count) {
        const t = (k + 0.5) / count;
        const yBase = (t - 0.5) * spread;
        const y = yBase + lineHeight(p.x, k, phase, amp * (0.6 + 0.4 * t));
        const dist = std.abs(p.y - y);
        const line = 1 - std.smoothstep(0, thickness, dist);
        const halo = std.exp((-dist * dist) / (thickness * thickness * 30)) * 0.35;
        const c = std.mix(u.c_from, u.c_to, t);
        tint = tint.add(c.mul(line + halo));
        core = std.max(core, line);
        glow += halo;
      }
    }

    const light = std.clamp(core + glow, 0, 1);
    const col = tint.div(std.max(core + glow, 0.001)).mul(light);
    const alpha = std.clamp(light + u.p_fill, 0, 1);
    const base = u.c_base.mul(u.p_fill).mul(1 - light);
    return d.vec4f(std.clamp(base.add(col), d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("wavesFragment");

export const wavesShader = tgpu.resolve([wavesFragment]);
