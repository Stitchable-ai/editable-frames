import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {init,importAsset,readProject} from '../scripts/project.mjs';import {fileHash} from '../scripts/media.mjs';import {run,ffmpeg} from '../scripts/process.mjs';import {render} from '../scripts/render.mjs';

test('import validates copied media and JSON before publishing; failed candidates preserve project',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-import-')),dir=path.join(tmp,'project');
 try{
  await init(dir);const video=path.join(tmp,'valid.mp4'),image=path.join(tmp,'valid.png'),audio=path.join(tmp,'valid.wav');
  await run(ffmpeg(),['-v','error','-f','lavfi','-i','testsrc2=size=128x96:rate=24','-t','1','-c:v','libx264','-movflags','+faststart',video]);
  await run(ffmpeg(),['-v','error','-f','lavfi','-i','color=red:s=32x32','-frames:v','1',image]);
  await run(ffmpeg(),['-v','error','-f','lavfi','-i','sine=frequency=440:duration=0.1',audio]);
  const raw=await fs.readFile(path.join(dir,'project.json')),before=await readProject(dir);
  const snapshot=async()=>({manifest:await fs.readFile(path.join(dir,'assets.json'),'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e}),assets:await fs.readdir(path.join(dir,'assets')).catch(e=>{if(e.code==='ENOENT')return [];throw e})});
  const bytes=await fs.readFile(video),invalid=[['bad.mp4',Buffer.from('not a movie')],['bad.png',Buffer.from('not an image')],['bad.wav',Buffer.from('RIFF')],['bad.json',Buffer.from('{')],['truncated.mp4',bytes.subarray(0,Math.floor(bytes.length*.65))]];
  for(const [name,body]of invalid){const f=path.join(tmp,name);await fs.writeFile(f,body);const old=await snapshot();await assert.rejects(importAsset(dir,'candidate',f));assert.deepEqual(await snapshot(),old,name);assert.deepEqual(await fs.readFile(path.join(dir,'project.json')),raw);assert.equal((await readProject(dir)).revision,before.revision);}
  for(const [id,file]of [['movie',video],['picture',image],['sound',audio]]){const r=await importAsset(dir,id,file);assert.equal(r.sha256,await fileHash(file));assert.ok(r.probe);}
  const old=await snapshot();await assert.rejects(importAsset(dir,'movie',video),/immutable/);assert.deepEqual(await snapshot(),old);
  const badTrack=path.join(tmp,'track.json');await fs.writeFile(badTrack,'{}');await assert.rejects(importAsset(dir,'badtrack',badTrack,{role:'track',of:'movie'}));assert.deepEqual(await snapshot(),old);
  const analysis=path.join(tmp,'analysis.json'),digest=await fileHash(video);
  await fs.writeFile(analysis,JSON.stringify({version:1,kind:'prepared-plate',source:{asset:'movie',sha256:digest,width:128,height:96,frames:24,frameRate:{num:24,den:1},orientation:0,crop:[0,0,128,96],pts:Array.from({length:24},(_,i)=>i/24)},subject:'person',revision:'0'.repeat(64),provenance:{method:'fixture',preprocess:'none'},alpha:{asset:'missing',sha256:digest,channel:'luminance',semantics:'alpha'},frames:Array.from({length:24},(_,i)=>({sourceFrame:i,maskFrame:i,valid:true,reviewed:false}))}));
  await assert.rejects(importAsset(dir,'analysis',analysis,{role:'analysis',of:'movie'}),/Prepared alpha identity/);assert.deepEqual(await snapshot(),old);
  const short=path.join(tmp,'short.mp4');await run(ffmpeg(),['-v','error','-f','lavfi','-i','color=white:s=128x96:r=24','-frames:v','4',short]);await assert.rejects(importAsset(dir,'mask',short,{role:'matte',of:'movie'}),/match its plate/);assert.deepEqual(await snapshot(),old);
 }finally{await fs.rm(tmp,{recursive:true,force:true})}
});

test('import pins the copied bytes when the source changes at copy time',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-import-race-')),dir=path.join(tmp,'project'),source=path.join(tmp,'values.json');const copy=fs.copyFile;
 try{await init(dir);await fs.writeFile(source,'{"value":1}');fs.copyFile=async(src,...args)=>{if(src===source)await fs.writeFile(source,'{"value":2}');return copy(src,...args)};
  const result=await importAsset(dir,'data',source);assert.equal(result.sha256,await fileHash(source));const d=await (await import('../scripts/project.mjs')).definition(dir);assert.equal(d.assets.data.sha256,result.sha256);assert.equal(await fs.readFile(d.assets.data.file,'utf8'),'{"value":2}');
 }finally{fs.copyFile=copy;await fs.rm(tmp,{recursive:true,force:true})}
});

test('expected export identity refuses a stale gate before allocating output',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-export-gate-')),dir=path.join(tmp,'project'),output=path.join(tmp,'absent','clip.mp4');
 try{await init(dir);const d=await readProject(dir);await assert.rejects(render(dir,output,{expectRevision:'old'}),/Stale export revision/);await assert.rejects(render(dir,output,{expectRevision:d.revision,expectBinding:'old'}),/Stale export binding/);await assert.rejects(fs.stat(path.dirname(output)),{code:'ENOENT'});}finally{await fs.rm(tmp,{recursive:true,force:true})}
});
