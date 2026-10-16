import {useEffect,useId,useImperativeHandle,useRef,useState,type Ref} from 'react';
import '../styles/studio-demo.css';

type ObjectId='robot'|'sprout'|'friend';
type AnnotationTarget=ObjectId|'gardeners';
type Region={x:number;y:number;width:number;height:number};
type Model={body:string;leaf:string;friendColor:string;scale:number;sproutScale:number;friendScale:number;friend:number;watering:number};
type Note={object:AnnotationTarget;text:string;number:number;response?:string;region?:Region;sourceTime?:number};
type Phase='idle'|'properties'|'annotate'|'comment'|'chat'|'editing'|'annotate-water'|'comment-water'|'chat-water'|'watering-edit'|'playback'|'complete';
const original:Model={body:'#d77847',leaf:'#648963',friendColor:'#6d86cf',scale:1,sproutScale:1,friendScale:1,friend:0,watering:0};
const friendComment='Add a blue friend.';
const waterComment='Hold hands and happily sprinkle water on the flower.';
const names:Record<AnnotationTarget,string>={robot:'Little gardener',sprout:'Sunflower',friend:'Blue friend',gardeners:'Both gardeners'};
const swatches=[['clay','#d77847'],['mint','#6eaa97'],['blue','#6d86cf']] as const;
const defaults={bounce:1,fps:12,grain:0,overline:'A SMALL ACT OF CARE',caption1:'A small thing.',caption2:'A little care.',caption3:'A whole new beginning.',petalColor:'#edbf5b',petalHighlight:'#f4cf73',robotPosition:[-180,0,0],robotVisible:true,wateringVisible:false};

function Icon({name,size=16}:{name:string;size?:number}){
 const paths:Record<string,string>={chat:'M4 3h16v13H9l-5 4V3Z',film:'M3 4h18v16H3zM7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4',home:'m3 11 9-8 9 8M6 10v11h12V10M10 21v-7h4v7',folder:'M3 6h7l2 3h9v12H3V6Z',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',arrow:'M12 20V4m-6 6 6-6 6 6',undo:'M8 4 3 9l5 5M4 9h10a6 6 0 1 1 0 12',check:'m5 12 4 4L19 6',plus:'M12 4v16M4 12h16',play:'m8 4 12 8-12 8V4Z',pause:'M8 4v16M16 4v16',region:'M4 4h16v16H4zM8 2v4M16 2v4M8 18v4M16 18v4',pin:'M12 22s7-8 7-14a7 7 0 1 0-14 0c0 6 7 14 7 14ZM12 6v4',restart:'M5 4v16M20 4 8 12l12 8V4Z',sliders:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6'};
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]??paths.spark}/></svg>;
}

