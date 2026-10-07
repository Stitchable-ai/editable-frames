import {resolvePorts} from './ports.mjs';import {HZ} from '../core/index.mjs';
export function audioPlan(studio,catalog){
 const tracks=[];
 for(const clip of studio.doc.clips){
  const template=studio.templates[clip.template],ports=resolvePorts(template,clip.nodes);
  for(const [id,port]of Object.entries(ports)){
   const asset=catalog[port.asset];if(!asset)throw Error('Missing asset: '+port.asset);if(!asset.audio||port.muted||!port.gain)continue;
   const spec=template.media[id],node=clip.nodes.find(n=>n.id===spec.anchor);
   for(const prop of Object.values(spec.bindings??{}))if(node?.keys?.[prop]?.length)throw Error('Animated audio-port parameters require an audio automation adapter: '+id);
   const local=clip.sourceIn/HZ,rate=clip.rate*port.rate;
   let delay=Math.max(0,(port.offset-local)/clip.rate),sourceIn=port.sourceIn+Math.max(0,local-port.offset)*port.rate-(asset.audioOffset??0);
   if(sourceIn<0){delay+=-sourceIn/rate;sourceIn=0}
   let duration=clip.duration/HZ-delay;if(!port.end.includes('loop')&&Number.isFinite(asset.duration))duration=Math.min(duration,(asset.duration-sourceIn-(asset.audioOffset??0))/rate);if(duration<=0)continue;
   tracks.push({asset:port.asset,start:clip.start/HZ+delay,sourceIn,rate,duration,gain:port.gain,loop:port.end==='loop',clip:clip.id,port:id});
  }
 }
 return tracks;
}
