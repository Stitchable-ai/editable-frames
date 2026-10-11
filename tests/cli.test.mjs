import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {root} from '../scripts/build.mjs';
const cli=(...args)=>JSON.parse(execFileSync(process.execPath,[path.join(root,'bin/editableframes.mjs'),...args],{encoding:'utf8'}));
test('standalone CLI: init, inspect, stale rejection, undo/redo and skill installation',async()=>{const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-cli-')),dir=path.join(tmp,'clip');try{
 cli('init',dir);const c=cli('inspect',dir),file=path.join(tmp,'proposal.json');await fs.writeFile(file,JSON.stringify({baseRevision:c.baseRevision,command:{type:'set',clip:c.clip,anchor:'hero',property:'accent',value:'#ff8866'}}));cli('apply',dir,file);assert.equal(cli('inspect',dir).anchors[0].values.accent,'#ff8866');assert.throws(()=>cli('apply',dir,file));cli('undo',dir);assert.equal(cli('inspect',dir).anchors[0].values.accent,'#b9ef78');cli('redo',dir);assert.equal(cli('inspect',dir).anchors[0].values.accent,'#ff8866');
 assert.match(execFileSync(process.execPath,[path.join(root,'bin/editableframe.mjs'),'help'],{encoding:'utf8'}),/EditableFrames/);
 const skill=path.join(tmp,'skill');cli('install-skill','generic',skill);assert.match(execFileSync(process.execPath,[path.join(skill,'scripts/editableframes.mjs'),'help'],{encoding:'utf8'}),/EditableFrames/);
 }finally{await fs.rm(tmp,{recursive:true,force:true})}});
test('source rebind retains compatible edits and archives incompatible projects',async()=>{const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-rebind-')),dir=path.join(tmp,'clip');try{cli('init',dir);const file=path.join(dir,'clip.mjs'),before=cli('inspect',dir);let code=await fs.readFile(file,'utf8');await fs.writeFile(file,code.replace("ctx.fillStyle='#121b26'","ctx.fillStyle='#181b26'"));assert.throws(()=>cli('inspect',dir));const result=cli('rebind',dir);assert.notEqual(result.binding,before.binding);assert.equal(cli('inspect',dir).clip,before.clip);assert.ok(await fs.stat(result.backup));await fs.writeFile(file,code.replace("radius:160","radius:160,extra:1").replace("radius:{type:","extra:{type:'number',min:0,max:2,label:'Extra'},radius:{type:"));assert.throws(()=>cli('rebind',dir));cli('rebind',dir,'--reset');assert.equal(cli('inspect',dir).anchors[0].values.extra,1)}finally{await fs.rm(tmp,{recursive:true,force:true})}});

test('portable CLI starter and exact public documentation compile outside the checkout',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-portable-cli-')),dir=path.join(tmp,'scene');
 try{
  cli('init',dir,'--renderer');const c=cli('inspect',dir);assert.equal(c.anchors[0].id,'orb');assert.equal(c.anchors[0].values.color,'#38bdf8');
  const guide=await fs.readFile(path.join(root,'docs/renderer-contract.md'),'utf8');assert.equal(await fs.readFile(path.join(root,'skills/editableframes/references/renderer.md'),'utf8'),guide);
  const code=guide.match(/```js\n([\s\S]*?)```/)[1];await fs.writeFile(path.join(dir,'clip.mjs'),code);cli('rebind',dir,'--reset');assert.deepEqual(cli('inspect',dir).anchors,[]);
  const {readProject}=await import('../scripts/project.mjs');const d=await readProject(dir);assert.equal(d.kind,'renderer');assert.deepEqual(d.studio.doc.fps,{num:30,den:1});assert.equal(d.studio.doc.width,640);
 }finally{await fs.rm(tmp,{recursive:true,force:true})}
});
