import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeControls,projectControlProps,mergeProps} from '../packages/core/controls.mjs';
import {defineRenderer} from '../packages/core/renderer.mjs';
import {normalizeClipModule,sampledRendererProps} from '../packages/core/definition.mjs';
import {Studio,clone,HZ} from '../packages/core/index.mjs';
import {mountRenderer,Readiness} from '../packages/runtime/renderer-host.mjs';
function testRoot(){const ownerDocument={fonts:{ready:Promise.resolve()},createElement(){return {ownerDocument,style:{},remove(){this.parent.children=this.parent.children.filter(child=>child!==this);},append(child){this.children??=[];this.children.push(child);}};}};return {ownerDocument,children:[],append(child){child.parent=this;this.children.push(child);}};}
const scene=changes=>defineRenderer({id:'arbitrary-scene',renderer:'new-engine',width:320,height:180,fps:30000/1001,frameRate:{num:30000,den:1001},durationInFrames:90,defaultProps:{subject:{radius:10},opaque:{any:['data']}},create:async()=>({render(){},dispose(){}}),...changes});
const controls={version:1,fields:[{key:'radius',anchor:'subject',property:'size',path:'/subject/radius',type:'number',min:0,max:100,animatable:true},{key:'position',type:'vec3',default:[0,0,0],animatable:true},{key:'mode',type:'number',animatable:true,interpolation:'discrete'}]};
function setup(source=scene({controls})){const d=normalizeClipModule({default:source}),s=new Studio(d.templates);s.doc.clips=[s.make(d.template.id)];s.base=clone(s.doc);return {d,s,id:s.doc.clips[0].id};}
test('no controls or known renderer required; arbitrary props and rational clocks survive',()=>{const {d,s}=setup(scene());assert.deepEqual(d.frameRate,{num:30000,den:1001});assert.deepEqual(s.doc.clips[0].nodes,[]);assert.deepEqual(sampledRendererProps(d.scene,d.template,s.doc.clips[0],[]),d.scene.defaultProps);});
test('optional controls validate identities, bindings, values and interpolation',()=>{for(const fields of [[{key:'x',path:'/__proto__/x',type:'number'}],[{key:'x',path:'/a',type:'number'},{key:'y',path:'/a/b',type:'number'}],[{key:'x',type:'string',interpolation:'continuous'}],[{key:'x',type:'enum',options:[]}]])assert.throws(()=>normalizeControls({version:1,fields}));assert.throws(()=>projectControlProps({subject:3},{},normalizeControls(controls),[{id:'subject',props:{size:4}}]),/scalar/);});
test('saved overrides, reset, typed animation and undo replay preserve arbitrary props',()=>{const {d,s,id}=setup();const props=()=>sampledRendererProps(d.scene,d.template,s.clip(id),s.values(s.clip(id),HZ/2));
 assert.equal(s.capabilities(id).anchors[0].values.size,10);s.execute({type:'set',clip:id,anchor:'subject',property:'size',value:25});assert.equal(props().subject.radius,25);assert.deepEqual(props().opaque,{any:['data']});s.execute({type:'set',clip:id,anchor:'subject',property:'size',value:null});assert.equal(props().subject.radius,10);s.undo();assert.equal(props().subject.radius,25);s.redo();assert.equal(props().subject.radius,10);
 s.execute({type:'batch',commands:[{type:'keyframes',clip:id,anchor:'root',property:'position',keys:[{time:0,value:[0,0,0]},{time:1,value:[2,4,6]}]},{type:'keyframes',clip:id,anchor:'root',property:'mode',keys:[{time:0,value:1},{time:1,value:9}]}]});assert.deepEqual(props().position,[1,2,3]);assert.equal(props().mode,1);assert.throws(()=>s.execute({type:'keyframes',clip:id,anchor:'subject',property:'size',keys:[{time:0,value:null}]}));assert.deepEqual(Studio.restore(s.serialize(),d.templates,s.binding).doc,s.doc);
});
test('compatible authored defaults stay live; incompatible control rebinding refuses saved history',()=>{const {d,s,id}=setup();const changed=normalizeClipModule({default:scene({controls,defaultProps:{subject:{radius:30},opaque:{new:true}}})});const restored=Studio.restore(s.serialize(),changed.templates,s.binding);assert.equal(sampledRendererProps(changed.scene,changed.template,restored.clip(id),restored.values(restored.clip(id),0)).subject.radius,30);s.execute({type:'set',clip:id,anchor:'subject',property:'size',value:25});assert.equal(Studio.restore(s.serialize(),changed.templates,s.binding).clip(id).nodes[0].props.size,25);const bad=normalizeClipModule({default:scene({controls:{...controls,fields:controls.fields.map(f=>f.key==='radius'?{...f,path:'/different'}:f)}})});assert.throws(()=>Studio.restore(s.serialize(),bad.templates,s.binding),/incompatibly/);});
test('host preserves instance and props identity; readiness failure and deadline are visible',async()=>{let created=0,disposed=0,captured,frames=[];const root=testRoot();const d=scene({async create({props,readiness}){created++;captured=props;const release=readiness.hold('asset');queueMicrotask(release);return {render(clock){frames.push([clock.frame,props.subject.radius]);assert.equal(props,captured);},dispose(){disposed++;},async pick(){return {anchor:'subject'};}};}});const host=await mountRenderer(d,{root});await host.render({frame:10});await host.render({frame:2},{subject:{radius:20}});await host.render({frame:2});assert.equal(created,1);assert.deepEqual(frames,[[10,10],[2,20],[2,20]]);assert.deepEqual(await host.pick({}),{anchor:'subject'});await host.dispose();assert.equal(disposed,1);await assert.rejects(host.render({frame:0}),/disposed/);
 const readiness=new Readiness();readiness.hold('never');const waiting=readiness.ready();readiness.fail(Error('asset failed'));await assert.rejects(waiting,/asset failed/);await assert.rejects(mountRenderer(scene({create:()=>new Promise(()=>{})}),{root,timeoutMs:5}),/timed out/);
});

