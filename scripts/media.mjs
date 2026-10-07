import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {createReadStream} from 'node:fs';
import {run,ffmpeg,ffprobe} from './process.mjs';
export async function fileHash(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex')}
export async function readAssets(dir){
 let manifest;try{manifest=JSON.parse(await fs.readFile(path.join(dir,'assets.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return {};throw e}
 if(manifest.version!==1 || !manifest.assets || Array.isArray(manifest.assets))throw Error('Invalid assets manifest');
 const assets={};for(const [id,a]of Object.entries(manifest.assets)){
  if(['__proto__','constructor','prototype'].includes(id)||!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!['video','audio','image'].includes(a.type)||typeof a.src!=='string'||path.isAbsolute(a.src)||a.src.split(/[\\/]/).some(p=>p==='..'||p.startsWith('.'))||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('Invalid asset declaration: '+id);
  const file=await fs.realpath(path.join(dir,a.src));if(!file.startsWith(dir+path.sep))throw Error('Asset escapes project: '+id);
  if(await fileHash(file)!==a.sha256)throw Error('Asset content changed: '+id+'; import it as a new immutable asset');
  assets[id]={...a,file};
 }return assets;
}
export async function prepareMedia(assets,{signal,maxDecodedBytes=8*1024**3,maxFrames=18000}={}){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ef-media-')),catalog={},frozenAssets={};let budget=0;
 try{await fs.mkdir(path.join(dir,'sources'));for(const [id,original]of Object.entries(assets)){
  const file=path.join(dir,'sources',id+path.extname(original.file));await fs.copyFile(original.file,file);if(await fileHash(file)!==original.sha256)throw Error('Asset changed while preparing: '+id);const a={...original,file};frozenAssets[id]=a;
  const info=JSON.parse((await run(ffprobe(),['-v','error','-show_streams','-show_format','-of','json',a.file],{signal})).toString());
  const v=info.streams.find(s=>s.codec_type==='video'),astream=info.streams.find(s=>s.codec_type==='audio'),audio=!!astream;
  let pts=[],duration=Number(info.format.duration??v?.duration??0);
  if(a.type!=='audio'){
   if(!v)throw Error('Asset has no video/image stream: '+id);
   if(v.width>4096||v.height>4096)throw Error('Media exceeds 4096-pixel decode limit');
   const data=JSON.parse((await run(ffprobe(),['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time,pkt_duration_time','-of','json',a.file],{signal})).toString());
   const frames=data.frames??[];if(!frames.length||frames.length>maxFrames)throw Error('Media frame budget exceeded: '+id);
   const first=Number(frames[0].best_effort_timestamp_time??0);
   pts=frames.map(f=>Number(f.best_effort_timestamp_time??0)-first);
   if(pts.some((t,i)=>!Number.isFinite(t)||(i&&t<pts[i-1])))throw Error('Invalid media PTS: '+id);
   duration=Math.max(duration,pts.at(-1)+Number(frames.at(-1).pkt_duration_time||1/30));
   budget+=v.width*v.height*4*frames.length;if(budget>maxDecodedBytes)throw Error('Decoded media budget exceeded; trim/proxy sources or raise maxDecodedBytes');
   const dest=path.join(dir,id);await fs.mkdir(dest);
   await run(ffmpeg(),['-v','error','-i',a.file,'-map','0:v:0','-fps_mode','passthrough','-frames:v',String(frames.length),path.join(dest,'%06d.png')],{signal,timeout:300000});
   const files=await fs.readdir(dest);if(files.length!==pts.length)throw Error('Decoded frame count differs from PTS index: '+id);
  }
  if(a.type==='audio'&&!audio)throw Error('Asset has no audio: '+id);
  if(audio){budget+=duration*48000*4;if(!Number.isFinite(duration)||duration<=0||budget>maxDecodedBytes)throw Error('Audio decode budget exceeded');a.previewAudio=path.join(dir,'sources',id+'-audio.wav');await run(ffmpeg(),['-v','error','-n','-i',a.file,'-map','0:a:0','-vn','-af',`apad=whole_dur=${duration},atrim=duration=${duration}`,'-ar','48000','-ac','2','-c:a','pcm_s16le',a.previewAudio],{signal,timeout:300000});}
  catalog[id]={type:a.type,sha256:a.sha256,duration,pts,audio,width:v?.width,height:v?.height,audioOffset:Number(astream?.start_time??0)-Number(v?.start_time??0),sourceUrl:audio?'/__ef/audio/'+id:null,url:'/__ef/media/'+id+'/'};
 }
 return {dir,catalog,assets:frozenAssets,close:()=>fs.rm(dir,{recursive:true,force:true})};
 }catch(e){await fs.rm(dir,{recursive:true,force:true});throw e}
}
