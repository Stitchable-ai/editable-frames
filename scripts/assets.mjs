import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash,randomUUID} from 'node:crypto';import {zipSync,unzipSync} from 'fflate';import {root} from './build.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
export async function catalog(){return JSON.parse(await fs.readFile(path.join(root,'assets/devices/catalog.json'),'utf8'))}
export async function verify({all=false}={}){
 const {models}=await catalog(),results=[];
 for(const m of models){const p=path.join(root,m.runtimeFile);let b;try{b=await fs.readFile(p)}catch{if(m.starter||all)throw Error('Missing device: '+m.id);results.push({id:m.id,present:false});continue}if(digest(b)!==m.runtimeSha256||b.length!==m.runtimeBytes)throw Error('Device hash mismatch: '+m.id);if(b.toString('ascii',0,4)!=='glTF')throw Error('Invalid GLB: '+m.id);results.push({id:m.id,present:true})}
 return {total:models.length,present:results.filter(x=>x.present).length,results};
}
export async function pack(){
 await verify({all:true});const files={};
 async function walk(dir){for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const rel=dir+'/'+e.name;if(e.isDirectory())await walk(rel);else files[rel]=new Uint8Array(await fs.readFile(path.join(root,rel)))}}
 await walk('assets/devices');await walk('assets/environments');await walk('licenses');
 const bytes=zipSync(files,{level:1}),dir=path.join(root,'dist');await fs.mkdir(dir,{recursive:true});const name='editableframes-devices-v1.zip';await fs.writeFile(path.join(dir,name),bytes);const receipt={file:name,sha256:digest(bytes),bytes:bytes.length,models:55};await fs.writeFile(path.join(dir,name+'.json'),JSON.stringify(receipt,null,2));await fs.writeFile(path.join(dir,'SHA256SUMS'),receipt.sha256+'  '+name+'\n');return receipt;
}
export async function installPack(file){
 // Only known model paths and pinned bytes enter the checkout. Archive code is never executed.
 const {models}=await catalog(),allow=new Map(models.map(m=>[m.runtimeFile.replace(/^\//,''),m]));
 let bytes;if(/^https:\/\//.test(file)){const response=await fetch(file);if(!response.ok)throw Error('Download failed: '+response.status);bytes=new Uint8Array(await response.arrayBuffer())}else bytes=new Uint8Array(await fs.readFile(file));
 if(bytes.length>400*1024*1024)throw Error('Asset pack exceeds size limit');
 const files=unzipSync(bytes,{filter:e=>allow.has(e.name)&&e.originalSize<=30*1024*1024});
 for(const [rel,m]of allow){const b=files[rel];if(!b||b.length!==m.runtimeBytes||digest(b)!==m.runtimeSha256)throw Error('Pack missing or changed model: '+m.id)}
 const temp=path.join(root,'assets/devices','.install-'+randomUUID());await fs.mkdir(temp);
 try{for(const [rel,b]of Object.entries(files))await fs.writeFile(path.join(temp,path.basename(rel)),b);await fs.mkdir(path.join(root,'assets/devices/models'),{recursive:true});for(const rel of allow.keys())await fs.rename(path.join(temp,path.basename(rel)),path.join(root,rel))}finally{await fs.rm(temp,{recursive:true,force:true})}
 return verify({all:true});
}
export async function run(args){const [cmd,file]=args;let result;if(cmd==='list')result=(await catalog()).models.map(({id,title,category,license,author,sourceUrl,starter})=>({id,title,category,license,author,sourceUrl,starter}));else if(cmd==='verify')result=await verify();else if(cmd==='pack')result=await pack();else if(cmd==='install-pack'&&file)result=await installPack(file);else throw Error('assets list|verify|pack|install-pack FILE-or-HTTPS-URL');console.log(JSON.stringify(result,null,2))}
if(process.argv[1]===fileURLToPath(import.meta.url))await run(process.argv.slice(2));
