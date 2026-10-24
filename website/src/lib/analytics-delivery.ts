/** Bounded browser delivery; retries recheck the shared preference revision. */
type EventPayload={event:string;properties:Record<string,unknown>;timestamp?:unknown;uuid?:unknown};
type Options={key:string;host:string;allowed:()=>boolean;revision:()=>string;fetcher?:typeof fetch;result?:(event:EventPayload,status:string)=>void;schedule?:typeof setTimeout;unschedule?:typeof clearTimeout};
export function createDispatcher(options:Options){
 const schedule=options.schedule??setTimeout,unschedule=options.unschedule??clearTimeout;
 const jobs=new Set<{event:EventPayload;revision:string;cancelled:boolean;controller?:AbortController;timer?:ReturnType<typeof setTimeout>;timeout?:ReturnType<typeof setTimeout>}>();
 const valid=(job:ReturnType<typeof makeJob>)=>!job.cancelled&&options.allowed()&&job.revision===options.revision();
 function makeJob(event:EventPayload){return{event,revision:options.revision(),cancelled:false,controller:undefined as AbortController|undefined,timer:undefined as ReturnType<typeof setTimeout>|undefined,timeout:undefined as ReturnType<typeof setTimeout>|undefined};}
 function finish(job:ReturnType<typeof makeJob>,status:string){jobs.delete(job);job.cancelled=true;options.result?.(job.event,status);}
 async function attempt(job:ReturnType<typeof makeJob>,count:number){
  if(!valid(job)){finish(job,'suppressed');return;}
  const controller=new AbortController();job.controller=controller;
  const timeout=schedule(()=>controller.abort(),8000);job.timeout=timeout;
  let retry=true;
  try{
   const response=await(options.fetcher??fetch)(options.host+'/i/v0/e/',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,signal:controller.signal,
    body:JSON.stringify({api_key:options.key,distinct_id:job.event.properties.distinct_id,...job.event})});
   if(!valid(job)){finish(job,'suppressed');return;}
   const body=await response.json().catch(()=>null);
   if(response.ok&&(body?.status===1||body?.status==='Ok')){finish(job,'received');return;}
   retry=response.status===429||response.status>=500||response.ok;
  }catch{/* Offline, blocked and transient transport failures have the same finite budget. */}
  finally{unschedule(timeout);}
  if(!valid(job)){finish(job,'suppressed');return;}
  if(!retry||count>=2){finish(job,'failed');return;}
  job.timer=schedule(()=>void attempt(job,count+1),1000*(count+1));
 }
 return {
  send(event:EventPayload){if(!options.allowed()||jobs.size>=64)return;const job=makeJob(event);jobs.add(job);void attempt(job,0);},
  stop(){for(const job of jobs){job.cancelled=true;job.controller?.abort();if(job.timer)unschedule(job.timer);if(job.timeout)unschedule(job.timeout);}jobs.clear();},
 };
}
