/** Measuring a plate so code-rendered pixels can be matched to it.
 * Every function takes 8-bit RGBA (`Uint8ClampedArray`, as ImageData gives) and
 * is deterministic. They are estimates from one view of the scene: expose the
 * results as editable controls instead of trusting them blindly. */
export const srgbToLinear = v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
export const linearToSrgb = v => v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
const LUT = Float64Array.from({length: 256}, (_, i) => srgbToLinear(i / 255));
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
function check(rgba, width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || rgba?.length !== width * height * 4) throw Error('Expected RGBA pixels matching width x height');
}
function percentile(histogram, total, fraction) {
  let seen = 0; const target = total * fraction;
  for (let i = 0; i < 256; i++) { seen += histogram[i]; if (seen >= target) return i; }
  return 255;
}
/** Black point, white point and mean per channel, in linear light. The points
 * are the 1st and 99th percentiles, so a few stray pixels do not set them. */
export function plateStats(rgba, width, height) {
  check(rgba, width, height);
  const h = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)], sum = [0, 0, 0], total = width * height;
  for (let i = 0; i < rgba.length; i += 4) for (let c = 0; c < 3; c++) { h[c][rgba[i + c]]++; sum[c] += LUT[rgba[i + c]]; }
  return {
    black: h.map(x => LUT[percentile(x, total, 0.01)]),
    white: h.map(x => LUT[percentile(x, total, 0.99)]),
    mean: sum.map(v => v / total),
  };
}
/** Levels that sit a full-range (0..1 linear) render inside the plate's own
 * range, so its blacks are no blacker and its whites no whiter than the plate's. */
export function matchLevels(stats) {
  return {offset: [...stats.black], gain: stats.white.map((w, c) => Math.max(0, w - stats.black[c]))};
}
export const applyLevels = (rgb, levels) => rgb.map((v, c) => levels.offset[c] + v * levels.gain[c]);

/** Where the light seems to come from, judged from the brightest 5% of the
 * frame. Returns a unit vector in camera space pointing FROM the subject TOWARD
 * the light (Three.js convention: +X right, +Y up, +Z toward the camera), its
 * colour, how concentrated it is (0 = flat overcast, 1 = one small source) and
 * the colour of everything else as ambient fill.
 *
 * A picture says which SIDE the light is on, not how far in front of or behind
 * the subject it sits, and nothing about what is behind the camera. So the
 * side-to-side and up-down parts come from where the bright area is in frame,
 * and the front-to-back part is a stated assumption: a small source is placed
 * level with the subject (side light), a broad one in front of it (frontal).
 * Treat the result as a starting value for an editable control. */
export function estimateKeyLight(rgba, width, height) {
  check(rgba, width, height);
  const histogram = new Uint32Array(256), total = width * height, lum = new Float32Array(total);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    lum[p] = luminance(LUT[rgba[i]], LUT[rgba[i + 1]], LUT[rgba[i + 2]]);
    histogram[Math.min(255, Math.round(linearToSrgb(lum[p]) * 255))]++;
  }
  // The histogram bin is a rounded value; the margin keeps a flat frame from
  // reading as a faint light source through that rounding.
  const threshold = srgbToLinear(percentile(histogram, total, 0.95) / 255) + 2e-3;
  let weight = 0, cx = 0, cy = 0, spread = 0; const key = [0, 0, 0], ambient = [0, 0, 0]; let ambientCount = 0;
  for (let y = 0, p = 0; y < height; y++) for (let x = 0; x < width; x++, p++) {
    const i = p * 4, w = lum[p] - threshold;
    if (w > 0) { weight += w; cx += w * (x + 0.5); cy += w * (y + 0.5); for (let c = 0; c < 3; c++) key[c] += w * LUT[rgba[i + c]]; }
    else { ambientCount++; for (let c = 0; c < 3; c++) ambient[c] += LUT[rgba[i + c]]; }
  }
  const fill = ambient.map(v => ambientCount ? v / ambientCount : 0);
  if (!(weight > 1e-9)) return {toward: [0, 0.7071, 0.7071], color: [1, 1, 1], concentration: 0, ambient: fill};
  cx /= weight; cy /= weight;
  for (let y = 0, p = 0; y < height; y++) for (let x = 0; x < width; x++, p++) { const w = lum[p] - threshold; if (w > 0) spread += w * (((x + 0.5 - cx) / width) ** 2 + ((y + 0.5 - cy) / height) ** 2); }
  // A uniform frame has spread 1/6 across both axes; a point source has 0.
  const concentration = Math.min(1, Math.max(0, 1 - Math.sqrt(spread / weight) / Math.sqrt(1 / 6)));
  const toward = [cx / width * 2 - 1, 1 - cy / height * 2, 0.25 + 0.75 * (1 - concentration)];
  const length = Math.hypot(...toward), peak = Math.max(...key, 1e-9);
  return {toward: toward.map(v => v / length), color: key.map(v => v / peak), concentration, ambient: fill};
}
/** Noise standard deviation in 0..1 code values (Immerkaer's fast estimator,
 * on luma). Use it to size the grain added over code-rendered layers. */
export function estimateNoise(rgba, width, height) {
  check(rgba, width, height);
  if (width < 3 || height < 3) return 0;
  const y = new Float32Array(width * height);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) y[p] = (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) / 255;
  let sum = 0;
  for (let r = 1; r < height - 1; r++) for (let c = 1; c < width - 1; c++) {
    const p = r * width + c;
    sum += Math.abs(y[p - width - 1] - 2 * y[p - width] + y[p - width + 1] - 2 * y[p - 1] + 4 * y[p] - 2 * y[p + 1] + y[p + width - 1] - 2 * y[p + width] + y[p + width + 1]);
  }
  return Math.sqrt(Math.PI / 2) * sum / (6 * (width - 2) * (height - 2));
}
/** Seeded grain in -1..1 for one pixel of one frame: no Math.random, so a
 * repeated or backward seek draws the same grain. */
export function grainAt(x, y, frame, seed = 1) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(frame | 0, 2147483647) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 2147483647.5 - 1;
}
/** Lift an 8-bit frame into linear float RGBA and push its clipped highlights
 * above 1, so a display-referred plate can stand in for a light source. The
 * boost is a guess at what the tone curve threw away; it is not recovered data. */
export function expandHighlights(rgba, {knee = 0.8, boost = 6} = {}) {
  const out = new Float32Array(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const r = LUT[rgba[i]], g = LUT[rgba[i + 1]], b = LUT[rgba[i + 2]], l = luminance(r, g, b);
    const over = l > knee ? (l - knee) / (1 - knee) : 0, k = 1 + boost * over * over;
    out[i] = r * k; out[i + 1] = g * k; out[i + 2] = b * k; out[i + 3] = 1;
  }
  return out;
}
