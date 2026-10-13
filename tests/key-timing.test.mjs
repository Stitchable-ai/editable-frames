import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeControls} from '../packages/core/controls.mjs';
import {secondsToTick,keySeconds,keyAtSeconds,upsertControlKey,moveControlKey,removeControlKey,canonicalTrack,trackFrameRate} from '../packages/core/key-timing.mjs';
// The same files are asserted by Stitchable's Rust validator and desktop
// TypeScript; edit them in every consumer or in none.
const fixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}`,import.meta.url),'utf8'));
test('shared control declarations validate identically in every consumer',()=>{
  for(const c of fixture('editableframes-control-conformance.json')){
    if(c.valid)assert.doesNotThrow(()=>normalizeControls(c.panel),c.name);else assert.throws(()=>normalizeControls(c.panel),c.name);
  }
});
test('shared seconds-to-tick cases round identically in every consumer',()=>{
  for(const c of fixture('editableframes-key-clock.json'))assert.equal(secondsToTick(c.seconds,c.rate),c.tick,JSON.stringify(c));
});
test('a write on an existing tick updates that key, keeps its easing and inserts subframes',()=>{
  const rate={num:30000,den:1001},at=37*1001/30000;
  let keys=upsertControlKey([],at,[4,5,0],'ease_out',rate);
  keys=upsertControlKey(keys,at+1e-12,[7,9,0],'linear',rate);
  assert.equal(keys.length,1);assert.equal(keys[0].easing,'ease_out');assert.deepEqual(keys[0].value,[7,9,0]);
  assert.equal(keyAtSeconds(keys,at-1e-12,rate),keys[0]);
  keys=upsertControlKey(keys,37.125*1001/30000,[8,10,0],'linear',rate);
  assert.equal(keys[1].tick,37125000);
  assert.equal(upsertControlKey(keys,at,[0,0,0],'hold',rate,{preserveEasing:false})[0].easing,'hold');
  assert.throws(()=>moveControlKey(keys,keySeconds(keys[1]),keySeconds(keys[0]),rate),/occupies/);
  assert.equal(removeControlKey(keys,keySeconds(keys[0]),rate).length,1);
});
test('a canonical track keeps its grid; legacy collisions refuse without touching originals',()=>{
  const keys=canonicalTrack([{time:.5,value:1}],{num:30,den:1});
  assert.deepEqual(trackFrameRate(keys,{num:25,den:1}),{num:30,den:1});
  assert.equal(upsertControlKey(keys,.5,2,'linear',{num:25,den:1}).length,1);
  const legacy=[{time:1,value:0},{time:1+1e-12,value:1}],saved=structuredClone(legacy);
  assert.throws(()=>canonicalTrack(legacy,{num:30,den:1}),/collapse/);assert.deepEqual(legacy,saved);
  assert.throws(()=>secondsToTick(86400,{num:Number.MAX_SAFE_INTEGER,den:1}),/safe/);
});
