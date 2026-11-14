import test from 'node:test';import assert from 'node:assert/strict';import {resolvePorts,mediaTime,ptsIndex} from '../packages/media/ports.mjs';import {audioPlan} from '../packages/media/audio-plan.mjs';import {frameRate} from '../scripts/render.mjs';import {Studio,clone,ticks,FrameCache} from '../packages/core/index.mjs';import {template} from '../templates/media/clip.mjs';
const make=()=>{const s=new Studio({[template.id]:template},{binding:'test'});s.doc.clips=[s.make(template.id)];s.base=clone(s.doc);return s};
test('PTS lookup follows variable source timestamps and explicit end policies',()=>{assert.equal(ptsIndex([0,.04,.1,.14],.099),1);assert.equal(ptsIndex([0,.04,.1,.14],.1),2);assert.equal(mediaTime({offset:1,sourceIn:0,rate:2,end:'transparent'},.5,4),null);assert.equal(mediaTime({offset:0,sourceIn:0,rate:2,end:'loop'},3,4),2);assert.equal(mediaTime({offset:0,sourceIn:0,rate:1,end:'transparent'},4,4),null)});
test('audio mapping respects split, trim, delay, speed, mute and one track per port',()=>{const s=make(),c=s.doc.clips[0];s.execute({type:'split',clip:c.id,at:ticks(2)});const plan=audioPlan(s,{demo:{audio:true}});assert.equal(plan.length,2);assert.equal(plan[1].start,2);assert.equal(plan[1].sourceIn,2);assert.equal(plan[1].duration,2);s.execute({type:'set',clip:c.id,anchor:'presenter',property:'muted',value:true});assert.equal(audioPlan(s,{demo:{audio:true}}).length,1)});
test('rational output clock is preserved; invalid ports fail closed',()=>{assert.deepEqual(frameRate('30000/1001'),{num:30000,den:1001});assert.throws(()=>frameRate('30/0'));assert.throws(()=>resolvePorts({...template,media:{bad:{asset:'demo',rate:NaN}}},template.nodes))});
test('invalid cache sizes cannot enter an eviction loop',()=>{const c=new FrameCache(10);assert.throws(()=>c.set('a',{},-1));assert.throws(()=>c.set('a',{},NaN));assert.throws(()=>new FrameCache(-1))});

// A portable renderer's audio declaration must survive the editing adapter.
// Exercise the resulting audio schedule, not just the adapted object's shape.
test('renderer media declaration preserves clip trim, offsets, mute and speed in audio schedule',async()=>{
 const {normalizeClipModule}=await import('../packages/core/definition.mjs');
 const {defineRenderer}=await import('../packages/core/renderer.mjs');
 const {template:t}=normalizeClipModule({default:defineRenderer({id:'audio-renderer',renderer:'dom',width:160,height:90,fps:24,durationInFrames:96,
  media:{first:{asset:'a'},second:{asset:'b',offset:2},muted:{asset:'a',muted:true}},create(){return {render(){}}}})});
 const s=new Studio({[t.id]:t},{binding:'test'});s.doc.clips=[s.make(t.id)];s.base=clone(s.doc);
 const c=s.doc.clips[0],catalog={a:{audio:true,duration:2},b:{audio:true,duration:2}};
 let p=audioPlan(s,catalog);assert.equal(p.length,2);assert.deepEqual(p.map(x=>[x.asset,x.start,x.sourceIn,x.duration]),[['a',0,0,2],['b',2,0,2]]);
 s.execute({type:'timing',clip:c.id,sourceIn:ticks(.5),duration:ticks(1.5),rate:2});
 p=audioPlan(s,catalog);assert.deepEqual(p.map(x=>[x.asset,x.start,x.sourceIn,x.duration,x.rate]),[['a',0,.5,.75,2],['b',.75,0,.75,2]]);
});
