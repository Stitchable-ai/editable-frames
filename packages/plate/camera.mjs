/** A solved or authored camera path for a plate.
 *
 * {version:1, width, height, frameRate:{num,den},
 *  frames:[{frame, position:[x,y,z], quaternion:[x,y,z,w], fovY}]}
 *
 * Convention: camera-to-world, right-handed, +Y up, looking down -Z (the
 * Three.js camera convention). fovY is the vertical field of view in degrees.
 * A solve of generated footage is approximate; EditableFrames only replays it. */
const finite = v => typeof v === 'number' && Number.isFinite(v);
export function validateCameraPath(path) {
  if (!path || path.version !== 1) throw Error('Camera path needs version 1');
  const r = path.frameRate;
  if (!r || !Number.isSafeInteger(r.num) || !Number.isSafeInteger(r.den) || r.num < 1 || r.den < 1) throw Error('Camera path needs frameRate {num,den}');
  if (!Array.isArray(path.frames) || !path.frames.length || path.frames.length > 100_000) throw Error('Camera path needs 1..100000 frames');
  let previous = -1;
  for (const f of path.frames) {
    if (!Number.isSafeInteger(f.frame) || f.frame <= previous) throw Error('Camera frames must be strictly increasing integers');
    previous = f.frame;
    if (!Array.isArray(f.position) || f.position.length !== 3 || !f.position.every(finite)) throw Error(`Camera frame ${f.frame} needs position [x,y,z]`);
    if (!Array.isArray(f.quaternion) || f.quaternion.length !== 4 || !f.quaternion.every(finite) || Math.abs(Math.hypot(...f.quaternion) - 1) > 1e-3) throw Error(`Camera frame ${f.frame} needs a unit quaternion [x,y,z,w]`);
    if (!(f.fovY > 0 && f.fovY < 180)) throw Error(`Camera frame ${f.frame} needs fovY in degrees`);
  }
  return path;
}
export function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sign = dot < 0 ? -1 : 1; dot = Math.min(1, Math.abs(dot));
  let wa = 1 - t, wb = t;
  if (dot < 0.9995) { const theta = Math.acos(dot), s = Math.sin(theta); wa = Math.sin((1 - t) * theta) / s; wb = Math.sin(t * theta) / s; }
  const out = a.map((v, i) => v * wa + sign * b[i] * wb), length = Math.hypot(...out);
  return out.map(v => v / length);
}
/** Sample at plate seconds; ends are held. */
export function sampleCameraPath(path, seconds) {
  if (!finite(seconds)) throw Error('Camera sample needs finite seconds');
  const frames = path.frames, position = seconds * path.frameRate.num / path.frameRate.den;
  let lo = 0, hi = frames.length - 1;
  if (position <= frames[0].frame) hi = 0;
  else if (position >= frames[hi].frame) lo = hi;
  else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (frames[mid].frame <= position) lo = mid; else hi = mid; } }
  const a = frames[lo], b = frames[hi], t = a === b ? 0 : (position - a.frame) / (b.frame - a.frame);
  return {
    position: a.position.map((v, i) => v + (b.position[i] - v) * t),
    quaternion: slerp(a.quaternion, b.quaternion, t),
    fovY: a.fovY + (b.fovY - a.fovY) * t,
  };
}
