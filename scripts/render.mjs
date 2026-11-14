import {chromiumOptions} from './browser.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {chromium} from 'playwright';
import {preview,readProject} from './project.mjs';import {mixAudio} from './audio.mjs';import {run,ffmpeg,ffprobe} from './process.mjs';import {HZ} from '../packages/core/index.mjs';import {shutterSamples,validateShutter} from '../packages/plate/motion-blur.mjs';
export function frameRate(value={num:24,den:1}){
 if(typeof value==='string'){const [num,den=1]=value.split('/').map(Number);value={num,den}}
 if(typeof value==='number')value={num:value,den:1};
 if(!Number.isSafeInteger(value.num)||!Number.isSafeInteger(value.den)||value.num<1||value.den<1||value.num/value.den>120||value.num/value.den<1||value.num>1000000||value.den>1000000)throw Error('Invalid rational frame rate');return value;
}
async function absent(file){try{await fs.lstat(file);throw Error('Output already exists: '+file)}catch(e){if(e.code!=='ENOENT')throw e}}
export async function render(dir,output,{fps,frames,format,background='#101922',pass='beauty',motionBlur,signal,onProgress=()=>{},expectRevision,expectBinding}={}){
 if(!output)throw Error('Output path is required');signal?.throwIfAborted();
 const d=await readProject(dir);
 if(expectRevision!==undefined&&expectRevision!==d.revision)throw Error('Stale export revision: inspect again');
 if(expectBinding!==undefined&&expectBinding!==d.binding)throw Error('Stale export binding: rebind and inspect again');
 const rate=frameRate(fps??d.studio.doc.fps),duration=Math.max(0,...d.studio.doc.clips.map(c=>(c.start+c.duration)/HZ));
 const count=frames??Math.ceil(duration*rate.num/rate.den);if(!Number.isSafeInteger(count)||count<1||count>36000)throw Error('Invalid export frame budget');
 // A control pass exists only where the scene's own code draws it.
 if(pass!=='beauty'&&(d.kind!=='renderer'||!(d.scene.passes??[]).includes(pass)))throw Error(`This scene does not declare a ${pass} pass`+(d.kind==='renderer'&&d.scene.passes?.length?`; it declares: ${d.scene.passes.join(', ')}`:''));
 const shutter=motionBlur?validateShutter(motionBlur):null;if(shutter&&count*shutter.samples>144000)throw Error('Motion blur sample budget exceeded; lower --samples or the frame count');
 format??=path.extname(output)==='.mov'?'mov':path.extname(output)==='.mp4'?'mp4':null;
 if(!['mp4','mov','png'].includes(format))throw Error('Use .mp4, .mov (alpha), or --format png');
 if(!/^#[0-9a-f]{6}$/i.test(background))throw Error('Background must be a six-digit color');
 output=path.resolve(output);await absent(output);await absent(output+'.json');await fs.mkdir(path.dirname(output),{recursive:true});
 const temp=path.join(path.dirname(output),'.editableframe-render-'+randomUUID());await fs.mkdir(temp);
 let host,browser;const errors=[];
 const abort=()=>browser?.close().catch(()=>{});signal?.addEventListener('abort',abort,{once:true});
 try{
  onProgress({phase:'media',progress:0});host=await preview(dir,{port:0,editable:false,signal,snapshot:d});
  browser=await chromium.launch({...chromiumOptions(),headless:true,args:['--enable-webgl',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(host.url);await page.waitForFunction(()=>window.editableframe?.ready,{},{timeout:30000});
  const frameDir=path.join(temp,'frames'),sampleDir=path.join(temp,'samples');await fs.mkdir(frameDir);if(shutter)await fs.mkdir(sampleDir);
  for(let frame=0;frame<count;frame++){
   signal?.throwIfAborted();if(errors.length)throw Error(errors.join('\n'));
   // One capture per output frame, or one per shutter sample when motion blur is on.
   const times=shutter?shutterSamples(frame,shutter):[frame];
   for(let sample=0;sample<times.length;sample++){
    const seconds=times[sample]*rate.den/rate.num;let bytes;
    // Footage already has a shutter. Keep its output-frame time separate from
    // code's sub-frame sample, including through source trims and retiming.
    const mediaTime=frame*rate.den/rate.num;
    if(d.kind==='renderer'){await page.evaluate(([t,pass,mediaTime])=>window.editableframe.seek(t,{timeline:true,pass,mediaTime}),[seconds,pass,mediaTime]);bytes=await page.locator('#screen').screenshot({omitBackground:true,timeout:30000});}
    else{const png=await page.evaluate(async ([t,mediaTime])=>{await window.editableframe.seek(t,{timeline:true,mediaTime});return window.editableframe.png()},[seconds,mediaTime]);bytes=Buffer.from(png.split(',')[1],'base64');}
    await fs.writeFile(shutter?path.join(sampleDir,String(frame*shutter.samples+sample+1).padStart(8,'0')+'.png'):path.join(frameDir,String(frame+1).padStart(6,'0')+'.png'),bytes);
   }
   onProgress({phase:'frames',frame:frame+1,total:count,progress:(frame+1)/count});
  }
  if(shutter){
   // Average each frame's samples as premultiplied colour, so a half-covered pixel keeps its hue instead of darkening.
   // Float intermediates avoid losing a code value even when every sample is identical.
   // The mean is taken on encoded (display) values, not linear light.
   onProgress({phase:'shutter',progress:0});
   await run(ffmpeg(),['-v','error','-n','-framerate','1','-i',path.join(sampleDir,'%08d.png'),'-vf',`format=gbrapf32le,premultiply=inplace=1,tmix=frames=${shutter.samples},select='not(mod(n+1\\,${shutter.samples}))',unpremultiply=inplace=1,format=rgba`,'-fps_mode','passthrough','-frames:v',String(count),path.join(frameDir,'%06d.png')],{signal,timeout:600000});
   if((await fs.readdir(frameDir)).length!==count)throw Error('Motion blur produced the wrong number of frames');
   await fs.rm(sampleDir,{recursive:true,force:true});
  }
  const actualDuration=count*rate.den/rate.num,audioPath=path.join(temp,'audio.wav');const audio=await mixAudio({...d,assets:host.media.assets},host.media.catalog,audioPath,actualDuration,{signal});
  let result;
  if(format==='png'){
   if(audio.tracks)await fs.copyFile(audioPath,path.join(frameDir,'audio.wav'));result=frameDir;
  }else{
   result=path.join(temp,'output.'+format);const args=['-v','error','-n','-framerate',`${rate.num}/${rate.den}`,'-i',path.join(frameDir,'%06d.png')];if(audio.tracks)args.push('-i',audioPath);
   // RGB to BT.709 YUV in limited range, with the transfer left as drawn and tagged as sRGB. Converting it to the BT.709
   // camera curve made every export 10-13 levels darker (128 -> 115), footage included, and no player undoes it.
   const convert='scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv444p';
   if(format==='mp4')args.push('-f','lavfi','-i',`color=c=${background.replace('#','0x')}:s=${d.studio.doc.width}x${d.studio.doc.height}:r=${rate.num}/${rate.den}`,'-filter_complex',`[${audio.tracks?2:1}:v]format=rgba[bg];[bg][0:v]overlay=shortest=1:format=rgb,${convert},format=yuv420p[v]`,'-map','[v]','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart');
   else args.push('-filter_complex',`[0:v]format=rgba,split[rgb][alpha];[alpha]alphaextract[a];[rgb]${convert}[color];[color][a]alphamerge,format=yuva444p10le[v]`,'-map','[v]','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16');
   if(audio.tracks)args.push('-map','1:a:0','-c:a',format==='mov'?'pcm_s16le':'aac');
   args.push('-frames:v',String(count),'-t',String(actualDuration),'-color_range','tv','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709',result);
   onProgress({phase:'encode',progress:0});await run(ffmpeg(),args,{signal,timeout:600000});
   const info=JSON.parse((await run(ffprobe(),['-v','error','-show_streams','-show_format','-of','json',result],{signal})).toString());
   if(!info.streams.some(s=>s.codec_type==='video')||audio.tracks&&!info.streams.some(s=>s.codec_type==='audio'))throw Error('Encoded media failed stream validation');
  }
  signal?.throwIfAborted();
  const receipt={configuredBrowser:Boolean(process.env.EDITABLEFRAMES_CHROMIUM_EXECUTABLE),version:1,engine:'editableframe',binding:d.binding,projectRevision:d.revision,fps:rate,frames:count,duration:actualDuration,format,alpha:format!=='mp4',pass,motionBlur:shutter,runtime:d.runtimeIdentity,browser:browser.version(),ffmpeg:(await run(ffmpeg(),['-version'])).toString().split('\n')[0],platform:process.platform,background:format==='mp4'?background:null,audio:audio.tracks>0,audioTracks:audio.tracks,assets:Object.fromEntries(Object.entries(d.assets).map(([id,a])=>[id,a.sha256]))};
  // Reserve the receipt path, and publish a complete file without overwriting another writer.
  const receiptFile=output+'.json',fd=await fs.open(receiptFile,'wx');let published=false;
  try{await fd.writeFile(JSON.stringify(receipt,null,2));await fd.sync();if(format==='png'){await absent(output);await fs.rename(result,output)}else await fs.link(result,output);published=true}finally{await fd.close();if(!published)await fs.rm(receiptFile,{force:true})}
  onProgress({phase:'complete',progress:1});return receipt;
 }finally{signal?.removeEventListener('abort',abort);await browser?.close();await host?.close();await fs.rm(temp,{recursive:true,force:true})}
}
