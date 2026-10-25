import test from 'node:test';
import assert from 'node:assert/strict';
import {component,nodes} from './helpers/component.mjs';
test('an asynchronous frame download retains the exported scene identity',async()=>{
 const h=await component('src/components/Playground.tsx',{initial:'castle'}),tree=h.render();h.refs[15].current=true;h.refs[6].current={prepare:async()=>{},draw(){}};let complete;h.refs[5].current={toBlob:fn=>complete=fn};await nodes(tree).find(n=>n.type==='button'&&n.props.children==='↓ Save frame').props.onClick();nodes(tree).find(n=>n.type==='button'&&n.props['data-scene-switch']==='grain').props.onClick();complete(new Blob(['synthetic-frame']));assert.deepEqual(h.downloads,['editableframes-castle.png']);const event=h.events.find(e=>e.event==='playground_download_initiated');assert.equal(event.example_id,'castle');assert.equal(event.format,'png');
});
test('scene replacement during preparation abandons the stale frame export',async()=>{
 const h=await component('src/components/Playground.tsx',{initial:'castle'}),tree=h.render();h.refs[15].current=true;let prepared;h.refs[6].current={prepare:()=>new Promise(resolve=>prepared=resolve),draw(){}};let blobs=0;h.refs[5].current={toBlob(){blobs++}};const saving=nodes(tree).find(n=>n.type==='button'&&n.props.children==='↓ Save frame').props.onClick();await new Promise(setImmediate);nodes(tree).find(n=>n.type==='button'&&n.props['data-scene-switch']==='grain').props.onClick();prepared();await saving;assert.equal(blobs,0);assert.equal(h.downloads.length,0);assert.equal(h.events.filter(e=>e.event==='playground_download_initiated').length,0);
});
