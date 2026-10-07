import fs from 'node:fs/promises';import path from 'node:path';import {run,ffmpeg} from './process.mjs';import {fileHash} from './media.mjs';
export async function createDemoMedia(dir){
 await fs.mkdir(path.join(dir,'assets'),{recursive:true});const file=path.join(dir,'assets','demo.mp4');
 // Original synthetic test footage and tone, no stock licensing or remote dependency.
 await run(ffmpeg(),['-v','error','-n','-f','lavfi','-i','testsrc2=size=320x240:rate=24:duration=4','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=4','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',file]);
 await fs.writeFile(path.join(dir,'assets.json'),JSON.stringify({version:1,assets:{demo:{src:'assets/demo.mp4',type:'video',sha256:await fileHash(file)}}},null,2));
}
