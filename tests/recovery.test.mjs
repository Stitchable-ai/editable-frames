import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {spawn} from 'node:child_process';import {pathToFileURL} from 'node:url';import {randomUUID} from 'node:crypto';
import {init,mutate,editLock} from '../scripts/project.mjs';import {acquireLock,processTable} from '../scripts/lock.mjs';import {recoverJobs} from '../scripts/jobs.mjs';
const skip=process.platform==='win32'&&'process identity is not available on Windows; nothing is recovered there';
const url=file=>JSON.stringify(pathToFileURL(path.resolve(import.meta.dirname,file)).href);
// A real second process that runs `body`, prints one line, then waits to be killed.
function holder(body,env={}){const child=spawn(process.execPath,['--input-type=module','-e',`${body};console.log('ready');setInterval(()=>{},1<<30)`],{stdio:['ignore','pipe','inherit'],env:{...process.env,...env}});return new Promise(resolve=>child.stdout.once('data',()=>resolve({child,kill:()=>new Promise(done=>{child.once('close',done);child.kill('SIGKILL')})})))}
const exists=p=>fs.lstat(p).then(()=>true,()=>false);

test('an edit that was killed is taken over once, and its staging directory removed; a live edit is not',{skip},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-recovery-')),dir=path.join(tmp,'project');
 try{
  await init(dir);const assets=path.join(dir,'assets');await fs.mkdir(path.join(assets,'.import-unrelated'),{recursive:true});
  const h=await holder(`import fs from 'node:fs/promises';import {editLock} from ${url('../scripts/project.mjs')};const lock=await editLock(${JSON.stringify(dir)});await fs.mkdir(${JSON.stringify(assets)}+'/.import-'+lock.id)`);
  const staged=(await fs.readdir(assets)).filter(n=>/^\.import-\d{12}-/.test(n));assert.equal(staged.length,1);
  await assert.rejects(mutate(dir,()=>{}),/Another edit is active; retry after it finishes/);
  await h.kill();
  // Eight contenders for the dead lock: exactly one takes it; the rest see a live holder.
  const results=await Promise.allSettled(Array.from({length:8},()=>editLock(dir)));const won=results.filter(r=>r.status==='fulfilled');
  assert.equal(won.length,1);for(const r of results)if(r.status==='rejected')assert.match(r.reason.message,/Another edit is active/);
  assert.deepEqual((await fs.readdir(assets)).filter(n=>n.startsWith('.import-')),['.import-unrelated']);
  await won[0].value.release();assert.equal(await exists(path.join(dir,'.editableframe-edit.lock')),false);
  await mutate(dir,()=>{});
  // A lock left by a CLI without owned locks cannot be verified, so it is refused, not broken.
  await fs.writeFile(path.join(dir,'.editableframe-edit.lock'),'');await assert.rejects(mutate(dir,()=>{}),/without a verifiable owner/);
 }finally{await fs.rm(tmp,{recursive:true,force:true})}
});

test('a lock whose owner cannot be proven dead is never taken over',{skip},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ef-recovery-'));
 try{
  const me=(await processTable([process.pid]))[0],record=owner=>fs.writeFile(path.join(dir,'000000000001.json'),JSON.stringify({version:1,gen:1,token:randomUUID(),owner}));
  for(const owner of [null,{host:'another-machine',ns:null,pid:me.pid,lstart:me.lstart},{host:os.hostname(),ns:null,pid:99999999,lstart:me.lstart},{host:os.hostname(),ns:'pid:[1]',pid:me.pid,lstart:'Thu Jan 1 00:00:00 1970'}]){await record(owner);await assert.rejects(acquireLock(dir),e=>e.code==='ELOCKED'&&/cannot be verified/.test(e.message))}
  await fs.writeFile(path.join(dir,'000000000001.json'),'not json');await assert.rejects(acquireLock(dir),/cannot be verified/);
  await fs.writeFile(path.join(dir,'000000000001.released'),'');const lock=await acquireLock(dir);assert.equal(lock.gen,2);await lock.release();
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('recovery removes a dead render\'s own directories and unpublished receipt, and nothing else',{skip},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-recovery-')),dir=path.join(tmp,'project'),state=path.join(tmp,'state'),output=path.join(tmp,'out','film.mp4'),saved=process.env.EDITABLEFRAMES_STATE_DIR;
 process.env.EDITABLEFRAMES_STATE_DIR=state;
 try{
  await init(dir);
  const begin=`import fs from 'node:fs/promises';import {beginJob} from ${url('../scripts/jobs.mjs')};const job=await beginJob(${JSON.stringify(dir)},${JSON.stringify(output)});await fs.mkdir(job.temp,{recursive:true});await fs.writeFile(${JSON.stringify(output)}+'.json',JSON.stringify({job:job.id}))`;
  const h=await holder(begin,{EDITABLEFRAMES_STATE_DIR:state,TMPDIR:tmp}),[name]=await fs.readdir(path.join(state,'jobs')),job=JSON.parse(await fs.readFile(path.join(state,'jobs',name),'utf8'));
  assert.equal((await recoverJobs(dir))[0].action,'skipped: owner is running');assert.ok(await exists(job.tmp));
  await h.kill();
  // A record whose paths are not this job's own names, and a record planted inside the project, direct nothing.
  const foreign=path.join(tmp,'keep');await fs.mkdir(foreign);const forged=randomUUID();
  await fs.writeFile(path.join(state,'jobs',forged+'.json'),JSON.stringify({...job,id:forged,tmp:foreign,output:path.join(tmp,'other.mp4')}));
  await fs.mkdir(path.join(dir,'.editableframe','jobs'),{recursive:true});await fs.writeFile(path.join(dir,'.editableframe','jobs',randomUUID()+'.json'),JSON.stringify({...job,tmp:foreign}));
  const [a,b]=await Promise.all([recoverJobs(dir),recoverJobs(dir)]),all=[...a,...b];
  assert.equal(all.filter(r=>r.action==='recovered').length,1);assert.equal(all.find(r=>r.action==='recovered').receipt,'removed: reserved, never published');
  assert.ok(all.some(r=>r.job===forged&&r.action==='left: record does not describe this job'));
  assert.equal(await exists(job.tmp),false);assert.equal(await exists(job.temp),false);assert.equal(await exists(output+'.json'),false);assert.ok(await exists(foreign));
  assert.deepEqual((await recoverJobs(dir)).map(r=>r.action),['left: record does not describe this job']);
 }finally{if(saved===undefined)delete process.env.EDITABLEFRAMES_STATE_DIR;else process.env.EDITABLEFRAMES_STATE_DIR=saved;await fs.rm(tmp,{recursive:true,force:true})}
});
