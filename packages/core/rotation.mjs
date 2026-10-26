/** Portable rotation values. No renderer or GPU dependency. */
export function isUnitQuaternion(value) {
  return Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) &&
    Math.abs(Math.hypot(...value) - 1) <= 1e-6;
}
export function normalizeQuaternion(value) {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(Number.isFinite)) throw Error('Invalid quaternion');
  const length = Math.hypot(...value);
  if (!Number.isFinite(length) || length < 1e-12) throw Error('Quaternion has no orientation');
  return value.map(v => v / length);
}
export function sameOrientation(a, b, tolerance = 1e-10) {
  if (!isUnitQuaternion(a) || !isUnitQuaternion(b)) return false;
  return Math.min(Math.hypot(...a.map((v,i)=>v-b[i])), Math.hypot(...a.map((v,i)=>v+b[i]))) <= tolerance;
}
function canonical(q) {
  const first = [q[3], q[0], q[1], q[2]].find(v => v !== 0);
  return first < 0 ? q.map(v => -v) : q;
}
export function slerpQuaternion(a, b, t) {
  a = normalizeQuaternion(a); b = normalizeQuaternion(b);
  let dot = a.reduce((n,v,i)=>n+v*b[i],0);
  // Exact 180-degree ties have two shortest paths. Choose a sign-invariant one.
  if (dot === 0) { a = canonical(a); b = canonical(b); }
  else if (dot < 0) { b = b.map(v=>-v); dot = -dot; }
  if (t <= 0) return a;
  if (t >= 1) return b;
  if (dot > .9995) return normalizeQuaternion(a.map((v,i)=>v+(b[i]-v)*t));
  const theta = Math.acos(Math.min(1,Math.max(-1,dot))), denominator = Math.sin(theta);
  return normalizeQuaternion(a.map((v,i)=>(v*Math.sin((1-t)*theta)+b[i]*Math.sin(t*theta))/denominator));
}
