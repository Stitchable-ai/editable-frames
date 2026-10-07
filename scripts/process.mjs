import {spawn} from 'node:child_process';
export function run(command,args,{signal,maxOutput=16*1024*1024,timeout=120000}={}) {
 return new Promise((resolve,reject)=>{
  signal?.throwIfAborted();
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});let stdout=[],stderr=[],bytes=0,failed=false;
  const stop=()=>{failed=true;child.kill('SIGKILL')};
  const abort=()=>stop();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(stop,timeout);
  child.stdout.on('data',b=>{bytes+=b.length;if(bytes>maxOutput)stop();else stdout.push(b)});
  child.stderr.on('data',b=>{if(stderr.reduce((n,b)=>n+b.length,0)<65536)stderr.push(b)});
  child.once('error',e=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(e)});
  child.once('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(code!==0||failed)reject(Error(signal?.aborted?'Operation canceled':Buffer.concat(stderr).toString()||'Process exceeded time/output budget'));else resolve(Buffer.concat(stdout))});
 });
}
export const ffmpeg=()=>process.env.FFMPEG_PATH||'ffmpeg';
export const ffprobe=()=>process.env.FFPROBE_PATH||'ffprobe';
