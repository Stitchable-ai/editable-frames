// Real PCM regression: a 1x take must not pass through a time-stretch algorithm.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {mixAudio} from '../scripts/audio.mjs';import {run,ffmpeg} from '../scripts/process.mjs';
import {normalizeClipModule} from '../packages/core/definition.mjs';import {defineRenderer} from '../packages/core/renderer.mjs';
import {Studio,clone,ticks} from '../packages/core/index.mjs';
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-audio-test-'));
try{
 const rate=48000,n=rate,pcm=Buffer.alloc(n*4);let seed=123456;
 for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=Math.round((seed/2**32-.5)*12000);pcm.writeInt16LE(v,i*4);pcm.writeInt16LE(-v,i*4+2);}
 const raw=path.join(tmp,'input.pcm'),wav=path.join(tmp,'input.wav');await fs.writeFile(raw,pcm);
 await run(ffmpeg(),['-v','error','-n','-f','s16le','-ar',String(rate),'-ac','2','-i',raw,'-c:a','pcm_s16le',wav]);
 const {template}=normalizeClipModule({default:defineRenderer({id:'audio-regression',renderer:'dom',width:160,height:90,fps:24,durationInFrames:24,media:{take:{asset:'source',offset:.25,sourceIn:.125}},create(){return {render(){}}}})});
 const studio=new Studio({[template.id]:template},{binding:'test'});studio.doc.clips=[studio.make(template.id)];studio.base=clone(studio.doc);
 // Clip trim moves the port from .25 to .125 seconds; source still begins at .125.
 studio.execute({type:'timing',clip:studio.doc.clips[0].id,sourceIn:ticks(.125),duration:ticks(.75)});
 const output=path.join(tmp,'mix.wav');const receipt=await mixAudio({studio,assets:{source:{file:wav}}},{source:{audio:true,duration:1}},output,.75);assert.equal(receipt.tracks,1);
 const actual=await run(ffmpeg(),['-v','error','-i',output,'-f','s16le','-ac','2','-ar',String(rate),'-']);assert.equal(actual.length,.75*rate*4);
 const delay=.125*rate,source=.125*rate;let maxError=0;
 for(let i=0;i<actual.length/2;i++){const frame=Math.floor(i/2),channel=i%2;const expected=frame<delay?0:pcm.readInt16LE(((frame-delay+source)*2+channel)*2);maxError=Math.max(maxError,Math.abs(actual.readInt16LE(i*2)-expected));}
 assert.ok(maxError<=1,`1x audio samples moved or changed: max error ${maxError}`);
 console.log(JSON.stringify({pass:true,frames:actual.length/4,maxPcmCodeError:maxError,tracks:receipt.tracks}));
}finally{await fs.rm(tmp,{recursive:true,force:true});}
