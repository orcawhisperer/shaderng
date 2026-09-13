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
        const streakIntensity = std.max(headFalloff * 1.5, tailFalloff);

        // Core laser sharpness
        const thickness = 0.003 * (1 + r * 2);
        const line = 1 - std.smoothstep(0, thickness, angDist);
        const halo = std.exp((-angDist * angDist) / (thickness * thickness * 18)) * 0.5;

        streakLight += line * streakIntensity * rayDensity;
        streakHalo += halo * streakIntensity * rayDensity;
      }
    }

    // Concentric hyperspace warp rings expanding outward
    const ringLog = std.log(std.max(r, 0.005)) * 2 - t * 1.2;
    const ringFrac = std.fract(ringLog);
    const ringEdge = std.smoothstep(0, 0.08, ringFrac) * (1 - std.smoothstep(0.08, 0.22, ringFrac));
    const warpRing = ringEdge * std.clamp(r * 2, 0, 1) * u.p_rings * (0.8 + 0.5 * voice);

    // Central hyperspace focal flare
    const flareR = std.exp(-r * r * 12) * (1.2 + 1.5 * voice);
    // Chromatic dispersion fringes near the edges
    const dispersion = std.clamp(r * 0.6, 0, 1) * (1 + 0.5 * voice);

    let col = d.vec3f();
    // Star streaks in electric cyan + bright white cores
    col = col.add(u.c_streak.mul(streakLight * 1.4 + streakHalo * 0.6));
    col = col.add(d.vec3f(1).mul(streakLight * 0.8));

    // Hyperspace shockwave rings in indigo/violet
    col = col.add(u.c_ring.mul(warpRing));

    // Central focal flare in magenta
    col = col.add(u.c_flare.mul(flareR * 0.9));
    col = col.add(d.vec3f(1, 0.9, 1).mul(flareR * 0.6));

    // Chromatic aberration fringe
    col = col.add(d.vec3f(dispersion * 0.12, 0, dispersion * 0.2));

    const totalEnergy = std.clamp(streakLight + streakHalo + warpRing + flareR, 0, 1);
    const alpha = std.clamp(totalEnergy + u.p_fill, 0, 1);

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = darkBase.add(col);

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
