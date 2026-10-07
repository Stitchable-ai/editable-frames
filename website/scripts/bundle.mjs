import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
for(const [entry,out]of [['vendor/films/renderer.mjs','scenes'],['vendor/films/device-scene.mjs','device'],['vendor/core.mjs','core']])await build({entryPoints:[fileURLToPath(new URL(entry,root))],outfile:fileURLToPath(new URL(`public/runtime/${out}.mjs`,root)),alias:{'three/addons':fileURLToPath(new URL('node_modules/three/examples/jsm',root)),three:fileURLToPath(new URL('node_modules/three',root))},bundle:true,format:'esm',minify:true,target:'es2022'});
const file=new URL('src/data/runtime.json',root),identity=JSON.parse(await readFile(file,'utf8'));
for(const name of ['scenes','device','core'])identity.hashes[name+'.mjs']=createHash('sha256').update(await readFile(new URL(`public/runtime/${name}.mjs`,root))).digest('hex');
// Binding versions the editable document contract, not visual fixes or added templates.
await writeFile(file,JSON.stringify(identity)+'\n');
console.log('Bundled scene, device and history runtimes; compatible saved-edit binding retained.');
