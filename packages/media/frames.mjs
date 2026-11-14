import {ptsIndex} from './ports.mjs';

/** Derived videos share the plate's frame correspondence. A derived still
 * supplies one raster for every source frame, regardless of the plate clock. */
export function mediaFrameUrl(catalog,id,time){
  const asset=catalog[id];
  if(!asset||asset.type==='audio'||asset.type==='data')throw Error('Missing visual asset: '+id);
  const parent=asset.derived&&catalog[asset.derived.of];
  const index=ptsIndex(asset.type==='video'&&parent?.type==='video'?parent.pts:asset.pts,time);
  return index<0?undefined:asset.url+String(index+1).padStart(6,'0')+'.png';
}
