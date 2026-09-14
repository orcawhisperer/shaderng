import { d, std, tgpu } from "typegpu";

/*
 * Paint: Bob Ross-style watercolor auroras over a forested fjord with bristle strokes,
 * paper bleed, tree silhouettes, and water reflections.
 * Inspired by "Aurora Paint" by Noztol, ported and enhanced for shaderng (MIT).
 */

export const paintParams = d.struct({
  anim: d.f32,
  c_aurora1: d.vec3f,
  c_aurora2: d.vec3f,
  c_aurora3: d.vec3f,
  c_base: d.vec3f,
  c_land: d.vec3f,
  c_sky: d.vec3f,
  c_water: d.vec3f,
  inputVol: d.f32,
  mouse: d.vec2f,
  outputVol: d.f32,
  p_bleed: d.f32,
  p_fill: d.f32,
  p_glow: d.f32,
  p_speed: d.f32,
  p_stars: d.f32,
  p_water: d.f32,
  p_wind: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: paintParams },
  })
  .$idx(0);

const rand2 = tgpu.fn(
  [d.vec2f],
  d.f32,
)((co) => {
  "use gpu";
  return std.fract(std.sin(std.dot(co, d.vec2f(12.9898, 78.233))) * 43758.5453);
});

const rand1 = tgpu.fn(
  [d.f32],
  d.f32,
)((n) => {
  "use gpu";
  return std.fract(std.cos(n * 89.42) * 343.42);
});

const noise01 = tgpu.fn(
  [d.vec2f],
  d.f32,
)((p) => {
  "use gpu";
  const s = std.sin(std.dot(p, d.vec2f(12.9898, 78.233))) * 43758.5453;
  return std.clamp((std.fract(s) + 0.5) * 0.5, 0, 1);
});

const smoothf = tgpu.fn(
  [d.f32],
  d.f32,
)((x) => {
  "use gpu";
  return x * x * x * (x * (x * 6 - 15) + 10);
});

const dtoa = tgpu.fn(
  [d.f32, d.f32],
  d.f32,
)((dist, amount) => {
  "use gpu";
  const inv = 1 / std.max(amount, 1);
  return std.clamp(1 / (std.clamp(dist, inv, 1) * amount), 0, 1);
});

const sdAxisAlignedRect = tgpu.fn(
  [d.vec2f, d.vec2f, d.vec2f],
  d.f32,
)((uv, tl, br) => {
  "use gpu";
  const delta = std.max(tl.sub(uv), uv.sub(br));
  return std.length(std.max(d.vec2f(0), delta)) + std.min(0, std.max(delta.x, delta.y));
});

const rotate2D = tgpu.fn(
  [d.vec2f, d.f32],
  d.vec2f,
)((p, r) => {
  "use gpu";
  const c = std.cos(r);
  const s = std.sin(r);
  return d.vec2f(p.x * c + p.y * s, -p.x * s + p.y * c);
});

const magicBox = tgpu.fn(
  [d.vec3f],
  d.f32,
)((pIn) => {
  "use gpu";
  const MAGIC_BOX_ITERS = 13;
  const MAGIC_BOX_MAGIC = 0.55;
  const modP = pIn.sub(std.floor(pIn.div(2)).mul(2));
  let p = d.vec3f(1).sub(std.abs(d.vec3f(1).sub(modP)));
  let lastLength = std.length(p);
  let tot = d.f32(0);
  for (let i = 0; i < MAGIC_BOX_ITERS; i += 1) {
    p = std
      .abs(p)
      .div(lastLength * lastLength)
      .sub(d.vec3f(MAGIC_BOX_MAGIC));
    const newLength = std.length(p);
    tot += std.abs(newLength - lastLength);
    lastLength = newLength;
  }
  return tot;
});

