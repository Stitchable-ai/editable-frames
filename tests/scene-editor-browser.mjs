import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {buildScene} from '../examples/scene-editor/build.mjs';

const {html,out}=await buildScene({assetDirectory:process.env.EF_SCENE_ASSETS});
const server=http.createServer((req,res)=>res.writeHead(200,{'Content-Type':'text/html'}).end(html));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port;
let browser;const checks=[],errors=[];
try{
 browser=await chromium.launch({headless:true,args:['--enable-webgl',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage();
 p.on('pageerror',e=>errors.push(e.message));
 p.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))errors.push('External request: '+r.url());});
 const ready=()=>p.waitForFunction(()=>window.cinema?.ready);
 const state=()=>p.evaluate(()=>cinema.state);
 const seek=at=>p.evaluate(at=>cinema.seek(at),at);
 const select=anchor=>p.locator('[data-anchor="'+anchor+'"]').click();
 const mode=next=>p.locator('[data-mode="'+next+'"]').click();
 // Discover rendered semantic handles, then use trusted browser mouse input.
 async function handle(name){
  const point=await p.evaluate(name=>{
   const e=cinema.editor;e.sync();const center=e.proxy.position.clone().project(e.camera),cx=(center.x+1)/2*e.width,cy=(1-center.y)/2*e.height;
   const sync=e.sync;e.sync=()=>{};let found;
   try{for(let radius=12;radius<180&&!found;radius+=4)for(let angle=0;angle<Math.PI*2;angle+=.13){const point={x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius};if(e.hitHandle(point)?.handle===name){found=point;break;}}}finally{e.sync=sync;}
   if(!found)throw Error('No visible '+name+' handle in '+e.mode);
   const r=cinema.instance.editing.renderer.domElement.getBoundingClientRect();return {x:r.left+found.x/e.width*r.width,y:r.top+found.y/e.height*r.height};
  },name);
  await p.mouse.move(point.x,point.y);await p.mouse.down();
  await p.waitForFunction(()=>!!cinema.state.draft);
  return point;
 }
 async function drag(name,dx=60,dy=-25){const point=await handle(name);await p.mouse.move(point.x+dx,point.y+dy,{steps:6});await p.mouse.up();await p.waitForFunction(()=>!cinema.state.draft);return state();}
 await p.goto(url);await ready();const initial=await state();assert.equal(initial.kind,'drama');
 const moved=await drag('x');assert.notEqual(moved.props.actors.lead.position[0],initial.props.actors.lead.position[0]);assert.deepEqual(moved.props.actors.lead.position.slice(1),initial.props.actors.lead.position.slice(1));assert.equal(moved.history,initial.history+1);
 await p.locator('#undo').click();await p.waitForFunction(()=>cinema.state.props.actors.lead.position[0]===0);assert.deepEqual((await state()).props.actors.lead.position,initial.props.actors.lead.position);await p.locator('#redo').click();await p.waitForFunction(x=>cinema.state.props.actors.lead.position[0]===x,moved.props.actors.lead.position[0]);assert.deepEqual((await state()).props.actors.lead.position,moved.props.actors.lead.position);checks.push('Trusted axis drag, single transaction, undo and redo');
 const point=await handle('y');await p.mouse.move(point.x+20,point.y-60,{steps:4});assert.ok((await state()).draft);await p.keyboard.press('Escape');await p.mouse.up();assert.deepEqual((await state()).props,moved.props);assert.equal((await state()).history,moved.history);checks.push('Escape cancels without a history entry');
 await mode('rotate');const rotated=await drag('y',35,30);assert.notDeepEqual(rotated.props.actors.lead.orientation,moved.props.actors.lead.orientation);
 await mode('scale');const scaled=await drag('uniform',45,45);assert.ok(scaled.props.actors.lead.scale>0);assert.notEqual(scaled.props.actors.lead.scale,rotated.props.actors.lead.scale);checks.push('Quaternion rotation and positive uniform scaling');
 await p.locator('#auto-key').check();await seek(0);await p.evaluate(()=>cinema.edit({'lead.position':[0,0,0]}));await seek(96);await p.evaluate(()=>cinema.edit({'lead.position':[2,0,0]}));await seek(48);assert.ok(Math.abs((await state()).props.actors.lead.position[0]-1)<1e-8);await seek(96);assert.equal((await state()).props.actors.lead.position[0],2);await seek(48);checks.push('Frame-based keyframes interpolate and repeat after seeking');
 const saved=await p.evaluate(()=>cinema.serialize());await p.reload();await ready();await seek(48);assert.equal(await p.evaluate(()=>cinema.serialize()),saved);assert.equal((await state()).props.actors.lead.position[0],1);checks.push('Reload restores revision, history and animation');
 await select('key');await p.locator('[aria-label="key.intensity"]').fill('5');await p.locator('[aria-label="key.intensity"]').press('Enter');await p.waitForFunction(()=>cinema.state.props.key.intensity===5);checks.push('Light inspector edits');
 await select('camera');assert.equal((await state()).view,'editor');await mode('translate');const stationary=await state();await handle('x');await p.mouse.up();await p.waitForFunction(()=>!cinema.state.draft);assert.equal((await state()).history,stationary.history);assert.equal((await state()).props.shot.override,false);checks.push('Stationary camera click leaves authored shots and history unchanged');await drag('x',35,0);assert.equal((await state()).props.shot.override,true);checks.push('Shot camera is editable from a separate director view');
 await select('lead');await mode('translate');await p.locator('#auto-key').uncheck();
 const beforeOrbit=await state(),canvasBox=await p.locator('#canvas canvas').boundingBox();await p.mouse.move(canvasBox.x+canvasBox.width*.75,canvasBox.y+canvasBox.height*.5);await p.mouse.down({button:'right'});await p.mouse.move(canvasBox.x+canvasBox.width*.75+45,canvasBox.y+canvasBox.height*.5+15,{steps:4});await p.mouse.up({button:'right'});assert.equal((await state()).revision,beforeOrbit.revision);assert.ok((await state()).identity.viewRevision>beforeOrbit.identity.viewRevision);checks.push('Director navigation updates presentation without authoring a scene edit');
 const beforeCapture=await state();
 await p.evaluate(()=>cinema.capture());const clean=await p.evaluate(()=>({png:cinema.lastCapture.png,props:cinema.lastCapture.props,raw:cinema.lastCapture.raw}));
 const draftPoint=await handle('x');await p.mouse.move(draftPoint.x+70,draftPoint.y-20,{steps:4});assert.ok((await state()).draft);await p.evaluate(()=>cinema.capture());
 const during=await p.evaluate(()=>({png:cinema.lastCapture.png,props:cinema.lastCapture.props,raw:cinema.lastCapture.raw}));assert.equal(during.raw,clean.raw);assert.deepEqual(during.props,clean.props);assert.equal(during.png,clean.png);assert.ok((await state()).draft);await p.keyboard.press('Escape');await p.mouse.up();assert.deepEqual((await state()).props,beforeCapture.props);checks.push('Capture during drag uses committed shot, excludes draft and helpers, leaves gesture untouched');
 await fs.writeFile(path.join(out,'drama-reference.png'),Buffer.from(clean.png.split(',')[1],'base64'));await p.screenshot({path:path.join(out,'drama-editor.png')});
 await p.locator('#scene-kind').selectOption('battle');await p.waitForFunction(()=>cinema.ready&&cinema.state.kind==='battle');await seek(48);await select('camera');await p.locator('#play').click();await p.waitForFunction(()=>cinema.state.frame>=120);await p.locator('#play').click();assert.equal(Number(await p.locator('[aria-label="camera.position.x"]').inputValue()),-5.6);await p.locator('[aria-label="camera.position.x"]').fill('-5.5');await p.locator('[aria-label="camera.position.x"]').press('Enter');await p.waitForFunction(()=>cinema.state.props.shot.override);const shot=await p.evaluate(()=>({props:cinema.state.props.shot,position:cinema.instance.editing.camera.position.toArray(),fov:cinema.instance.editing.camera.fov}));assert.deepEqual(shot.position,[-5.5,4.4,9.2]);assert.equal(shot.fov,40);assert.deepEqual(shot.props.target,[.35,3.8,0]);await p.evaluate(()=>cinema.undo());checks.push('First camera edit preserves the evaluated shot target and lens');await select('lead');await seek(150);const battle=await state();await drag('x',40,-15);assert.notDeepEqual((await state()).props.actors.lead.position,battle.props.actors.lead.position);await p.locator('#undo').click();
 await p.evaluate(()=>cinema.capture());const battlePng=await p.evaluate(()=>cinema.lastCapture.png);await fs.writeFile(path.join(out,'battle-reference.png'),Buffer.from(battlePng.split(',')[1],'base64'));await p.screenshot({path:path.join(out,'battle-editor.png')});checks.push('Mecha-versus-ape scene renders, manipulates and captures');
 await p.locator('#scene-kind').selectOption('drama');await p.waitForFunction(()=>cinema.ready&&cinema.state.kind==='drama');assert.equal((await state()).props.key.intensity,5);checks.push('Scene switching disposes and restores independent edits');
 await select('look');await p.locator('[aria-label="look.clay"]').check();await p.waitForFunction(()=>cinema.state.props.clay&&document.querySelector('#clay').checked);await p.evaluate(()=>cinema.undo());assert.equal(await p.locator('#clay').isChecked(),false);await p.evaluate(()=>cinema.redo());assert.equal(await p.locator('#clay').isChecked(),true);
 await p.reload();await ready();assert.equal((await state()).props.clay,true);assert.equal(await p.locator('#clay').isChecked(),true);
 await p.locator('#scene-kind').selectOption('battle');await p.waitForFunction(()=>cinema.ready&&cinema.state.kind==='battle');assert.equal(await p.locator('#clay').isChecked(),false);await p.locator('#scene-kind').selectOption('drama');await p.waitForFunction(()=>cinema.ready&&cinema.state.kind==='drama');assert.equal(await p.locator('#clay').isChecked(),true);await p.locator('#clay').uncheck();await p.waitForFunction(()=>!cinema.state.props.clay);checks.push('Clay toolbar follows inspector edits, undo/redo, reload and scene switching');
 const second=await context.newPage();await second.goto(url);await second.waitForFunction(()=>window.cinema?.ready);const old=await state();await second.evaluate(()=>cinema.edit({'key.intensity':6}));await p.evaluate(()=>cinema.edit({'key.intensity':7}));assert.equal((await state()).revision,old.revision);assert.equal((await state()).props.key.intensity,5);assert.match(await p.locator('#status').textContent(),/Another window/);await second.close();checks.push('Concurrent tab edits cannot overwrite a newer saved revision');
 const standalone=await context.newPage();await standalone.goto(pathToFileURL(path.join(out,'scene-studio.html')).href);await standalone.waitForFunction(()=>window.cinema?.ready);assert.equal(await standalone.evaluate(()=>cinema.state.kind),'drama');await standalone.close();checks.push('Self-contained HTML opens directly from disk');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}catch(error){console.error(error);throw error;}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
