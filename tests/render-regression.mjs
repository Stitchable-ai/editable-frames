import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {serve} from '../scripts/server.mjs';
import {root} from '../scripts/build.mjs';
const output=path.join(root,'artifacts','render-regression');await fs.mkdir(output,{recursive:true});
const host=await serve(root,{port:0});const browser=await chromium.launch({headless:true,args:['--enable-webgl',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(host.url+'/apps/films/');await page.waitForFunction(()=>window.editableframes?.ready);
 const results=await page.evaluate(async()=>{
  const a=window.editableframes,canvas=document.querySelector('#screen'),ctx=canvas.getContext('2d'),results=[];
  await a.select('reference.grain');
  for(let pass=0;pass<3;pass++){
   await a.seek(2.2);const before=a.png(),pixels=ctx.getImageData(0,0,1280,720).data;
   await a.seek(3.1);const middle=a.png();await a.seek(2.2);const after=a.png(),repeat=ctx.getImageData(0,0,1280,720).data;let changed=0,total=0;
   for(let i=0;i<pixels.length;i+=4){let delta=0;for(let k=0;k<3;k++){const d=Math.abs(pixels[i+k]-repeat[i+k]);delta=Math.max(delta,d);total+=d;}if(delta)changed++;}
   results.push({pass,changed,mean:total/(1280*720*3),before,middle,after,props:a.studio.clip(a.selected).nodes[0].props,context:ctx.getContextAttributes(),fonts:document.fonts.status});
  }return results;
 });
 for(const row of results)for(const name of ['before','middle','after'])await fs.writeFile(path.join(output,`${row.pass}-${name}.png`),Buffer.from(row[name].split(',')[1],'base64'));
 const metrics=results.map(({before,middle,after,...rest})=>({...rest,motion:before!==middle,exact:before===after}));await fs.writeFile(path.join(output,'results.json'),JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics,null,2));
 for(const row of metrics){assert.ok(row.motion,'The scene must move');assert.ok(row.changed/(1280*720)<.001&&row.mean<.02,'Repeated grain frame differs: '+JSON.stringify(row));}
}finally{await browser.close();await host.close();}
