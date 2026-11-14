import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {init,mutate} from '../scripts/project.mjs';
import {recoverJobs} from '../scripts/jobs.mjs';
const cli=path.resolve(import.meta.dirname,'../bin/editableframes.mjs');
const exists=p=>fs.lstat(p).then(()=>true,()=>false);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// A decoder stand-in deliberately waits at the strict-decode boundary. No production fault hook.
// The real CLI must abort its child, wait for its exit, remove staging and release the edit lock.
for(const [signal,exitCode] of [['SIGINT',130],['SIGTERM',143],['SIGHUP',129]]){
 test(`asset-add ${signal} cancels decode and leaves the project editable`,{skip:process.platform==='win32',timeout:20000},async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-cancel-')),dir=path.join(tmp,'project'),marker=path.join(tmp,'decoder.json');let child,done;
  try{
   await init(dir);const before=await fs.readFile(path.join(dir,'project.json'),'utf8');
   const decoder=path.join(tmp,'decoder');await fs.writeFile(decoder,"#!/usr/bin/env node\nimport('node:fs').then(fs=>{fs.writeFileSync(process.env.EF_TEST_MARKER,JSON.stringify({pid:process.pid,args:process.argv.slice(2)}));setInterval(()=>{},1000)});\n",{mode:0o700});
   const input=path.join(tmp,'candidate.mp4');await fs.writeFile(input,'fixture bytes; decoder deliberately waits');
   child=spawn(process.execPath,[cli,'asset-add',dir,'cancelled',input],{env:{...process.env,PATH:path.dirname(process.execPath)+path.delimiter+process.env.PATH,FFMPEG_PATH:decoder,EF_TEST_MARKER:marker},stdio:['ignore','pipe','pipe']});
   let stderr='';child.stderr.on('data',b=>stderr+=b);done=new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
   const deadline=Date.now()+10000;while(!await exists(marker)&&Date.now()<deadline&&child.exitCode===null)await sleep(10);
   assert.ok(await exists(marker),stderr);const decoderInfo=JSON.parse(await fs.readFile(marker));assert.ok(decoderInfo.args.includes('-xerror'));
   child.kill(signal);const result=await done;assert.deepEqual(result,{code:exitCode,signal:null},stderr);
   assert.equal(await exists(path.join(dir,'.editableframe-edit.lock')),false);
   assert.deepEqual((await fs.readdir(path.join(dir,'assets'))).filter(n=>n.startsWith('.import-')),[]);
   assert.equal(await fs.readFile(path.join(dir,'project.json'),'utf8'),before);
   assert.equal(await exists(path.join(dir,'assets.json')),false);
   assert.throws(()=>process.kill(decoderInfo.pid,0),e=>e.code==='ESRCH');
   await mutate(dir,()=>{});
  }finally{if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await done}await fs.rm(tmp,{recursive:true,force:true})}
 });
}

test('recover dry run does not create or mutate the registry',{timeout:10000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-dry-run-')),state=path.join(tmp,'state'),saved=process.env.EDITABLEFRAMES_STATE_DIR;
 try{
  process.env.EDITABLEFRAMES_STATE_DIR=state;
  assert.deepEqual(await recoverJobs(tmp,{dryRun:true}),[]);assert.equal(await exists(state),false);
  await fs.mkdir(path.join(state,'jobs'),{recursive:true,mode:0o700});
  const id='00000000-0000-0000-0000-000000000001',record=JSON.stringify({id,project:await fs.realpath(tmp),owner:null});
  await fs.writeFile(path.join(state,'jobs',id+'.json'),record);
  const report=await recoverJobs(tmp,{dryRun:true});assert.equal(report.length,1);assert.equal(await exists(path.join(state,'locks')),false);
  assert.equal(await fs.readFile(path.join(state,'jobs',id+'.json'),'utf8'),record);
 }finally{if(saved===undefined)delete process.env.EDITABLEFRAMES_STATE_DIR;else process.env.EDITABLEFRAMES_STATE_DIR=saved;await fs.rm(tmp,{recursive:true,force:true})}
});
