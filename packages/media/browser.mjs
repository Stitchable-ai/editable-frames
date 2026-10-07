import {mediaTime,ptsIndex} from './ports.mjs';
export function createMediaHost(catalog,{maxBytes=96*1024**2}={}){
 const frames=new Map();let bytes=0;
 async function frameAt(id,time){
  const a=catalog[id];if(!a||a.type==='audio')throw Error('Missing visual asset: '+id);
  const index=ptsIndex(a.pts,time);if(index<0)return null;
  const key=id+':'+index;if(frames.has(key)){const hit=frames.get(key);frames.delete(key);frames.set(key,hit);return hit.image}
  const response=await fetch(a.url+String(index+1).padStart(6,'0')+'.png');if(!response.ok)throw Error('Media frame unavailable: '+key);
  const image=await createImageBitmap(await response.blob()),size=image.width*image.height*4;
  if(size>maxBytes){image.close();throw Error('Single frame exceeds cache budget')}
  while(bytes+size>maxBytes&&frames.size){const k=frames.keys().next().value;const x=frames.get(k);x.image.close();bytes-=x.size;frames.delete(k)}
  frames.set(key,{image,size});bytes+=size;return image;
 }
 return {catalog,frameAt,async portFrame(port,time){const a=catalog[port.asset];if(!a)throw Error('Missing asset: '+port.asset);const t=a.type==='image'?0:mediaTime(port,time,a.duration);return t===null?null:frameAt(port.asset,t)},dispose(){for(const x of frames.values())x.image.close();frames.clear();bytes=0},stats(){return {frames:frames.size,bytes,maxBytes}}};
}
