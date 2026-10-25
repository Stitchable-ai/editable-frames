import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {cinemaScene,authoredShot} from './cinema.mjs';
import {Studio,HZ} from '../../packages/core/index.mjs';
import {normalizeClipModule,sampledRendererProps} from '../../packages/core/definition.mjs';
import {writePointer,readPointer} from '../../packages/core/controls.mjs';
import {sameOrientation} from '../../packages/core/rotation.mjs';
import {upsertControlKey} from '../../packages/core/key-timing.mjs';
import {createSpatialSession,negotiateSpatial} from '../../packages/core/spatial-session.mjs';
import {ThreeSpatialEditor} from '../../packages/three/spatial-editor.mjs';

const $=s=>document.querySelector(s),W=1280,H=720,FPS=24,LAST=287;
const assets=JSON.parse($('#assets').textContent),binding=$('#source-binding').textContent;
const storageSupported=!!navigator.locks;
let studio,definition,scene,instance,props,editor,orbit,session;
let kind='drama',frame=48,playing=false,autoKey=false,selected='lead',mode='translate',space='world',view='editor';
let editorCamera=new T.PerspectiveCamera(42,W/H,.05,200),viewRevision=0,viewportRevision=0,generation=0,lastTime=0,drag=null,busy=false,booted=false;
let storageNonce=null,storageKey='',savedLabel='Not yet saved',receipts=[],captureBusy=false;
const caches=new Map();
const asset=id=>assets.models?.[id];
function fail(error){if(!booted){busy=false;$('#loading').hidden=true;}$('#status').textContent=error.message??String(error);$('#status').classList.add('error');console.error(error);}
function status(message){$('#status').textContent=message;$('#status').classList.remove('error');}
const clip=()=>studio.doc.clips[0];
const fields=()=>scene.controls.fields;
const identity=()=>({clipId:clip().id,revision:studio.revision,sourceRevision:binding,seekGeneration:generation,rendererInstance:generation,bindingGeneration:generation,viewRevision,viewportRevision,shot:kind,clock:{frame,fps:FPS}});
function sample(s=studio,at=frame){const c=s.doc.clips[0];const p=sampledRendererProps(scene,definition.template,c,s.values(c,at/FPS*HZ));if(!p.shot.override)Object.assign(p.shot,authoredShot(p.kind,at/FPS,p.camera==='wide'));return p;}
function draftProps(){const p=sample();for(const [key,value] of Object.entries(session?.state?.values??{})){const f=fields().find(f=>f.key===key);if(f)writePointer(p,f.path,value);}return p;}
function render(){if(!instance)return;const next=draftProps();for(const k of Object.keys(props))delete props[k];Object.assign(props,next);instance.editing.setView(view==='editor'?editorCamera:null);instance.render({frame,fps:FPS,width:W,height:H,capture:false});editor.camera=view==='editor'?editorCamera:instance.editing.camera;editor.transform.camera=editor.camera;editor.render(instance.editing.renderer);$('#shot-name').textContent=instance.editing.shot;$('#time').textContent=(frame/FPS).toFixed(2)+'s';$('#seek').value=frame;$('#play').textContent=playing?'Pause':'Play';$('#revision').textContent='Revision '+studio.seq+' · '+savedLabel;}
function localPoint(event){const r=instance.editing.renderer.domElement.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*W,y:(event.clientY-r.top)/r.height*H};}
function commands(values,label='Edit scene',keyMode=autoKey){
 const base=sample(),c=clip(),cmds=[];
 const activatingCamera=values['camera.override']===true&&!base.shot.override;
 if(activatingCamera)values={'camera.position':base.shot.position,'camera.target':base.shot.target,'camera.fov':base.shot.fov,...values};
 for(const [key,value] of Object.entries(values)){
  const f=fields().find(f=>f.key===key);if(!f)throw Error('Unknown control');const before=readPointer(base,f.path);
  if(!(activatingCamera&&['camera.position','camera.target','camera.fov'].includes(key))&&(f.type==='quaternion'?sameOrientation(before,value):JSON.stringify(before)===JSON.stringify(value)))continue;
  const node=studio.node(c,f.anchor),keys=node.keys?.[f.property]??[];
  if(f.animatable&&(keyMode||keys.length))cmds.push({type:'keyframes',clip:c.id,anchor:f.anchor,property:f.property,keys:upsertControlKey(keys,frame/FPS,value,'smooth',{num:FPS,den:1})});
  else cmds.push({type:'set',clip:c.id,anchor:f.anchor,property:f.property,value});
 }
 return {type:'batch',label,commands:cmds};
}
function readSaved(){const text=localStorage.getItem(storageKey);return text?JSON.parse(text):null;}
async function transaction(id,expectedRevision,action){
 const run=()=>{
  const old=studio.serialize(),previousNonce=storageNonce;
  if(storageSupported){const saved=readSaved();const receipt=saved?.receipts?.find(r=>r.id===id);if(receipt)return receipt;if((saved?.nonce??null)!==storageNonce){const e=Error('Another window changed this scene. Reload before editing.');e.definite=true;throw e;}}
  if(studio.revision!==expectedRevision){const e=Error('Scene changed before the edit was saved');e.definite=true;throw e;}
  try{const receipt=action();const record={id,revision:studio.revision,noOp:!!receipt?.noOp};if(!record.noOp){const nonce=crypto.randomUUID(),nextReceipts=[...receipts,record].slice(-64);if(storageSupported)localStorage.setItem(storageKey,JSON.stringify({nonce,raw:studio.serialize(),receipts:nextReceipts}));storageNonce=nonce;receipts=nextReceipts;savedLabel=storageSupported?'Saved in this browser':'Memory only · download JSON to keep';}return record;}
  catch(error){studio=Studio.restore(old,definition.templates,binding);storageNonce=previousNonce;error.definite=true;throw error;}
 };
 return storageSupported?navigator.locks.request(storageKey,run):run();
}
function cancelGesture(message='Edit cancelled'){
 if(!drag)return;
 const d=drag;if(!session.cancel(d.id)){status('Save in progress; wait for the result before undoing.');return;}
 drag=null;editor.end();orbit.enabled=view==='editor';try{d.element.releasePointerCapture(d.pointerId);}catch{}
 render();refreshInspector();status(message);
}
async function editValues(values,label='Inspector edit'){
 if(drag||busy)return;playing=false;const command=commands(values,label);if(!command.commands.length)return;
 const rev=studio.revision;busy=true;try{await transaction(crypto.randomUUID(),rev,()=>studio.execute(command,rev));render();refreshInspector();status('Saved · '+label);}catch(e){fail(e);}finally{busy=false;}
}
function setSelection(anchor){if(drag)return;playing=false;frame=Math.round(frame);if(anchor==='camera'&&view==='shot')setView('editor');selected=anchor;editor.setSelection(anchor);refreshInspector();render();}
function setMode(next){if(drag)return;mode=next;editor.setMode(mode,space);refreshInspector();render();}
function setView(next){if(drag)return;if(next==='shot'&&selected==='camera'){selected='lead';editor.setSelection(selected);refreshInspector();}view=next;viewRevision++;orbit.enabled=view==='editor';editor.setCamera(view==='editor'?editorCamera:instance.editing.camera);$('#view').value=view;render();}
function fitView(){if(drag)return;setView('editor');editorCamera.position.fromArray(kind==='drama'?[3.6,2.5,5.6]:[10,6.6,15]);orbit.target.fromArray(kind==='drama'?[0,1.1,0]:[0,2.6,0]);editorCamera.fov=kind==='drama'?42:43;editorCamera.updateProjectionMatrix();orbit.update();viewRevision++;render();}
function refreshInspector(){
 if(!instance)return;const root=$('#inspector');root.replaceChildren();const object=scene.controls.objects.find(o=>o.id===selected);$('#selection-title').textContent=object?.label??'Select an object';
 $('#objects').replaceChildren();for(const o of scene.controls.objects){const b=document.createElement('button');b.textContent=o.label;b.dataset.anchor=o.id;b.className=selected===o.id?'selected':'';b.onclick=()=>setSelection(o.id);$('#objects').append(b);}
 const sampled=draftProps();
 for(const f of fields().filter(f=>f.anchor===selected)){
  const wrap=document.createElement('div');wrap.className='field';const label=document.createElement('label');label.textContent=f.property==='orientation'?'Rotation · degrees':f.property+(f.unit?' · '+f.unit:'');wrap.append(label);
  const val=readPointer(sampled,f.path);const commit=value=>{const values={[f.key]:value};if(selected==='camera'&&f.key!=='camera.override')values['camera.override']=true;return editValues(values,f.property);};
  if(['vec3','quaternion'].includes(f.type)){
   const row=document.createElement('div');row.className='vector';const vals=f.type==='quaternion'?new T.Euler().setFromQuaternion(new T.Quaternion(...val),'XYZ').toArray().slice(0,3).map(v=>T.MathUtils.radToDeg(v)):val;
   for(let i=0;i<3;i++){const cell=document.createElement('label');cell.textContent='XYZ'[i];const input=document.createElement('input');input.type='number';input.step=f.type==='quaternion'?'1':'.1';input.value=Number(vals[i].toFixed(3));input.setAttribute('aria-label',f.key+'.'+'xyz'[i]);input.onchange=()=>{const current=readPointer(sample(),f.path);const next=f.type==='quaternion'?new T.Euler().setFromQuaternion(new T.Quaternion(...current),'XYZ').toArray().slice(0,3).map(T.MathUtils.radToDeg):[...current];next[i]=Number(input.value);commit(f.type==='quaternion'?new T.Quaternion().setFromEuler(new T.Euler(...next.map(T.MathUtils.degToRad),'XYZ')).toArray():next);};cell.append(input);row.append(cell);}wrap.append(row);
  }else{const input=document.createElement('input');input.setAttribute('aria-label',f.key);input.type=f.type==='bool'?'checkbox':f.type==='color'?'color':'number';if(f.type==='bool')input.checked=val;else input.value=val;input.step=f.key==='camera.fov'?'1':'.1';if(f.min!==undefined)input.min=f.min;if(f.max!==undefined)input.max=f.max;input.onchange=()=>commit(f.type==='bool'?input.checked:f.type==='color'?input.value:Number(input.value));wrap.append(input);}
  if(f.animatable){const keys=studio.node(clip(),f.anchor).keys?.[f.property]??[];const note=document.createElement('small');note.textContent=keys.length?keys.length+' keys · edits update this frame':autoKey?'Auto-key: next edit creates a key':'Base value · no keys';wrap.append(note);}root.append(wrap);
 }
 $('#undo').disabled=!studio.canUndo;$('#redo').disabled=!studio.canRedo;
 for(const b of document.querySelectorAll('[data-mode]'))b.classList.toggle('active',b.dataset.mode===mode);
 const cap=editor.capabilities({anchor:selected});$('#capability').textContent=cap.disabledReason??(selected==='lead'||selected==='partner'?'Placement offsets preserve the authored action. Contacts do not automatically re-solve.':'Select a handle or enter an exact value.');
 const lane=$('#keys');lane.replaceChildren();for(const node of clip().nodes)if(node.id===selected)for(const [property,keys] of Object.entries(node.keys??{}))for(const k of keys){const mark=document.createElement('button');mark.className='key';mark.style.left=(k.time/12*100)+'%';mark.title=property+' at '+k.time.toFixed(2)+'s';mark.setAttribute('aria-label',mark.title);mark.onclick=()=>seek(Math.round(k.time*FPS));lane.append(mark);}
}
function seek(at){if(drag)cancelGesture('Drag cancelled by seek');if(session?.state)return;frame=Math.max(0,Math.min(LAST,at));playing=false;render();refreshInspector();}
async function history(method){if(drag){cancelGesture();return;}if(busy)return;playing=false;busy=true;try{const rev=studio.revision;await transaction(crypto.randomUUID(),rev,()=>{studio[method]();return {};});render();refreshInspector();status(method==='undo'?'Undid one edit':'Redid one edit');}catch(e){fail(e);}finally{busy=false;}}
function download(name,content,type='application/json'){const a=document.createElement('a'),url=content.startsWith?.('data:')?content:URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();if(!url.startsWith('data:'))setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function capture(){
 if(captureBusy)return;captureBusy=true;$('#capture').disabled=true;status('Rendering committed shot…');
 const snapshot=studio.serialize(),at=frame,captureScene=scene,captureDefinition=definition,root=document.createElement('div');let captureInstance;
 try{const frozen=Studio.restore(snapshot,captureDefinition.templates,binding),c=frozen.doc.clips[0],p=sampledRendererProps(captureScene,captureDefinition.template,c,frozen.values(c,at/FPS*HZ));
  captureInstance=await captureScene.create({root,props:p,asset});captureInstance.render({frame:at,fps:FPS,width:W,height:H,capture:true});const png=captureInstance.png();
  window.cinema.lastCapture={png,frame:at,raw:snapshot,props:p};download(kind+'-reference-'+at+'.png',png);status('Saved clean PNG from committed shot · frame '+at);return png;
 }catch(e){fail(e);}finally{captureInstance?.dispose();captureBusy=false;$('#capture').disabled=false;}
}
async function load(nextKind){
 if(drag||busy||captureBusy)return;busy=true;booted=false;$('#loading').hidden=false;playing=false;
 if(studio)caches.set(kind,{raw:studio.serialize(),frame,storageNonce,receipts});
 editor?.dispose();orbit?.dispose();instance?.dispose();$('#canvas').replaceChildren();kind=nextKind;generation++;viewRevision++;frame=caches.get(kind)?.frame??48;
 scene=cinemaScene(kind);definition=normalizeClipModule({default:scene});storageKey='editableframes.scene-editor.'+binding+'.'+kind;
 let saved=null;try{if(storageSupported)saved=readSaved();}catch{}
 const cached=caches.get(kind);if(cached){studio=Studio.restore(cached.raw,definition.templates,binding);storageNonce=cached.storageNonce;receipts=cached.receipts;}
 else if(saved){try{studio=Studio.restore(saved.raw,definition.templates,binding);storageNonce=saved.nonce;receipts=saved.receipts??[];}catch{saved=null;}}
 if(!cached&&!saved){studio=new Studio(definition.templates,{binding});studio.doc.clips=[studio.make(scene.id)];studio.base=structuredClone(studio.doc);storageNonce=null;receipts=[];}
 props=sample();instance=await scene.create({root:$('#canvas'),props,asset});
 editorCamera=new T.PerspectiveCamera(42,W/H,.05,200);orbit=new OrbitControls(editorCamera,instance.editing.renderer.domElement);orbit.enableDamping=false;orbit.mouseButtons.LEFT=null;orbit.mouseButtons.RIGHT=T.MOUSE.ROTATE;orbit.mouseButtons.MIDDLE=T.MOUSE.DOLLY;
 editor=new ThreeSpatialEditor({controls:scene.controls,props,objects:instance.editing.objects,camera:editorCamera,width:W,height:H});selected='lead';mode='translate';space='world';$('#space').value=space;editor.setSelection(selected);editor.setMode(mode,space);
 session=createSpatialSession({controls:scene.controls,readIdentity:identity,publish:async proposal=>{
  if(proposal.anchor==='camera'&&proposal.request.operation==='translate'&&new T.Vector3(...proposal.values['camera.position']).distanceTo(new T.Vector3(...sample().shot.position))<1e-9)return {noOp:true};
  const command=commands(proposal.values,'Transform '+proposal.anchor+' · '+proposal.request.operation,drag?.autoKey??autoKey);
  return transaction(proposal.id,proposal.identity.revision,()=>command.commands.length?studio.execute(command,proposal.identity.revision):{noOp:true});
 },reconcile:id=>{const r=readSaved()?.receipts?.find(r=>r.id===id);return r?{status:'committed',receipt:r}:{status:'uncertain'};}});
 const canvas=instance.editing.renderer.domElement;
 canvas.addEventListener('pointerdown',event=>{
  if(busy||drag||event.button!==0||!event.isTrusted)return;
  const point=localPoint(event),hit=editor.hitHandle(point);
  if(hit){
   event.stopImmediatePropagation();event.preventDefault();playing=false;frame=Math.round(frame);orbit.enabled=false;
   try{render();const observed=identity(),capabilities=editor.capabilities({anchor:selected});if(!negotiateSpatial({host:[2],transport:[2],adapter:capabilities.gestureProtocols}))throw Error('Spatial protocol unavailable');
    const b=session.begin({trusted:event.isTrusted,identity:observed,anchor:selected,capabilities,...hit});editor.begin(hit,point,{translationSnap:$('#snap').checked?.25:0,rotationSnap:$('#snap').checked?Math.PI/12:0,scaleSnap:$('#snap').checked?.1:0});drag={id:b.id,pointerId:event.pointerId,element:canvas,autoKey};canvas.setPointerCapture(event.pointerId);status('Drag '+hit.handle.toUpperCase()+' · Escape cancels');
   }catch(e){if(session.state)session.cancel(session.state.id);editor.end();orbit.enabled=view==='editor';fail(e);}return;
  }
  const anchor=editor.pick(point,instance.editing.scene);if(anchor)setSelection(anchor);
 },true);
 canvas.addEventListener('pointermove',event=>{
  if(!drag||drag.pointerId!==event.pointerId)return;event.stopImmediatePropagation();
  try{session.renew(drag.id);const result=editor.update(localPoint(event));session.update({id:drag.id,values:result.values});render();}catch(e){cancelGesture(e.message);}
 },true);
 canvas.addEventListener('pointerup',async event=>{
  if(!drag||drag.pointerId!==event.pointerId||!event.isTrusted)return;event.stopImmediatePropagation();const d=drag;d.released=true;
  try{const result=await session.release({id:d.id,trusted:event.isTrusted,evaluate:()=>editor.update(localPoint(event))});if(result.status==='uncertain'){status('Save outcome uncertain; reload to reconcile before editing.');return;}drag=null;editor.end();orbit.enabled=view==='editor';render();refreshInspector();status(result.status==='cancelled'?'Edit cancelled':'Saved one reversible transform');}
  catch(e){drag=null;editor.end();orbit.enabled=view==='editor';render();refreshInspector();fail(e);}
  finally{try{canvas.releasePointerCapture(event.pointerId);}catch{}}
 },true);
 canvas.addEventListener('pointercancel',()=>cancelGesture());canvas.addEventListener('lostpointercapture',()=>{if(drag&&!drag.released)cancelGesture('Pointer capture lost');});
 orbit.addEventListener('change',()=>{if(booted&&!drag){viewRevision++;render();}});
 fitView();booted=true;busy=false;$('#loading').hidden=true;$('#scene-kind').value=kind;$('#assets-note').textContent=kind==='battle'?'Original procedural robot and ape · no model downloads':assets.models?.michelle?'Local rigged GLB characters · embedded assets':'Original procedural stand-ins · no external downloads';refreshInspector();render();status('Ready · select an actor and drag an axis');
}
$('#scene-kind').onchange=e=>load(e.target.value).catch(fail);for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
$('#space').onchange=e=>{if(drag)return;space=e.target.value;editor.setMode(mode,space);render();};$('#view').onchange=e=>setView(e.target.value);$('#fit').onclick=fitView;
$('#use-view').onclick=()=>{if(view!=='editor')return;editValues({'camera.position':editorCamera.position.toArray(),'camera.target':orbit.target.toArray(),'camera.fov':editorCamera.fov,'camera.override':true},'Use director view as shot');};
$('#play').onclick=()=>{if(drag)return;playing=!playing;lastTime=performance.now();if(!playing)frame=Math.round(frame);render();refreshInspector();};$('#seek').oninput=e=>seek(Number(e.target.value));$('#auto-key').onchange=e=>{autoKey=e.target.checked;refreshInspector();};
$('#undo').onclick=()=>history('undo');$('#redo').onclick=()=>history('redo');$('#capture').onclick=capture;
$('#clay').onchange=e=>editValues({'look.clay':e.target.checked},'Reference look');
$('#save').onclick=()=>download(kind+'-scene.json',studio.serialize());$('#open').onchange=async e=>{if(drag||busy){e.target.value='';return;}busy=true;playing=false;try{const raw=await e.target.files[0].text();const restored=Studio.restore(raw,definition.templates,binding);if(restored.doc.clips.length!==1||restored.doc.clips[0].template!==scene.id)throw Error('Choose a snapshot for this scene');const rev=studio.revision;await transaction(crypto.randomUUID(),rev,()=>{studio=restored;return {};});render();refreshInspector();status('Opened saved scene');}catch(error){fail(error);}finally{busy=false;e.target.value='';}};
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){cancelGesture();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey?'redo':'undo');return;}if(e.code==='Space'){e.preventDefault();$('#play').click();}if(!drag&&['w','e','r'].includes(e.key.toLowerCase()))setMode({w:'translate',e:'rotate',r:'scale'}[e.key.toLowerCase()]);});
window.addEventListener('resize',()=>{viewportRevision++;if(drag)cancelGesture('Viewport changed');});
window.addEventListener('storage',event=>{if(event.key===storageKey){if(drag)cancelGesture('Another window changed the scene');status('Another window saved this scene. Reload to adopt its changes.');}});
window.cinema={get ready(){return booted;},get state(){return {kind,frame,selected,mode,view,props:sample(),draft:session?.state,revision:studio?.revision,history:studio?.history.length,keys:studio?.doc.clips[0]?.nodes,identity:identity()};},select:setSelection,seek,edit:editValues,undo:()=>history('undo'),redo:()=>history('redo'),capture,serialize:()=>studio.serialize(),get editor(){return editor;},get instance(){return instance;}};
function loop(time){if(booted&&playing&&!drag){frame=(frame+Math.min(.1,(time-lastTime)/1000)*FPS)%LAST;render();}lastTime=time;requestAnimationFrame(loop);}requestAnimationFrame(loop);
load('drama').catch(fail);
