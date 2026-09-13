import { d, std, tgpu } from "typegpu";

/*
 * Cyber: an infinite 3D perspective synthwave grid receding to a glowing neon horizon.
 * Original to shaderng, MIT.
 */

export const cyberParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_glow: d.vec3f,
  c_grid: d.vec3f,
  c_sky: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_fill: d.f32,
  p_glow: d.f32,
  p_grid: d.f32,
  p_horizon: d.f32,
  p_speed: d.f32,
  p_tilt: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: cyberParams },
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

const cyberFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const p = input.uv.sub(0.5).mul(d.vec2f(aspect, 1));
    const m = u.mouse.sub(0.5).mul(d.vec2f(aspect, 1));

    // Pointer tilts the perspective plane (pitch and yaw).
    const tiltX = m.x * u.p_tilt * 0.45;
    const tiltY = (0.25 - m.y) * u.p_tilt * 0.25;

    // Horizon line in normalized space
    const hz = (0.5 - u.p_horizon) * 0.6 + tiltY;
    const voice = std.clamp(u.outputVol, 0, 1);
    const breath = std.clamp(u.inputVol, 0, 1);

    const speed = u.p_speed + u.anim * 0.3;
    const glowMult = u.p_glow * (1 + 0.6 * voice);

    let col = d.vec3f();
    let alpha = d.f32(0);

    if (p.y > hz) {
      // --- GROUND PLANE (below horizon) ---
      // Perspective projection: map screen space (x, y) to 3D world plane (X, Z)
      const dy = p.y - hz;
      const depth = 1 / std.max(dy, 0.008);
      const groundX = (p.x - tiltX * dy) * depth * u.p_grid * 0.8;
      const groundZ = depth * u.p_grid * 1.2 + speed * 3.5;

      // Distance fog falloff towards horizon
      const fog = std.exp(-dy * 1.5);
      const distanceFade = std.clamp(dy * 7, 0, 1);

      // Grid line coordinate repetition
      const fx = std.abs(std.fract(groundX) - 0.5);
      const fz = std.abs(std.fract(groundZ) - 0.5);

      // Sharp grid wire lines scaled with distance
      const wireWidth = (0.045 + 0.02 * breath) * std.min(depth * 0.15, 1.2);
      const lineX = 1 - std.smoothstep(0, wireWidth, fx);
      const lineZ = 1 - std.smoothstep(0, wireWidth, fz);
      const lines = std.max(lineX, lineZ);

      // Soft neon glow around grid lines
      const bloomX = std.exp(-fx * fx * 35);
      const bloomZ = std.exp(-fz * fz * 35);
      const bloom = (bloomX + bloomZ) * 0.6;

      // Energy pulses running along the forward grid lines, amplified by voice
      const pulseWave = std.sin(groundZ * 0.75 - speed * 8);
      const energyPulse = std.clamp(pulseWave * 1.5 - 0.5, 0, 1) * (0.4 + 0.8 * voice) * lineZ;

      // Horizon ground haze
      const groundHaze = std.exp(-dy * 12) * glowMult;

      // Combine grid colors
      const gridIntensity = (lines + bloom * 0.7 + energyPulse * 1.5) * distanceFade;
      const groundCol = std.mix(u.c_grid, u.c_glow, energyPulse + fog * 0.5);
      col = col.add(groundCol.mul(gridIntensity));
      col = col.add(u.c_glow.mul(groundHaze * 0.7));

      const isLightGround = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
      const lightGround = std.mix(u.c_base, groundCol, std.clamp(gridIntensity * 1.2 + groundHaze * 0.5, 0, 1));
      col = std.mix(col, lightGround, isLightGround);

      alpha = std.clamp(gridIntensity + groundHaze * 0.5 + u.p_fill, 0, 1);
    } else {
      // --- SKY / HORIZON DOME (above horizon) ---
      const distFromHz = hz - p.y;
      const horizonGlow = std.exp(-distFromHz * 16) * glowMult * 1.2;

      // Sky gradient
      const skyGrad = std.clamp(distFromHz * 2.2, 0, 1);
      const skyCol = std.mix(u.c_glow, u.c_sky, skyGrad);
      col = col.add(skyCol.mul(horizonGlow * 0.8 + 0.15 * (1 - skyGrad)));

      // Distant stars glittering in the upper sky
      const starCoord = std.floor(input.uv.mul(u.res).div(2.5));
      const starRand = hash21(starCoord);
      const twinkle = 0.5 + 0.5 * std.sin(u.time * 3 + starRand * 40);
      const star = std.pow(starRand, 45) * twinkle * std.smoothstep(0.05, 0.4, distFromHz);
      col = col.add(d.vec3f(star * (1 + 0.5 * voice)));

      const isLightSky = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
      const lightSky = std.mix(u.c_base, skyCol, std.clamp(horizonGlow * 0.7 + skyGrad * 0.35, 0, 1));
      col = std.mix(col, lightSky, isLightSky);

      alpha = std.clamp(horizonGlow + star * (1 - isLightSky) + 0.15 + u.p_fill, 0, 1);
    }

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    const darkBase = u.c_base.mul(u.p_fill);
    const finalCol = std.mix(darkBase.add(col), col, isLight);
    return d.vec4f(std.clamp(finalCol, d.vec3f(), d.vec3f(1)), alpha);
  })
  .$name("cyberFragment");

export const cyberShader = tgpu.resolve([cyberFragment]);