const magicBox2D = tgpu.fn(
  [d.vec2f],
  d.f32,
)((uv) => {
  "use gpu";
  const col0 = d.vec3f(0.28862356, 0.69972273, 0.65351706);
  const col1 = d.vec3f(0.06997494, 0.66532372, -0.74326836);
  const p = col0.mul(uv.x).add(col1.mul(uv.y)).mul(0.5);
  return magicBox(p);
});

const sdTri = tgpu.fn(
  [d.vec2f, d.f32, d.f32, d.f32],
  d.f32,
)((p, bottom, top, halfWidth) => {
  "use gpu";
  const p0 = d.vec2f(0, top);
  const p1 = d.vec2f(halfWidth, bottom);
  const p2 = d.vec2f(-halfWidth, bottom);

  const e0 = p1.sub(p0);
  const e1 = p2.sub(p1);
  const e2 = p0.sub(p2);

  const v0 = p.sub(p0);
  const v1 = p.sub(p1);
  const v2 = p.sub(p2);

  const pq0 = v0.sub(e0.mul(std.clamp(std.dot(v0, e0) / std.dot(e0, e0), 0, 1)));
  const pq1 = v1.sub(e1.mul(std.clamp(std.dot(v1, e1) / std.dot(e1, e1), 0, 1)));
  const pq2 = v2.sub(e2.mul(std.clamp(std.dot(v2, e2) / std.dot(e2, e2), 0, 1)));

  const s = std.sign(e0.x * e2.y - e0.y * e2.x);
  const d0 = d.vec2f(std.dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x));
  const d1 = d.vec2f(std.dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x));
  const d2 = d.vec2f(std.dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x));

  const minD = std.min(std.min(d0, d1), d2);
  return -std.sqrt(std.max(minD.x, 0)) * std.sign(minD.y);
});

const sdTree = tgpu.fn(
  [d.vec2f, d.vec2f, d.f32, d.f32, d.f32],
  d.f32,
)((p, pos, scale, swayTime, windStrength) => {
  "use gpu";
  let q = p.sub(pos).div(scale);

  // AABB early rejection: bounds roughly x in [-0.4, 0.4], y in [-0.05, 1.1]
  if (std.abs(q.x) > 0.4 || q.y < -0.05 || q.y > 1.1) {
    const b = std.max(std.abs(q.sub(d.vec2f(0, 0.5))).sub(d.vec2f(0.3, 0.55)), d.vec2f(0));
    return (std.length(b) + std.min(0, std.max(b.x, b.y))) * scale;
  }

  // Subtle wind sway
  const sway = std.sin(swayTime * 1.5 + pos.x * 10) * 0.02 * windStrength * std.max(0, q.y);
  q = d.vec2f(q.x - sway, q.y);

  // Trunk
  let dTrunk = std.max(std.abs(q.x) - 0.03, std.max(-q.y, q.y - 0.2));

  // Jagged conifer canopy layers
  dTrunk = std.min(dTrunk, sdTri(q, 0.1, 0.45, 0.25));
  dTrunk = std.min(dTrunk, sdTri(q, 0.25, 0.65, 0.2));
  dTrunk = std.min(dTrunk, sdTri(q, 0.45, 0.85, 0.15));
  dTrunk = std.min(dTrunk, sdTri(q, 0.65, 1, 0.1));

  return dTrunk * scale;
});

const getLand = tgpu.fn(
  [d.vec2f, d.f32],
  d.f32,
)((uv, aspect) => {
  "use gpu";
  const leftShore = 0.45 * std.exp(-0.5 * uv.x * uv.x);
  const dx = uv.x - aspect;
  const rightShore = 0.45 * std.exp(-0.5 * dx * dx);

  let terrainHeight = std.max(leftShore, rightShore);
  terrainHeight += noise01(uv.mul(d.vec2f(20, 1))) * 0.015;

  return uv.y - terrainHeight;
});

