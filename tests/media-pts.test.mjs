import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {prepareMedia} from '../scripts/media.mjs';import {run,ffmpeg} from '../scripts/process.mjs';import {ptsIndex} from '../packages/media/ports.mjs';
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
