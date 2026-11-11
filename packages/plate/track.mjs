/** Tracking data a host or any external tool produced for a plate.
 *
 * {version:1, kind:'planar'|'point', width, height, frameRate:{num,den},
 *  frames:[{frame, quad:[[x,y]*4] | point:[x,y], confidence?}]}
 *
 * Coordinates are plate pixels, origin top-left. Frames are plate frame
 * numbers; they may be sparse. EditableFrames never runs a tracker itself. */
import {validateQuad} from './homography.mjs';
const finite = v => typeof v === 'number' && Number.isFinite(v);
export function validateTrack(track) {
  if (!track || track.version !== 1 || !['planar', 'point'].includes(track.kind)) throw Error('Track needs version 1 and kind planar or point');
  if (!Number.isSafeInteger(track.width) || !Number.isSafeInteger(track.height) || track.width < 1 || track.height < 1) throw Error('Track needs the plate width and height');
  const r = track.frameRate;
  if (!r || !Number.isSafeInteger(r.num) || !Number.isSafeInteger(r.den) || r.num < 1 || r.den < 1) throw Error('Track needs the plate frameRate {num,den}');
  if (!Array.isArray(track.frames) || !track.frames.length || track.frames.length > 100_000) throw Error('Track needs 1..100000 frames');
  let previous = -1;
  for (const f of track.frames) {
    if (!Number.isSafeInteger(f.frame) || f.frame <= previous) throw Error('Track frames must be strictly increasing integers');
    previous = f.frame;
    if (track.kind === 'planar') validateQuad(f.quad, `Track frame ${f.frame}`);
    else if (!Array.isArray(f.point) || f.point.length !== 2 || !f.point.every(finite)) throw Error(`Track frame ${f.frame} needs a finite [x,y] point`);
    if (f.confidence !== undefined && !(f.confidence >= 0 && f.confidence <= 1)) throw Error('Track confidence must be 0..1');
  }
  return track;
}
const mix = (a, b, t) => a + (b - a) * t;
/** Sample at plate seconds. Between tracked frames the shape is interpolated
 * (sub-frame samples are what motion blur needs); outside the tracked range the
 * nearest tracked frame is held and `held` says so. */
export function sampleTrack(track, seconds) {
  if (!finite(seconds)) throw Error('Track sample needs finite seconds');
  return sampleTrackFrame(track, seconds * track.frameRate.num / track.frameRate.den);
}
/** Sample a known decoded source frame without converting its quantized PTS
 * back through nominal fps. Fractional positions remain available to authors. */
export function sampleTrackFrame(track, position) {
  if (!finite(position)) throw Error('Track sample needs a finite frame');
  const frames = track.frames;
  let lo = 0, hi = frames.length - 1;
  if (position <= frames[0].frame) hi = 0;
  else if (position >= frames[hi].frame) lo = hi;
  else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (frames[mid].frame <= position) lo = mid; else hi = mid; } }
  const a = frames[lo], b = frames[hi], t = a === b ? 0 : (position - a.frame) / (b.frame - a.frame);
  // Exactly on a tracked frame, that frame's own confidence stands; between two, the worse one.
  const confidence = t === 0 ? a.confidence ?? 1 : Math.min(a.confidence ?? 1, b.confidence ?? 1);
  const held = position < frames[0].frame || position > frames.at(-1).frame;
  if (track.kind === 'point') return {point: [mix(a.point[0], b.point[0], t), mix(a.point[1], b.point[1], t)], confidence, held};
  return {quad: a.quad.map((p, i) => [mix(p[0], b.quad[i][0], t), mix(p[1], b.quad[i][1], t)]), confidence, held};
}
/** Plate pixels to another raster of the same aspect (for example the scene). */
export function scalePoints(points, track, width, height) {
  const sx = width / track.width, sy = height / track.height;
  return points.map(([x, y]) => [x * sx, y * sy]);
}
