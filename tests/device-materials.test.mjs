import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {prepareMaterials,createDeviceMaterial} from '../packages/three/studio-lighting.mjs';
const renderer={capabilities:{getMaxAnisotropy:()=>8}};
const mesh=(name,material)=>{const m=new T.Mesh(new T.BoxGeometry(),material);m.name=name;return m};
test('generated chassis defaults to metal and allows explicit artistic overrides',()=>{
 const metal=createDeviceMaterial();assert.equal(metal.metalness,1);assert.equal(metal.roughness,.26);
 const plastic=createDeviceMaterial({metalness:0,roughness:.8});assert.equal(plastic.metalness,0);assert.equal(plastic.roughness,.8);
});
test('imported finish changes are reversible and isolate shared source materials',()=>{
 const source=new T.MeshPhysicalMaterial({color:'white',metalness:0,roughness:.7,specularIntensity:0});
 source.name='Frame';source.metalnessMap=new T.Texture();source.roughnessMap=new T.Texture();
 const root=new T.Group(),body=mesh('Chassis',source),glass=mesh('Glass',source);root.add(body,glass);
 const rig=prepareMaterials(root,renderer);
 assert.equal(body.material.metalness,1);assert.equal(body.material.metalnessMap,null);
 assert.equal(glass.material.metalness,0);assert.equal(glass.material.roughnessMap,source.roughnessMap);
 assert.equal(source.metalness,0);assert.equal(body.material.specularIntensity,1);
 rig.apply('authored');assert.equal(body.material.metalness,0);assert.equal(body.material.metalnessMap,source.metalnessMap);assert.equal(body.material.color.getHex(),source.color.getHex());
 rig.apply('aluminium');assert.equal(body.material.metalness,1);assert.equal(glass.material.metalness,0);
 assert.throws(()=>rig.apply('fake'),/Unknown device finish/);
});
test('opaque names require reviewed roles or explicit author intent; mismatched profiles are skipped',()=>{
 const root=new T.Group(),body=mesh('part-1',new T.MeshStandardMaterial({metalness:0}));root.add(body);
 const profiles={phone:{modelSha256:'good',roles:{'part-1':'body'}}};
 const bad=prepareMaterials(root,renderer,{id:'phone',runtimeSha256:'bad'},profiles);assert.equal(body.material.metalness,0);assert.match(bad.inspect().warning,/different GLB hash/);
 const good=prepareMaterials(root,renderer,{id:'phone',runtimeSha256:'good'},profiles);assert.equal(body.material.metalness,1);good.apply(false);assert.equal(body.material.metalness,0);
 const explicit=prepareMaterials(root,renderer,{}, {},{roles:{'part-1':'body'},finish:'authored'});assert.equal(body.material.metalness,0);explicit.apply(true);assert.equal(body.material.metalness,1);
});

test('website adds controls to old sessions without losing edits or undo/redo',async()=>{
 const {Studio}=await import('../packages/core/index.mjs');
 const {migrateDeviceSession}=await import('../website/vendor/migrate-device.mjs');
 const {readFile}=await import('node:fs/promises');
 const studies=JSON.parse(await readFile(new URL('../website/src/data/studies.json',import.meta.url),'utf8'));
 const templates=Object.fromEntries(studies.map(s=>[s.id,s])),old=structuredClone(templates);
 delete old['reference.device'].nodes[0].props.finish;delete old['reference.device'].nodes[0].props.reflections;
 delete old['reference.device'].schemas.device.finish;delete old['reference.device'].schemas.device.reflections;
 const s=new Studio(old,{binding:'same'});s.doc.clips=[s.make('reference.device')];s.base=structuredClone(s.doc);
 s.execute({type:'set',clip:s.doc.clips[0].id,anchor:'device.direction',property:'brand',value:'SAVED'});
 const upgraded=Studio.restore(migrateDeviceSession(s.serialize()),templates,'same');
 assert.equal(upgraded.doc.clips[0].nodes[0].props.brand,'SAVED');assert.equal(upgraded.doc.clips[0].nodes[0].props.finish,'aluminium');
 upgraded.undo();assert.equal(upgraded.doc.clips[0].nodes[0].props.brand,'NORTH');upgraded.redo();assert.equal(upgraded.doc.clips[0].nodes[0].props.brand,'SAVED');
 assert.equal(migrateDeviceSession(upgraded.serialize()),upgraded.serialize());
});

test('an explicit authored role also takes priority over a reviewed correction',()=>{
 const root=new T.Group(),body=mesh('Housing',new T.MeshPhysicalMaterial({metalness:0}));body.material.name='Anodized_aluminum';root.add(body);
 const profiles={phone:{modelSha256:'good',materials:{Anodized_aluminum:{values:{metalness:1}}}}};
 prepareMaterials(root,renderer,{id:'phone',runtimeSha256:'good'},profiles,{roles:{Housing:'authored'}});
 assert.equal(body.material.metalness,0);
});

test('iPhone 12 separates the merged front bezel while preserving screen geometry and authored override',async()=>{
 const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');
 const bytes=await readFile(new URL('../website/public/devices/cody-iphone-12.glb',import.meta.url));
 const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length));
 function attribute(id){
  const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView];const size=a.type==='VEC3'?3:1;
  const out=a.componentType===5126?new Float32Array(a.count*size):new Uint32Array(a.count*size);
  const start=28+length+(v.byteOffset??0)+(a.byteOffset??0),stride=v.byteStride??size*4;
  for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)out[i*size+k]=a.componentType===5126?bytes.readFloatLE(start+i*stride+k*4):bytes.readUInt32LE(start+i*stride+k*4);
  return new T.BufferAttribute(out,size);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',attribute(3));geometry.setIndex(attribute(0));
 const root=new T.Group(),frame=new T.Mesh(geometry,new T.MeshStandardMaterial({color:'white',metalness:0,roughness:.7}));frame.name='Frame';frame.material.name='Frame';root.add(frame);
 const profiles=JSON.parse(await readFile(new URL('../packages/three/material-profiles.json',import.meta.url),'utf8'));
 const rig=prepareMaterials(root,renderer,{id:'cody-iphone-12',runtimeSha256:createHash('sha256').update(bytes).digest('hex')},profiles);
 assert.equal(frame.geometry.index.count,geometry.index.count);assert.deepEqual(frame.geometry.attributes.position.array,geometry.attributes.position.array);
 assert.equal(frame.geometry.groups.length,2);assert.ok(frame.geometry.groups[1].count>10000);
 assert.equal(frame.material[0].metalness,1);assert.equal(frame.material[1].metalness,0);assert.equal(frame.material[1].color.getHexString(),'090c10');
 rig.apply('authored');assert.equal(frame.material[1].color.getHexString(),'ffffff');assert.equal(frame.material[0].metalness,0);
 rig.apply('aluminium');assert.equal(frame.material[1].color.getHexString(),'090c10');
 const untouched=new T.Mesh(geometry,new T.MeshStandardMaterial());untouched.name='Frame';
 prepareMaterials(untouched,renderer,{id:'cody-iphone-12',runtimeSha256:'wrong'},profiles);assert.equal(untouched.geometry,geometry);assert.ok(!Array.isArray(untouched.material));
});
