import test from 'node:test';import assert from 'node:assert/strict';
import {Matrix4,Vector3,Quaternion} from 'three';
import {normalizeControls,controlsIdentity} from '../packages/core/controls.mjs';
import {slerpQuaternion,sameOrientation} from '../packages/core/rotation.mjs';
import {negotiateSpatial,createSpatialSession} from '../packages/core/spatial-session.mjs';
import {rigidParent,pivotMatrix,worldPivotToPosition,constrainTranslation,positiveScale} from '../packages/three/spatial-math.mjs';
import {cinemaScene} from '../examples/scene-editor/cinema.mjs';
import {normalizeClipModule,sampledRendererProps} from '../packages/core/definition.mjs';
import {Studio} from '../packages/core/index.mjs';
const schema={version:1,fields:[{key:'p',anchor:'a',type:'vec3',default:[0,0,0],role:'position',unit:'world-unit',coordinateSpace:'local',animatable:true},{key:'other',anchor:'a',type:'number',default:0}]};
const identity=()=>({clipId:'clip',revision:'revision',sourceRevision:'source',seekGeneration:0,rendererInstance:1,bindingGeneration:1,viewRevision:0,viewportRevision:0,shot:'wide',clock:{frame:0,fps:24}});
const capabilities={gestureProtocols:[2],bindings:[{id:'placement',operations:{translate:{handles:['x'],spaces:['world'],keys:['p']}}}]};
const begin=(session,i)=>session.begin({trusted:true,identity:i,anchor:'a',capabilities,bindingId:'placement',operation:'translate',handle:'x',space:'world'});
test('v1 identity stays byte-compatible; v2 rotation sampling survives persistence',()=>{
 const v1=normalizeControls(schema);assert.equal(controlsIdentity(v1),JSON.stringify(v1.fields.map(({key,anchor,property,path,type,unit,coordinateSpace,role,animatable,interpolation})=>({key,anchor,property,path,type,unit:unit??null,coordinateSpace:coordinateSpace??null,role:role??null,animatable,interpolation})).sort((a,b)=>a.key.localeCompare(b.key))));
 const scene=cinemaScene('battle'),d=normalizeClipModule({default:scene}),studio=new Studio(d.templates,{binding:'test'});studio.doc.clips=[studio.make(scene.id)];studio.base=structuredClone(studio.doc);const clip=studio.doc.clips[0];
 studio.execute({type:'keyframes',clip:clip.id,anchor:'lead',property:'orientation',keys:[{time:0,value:[0,0,0,1],easing:'linear'},{time:1,value:[0,1,0,0],easing:'linear'}]});
 const restored=Studio.restore(studio.serialize(),d.templates,'test');const props=sampledRendererProps(scene,d.template,restored.clip(clip.id),restored.values(restored.clip(clip.id),60000));assert.ok(sameOrientation(props.actors.lead.orientation,[0,Math.SQRT1_2,0,Math.SQRT1_2]));
 assert.throws(()=>normalizeControls({...schema,fields:[{...schema.fields[0],type:'quaternion'}]}));
});
test('180-degree rotation ties are invariant to all endpoint signs',()=>{
 const a=[0,0,0,1],b=[0,1,0,0],expected=slerpQuaternion(a,b,.5);
 for(const x of [a,a.map(v=>-v)])for(const y of [b,b.map(v=>-v)])assert.ok(sameOrientation(expected,slerpQuaternion(x,y,.5)));
});
test('pivot conventions round trip under rotated scaled ancestry',()=>{
 const parent=rigidParent(new Matrix4().compose(new Vector3(3,2,1),new Quaternion().setFromAxisAngle(new Vector3(0,0,1),.6),new Vector3(2,2,2)));
 const pivot=new Vector3(1,.2,0),position=new Vector3(.3,.4,.5),quaternion=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),.8),scale=1.4;
 for(const convention of ['pivot','trs']){const worldPivot=pivot.clone().applyMatrix4(pivotMatrix(position,quaternion,scale,pivot,convention)).applyMatrix4(parent.matrix);assert.ok(worldPivotToPosition(worldPivot,{parent,pivot,quaternion,scale,convention}).distanceTo(position)<1e-10);}
 assert.throws(()=>rigidParent(new Matrix4().makeScale(1,2,1)));assert.throws(()=>rigidParent(new Matrix4().makeScale(-1,1,1)));
});
test('bounds and snapping preserve world-axis direction under transformed parents',()=>{
 const parent=rigidParent(new Matrix4().compose(new Vector3(10,3,0),new Quaternion().setFromAxisAngle(new Vector3(0,0,1),Math.PI/4),new Vector3(2,2,2))),startLocal=new Vector3(.3,.2,0),basisWorld=[new Vector3(1,0,0)];
 const end=constrainTranslation({startLocal,basisWorld,parent,desired:[1],min:0,max:1,snap:.5});const delta=end.clone().applyMatrix4(parent.matrix).sub(startLocal.clone().applyMatrix4(parent.matrix));assert.ok(Math.abs(delta.y)<1e-9);assert.ok(delta.x>0&&delta.x<1);assert.ok(end.y>=-1e-9);
 const plane=constrainTranslation({startLocal:new Vector3(.5,.5,0),basisWorld:[new Vector3(1,0,0),new Vector3(0,1,0)],parent:rigidParent(new Matrix4()),desired:[2,2],min:0,max:1,snap:.7});assert.deepEqual(plane.toArray(),[1,1,0]);
 assert.equal(positiveScale(-2),.001);assert.equal(positiveScale(1.2,{snap:.5}),1);assert.throws(()=>positiveScale(NaN));
});
test('v1 controls negotiate v2 independently; operation keys and presentation are enforced',()=>{
 assert.equal(negotiateSpatial({host:[2],transport:[1],adapter:[2]}),null);let i=identity(),count=0;const s=createSpatialSession({controls:schema,readIdentity:()=>i,publish:()=>count++});const b=begin(s,i);assert.throws(()=>s.update({id:b.id,values:{other:1}}));i={...i,viewRevision:1};assert.throws(()=>s.update({id:b.id,values:{p:[1,0,0]}}),/Stale/);assert.equal(s.state,null);assert.equal(count,0);
});
test('release fixes final value; cancellation and uncertain publication have distinct boundaries',async()=>{
 let i=identity(),published=[],resolve;const s=createSpatialSession({controls:schema,readIdentity:()=>i,publish:async p=>{published.push(p);return {id:p.id}}});let b=begin(s,i);s.update({id:b.id,values:{p:[1,0,0]}});const releasing=s.release({id:b.id,trusted:true,evaluate:()=>new Promise(r=>resolve=r)});assert.equal(s.state.phase,'finalizing');assert.ok(s.cancel(b.id));resolve({values:{p:[2,0,0]}});assert.equal((await releasing).status,'cancelled');assert.equal(published.length,0);
 b=begin(s,i);await s.release({id:b.id,trusted:true,evaluate:()=>({values:{p:[3,0,0]}})});assert.equal(published.length,1);assert.deepEqual(published[0].values.p,[3,0,0]);
 let receipt;const u=createSpatialSession({controls:schema,readIdentity:()=>i,publish:p=>{receipt={id:p.id};throw Error('lost acknowledgment')},reconcile:()=>({status:'committed',receipt})});b=begin(u,i);assert.equal((await u.release({id:b.id,trusted:true,evaluate:()=>({values:{p:[4,0,0]}})})).status,'uncertain');assert.equal(u.cancel(b.id),false);assert.equal((await u.reconcile()).status,'committed');assert.equal(u.state,null);
});
test('failed final evaluation never commits an earlier draft',async()=>{let i=identity(),count=0;const s=createSpatialSession({controls:schema,readIdentity:()=>i,publish:()=>count++});const b=begin(s,i);s.update({id:b.id,values:{p:[1,0,0]}});await assert.rejects(s.release({id:b.id,trusted:true,evaluate:()=>{throw Error('bad final point')}}));assert.equal(count,0);assert.equal(s.state,null);});

