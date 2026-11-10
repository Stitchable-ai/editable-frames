/** Control passes: the same scene drawn as structure instead of as a picture,
 * to condition a video model or to composite elsewhere. A scene declares the
 * passes it implements; a host never invents one it was not given. */
export const PASS = /^[a-z][a-z0-9-]{0,31}$/;
export const COMMON_PASSES = Object.freeze(['beauty', 'clay', 'depth', 'normal', 'id', 'matte']);
export function validatePasses(passes) {
  if (passes === undefined) return [];
  if (!Array.isArray(passes) || passes.length > 16 || new Set(passes).size !== passes.length || passes.some(p => typeof p !== 'string' || !PASS.test(p))) throw Error('passes must be up to 16 unique lowercase names');
  return passes.filter(p => p !== 'beauty');
}
// An odd multiplier is a bijection on 24-bit integers, so neighbouring ids get
// far-apart colours and every colour still decodes to exactly one id.
const SPREAD = 0x9E3779, MASK = 0xFFFFFF;
let inverse = 1; for (let i = 0; i < 5; i++) inverse = Math.imul(inverse, 2 - Math.imul(SPREAD, inverse)) & MASK;
/** Byte colour for object `index` (0-based). Colour [0,0,0] means "no object". */
export function idColor(index) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= MASK) throw Error('Object index out of range');
  const code = Math.imul(index + 1, SPREAD) & MASK;
  return [code >> 16, (code >> 8) & 255, code & 255];
}
/** Object index for a byte colour, or -1 for the empty colour. */
export function idFromColor([r, g, b]) {
  return (Math.imul((r << 16) | (g << 8) | b, inverse) & MASK) - 1;
}
