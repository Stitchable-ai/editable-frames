/** Planar projective maps for corner pins and screen/label replacement.
 * A homography is a row-major 3x3 array [a,b,c, d,e,f, g,h,1]. Quads are four
 * [x,y] corners in the order top-left, top-right, bottom-right, bottom-left. */
const finite = v => typeof v === 'number' && Number.isFinite(v);
export function validateQuad(quad, what = 'Quad') {
  if (!Array.isArray(quad) || quad.length !== 4 || quad.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(finite))) throw Error(`${what} needs four finite [x,y] corners`);
  return quad;
}
export const rectQuad = (width, height) => [[0, 0], [width, 0], [width, height], [0, height]];

/** The homography carrying each `from` corner onto the matching `to` corner. */
export function solveHomography(from, to) {
  validateQuad(from, 'Source quad'); validateQuad(to, 'Target quad');
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = from[i], [u, v] = to[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  // Gaussian elimination with partial pivoting on the 8x8 system.
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let r = col + 1; r < 8; r++) if (Math.abs(rows[r][col]) > Math.abs(rows[pivot][col])) pivot = r;
    if (Math.abs(rows[pivot][col]) < 1e-12) throw Error('Degenerate quad: three corners are collinear or two coincide');
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const factor = rows[r][col] / rows[col][col];
      if (factor) for (let c = col; c < 9; c++) rows[r][c] -= factor * rows[col][c];
    }
  }
  return [...rows.map((row, i) => row[8] / row[i]), 1];
}
export function applyHomography(h, [x, y]) {
  const w = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}
export function multiplyHomography(a, b) {
  const out = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return out.map(v => v / out[8]);
}
export function invertHomography(h) {
  const [a, b, c, d, e, f, g, i, j] = h;
  const det = a * (e * j - f * i) - b * (d * j - f * g) + c * (d * i - e * g);
  if (Math.abs(det) < 1e-15) throw Error('Homography is not invertible');
  const inv = [e * j - f * i, c * i - b * j, b * f - c * e, f * g - d * j, a * j - c * g, c * d - a * f, d * i - e * g, b * g - a * i, a * e - b * d];
  return inv.map(v => v / inv[8]);
}
/** CSS matrix3d for an element whose transform-origin is its top-left corner. */
export function cssMatrix3d(h) {
  const n = v => { const r = Math.abs(v) < 1e-12 ? 0 : v; return Number(r.toFixed(10)); };
  return `matrix3d(${[h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, h[8]].map(n).join(',')})`;
}
/** Transform that lays a `width`x`height` element onto `quad` (same units as
 * the element's offset parent). Set `transform-origin: 0 0` on the element. */
export function cornerPinTransform(width, height, quad) {
  if (!(width > 0) || !(height > 0)) throw Error('Corner pin needs a positive element size');
  return cssMatrix3d(solveHomography(rectQuad(width, height), quad));
}
/** Signed area; negative means the quad is mirrored (seen from behind). */
export function quadArea(quad) {
  let area = 0;
  for (let i = 0; i < 4; i++) { const [x1, y1] = quad[i], [x2, y2] = quad[(i + 1) % 4]; area += x1 * y2 - x2 * y1; }
  return area / 2;
}
