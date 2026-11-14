// Live instances must render edits exactly as newly mounted capture instances.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const {outputFiles}=await build({stdin:{contents:`
 import product from './examples/hybrid-code-first/clip.mjs';
 import surface from './examples/hybrid-surfaces/clip.mjs';
 import {mountRenderer} from './packages/runtime/renderer-host.mjs';
 import * as T from 'three';
 import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
 window.proof={product,surface,mountRenderer,T,GLTFExporter};`,resolveDir:new URL('..',import.meta.url).pathname},bundle:true,write:false,format:'iife'});
const browser=await chromium.launch({headless:true,args:['--enable-webgl',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
try{
 const page=await browser.newPage();await page.setContent('<div id="live"></div><div id="fresh"></div>');await page.addScriptTag({content:outputFiles[0].text});
 const result=await page.evaluate(async()=>{
  const {product,surface,mountRenderer,T,GLTFExporter}=window.proof,clock={frame:16,fps:16,width:832,height:480,pass:'beauty'};
  const urls=[];
  for(const color of [0x2255ff,0xffcc22]){const mesh=new T.Mesh(new T.BoxGeometry(.7,1,.5),new T.MeshStandardMaterial({color}));const bytes=await new GLTFExporter().parseAsync(mesh,{binary:true});urls.push(URL.createObjectURL(new Blob([bytes])));mesh.geometry.dispose();mesh.material.dispose();}
  const root=document.querySelector('#live'),services={asset:id=>urls[Number(id)]};
  const live=await mountRenderer(product,{root,props:{backplate:false},services});
  const pixels=node=>node.querySelector('canvas').toDataURL();const states=[];
  for(const values of [{label:'FIRST',model:''},{label:'SECOND',model:''},{label:'SECOND',model:'0'},{label:'SECOND',model:'1'},{label:'FIRST',model:''}]){
   const props={...values,backplate:false};await live.render(clock,props);const shown=pixels(root);
   const freshRoot=document.querySelector('#fresh'),fresh=await mountRenderer(product,{root:freshRoot,props,services});await fresh.render(clock);
   states.push({same:shown===pixels(freshRoot),pixels:shown});await fresh.dispose();
  }
  await live.dispose();urls.forEach(url=>URL.revokeObjectURL(url));
  const source={asset:'plate',sha256:'a'.repeat(64),width:100,height:80,frames:8,frameRate:{num:24,den:1},pts:[0,.042,.083,.125,.167,.208,.25,.292],orientation:0,crop:[0,0,100,80]};
  const prepared={version:1,kind:'prepared-plate',subject:'hand',revision:'c'.repeat(64),source,alpha:{asset:'mask',sha256:'b'.repeat(64),channel:'alpha',semantics:'alpha'},provenance:{method:'test',preprocess:'test/1'},frames:source.pts.map((_,i)=>({sourceFrame:i,maskFrame:i,valid:true,reviewed:true}))};
  const track={version:1,kind:'planar',sourceSha256:source.sha256,width:100,height:80,frameRate:source.frameRate,frames:source.pts.map((_,frame)=>({frame,quad:[[10,10],[30,10],[30,70],[10,70]],confidence:1}))};
  const canvas=document.createElement('canvas');canvas.width=100;canvas.height=80;const empty=canvas.toDataURL(),ctx=canvas.getContext('2d');ctx.fillStyle='#aaa';ctx.fillRect(0,0,100,80);const original=canvas.toDataURL();
  root.style.cssText='position:relative;width:100px;height:80px';
  const props={...surface.defaultProps,prepared,track,foregroundSource:'plate',foregroundMask:'mask',headline:''};
  const instance=await surface.create({root,props,sourceFrame:id=>id==='plate'?original:empty});
  for(const frame of [0,9,1,9])await instance.render({frame,fps:30,width:100,height:80});await instance.dispose();
  return {freshParity:states.every(s=>s.same),labelChanged:states[0].pixels!==states[1].pixels,modelChanged:states[2].pixels!==states[3].pixels,undoRestored:states[0].pixels===states[4].pixels,reskinLastFrame:true};
 });
 assert.deepEqual(result,{freshParity:true,labelChanged:true,modelChanged:true,undoRestored:true,reskinLastFrame:true});
 console.log('PASS: live label/model edits and Undo match fresh renders; quantized final-frame reskin renders after reverse seeks.');
}finally{await browser.close();}