test('missing or incomplete final values cannot publish an earlier draft',async()=>{
 for(const result of [null,undefined,{}, {values:{} }]){let count=0;const i=identity(),s=createSpatialSession({controls:schema,readIdentity:()=>i,publish:()=>count++}),b=begin(s,i);s.update({id:b.id,values:{p:[1,0,0]}});await assert.rejects(s.release({id:b.id,trusted:true,evaluate:()=>result}));assert.equal(count,0);assert.equal(s.state,null);}
});
test('translation boundary roundoff passes strict control validation and preserves world axis',async()=>{
 const {validateControlValue}=await import('../packages/core/controls.mjs');
 const parent=rigidParent(new Matrix4().compose(new Vector3(10,3,0),new Quaternion().setFromAxisAngle(new Vector3(0,0,1),15/37),new Vector3(2,2,2))),startLocal=new Vector3(.3,.2,.1);
 const end=constrainTranslation({parent,startLocal,basisWorld:[new Vector3(1,0,0)],desired:[2],min:0,max:1});validateControlValue({key:'p',type:'vec3',min:0,max:1},end.toArray());
 const delta=end.clone().applyMatrix4(parent.matrix).sub(startLocal.clone().applyMatrix4(parent.matrix));assert.ok(Math.abs(delta.y)<1e-12&&Math.abs(delta.z)<1e-12);
 const reverse=constrainTranslation({parent,startLocal,basisWorld:[new Vector3(1,0,0)],desired:[.1],min:0,max:1});assert.ok(reverse.y>0);
});
test('picking follows a deformed skinned mesh after its initial raycast',async()=>{
 const T=await import('three'),{ThreeSpatialEditor}=await import('../packages/three/spatial-editor.mjs'),{normalizeObjectHierarchy}=await import('../packages/core/objects.mjs');
 const geometry=new T.BoxGeometry(1,1,1),n=geometry.attributes.position.count,indices=new Uint16Array(n*4),weights=new Float32Array(n*4);for(let i=0;i<n;i++)weights[i*4]=1;
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial()),bone=new T.Bone();mesh.add(bone);mesh.bind(new T.Skeleton([bone]));
 const scene=new T.Scene();scene.add(mesh);const camera=new T.OrthographicCamera(-10,10,5,-5,.1,100);camera.position.z=10;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const editor=Object.assign(Object.create(ThreeSpatialEditor.prototype),{camera,icons:[],raycaster:new T.Raycaster(),objects:{actor:{object:mesh}},rows:normalizeObjectHierarchy([{id:'actor'}],['actor']),width:1280,height:720});
 assert.equal(editor.pick({x:640,y:360},scene),'actor');bone.position.x=4;assert.equal(editor.pick({x:896,y:360},scene),'actor');assert.equal(editor.pick({x:640,y:360},scene),null);geometry.dispose();mesh.material.dispose();
});
test('local scene models reject external texture and buffer dependencies',async()=>{
 const {validateGLB}=await import('../examples/scene-editor/build.mjs');
 const glb=data=>{const text=Buffer.from(JSON.stringify(data)),padded=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(padded);const b=Buffer.alloc(20+padded.length);b.writeUInt32LE(0x46546c67,0);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);b.writeUInt32LE(padded.length,12);b.writeUInt32LE(0x4e4f534a,16);padded.copy(b,20);return b;};
 assert.doesNotThrow(()=>validateGLB(glb({asset:{version:'2.0'},buffers:[{byteLength:4}],images:[{uri:'data:image/png;base64,AA=='}]})));
 assert.throws(()=>validateGLB(glb({images:[{uri:'https://example.com/texture.png'}]})),/external/);assert.throws(()=>validateGLB(glb({buffers:[{uri:'model.bin'}]})),/external/);
});

