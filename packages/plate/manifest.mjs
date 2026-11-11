/** Derived assets: data computed FROM another asset, pinned to the exact bytes
 * it was computed from.
 *
 *   "presenter-matte": {src, type:"video", sha256,
 *     derived:{of:"presenter", role:"matte", sourceSha256:"<presenter's sha256>"}}
 *
 * A matte, depth map, track or camera solve describes one particular take.
 * Regenerate the take and they describe something that no longer exists, so a
 * mismatch is refused instead of being composited a few pixels off. */
import {validateDepthEncoding} from './depth.mjs';
export const DERIVED_ROLES = Object.freeze({
  analysis: ['data'],               // prepared source correspondence/review receipt
  surface: ['data'],                // UV mesh/pose correspondence
  coverage: ['video', 'image'],      // visible target surface, not subject alpha
  foreground: ['video', 'image'],    // decontaminated foreground color, when available
  matte: ['video', 'image'],        // white = keep (subject), black = drop
  depth: ['video', 'image'],        // see depth.mjs; needs `encoding`
  normals: ['video', 'image'],      // camera-space normals, (n+1)/2 in RGB
  track: ['data'],                  // track.mjs
  camera: ['data'],                 // camera.mjs
  environment: ['image'],           // an equirectangular picture of the plate's surroundings
});
export function validateDerived(assets) {
  const index = {};
  for (const [id, asset] of Object.entries(assets)) {
    const d = asset.derived;
    if (d === undefined) continue;
    if (!d || typeof d.of !== 'string' || !Object.hasOwn(assets, d.of) || d.of === id) throw Error(`Derived asset ${id} must name another declared asset in derived.of`);
    if (assets[d.of].derived) throw Error(`Derived asset ${id} cannot derive from ${d.of}, which is itself derived`);
    if (!Object.hasOwn(DERIVED_ROLES, d.role)) throw Error(`Derived asset ${id} has unknown role ${d.role}`);
    if (!DERIVED_ROLES[d.role].includes(asset.type)) throw Error(`A ${d.role} must be ${DERIVED_ROLES[d.role].join(' or ')}, not ${asset.type}: ${id}`);
    if (!/^[a-f0-9]{64}$/.test(d.sourceSha256 ?? '')) throw Error(`Derived asset ${id} needs derived.sourceSha256`);
    if (d.sourceSha256 !== assets[d.of].sha256) throw Error(`${id} was made from different bytes than the current ${d.of}; regenerate the ${d.role} for this take`);
    if (d.role === 'depth') validateDepthEncoding(d.encoding);
    else if (d.encoding !== undefined) throw Error(`Only depth assets carry an encoding: ${id}`);
    index[d.of] ??= {};
    if (index[d.of][d.role]) throw Error(`${d.of} has two ${d.role} assets (${index[d.of][d.role]}, ${id}); keep one`);
    index[d.of][d.role] = id;
  }
  return index;
}
