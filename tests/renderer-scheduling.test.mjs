import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {defineRenderer} from '../packages/core/renderer.mjs';
import {normalizeClipModule} from '../packages/core/definition.mjs';
import {Studio,clone} from '../packages/core/index.mjs';
import {createRendererCompositor} from '../packages/runtime/renderer-compositor.mjs';
const previous={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver};
class Element {
 constructor(){this.ownerDocument=globalThis.document;this.style={};this.dataset={};this.children=[];this.clientWidth=320;this.clientHeight=180;}
 append(...children){for(const child of children){child.remove();child.parent=this;this.children.push(child);}}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
 replaceChildren(...children){for(const child of [...this.children])child.remove();this.append(...children);}
 getBoundingClientRect(){return {left:0,top:0,width:320,height:180};}
 closest(selector){const key=selector==='[data-clip-id]'?'clipId':'efAnchor';return this.dataset[key]?this:this.parent?.closest(selector)??null;}
}
globalThis.document={fonts:{ready:Promise.resolve()},createElement:()=>new Element()};
globalThis.ResizeObserver=class {observe(){}disconnect(){}};
after(()=>{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}});
function setup({capture=false,render,create}={}){
 const scene=defineRenderer({id:'scheduler',renderer:'future-library',width:320,height:180,fps:30,durationInFrames:90,
  async create(context){return create?create(context):{render,dispose(){}};}});
 const d=normalizeClipModule({default:scene}),studio=new Studio(d.templates);studio.doc.clips=[studio.make(scene.id)];studio.base=clone(studio.doc);
 const stage=new Element(),compositor=createRendererCompositor(stage,{scene,templates:d.templates,capture});
 return {stage,compositor,studio,options:{selected:studio.doc.clips[0].id}};
}
for(const capture of [false,true])test(capture?'capture retains every queued frame':'preview coalesces all pending seeks into the newest frame',async()=>{
 let release,started;const entered=new Promise(resolve=>started=resolve),frames=[];
 const {compositor,studio,options}=setup({capture,async render(clock){if(clock.frame===0){started();await new Promise(resolve=>release=resolve);}frames.push(Math.round(clock.frame));}});
 const first=compositor.render(studio,0,options);await entered;
 const pending=Array.from({length:20},(_,i)=>compositor.render(studio,(i+1)/30,options));
 if(!capture)assert.ok(pending.every(p=>p===pending[0]));release();await Promise.all([first,...pending]);
 assert.deepEqual(frames,capture?Array.from({length:21},(_,i)=>i):[0,20]);await compositor.dispose();
});
test('disposing cancels pending previews and disposes the active resident once',async()=>{
 let release,started,disposals=0;const entered=new Promise(resolve=>started=resolve);
 const {compositor,studio,options,stage}=setup({async create(){return {async render(){started();await new Promise(resolve=>release=resolve);},dispose(){disposals++;}};}});
 const first=compositor.render(studio,0,options);await entered;
 const rejected=assert.rejects(compositor.render(studio,1,options),/disposed/);const close=compositor.dispose();release();await Promise.all([first,rejected,close]);await compositor.dispose();
 assert.equal(disposals,1);assert.equal(stage.children.length,0);await assert.rejects(compositor.render(studio,0,options),/disposed/);
});
test('a failed resident is removed and retries create a new instance',async()=>{
 let created=0,disposed=0;const {compositor,studio,options,stage}=setup({async create(){created++;return {render(clock){if(clock.frame===1)throw Error('frame failed');},dispose(){disposed++;}};}});
 await compositor.render(studio,0,options);await assert.rejects(compositor.render(studio,1/30,options),/frame failed/);
 assert.equal(stage.children.length,0);assert.equal(disposed,1);await compositor.render(studio,2/30,options);assert.equal(created,2);assert.equal(stage.children.length,1);await compositor.dispose();assert.equal(disposed,2);
});

test('shutter samples carry a fixed media clock through trims, retiming and backward seeks', async () => {
 const clocks=[];
 const {compositor,studio,options}=setup({capture:true,render:clock=>clocks.push(clock)});
 const clip=studio.doc.clips[0];
 // Clip offsets use document ticks; evaluate both clocks through the same clip mapping.
 const {HZ}=await import('../packages/core/index.mjs');
 clip.start=HZ;clip.sourceIn=HZ/2;clip.rate=2;
 for(const time of [1.49,1.51,1.49])await compositor.render(studio,time,{...options,timeline:true,mediaTime:1.5});
 assert.deepEqual(clocks.map(c=>c.mediaTime),[1.5,1.5,1.5]);
 assert.ok(clocks[0].frame<clocks[1].frame);
 assert.equal(clocks[0].frame,clocks[2].frame);
 await compositor.render(studio,1.7,{...options,timeline:true});
 assert.ok(Math.abs(clocks.at(-1).mediaTime-clocks.at(-1).frame/30)<1e-12,'ordinary seeks reset both clocks');
 await compositor.dispose();
});

test('legacy renderers receive both source clocks without rewriting requested media times', async () => {
 const {createCompositor}=await import('../packages/runtime/compositor.mjs');
 const {HZ}=await import('../packages/core/index.mjs');
 const scene=defineRenderer({id:'legacy-clock',renderer:'dom',width:320,height:180,fps:30,durationInFrames:90,create(){}});
 const d=normalizeClipModule({default:scene}),studio=new Studio(d.templates);
 const clip=studio.make(scene.id);studio.doc.clips=[clip];clip.start=HZ;clip.sourceIn=HZ/2;clip.rate=2;
 const context={clearRect(){},save(){},restore(){},translate(){},scale(){},drawImage(){}};
 const canvas={getContext:()=>context},calls=[],clocks=[],host={portFrame:(port,time)=>calls.push(time)};
 const compositor=createCompositor(canvas,{templates:d.templates,host,createRenderer(surface,{host:initialHost}){
  return {render(frame){assert.equal(frame.host,initialHost);clocks.push(frame);
   frame.host.portFrame(null,frame.mediaTime+.25);return surface;}};
 }});
 for(const time of [1.49,1.51,1.49])await compositor.render(studio,time,{timeline:true,mediaTime:1.5});
 assert.deepEqual(calls,[1.75,1.75,1.75]);assert.ok(clocks[0].time<clocks[1].time);
 await compositor.render(studio,1.7,{timeline:true});
 assert.equal(clocks.at(-1).mediaTime,clocks.at(-1).time);
 await compositor.dispose();
});
