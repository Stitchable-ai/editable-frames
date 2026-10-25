import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.join(root,'examples/scene-editor'),out=path.join(root,'artifacts/scene-editor');
export function validateGLB(bytes){
 if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid GLB');
 const size=bytes.readUInt32LE(12);if(bytes.readUInt32LE(16)!==0x4e4f534a||20+size>bytes.length)throw Error('Invalid GLB JSON');
 const data=JSON.parse(bytes.subarray(20,20+size).toString('utf8'));
 const visit=v=>{if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(k==='uri'&&(typeof x!=='string'||!x.startsWith('data:')))throw Error('Model has an external dependency');visit(x);}};visit(data);return data;
}
export async function buildScene({assetDirectory}={}){
 const result=await build({entryPoints:[path.join(dir,'app.mjs')],bundle:true,format:'iife',target:'es2022',minify:true,write:false,metafile:true});
 const models={},hashes={};
 if(assetDirectory)for(const [id,file] of [['michelle','Michelle.glb'],['civilian','Civilian.glb']]){const bytes=await fs.readFile(path.join(assetDirectory,file));validateGLB(bytes);models[id]='data:model/gltf-binary;base64,'+bytes.toString('base64');hashes[id]=createHash('sha256').update(bytes).digest('hex');}
 const js=result.outputFiles[0].text,css=await fs.readFile(path.join(dir,'style.css'),'utf8'),template=await fs.readFile(path.join(dir,'index.html'),'utf8');
 const binding=createHash('sha256').update(js).update(css).update(template).update(JSON.stringify(hashes)).digest('hex');
 const html=template.replace('__STYLE__',css).replace('__ASSETS__',JSON.stringify({models,hashes}).replaceAll('<','\\u003c')).replace('__BINDING__',binding).replace('__SCRIPT__',()=>js.replaceAll('</script','<\\/script'));
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'scene-studio.html'),html);await fs.writeFile(path.join(out,'asset-receipt.json'),JSON.stringify({binding,hashes,localOnly:!!assetDirectory},null,2));
 console.log('Built scene studio: '+html.length+' bytes; '+Object.keys(models).length+' embedded local models');return {html,binding,out};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const index=process.argv.indexOf('--assets');await buildScene({assetDirectory:index>=0?process.argv[index+1]:undefined});}
