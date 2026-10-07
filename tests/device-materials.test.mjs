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
