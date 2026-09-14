import { d, std, tgpu } from "typegpu";

/*
 * Singularity: cinematic Einsteinian black hole. Volumetric blackbody accretion torus with
 * orbiting plasma hot-spots, relativistic Doppler beaming, a prismatic photon sphere,
 * HDR bloom, ACES tone mapping, and a gravitationally lensed nebula.
 * Original to shaderng, MIT.
 */

export const singularityParams = d.struct({
  anim: d.f32,
  c_base: d.vec3f,
  c_cosmos: d.vec3f,
  c_disk1: d.vec3f,
  c_disk2: d.vec3f,
  c_hole: d.vec3f,
  c_photon: d.vec3f,
  c_star: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_fill: d.f32,
  p_glow: d.f32,
  p_jets: d.f32,
  p_mass: d.f32,
  p_spin: d.f32,
  p_stars: d.f32,
  p_tilt: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: singularityParams },
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

/** 4-octave rotated fbm: no visible grid, good for plasma filaments and nebula. */
const fbm4 = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  let value = d.f32(0);
  let amp = d.f32(0.5);
  let q = d.vec2f(p);
  for (let i = 0; i < 4; i += 1) {
    value += amp * noise2(q);
    q = d.vec2f(q.x * 1.62 - q.y * 1.18, q.x * 1.18 + q.y * 1.62).add(d.vec2f(2.7, 5.3));
    amp *= 0.5;
  }
  return value;
});

/** ACES filmic tone map: keeps HDR plasma from clipping to flat white. */
const aces = tgpu.fn(
  [d.vec3f],
  d.vec3f,
)((x) => {
  "use gpu";
  const a = x.mul(x.mul(2.51).add(0.03));
  const b = x.mul(x.mul(2.43).add(0.59)).add(0.14);
  return std.clamp(a.div(b), d.vec3f(0), d.vec3f(1));
});

