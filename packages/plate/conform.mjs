/** Keeping code and plate on the same instants.
 * Video generators emit a fixed rate (commonly 24 fps; some 16 or 30). A code
 * layer that is locked to something in the plate must move on the plate's frame
 * grid, or it slides against the picture between plate frames. */
const rate = r => { if (!r || !Number.isSafeInteger(r.num) || !Number.isSafeInteger(r.den) || r.num < 1 || r.den < 1) throw Error('Frame rate needs positive integers {num,den}'); return r; };
const gcd = (a, b) => b ? gcd(b, a % b) : a;
/** Index of the plate frame on screen at `seconds`. */
export function plateFrameIndex(seconds, frameRate) {
  rate(frameRate);
  if (!(seconds >= 0)) throw Error('Plate time must be non-negative seconds');
  return Math.floor(seconds * frameRate.num / frameRate.den + 1e-9);
}
/** `seconds` snapped back to the start of the plate frame that is showing. */
export function conformSeconds(seconds, frameRate) {
  return plateFrameIndex(seconds, frameRate) * frameRate.den / frameRate.num;
}
/** How a plate plays inside a timeline of another rate: how many timeline
 * frames each plate frame is held for, over one repeating cycle. An uneven
 * pattern (24 in 30 -> 1,1,1,2) is visible judder on any camera or subject move. */
export function cadence(plateRate, timelineRate) {
  rate(plateRate); rate(timelineRate);
  // timeline frames per plate frame = (t.num/t.den) / (p.num/p.den)
  const num = timelineRate.num * plateRate.den, den = timelineRate.den * plateRate.num, g = gcd(num, den);
  const cycleTimeline = num / g, cyclePlate = den / g;
  if (cyclePlate > 10_000) return {pattern: null, even: false, dropsFrames: num < den, advice: 'Rates share no short cycle; render the timeline at the plate rate or interpolate the plate.'};
  const pattern = new Array(cyclePlate).fill(0);
  for (let i = 0; i < cycleTimeline; i++) pattern[Math.floor((i * cyclePlate + 1e-9) / cycleTimeline)]++;
  const even = pattern.every(v => v === pattern[0]), dropsFrames = pattern.some(v => v === 0);
  const advice = even && !dropsFrames ? 'Even cadence; no conform needed.'
    : dropsFrames ? 'The timeline is slower than the plate and drops plate frames; render at the plate rate.'
    : `Uneven cadence ${pattern.join(',')}; render the timeline at ${plateRate.num}/${plateRate.den} fps or interpolate the plate first.`;
  return {pattern, even, dropsFrames, advice};
}
