import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {prepareMedia} from '../scripts/media.mjs';import {run,ffmpeg,ffprobe} from '../scripts/process.mjs';import {ptsIndex} from '../packages/media/ports.mjs';
// ffprobe prints `*_time` values to six decimals, so frame 1 of a 24 fps clip reads 0.041667: later than
// 1/24 s. Looked up at the frame's own time, a third of the frames of a 24 or 30 fps clip resolved to
// their predecessor, so a plate showed frame n-1 while a track sampled on the plate's grid used frame n.
for(const rate of [24,30])test(`every frame of a ${rate} fps clip is found at its own frame time`,async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ef-pts-'));let media;
 try{
  const file=path.join(dir,'clip.mp4');
  await run(ffmpeg(),['-v','error','-f','lavfi','-i',`testsrc2=size=64x48:rate=${rate}:duration=1`,'-c:v','libx264','-g',String(rate),file]);
  const sha256=createHash('sha256').update(await fs.readFile(file)).digest('hex');
  media=await prepareMedia({clip:{file,type:'video',sha256}});
  const {pts}=media.catalog.clip;assert.equal(pts.length,rate);
  const wrong=[];for(let n=0;n<rate;n++)if(ptsIndex(pts,n/rate)!==n)wrong.push(n);
  assert.deepEqual(wrong,[],`frames looked up as another frame at ${rate} fps`);
 }finally{await media?.close();await fs.rm(dir,{recursive:true,force:true})}
});
// FFmpeg writes cICP, cHRM and gAMA chunks into a PNG decoded from a clip whose primaries and transfer are tagged
// BT.709, as most camera footage is. The browser then draws the frame through that curve instead of as the values
// it holds, so footage, and a matte or depth map tagged the same way, drew darker than its data.
const colourChunks=png=>{const found=[];for(let i=8;i+8<=png.length;){const length=png.readUInt32BE(i),type=png.toString('latin1',i+4,i+8);if(['cICP','cHRM','gAMA','iCCP','sRGB'].includes(type))found.push(type);i+=12+length;}return found;};
test('frames of a colour-tagged clip hold their values with no colour chunks for the browser to apply',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ef-tagged-'));let media;
 try{
  const file=path.join(dir,'tagged.mp4');
  await run(ffmpeg(),['-v','error','-f','lavfi','-i','testsrc2=size=64x48:rate=25:duration=1','-vf','setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709','-c:v','libx264','-pix_fmt','yuv420p',file]);
  const tags=(await run(ffprobe(),['-v','error','-select_streams','v:0','-show_entries','stream=color_transfer,color_primaries','-of','csv=p=0',file])).toString().trim();
  assert.equal(tags,'bt709,bt709','the fixture must carry the tags real footage does');
  const sha256=createHash('sha256').update(await fs.readFile(file)).digest('hex');
  media=await prepareMedia({clip:{file,type:'video',sha256}});
  const frame=path.join(media.dir,'clip','000011.png');
  assert.deepEqual(colourChunks(await fs.readFile(frame)),[]);
  const raw=args=>run(ffmpeg(),['-v','error',...args,'-f','rawvideo','-pix_fmt','rgb24','-']);
  assert.ok((await raw(['-i',frame])).equals(await raw(['-i',file,'-vf','select=eq(n\\,10)','-frames:v','1'])),'the frame keeps the values a plain decode gives');
 }finally{await media?.close();await fs.rm(dir,{recursive:true,force:true})}
});