export type StudioWalkthroughControls={pauseWalkthrough:()=>void;replayWalkthrough:()=>void};
type StudioAssets={rendererUrl?:string;posterUrl?:string;logoUrl?:string;controlsRef?:Ref<StudioWalkthroughControls>};
export default function StitchableStudio({rendererUrl='/runtime/studio-paper.mjs',posterUrl='/demos/paper.jpg',logoUrl='/tool-logos/stitchable.svg',controlsRef}:StudioAssets={}){
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<any>(null),loading=useRef<Promise<void>|null>(null),controller=useRef<AbortController|null>(null),runVersion=useRef(0),alive=useRef(true);
 const modelRef=useRef<Model>({...original}),preview=useRef<Partial<Model>|null>(null),history=useRef<Model[]>([{...original}]),historyIndex=useRef(0),friendProgress=useRef(0),wateringProgress=useRef(0),wateringPreview=useRef(false),previewRange=useRef<[number,number]>([11.8,14.2]),fullPlayback=useRef(false),noteSequence=useRef(0),sceneLabel=useRef<HTMLSpanElement>(null),sourceTime=useRef(12),clockLabel=useRef<HTMLSpanElement>(null),messages=useRef<HTMLDivElement>(null),playhead=useRef<HTMLSpanElement>(null);
 const [model,setModel]=useState<Model>({...original}),[selected,setSelected]=useState<ObjectId|null>(null),[mode,setMode]=useState<'select'|'annotate'>('select'),[phase,setPhase]=useState<Phase>('idle'),[running,setRunning]=useState(false),[ready,setReady]=useState(false),[active,setActive]=useState(false),[playing,setPlaying]=useState(true),[reduced,setReduced]=useState(false),[fromBeginning,setFromBeginning]=useState(false),[revision,setRevision]=useState(0);
 const [draft,setDraft]=useState<AnnotationTarget|null>(null),[region,setRegion]=useState<Region|null>(null),[regionDragging,setRegionDragging]=useState(false),[noteText,setNoteText]=useState(''),[note,setNote]=useState<Note|null>(null),[chatText,setChatText]=useState(''),[sent,setSent]=useState<Note[]>([]),[status,setStatus]=useState('Click the character to explore its controls.');
 const regionRef=useRef<Region|null>(null),regionTime=useRef(0),drag=useRef<{x:number;y:number;pointer:number;moved:boolean}|null>(null),ignoreObjectClick=useRef(false);
 const currentSelected=useRef<ObjectId|null>(null),noteRef=useRef<Note|null>(null);
 const chatHistoryId=useId(),historyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [chatHistoryVisible,setChatHistoryVisible]=useState(false),[chatFocused,setChatFocused]=useState(false);
 function hideChatHistory(){if(historyTimer.current)clearTimeout(historyTimer.current);historyTimer.current=null;setChatHistoryVisible(false)}
 function revealChatHistory(){
  if(!root.current||getComputedStyle(root.current).getPropertyValue('--studio-floating-chat').trim()!=='1')return;
  if(historyTimer.current)clearTimeout(historyTimer.current);
  setChatHistoryVisible(true);historyTimer.current=setTimeout(()=>{historyTimer.current=null;setChatHistoryVisible(false)},1800);
 }
 function commit(patch:Partial<Model>){
  const next={...modelRef.current,...patch};
  if(![next.body,next.leaf,next.friendColor].every(value=>/^#[\da-f]{6}$/i.test(value))||![next.scale,next.sproutScale,next.friendScale].every(value=>Number.isFinite(value)&&value>=.75&&value<=1.25)||![0,1].includes(next.friend)||![0,1].includes(next.watering))return;
  if(JSON.stringify(next)===JSON.stringify(modelRef.current))return;
  history.current=history.current.slice(0,historyIndex.current+1);history.current.push(next);historyIndex.current++;modelRef.current=next;setModel(next);setRevision(v=>v+1);
 }
 function stop(){
  const wasRunning=Boolean(controller.current&&!controller.current.signal.aborted);
  runVersion.current++;
  if(controller.current){if(!controller.current.signal.aborted)setStatus('Your turn. The walkthrough is paused; your edits stay here.');controller.current.abort();setPhase(value=>['editing','watering-edit'].includes(value)?'chat':value)}
  preview.current=null;friendProgress.current=modelRef.current.friend;wateringProgress.current=modelRef.current.watering;wateringPreview.current=false;
  if(!modelRef.current.watering&&sourceTime.current>=16){previewRange.current=[11.8,14.2];sourceTime.current=12}
  setRunning(false);
  if(drag.current){drag.current=null;setRegionDragging(false)}
  if(wasRunning&&regionDragging){regionRef.current=null;setRegion(null);setRegionDragging(false)}
 }
 function takeOver(event:{target:EventTarget|null}){if(event.target instanceof Element&&event.target.closest('[data-studio-replay]'))return;stop()}
 function choose(id:ObjectId){if(ignoreObjectClick.current)return;currentSelected.current=id;setSelected(id);if(mode==='annotate'){regionRef.current=null;setRegion(null);setDraft(id);setNoteText('');setStatus(`Comment on ${names[id].toLowerCase()}.`)}else setStatus(`${names[id]} selected. Change its color or size.`)}
 function showRegion(box:Region){regionRef.current=box;setRegion(box)}
 function openRegion(){if(!regionRef.current)return;regionTime.current=sourceTime.current;setRegionDragging(false);setDraft('gardeners');setNoteText('');setStatus('Both gardeners are selected. Add one note for this region.')}
 function regionPoint(event:React.PointerEvent<HTMLDivElement>){const r=event.currentTarget.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))}}
 function regionDown(event:React.PointerEvent<HTMLDivElement>){if(mode!=='annotate'||!model.friend||event.button!==0||(event.target as Element).closest('form'))return;const p=regionPoint(event);drag.current={...p,pointer:event.pointerId,moved:false}}
 function regionMove(event:React.PointerEvent<HTMLDivElement>){const start=drag.current;if(!start||start.pointer!==event.pointerId)return;const p=regionPoint(event);if(!start.moved&&Math.hypot(p.x-start.x,p.y-start.y)<.015)return;start.moved=true;event.currentTarget.setPointerCapture(event.pointerId);setRegionDragging(true);showRegion({x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),width:Math.abs(start.x-p.x),height:Math.abs(start.y-p.y)})}
 function regionUp(event:React.PointerEvent<HTMLDivElement>){const start=drag.current;if(!start||start.pointer!==event.pointerId)return;drag.current=null;if(!start.moved)return;ignoreObjectClick.current=true;setTimeout(()=>{ignoreObjectClick.current=false},0);const box=regionRef.current,stage=event.currentTarget.getBoundingClientRect();const contains=(id:ObjectId)=>{const r=root.current?.querySelector<HTMLElement>(`[data-studio-object="${id}"]`)?.getBoundingClientRect();if(!r||!box)return false;const x=(r.x+r.width/2-stage.x)/stage.width,y=(r.y+r.height/2-stage.y)/stage.height;return x>=box.x&&x<=box.x+box.width&&y>=box.y&&y<=box.y+box.height};if(contains('robot')&&contains('friend'))openRegion();else{regionRef.current=null;setRegion(null);setRegionDragging(false);setStatus('Draw a box around both gardeners to add a group note.')}}
 function color(value:string){commit(currentSelected.current==='sprout'?{leaf:value}:currentSelected.current==='friend'?{friendColor:value}:{body:value})}
 function scale(value:number){commit(currentSelected.current==='sprout'?{sproutScale:value}:currentSelected.current==='friend'?{friendScale:value}:{scale:value})}
 function attach(id:AnnotationTarget,text:string){const next:Note={object:id,text:text.trim()||friendComment,number:++noteSequence.current,...(id==='gardeners'&&regionRef.current?{region:{...regionRef.current},sourceTime:regionTime.current}:{})};noteRef.current=next;setNote(next);setDraft(null);setMode('select');setStatus('Your note is attached above the main chat composer.')}
 function respond(text:string){setSent(turns=>turns.map((turn,i)=>i===turns.length-1?{...turn,response:text}:turn))}
 function sendAttached(){const n=noteRef.current;if(n)setSent(turns=>[...turns,n]);setNote(null);noteRef.current=null;setChatText('');setChatFocused(false)}
 function finishFriend(){friendProgress.current=1;commit({friend:1,friendScale:modelRef.current.friend?modelRef.current.friendScale:modelRef.current.scale});respond('The same size, with the same handmade feel.');setStatus('Two little gardeners. Now give them a little story.')}
 function beginWatering(){wateringPreview.current=true;wateringProgress.current=0;previewRange.current=[17,20];sourceTime.current=18;fullPlayback.current=false;setFromBeginning(false);frame()}
 function finishWatering(){friendProgress.current=1;wateringProgress.current=1;wateringPreview.current=false;regionRef.current=null;setRegion(null);commit({friend:1,watering:1,friendScale:modelRef.current.friend?modelRef.current.friendScale:modelRef.current.scale});respond('Hand in hand, a happy little shower. Added as Scene 02.');setStatus('A new scene: two happy gardeners, one little sunflower.')}
 function restartVideo(){sourceTime.current=0;fullPlayback.current=true;setFromBeginning(true);setPlaying(true);setDraft(null);setSelected(null);currentSelected.current=null;setMode('select');setStatus('Playing from the beginning, including your new watering scene.');frame()}
 async function manualSend(){
  const n=noteRef.current;if(!n)return;const request=n.text+' '+chatText;sendAttached();
  const water=/hold hands|sprinkl|water/i.test(request),friend=/friend|another|two|second/i.test(request);
  if(!water&&!friend){if(/blue/i.test(request)){commit(n.object==='sprout'?{leaf:'#6d86cf'}:n.object==='friend'?{friendColor:'#6d86cf'}:{body:'#6d86cf'});respond(`${names[n.object]} is blue. The rest of the scene stays yours.`);setStatus(`${names[n.object]} updated. Every detail is still editable.`);setPhase('complete')}else respond('Try “Add a blue friend,” “Hold hands and water the flower,” or “Make it blue” in this guided preview.');return}
  setPhase(water?'watering-edit':'editing');if(water)beginWatering();
  const c=new AbortController();controller.current=c;const began=performance.now();
  await new Promise<void>(resolve=>{const tick=(now:number)=>{if(c.signal.aborted){resolve();return}const t=Math.min(1,(now-began)/1300);if(water)wateringProgress.current=t*t*(3-2*t);else friendProgress.current=t*t*(3-2*t);frame();if(t<1)requestAnimationFrame(tick);else resolve()};requestAnimationFrame(tick)});
  if(!c.signal.aborted){if(water)finishWatering();else finishFriend();setPhase('complete')}if(controller.current===c)controller.current=null;
 }
 function frame(){
  if(!renderer.current)return;
  const values={...modelRef.current,...preview.current};
  renderer.current.draw(sourceTime.current,{...defaults,body:values.body,leaf:values.leaf,robotScale:values.scale,sproutScale:values.sproutScale,friendColor:values.friendColor,friendScale:values.friend?values.friendScale:values.scale,friendProgress:friendProgress.current,wateringScene:values.watering===1||wateringPreview.current,wateringProgress:wateringProgress.current,wateringVisible:fullPlayback.current,caption3:values.friend?'A little better, together.':defaults.caption3});
  for(const id of ['robot','sprout','friend'] as const){const bounds=renderer.current.objects[id].bounds(),el=root.current?.querySelector<HTMLElement>(`[data-studio-object="${id}"]`);if(!el)continue;el.hidden=!bounds;if(bounds){el.style.left=`${bounds.x/1280*100}%`;el.style.top=`${bounds.y/720*100}%`;el.style.width=`${bounds.width/1280*100}%`;el.style.height=`${bounds.height/720*100}%`}}
  const stage=root.current?.querySelector<HTMLElement>('[data-studio-stage]');
  if(stage)for(const el of root.current!.querySelectorAll<HTMLElement>('[data-studio-anchor]')){
   const target=el.dataset.studioAnchor!;let bounds=renderer.current.objects[target]?.bounds();
   if(target==='gardeners'){const a=renderer.current.objects.robot.bounds(),b=renderer.current.objects.friend.bounds();if(a&&b){const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);bounds={x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y}}}
   el.hidden=!bounds;if(!bounds)continue;
   if(el.matches('[data-studio-note]')){const width=stage.clientWidth,height=stage.clientHeight;el.style.left=`${Math.max(8,Math.min(width-el.offsetWidth-8,(bounds.x+bounds.width/2)/1280*width-el.offsetWidth/2))}px`;el.style.top=`${Math.max(7,bounds.y/720*height-el.offsetHeight-10)}px`}
   else{el.style.left=`${(bounds.x+bounds.width*.9)/1280*100}%`;el.style.top=`${bounds.y/720*100}%`}
  }
  const duration=values.watering||wateringPreview.current?24:16;
  if(clockLabel.current)clockLabel.current.textContent=`00:${sourceTime.current.toFixed(1).padStart(4,'0')} / 00:${duration}`;
  if(sceneLabel.current)sceneLabel.current.textContent=sourceTime.current>=16&&duration===24?'Scene 02':'Scene 01';
  if(root.current){root.current.dataset.sourceTime=sourceTime.current.toFixed(2);root.current.dataset.currentScene=sourceTime.current>=16&&duration===24?'watering':'garden'}
  if(playhead.current){const width=playhead.current.parentElement?.clientWidth??0;playhead.current.style.left=`${35+(width-40)*sourceTime.current/duration}px`}

 }
 async function ensure(){
  if(renderer.current)return;if(loading.current)return loading.current;
  loading.current=(async()=>{const url=new URL(rendererUrl,location.origin).href;const m=await import(/* @vite-ignore */url);if(!alive.current||!canvas.current)return;renderer.current=m.createStudioPaper(canvas.current);frame();setReady(true)})().finally(()=>{loading.current=null});return loading.current;
 }
 function reset(){
  hideChatHistory();setChatFocused(false);
  regionRef.current=null;setRegion(null);setRegionDragging(false);drag.current=null;
  modelRef.current={...original};history.current=[{...original}];historyIndex.current=0;preview.current=null;friendProgress.current=0;wateringProgress.current=0;wateringPreview.current=false;previewRange.current=[11.8,14.2];sourceTime.current=12;fullPlayback.current=false;noteSequence.current=0;setFromBeginning(false);setModel({...original});setSelected(null);currentSelected.current=null;setMode('select');setDraft(null);setNoteText('');setNote(null);noteRef.current=null;setSent([]);setChatText('');setPhase('idle');setStatus('Watch a detail change, then turn a note into an edit.');setRevision(v=>v+1);
 }
 async function run(){
  stop();const request=runVersion.current;reset();await ensure();if(!root.current||request!==runVersion.current||root.current.closest<HTMLElement>('[data-agent-panel]')?.hidden||document.hidden)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){currentSelected.current='robot';setSelected('robot');commit({body:'#6eaa97',scale:1.12,friendScale:1.12,friend:1,watering:1});friendProgress.current=1;wateringProgress.current=1;previewRange.current=[17,20];sourceTime.current=18;setSent([{object:'robot',text:friendComment,number:1,response:'A matching blue friend.'},{object:'gardeners',text:waterComment,number:2,response:'Hand in hand, a happy little shower.'}]);noteSequence.current=2;setStatus('A new scene: two happy gardeners, one little sunflower.');setPhase('complete');frame();return}
  const c=new AbortController();controller.current=c;setRunning(true);setPlaying(true);
  try{
   const {runStudioWalkthrough}=await import('../lib/studio-walkthrough');
   await runStudioWalkthrough({root:root.current,signal:c.signal,onStep:setPhase,
    onSelect:()=>{currentSelected.current='robot';setSelected('robot')},onColor:()=>commit({body:'#6eaa97'}),
    onScale:(value,save)=>{if(save){preview.current=null;commit({scale:value})}else{preview.current={scale:value};const input=root.current?.querySelector<HTMLInputElement>('[data-studio-scale]');if(input)input.value=String(value);const output=input?.parentElement?.querySelector('output');if(output)output.textContent=`${Math.round(value*100)}%`}},
    onAnnotate:()=>setMode('annotate'),onOpenNote:object=>{setDraft(object);setNoteText('')},onNoteText:setNoteText,
    onRegion:box=>{setRegionDragging(true);showRegion(box)},onOpenRegion:openRegion,
    onAttach:(object,text)=>attach(object,text),onChatText:setChatText,
    onSend:kind=>{sendAttached();setStatus(kind==='watering'?'Adding a happy watering scene…':'Making a little room for a friend…')},
    onProgress:(value,kind)=>{if(kind==='watering')wateringProgress.current=value;else friendProgress.current=value},onComplete:kind=>kind==='watering'?finishWatering():finishFriend(),onWateringStart:beginWatering,onRestart:restartVideo,
   });
  }catch{if(!c.signal.aborted)setStatus('Try selecting the character, or replay the walkthrough.')}
  finally{if(controller.current===c){controller.current=null;preview.current=null;friendProgress.current=modelRef.current.friend;wateringProgress.current=modelRef.current.watering;wateringPreview.current=false;setRunning(false)}}
 }
 const runRef=useRef(run);runRef.current=run;
 const stopRef=useRef(stop);stopRef.current=stop;
 const pauseAuto=useRef(()=>{});
 useImperativeHandle(controlsRef,()=>({
  pauseWalkthrough(){pauseAuto.current();stopRef.current()},
  replayWalkthrough(){pauseAuto.current();void runRef.current()},
 }),[]);
 useEffect(()=>{
  alive.current=true;const element=root.current!,panel=element.closest<HTMLElement>('[data-agent-panel]');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');setReduced(motion.matches);
  const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
  let inView=false,autoVisible=false,played=false,timer=0,disposed=false;
  pauseAuto.current=()=>{clearTimeout(timer);played=true};
  function sync(){const open=!panel?.hidden;if(!open)played=false;const visible=open&&inView&&!document.hidden;setActive(visible);if(!visible){clearTimeout(timer);stop();return}void ensure().catch(()=>setStatus('The scene could not load. Try replaying the demo.'));if(autoVisible&&!played&&!motion.matches&&!saveData){played=true;timer=window.setTimeout(()=>{if(!disposed)void runRef.current()},600)}}
  const observe=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;autoVisible=entry.intersectionRatio>=.55;sync()},{threshold:[0,.18,.55]});observe.observe(element);
  const layout=new ResizeObserver(()=>{
   if(element.offsetWidth<=0)return;
   frame();
   const workspace=element.querySelector<HTMLElement>('.studio-workspace'),stage=element.querySelector<HTMLElement>('[data-studio-stage]'),timeline=element.querySelector<HTMLElement>('.studio-timeline'),composer=element.querySelector<HTMLElement>('.studio-chat-composer');
   if(!workspace||!stage||!timeline||!composer||getComputedStyle(element).getPropertyValue('--studio-floating-chat').trim()!=='1')return;
   const stageBottom=stage.offsetTop+stage.offsetHeight,timelineBottom=timeline.offsetTop+timeline.offsetHeight;
   // Dock on the track; even the expanded composer stays below the picture.
   const dockEdge=Math.max(timelineBottom+4,stageBottom+composer.offsetHeight+8);
   const bottom=Math.max(8,workspace.clientHeight-dockEdge);
   element.style.setProperty('--studio-chat-bottom',`${bottom}px`);
   element.style.setProperty('--studio-chat-history-width',`${Math.min(210,workspace.clientWidth-24)}px`);
   element.style.setProperty('--studio-chat-history-max',`${Math.max(0,Math.min(112,bottom-20))}px`);
   if(messages.current)messages.current.scrollTop=messages.current.scrollHeight;
  });layout.observe(element);
  for(const selector of ['[data-studio-stage]','.studio-timeline','.studio-inspector','.studio-chat-composer']){const part=element.querySelector(selector);if(part)layout.observe(part)}
  const tabs=new MutationObserver(sync);if(panel)tabs.observe(panel,{attributes:true,attributeFilter:['hidden']});
  const preference=()=>{setReduced(motion.matches);if(motion.matches)stop();sync()};motion.addEventListener('change',preference);document.addEventListener('visibilitychange',sync);
  return()=>{disposed=true;alive.current=false;runVersion.current++;clearTimeout(timer);observe.disconnect();layout.disconnect();tabs.disconnect();motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',sync);const current=controller.current;controller.current=null;current?.abort();renderer.current?.dispose();renderer.current=null};
 },[]);
 useEffect(()=>{if(!active)return;if(reduced||!playing){frame();return}let raf=0,last=0;const tick=(now:number)=>{if(now-last>=1000/12){const delta=last?Math.min(.15,(now-last)/1000):0;last=now;if(playing&&!reduced){const [start,end]=previewRange.current;sourceTime.current=fullPlayback.current?(sourceTime.current+delta)%(modelRef.current.watering?24:16):start+(sourceTime.current-start+delta)%(end-start)}frame()}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[active,playing,reduced,revision,selected,draft,note,sent]);
 function undo(direction:number){const index=historyIndex.current+direction;if(index<0||index>=history.current.length)return;historyIndex.current=index;modelRef.current=history.current[index];friendProgress.current=modelRef.current.friend;wateringProgress.current=modelRef.current.watering;if(!modelRef.current.watering&&sourceTime.current>=16){sourceTime.current=12;previewRange.current=[11.8,14.2]}setModel({...modelRef.current});setRevision(v=>v+1)}
 useEffect(()=>{if(messages.current)messages.current.scrollTop=messages.current.scrollHeight},[sent,phase]);
 useEffect(()=>{if(sent.length)revealChatHistory()},[sent]);
 useEffect(()=>{if(!active)hideChatHistory()},[active]);
 useEffect(()=>()=>{if(historyTimer.current)clearTimeout(historyTimer.current)},[]);
 const expanded=model.watering===1||phase==='watering-edit';
 const selectedLabel=selected?names[selected]:'Scene objects',selectedColor=selected==='sprout'?model.leaf:selected==='friend'?model.friendColor:model.body,selectedScale=selected==='sprout'?model.sproutScale:selected==='friend'?model.friendScale:model.scale;
 return <div className="studio-demo-shell">
  <div className="studio-demo" ref={root} data-studio-demo data-phase={phase} data-running={running} data-studio-active={active} data-chat-history-visible={chatHistoryVisible} data-chat-drafting={chatFocused||Boolean(note)||Boolean(chatText)} data-chat-obscured={mode==='annotate'||Boolean(draft)} data-selected={selected??''} data-friends={model.friend} data-watering-scene={model.watering} data-playback-mode={fromBeginning?'full':'selection'} data-revision={revision} onPointerDownCapture={takeOver} onKeyDownCapture={takeOver} onClickCapture={takeOver} onInputCapture={takeOver}>
   <div className="studio-titlebar"><span className="studio-traffic" aria-hidden="true"><i/><i/><i/></span><span data-studio-origin><img src={logoUrl} width="17" height="17" alt=""/> Stitchable Pro Studio</span></div>
   <div className="studio-workspace">
    <div className="studio-rail" aria-hidden="true"><span className="is-active"><Icon name="home"/></span><span><Icon name="folder"/></span><span><Icon name="film"/></span><span><Icon name="spark"/></span><span className="studio-avatar">S</span></div>
    <div className="studio-projects" aria-hidden="true"><strong>Chats <Icon name="plus" size={13}/></strong><span className="studio-new-chat">＋ New chat</span><small>CREATIVE WORKSPACE</small><span>Product launch film</span><span>Kinetic type study</span><span>Little worlds</span><span className="studio-project-active"><Icon name="film" size={13}/> A small act of care</span><span className="studio-project-foot">Your ideas, in motion.</span></div>
    <section className="studio-chat" aria-label="Studio demo conversation" onPointerEnter={event=>{if(event.pointerType==='mouse'&&matchMedia('(any-hover: hover)').matches)revealChatHistory()}} onFocusCapture={event=>{if(event.target instanceof HTMLTextAreaElement){setChatFocused(true);revealChatHistory()}}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setChatFocused(false)}}>
     <header><span>Paper garden</span><span aria-hidden="true">···</span></header>
     <div className="studio-messages" id={chatHistoryId} ref={messages} role="log" aria-label="Recent Studio messages" onWheel={revealChatHistory}><div className="studio-message-user">Make a tiny paper world.<small>Warm, playful. A little handmade.</small></div><div className="studio-assistant"><span className="studio-agent-dot">✦</span><p>A little gardener, a growing sunflower.<br/>The scene is ready to make yours.</p><div className="studio-tool-pill"><Icon name="check" size={12}/> Created the scene</div></div>
      {sent.map(turn=><div className="studio-chat-turn" key={turn.number}><div className="studio-sent-message"><div className="studio-chat-reference" data-studio-reference={turn.region?"region":"object"}><Icon name={turn.region?"region":"pin"} size={12}/><span>{names[turn.object]}</span><b>{turn.number}</b></div><p>{turn.text}</p><small>{turn.number===2?'Make this the next scene.':'Make that change.'}</small></div>{turn.response&&<div className="studio-assistant studio-reply"><span className="studio-agent-dot">✦</span><p>{turn.response}</p><div className="studio-tool-pill"><Icon name="check" size={12}/> {turn.number===2?'Scene 02 added':'Scene updated'}</div></div>}</div>)}
      {['editing','watering-edit'].includes(phase)&&<div className="studio-tool-pill studio-working"><span/> {phase==='watering-edit'?'Adding Scene 02…':'Editing the scene…'}</div>}

     </div>
     <form className="studio-chat-composer" onSubmit={event=>{event.preventDefault();void manualSend()}}>
      <button type="button" className="studio-history-toggle" aria-label="Show Studio chat history" aria-controls={chatHistoryId} aria-expanded={chatHistoryVisible} onClick={()=>chatHistoryVisible?hideChatHistory():revealChatHistory()}><Icon name="chat" size={16}/></button>
      {note&&<div className="studio-attached-note" data-studio-attached><span className="studio-note-thumb">{note.number}</span><span><b>{names[note.object]}</b><small>{note.text}</small></span><button type="button" aria-label="Remove annotation" onClick={()=>{noteRef.current=null;setNote(null)}}>×</button></div>}
      <label className="sr-only" htmlFor="studio-chat-text">Studio demo chat message</label><textarea id="studio-chat-text" data-studio-chat-input rows={2} value={chatText} onChange={e=>setChatText(e.target.value)} placeholder={note?'What would you like to change?':'Ask Stitchable…'}/>
      <div className="studio-chat-tools"><span aria-hidden="true">＋ <span>✦</span></span><small>Stitch · Creative</small><button type="submit" data-studio-send disabled={!note} aria-label="Apply annotated edit"><Icon name="arrow" size={14}/></button></div>
     </form>
    </section>
    <div className="studio-editor">
     <div className="studio-file-tab"><Icon name="film" size={14}/><span>paper-garden.kdv</span><span className="studio-file-x" aria-hidden="true">×</span><span className="studio-local-badge">EditableFrames</span></div>
     <div className="studio-editor-toolbar"><span className="studio-breadcrumb">Paper garden <span>›</span> <span ref={sceneLabel}>Scene 01</span></span><button type="button" data-studio-annotate aria-pressed={mode==='annotate'} onClick={()=>{setMode(mode==='annotate'?'select':'annotate');setStatus('Click an object, or drag a box around both gardeners, to leave a note.')}}><Icon name="chat" size={14}/><span>Annotate</span></button></div>
     <div className="studio-stage" data-studio-stage data-annotation-mode={mode==='annotate'} onPointerDown={regionDown} onPointerMove={regionMove} onPointerUp={regionUp} onPointerCancel={()=>{drag.current=null;setRegionDragging(false);regionRef.current=null;setRegion(null)}}>
      {!ready&&<img className="studio-scene-poster" src={posterUrl} alt="A little paper gardener beside a sunflower" width="1280" height="720" loading="lazy"/>}
      <canvas ref={canvas} width="1280" height="720" aria-label={`Paper garden preview: ${model.watering?'two gardeners watering a sunflower in a two-scene story':model.friend?'two matching paper characters':'one paper character'}`} style={{visibility:ready?'visible':'hidden'}}/>
      <div className="studio-paper-texture" aria-hidden="true"/>
      {region&&<div className="studio-region" data-studio-region data-dragging={regionDragging} style={{left:`${region.x*100}%`,top:`${region.y*100}%`,width:`${region.width*100}%`,height:`${region.height*100}%`}} role="img" aria-label="Selected region around both gardeners"><span>{regionDragging?'Select a region':'Both gardeners'}</span><i/><i/><i/><i/></div>}
      {(['robot','sprout','friend'] as ObjectId[]).map(id=><button type="button" key={id} data-studio-object={id} className={`studio-object ${selected===id?'is-selected':''}`} hidden aria-label={`Select ${names[id].toLowerCase()}`} onClick={()=>choose(id)}><span>{mode==='annotate'?<><Icon name="chat" size={11}/> Comment</>:names[id]}</span><i/><i/><i/><i/></button>)}
      {draft&&<form className="studio-note-composer" data-studio-note data-studio-anchor={draft} onSubmit={e=>{e.preventDefault();attach(draft,noteText)}}><label htmlFor="studio-note-text"><span>{noteSequence.current+1}</span> {names[draft]}<button type="button" aria-label="Close annotation" onClick={()=>setDraft(null)}>×</button></label><textarea id="studio-note-text" data-studio-note-input aria-label="Annotation comment" rows={2} autoComplete="off" maxLength={140} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="What would make this yours?"/><div><span>↵ Add to chat</span><button type="submit" data-studio-attach aria-label="Attach annotation to chat"><Icon name="arrow" size={12}/></button></div></form>}
      {(note||sent.length>0||draft)&&<span className="studio-object-pin" data-studio-anchor={draft??note?.object??sent.at(-1)?.object} aria-label={`Annotation ${draft?noteSequence.current+1:note?.number??sent.at(-1)?.number}`}>{draft?noteSequence.current+1:note?.number??sent.at(-1)?.number}</span>}
      {['editing','watering-edit'].includes(phase)&&<span className="studio-editing-badge"><Icon name="spark" size={12}/> {phase==='watering-edit'?'A little joy, frame by frame…':'Making a little room…'}</span>}
     </div>
     <div className="studio-transport"><button type="button" data-studio-restart aria-label="Restart Studio video" onClick={restartVideo}><Icon name="restart" size={12}/></button><button type="button" onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause Studio clip':'Play Studio clip'}><Icon name={playing?'pause':'play'} size={12}/></button><span ref={clockLabel}>00:12.0 / 00:16</span><span className="studio-transport-loop">↻ {fromBeginning?'Full video':'Loop selection'}</span><span className="studio-frame-size">1280 × 720</span><button type="button" aria-label="Undo Studio edit" disabled={historyIndex.current===0} onClick={()=>undo(-1)}><Icon name="undo" size={12}/></button><button type="button" aria-label="Redo Studio edit" disabled={historyIndex.current>=history.current.length-1} onClick={()=>undo(1)}><span className="studio-redo"><Icon name="undo" size={12}/></span></button></div>
     <div className={`studio-timeline ${['editing','watering-edit'].includes(phase)?'is-editing':''}`} aria-label="Illustrated editable video timeline"><div className="studio-time-ruler">{(expanded?['0:00','0:06','0:12','0:18','0:24']:['0:00','0:04','0:08','0:12','0:16']).map(t=><span key={t}>{t}</span>)}</div><div className="studio-track"><span>V1</span><div className="studio-track-clips"><div className="studio-timeline-clip" style={{flex:16}}><Icon name="film" size={11}/>{model.friend?'Little gardeners':'A small act of care'}<b>16s</b></div>{expanded&&<div className="studio-timeline-clip studio-watering-clip" data-studio-new-scene style={{flex:8}}><Icon name="film" size={11}/> Happy gardeners <b>8s</b></div>}</div></div><div className="studio-key-lane"><span>Color</span><i/><i/><i/></div><div className="studio-key-lane"><span>Scale</span><i/><i/></div><div className="studio-key-lane studio-friend-lane"><span>Characters</span><i/>{model.friend===1&&<i/>}</div>{expanded&&<div className="studio-key-lane studio-water-lane"><span>Water</span><i/><i/></div>}<span className="studio-playhead" ref={playhead}/></div>

     <section className="studio-inspector" aria-label="Selected object properties"><header><span><Icon name="sliders" size={12}/> {selectedLabel}</span><small>{selected?'OBJECT PROPERTIES':'SELECT AN OBJECT'}</small></header><div className="studio-property-fields"><div className="studio-property-color"><span>{selected==='sprout'?'Leaf paper':'Character paper'}</span><div>{swatches.map(([name,value])=><button type="button" key={name} data-studio-swatch={name} aria-label={`Set object color to ${name}`} aria-pressed={selectedColor===value} style={{background:value}} onClick={()=>color(value)}/>)}<input type="color" aria-label="Custom object color" value={selectedColor} onChange={e=>color(e.target.value)}/></div></div><label><span>Scale <output>{(selectedScale*100).toFixed(0)}%</output></span><input data-studio-scale aria-label="Selected object scale" type="range" min="0.75" max="1.25" step="0.01" value={selectedScale} onChange={e=>scale(Number(e.target.value))}/></label><div className="studio-property-anchor"><span>Scene objects</span><strong>{model.friend?'2 characters + sunflower':'Character + sunflower'} <Icon name="check" size={11}/></strong></div></div></section>
    </div>
   </div>
   <div className="studio-pointer" data-studio-pointer hidden aria-hidden="true"><svg className="studio-pointer-arrow" width="28" height="34" viewBox="0 0 32 38"><path d="M6 4V28L12 22L17 33L22 30L17 20H28L6 4Z" fill="#a267ff" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/></svg><span className="studio-pointer-region">＋</span><span className="studio-pointer-bubble"><Icon name="chat" size={22}/><i/><i/><i/></span><span className="studio-pointer-label">You</span><span className="studio-pointer-ring"/></div>
  </div>
  <div className="studio-demo-caption"><div className="studio-demo-steps"><span className={phase==='properties'?'is-current':''}>01 <b>Adjust</b></span><span className={['annotate','comment','chat','annotate-water','comment-water','chat-water'].includes(phase)?'is-current':''}>02 <b>Point & chat</b></span><span className={['editing','watering-edit','playback','complete'].includes(phase)?'is-current':''}>03 <b>Make it yours</b></span></div><button type="button" data-studio-replay onClick={()=>running?stop():void run()}>{running?'Ⅱ Pause walkthrough':reduced?'Show example edit':'↻ Replay walkthrough'}</button></div>
  <p className="studio-demo-status" role="status" aria-live="polite">{status}</p>
 </div>;
}
