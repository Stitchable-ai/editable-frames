import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function buildApps(){
 for(const app of ['effects','films','devices']){
  const cwd=path.join(root,'apps',app);
  await fs.writeFile(path.join(cwd,'binding.mjs'),"export const binding='build-probe';\n");
  await fs.writeFile(path.join(cwd,'runtime-identity.json'),'{"binding":"build-probe"}');
  const opts={absWorkingDir:root,entryPoints:[`apps/${app}/app.mjs`],bundle:true,format:'esm',target:'chrome120',minify:true,metafile:true};
  const result=await build({...opts,write:false});
  const files=Object.keys(result.metafile.inputs).filter(p=>!p.endsWith('/binding.mjs')&&!p.endsWith('/runtime-identity.json')).sort();
  const sources={};for(const f of files)sources[f]=createHash('sha256').update(await fs.readFile(path.join(root,f))).digest('hex');
  const binding=createHash('sha256').update(JSON.stringify(sources)).digest('hex');
  await fs.writeFile(path.join(cwd,'binding.mjs'),`export const binding=${JSON.stringify(binding)};\n`);
  await fs.writeFile(path.join(cwd,'runtime-identity.json'),JSON.stringify({binding,sources},null,2));
  await build({...opts,outfile:path.join(cwd,'bundle.js')});
  console.log(`${app}: ${binding.slice(0,12)}`);
 }
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildApps();