test('stale release cancels the draft and permits the next gesture',async()=>{
 let i=identity(),published=0,evaluated=0;const s=createSpatialSession({controls:schema,readIdentity:()=>i,publish:()=>published++});
 const b=begin(s,i);s.update({id:b.id,values:{p:[1,0,0]}});i={...i,viewRevision:1};
 await assert.rejects(s.release({id:b.id,trusted:true,evaluate:()=>{evaluated++;return {values:{p:[2,0,0]}};}}),/Stale/);
 assert.equal(s.state,null);assert.equal(published,0);assert.equal(evaluated,0);
 const next=begin(s,i);await s.release({id:next.id,trusted:true,evaluate:()=>({values:{p:[3,0,0]}})});assert.equal(published,1);
});
test('duplicate release does not cancel the original final evaluation',async()=>{
 const i=identity();let resolve,published=0;const s=createSpatialSession({controls:schema,readIdentity:()=>i,publish:()=>published++}),b=begin(s,i);
 const releasing=s.release({id:b.id,trusted:true,evaluate:()=>new Promise(r=>resolve=r)});
 await assert.rejects(s.release({id:b.id,trusted:true,evaluate:()=>({values:{p:[2,0,0]}})}),/already released/);
 assert.equal(s.state.phase,'finalizing');resolve({values:{p:[1,0,0]}});assert.equal((await releasing).status,'committed');assert.equal(published,1);
});
test('screen-plane drag follows a parented camera in both manipulation spaces',async()=>{
 const T=await import('three'),{ThreeSpatialEditor}=await import('../packages/three/spatial-editor.mjs');
 for(const space of ['world','local']){
  const object=new T.Object3D(),scene=new T.Scene(),rig=new T.Group(),camera=new T.PerspectiveCamera(45,1280/720,.1,100);scene.add(object,rig);rig.rotation.set(.2,Math.PI/4,.1);rig.add(camera);camera.position.z=5;scene.updateMatrixWorld(true);
  const e=new ThreeSpatialEditor({controls:schema,props:{p:[0,0,0]},objects:{a:{object}},camera,width:1280,height:720});
  try{e.setSelection('a');e.setMode('translate',space);e.begin({operation:'translate',handle:'screen',space},{x:640,y:360});const delta=new T.Vector3(...e.update({x:740,y:360}).values.p);
   const worldQ=camera.getWorldQuaternion(new T.Quaternion()),right=new T.Vector3(1,0,0).applyQuaternion(worldQ),forward=camera.getWorldDirection(new T.Vector3());
   assert.ok(delta.length()>.1);assert.ok(Math.abs(delta.dot(forward))<1e-10);assert.ok(delta.clone().normalize().distanceTo(right)<1e-10);
  }finally{e.end();e.dispose();}
 }
});
test('small authored scale intervals remain valid through drag, snap and reversal',async()=>{
 const T=await import('three'),{ThreeSpatialEditor}=await import('../packages/three/spatial-editor.mjs'),{validateControlValue}=await import('../packages/core/controls.mjs');
 const field={key:'s',anchor:'a',path:'/s',type:'number',role:'scale',min:.0001,max:.0005,animatable:true},object=new T.Object3D(),scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1280/720,.1,100);scene.add(object);object.scale.setScalar(.0002);camera.position.z=5;camera.updateMatrixWorld(true);
 const e=new ThreeSpatialEditor({controls:{version:1,fields:[field]},props:{s:.0002},objects:{a:{object}},camera,width:1280,height:720});
 try{e.setSelection('a');e.setMode('scale','local');e.begin({operation:'scale',handle:'uniform',space:'local'},{x:650,y:360});
  for(const [x,expected] of [[652,.00024],[630,.0001],[652,.00024],[680,.0005]]){const value=e.update({x,y:360}).values.s;validateControlValue(field,value);assert.ok(Math.abs(value-expected)<1e-12);}
 }finally{e.end();e.dispose();}
 assert.equal(positiveScale(.0002,{min:.0001,max:.0005,snap:.1}),.0001);
 assert.equal(positiveScale(-1,{max:.0005}),.0005);assert.equal(positiveScale(-1),.001);
 assert.throws(()=>positiveScale(1,{min:.2,max:.1}),/bounds/);assert.throws(()=>positiveScale(1,{max:0}),/bounds/);
});
