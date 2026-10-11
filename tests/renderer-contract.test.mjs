import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defineRenderer,selectionResult,canvasRenderer} from '../packages/core/renderer.mjs';
const base={id:'my-film',renderer:'a-library-invented-tomorrow',width:1280,height:720,fps:30,durationInFrames:120,create:async()=>({render(){},dispose(){}})};
test('arbitrary renderers and zero-control code remain valid',()=>{const scene=defineRenderer(base);assert.equal(scene.protocol,1);assert.equal(scene.renderer,base.renderer);assert.equal(scene.controls,undefined);assert.ok(Object.isFrozen(scene));});
test('reject invalid clocks without reinterpreting frame rate',()=>{assert.throws(()=>defineRenderer({...base,fps:NaN}));assert.throws(()=>defineRenderer({...base,frameRate:{num:30000,den:1001}}));assert.equal(defineRenderer({...base,fps:30000/1001,frameRate:{num:30000,den:1001}}).frameRate.den,1001);});
test('picking returns semantic data only and validates geometry',()=>{assert.equal(selectionResult(null),null);assert.deepEqual(selectionResult({anchor:'phone.screen',property:'content',script:'bad',bounds:{x:10,y:20,width:30,height:40}}),{anchor:'phone.screen',property:'content',bounds:{x:10,y:20,width:30,height:40}});assert.throws(()=>selectionResult({anchor:'x',bounds:{x:0,y:0,width:-2,height:2}}));});
test('Canvas adapter cleans up on preparation failure and disposal',async()=>{let removed=0,frames=[];const canvas={style:{},remove(){removed++;}};const context={root:{ownerDocument:{createElement(){return canvas;}},append(){}},props:{color:'red'}};
 const scene=canvasRenderer({...base,createRenderer:()=>({render(clock,props){frames.push([clock.frame,props.color]);},dispose(){}})});const instance=await scene.create(context);await instance.render({frame:7});await instance.dispose();assert.deepEqual(frames,[[7,'red']]);assert.equal(removed,1);
 await assert.rejects(canvasRenderer({...base,createRenderer:()=>{throw Error('bad load');}}).create(context),/bad load/);assert.equal(removed,2);
});

test('Canvas adapter awaits async picking before validating semantic results',async()=>{
 const canvas={style:{},remove(){}};
 const context={root:{ownerDocument:{createElement(){return canvas;}},append(){}},props:{}};
 const scene=canvasRenderer({...base,createRenderer:()=>({render(){},async pick(point){return point.x>0?{anchor:'hero',property:'accent'}:null;}})});
 const instance=await scene.create(context);
 assert.deepEqual(await instance.pick({x:1,y:0}),{anchor:'hero',property:'accent'});
 assert.equal(await instance.pick({x:0,y:0}),null);
 await instance.dispose();
});

test('Canvas adapter forwards optional gesture hooks without granting edit authority',async()=>{
 const context={root:{ownerDocument:{createElement:()=>({style:{},remove(){}})},append(){}},props:{}};
 const scene=canvasRenderer({...base,createRenderer:()=>({render(){},gesture:event=>({values:{x:event.point.x}})})});const instance=await scene.create(context);assert.deepEqual(await instance.gesture({point:{x:12}}),{values:{x:12}});await instance.dispose();
});
