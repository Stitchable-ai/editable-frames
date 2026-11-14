/** Depth plates. A depth asset is an ordinary image or video whose pixels
 * encode distance from the camera; the manifest says how.
 *
 * encoding = {kind:'inverse'|'linear', near, far, packing:'gray8'|'rg16'}
 *
 * White is NEAR in both kinds. `inverse` (disparity-like, what monocular depth
 * models emit) spends its precision close to the camera; `linear` spreads it
 * evenly. `near` and `far` are the distances that white and black stand for, in
 * scene units along the view axis. Relative depth has no true scale: near/far
 * are a choice the author tunes until occlusion lands, not a measurement. */
export function validateDepthEncoding(encoding) {
  if (!encoding || !['inverse', 'linear'].includes(encoding.kind)) throw Error('Depth encoding needs kind inverse or linear');
  if (!(encoding.near > 0) || !(encoding.far > encoding.near) || !Number.isFinite(encoding.far)) throw Error('Depth encoding needs 0 < near < far');
  if (!['gray8', 'rg16'].includes(encoding.packing ?? 'gray8')) throw Error('Depth packing must be gray8 or rg16');
  return {kind: encoding.kind, near: encoding.near, far: encoding.far, packing: encoding.packing ?? 'gray8'};
}
/** Channel bytes to a 0..1 code value. rg16 keeps 16 bits in red (high) and green (low). */
export const unpackDepth = (r, g, packing = 'gray8') => packing === 'rg16' ? (r * 256 + g) / 65535 : r / 255;
export function packDepth(value, packing = 'gray8') {
  const v = Math.min(1, Math.max(0, value));
  if (packing !== 'rg16') { const byte = Math.round(v * 255); return [byte, byte, byte]; }
  const code = Math.round(v * 65535); return [code >> 8, code & 255, 0];
}
/** Code value (white = near) to view-axis distance. */
export function decodeDepth(value, encoding) {
  const {kind, near, far} = encoding, v = Math.min(1, Math.max(0, value));
  return kind === 'inverse' ? 1 / (1 / far + v * (1 / near - 1 / far)) : far - v * (far - near);
}
export function encodeDepth(distance, encoding) {
  const {kind, near, far} = encoding, d = Math.min(far, Math.max(near, distance));
  return kind === 'inverse' ? (1 / d - 1 / far) / (1 / near - 1 / far) : (far - d) / (far - near);
}
/** GLSL for the same decode: `float plateDistance(vec4 texel)`. */
export function depthGlsl(encoding) {
  const {kind, near, far, packing} = validateDepthEncoding(encoding), f = v => Number(v).toPrecision(9).replace(/^(-?\d+)$/, '$1.0');
  const code = packing === 'rg16' ? '(texel.r * 65280.0 + texel.g * 255.0) / 65535.0' : 'texel.r';
  const distance = kind === 'inverse' ? `1.0 / (${f(1 / far)} + v * ${f(1 / near - 1 / far)})` : `${f(far)} - v * ${f(far - near)}`;
  return `float plateDistance(vec4 texel){float v=clamp(${code},0.0,1.0);return ${distance};}`;
}
/** Pixel + distance to a camera-space point (Three.js convention: -Z forward). */
export function unprojectDepth(u, v, distance, fovY, aspect) {
  const tan = Math.tan(fovY * Math.PI / 360);
  return [(u * 2 - 1) * tan * aspect * distance, (1 - v * 2) * tan * distance, -distance];
}
/** Least-squares plane y = a*x + b*z + c through camera-space points: enough
 * to lay a shadow catcher on a floor or table read from a depth plate. */
export function fitGroundPlane(points) {
  if (!Array.isArray(points) || points.length < 3) throw Error('A plane needs at least three points');
  let sxx = 0, sxz = 0, szz = 0, sx = 0, sz = 0, sxy = 0, szy = 0, sy = 0; const n = points.length;
  for (const [x, y, z] of points) { sxx += x * x; sxz += x * z; szz += z * z; sx += x; sz += z; sxy += x * y; szy += z * y; sy += y; }
  const m = [[sxx, sxz, sx, sxy], [sxz, szz, sz, szy], [sx, sz, n, sy]];
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-12) throw Error('Points do not span a ground plane');
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < 3; r++) if (r !== col) { const k = m[r][col] / m[col][col]; for (let c = col; c < 4; c++) m[r][c] -= k * m[col][c]; }
  }
  const a = m[0][3] / m[0][0], b = m[1][3] / m[1][1], c = m[2][3] / m[2][2], length = Math.hypot(a, 1, b);
  let rms = 0; for (const [x, y, z] of points) rms += (a * x + b * z + c - y) ** 2;
  return {normal: [-a / length, 1 / length, -b / length], point: [0, c, 0], rms: Math.sqrt(rms / n)};
}
