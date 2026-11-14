// Render job records, and recovery after a death that ran no cleanup (SIGKILL, power loss, a crash).
//
// What a job owns is decided when it starts, not guessed afterwards:
//   - one record, written before anything it names exists, in a directory only this user can write. Project
//     folders are copied, downloaded and shared; nothing inside a project can direct a deletion or a signal.
//   - one temporary root named after the job's random id. The CLI points TMPDIR at it, so the decoded media,
//     the browser profile and every other temporary file of the job and its children are inside it.
//   - one frame directory next to the output, also named after the id.
// A browser started by the job therefore carries the job's id in its own command line (--user-data-dir).
// That, not a pid, is the evidence of ownership: no other process is started with that path.
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID,createHash} from 'node:crypto';
import {acquireLock,probe,processTable} from './lock.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export async function registry({create=true}={}){
 const dir=process.env.EDITABLEFRAMES_STATE_DIR||path.join(os.homedir(),'.editableframes','run');
 if(create)await fs.mkdir(dir,{recursive:true,mode:0o700});const st=await fs.lstat(dir).catch(e=>{if(!create&&e.code==='ENOENT')return null;throw e});if(!st)return null;
 if(!st.isDirectory()||process.getuid&&(st.uid!==process.getuid()||st.mode&0o022))throw Error('Job records need a directory owned and writable only by this user: '+dir);
 return fs.realpath(dir);
}
export async function beginJob(projectDir,output){
 const state=await registry(),id=randomUUID(),file=path.join(state,'jobs',id+'.json');output=path.resolve(output);
 const record={version:1,id,owner:await probe.self().catch(()=>null),project:await fs.realpath(projectDir),output,tmp:path.join(await fs.realpath(os.tmpdir()),'ef-job-'+id),temp:path.join(path.dirname(output),'.editableframe-render-'+id),created:new Date().toISOString()};
 // The record is complete when it appears, and it appears before anything it names.
 await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',JSON.stringify(record,null,1));await fs.rename(file+'.tmp',file);await fs.mkdir(record.tmp);
 return {id,tmp:record.tmp,temp:record.temp,record,
  // Normal end, success or failure. The record is dropped only when nothing it names is left.
  async finish(){
   const gone=await fs.rm(record.tmp,{recursive:true,force:true,maxRetries:5,retryDelay:100}).then(()=>true,()=>false);
   if(gone&&!await exists(record.temp))await fs.rm(file,{force:true});
  }};
}
const exists=p=>fs.lstat(p).then(()=>true,()=>false);
const isBrowser=(row,job)=>row.command.includes('--user-data-dir='+job.tmp+path.sep)&&!row.command.includes('--type=');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// SIGTERM one process, only if it is still exactly the process that was just examined. Never SIGKILL.
async function stop(row){
 const now=(await processTable([row.pid])).find(r=>r.pid===row.pid);
 if(!now||now.lstart!==row.lstart||now.command!==row.command)return 'gone';
 process.kill(row.pid,'SIGTERM');
 for(let i=0;i<50;i++){await sleep(100);if(!(await processTable([row.pid])).some(r=>r.pid===row.pid&&r.lstart===row.lstart))return 'terminated'}
 return 'still running after SIGTERM';
}
async function removeDir(p){
 const st=await fs.lstat(p).catch(()=>null);if(!st)return 'absent';
 if(!st.isDirectory())return 'left: not a directory';
 await fs.rm(p,{recursive:true,force:true,maxRetries:5,retryDelay:100});return 'removed';
}
// Recover the dead jobs of ONE project. Jobs whose owner is alive, or cannot be verified, are not touched.
// Without `stopBrowsers` nothing is signalled: a job whose processes are still running is left whole and
// reported. With it, the job's own orphaned browser is asked to exit (SIGTERM).
export async function recoverJobs(projectDir,{stopBrowsers=false,dryRun=false}={}){
 const state=await registry({create:!dryRun});if(!state)return [];const project=await fs.realpath(projectDir),jobs=path.join(state,'jobs'),report=[];
 const names=(await fs.readdir(jobs).catch(()=>[])).filter(n=>n.endsWith('.json')&&UUID.test(n.slice(0,-5))).sort();
 if(!names.length)return report;
 // One recoverer per project. The receipt is the only shared NAME recovery removes: with recoverers
 // serialized, and a new render unable to create a receipt that exists, check-then-remove cannot hit a newcomer's.
 let lock;if(!dryRun)try{lock=await acquireLock(path.join(state,'locks',createHash('sha256').update(project).digest('hex').slice(0,32)),{what:'recovery'})}catch(e){if(e.code==='ELOCKED')return [{action:'skipped: '+e.message}];throw e}
 try{
  await lock?.reclaim();
  for(const name of names){
   const file=path.join(jobs,name),id=name.slice(0,-5);let job;try{job=JSON.parse(await fs.readFile(file,'utf8'))}catch{continue}
   if(job.project!==project)continue;
   const r={job:id,owner:job.owner?.pid??null};report.push(r);
   const s=await probe.state(job.owner);
   if(s!=='dead'){r.action=s==='alive'?'skipped: owner is running':'skipped: owner cannot be verified from this machine';continue}
   if(job.id!==id||path.basename(String(job.tmp))!=='ef-job-'+id||path.basename(String(job.temp))!=='.editableframe-render-'+id||!path.isAbsolute(String(job.output))){r.action='left: record does not describe this job';continue}
   let rows;try{rows=await processTable()}catch{r.action='left: cannot list processes';continue}
   const using=()=>rows.filter(p=>p.command.includes(id)&&p.pid!==process.pid);
   if(dryRun){r.action='would recover';r.processes=using().map(p=>p.pid);r.dirs=[job.tmp,job.temp];continue}
   if(stopBrowsers&&using().length){
    r.stopped=[];for(const p of using().filter(p=>isBrowser(p,job)))r.stopped.push({pid:p.pid,result:await stop(p)});
    for(let i=0;i<30;i++){rows=await processTable();if(!using().length)break;await sleep(100)}
   }
   // The owner is dead, so nothing new can start. Whatever still names the job may be writing into its directories.
   if(using().length){r.action='left: still used by running processes';r.processes=using().map(p=>({pid:p.pid,browser:isBrowser(p,job)}));r.dirs=[job.tmp,job.temp];continue}
   // A receipt this job reserved for an output it never published is a dead reservation.
   const receiptFile=job.output+'.json',receipt=await fs.readFile(receiptFile,'utf8').then(JSON.parse).catch(()=>null);
   if(!receipt)r.receipt='absent';else if(receipt.job!==id)r.receipt='left: belongs to another render';
   else if(!await exists(job.output)){await lock.assertHeld();await fs.rm(receiptFile);r.receipt='removed: reserved, never published'}
   else{const [a,b]=await Promise.all([fs.stat(job.output),fs.stat(path.join(job.temp,'output'+path.extname(job.output))).catch(()=>null)]);r.receipt=b&&a.ino!==b.ino?'left: the output is not the file this render made':'kept: output was published'}
   r.dirs={[job.tmp]:await removeDir(job.tmp),[job.temp]:await removeDir(job.temp)};
   r.action='recovered';
   await fs.mkdir(path.join(state,'recovered'),{recursive:true});await fs.writeFile(path.join(state,'recovered',name),JSON.stringify({...job,recovery:{at:new Date().toISOString(),...r}},null,1));await fs.rm(file);
  }
 }finally{await lock?.release()}
 return report;
}
