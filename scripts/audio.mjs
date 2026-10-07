import {run,ffmpeg} from './process.mjs';import {audioPlan} from '../packages/media/audio-plan.mjs';
export function tempoFilters(rate){const f=[];while(rate>2){f.push('atempo=2');rate/=2}while(rate<.5){f.push('atempo=0.5');rate*=2}f.push('atempo='+rate);return f.join(',')}
export async function mixAudio(d,catalog,output,duration,{signal}={}){
 const tracks=audioPlan(d.studio,catalog);if(!tracks.length)return {tracks:0};
 const args=['-v','error','-n','-f','lavfi','-i','anullsrc=r=48000:cl=stereo'];
 for(const t of tracks){if(t.loop)args.push('-stream_loop','-1');args.push('-i',d.assets[t.asset].file)}
 const filters=[`[0:a]atrim=duration=${duration},asetpts=PTS-STARTPTS[base]`];
 for(let i=0;i<tracks.length;i++){const t=tracks[i];filters.push(`[${i+1}:a:0]aresample=48000,asetpts=PTS-STARTPTS,atrim=start=${t.sourceIn}:duration=${t.duration*t.rate},asetpts=PTS-STARTPTS,${tempoFilters(t.rate)},volume=${t.gain},adelay=${Math.round(t.start*48000)}S:all=1[a${i}]`)}
 filters.push('[base]'+tracks.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${tracks.length+1}:normalize=0:duration=first[mix]`);
 args.push('-filter_complex',filters.join(';'),'-map','[mix]','-t',String(duration),'-c:a','pcm_s16le',output);await run(ffmpeg(),args,{signal,timeout:300000});return {tracks:tracks.length};
}
