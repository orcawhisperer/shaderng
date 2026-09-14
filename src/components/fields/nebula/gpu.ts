import { d, std, tgpu } from "typegpu";

/*
 * Nebula: volumetric deep-space cosmic dust and stellar nurseries with parallax starfield.
 * Original to shaderng, MIT.
 */

export const nebulaParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_core: d.vec3f,
  c_dust: d.vec3f,
  c_gas: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_density: d.f32,
  p_drift: d.f32,
  p_fill: d.f32,
  p_glow: d.f32,
  p_scale: d.f32,
  p_speed: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: nebulaParams },
  })
  .$idx(0);

const hash21 = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  const q = std.fract(p.mul(d.vec2f(127.1, 311.7)));
  const r = q.add(std.dot(q, q.add(43.7)));
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

const cosmicFbm = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  let value = d.f32(0);
  let amp = d.f32(0.5);
  let q = d.vec2f(p);
  for (let i = 0; i < 5; i += 1) {
    value += amp * noise2(q);
    // Rotate and scale to simulate fluid turbulence
    q = d.vec2f(q.x * 1.6 - q.y * 1.2, q.x * 1.2 + q.y * 1.6).add(d.vec2f(2.4, 5.1));
    amp *= 0.5;
  }
  return value;
});

/** ACES filmic curve: overlapping dust, gas and core keep their colour instead of clipping. */
const aces = tgpu.fn(
  [d.vec3f],
  d.vec3f,
)((x) => {
  "use gpu";
  const a = x.mul(x.mul(2.51).add(0.03));
  const b = x.mul(x.mul(2.43).add(0.59)).add(0.14);
  return std.clamp(a.div(b), d.vec3f(0), d.vec3f(1));
});

const nebulaFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const uv0 = input.uv.sub(0.5).mul(d.vec2f(aspect, 1));
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1));

    // Pointer creates deep parallax shift through cosmic layers
    const parallax = m.mul(u.p_drift * 0.35);
    const p = uv0.sub(parallax).mul(u.p_scale);

    const voice = std.clamp(u.outputVol, 0, 1);
    const breath = std.clamp(u.inputVol, 0, 1);
    const t = u.p_speed * 0.4 + u.anim * 0.15;

    // Galactic swirl around center
    const r = std.length(p);
    const swirl = std.exp(-r * 0.8) * 1.2;
    const rotP = d.vec2f(
      p.x * std.cos(swirl + t * 0.2) - p.y * std.sin(swirl + t * 0.2),
      p.x * std.sin(swirl + t * 0.2) + p.y * std.cos(swirl + t * 0.2),
    );

    // Multi-layered volumetric cosmic dust clouds
    const q1 = d.vec2f(
      cosmicFbm(rotP.add(d.vec2f(t * 0.15, -t * 0.1))),
      cosmicFbm(rotP.add(d.vec2f(3.2 - t * 0.12, 1.7 + t * 0.14))),
    );
    const q2 = d.vec2f(
      cosmicFbm(rotP.add(q1.mul(1.8)).add(d.vec2f(1.1, 7.3))),
      cosmicFbm(rotP.add(q1.mul(1.8)).add(d.vec2f(8.5, 2.2))),
    );
    const gasDensity = cosmicFbm(rotP.add(q2.mul(2.2)));

    // Density shapes how much of the frame the clouds cover, via the contrast curve,
    // rather than scaling their brightness: multiplying past 1 drove the whole frame to
    // white and lost the black of space entirely.
    const dustShape = std.clamp(gasDensity * 1.5 - 0.2, 0, 1);
    const dust = std.pow(dustShape, 2.6 / std.max(u.p_density, 0.3));
    // Thresholded, not just shaped: without a floor this term is non-zero nearly
    // everywhere and acts as a bright veil over the entire frame.
    const gasShape = std.clamp(q2.x * q2.y * 3.4 - 0.8, 0, 1);
    const ionizedGas = std.pow(gasShape, 1.4) * (1 + 0.5 * breath);

    // Central stellar nursery core glow. Gaussian, not linear: a linear falloff is still
    // bright at the frame edge and washes the whole nebula out at speaking volume.
    const coreDist = std.length(p);
    const coreGlow = std.exp(-coreDist * coreDist * 6) * u.p_glow * (1 + 0.5 * voice);
    // Core 4-point stellar diffraction rays
    const rayDist = std.min(std.abs(p.x), std.abs(p.y));
    const coreRays = std.exp(-rayDist * 25) * std.exp(-coreDist * 1.8) * 0.4 * u.p_glow;

    // Color compositing
    let col = d.vec3f();
    // Deep dust in violet/purple
    col = col.add(u.c_dust.mul(dust * 0.7));
    // Ionized gas in glowing cyan
    col = col.add(u.c_gas.mul(ionizedGas * 0.75));
    // Stellar core in golden light
    col = col.add(u.c_core.mul(coreGlow * 0.5 + coreRays));

    // Parallax starfield. Jittered round points rather than screen-pixel cells: the old
    // version drew square stars on a lattice and changed size with device pixel ratio.
    const starUV = uv0.sub(parallax.mul(0.4)).mul(46);
    const cell = std.floor(starUV);
    const starR = hash21(cell);
    const jit = d.vec2f(
      hash21(cell.add(d.vec2f(23.1, 57.7))),
      hash21(cell.add(d.vec2f(71.3, 9.4))),
    );
    const ds = std.length(std.fract(starUV).sub(jit.mul(0.7).add(0.15)));
    const twinkle = 0.5 + 0.5 * std.sin(u.time * 2.5 + starR * 30);
    const star = std.smoothstep(0.08, 0, ds) * std.pow(starR, 14) * twinkle * (1 - dust * 0.5);
    const starCol = std.mix(d.vec3f(1, 0.95, 0.8), u.c_gas, starR);
    col = col.add(starCol.mul(star * 1.8));

    const totalLight = std.clamp(dust + ionizedGas + coreGlow + star, 0, 1);
    const alpha = std.clamp(totalLight + u.p_fill, 0, 1);

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = darkBase.add(aces(col.mul(0.95)));

    const cloudTint = std.mix(u.c_dust, u.c_gas, std.clamp(ionizedGas * 1.2, 0, 1));
    const nebulaTint = std.mix(cloudTint, u.c_core, std.clamp(coreGlow * 1.5, 0, 1));
    const lightCol = std.mix(
      u.c_base,
      nebulaTint,
      std.clamp(dust * 0.75 + ionizedGas * 0.85 + coreGlow * 1.2, 0, 1),
    );
    let finalCol = std.mix(darkCol, lightCol, isLight);
    // Sub-LSB dither: deep-space gradients band heavily without it.
    finalCol = finalCol.add(d.vec3f((starR - 0.5) * 0.005));

    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("nebulaFragment");

export const nebulaShader = tgpu.resolve([nebulaFragment]);
