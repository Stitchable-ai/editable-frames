import {HZ} from '../core/index.mjs';
import {sampledRendererProps,rendererFrameRate} from '../core/definition.mjs';
import {mountRenderer} from './renderer-host.mjs';
import {resolveObjectSelection} from '../core/objects.mjs';
import {evaluateClip} from './compositor.mjs';
/** DOM roots compose Canvas, WebGL, SVG and arbitrary browser implementations. */
export function createRendererCompositor(stage,{scene,templates,services={},capture=false}) {
  const residents=new Map();let chain=Promise.resolve(),disposed=false,lastRequest,renderVersion=0,pickVersion=0,activeJob,pendingJob,disposal;
  stage.style.position=capture?'fixed':'relative';stage.style.overflow='hidden';
  if(capture){stage.style.left='0';stage.style.top='0';stage.style.zIndex='2147483647';}
  async function draw(studio,time,{selected,timeline=false,playing=false}={}) {
    if(disposed)throw Error('Compositor disposed');
    if(!Number.isFinite(time)||time<0)throw Error('Invalid source time');
    const clips=timeline?studio.doc.clips.filter(c=>time>=c.start/HZ&&time<(c.start+c.duration)/HZ):[studio.clip(selected)];
    const active=new Set(clips.map(c=>c.id));
    for(const [id,r] of residents)if(!active.has(id)){await r.instance.dispose();r.layer.remove();residents.delete(id);}
    const width=timeline?studio.doc.width:scene.width,height=timeline?studio.doc.height:scene.height;
    stage.style.aspectRatio=`${width}/${height}`;
    if(capture){stage.style.width=`${width}px`;stage.style.height=`${height}px`;}
    for(const clip of clips){
      let resident=residents.get(clip.id);
      if(!resident){
        const layer=document.createElement('div'),root=document.createElement('div'),overlays=document.createElement('div');layer.dataset.clipId=clip.id;
        layer.style.cssText='position:absolute;inset:0;transform-origin:0 0';
        root.style.cssText=`position:absolute;left:0;top:0;width:${scene.width}px;height:${scene.height}px;transform-origin:0 0;overflow:hidden`;
        overlays.style.cssText='position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;pointer-events:none';
        layer.append(root,overlays);stage.append(layer);
        try{const instance=await mountRenderer(scene,{root,services});resident={layer,root,overlays,instance};residents.set(clip.id,resident);}catch(error){layer.remove();throw error;}
      }
      stage.append(resident.layer);
      const tr=clip.transform;resident.layer.style.opacity=String(tr.opacity);resident.layer.style.transform=`translate(${tr.x/width*100}%,${tr.y/height*100}%) scale(${tr.scale})`;
      resident.root.style.transform=`scale(${stage.clientWidth/scene.width},${stage.clientHeight/scene.height})`;
      const evaluated=evaluateClip(studio,clip,timeline?time:clip.start/HZ+time);
      const clock={frame:evaluated.sourceTime*scene.fps,fps:scene.fps,frameRate:rendererFrameRate(scene),width:scene.width,height:scene.height,durationInFrames:scene.durationInFrames,capture,playing};
      resident.clock=clock;
      try {await resident.instance.render(clock,sampledRendererProps(scene,templates[clip.template],clip,evaluated.nodes));}
      catch(error){residents.delete(clip.id);resident.layer.remove();await resident.instance.dispose().catch(()=>{});throw error;}
      resident.overlays.style.transform=`scale(${stage.clientWidth/1920},${stage.clientHeight/1080})`;resident.overlays.replaceChildren();
      for(const node of evaluated.nodes.filter(n=>n.overlay)){
        const p=node.props;if(!p.visible||evaluated.sourceTime<p.start||evaluated.sourceTime>p.end)continue;
        const label=document.createElement('div');label.textContent=p.text;
        Object.assign(label.style,{position:'absolute',left:`${p.x-14}px`,top:`${p.y-10}px`,padding:'10px 14px',font:`600 ${p.size}px sans-serif`,color:p.color,opacity:p.opacity,whiteSpace:'pre',background:p.style==='plain'?'transparent':p.background,borderRadius:p.style==='pill'?`${p.size}px`:'10px'});
        resident.overlays.append(label);
      }
    }
    return stage;
  }
  function job(args) {
    let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    return {args,promise,resolve,reject};
  }
  function start(next) {
    activeJob=next;
    void (async()=>{try{next.resolve(await draw(...next.args));}catch(error){next.reject(error);}
      finally{activeJob=null;if(pendingJob){const pending=pendingJob;pendingJob=null;start(pending);}}})();
  }
  const render=(...args)=>{
    if(disposed)return Promise.reject(Error('Compositor disposed'));
    lastRequest=args;renderVersion++;
    // Capture callers keep every frame. Preview keeps at most one pending job;
    // callers of superseded previews settle after the newest pending frame.
    if(capture){const task=chain.catch(()=>{}).then(()=>draw(...args));chain=task;return task;}
    if(activeJob){if(pendingJob)pendingJob.args=args;else pendingJob=job(args);return pendingJob.promise;}
    const next=job(args);start(next);return next.promise;
  };
  const resize=new ResizeObserver(()=>{if(!capture&&!disposed&&lastRequest)void render(...lastRequest).catch(()=>{});});resize.observe(stage);
  return {render,async pick(target,clientX,clientY){
    const version=renderVersion,ticket=++pickVersion;
    const layer=target.closest('[data-clip-id]'),r=layer&&residents.get(layer.dataset.clipId);if(!r)return null;
    const rect=r.root.getBoundingClientRect();
    const node=target.closest('[data-ef-anchor]');
    const result=node ? {anchor:node.dataset.efAnchor,...(node.dataset.efProperty?{property:node.dataset.efProperty}:{})} : await r.instance.pick({x:(clientX-rect.left)*scene.width/rect.width,y:(clientY-rect.top)*scene.height/rect.height,clock:r.clock});
    if(disposed||version!==renderVersion||ticket!==pickVersion||residents.get(layer.dataset.clipId)!==r)return undefined;
    const selection=resolveObjectSelection(scene.controls,result);return selection?{clip:layer.dataset.clipId,...selection}:null;
  },dispose(){
    if(disposal)return disposal;
    disposed=true;renderVersion++;pickVersion++;resize.disconnect();
    if(pendingJob){pendingJob.reject(Error('Compositor disposed'));pendingJob=null;}
    const current=activeJob?.promise;
    disposal=(async()=>{await current?.catch(()=>{});await chain.catch(()=>{});
      for(const r of residents.values()){r.layer.remove();await r.instance.dispose();}residents.clear();})();
    return disposal;
  }};
}
