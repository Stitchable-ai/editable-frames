import {sampleKeys,HZ} from '../core/index.mjs';import {resolvePorts} from '../media/ports.mjs';
// Explicit source seconds avoid accumulating rounded project tick increments.
export function evaluateClip(studio,clip,time){
 const sourceTime=Math.max(0,Math.min((clip.sourceDuration-1)/HZ,clip.sourceIn/HZ+(time-clip.start/HZ)*clip.rate));
 const nodes=clip.nodes.map(n=>({...n,props:Object.fromEntries(Object.entries(n.props).map(([k,v])=>[k,sampleKeys(n.keys?.[k],sourceTime,v,studio.schema(clip,n)[k])]))}));
 return {sourceTime,nodes,ports:resolvePorts(studio.templates[clip.template],nodes)};
}
export function createCompositor(canvas,{templates,createRenderer,host}){
 // Keep composition on a stable raster path when previews/exports read pixels.
 const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true}),renderers=new Map();let chain=Promise.resolve(),generation=0;
 const draw=async(studio,time,{selected,timeline=false}={})=>{
  if(!Number.isFinite(time)||time<0)throw Error('Invalid render time');
  const clips=timeline?studio.doc.clips.filter(c=>time>=c.start/HZ&&time<(c.start+c.duration)/HZ):[studio.clip(selected)];
  const active=new Set(clips.map(c=>c.id));for(const [id,r]of renderers)if(!active.has(id)){await r.instance.dispose?.();renderers.delete(id)}
  const first=clips[0],t=first&&templates[first.template];canvas.width=timeline?studio.doc.width:(t?.width??1280);canvas.height=timeline?studio.doc.height:(t?.height??720);ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const clip of clips){
   const spec=templates[clip.template];let r=renderers.get(clip.id);if(!r){const surface=document.createElement('canvas');surface.width=spec.width??1280;surface.height=spec.height??720;const instance=await createRenderer(surface,{host,template:spec});if(typeof instance?.render!=='function')throw Error('Renderer must implement render(frame)');r={surface,instance};renderers.set(clip.id,r)}
   const evaluated=evaluateClip(studio,clip,timeline?time:clip.start/HZ+time);
   const output=await r.instance.render({template:spec,time:evaluated.sourceTime,projectTime:time,nodes:evaluated.nodes,ports:evaluated.ports,host,clip});
   const image=await r.instance.capture?.()??output??r.surface;
   if(typeof image?.width!=='number'||typeof image?.height!=='number')throw Error('Renderer needs an image surface or capture() adapter');
   ctx.save();const tr=clip.transform;ctx.globalAlpha=tr.opacity;ctx.translate(tr.x,tr.y);ctx.scale(tr.scale,tr.scale);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   // Host-added caption objects are an optional editing service, not scene primitives.
   ctx.save();ctx.scale(canvas.width/1920,canvas.height/1080);
   for(const n of evaluated.nodes.filter(n=>n.overlay)){const p=n.props;if(!p.visible||evaluated.sourceTime<p.start||evaluated.sourceTime>p.end)continue;ctx.save();ctx.globalAlpha*=p.opacity;ctx.font=`600 ${p.size}px sans-serif`;ctx.textBaseline='top';const w=ctx.measureText(p.text).width;if(p.style!=='plain'){ctx.fillStyle=p.background;ctx.beginPath();ctx.roundRect(p.x-14,p.y-10,w+28,p.size*1.3+20,p.style==='pill'?p.size:10);ctx.fill()}ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y);ctx.restore()}
   ctx.restore();ctx.restore();
  }
  return canvas;
 };
 return {render(studio,time,options){const ticket=++generation;const task=chain.catch(()=>{}).then(()=>ticket===generation?draw(studio,time,options):canvas);chain=task;return task},async dispose(){await chain.catch(()=>{});for(const r of renderers.values())await r.instance.dispose?.();renderers.clear();host.dispose?.()}};
}
