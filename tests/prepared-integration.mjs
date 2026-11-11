// Real pixels: foreground preservation over animated DOM, through the CLI.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {init,rebind} from '../scripts/project.mjs';
import {render} from '../scripts/render.mjs';
import {run,ffmpeg} from '../scripts/process.mjs';
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-prepared-')),dir=path.join(tmp,'scene');
const source=`import {defineRenderer} from 'editableframes/renderer';
import {createForegroundHoldout,createKineticText} from 'editableframes/plate';
export default defineRenderer({id:'foreground-regression',renderer:'dom',width:160,height:90,fps:12,durationInFrames:12,defaultProps:{badFrame:-1},
 create({root,props}){
  root.style.background='#162432';
  const hold=createForegroundHoldout({root,width:160,height:90}),box=document.createElement('div');
  box.style.cssText='position:absolute;inset:0;background:#ff0000;color:white;font:900 20px system-ui;overflow:hidden';hold.root.append(box);
  const title=createKineticText({root:box,text:'EXACT WORDS'}),mask=document.createElement('canvas');mask.width=160;mask.height=90;
  return {async render(clock){const c=mask.getContext('2d');c.fillStyle='black';c.fillRect(0,0,160,90);c.fillStyle='white';c.fillRect(clock.frame*6,20,35,55);title.render(clock.frame/clock.fps,{effect:'spring',hold:10});let sample=mask,channel='luminance';if(clock.frame%2){const d=c.getImageData(0,0,160,90);for(let i=0;i<d.data.length;i+=4){d.data[i+3]=d.data[i];d.data[i]=d.data[i+1]=d.data[i+2]=255;}c.putImageData(d,0,0);sample=new Image();sample.src=mask.toDataURL();await sample.decode();channel='alpha';}hold.update(clock.frame===props.badFrame?null:sample,{frame:clock.frame,channel});},dispose(){title.dispose();hold.dispose();}};
 }});`;
try{
 await init(dir,{template:'renderer'});await fs.writeFile(path.join(dir,'clip.mjs'),source);await rebind(dir,{reset:true});
 const out=path.join(tmp,'frames');await render(dir,out,{format:'png',frames:12});
 for(let frame=0;frame<12;frame++){
  const png=path.join(out,String(frame+1).padStart(6,'0')+'.png');
  const data=await run(ffmpeg(),['-v','error','-i',png,'-f','rawvideo','-pix_fmt','rgba','-']);
  for(let y=23;y<72;y++)for(let x=frame*6+3;x<frame*6+32;x++)assert.deepEqual([...data.subarray((y*160+x)*4,(y*160+x)*4+3)],[22,36,50],`foreground leaked at frame ${frame}, ${x},${y}`);
  assert.deepEqual([...data.subarray((80*160+150)*4,(80*160+150)*4+3)],[255,0,0]);
 }
 await fs.writeFile(path.join(dir,'clip.mjs'),source.replace('badFrame:-1','badFrame:4'));await rebind(dir,{reset:true});
 await assert.rejects(()=>render(dir,path.join(tmp,'bad'),{format:'png',frames:6}),/Required foreground mask missing/);
 console.log('PASS: every protected interior pixel stays unchanged across all 12 animated frames; missing required data rejects capture.');
}finally{await fs.rm(tmp,{recursive:true,force:true});}