export const singularityFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);

    const pScreen = d.vec2f((input.uv.x - 0.5) * 2 * aspect, (1 - input.uv.y - 0.5) * 2);
    const mOffset = d.vec2f((u.mouse.x - 0.5) * 0.3 * aspect, (0.5 - u.mouse.y) * 0.2);
    const uv = pScreen.sub(mOffset);

    const voice = std.clamp(u.outputVol, 0, 1);
    const breath = std.clamp(u.inputVol, 0, 1);
    const t = u.time;
    const glowBoost = u.p_glow * (1 + 0.8 * voice);

    // Observer inclination: pointer steers it, plus a slow autonomous precession so the
    // scene is never static even when nothing is happening.
    const precess = std.sin(t * 0.11 + u.anim * 0.05) * 0.09;
    const tiltAngle = 0.18 + u.p_tilt * 0.5 + (u.mouse.y - 0.5) * 0.32 + precess;
    const camDist = 4.2;
    const camPos = d.vec3f(0, std.sin(tiltAngle) * camDist, -std.cos(tiltAngle) * camDist);

    const forward = std.normalize(d.vec3f(0).sub(camPos));
    const right = d.vec3f(1, 0, 0);
    const up = std.normalize(std.cross(right, forward));
    const rayDir = std.normalize(forward.mul(2.05).add(right.mul(uv.x)).add(up.mul(uv.y)));

    // Mass breathes with the voice so the horizon itself feels alive.
    const mass = u.p_mass * (1 + 0.1 * voice + 0.04 * std.sin(t * 0.9));
    const rs = 0.26 * mass;
    const rIn = rs * 2.2;
    const rOut = rs * 8.5;
    const rPhoton = rs * 1.52;

    const lVec = std.cross(camPos, rayDir);
    const L2 = std.dot(lVec, lVec);

    let p = d.vec3f(camPos);
    let v = d.vec3f(rayDir);
    let minDist = d.f32(999);
    let fellIntoHole = d.f32(0);

    // HDR accumulation: values above 1 are intentional, ACES brings them back.
    let glowCol = d.vec3f(0);
    let accumAlpha = d.f32(0);

    const stepSize = 0.14;
    const spin = (t * 0.55 + u.anim * 0.3) * u.p_spin;

    for (let i = 0; i < 44; i += 1) {
      const r2 = std.dot(p, p);
      const r = std.sqrt(r2);
      minDist = std.min(minDist, r);

      if (r < rs) {
        fellIntoHole = 1;
        break;
      }
      if (r > 10) {
        break;
      }

      const rDisk = std.length(d.vec2f(p.x, p.z));
      if (rDisk >= rIn && rDisk <= rOut && accumAlpha < 0.98) {
        // Flared torus: thin and dense inside, puffy and wispy outside.
        const thick = 0.05 + 0.11 * ((rDisk - rIn) / (rOut - rIn));
        const yN = p.y / thick;
        if (std.abs(yN) < 2.6) {
          const rNorm = (rDisk - rIn) / (rOut - rIn);
          const yFall = std.exp(-yN * yN * 1.7);
          // Bright inner rim, long soft outer tail.
          const radial = std.pow(1 - rNorm, 1.4) * std.smoothstep(0, 0.09, rNorm);

          // Keplerian shear: the inner edge laps the outer edge, which is what makes
          // the filaments stretch and wind instead of rotating like a solid plate. The
          // exponent is deliberately gentler than the physical 1.5 -- at the inner edge
          // the texture phase would otherwise change faster than a pixel and the disk
          // aliases into concentric ribbing.
          const phi = std.atan2(p.z, p.x);
          const omega = std.pow(rIn / rDisk, 1.15);
          const swirl = phi + spin * 2.1 * omega;

          const logR = std.log(rDisk / rIn);
          const fil = fbm4(d.vec2f(swirl * 1.6, logR * 3.6 - spin * 0.35));
          // Fine detail fades in away from the inner edge, where it cannot be resolved.
          const fineFade = std.smoothstep(0, 0.28, rNorm);
          const fine = fbm4(d.vec2f(swirl * 3, logR * 8.5 + spin * 0.2)) * fineFade;
          const turb = std.clamp(fil * 0.75 + fine * 0.45 - 0.12, 0, 2) * (1 + 0.55 * breath);

          // Orbiting hot-spots: bright plasma knots that lap the hole. This is the main
          // source of "life" — they sweep past the camera and flare as they go.
          const knot = std.pow(0.5 + 0.5 * std.sin(swirl * 2 - t * 1.4), 9);
          const knot2 = std.pow(0.5 + 0.5 * std.sin(swirl * 3 + t * 0.9 + 2.1), 13);
          const hotSpot = (knot * 0.8 + knot2 * 1.3) * std.exp(-rNorm * 2.6);

          // Magnetic flicker. Low radial frequency on purpose: a high one draws its own
          // set of concentric bands across the disk.
          const flicker = 1 + 0.22 * std.sin(t * 6.5 + logR * 3 + swirl * 2);

          const density = (turb * radial + hotSpot * 0.55) * yFall * flicker;

          // Relativistic Doppler beaming + blueshift on the approaching limb.
          const velDir = std.normalize(d.vec3f(-p.z, 0, p.x));
          const los = std.dot(velDir, v.mul(-1));
          const beta = std.clamp(std.sqrt(rs / (2 * rDisk)), 0.12, 0.5);
          const dop = std.clamp(1 + beta * los * 2.4, 0.3, 2.9);
          const beam = dop * dop * dop;

          // Blackbody-style ramp: crimson outer -> amber mid -> white-hot photon inner.
          const temp = std.clamp(
            std.pow(1 - rNorm, 1.5) * 1.15 + hotSpot * 0.35 + (dop - 1) * 0.45,
            0,
            1,
          );
          const white = std.mix(u.c_photon, d.vec3f(1), 0.55);
          const cool = std.mix(u.c_disk2, u.c_disk1, std.smoothstep(0, 0.5, temp));
          const tint = std.mix(cool, white, std.smoothstep(0.5, 1, temp));

          const emit = density * beam * 0.16 * glowBoost;
          const sampleA = std.clamp(density * 0.5, 0, 1);
          glowCol = glowCol.add(tint.mul(emit * (1 - accumAlpha)));
          accumAlpha += sampleA * (1 - accumAlpha) * 0.55;
        }
      }

      const r5 = r2 * r2 * r + 0.0001;
      const accel = p.mul((-1.5 * rs * L2) / r5);
      const pNext = p.add(v.mul(stepSize));
      v = std.normalize(v.add(accel.mul(stepSize)));
      p = d.vec3f(pNext);
    }

    // Photon sphere, split into R/G/B at slightly different radii: a real prismatic
    // Einstein ring rather than a flat cyan outline.
    const ringPulse = 1 + 0.12 * std.sin(t * 2.3) + 0.45 * voice;
    const rr = rPhoton * 0.988;
    const rg = rPhoton;
    const rb = rPhoton * 1.014;
    const ringR = std.exp(-std.abs(minDist - rr) * 46) * ringPulse;
    const ringG = std.exp(-std.abs(minDist - rg) * 46) * ringPulse;
    const ringB = std.exp(-std.abs(minDist - rb) * 46) * ringPulse;
    const prism = d.vec3f(ringR, ringG, ringB).mul(1 - fellIntoHole);
    glowCol = glowCol.add(u.c_photon.mul(prism).mul(2.6 * glowBoost));
    glowCol = glowCol.add(prism.mul(0.9 * glowBoost));

    // Wide halo bloom around the ring so the light feels like it has atmosphere.
    const halo = std.exp(-std.abs(minDist - rPhoton) * 5.5) * (1 - fellIntoHole);
    glowCol = glowCol.add(std.mix(u.c_photon, u.c_disk1, 0.4).mul(halo * 0.5 * glowBoost));

    // Anamorphic streak through the core.
    const streak =
      std.exp(-std.abs(uv.y) * 34) * std.exp(-std.abs(uv.x) * 1.5) * (0.3 + 0.9 * voice);
    glowCol = glowCol.add(u.c_photon.mul(streak * u.p_glow));

    // Relativistic polar jets: twin helical beams up the rotation axis.
    if (u.p_jets > 0.01) {
      const jy = uv.y;
      const beamCore = std.exp((-std.abs(uv.x) * 17) / (std.abs(jy) + 0.26));
      const reach = std.smoothstep(0.18, 1.5, std.abs(jy));
      const helix = 0.55 + 0.45 * std.sin(jy * 22 - t * 7 + u.anim * 3);
      const pulse = 0.7 + 0.3 * std.sin(t * 3.1 + jy * 4);
      const jet = beamCore * reach * helix * pulse * (1 + 2.2 * voice) * u.p_jets;
      glowCol = glowCol.add(std.mix(u.c_photon, d.vec3f(1), 0.35).mul(jet * 0.7));
    }

    // Gravitational shockwave rings, strongest while speaking. Kept broad and faint: a
    // tight, strong ripple reads as moire banding across the disk rather than spacetime.
    const rUV = std.length(uv);
    const wave =
      std.max(0, std.sin(rUV * 11 - t * 5.5 + u.anim * 2)) *
      std.exp(-rUV * 1.9) *
      (0.03 + 0.22 * voice);
    glowCol = glowCol.add(u.c_photon.mul(wave));

    // Lensed background: a living nebula, not a dead void. The ray direction is already
    // bent by gravity, so the nebula shears into arcs around the hole for free.
    if (fellIntoHole < 0.5) {
      const sph = d.vec2f(std.atan2(v.z, v.x), v.y);
      const drift = d.vec2f(t * 0.012, std.sin(t * 0.07) * 0.05);

      const n1 = fbm4(sph.mul(1.5).add(drift));
      const n2 = fbm4(
        sph
          .mul(3.4)
          .sub(drift.mul(1.7))
          .add(n1 * 0.8),
      );
      const clouds = std.clamp(n1 * 0.7 + n2 * 0.6 - 0.25, 0, 1);

      // Deep space has to actually be dark, or the disk has nothing to stand against.
      let neb = std.mix(u.c_cosmos.mul(0.3), u.c_disk2.mul(0.4), std.pow(clouds, 1.6));
      neb = std.mix(neb, u.c_photon.mul(0.3), std.pow(std.clamp(n2 - 0.35, 0, 1), 2) * 0.8);
      neb = neb.add(u.c_cosmos.mul(0.1));

      // Jittered point stars: round and anti-aliased, never blocky under lens shear.
      const sUV = sph.mul(9);
      const cell = std.floor(sUV);
      const frac = std.fract(sUV);
      const jitter = d
        .vec2f(hash21(cell), hash21(cell.add(d.vec2f(19.7, 41.3))))
        .mul(0.72)
        .add(0.14);
      const ds = std.length(frac.sub(jitter));
      const seed = hash21(cell.mul(1.7).add(3.3));
      const twinkle = 0.45 + 0.55 * std.sin(t * 2.2 + seed * 44);
      const core = std.smoothstep(0.085, 0, ds) * std.pow(seed, 13);
      const bloom = std.smoothstep(0.3, 0, ds) * std.pow(seed, 34) * 0.6;
      const starTint = std.mix(u.c_star, u.c_photon, seed * 0.6);
      const stars = (core + bloom) * twinkle * u.p_stars * 1.8;

      glowCol = glowCol.add(neb.add(starTint.mul(stars)).mul(1 - accumAlpha));
    }

    // Event horizon: an absolute void, with a faint rim so it reads as a sphere.
    if (fellIntoHole > 0.5) {
      glowCol = std.mix(glowCol, u.c_hole, 0.985);
    }

    // HDR -> display. Exposure first, then ACES, so bright plasma rolls off into
    // colour instead of clipping to a white blob.
    const exposure = 1.25 + 0.35 * voice;
    let col = aces(glowCol.mul(exposure));

    // Subtle sensor grain.
    const minRes = std.min(u.res.x, u.res.y);
    const grain = (noise2(input.uv.mul(d.vec2f(minRes * 0.5, minRes * 0.5))) - 0.5) * 0.022;
    col = std.clamp(col.add(d.vec3f(grain)), d.vec3f(0), d.vec3f(1));

    const uvS = input.uv.sub(0.5).mul(2);
    const vig = std.clamp(1 - std.dot(uvS.mul(0.44), uvS.mul(0.54)), 0, 1);

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));
    col = col.mul(std.mix(vig, std.mix(1, vig, 0.3), isLight));

    const darkCol = u.c_base.mul(u.p_fill).add(col);
    const lightCol = std.mix(col, u.c_base, u.p_fill * 0.4);
    const finalCol = std.mix(darkCol, lightCol, isLight);

    return d.vec4f(std.clamp(finalCol, d.vec3f(0), d.vec3f(1)), 1);
  })
  .$name("singularityFragment");

export const singularityShader = tgpu.resolve([singularityFragment]);
