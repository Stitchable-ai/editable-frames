import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {createReadStream} from 'node:fs';
import {run,ffmpeg,ffprobe} from './process.mjs';import {validateDerived} from '../packages/plate/manifest.mjs';import {validateTrack} from '../packages/plate/track.mjs';import {validatePreparedAnalysis} from '../packages/plate/prepared.mjs';import {validateCameraPath} from '../packages/plate/camera.mjs';
export async function fileHash(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex')}
export function checkDeclaration(id,a){
 if(['__proto__','constructor','prototype'].includes(id)||!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!['video','audio','image','data'].includes(a.type)||typeof a.src!=='string'||path.isAbsolute(a.src)||a.src.split(/[\\/]/).some(p=>p==='..'||p.startsWith('.'))||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('Invalid asset declaration: '+id);
}
// The byte-level checks every reader applies. The importer runs them on the staged copy BEFORE publishing it.
export async function checkBytes(id,a,file){
 if(await fileHash(file)!==a.sha256)throw Error('Asset content changed: '+id+'; import it as a new immutable asset');
 // `data` is small JSON a renderer reads (a track, a camera path); it is never decoded as media.
 if(a.type==='data'){if((await fs.stat(file)).size>8*1024**2)throw Error('Data asset exceeds 8 MiB: '+id);let json;try{json=JSON.parse(await fs.readFile(file,'utf8'))}catch{throw Error('Data asset is not JSON: '+id)}if(a.derived?.role==='analysis')validatePreparedAnalysis(json);if(a.derived?.role==='track')validateTrack(json);if(a.derived?.role==='camera')validateCameraPath(json);}
}
// Import preflight for media: (1) a strict decode of every stream, which refuses a file the decoder reports
// errors in even where it would still produce some frames (a truncated faststart MP4 decodes 13 of 24);
// (2) the exact preparation a render performs, on this asset and the assets it is derived from.
export async function preflightMedia(id,asset,related={},{signal,root}={}){
 if(asset.type==='data'&&asset.derived?.role!=='analysis')return {type:'data'};
 try{if(asset.type!=='data')await run(ffmpeg(),['-nostdin','-v','error','-xerror','-i',asset.file,'-map','0:v?','-map','0:a?','-f','null','-'],{signal,timeout:600000})}
 catch(e){throw Error('Asset failed a strict decode: '+id+': '+String(e.message).split('\n').filter(Boolean).slice(0,2).join(' '))}
 const media=await prepareMedia({...related,[id]:asset},{signal,root});
 try{const c=media.catalog[id];return {type:c.type,frames:c.pts.length,duration:c.duration,audio:c.audio,width:c.width,height:c.height}}finally{await media.close()}
}
export async function readAssets(dir){
 let manifest;try{manifest=JSON.parse(await fs.readFile(path.join(dir,'assets.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return {};throw e}
 if(manifest.version!==1 || !manifest.assets || Array.isArray(manifest.assets))throw Error('Invalid assets manifest');
 const assets={};for(const [id,a]of Object.entries(manifest.assets)){
  checkDeclaration(id,a);
  const file=await fs.realpath(path.join(dir,a.src));if(!file.startsWith(dir+path.sep))throw Error('Asset escapes project: '+id);
  await checkBytes(id,a,file);
  assets[id]={...a,file};
 }
 // Mattes, depth, tracks and camera paths are pinned to the exact bytes they were computed from.
 validateDerived(assets);return assets;
}
export async function prepareMedia(assets,{signal,root,maxDecodedBytes=8*1024**3,maxFrames=18000}={}){
 const dir=await fs.mkdtemp(path.join(root??os.tmpdir(),'ef-media-')),catalog={},frozenAssets={};let budget=0;
 try{await fs.mkdir(path.join(dir,'sources'));for(const [id,original]of Object.entries(assets)){
  const file=path.join(dir,'sources',id+path.extname(original.file));await fs.copyFile(original.file,file);if(await fileHash(file)!==original.sha256)throw Error('Asset changed while preparing: '+id);const a={...original,file};frozenAssets[id]=a;
  if(a.type==='data'){catalog[id]={type:'data',sha256:a.sha256,derived:a.derived,audio:false,pts:[],url:'/__ef/source/'+id};continue}
  const info=JSON.parse((await run(ffprobe(),['-v','error','-show_streams','-show_format','-of','json',a.file],{signal})).toString());
  const v=info.streams.find(s=>s.codec_type==='video'),astream=info.streams.find(s=>s.codec_type==='audio'),audio=!!astream;
  let pts=[],duration=Number(info.format.duration??v?.duration??0);
  if(a.type!=='audio'){
   if(!v)throw Error('Asset has no video/image stream: '+id);
   if(v.width>4096||v.height>4096)throw Error('Media exceeds 4096-pixel decode limit');
   // Integer ticks in the stream's time base, not `*_time` seconds: ffprobe prints those to six
   // decimals, so 1/24 s reads 0.041667, later than the frame really is, and a third of the
   // frames of a 24 or 30 fps clip were looked up as their predecessor.
   const [tn,td]=String(v.time_base??'').split('/').map(Number);
   if(!(Number.isSafeInteger(tn)&&Number.isSafeInteger(td)&&tn>0&&td>0))throw Error('Media has no stream time base: '+id);
   const data=JSON.parse((await run(ffprobe(),['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp,duration,pkt_duration','-of','json',a.file],{signal})).toString());
   const frames=data.frames??[];if(!frames.length||frames.length>maxFrames)throw Error('Media frame budget exceeded: '+id);
   const first=Number(frames[0].best_effort_timestamp??0);
   pts=frames.map(f=>(Number(f.best_effort_timestamp??0)-first)*tn/td);
   if(pts.some((t,i)=>!Number.isFinite(t)||(i&&t<pts[i-1])))throw Error('Invalid media PTS: '+id);
   const last=frames.at(-1),lastTicks=Number(last.duration??last.pkt_duration);
   duration=Math.max(duration,pts.at(-1)+(lastTicks>0?lastTicks*tn/td:1/30));
   budget+=v.width*v.height*4*frames.length;if(budget>maxDecodedBytes)throw Error('Decoded media budget exceeded; trim/proxy sources or raise maxDecodedBytes');
   const dest=path.join(dir,id);await fs.mkdir(dest);
   // A PNG from a clip tagged with BT.709 primaries and transfer (most camera footage) carries cICP, cHRM and gAMA
   // chunks, and the browser then draws it through that curve: footage drew darker, and a matte or depth map's data
   // changed. The tags do not change the decoded values; clearing them keeps the chunks out.
   await run(ffmpeg(),['-v','error','-i',a.file,'-map','0:v:0','-vf','setparams=color_primaries=unknown:color_trc=unknown','-fps_mode','passthrough','-frames:v',String(frames.length),path.join(dest,'%06d.png')],{signal,timeout:300000});
   const files=await fs.readdir(dest);if(files.length!==pts.length)throw Error('Decoded frame count differs from PTS index: '+id);
  }
  if(a.type==='audio'&&!audio)throw Error('Asset has no audio: '+id);
  if(audio){budget+=duration*48000*4;if(!Number.isFinite(duration)||duration<=0||budget>maxDecodedBytes)throw Error('Audio decode budget exceeded');a.previewAudio=path.join(dir,'sources',id+'-audio.wav');await run(ffmpeg(),['-v','error','-n','-i',a.file,'-map','0:a:0','-vn','-af',`apad=whole_dur=${duration},atrim=duration=${duration}`,'-ar','48000','-ac','2','-c:a','pcm_s16le',a.previewAudio],{signal,timeout:300000});}
  const [rn,rd]=String(v?.avg_frame_rate??'').split('/').map(Number),frameRate=a.type==='video'&&Number.isSafeInteger(rn)&&Number.isSafeInteger(rd)&&rn>0&&rd>0?{num:rn,den:rd}:undefined;
  catalog[id]={type:a.type,sha256:a.sha256,derived:a.derived,frameRate,duration,pts,audio,width:v?.width,height:v?.height,audioOffset:Number(astream?.start_time??0)-Number(v?.start_time??0),sourceUrl:audio?'/__ef/audio/'+id:null,url:'/__ef/media/'+id+'/'};
 }
 // A per-frame matte or depth map only lines up when it has exactly the plate's frames.
 for(const [id,entry]of Object.entries(catalog)){const d=entry.derived;if(!d||entry.type!=='video')continue;const parent=catalog[d.of];if(parent.type==='video'&&parent.pts.length!==entry.pts.length)throw Error(`${id} has ${entry.pts.length} frames but ${d.of} has ${parent.pts.length}; a ${d.role} must match its plate frame for frame`)}
 for(const [id,a]of Object.entries(frozenAssets))if(a.derived?.role==='analysis'){
  const receipt=JSON.parse(await fs.readFile(a.file,'utf8')),parent=catalog[a.derived.of];
  validatePreparedAnalysis(receipt,{...parent,frames:parent.pts.length});
  const mask=catalog[receipt.alpha.asset];
  if(!mask||mask.sha256!==receipt.alpha.sha256||mask.pts.length!==parent.pts.length||mask.width!==parent.width||mask.height!==parent.height)throw Error('Prepared alpha identity/raster differs: '+id);
 }
 return {dir,catalog,assets:frozenAssets,close:()=>fs.rm(dir,{recursive:true,force:true})};
 }catch(e){await fs.rm(dir,{recursive:true,force:true});throw e}
}
