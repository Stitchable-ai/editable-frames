// Download progress counts response-body bytes, including cached responses. Build
// sizes describe decoded bodies, so compressed Content-Length cannot inflate it.
export function createSceneDownloads({fetcher=(...args)=>fetch(...args),idleTimeout=30000}={}){
 const entries=new Map(),watchers=new Set();let disposed=false;
 const entryFor=url=>{if(!entries.has(url))entries.set(url,{loaded:0,total:null,done:false,bytes:null,promise:null,controller:null});return entries.get(url)};
 function report(watcher){
  const entriesForScene=watcher.urls.map(entryFor),loaded=entriesForScene.reduce((n,e)=>n+e.loaded,0);
  const known=entriesForScene.every(e=>e.total!==null),total=known?entriesForScene.reduce((n,e)=>n+e.total,0):null;
  const complete=entriesForScene.every(e=>e.done),percent=total>0?Math.min(complete?100:99,Math.floor(loaded/total*100)):null;
  const key=[percent??Math.floor(loaded/65536),total,complete].join(':');
  if(key!==watcher.last){watcher.last=key;watcher.notify({phase:complete?'preparing':'downloading',loaded,total,percent})}
 }
 const notify=()=>{for(const watcher of watchers)report(watcher)};
 function watch(urls,sizes,notify){
  for(const url of urls){const e=entryFor(url),size=sizes?.[url];if(Number.isSafeInteger(size)&&size>0)e.total=size}
  const watcher={urls:[...new Set(urls)],notify,last:null};watchers.add(watcher);report(watcher);
  return()=>watchers.delete(watcher);
 }
 function buffer(url){
  if(disposed)return Promise.reject(Error('Scene downloads were disposed'));
  const e=entryFor(url);if(e.bytes)return Promise.resolve(e.bytes);if(e.promise)return e.promise;
  const controller=new AbortController();e.controller=controller;e.loaded=0;e.done=false;notify();
  const wait=promise=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Scene download stalled. Please retry.'))},idleTimeout)})]).finally(()=>clearTimeout(timer))};
  e.promise=(async()=>{
   const response=await wait(fetcher(url,{signal:controller.signal}));if(!response.ok)throw Error('Scene download failed: '+response.status);
   // Fetch streams are decoded. Only use Content-Length for identity encoding.
   if(e.total===null&&!response.headers.get('content-encoding')){const size=Number(response.headers.get('content-length'));if(Number.isSafeInteger(size)&&size>0)e.total=size}
   const reader=response.body?.getReader(),chunks=[];
   if(reader){try{for(;;){const {done,value}=await wait(reader.read());if(done)break;chunks.push(value);e.loaded+=value.byteLength;notify()}}finally{reader.releaseLock()}}
   else{const bytes=new Uint8Array(await wait(response.arrayBuffer()));chunks.push(bytes);e.loaded=bytes.byteLength}
   if(e.total!==null&&e.loaded!==e.total)throw Error('Scene download was incomplete. Please retry.');
   const bytes=new Uint8Array(e.loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
   e.bytes=bytes.buffer;e.total=e.loaded;e.done=true;notify();return e.bytes;
  })().catch(error=>{controller.abort();throw error}).finally(()=>{e.promise=null;e.controller=null});
  return e.promise;
 }
 return {watch,buffer,dispose(){disposed=true;for(const e of entries.values()){e.controller?.abort();e.bytes=null}watchers.clear();entries.clear()}};
}
