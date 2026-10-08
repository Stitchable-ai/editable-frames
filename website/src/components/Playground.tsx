import {useState,useRef,useEffect} from 'react';
import studies from '../data/studies.json';
import runtime from '../data/runtime.json';
import {migrateDeviceSession} from '../../vendor/migrate-device.mjs';
const templates=Object.fromEntries(studies.map(s=>[s.id,s]));
// Two frames let React commit and the browser paint before expensive GPU setup.
const paintLoading=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
const storageKey='editableframe-playground-v1-'+runtime.binding.slice(0,12);
export default function Playground({initial='castle',autoTour=false}:{initial?:string;autoTour?:boolean}) {
 const [touring,setTouring]=useState(autoTour),[onScreen,setOnScreen]=useState(false);
 const [slug,setSlug]=useState(initial),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[playing,setPlaying]=useState(false),[time,setTime]=useState(3),[version,refresh]=useState(0),[message,setMessage]=useState('Your ideas. Your browser. No account needed.');
 const tabs=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null),tour=useRef(autoTour),visible=useRef(false),framePending=useRef(false);
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<any>(null),studio=useRef<any>(null),pending=useRef<Promise<void>|null>(null),clock=useRef(3),current=useRef(initial),alive=useRef(true),drawVersion=useRef(0),loadVersion=useRef(0);
 const study=studies.find(s=>s.scene===slug)??studies[0];
 const clip=()=>studio.current?.doc.clips.find((c:any)=>c.template===studies.find(s=>s.scene===current.current)?.id);
 const props=ready&&clip()?clip().nodes[0].props:study.nodes[0].props;
 const schema=Object.values(study.schemas)[0] as Record<string,any>;
 async function draw(t=clock.current){const revision=++drawVersion.current;try{const s=studies.find(s=>s.scene===current.current)!;const values=clip()?.nodes[0].props??s.nodes[0].props;await engine.current?.prepare?.(s.scene,values);if(!alive.current||revision!==drawVersion.current)return;engine.current?.draw(s.scene,t,values)}catch(e){if(revision!==drawVersion.current)return;pauseTour();setMessage('This scene could not load. Try again or choose an illustrated scene.');throw e;}}
 function pauseTour(){tour.current=false;setTouring(false);setPlaying(false)}
 // Editing takes over the tour without interrupting the current clip's playback.
 function interact(event:{target:EventTarget|null}){if(!(event.target instanceof Element)||event.target.closest('[data-tour-control]'))return;tour.current=false;setTouring(false);if(!event.target.closest('[data-playback-control], [data-scene-controls]'))setPlaying(false)}
 function save(drawNow=true){try{localStorage.setItem(storageKey,studio.current.serialize());setMessage('Edits saved in this browser.')}catch{setMessage('Browser storage unavailable. Download your edits to keep them.')}refresh(v=>v+1);if(drawNow)void draw().catch(()=>{});}
 async function start(){if(ready)return;if(pending.current)return pending.current;
  const load=++loadVersion.current;setBusy(true);setMessage('Opening the creative tools…');
  pending.current=(async()=>{try{
   await paintLoading();if(!alive.current)return;
   const load=(name:string)=>{const url=new URL('/runtime/'+name+'.mjs',window.location.origin).href;return import(/* @vite-ignore */url)};
   const [r,c]=await Promise.all([load('scenes'),load('core')]);
   if(!alive.current)return;
   engine.current=r.createRenderer(canvas.current);let saved;
   try{saved=localStorage.getItem(storageKey);if(saved)studio.current=c.Studio.restore(migrateDeviceSession(saved),templates,runtime.binding)}catch{setMessage('A saved session could not be opened. Starting a fresh study.')}
   if(!studio.current){const s=new c.Studio(templates,{binding:runtime.binding});s.doc.clips=studies.map(t=>s.make(t.id));s.check(s.doc);s.base=c.clone(s.doc);studio.current=s;}
   for(const template of studies){if(!studio.current.doc.clips.some((c:any)=>c.template===template.id)){const extra=studio.current.make(template.id);studio.current.doc.clips.push(extra);studio.current.base.clips.push(c.clone(extra));}}studio.current.check(studio.current.doc);
   setReady(true);setMessage(saved?'Your saved edits are ready.':'Ready. Pick a control and make it yours.');await draw();
  }catch(e){if(alive.current&&load===loadVersion.current)setMessage('The creative tools could not load. Check your connection and try again.');throw e;}finally{if(alive.current&&load===loadVersion.current)setBusy(false);pending.current=null}})();
  return pending.current;
 }
 async function change(key:string,value:any){try{await start();studio.current.execute({type:'set',clip:clip().id,anchor:clip().nodes[0].id,property:key,value,label:schema[key].label});
  const swapping=current.current==='device'&&key==='model';save(!swapping);
  if(swapping){const load=++loadVersion.current;setBusy(true);setMessage('Loading your phone model…');try{await paintLoading();if(!alive.current||load!==loadVersion.current)return;await draw();if(load===loadVersion.current)setMessage('Phone swapped. Your app settings and camera are preserved.')}finally{if(alive.current&&load===loadVersion.current)setBusy(false)}}
 }catch{setMessage('That change could not be applied. Your previous edits are still available.')}}
 async function select(id:string,at=3){setPlaying(false);++drawVersion.current;current.current=id;setSlug(id);clock.current=at;setTime(at);
  if(ready){const load=++loadVersion.current;setBusy(true);setMessage(id==='device'?'Loading the studio and your phone model…':'Opening the scene…');try{await paintLoading();if(!alive.current||load!==loadVersion.current)return;await draw();if(load===loadVersion.current)setMessage('Ready. Your edits stay in this browser.')}catch{}finally{if(alive.current&&load===loadVersion.current)setBusy(false)}refresh(v=>v+1)}
 }
 useEffect(()=>{
  alive.current=true;
  let inView=false;
  const syncVisibility=()=>{const active=inView&&!document.hidden;visible.current=active;setOnScreen(active);if(!active)setPlaying(false)};
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;syncVisibility()},{threshold:.12});
  if(stage.current)observer.observe(stage.current);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const respectMotion=()=>{if(reduced.matches)pauseTour()};respectMotion();reduced.addEventListener('change',respectMotion);
  const briefSelected=()=>pauseTour();
  document.addEventListener('visibilitychange',syncVisibility);
  document.addEventListener('editableframes:brief-selected',briefSelected);
  return()=>{alive.current=false;observer.disconnect();reduced.removeEventListener('change',respectMotion);document.removeEventListener('visibilitychange',syncVisibility);document.removeEventListener('editableframes:brief-selected',briefSelected);engine.current?.dispose?.()}
 },[]);
 useEffect(()=>{
  const strip=tabs.current,selected=strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
  if(!strip||!selected)return;
  const item=selected.getBoundingClientRect(),viewport=strip.getBoundingClientRect();
  if(item.left<viewport.left||item.right>viewport.right)strip.scrollBy({left:item.left-viewport.left-strip.clientWidth/2+item.width/2,behavior:'auto'});
 },[slug]);
 useEffect(()=>{
  if(!touring||!onScreen||busy)return;
  if(ready){setPlaying(true);return}
  clock.current=0;setTime(0);
  void start().then(()=>{if(alive.current&&tour.current&&visible.current)setPlaying(true)}).catch(()=>{if(alive.current)pauseTour()});
 },[touring,onScreen,ready,busy]);
 useEffect(()=>{
  if(!playing||!ready||busy||!onScreen)return;
  let raf=0,last=0,advancing=false;
  const tick=(now:number)=>{
   if(advancing)return;
   if(now-last>=1000/24){
    const delta=last?Math.min((now-last)/1000,.15):0;last=now;
    const next=clock.current+delta;
    if(next>=study.duration&&tour.current){
     advancing=true;
     const index=studies.findIndex(s=>s.scene===current.current);
     void select(studies[(index+1)%studies.length].scene,0);
     return;
    }
    clock.current=next%study.duration;setTime(clock.current);
    if(!framePending.current){framePending.current=true;void draw().catch(()=>{}).finally(()=>{framePending.current=false})}
   }
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[playing,ready,slug,busy,onScreen]);
 async function resumeTour(){tour.current=true;setTouring(true);try{await start();if(alive.current&&tour.current&&visible.current)setPlaying(true)}catch{pauseTour()}}

 function download(name:string,blob:Blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
 async function image(){try{await start();await draw();canvas.current?.toBlob(b=>b&&download(`editableframes-${slug}.png`,b))}catch{}}
 async function settings(){try{await start();download(`editableframes-${slug}-edits.json`,new Blob([JSON.stringify({format:'editableframes-playground',version:1,binding:runtime.binding,scene:slug,time:clock.current,values:clip().nodes[0].props},null,2)],{type:'application/json'}))}catch{}}
 async function restore(file?:File){if(!file)return;try{if(file.size>65536)throw Error();const p=JSON.parse(await file.text());if(!['editableframes-playground','editableframe-playground'].includes(p.format)||p.version!==1||p.binding!==runtime.binding||!studies.some(s=>s.scene===p.scene)||!Number.isFinite(p.time)||p.time<0)throw Error();await start();const selected=studies.find(s=>s.scene===p.scene)!;if(p.time>selected.duration)throw Error();const target=studio.current.doc.clips.find((c:any)=>c.template===selected.id);studio.current.execute({type:'batch',label:'Import saved edits',commands:Object.entries(p.values).map(([property,value])=>({type:'set',clip:target.id,anchor:target.nodes[0].id,property,value}))});await select(p.scene);clock.current=p.time;setTime(p.time);save();setMessage('Saved edits imported. Undo restores the previous settings.')}catch{setMessage('This is not a compatible playground edit file. No changes were imported.')}}
 return <div className="playground" id="playground" data-revision={version} data-scene={slug} data-tour={touring?'running':'paused'} onPointerDownCapture={interact} onKeyDownCapture={interact} onFocusCapture={interact}>
  <h2 className="sr-only">Interactive code-generated video playground</h2><noscript><p className="no-script">Enable JavaScript to edit and play scenes. The collection previews and guide are available without it.</p></noscript>
  <div className="workbench-top"><span className="mono"><span className="live-dot"/> THE PLAYGROUND</span><span className="mono">{studies.length} STUDIES · INFINITE LITTLE CHANGES</span></div>
  {autoTour&&<div className="tour-bar"><span>{touring?'A little tour. Touch a control to make it yours.':'Your turn. Edit freely, or keep exploring.'}</span><button type="button" data-tour-control aria-pressed={touring} onClick={()=>touring?pauseTour():void resumeTour()}>{touring?'Ⅱ Pause tour':'▶ Resume tour'}</button></div>}
  <div ref={tabs} className="scene-tabs" aria-label="Choose a scene">{studies.map((s,i)=><button key={s.id} aria-pressed={s.scene===slug} onClick={()=>select(s.scene)}><span>{String(i+1).padStart(2,'0')}</span> {s.scene==='device'?'Product demo':s.scene==='unet'?'U-Net':s.scene.charAt(0).toUpperCase()+s.scene.slice(1)}</button>)}</div>
  <div className="workbench-body"><div className="viewer"><div ref={stage} className="stage" aria-busy={busy}>
   <canvas ref={canvas} width="1280" height="720" aria-label={`Animated preview: ${study.title}`} style={{visibility:ready&&!busy?'visible':'hidden'}}/>
   {(!ready||busy)&&<img className="poster" src={`/demos/${slug}.jpg`} alt={study.detail} width="1280" height="720" fetchPriority="high"/>}
   {!ready&&!busy&&<button className="stage-start" data-playback-control disabled={busy} onClick={async()=>{const selected=current.current;try{await start();if(current.current===selected)setPlaying(true)}catch{}}}>{busy?'Opening…':'▶ Play & make it yours'}</button>}
   {busy&&<div className="stage-loading" role="status" aria-live="polite"><span className="stage-spinner" aria-hidden="true"/><strong>Preparing the scene…</strong><span>Just a moment. You can still choose another scene.</span></div>}
  </div><div className="transport"><button className="play-button" data-playback-control disabled={busy} aria-label={playing?'Pause animation':'Play animation'} onClick={async()=>{const selected=current.current;try{await start();if(current.current===selected)setPlaying(!playing)}catch{}}}>{playing?'Ⅱ':'▶'}</button><input aria-label="Animation time" disabled={busy} type="range" min="0" max={study.duration} step="0.01" value={time} onChange={async e=>{const t=Number(e.target.value);setPlaying(false);clock.current=t;setTime(t);try{await start();await draw(t)}catch{}}}/><span className="mono">{time.toFixed(1)} / {study.duration}s</span></div><div className="scene-caption"><div><span className="eyebrow">{study.genre}</span><h3>{study.title}</h3></div><span className="source-tag">MADE OF CODE ↗</span></div><p className="scene-description">{study.detail}</p><div className="editor-actions"><button disabled={busy} onClick={image}>↓ Save frame</button><button onClick={settings}>↓ Save edits</button><label className="file-button">↑ Open edits<input type="file" accept="application/json,.json" onChange={e=>{restore(e.target.files?.[0]);e.target.value=''}}/></label></div></div>
  <aside className="inspector" data-scene-controls aria-label="Scene editing controls"><div className="inspector-heading"><div><span className="eyebrow">YOUR ART DIRECTION</span><h3>A little more you.</h3></div><span className="asterisk">✳</span></div>
   {Object.entries(schema).map(([key,field])=><label className="control" key={slug+key}><span>{field.label}<output>{field.type==='number'?Number((props as any)[key]).toFixed(field.integer?0:2):field.type==='color'?String((props as any)[key]).toUpperCase():''}</output></span>{field.type==='number'?<input aria-label={field.label} type="range" min={field.min} max={field.max} step={field.step??.01} value={(props as any)[key]} disabled={busy} onChange={e=>change(key,Number(e.target.value))}/>:field.type==='enum'?<select aria-label={field.label} value={(props as any)[key]} disabled={busy} onChange={e=>change(key,e.target.value)}>{field.values.map((value:string)=><option key={value} value={value}>{field.labels?.[value]??value}</option>)}</select>:field.type==='boolean'?<input aria-label={field.label} type="checkbox" checked={Boolean((props as any)[key])} disabled={busy} onChange={e=>change(key,e.target.checked)}/>:<input aria-label={field.label} type={field.type==='color'?'color':'text'} maxLength={field.maxLength} value={(props as any)[key]} disabled={busy} onChange={e=>change(key,e.target.value)}/>}</label>)}
   <div className="history-actions"><button disabled={!ready||!studio.current?.canUndo} onClick={()=>{studio.current.undo();save()}}>↶ Undo</button><button disabled={!ready||!studio.current?.canRedo} onClick={()=>{studio.current.redo();save()}}>↷ Redo</button><button disabled={!ready} onClick={()=>{studio.current.execute({type:'batch',label:'Reset scene',commands:Object.entries(study.nodes[0].props).map(([property,value])=>({type:'set',clip:clip().id,anchor:clip().nodes[0].id,property,value}))});save()}}>Reset</button></div>
   <p role="status" className="editor-status">{message}</p><p className="inspector-footnote">These controls change the actual scene.<br/>Your edits stay on this device.</p>
  </aside></div>
 </div>
}
