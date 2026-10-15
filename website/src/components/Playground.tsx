import {useState,useRef,useEffect} from 'react';
import studies from '../data/studies.json';
import runtime from '../data/runtime.json';
import type {StudyPosters} from '../data/posters';
import {migrateDeviceSession} from '../../vendor/migrate-device.mjs';
const templates=Object.fromEntries(studies.map(s=>[s.id,s]));
// Two frames let React commit and the browser paint before expensive GPU setup.
const paintLoading=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
const storageKey='editableframe-playground-v1-'+runtime.binding.slice(0,12);
type SceneProgress={phase:'renderer'|'downloading'|'preparing';loaded:number;total:number|null;percent:number|null};
const downloadSize=(bytes:number)=>(bytes/1000000).toFixed(1)+' MB';
const castlePalettes=[
 {id:'sand',name:'Sand',stone:'#d0ba98',roof:'#5b6873'},
 {id:'blue',name:'Blue',stone:'#a9c6d6',roof:'#3566a2'},
 {id:'rose',name:'Rose',stone:'#d6b1a9',roof:'#794b65'},
];
export default function Playground({initial='castle',autoTour=false,introDemo=false,posters={}}:{initial?:string;autoTour?:boolean;introDemo?:boolean;posters?:StudyPosters}) {
 const [touring,setTouring]=useState(false),[onScreen,setOnScreen]=useState(false),[demoing,setDemoing]=useState(false),[demoAvailable,setDemoAvailable]=useState(false),[demoPlayed,setDemoPlayed]=useState(false);
 const [slug,setSlug]=useState(initial),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[playing,setPlaying]=useState(false),[time,setTime]=useState(3),[version,refresh]=useState(0),[message,setMessage]=useState('Your ideas. Your browser. No account needed.');
 const [progress,setProgress]=useState<SceneProgress|null>(null),[loadError,setLoadError]=useState<string|null>(null);
 const tabs=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null),tour=useRef(false),visible=useRef(false),framePending=useRef(false);
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<any>(null),studio=useRef<any>(null),pending=useRef<Promise<void>|null>(null),clock=useRef(3),current=useRef(initial),alive=useRef(true),drawVersion=useRef(0),loadVersion=useRef(0),selectionVersion=useRef(0);
 const initialized=useRef(false),introPending=useRef(false),demoPreview=useRef<Record<string,any>|null>(null),demoController=useRef<AbortController|null>(null),demoTour=useRef<boolean|null>(null),requestDemo=useRef<(()=>void)|null>(null);
 const study=studies.find(s=>s.scene===slug)??studies[0];
 const clip=()=>studio.current?.doc.clips.find((c:any)=>c.template===studies.find(s=>s.scene===current.current)?.id);
 const savedProps=ready&&clip()?clip().nodes[0].props:study.nodes[0].props;
 const props=slug==='castle'&&demoPreview.current?{...savedProps,...demoPreview.current}:savedProps;
 const schema=Object.values(study.schemas)[0] as Record<string,any>;
 async function draw(t=clock.current){const revision=++drawVersion.current;try{const s=studies.find(s=>s.scene===current.current)!;const actual=clip()?.nodes[0].props??s.nodes[0].props;const values=current.current==='castle'&&demoPreview.current?{...actual,...demoPreview.current}:actual;await engine.current?.prepare?.(s.scene,values,{assetSizes:runtime.downloads,isCurrent:()=>alive.current&&revision===drawVersion.current,onProgress:(next:SceneProgress)=>{if(alive.current&&revision===drawVersion.current)setProgress(next)}});if(!alive.current||revision!==drawVersion.current)return;engine.current?.draw(s.scene,t,values)}catch(e){if(!alive.current||revision!==drawVersion.current)return;pauseTour();setLoadError('We couldn’t open this scene. Check your connection and retry, or choose another clip.');setMessage('This scene could not load. Try again or choose an illustrated scene.');throw e;}}
 function pauseTour(){tour.current=false;setTouring(false);setPlaying(false)}
 function cancelEditDemo(keepTour=false){
  if(keepTour&&demoController.current&&demoTour.current!==null){tour.current=demoTour.current;setTouring(demoTour.current)}
  demoController.current?.abort();demoPreview.current=null;
 }
 // Choosing a clip cancels the pointer, while retaining an active playback tour.
 function interact(event:{target:EventTarget|null}){
  const target=event.target instanceof Element?event.target:null;
  if(target?.closest('[data-edit-demo-control]'))return;
  const switching=Boolean(target?.closest('[data-scene-switch]'));cancelEditDemo(switching);
  if(!target||switching||target.closest('[data-tour-control]'))return;
  tour.current=false;setTouring(false);if(!target.closest('[data-playback-control], [data-scene-controls]'))setPlaying(false);
 }
 function save(drawNow=true){try{localStorage.setItem(storageKey,studio.current.serialize());setMessage('Edits saved in this browser.')}catch{setMessage('Browser storage unavailable. Download your edits to keep them.')}refresh(v=>v+1);if(drawNow)void draw().catch(()=>{});}
 async function start(){if(initialized.current)return;if(pending.current)return pending.current;
  const load=++loadVersion.current;setBusy(true);setProgress(null);setLoadError(null);setMessage('Opening the creative tools…');
  pending.current=(async()=>{try{
   await paintLoading();if(!alive.current)return;
   const load=(name:string)=>{const url=new URL('/runtime/'+name+'.mjs',window.location.origin).href;return import(/* @vite-ignore */url)};
   const [r,c]=await Promise.all([load('scenes'),load('core')]);
   if(!alive.current)return;
   engine.current=r.createRenderer(canvas.current);let saved;
   try{saved=localStorage.getItem(storageKey);if(saved)studio.current=c.Studio.restore(migrateDeviceSession(saved),templates,runtime.binding)}catch{setMessage('A saved session could not be opened. Starting a fresh study.')}
   if(!studio.current){const s=new c.Studio(templates,{binding:runtime.binding});s.doc.clips=studies.map(t=>s.make(t.id));s.check(s.doc);s.base=c.clone(s.doc);studio.current=s;}
   for(const template of studies){if(!studio.current.doc.clips.some((c:any)=>c.template===template.id)){const extra=studio.current.make(template.id);studio.current.doc.clips.push(extra);studio.current.base.clips.push(c.clone(extra));}}studio.current.check(studio.current.doc);
   initialized.current=true;setReady(true);setMessage(saved?'Your saved edits are ready.':'Ready. Pick a control and make it yours.');await draw();
  }catch(e){if(alive.current&&load===loadVersion.current){setLoadError('We couldn’t open this scene. Check your connection and retry, or choose another clip.');setMessage('The creative tools could not load. Check your connection and try again.')}throw e;}finally{if(alive.current&&load===loadVersion.current)setBusy(false);pending.current=null}})();
  return pending.current;
 }
 async function change(key:string,value:any){try{await start();studio.current.execute({type:'set',clip:clip().id,anchor:clip().nodes[0].id,property:key,value,label:schema[key].label});
  const swapping=current.current==='device'&&key==='model';save(!swapping);
  if(swapping){const load=++loadVersion.current;setBusy(true);setProgress(null);setLoadError(null);setMessage('Loading your phone model…');try{await paintLoading();if(!alive.current||load!==loadVersion.current)return;await draw();if(load===loadVersion.current)setMessage('Phone swapped. Your app settings and camera are preserved.')}finally{if(alive.current&&load===loadVersion.current)setBusy(false)}}
 }catch{setMessage('That change could not be applied. Your previous edits are still available.')}}
 function applyCastlePalette(palette:typeof castlePalettes[number],persist=true){
  if(current.current!=='castle'||!studio.current)return;
  const target=clip();studio.current.execute({type:'batch',label:persist?'Change castle colors':'Demo: change castle colors',commands:['stone','roof'].map(property=>({type:'set',clip:target.id,anchor:target.nodes[0].id,property,value:palette[property as 'stone'|'roof']}))});
  if(persist)save();else{refresh(v=>v+1);void draw().catch(()=>{})}
 }
 async function select(id:string,at=3){
  const selection=++selectionVersion.current;setPlaying(false);++drawVersion.current;setLoadError(null);setProgress(null);current.current=id;setSlug(id);clock.current=at;setTime(at);
  if(initialized.current){
   const load=++loadVersion.current;setBusy(true);setMessage(id==='device'?'Loading the studio and your phone model…':'Opening the scene…');
   try{
    await paintLoading();if(!alive.current||load!==loadVersion.current||selection!==selectionVersion.current)return false;
    await draw();if(load!==loadVersion.current||selection!==selectionVersion.current)return false;
    setMessage('Ready. Your edits stay in this browser.');
    if(tour.current&&visible.current)setPlaying(true);
   }catch{return false}finally{if(alive.current&&load===loadVersion.current)setBusy(false)}
   refresh(v=>v+1);
  }
  return alive.current&&selection===selectionVersion.current;
 }
 async function playStudy(id:string){
  const selected=select(id,0),selection=selectionVersion.current;
  try{if(!await selected)return;await start();if(alive.current&&selection===selectionVersion.current&&current.current===id)setPlaying(true)}catch{}
 }
 useEffect(()=>{
  alive.current=true;
  let inView=false;
  // Visibility suspends drawing without discarding the visitor's playback intent.
  const syncVisibility=()=>{const active=inView&&!document.hidden;visible.current=active;setOnScreen(active)};
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;syncVisibility()},{threshold:.12});
  if(stage.current)observer.observe(stage.current);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact=window.matchMedia('(max-width: 700px)');
  const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
  // Keep mobile discovery light; an explicit Play or Start tour still loads the full editor.
  if(autoTour&&!reduced.matches&&!compact.matches&&!saveData){tour.current=true;setTouring(true)}
  const respectMotion=()=>{if(reduced.matches||compact.matches)pauseTour()};respectMotion();reduced.addEventListener('change',respectMotion);compact.addEventListener('change',respectMotion);
  const briefSelected=()=>pauseTour();
  document.addEventListener('visibilitychange',syncVisibility);
  document.addEventListener('editableframes:brief-selected',briefSelected);
  return()=>{alive.current=false;observer.disconnect();reduced.removeEventListener('change',respectMotion);compact.removeEventListener('change',respectMotion);document.removeEventListener('visibilitychange',syncVisibility);document.removeEventListener('editableframes:brief-selected',briefSelected);engine.current?.dispose?.()}
 },[]);
 useEffect(()=>{
  if(!introDemo)return;
  const root=document.getElementById('playground'),origin=document.querySelector<HTMLElement>('[data-edit-demo-origin]');
  if(!root||!origin)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
  let consumed=false,touched=false,disposed=false,timer=0,animating=false;
  const targets=()=>({palette:root.querySelector<HTMLElement>('[data-castle-palette="blue"]'),slider:root.querySelector<HTMLInputElement>('[data-property="height"] input[type="range"]'),treeSlider:root.querySelector<HTMLInputElement>('[data-property="trees"] input[type="range"]')});
  const inView=(element:HTMLElement)=>{const r=element.getBoundingClientRect();return r.top>20&&r.bottom<window.innerHeight-24};
  const takeOver=(event:Event)=>{
   const target=event.target;
   // Clicking navigation or using a key to scroll must not silently dismiss the intro.
   if(!(target instanceof Element)||!root.contains(target)||target.closest('[data-edit-demo-control]'))return;
   if(event.type==='keydown'&&!target.closest('button,input,select,textarea,a,[contenteditable]'))return;
   // Do not rerender a controlled input before React reads its new native value.
   touched=true;introPending.current=false;cancelEditDemo(Boolean(target.closest('[data-scene-switch]')));origin.dataset.editDemo='complete';
  };
  const syncMotion=()=>{setDemoAvailable(!motion.matches);if(motion.matches){introPending.current=false;demoController.current?.abort();demoPreview.current=null;origin.dataset.editDemo='complete'}};
  syncMotion();
  if(!motion.matches&&!saveData){origin.dataset.editDemo='ready';introPending.current=true}
  async function begin(manual=false){
   if(disposed||demoController.current||document.hidden||motion.matches)return;
   if(!manual){
    if(consumed||touched||saveData||window.scrollY<8)return;
    const {palette,slider,treeSlider}=targets();if(!palette||!slider||!treeSlider||!inView(palette)||!inView(slider)||!inView(treeSlider))return;
   }
   consumed=true;introPending.current=true;const controller=new AbortController();demoController.current=controller;
   const wasTouring=tour.current;demoTour.current=wasTouring;tour.current=false;setTouring(false);setDemoing(true);setDemoPlayed(true);origin!.dataset.editDemo='running';
   try{
    await select('castle',0);await start();await paintLoading();if(controller.signal.aborted||disposed)return;
    // Returning visitors can watch without changing their document, history or saved bytes.
    let hasSaved=true;try{hasSaved=localStorage.getItem(storageKey)!==null}catch{}
    const keepEdits=!manual&&!hasSaved;
    const palette=castlePalettes[(clip().nodes[0].props.stone===castlePalettes[1].stone)?2:1];
    const active={palette:root!.querySelector<HTMLElement>(`[data-castle-palette="${palette.id}"]`),slider:targets().slider,treeSlider:targets().treeSlider};
    if(!active.palette||!active.slider||!active.treeSlider)return;
    if(manual){
     const bottom=Math.max(active.palette.getBoundingClientRect().bottom,active.slider.getBoundingClientRect().bottom,active.treeSlider.getBoundingClientRect().bottom);
     window.scrollTo({top:Math.max(0,window.scrollY+bottom-window.innerHeight+120),behavior:'instant'});
     await paintLoading();
    }
    if(controller.signal.aborted||disposed)return;
    demoPreview.current={};await draw();setPlaying(true);animating=true;
    setMessage('A quick edit: change the colors, raise the towers, then add more trees.');
    const {runCastleEditDemo}=await import('../lib/edit-demo');
    let finalHeight=Number(active.slider.value),finalTrees=Number(active.treeSlider.value);
    await runCastleEditDemo({origin:origin!,palette:active.palette,slider:active.slider,treeSlider:active.treeSlider,signal:controller.signal,
     onPalette:()=>{if(controller.signal.aborted)return;demoPreview.current={...demoPreview.current,stone:palette.stone,roof:palette.roof};refresh(v=>v+1);void draw().catch(()=>{})},
     onPreviewHeight:value=>{if(controller.signal.aborted||value===null||demoPreview.current?.height===value)return;demoPreview.current={...demoPreview.current,height:value};refresh(v=>v+1);void draw().catch(()=>{})},
     onCommitHeight:value=>{finalHeight=value},
     onPreviewTrees:value=>{if(controller.signal.aborted||value===null||demoPreview.current?.trees===value)return;demoPreview.current={...demoPreview.current,trees:value};refresh(v=>v+1);void draw().catch(()=>{})},
     onCommitTrees:value=>{finalTrees=value},
    });
    if(!controller.signal.aborted&&!disposed){
     if(keepEdits){applyCastlePalette(palette,false);const target=clip();studio.current.execute({type:'set',clip:target.id,anchor:target.nodes[0].id,property:'height',value:finalHeight,label:'Demo: raise castle towers'});studio.current.execute({type:'set',clip:target.id,anchor:target.nodes[0].id,property:'trees',value:finalTrees,label:'Demo: add more trees'})}
     tour.current=wasTouring;setTouring(wasTouring);setMessage(keepEdits?'Your turn. Try another look, or undo the demo edits.':'Your turn. Your own edits are exactly as you left them.');
    }
   }catch{if(!controller.signal.aborted&&!disposed)setMessage('Your turn. Pick a control and make this clip yours.')}
   finally{animating=false;introPending.current=false;demoPreview.current=null;if(demoController.current===controller){demoController.current=null;demoTour.current=null}if(!disposed){setDemoing(false);refresh(v=>v+1);origin!.dataset.editDemo='complete';void draw().catch(()=>{})}}
  }
  const schedule=()=>{
   clearTimeout(timer);
   if(demoController.current&&animating){const {palette,slider,treeSlider}=targets();if(!palette||!slider||!treeSlider||!inView(palette)||!inView(slider)||!inView(treeSlider))demoController.current.abort()}
   if(!consumed&&!touched&&!motion.matches&&!saveData)timer=window.setTimeout(()=>void begin(),160);
  };
  requestDemo.current=()=>{clearTimeout(timer);void begin(true)};
  const visibility=()=>{if(document.hidden)demoController.current?.abort();else schedule()};
  // Also retry after hydration, fonts and responsive layout changes, not just scrolling.
  const layout=new ResizeObserver(schedule);layout.observe(root);
  void document.fonts.ready.then(()=>{if(!disposed)schedule()});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  const takeoverEvents=['pointerdown','keydown','click','input','change'];
  for(const event of takeoverEvents)document.addEventListener(event,takeOver,true);document.addEventListener('visibilitychange',visibility);
  motion.addEventListener('change',syncMotion);schedule();
  return()=>{disposed=true;requestDemo.current=null;introPending.current=false;clearTimeout(timer);layout.disconnect();demoController.current?.abort();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);for(const event of takeoverEvents)document.removeEventListener(event,takeOver,true);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',syncMotion)};
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
    if(next>=study.duration&&tour.current&&!introPending.current){
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
 async function resumeClip(){const selected=current.current;try{await start();if(alive.current&&current.current===selected)setPlaying(true)}catch{}}

 function download(name:string,blob:Blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
 async function image(){try{await start();await draw();canvas.current?.toBlob(b=>b&&download(`editableframes-${slug}.png`,b))}catch{}}
 async function settings(){try{await start();download(`editableframes-${slug}-edits.json`,new Blob([JSON.stringify({format:'editableframes-playground',version:1,binding:runtime.binding,scene:slug,time:clock.current,values:clip().nodes[0].props},null,2)],{type:'application/json'}))}catch{}}
 async function restore(file?:File){if(!file)return;try{if(file.size>65536)throw Error();const p=JSON.parse(await file.text());if(!['editableframes-playground','editableframe-playground'].includes(p.format)||p.version!==1||p.binding!==runtime.binding||!studies.some(s=>s.scene===p.scene)||!Number.isFinite(p.time)||p.time<0)throw Error();await start();const selected=studies.find(s=>s.scene===p.scene)!;if(p.time>selected.duration)throw Error();const target=studio.current.doc.clips.find((c:any)=>c.template===selected.id);studio.current.execute({type:'batch',label:'Import saved edits',commands:Object.entries(p.values).map(([property,value])=>({type:'set',clip:target.id,anchor:target.nodes[0].id,property,value}))});await select(p.scene);clock.current=p.time;setTime(p.time);save();setMessage('Saved edits imported. Undo restores the previous settings.')}catch{setMessage('This is not a compatible playground edit file. No changes were imported.')}}
 return <div className="playground" id="playground" data-revision={version} data-scene={slug} data-edit-demo={demoing?'running':'idle'} data-tour={touring?'running':'paused'} onPointerDownCapture={interact} onKeyDownCapture={interact} onFocusCapture={interact} onClickCapture={interact} onInputCapture={interact} onChangeCapture={interact}>
  <h2 className="sr-only">Interactive code-generated video playground</h2><noscript><p className="no-script">Enable JavaScript to edit and play scenes. The collection previews and guide are available without it.</p></noscript>
  <div className="workbench-top"><span className="mono"><span className="live-dot"/> THE PLAYGROUND</span><span className="mono">{studies.length} STUDIES · INFINITE LITTLE CHANGES</span></div>
  {autoTour&&<div className="tour-bar"><span>{demoing?'A quick edit. Then the controls are yours.':touring?'A little tour. Touch a control to make it yours.':'Your turn. Edit freely, or keep exploring.'}</span><div className="tour-actions">{introDemo&&demoAvailable&&<button type="button" data-edit-demo-control disabled={demoing} onClick={()=>requestDemo.current?.()}>{demoing?'Editing…':demoPlayed?'↻ Replay edit demo':'↗ Watch edit demo'}</button>}<button type="button" data-tour-control aria-pressed={touring} onClick={()=>touring?pauseTour():void resumeTour()}>{touring?'Ⅱ Pause tour':ready?'▶ Resume tour':'▶ Start tour'}</button></div></div>}
  <div ref={tabs} className="scene-tabs" aria-label="Choose a scene">{studies.map((s,i)=><button key={s.id} data-scene-switch={s.scene} aria-pressed={s.scene===slug} onClick={()=>void playStudy(s.scene)}><span>{String(i+1).padStart(2,'0')}</span> {s.scene==='device'?'Product demo':s.scene==='unet'?'U-Net':s.scene.charAt(0).toUpperCase()+s.scene.slice(1)}</button>)}</div>
  <div className="workbench-body"><div className="viewer"><div ref={stage} className="stage" aria-busy={busy}>
   <canvas ref={canvas} width="1280" height="720" aria-label={`Animated preview: ${study.title}`} style={{visibility:ready&&!busy&&!loadError?'visible':'hidden'}}/>
   {(!ready||busy||loadError)&&<img className="poster" src={posters[slug]?.src??`/demos/${slug}.jpg`} srcSet={posters[slug]?.srcSet} sizes="(max-width: 700px) 90vw, (max-width: 1000px) 65vw, 72vw" alt={study.detail} width="1280" height="720" fetchPriority="high"/>}
   {!playing&&!busy&&!loadError&&<button type="button" className="stage-play" data-playback-control aria-label={ready?'Resume animation':'Play preview'} onClick={()=>void resumeClip()}><span className="stage-play-icon" aria-hidden="true"><svg width="34" height="38" viewBox="0 0 34 38" fill="currentColor"><path d="M8 5 29 19 8 33V5Z"/></svg></span><span className="stage-play-label">{ready?'Resume clip':'Play & make it yours'}</span></button>}
   {busy&&<div className="stage-loading" role="status" aria-live="polite"><span className="stage-spinner" aria-hidden="true"/><strong>{progress?.phase==='downloading'?'Downloading scene assets…':progress?.phase==='preparing'?'Downloads complete. Preparing the scene…':progress?.phase==='renderer'?'Loading the 3D renderer…':'Opening the scene…'}</strong><progress className="scene-download-progress" aria-label="Scene download progress" max={progress?.total??1} value={progress?.total?Math.min(progress.loaded,progress.total):undefined}/><span className="scene-download-amount">{progress?.percent!==null&&progress?.percent!==undefined?`${progress.percent}% · ${downloadSize(progress.loaded)} of ${downloadSize(progress.total!)}`:progress?.loaded?`${downloadSize(progress.loaded)} downloaded`:'Connecting…'}</span><span>Playback starts when ready. You can still choose another clip.</span></div>}
   {!busy&&loadError&&<div className="stage-loading stage-load-error" role="alert"><strong>This scene couldn’t load.</strong><span>{loadError}</span><button type="button" data-playback-control onClick={()=>void playStudy(current.current)}>Retry loading</button></div>}
  </div><div className="transport"><button className="play-button" data-playback-control disabled={busy} aria-label={playing?'Pause animation':'Play animation'} onClick={async()=>{const selected=current.current;try{await start();if(current.current===selected)setPlaying(!playing)}catch{}}}>{playing?'Ⅱ':'▶'}</button><input aria-label="Animation time" disabled={busy} type="range" min="0" max={study.duration} step="0.01" value={time} onChange={async e=>{const t=Number(e.target.value);setPlaying(false);clock.current=t;setTime(t);try{await start();await draw(t)}catch{}}}/><span className="mono">{time.toFixed(1)} / {study.duration}s</span></div><div className="scene-caption"><div><span className="eyebrow">{study.genre}</span><h3>{study.title}</h3></div><span className="source-tag">MADE OF CODE ↗</span></div><p className="scene-description">{study.detail}</p><div className="editor-actions"><button disabled={busy} onClick={image}>↓ Save frame</button><button onClick={settings}>↓ Save edits</button><label className="file-button">↑ Open edits<input type="file" accept="application/json,.json" onChange={e=>{restore(e.target.files?.[0]);e.target.value=''}}/></label></div></div>
  <aside className="inspector" data-scene-controls aria-label="Scene editing controls"><div className="inspector-heading"><div><span className="eyebrow">{demoing?'A QUICK EDIT DEMO':'YOUR ART DIRECTION'}</span><h3>A little more you.</h3></div><span className="asterisk">✳</span></div>
   {slug==='castle'&&<div className="castle-palettes"><span>Try a palette</span><div>{castlePalettes.map(palette=><button type="button" key={palette.id} data-castle-palette={palette.id} aria-label={`Apply ${palette.name.toLowerCase()} castle colors`} aria-pressed={(props as any).stone===palette.stone&&(props as any).roof===palette.roof} disabled={busy} onClick={async()=>{try{await start();applyCastlePalette(palette)}catch{}}}><span aria-hidden="true" style={{background:`linear-gradient(135deg,${palette.stone} 50%,${palette.roof} 50%)`}}/>{palette.name}</button>)}</div></div>}
   {Object.entries(schema).map(([key,field])=><label className="control" data-property={key} key={slug+key}><span>{field.label}<output>{field.type==='number'?Number((props as any)[key]).toFixed(field.integer?0:2):field.type==='color'?String((props as any)[key]).toUpperCase():''}</output></span>{field.type==='number'?<input aria-label={field.label} type="range" min={field.min} max={field.max} step={field.step??.01} value={(props as any)[key]} disabled={busy} onChange={e=>change(key,Number(e.target.value))}/>:field.type==='enum'?<select aria-label={field.label} value={(props as any)[key]} disabled={busy} onChange={e=>change(key,e.target.value)}>{field.values.map((value:string)=><option key={value} value={value}>{field.labels?.[value]??value}</option>)}</select>:field.type==='boolean'?<input aria-label={field.label} type="checkbox" checked={Boolean((props as any)[key])} disabled={busy} onChange={e=>change(key,e.target.checked)}/>:<input aria-label={field.label} type={field.type==='color'?'color':'text'} maxLength={field.maxLength} value={(props as any)[key]} disabled={busy} onChange={e=>change(key,e.target.value)}/>}</label>)}
   <div className="history-actions"><button disabled={!ready||!studio.current?.canUndo} onClick={()=>{studio.current.undo();save()}}>↶ Undo</button><button disabled={!ready||!studio.current?.canRedo} onClick={()=>{studio.current.redo();save()}}>↷ Redo</button><button disabled={!ready} onClick={()=>{studio.current.execute({type:'batch',label:'Reset scene',commands:Object.entries(study.nodes[0].props).map(([property,value])=>({type:'set',clip:clip().id,anchor:clip().nodes[0].id,property,value}))});save()}}>Reset</button></div>
   <p role="status" className="editor-status">{message}</p><p className="inspector-footnote">These controls change the actual scene.<br/>Your edits stay on this device.</p>
  </aside></div>
 </div>
}