const getTrees = tgpu.fn(
  [d.vec2f, d.f32, d.f32, d.f32],
  d.f32,
)((uv, aspect, time, wind) => {
  "use gpu";
  // Middle of fjord has no trees; skip early
  if (uv.x > aspect * 0.32 && uv.x < aspect * 0.68) {
    return 1;
  }
  let dist = d.f32(1);

  // Left shore conifers
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.02, 0.42), 0.18, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.08, 0.38), 0.22, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.14, 0.42), 0.14, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.18, 0.41), 0.09, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.22, 0.41), 0.08, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.24, 0.41), 0.08, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.29, 0.38), 0.08, time, wind));

  // Right shore conifers
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.7, 0.38), 0.08, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.74, 0.4), 0.08, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.78, 0.42), 0.1, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.82, 0.41), 0.09, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.86, 0.42), 0.14, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.92, 0.38), 0.22, time, wind));
  dist = std.min(dist, sdTree(uv, d.vec2f(aspect * 0.98, 0.42), 0.18, time, wind));

  return dist;
});

const colorBrushStroke = tgpu.fn(
  [d.vec2f, d.vec2f, d.vec2f, d.f32, d.vec3f, d.vec4f, d.f32, d.f32, d.f32],
  d.vec3f,
)((uvLine, uvPaper, lineSize, sdGeometry, inpColor, brushColor, pulseTime, minRes, bleedParam) => {
  "use gpu";
  let posInLineY = uvLine.y / std.max(lineSize.y, 0.0001);

  if (posInLineY > 0) {
    const smoothWave = 0.5 + 0.5 * std.sin(pulseTime * 1.5);
    const autoX = std.mix(0.15, 0.7, smoothWave);
    posInLineY = std.pow(posInLineY, autoX * autoX * 15 + 1.5);
  }

  const strokeBoundary = dtoa(sdGeometry, 300);
  let strokeTexture =
    noise01(uvLine.mul(d.vec2f(minRes * 0.2, 1))) +
    noise01(uvLine.mul(d.vec2f(79, 1))) +
    noise01(uvLine.mul(d.vec2f(14, 1)));
  strokeTexture *= 0.333 * strokeBoundary;
  strokeTexture = std.max(0.008, strokeTexture);

  let strokeAlpha = std.pow(strokeTexture, std.max(0, posInLineY) + 0.09);
  const strokeAlphaBoost = 1.09;

  if (posInLineY > 0) {
    strokeAlpha = strokeAlphaBoost * std.max(0, strokeAlpha - std.pow(posInLineY, 0.5));
  } else {
    strokeAlpha *= strokeAlphaBoost;
  }

  strokeAlpha = smoothf(strokeAlpha);
  const paperBleedAmt = bleedParam + rand1(uvPaper.y) * 30 + rand1(uvPaper.x) * 30;
  const alpha = std.clamp(strokeAlpha * brushColor.w * dtoa(sdGeometry, paperBleedAmt), 0, 1);
  return std.mix(inpColor, brushColor.xyz, alpha);
});

const colorBrushStrokeLine = tgpu.fn(
  [d.vec2f, d.vec3f, d.vec4f, d.vec2f, d.vec2f, d.f32, d.f32, d.f32, d.f32],
  d.vec3f,
)((uv, inpColor, brushColor, p1, p2, inLineWidth, pulseTime, minRes, bleedParam) => {
  "use gpu";
  const PI = 3.14159265;
  const lineAngle = PI - std.atan2(p1.x - p2.x, p1.y - p2.y);
  const lineLength = std.distance(p2, p1);

  const tl = rotate2D(p1, lineAngle);
  const br = tl.add(d.vec2f(0, lineLength));
  let uvLine = rotate2D(uv, lineAngle);

  const lineWidth = inLineWidth * std.mix(1, 0.9, std.smoothstep(tl.y, br.y, uvLine.y));
  const nx1 = (noise01(uvLine) - 0.5) * 0.02;
  const cx = std.cos(uvLine.y * 3) * 0.009;
  const nx2 = (noise01(uvLine.mul(5)) - 0.5) * 0.005;
  uvLine = d.vec2f(uvLine.x + nx1 + cx + nx2, uvLine.y);

  const dist = sdAxisAlignedRect(uvLine, tl, br) - lineWidth * 0.5;
  const uvRel = tl.sub(uvLine);
  const lineSize = d.vec2f(lineWidth, lineLength);

  return colorBrushStroke(
    d.vec2f(uvRel.x, -uvRel.y),
    uv,
    lineSize,
    dist,
    inpColor,
    brushColor,
    pulseTime,
    minRes,
    bleedParam,
  );
});

const paintFragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const aspect = u.res.x / std.max(u.res.y, 1);
    const minRes = std.min(u.res.x, u.res.y);

    // Convert Y so 0 is bottom and 1 is top, matching landscape orientation
    const uvY = 1 - input.uv.y;
    const landscapeUV = d.vec2f(input.uv.x * aspect, uvY);

    // UV centered for auroras: x in [-aspect, aspect], y in [-1, 1]
    const uv = d.vec2f((input.uv.x - 0.5) * 2 * aspect, (uvY - 0.5) * 2);

    const time = u.time * 0.4 + u.p_speed * 0.2 + u.anim * 0.15;
    const pulseTime = u.time + u.anim * 0.3;
    const voice = std.clamp(u.outputVol, 0, 1);
    const breath = std.clamp(u.inputVol, 0, 1);
    const glowBoost = u.p_glow * (1 + 0.6 * voice);
    const windBoost = u.p_wind * (1 + 0.5 * breath);

    const waterLevelLandscape = u.p_water;
    const waterLevelUV = waterLevelLandscape * 2 - 1;
    const isWater = landscapeUV.y < waterLevelLandscape;

    const isLight = std.step(0.5, std.dot(u.c_base, d.vec3f(0.299, 0.587, 0.114)));

    // Sky gradient with luminance adaptation to prevent blowout in light palettes
    let skyGradientY = d.f32(uv.y);
    if (isWater) {
      skyGradientY = waterLevelUV + (waterLevelUV - uv.y);
    }
    const skyBlend = std.smoothstep(-0.2, 1, skyGradientY);
    const skyLuma = std.dot(u.c_sky, d.vec3f(0.299, 0.587, 0.114));
    // Dark sky: zenith is slightly lighter/richer blue. Light sky: zenith is a deeper watercolor pigment wash.
    const skyTopFactor = std.mix(1.3, 0.78, std.smoothstep(0.25, 0.65, skyLuma));
    const skyTop = u.c_sky.mul(skyTopFactor);
    const skyCol = std.mix(u.c_sky, skyTop, skyBlend);

    let col = d.vec3f(skyCol);
    if (isWater) {
      col = std.mix(col, u.c_water, 0.85);
    }

    // Pointer coordinates in landscape space
    const mLandscape = d.vec2f(u.mouse.x * aspect, 1 - u.mouse.y);
    const mPointerDist = std.distance(landscapeUV, mLandscape);

    if (!isWater) {
      // 1. Paint Blotch Stars / Spatters
      if (u.p_stars > 0.01) {
        const starP = uv.add(d.vec2f(12, 12)).mul(8);
        let blotchAmt = std.smoothstep(12, 25, magicBox2D(starP));
        blotchAmt = std.pow(blotchAmt, 1.5);
        const starTwinkle = 0.5 + 0.5 * std.sin(pulseTime * 1.5 + uv.x * 5);
        const spatterIntensity = blotchAmt * 0.65 * starTwinkle * u.p_stars;
        // Dark mode: radiant cyan starlight. Light mode: shimmering gold gouache watercolor spatter
        const darkStarCol = col.add(d.vec3f(0.6, 0.85, 0.95).mul(spatterIntensity));
        const goldGouache = d.vec3f(0.88, 0.72, 0.35);
        const lightStarCol = std.mix(col, goldGouache, std.clamp(spatterIntensity * 1.2, 0, 1));
        col = std.mix(darkStarCol, lightStarCol, isLight);
      }

      // 2. Aurora Ribbons (Sky)
      const mLean = (u.mouse.x - 0.5) * 0.2;
      const aUV1 = d.vec2f(
        uv.x,
        uv.y + std.sin(uv.x * 2 + 1 + time) * 0.35 + std.sin(uv.x * 4 - time * 1.5) * 0.1 + mLean,
      );
      const aUV2 = d.vec2f(
        uv.x,
        uv.y +
          std.cos(uv.x * 2.5 - 0.5 - time * 0.8) * 0.4 +
          std.sin(uv.x * 1.5 + time * 1.2) * 0.2 +
          mLean * 0.7,
      );
      const aUV3 = d.vec2f(uv.x, uv.y + std.sin(uv.x * 1.8 + 2 + time * 0.5) * 0.35 + mLean * 1.3);

      col = colorBrushStrokeLine(
        aUV3,
        col,
        d.vec4f(u.c_aurora1, 0.6 * glowBoost),
        d.vec2f(-2.5, 0.6),
        d.vec2f(2.5, 0.6),
        0.4,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        aUV1,
        col,
        d.vec4f(u.c_aurora2, 0.8 * glowBoost),
        d.vec2f(-2.5, 0.4),
        d.vec2f(2.5, 0.4),
        0.3,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        aUV2,
        col,
        d.vec4f(u.c_aurora1.mul(0.7), 0.9 * glowBoost),
        d.vec2f(2.5, 0.2),
        d.vec2f(-2.5, 0.2),
        0.25,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        aUV1,
        col,
        d.vec4f(u.c_aurora3, 0.9 * glowBoost),
        d.vec2f(-2.5, 0.3),
        d.vec2f(2.5, 0.3),
        0.15,
        pulseTime,
        minRes,
        u.p_bleed,
      );
    } else {
      // 3. Aurora Reflections (Water)
      const depthUV = waterLevelUV - uv.y;
      let refUV = d.vec2f(uv.x, waterLevelUV + depthUV);

      // Water ripples
      const waveX = std.sin(uv.y * 30 + pulseTime * 2) * depthUV * 0.15;
      const waveY = std.cos(uv.x * 15 + pulseTime * 1.5) * depthUV * 0.025;
      const mouseRipple =
        std.sin(mPointerDist * 25 - pulseTime * 4) * std.exp(-mPointerDist * 5) * 0.03;

      refUV = refUV.add(d.vec2f(waveX + mouseRipple, waveY + mouseRipple));

      const rUV1 = d.vec2f(
        refUV.x,
        refUV.y + std.sin(refUV.x * 2 + 1 + time) * 0.35 + std.sin(refUV.x * 4 - time * 1.5) * 0.1,
      );
      const rUV2 = d.vec2f(
        refUV.x,
        refUV.y +
          std.cos(refUV.x * 2.5 - 0.5 - time * 0.8) * 0.4 +
          std.sin(refUV.x * 1.5 + time * 1.2) * 0.2,
      );
      const rUV3 = d.vec2f(refUV.x, refUV.y + std.sin(refUV.x * 1.8 + 2 + time * 0.5) * 0.35);

      col = colorBrushStrokeLine(
        rUV3,
        col,
        d.vec4f(u.c_aurora1, 0.3 * glowBoost),
        d.vec2f(-2.5, 0.6),
        d.vec2f(2.5, 0.6),
        0.4,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        rUV1,
        col,
        d.vec4f(u.c_aurora2, 0.4 * glowBoost),
        d.vec2f(-2.5, 0.4),
        d.vec2f(2.5, 0.4),
        0.3,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        rUV2,
        col,
        d.vec4f(u.c_aurora1.mul(0.7), 0.45 * glowBoost),
        d.vec2f(2.5, 0.2),
        d.vec2f(-2.5, 0.2),
        0.25,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        rUV1,
        col,
        d.vec4f(u.c_aurora3, 0.35 * glowBoost),
        d.vec2f(-2.5, 0.3),
        d.vec2f(2.5, 0.3),
        0.15,
        pulseTime,
        minRes,
        u.p_bleed,
      );
    }

    // 4. Island Silhouettes & Trees
    if (!isWater) {
      const landDist = getLand(landscapeUV, aspect);
      const treeDist = getTrees(landscapeUV, aspect, pulseTime, windBoost);
      const sceneDist = std.min(landDist, treeDist);
      col = std.mix(col, u.c_land, std.smoothstep(0.005, 0, sceneDist));
    } else {
      // Fold landscape UV for island reflections
      const depthLandscape = waterLevelLandscape - landscapeUV.y;
      let refLandUV = d.vec2f(landscapeUV.x, waterLevelLandscape + depthLandscape);
      const landWave = std.sin(landscapeUV.y * 50 + pulseTime * 2) * depthLandscape * 0.1;
      const landMouseRipple =
        std.sin(mPointerDist * 20 - pulseTime * 3) * std.exp(-mPointerDist * 6) * 0.02;
      refLandUV = d.vec2f(refLandUV.x + landWave + landMouseRipple, refLandUV.y);

      const refLandDist = getLand(refLandUV, aspect);
      const refTreeDist = getTrees(refLandUV, aspect, pulseTime, windBoost);
      const refSceneDist = std.min(refLandDist, refTreeDist);
      const refReflection = std.mix(col, u.c_land, 0.8);
      col = std.mix(col, refReflection, std.smoothstep(0.005, 0, refSceneDist));

      // Localized horizontal brush strokes for surface water texture
      const surfaceUV = d.vec2f(uv.x + pulseTime * 0.05, uv.y);
      col = colorBrushStrokeLine(
        surfaceUV,
        col,
        d.vec4f(u.c_aurora1, 0.15 * glowBoost),
        d.vec2f(2.5, waterLevelUV - 0.1),
        d.vec2f(-2.5, waterLevelUV - 0.1),
        0.08,
        pulseTime,
        minRes,
        u.p_bleed,
      );
      col = colorBrushStrokeLine(
        surfaceUV,
        col,
        d.vec4f(u.c_aurora2, 0.2 * glowBoost),
        d.vec2f(-2.5, waterLevelUV - 0.3),
        d.vec2f(2.5, waterLevelUV - 0.3),
        0.12,
        pulseTime,
        minRes,
        u.p_bleed,
      );
    }

    // Cold-press watercolor paper tooth & grain
    const paperUV = landscapeUV.mul(d.vec2f(minRes * 0.35, minRes * 0.35));
    const tooth1 = noise01(paperUV);
    const tooth2 = noise01(paperUV.mul(2.2));
    const paperTooth = (tooth1 * 0.65 + tooth2 * 0.35 - 0.5) * 0.038;
    const filmGrain = (rand2(uv) - 0.5) * 0.02;
    col = std.clamp(col.add(d.vec3f(paperTooth + filmGrain)), d.vec3f(0), d.vec3f(1));

    // Vignette: deep atmospheric falloff in dark mode, subtle clean edge softening in light mode
    const uvScreen = input.uv.sub(0.5).mul(2);
    const vignette = std.clamp(1 - std.dot(uvScreen.mul(0.5), uvScreen.mul(0.62)), 0, 1);
    const lightVignette = std.mix(1.0, vignette, 0.2);
    const activeVignette = std.mix(vignette, lightVignette, isLight);
    col = col.mul(activeVignette);

    // Light / Dark mode theme adaptation (base fill tinting when fill > 0)
    const darkBase = u.c_base.mul(u.p_fill);
    const darkCol = darkBase.add(col);
    const lightCol = std.mix(col, u.c_base, u.p_fill * 0.4);
    const finalCol = std.mix(darkCol, lightCol, isLight);

    return d.vec4f(std.clamp(finalCol, d.vec3f(0), d.vec3f(1)), 1);
  })
  .$name("paintFragment");

export const paintShader = tgpu.resolve([paintFragment]);
