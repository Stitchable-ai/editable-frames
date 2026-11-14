/** Sub-frame sample times for an offline shutter. Frames are explicit, so a
 * host can afford N renders per output frame and average them. */
export function validateShutter({samples = 8, angle = 180, phase = 'centered'} = {}) {
  if (!Number.isSafeInteger(samples) || samples < 2 || samples > 64) throw Error('Motion blur samples must be an integer 2..64');
  if (!(angle > 0 && angle <= 360)) throw Error('Shutter angle must be in (0, 360] degrees');
  if (!['centered', 'forward'].includes(phase)) throw Error('Shutter phase must be centered or forward');
  return {samples, angle, phase};
}
/** Fractional frames to render for output `frame`. `centered` straddles the
 * frame instant; `forward` opens at it. Times before frame 0 are clamped. */
export function shutterSamples(frame, options) {
  const {samples, angle, phase} = validateShutter(options);
  if (!(frame >= 0)) throw Error('Shutter needs a non-negative frame');
  const open = angle / 360, start = phase === 'centered' ? frame - open / 2 : frame;
  return Array.from({length: samples}, (_, k) => Math.max(0, start + (k + 0.5) / samples * open));
}