test('nested defaults survive sparse edits and resets; arrays are atomic',async()=>{
 const protectedProps=mergeProps({},JSON.parse('{"__proto__":{"poison":true}}'));assert.equal(Object.getPrototypeOf(protectedProps),Object.prototype);assert.equal(Object.hasOwn(protectedProps,'__proto__'),true);assert.equal({}.poison,undefined);
 const defaults={camera:{angle:20,distance:8},array:[1,2,3]};assert.deepEqual(mergeProps(defaults,{camera:{angle:40},array:[9]}),{camera:{angle:40,distance:8},array:[9]});assert.deepEqual(mergeProps(defaults,{camera:{}}),defaults);
 const controls=normalizeControls({version:1,fields:[{key:'angle',path:'/camera/angle',type:'number'}]});assert.deepEqual(projectControlProps(defaults,{camera:{distance:12}},controls,[{id:'root',props:{angle:50}}]).camera,{angle:50,distance:12});assert.deepEqual(projectControlProps(defaults,{camera:{}},controls,[{id:'root',props:{angle:null}}]),defaults);
 const root=testRoot(),values=[];const host=await mountRenderer(scene({defaultProps:defaults,async create({props}){return {render(){values.push(structuredClone(props));},dispose(){}};}}),{root,props:{camera:{angle:40}}});await host.render({frame:0});await host.render({frame:0},{camera:{}});assert.deepEqual(values,[{...defaults,camera:{angle:40,distance:8}},defaults]);await host.dispose();
});

