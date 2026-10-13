import {upsertControlKey,secondsToTick} from './key-timing.mjs';
import {normalizeControls,validateControlValue} from './controls.mjs';
import {normalizeObjectHierarchy,selectableObject} from './objects.mjs';
export {normalizeObjectHierarchy,selectableObject,parentObjectId,resolveObjectSelection} from './objects.mjs';
const copy=value=>structuredClone(value);
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
function revisionToken(value) {
  if(typeof value==='string'){if(!value||value.length>256)throw Error('Invalid gesture revision');return value;}
  if(!value||typeof value.instance!=='string'||!value.instance||value.instance.length>128||!Number.isSafeInteger(value.seq)||value.seq<0)throw Error('Invalid gesture revision');
  return {instance:value.instance,seq:value.seq};
}
function identity(value) {
  if(!value||typeof value.clipId!=='string'||!value.clipId||value.clipId.length>128||!Number.isSafeInteger(value.seekGeneration)||value.seekGeneration<0)throw Error('Invalid gesture identity');
  return {clipId:value.clipId,sourceRevision:revisionToken(value.sourceRevision),revision:revisionToken(value.revision),seekGeneration:value.seekGeneration};
}
export function gestureEvent(value) {
  if(!value||!['begin','update','commit','cancel'].includes(value.phase))throw Error('Invalid gesture phase');
  for(const key of ['id','anchor'])if(typeof value[key]!=='string'||!value[key]||value[key].length>128)throw Error('Invalid gesture address');
  if(value.property!==undefined&&(typeof value.property!=='string'||!value.property||value.property.length>128))throw Error('Invalid gesture property');
  const point=p=>{if(!p||![p.x,p.y].every(Number.isFinite))throw Error('Invalid gesture point');return {x:p.x,y:p.y};};
  if(!value.clock||!Number.isFinite(value.clock.frame)||value.clock.frame<0||!Number.isFinite(value.clock.fps)||value.clock.fps<=0)throw Error('Invalid gesture source clock');
  return freeze({phase:value.phase,id:value.id,anchor:value.anchor,...(value.property!==undefined?{property:value.property}:{}),start:point(value.start),point:point(value.point),clock:copy(value.clock),operation:value.operation==='resize'?'resize':'move'});
}
export function gestureResult(value) {
  if(value==null)return null;
  if(!value.values||typeof value.values!=='object'||Array.isArray(value.values)||Object.keys(value.values).length>200)throw Error('Invalid gesture values');
  let count=0;const seen=new Set();
  const check=(v,depth=0)=>{if(++count>10000||depth>16)throw Error('Gesture values exceed JSON budget');if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return;
    if(typeof v!=='object'||seen.has(v)||!Array.isArray(v)&&![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw Error('Gesture values must be JSON');seen.add(v);for(const child of Object.values(v))check(child,depth+1);seen.delete(v);};
  check(value.values);for(const key of Object.keys(value.values))if(!key||key.length>128||['__proto__','constructor','prototype'].includes(key))throw Error('Invalid gesture control key');
  if(new TextEncoder().encode(JSON.stringify(value.values)).length>32768)throw Error('Gesture result exceeds byte budget');return freeze({values:copy(value.values)});
}
/** Await a renderer proposal; scene hooks never gain host edit authority. */
export async function invokeRendererGesture(instance,event,{timeoutMs=5000}={}) {
  if(typeof instance?.gesture!=='function')throw Error('Renderer has no gesture adapter');
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid gesture deadline');
  const request=gestureEvent(event);let timer;
  try {const value=await Promise.race([Promise.resolve().then(()=>instance.gesture(request)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Renderer gesture timed out')),timeoutMs))]);return request.phase==='cancel'?null:gestureResult(value);}
  finally{clearTimeout(timer);}
}
/** Transient absolute-value deltas; a consumer publishes the commit receipt once. */
export function createGestureSession({controls,readIdentity,now=()=>Date.now(),limits={}}) {
  if(typeof readIdentity!=='function'||typeof now!=='function')throw Error('Gesture session needs identity and clock callbacks');
  const schema=normalizeControls(controls),objects=normalizeObjectHierarchy(schema.objects??[],schema.fields.map(f=>f.anchor));
  const cap=(key,fallback,maximum)=>{const value=limits[key]??fallback;if(!Number.isSafeInteger(value)||value<1||value>maximum)throw Error('Invalid gesture budget');return value;};
  const budget={updates:cap('updates',240,10000),keys:cap('keys',64,200),bytes:cap('bytes',32768,1048576),durationMs:cap('durationMs',30000,300000)};
  const scope=crypto.randomUUID();let active=null,sequence=0;
  const snapshot=()=>active?freeze(copy({id:active.id,identity:active.identity,anchor:active.anchor,values:active.values,updates:active.updates})):null;
  function checked(input) {
    if(!active||input?.id!==active.id)throw Error('Gesture is no longer active');
    try {
      const tick=now();if(!Number.isFinite(tick)||tick<active.started||tick-active.renewed>budget.durationMs)throw Error('Gesture expired');
      if(JSON.stringify(identity(input.identity))!==JSON.stringify(active.identity)||JSON.stringify(identity(readIdentity()))!==JSON.stringify(active.identity))throw Error('Stale gesture identity');
    } catch(error){active=null;throw error;}
    return active;
  }
  return Object.freeze({
    get state(){return snapshot();},
    begin({identity:observed,anchor}) {
      if(active)throw Error('Another gesture is active');
      const expected=identity(observed);if(JSON.stringify(expected)!==JSON.stringify(identity(readIdentity())))throw Error('Stale gesture identity');
      if(!selectableObject(objects,anchor)||!schema.fields.some(f=>f.anchor===anchor))throw Error('Object has no editable gesture controls');
      const started=now();if(!Number.isFinite(started))throw Error('Invalid gesture clock');
      active={id:`${scope}:${++sequence}`,identity:expected,anchor,values:{},updates:0,started,renewed:started,windowStart:started};return snapshot();
    },
    renew(input) {const current=checked(input);current.renewed=now();return snapshot();},
    update(input) {
      const current=checked(input),values=gestureResult({values:input.values})?.values;
      if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Gesture values must be a sparse object');
      const next={...current.values};
      for(const [key,value] of Object.entries(values)){
        const field=schema.fields.find(f=>f.key===key&&f.anchor===current.anchor);if(!field)throw Error('Gesture key is not bound to the selected object');
        validateControlValue(field,value,{reset:true});Object.defineProperty(next,key,{value:copy(value),enumerable:true,writable:true,configurable:true});
      }
      if(now()-current.windowStart>=1000){current.windowStart=now();current.updates=0;}
      if(current.updates+1>budget.updates||Object.keys(next).length>budget.keys||new TextEncoder().encode(JSON.stringify(next)).length>budget.bytes){active=null;throw Error('Gesture budget exceeded');}
      current.values=next;current.updates++;return snapshot();
    },
    commit(input) {const current=checked(input),proposal=freeze(copy({identity:current.identity,anchor:current.anchor,values:current.values}));active=null;return proposal;},
    cancel({id}={}) {if(!active)return false;if(id!==active.id)throw Error('Gesture is no longer active');active=null;return true;},
  });
}
/** Optional standalone Studio consumer: one atomic batch, zero writes on update. */
export function createStudioGestureSession(studio,clipId,{seekGeneration=()=>0,now,limits,sourceSeconds=()=>0,autoKey=()=>false,easing=()=> 'smooth'}={}) {
  const clip=studio.clip(clipId),declared=studio.templates[clip.template].controls;
  if(!declared)throw Error('This template has no portable controls');
  const controls=normalizeControls(declared);
  const readIdentity=()=>{studio.clip(clipId);return {clipId,sourceRevision:studio.binding,revision:studio.revision,seekGeneration:seekGeneration()};};
  const session=createGestureSession({controls,readIdentity,now,limits});
  let at=0,startValues=[],keyOn=false;
  return Object.freeze({get state(){return session.state;},identity:readIdentity,begin:input=>{at=sourceSeconds();const rate=studio.templates[clip.template].frameRate??studio.doc.fps;secondsToTick(at,rate);startValues=studio.values(clip,clip.start+(at*120000-clip.sourceIn)/clip.rate);keyOn=autoKey();return session.begin(input);},renew:input=>session.renew(input),update:input=>session.update(input),cancel:input=>session.cancel(input),
    commit(input){const proposal=session.commit(input),commands=[];
      for(const [key,value] of Object.entries(proposal.values)){
        const f=controls.fields.find(f=>f.key===key),node=studio.node(studio.clip(clipId),f.anchor),initial=startValues.find(n=>n.id===f.anchor)?.props[f.property];
        if(JSON.stringify(initial)===JSON.stringify(value))continue;
        if(f.animatable&&(keyOn||node.keys?.[f.property]?.length))commands.push({type:'keyframes',clip:clipId,anchor:f.anchor,property:f.property,keys:upsertControlKey(node.keys?.[f.property]??[],at,value,easing(),studio.templates[clip.template].frameRate??studio.doc.fps)});
        else commands.push({type:'set',clip:clipId,anchor:f.anchor,property:f.property,value});
      }
      const receipt=commands.length?studio.execute({type:'batch',label:'Object gesture',commands},proposal.identity.revision):{noOp:true};return {proposal,receipt};},
  });
}
