// A crash-safe exclusive lock whose stale state is taken over without deleting or rewriting anything.
//
// A lock that is a single file has to be REMOVED before a dead owner's successor can create it, and every
// way of removing it races: the contender decides from what it read, and by the time it unlinks or renames
// the name, the name may belong to a live successor. Re-reading first only narrows that window.
//
// Here the lock is a chain of generations in one directory:
//   000000000007.json      owner record, created complete by hard link (fails if the name exists), never rewritten
//   000000000007.released  the owner's release marker
//   000000000007.recovered a later holder finished cleaning up after this dead owner
// Only the HIGHEST generation matters. It is free when released, held when its owner is alive, and stale
// when its owner is provably dead. Acquiring is always the exclusive creation of highest+1, so taking over
// a stale lock is the same single atomic step as taking a free one, and exactly one contender can win it.
// Nothing a contender does can damage a live holder, because no step removes or replaces a holder's record.
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {execFile} from 'node:child_process';import {randomUUID} from 'node:crypto';

// ---- process identity -------------------------------------------------------------------------------
// (host, pid, start time) names a process; argv is kept for the stricter match signalling needs. Start time
// is read with TZ=UTC and LC_ALL=C: `ps` prints it in local time and language, so two processes with
// different environments would otherwise disagree about the same live process.
const ROW=/^\s*(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d+\s+[\d:]+\s+\d{4})\s+(.*)$/;
export function processTable(pids){
 if(process.platform==='win32')return Promise.reject(Error('Process identity is not available on win32'));
 return new Promise((resolve,reject)=>execFile('ps',[...(pids?['-p',pids.join(',')]:['-A']),'-ww','-o','pid=,ppid=,lstart=,command='],{timeout:10000,maxBuffer:64*1024*1024,env:{...process.env,TZ:'UTC',LC_ALL:'C'}},(e,out)=>{
  if(e&&!(pids&&e.code===1))return reject(e); // with -p, exit 1 means none of them is running
  resolve(String(out).split('\n').map(l=>ROW.exec(l)).filter(Boolean).map(m=>({pid:Number(m[1]),ppid:Number(m[2]),lstart:m[3].replace(/\s+/g,' '),command:m[4]})));
 }));
}
let self;
export const selfIdentity=()=>self??=(async()=>{
 const row=(await processTable([process.pid])).find(r=>r.pid===process.pid);if(!row)throw Error('ps cannot see this process');
 return {host:os.hostname(),ns:await fs.readlink('/proc/self/ns/pid').catch(()=>null),pid:row.pid,lstart:row.lstart,command:row.command};
})();
// 'alive' | 'dead' | 'unknown'. 'dead' needs positive proof: same host and pid namespace, and a `ps` that
// demonstrably sees this process reports no process with that pid and start time. Everything else,
// including another machine sharing the folder, a sandboxed `ps` and Windows, is 'unknown'.
export async function ownerState(owner){
 try{
  const me=await selfIdentity();
  if(!owner||owner.host!==me.host||(owner.ns??null)!==me.ns||!Number.isSafeInteger(owner.pid)||owner.pid<2||typeof owner.lstart!=='string')return 'unknown';
  const rows=await processTable([owner.pid,process.pid]);
  if(!rows.some(r=>r.pid===me.pid&&r.lstart===me.lstart))return 'unknown';
  return rows.some(r=>r.pid===owner.pid&&r.lstart===owner.lstart)?'alive':'dead';
 }catch{return 'unknown'}
}
// Indirection so tests can simulate several owners, and their deaths, inside one process.
export const probe={self:selfIdentity,state:ownerState};

// ---- generation chain -------------------------------------------------------------------------------
const NAME=/^(\d{12})\.(json|released|recovered)$/,name=g=>String(g).padStart(12,'0');
async function scan(dir){
 const names=new Set(await fs.readdir(dir)),owned=[];
 for(const n of names){const m=NAME.exec(n);if(m&&m[2]==='json')owned.push(Number(m[1]))}
 return {names,gens:owned.sort((a,b)=>a-b),top:owned.length?Math.max(...owned):0};
}
// The name a holder gives its own leftovers; null for a record that is not a well-formed one.
export const recordId=r=>Number.isSafeInteger(r?.gen)&&/^[0-9a-f-]{36}$/.test(r?.token)?name(r.gen)+'-'+r.token:null;
export class LockedError extends Error{constructor(message,holder){super(message);this.code='ELOCKED';this.holder=holder}}

