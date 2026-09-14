import { d, std, tgpu } from "typegpu";

/*
 * Warp: relativistic hyperspace starfield and warp tunnel with pointer flight steering.
 * Original to shaderng, MIT.
 */

const NUM_RAYS = 50;

export const warpParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_flare: d.vec3f,
  c_ring: d.vec3f,
  c_streak: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_fill: d.f32,
  p_rings: d.f32,
  p_speed: d.f32,
  p_stars: d.f32,
  p_steer: d.f32,
  p_streak: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: warpParams },
  })
  .$idx(0);

const hash11 = tgpu.fn(
  [d.f32],
  d.f32,
)((p) => {
  "use gpu";
  const q = std.fract(p * 0.1031);
  const r = q * (q + 33.33);
  return std.fract(r * (r + r));
});

/** Filmic tone curve: streak cores and the flare roll off instead of clipping flat. */
const aces = tgpu.fn(
  [d.vec3f],
  d.vec3f,
)((x) => {
  "use gpu";
  const a = x.mul(x.mul(2.51).add(0.03));
  const b = x.mul(x.mul(2.43).add(0.59)).add(0.14);
  return std.clamp(a.div(b), d.vec3f(), d.vec3f(1));
});

const warpFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const p0 = input.uv.sub(0.5).mul(d.vec2f(aspect, 1));
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1));

    // Pointer steers the flight direction / vanishing point
    const steerOffset = m.mul(u.p_steer * 0.45);
    const p = p0.sub(steerOffset);

    const r = std.length(p);
    const angle = std.atan2(p.y, p.x);
    const pi = 3.14159265;

    const voice = std.clamp(u.outputVol, 0, 1);
    const breath = std.clamp(u.inputVol, 0, 1);
    const boost = 1 + 1.2 * voice + 0.4 * breath;

    const t = (u.p_speed * 1.5 + u.anim * 0.5) * boost;
    const streakLen = u.p_streak * 0.35 * (1 + 0.8 * voice);

    // Map angle to sectors
    const normAngle = (angle + pi) / (2 * pi);

    let streakLight = d.f32(0);
    let streakHalo = d.f32(0);
    let streakWarm = d.f32(0);

    // Everything converges on the vanishing point, so hold the streaks off it slightly.
    const centreFade = std.smoothstep(0.015, 0.11, r);
    const minThickness = 2.2 / std.max(u.res.y, 1);

    // Accumulate radial star streaks
    const rayDensity = std.clamp(u.p_stars, 0.2, 1.5);
    for (let i = 0; i < NUM_RAYS; i += 1) {
      const fi = d.f32(i);
      const rayAngle = hash11(fi * 17.3 + 3.1);
      const raySpeed = 0.5 + 0.5 * hash11(fi * 91.7 + 12.4);
      const rayOffset = hash11(fi * 43.9);

      // Angular distance to this star's ray
      let dAngle = std.abs(std.fract(normAngle - rayAngle + 0.5) - 0.5);
      const angDist = dAngle * (2 * pi) * r;

      // Radial position of the star moving outward (depth projection)
      const starProgress = std.fract(t * 0.4 * raySpeed + rayOffset);
      const starR = std.pow(starProgress, 2.2) * 1.6;

      // Distance along the ray (streak head and tail)
      const distAlong = r - starR;
      if (distAlong > -0.05 && distAlong < streakLen) {
        const headFalloff = 1 - std.smoothstep(-0.05, 0.02, distAlong);
        const tailFalloff = 1 - std.clamp(distAlong / std.max(streakLen, 0.01), 0, 1);
        const streakIntensity = std.max(headFalloff * 1.5, tailFalloff) * centreFade;

        // Angular thickness shrinks to nothing at the vanishing point, so floor it at
        // about a pixel -- otherwise every ray collapses into an aliased knot.
        const thickness = std.max(0.003 * (1 + r * 2), minThickness);
        const line = 1 - std.smoothstep(0, thickness, angDist);
        const halo = std.exp((-angDist * angDist) / (thickness * thickness * 7)) * 0.5;

        const lit = line * streakIntensity * rayDensity;
        streakLight += lit;
        streakHalo += halo * streakIntensity * rayDensity;
        // Per-ray colour temperature, averaged back out below: a field of identical
        // cyan lines reads as a screensaver, a mixed one reads as stars.
        streakWarm += hash11(fi * 7.7 + 5.2) * lit;
      }
    }

    // Concentric hyperspace warp rings expanding outward. Each channel reads the ring at a
    // slightly different radius, widening toward the corners: that is what chromatic
    // aberration actually looks like, rather than a flat violet wash over the frame.
    // The band is deliberately narrow -- a wide one just draws soap bubbles.
    const ringLog = std.log(std.max(r, 0.005)) * 2 - t * 1.2;
    const split = std.clamp(r * 0.6, 0, 1) * 0.02 * (1 + 0.6 * voice);
    const ringF = std.fract(d.vec3f(ringLog + split, ringLog, ringLog - split));
    const ringEdge = std
      .smoothstep(d.vec3f(), d.vec3f(0.02), ringF)
      .mul(d.vec3f(1).sub(std.smoothstep(d.vec3f(0.02), d.vec3f(0.09), ringF)));
    const ringMask = std.clamp(r * 2, 0, 1) * u.p_rings * (0.5 + 0.35 * voice);
    const ringRGB = ringEdge.mul(ringMask);
    const warpRing = std.dot(ringRGB, d.vec3f(0.299, 0.587, 0.114));

    // Central hyperspace focal flare: a tight core, not a haze over half the frame.
    const flareR = std.exp(-r * r * 60) * (0.9 + 1.2 * voice);

    // Average colour temperature of whichever rays cover this pixel.
    const warmMix = std.clamp(streakWarm / std.max(streakLight, 0.001), 0, 1);
    const streakCol = std.mix(u.c_streak, u.c_flare, warmMix * 0.5);

    let col = d.vec3f();
    // Star streaks in electric cyan + bright white cores
    col = col.add(streakCol.mul(streakLight * 1.2 + streakHalo * 0.35));
    col = col.add(d.vec3f(1).mul(streakLight * 0.45));

    // Hyperspace shockwave rings in indigo/violet, fringed by the dispersion above
    col = col.add(u.c_ring.mul(ringRGB));

    // Central focal flare in magenta
    col = col.add(u.c_flare.mul(flareR * 0.9));
    col = col.add(d.vec3f(1, 0.9, 1).mul(flareR * 0.6));

    const totalEnergy = std.clamp(streakLight + streakHalo + warpRing + flareR, 0, 1);
    const alpha = std.clamp(totalEnergy + u.p_fill, 0, 1);

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = aces(darkBase.add(col).mul(1.15));

    const streakTint = std.mix(u.c_streak, u.c_ring, std.clamp(warpRing, 0, 1));
    const warpTint = std.mix(streakTint, u.c_flare, std.clamp(flareR * 0.8, 0, 1));
    const lightCol = std.mix(
      u.c_base,
      warpTint,
      std.clamp(streakLight * 1.5 + streakHalo * 0.5 + warpRing * 0.7 + flareR * 0.9, 0, 1),
    );
    const finalCol = std.mix(darkCol, lightCol, isLight);

    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("warpFragment");

export const warpShader = tgpu.resolve([warpFragment]);
