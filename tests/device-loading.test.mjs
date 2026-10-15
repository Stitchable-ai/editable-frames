import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

// Bundle the real browser adapter for lifecycle checks without allocating a GPU.
const directory=await mkdtemp(path.join(tmpdir(),'editableframes-device-loading-'));
after(()=>rm(directory,{recursive:true,force:true}));
const outfile=path.join(directory,'device.mjs');
await build({entryPoints:[fileURLToPath(new URL('../website/vendor/films/device-scene.mjs',import.meta.url))],outfile,bundle:true,format:'esm',platform:'node',logLevel:'silent'});
const {DeviceScene}=await import(pathToFileURL(outfile).href);
globalThis.requestAnimationFrame=callback=>setImmediate(callback);

function harness(){
 const device=new DeviceScene(),state={gpu:0,requests:[],fail:true,downloaded:false};
 device.downloads={watch:()=>()=>{},buffer:async url=>{state.requests.push(url);if(url.endsWith('.glb')&&state.fail)throw Error('503');state.downloaded=true;return new ArrayBuffer(4)}};
 device.initialize=()=>{assert(state.downloaded);state.gpu++};
 device.environment=async()=>{device.lighting={}};
 device.load=async id=>{device.cache.set(id,{})};
 return {device,state};
}

test('a failed download allocates no GPU, then retry prepares once and cached playback reuses it',async()=>{
 const {device,state}=harness(),props={model:'craft-iphone-17-pro'};
 await assert.rejects(device.prepare(props),/503/);assert.equal(state.gpu,0);
 state.fail=false;await device.prepare(props);assert.equal(state.gpu,1);assert(device.cache.has(props.model));
 const count=state.requests.length;await device.prepare(props);assert.equal(state.requests.length,count);assert.equal(state.gpu,1);
});

test('changing clips during download skips stale GPU work and permits a later return',async()=>{
 const {device,state}=harness(),props={model:'craft-iphone-17-pro'};state.fail=false;
 await device.prepare(props,{isCurrent:()=>false});assert.equal(state.gpu,0);assert.equal(device.cache.has(props.model),false);
 await device.prepare(props,{isCurrent:()=>true});assert.equal(state.gpu,1);assert(device.cache.has(props.model));
});