export async function acquireLock(dir,{what='edit'}={}){
 await fs.mkdir(dir,{recursive:true});
 const owner=await probe.self().catch(()=>null),token=randomUUID();
 for(let attempt=0;attempt<16;attempt++){
  const seen=await scan(dir),top=seen.top;
  if(top&&!seen.names.has(name(top)+'.released')){
   let held;try{held=JSON.parse(await fs.readFile(path.join(dir,name(top)+'.json'),'utf8'))}catch(e){if(e.code==='ENOENT')continue;held=null}
   const s=await probe.state(held?.owner);
   if(s==='alive')throw new LockedError(`Another ${what} is active; retry after it finishes`,held);
   if(s!=='dead')throw new LockedError(`Another ${what} may be active: its owner cannot be verified from this machine. If none is running anywhere, create the empty file ${path.join(dir,name(top)+'.released')}`,held);
  }
  const gen=top+1,file=path.join(dir,name(gen)+'.json'),temp=path.join(dir,'.new-'+token+'-'+attempt);
  await fs.writeFile(temp,JSON.stringify({version:1,gen,token,owner,what,acquired:new Date().toISOString()}),{flag:'wx'});
  // The whole acquisition: an exclusive create of the next generation, already complete when it appears.
  try{await fs.link(temp,file)}catch(e){if(e.code==='EEXIST'||e.code==='ENOENT')continue;throw e}finally{await fs.rm(temp,{force:true})}
  // A holder may delete generations below its own. A contender that stalled across that cleanup can create
  // a number that is no longer the highest; it then holds nothing, and withdraws.
  if((await scan(dir)).top!==gen){await fs.rm(file,{force:true});continue}
  return handle(dir,gen,token,owner);
 }
 throw new LockedError(`Could not acquire the ${what} lock: too much contention`);
}
function handle(dir,gen,token,owner){
 const base=g=>path.join(dir,name(g));let released=false;
 return {dir,gen,token,owner,id:recordId({gen,token}),
  // Before publishing, a holder checks that nobody superseded it. That can only happen if this live
  // process was judged dead, which `ownerState` is built not to do; the check bounds the damage if it does.
  async assertHeld(){if(released||(await scan(dir)).top!==gen)throw Error('This process no longer holds the lock')},
  async release(){if(released)return;released=true;await fs.writeFile(base(gen)+'.released','')},
  // Run by the holder only. Calls clean(record) for each earlier generation whose owner died without
  // releasing; `clean` returns {complete,...}. A generation is forgotten only once released or completely
  // cleaned, so a crash at any point here is repeated by the next holder.
  async reclaim(clean=async()=>({complete:true})){
   const seen=await scan(dir),report=[],earlier=new Set();
   for(const n of seen.names){const m=NAME.exec(n);if(m&&Number(m[1])<gen)earlier.add(Number(m[1]))}
   for(const g of [...earlier].sort((a,b)=>a-b)){
    if(seen.names.has(name(g)+'.json')&&!seen.names.has(name(g)+'.released')&&!seen.names.has(name(g)+'.recovered')){
     let record;try{record=JSON.parse(await fs.readFile(base(g)+'.json','utf8'))}catch{record=null}
     const s=await probe.state(record?.owner);
     if(s!=='dead'){report.push({gen:g,action:'left: owner '+(s==='alive'?'is alive':'cannot be verified')});continue}
     const result=await clean(record);report.push({gen:g,owner:record.owner.pid,...result});
     if(!result.complete)continue;
     await fs.writeFile(base(g)+'.recovered',JSON.stringify(result));
    }
    for(const suffix of ['.json','.released','.recovered'])await fs.rm(base(g)+suffix,{force:true});
   }
   // Half-made records of contenders that died. Removing a live contender's only makes it retry.
   for(const n of seen.names)if(n.startsWith('.new-')&&!n.startsWith('.new-'+token))await fs.rm(path.join(dir,n),{force:true});
   return report;
  }};
}
