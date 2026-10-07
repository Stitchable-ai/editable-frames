import {audioPlan} from './audio-plan.mjs';
export function createAudioPlayback(catalog){
 const playing=new Map();let context,epoch=0;
 async function resume(){context??=new AudioContext();await context.resume()}
 function stop(){epoch++;for(const a of playing.values()){a.pause();a.removeAttribute('src');a.load();a._source?.disconnect();a._gain?.disconnect()}playing.clear()}
 async function update(studio,time,running){
  if(!running){stop();return}
  const generation=epoch,tracks=audioPlan(studio,catalog),active=new Set();
  for(const t of tracks){if(generation!==epoch)return;if(time<t.start||time>=t.start+t.duration)continue;const id=t.clip+':'+t.port;active.add(id);let a=playing.get(id);const source=catalog[t.asset].sourceUrl;
   if(!a||a.dataset.source!==source){a?.pause();a?._source?.disconnect();a?._gain?.disconnect();a=new Audio(source);a.dataset.source=source;a.preload='auto';if(context){a._source=context.createMediaElementSource(a);a._gain=context.createGain();a._source.connect(a._gain).connect(context.destination)}playing.set(id,a)}
   const duration=catalog[t.asset].duration;let target=t.sourceIn+(time-t.start)*t.rate;if(t.loop)target%=duration;if(target>=duration){a.pause();continue}
   a.playbackRate=t.rate;a.preservesPitch=true;a.volume=1;if(a._gain)a._gain.gain.value=t.gain;a.loop=t.loop;if(Number.isFinite(target)&&Math.abs(a.currentTime-target)>.12)a.currentTime=target;
   if(a.paused)await a.play();if(generation!==epoch){a.pause();return}
  }
  for(const [id,a]of playing)if(!active.has(id)){a.pause();a._source?.disconnect();a._gain?.disconnect();playing.delete(id)}
 }
 return {update,stop,resume,async dispose(){stop();await context?.close()},stats(){return {active:playing.size,playing:[...playing.values()].filter(a=>!a.paused&&!a.ended&&a.readyState>=2).length,state:context?.state??'idle'}}};
}
