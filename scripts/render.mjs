import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {chromium} from 'playwright';
import {preview,readProject} from './project.mjs';import {mixAudio} from './audio.mjs';import {run,ffmpeg,ffprobe} from './process.mjs';import {HZ} from '../packages/core/index.mjs';
export function frameRate(value={num:24,den:1}){
 if(typeof value==='string'){const [num,den=1]=value.split('/').map(Number);value={num,den}}
 if(typeof value==='number')value={num:value,den:1};
 if(!Number.isSafeInteger(value.num)||!Number.isSafeInteger(value.den)||value.num<1||value.den<1||value.num/value.den>120||value.num/value.den<1||value.num>1000000||value.den>1000000)throw Error('Invalid rational frame rate');return value;
}
async function absent(file){try{await fs.lstat(file);throw Error('Output already exists: '+file)}catch(e){if(e.code!=='ENOENT')throw e}}
export async function render(dir,output,{fps,frames,format,background='#101922',signal,onProgress=()=>{}}={}){
 if(!output)throw Error('Output path is required');signal?.throwIfAborted();
 const d=await readProject(dir),rate=frameRate(fps??d.studio.doc.fps),duration=Math.max(0,...d.studio.doc.clips.map(c=>(c.start+c.duration)/HZ));
 const count=frames??Math.ceil(duration*rate.num/rate.den);if(!Number.isSafeInteger(count)||count<1||count>36000)throw Error('Invalid export frame budget');
 format??=path.extname(output)==='.mov'?'mov':path.extname(output)==='.mp4'?'mp4':null;
 if(!['mp4','mov','png'].includes(format))throw Error('Use .mp4, .mov (alpha), or --format png');
 if(!/^#[0-9a-f]{6}$/i.test(background))throw Error('Background must be a six-digit color');
 output=path.resolve(output);await absent(output);await absent(output+'.json');await fs.mkdir(path.dirname(output),{recursive:true});
 const temp=path.join(path.dirname(output),'.editableframe-render-'+randomUUID());await fs.mkdir(temp);
 let host,browser;const errors=[];
 const abort=()=>browser?.close().catch(()=>{});signal?.addEventListener('abort',abort,{once:true});
 try{
  onProgress({phase:'media',progress:0});host=await preview(dir,{port:0,editable:false,signal,snapshot:d});
  browser=await chromium.launch({headless:true,args:['--enable-webgl',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(host.url);await page.waitForFunction(()=>window.editableframe?.ready,{},{timeout:30000});
  const frameDir=path.join(temp,'frames');await fs.mkdir(frameDir);
  for(let frame=0;frame<count;frame++){
   signal?.throwIfAborted();if(errors.length)throw Error(errors.join('\n'));
   const png=await page.evaluate(async t=>{await window.editableframe.seek(t,{timeline:true});return window.editableframe.png()},frame*rate.den/rate.num);
   await fs.writeFile(path.join(frameDir,String(frame+1).padStart(6,'0')+'.png'),Buffer.from(png.split(',')[1],'base64'));
   onProgress({phase:'frames',frame:frame+1,total:count,progress:(frame+1)/count});
  }
  const actualDuration=count*rate.den/rate.num,audioPath=path.join(temp,'audio.wav');const audio=await mixAudio({...d,assets:host.media.assets},host.media.catalog,audioPath,actualDuration,{signal});
  let result;
  if(format==='png'){
   if(audio.tracks)await fs.copyFile(audioPath,path.join(frameDir,'audio.wav'));result=frameDir;
  }else{
   result=path.join(temp,'output.'+format);const args=['-v','error','-n','-framerate',`${rate.num}/${rate.den}`,'-i',path.join(frameDir,'%06d.png')];if(audio.tracks)args.push('-i',audioPath);
   const convert='scale=in_range=pc:out_range=pc:out_color_matrix=bt709,format=yuv444p,colorspace=ispace=bt709:itrc=srgb:iprimaries=bt709:irange=pc:all=bt709:range=tv:format=yuv444p';
   if(format==='mp4')args.push('-f','lavfi','-i',`color=c=${background.replace('#','0x')}:s=${d.studio.doc.width}x${d.studio.doc.height}:r=${rate.num}/${rate.den}`,'-filter_complex',`[${audio.tracks?2:1}:v]format=rgba[bg];[bg][0:v]overlay=shortest=1:format=rgb,${convert},format=yuv420p[v]`,'-map','[v]','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart');
   else args.push('-filter_complex',`[0:v]split[rgb][alpha];[alpha]alphaextract[a];[rgb]${convert}[color];[color][a]alphamerge,format=yuva444p10le[v]`,'-map','[v]','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16');
   if(audio.tracks)args.push('-map','1:a:0','-c:a',format==='mov'?'pcm_s16le':'aac');
   args.push('-frames:v',String(count),'-t',String(actualDuration),'-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',result);
   onProgress({phase:'encode',progress:0});await run(ffmpeg(),args,{signal,timeout:600000});
   const info=JSON.parse((await run(ffprobe(),['-v','error','-show_streams','-show_format','-of','json',result],{signal})).toString());
   if(!info.streams.some(s=>s.codec_type==='video')||audio.tracks&&!info.streams.some(s=>s.codec_type==='audio'))throw Error('Encoded media failed stream validation');
  }
  signal?.throwIfAborted();
  const receipt={version:1,engine:'editableframe',binding:d.binding,projectRevision:d.revision,fps:rate,frames:count,duration:actualDuration,format,alpha:format!=='mp4',runtime:d.runtimeIdentity,browser:browser.version(),ffmpeg:(await run(ffmpeg(),['-version'])).toString().split('\n')[0],platform:process.platform,background:format==='mp4'?background:null,audio:audio.tracks>0,audioTracks:audio.tracks,assets:Object.fromEntries(Object.entries(d.assets).map(([id,a])=>[id,a.sha256]))};
  // Reserve the receipt path, and publish a complete file without overwriting another writer.
  const receiptFile=output+'.json',fd=await fs.open(receiptFile,'wx');let published=false;
  try{await fd.writeFile(JSON.stringify(receipt,null,2));await fd.sync();if(format==='png'){await absent(output);await fs.rename(result,output)}else await fs.link(result,output);published=true}finally{await fd.close();if(!published)await fs.rm(receiptFile,{force:true})}
  onProgress({phase:'complete',progress:1});return receipt;
 }finally{signal?.removeEventListener('abort',abort);await browser?.close();await host?.close();await fs.rm(temp,{recursive:true,force:true})}
}