test('timed-out frames are detached and cannot overwrite a new mount',async()=>{
 const root=testRoot();let finish,oldSurface,disposals=0,signal;
 const old=await mountRenderer(scene({async create(context){oldSurface=context.root;signal=context.signal;return {async render(){await new Promise(resolve=>finish=resolve);oldSurface.paint='late';},dispose(){disposals++;}};}}),{root,timeoutMs:5});
 await assert.rejects(old.render({frame:1}),/timed out/);assert.equal(old.disposed,true);assert.equal(signal.aborted,true);assert.equal(root.children.length,0);await assert.rejects(old.render({frame:2}),/disposed/);
 const next=await mountRenderer(scene({async create({root}){return {render(){root.paint='new';},dispose(){}};}}),{root});await next.render({frame:2});
 finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(root.children[0].paint,'new');assert.equal(oldSurface.paint,'late');await old.dispose();assert.equal(disposals,1);await next.dispose();assert.equal(root.children.length,0);
});
test('late preparation and cleanup cannot remove a replacement mount',async()=>{
 const root=testRoot();let finish,cleanups=0;
 const rejected=mountRenderer(scene({create:()=>new Promise(resolve=>finish=resolve)}),{root,timeoutMs:5});await assert.rejects(rejected,/timed out/);
 const next=await mountRenderer(scene(),{root});finish({render(){},dispose(){cleanups++;}});await new Promise(resolve=>setImmediate(resolve));assert.equal(cleanups,1);assert.equal(root.children.length,1);await next.dispose();
});
test('instance values, explicit reset, undo and rebind agree without freezing defaults',()=>{
 const {d,s,id}=setup();const props=()=>sampledRendererProps(d.scene,d.template,s.clip(id),s.values(s.clip(id),0));
 s.execute({type:'payload',clip:id,payload:{...s.clip(id).payload,props:{subject:{radius:25},opaque:{kept:true}}}});
 assert.equal(s.capabilities(id).anchors[0].values.size,25);assert.equal(props().subject.radius,25);
 const before=s.serialize();s.execute({type:'set',clip:id,anchor:'subject',property:'size',value:null});assert.equal(props().subject.radius,10);assert.equal(s.capabilities(id).anchors[0].values.size,10);assert.equal(props().opaque.kept,true);
 s.undo();assert.deepEqual(s.doc,Studio.restore(before,d.templates,s.binding).doc);assert.equal(props().subject.radius,25);s.redo();assert.equal(props().subject.radius,10);
 const changed=normalizeClipModule({default:scene({controls,defaultProps:{subject:{radius:30}}})}),restored=Studio.restore(s.serialize(),changed.templates,s.binding);
 assert.equal(sampledRendererProps(changed.scene,changed.template,restored.clip(id),restored.values(restored.clip(id),0)).subject.radius,30);assert.equal(restored.capabilities(id).anchors[0].values.size,30);
 const revision=s.revision;s.execute({type:'set',clip:id,anchor:'subject',property:'size',value:null});assert.equal(s.revision,revision);
});
test('resetting an array component keeps other instance values and follows authored defaults',()=>{
 const controls={version:1,fields:[{key:'x',anchor:'point',path:'/position/0',type:'number'}]};
 const {d,s,id}=setup(scene({controls,defaultProps:{position:[1,2,3]}}));s.execute({type:'payload',clip:id,payload:{...s.clip(id).payload,props:{position:[4,5,6]}}});assert.equal(s.capabilities(id).anchors[0].values.x,4);
 s.execute({type:'set',clip:id,anchor:'point',property:'x',value:null});assert.deepEqual(sampledRendererProps(d.scene,d.template,s.clip(id),s.values(s.clip(id),0)).position,[1,5,6]);
 const changed=normalizeClipModule({default:scene({controls,defaultProps:{position:[8,9,10]}})}),restored=Studio.restore(s.serialize(),changed.templates,s.binding);
 assert.deepEqual(sampledRendererProps(changed.scene,changed.template,restored.clip(id),restored.values(restored.clip(id),0)).position,[8,5,6]);
 assert.throws(()=>s.execute({type:'payload',clip:id,payload:{...s.clip(id).payload,resetControls:['missing']}}),/reset control/);
});
