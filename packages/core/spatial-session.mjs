import {createGestureSession,gestureResult} from './interaction.mjs';
import {normalizeControls} from './controls.mjs';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=v=>structuredClone(v);
const safe=s=>typeof s==='string'&&s.length>0&&s.length<=128&&!['__proto__','constructor','prototype'].includes(s);
/** All layers opt in independently. Controls-v1 does not imply legacy gestures. */
export function negotiateSpatial({host=[],transport=[],adapter=[]}) {
  return [host,transport,adapter].every(v=>Array.isArray(v)&&v.includes(2)) ? 2 : null;
}
export function spatialOperation(capabilities,{bindingId,operation,handle,space},controls,anchor) {
  if(!capabilities?.gestureProtocols?.includes(2)||!safe(bindingId)||!['translate','rotate','scale'].includes(operation))throw Error('Unsupported spatial protocol or operation');
  const bindings=capabilities.bindings;
  if(!Array.isArray(bindings)||bindings.length>32||bindings.filter(b=>b.id===bindingId).length!==1)throw Error('Invalid spatial binding');
  const op=bindings.find(b=>b.id===bindingId).operations?.[operation];
  if(!op||!Array.isArray(op.handles)||!Array.isArray(op.spaces)||!op.handles.includes(handle)||!op.spaces.includes(space))throw Error('Unsupported spatial handle or space');
  if(!Array.isArray(op.keys)||!op.keys.length||op.keys.length>64||new Set(op.keys).size!==op.keys.length)throw Error('Invalid spatial key set');
  for(const key of op.keys)if(!safe(key)||!controls.fields.some(f=>f.key===key&&f.anchor===anchor&&!['media','model','device'].includes(f.type)))throw Error('Spatial key is outside the selected binding');
  return Object.freeze({keys:Object.freeze([...op.keys])});
}
/** Renderer proposals cannot admit or publish a transaction. A trusted host calls
 * begin/release. Publication must be revision-checked and idempotent by proposal.id.
 * publish errors are uncertain unless explicitly marked definite by the host. */
export function createSpatialSession({controls,readIdentity,publish,reconcile,now,limits}) {
  if(typeof publish!=='function'||typeof readIdentity!=='function')throw Error('Spatial session needs a host');
  const schema=normalizeControls(controls);
  let active=null;
  function identity() {
    const i=copy(readIdentity());
    for(const key of ['rendererInstance','bindingGeneration','viewRevision','viewportRevision','shot'])if(i[key]===undefined)throw Error('Incomplete spatial presentation: '+key);
    if(!i.clock||!Number.isFinite(i.clock.frame)||!Number.isFinite(i.clock.fps)||i.clock.fps<=0)throw Error('Invalid presentation clock');
    return i;
  }
  function check(id) {
    if(!active||active.id!==id)throw Error('Spatial gesture is no longer active');
    if(!same(active.identity,identity()))throw Error('Stale spatial presentation');
    return active;
  }
  function cancel(id) {
    if(!active||active.id!==id)return false;
    if(['publishing','uncertain'].includes(active.phase))return false;
    active.inner.cancel({id:active.innerId});active=null;return true;
  }
  const api={
    get state(){return active?copy({id:active.id,phase:active.phase,identity:active.identity,values:active.values,request:active.request}):null;},
    begin({trusted,identity:observed,anchor,capabilities,...request}) {
      if(trusted!==true)throw Error('A host-admitted pointer is required');
      if(active)throw Error('A spatial gesture is already active');
      const current=identity();if(!same(observed,current))throw Error('Stale spatial presentation');
      const allowed=spatialOperation(capabilities,request,schema,anchor);
      const inner=createGestureSession({controls:schema,readIdentity,now,limits});
      const b=inner.begin({identity:current,anchor});
      active={id:crypto.randomUUID(),phase:'active',identity:current,anchor,request:copy(request),allowed,inner,innerId:b.id,values:{}};
      return api.state;
    },
    update({id,values}) {
      let a;try{a=check(id);}catch(error){cancel(id);throw error;}
      if(!['active','finalizing'].includes(a.phase))throw Error('Gesture is already publishing');
      const checked=gestureResult({values}).values;
      if(Object.keys(checked).some(key=>!a.allowed.keys.includes(key)))throw Error('Proposal changes a field outside this operation');
      a.inner.update({id:a.innerId,identity:a.identity,values:checked});
      Object.assign(a.values,checked);return api.state;
    },
    renew(id){const a=check(id);a.inner.renew({id:a.innerId,identity:a.identity});},
    cancel,
    async release({id,trusted,evaluate}) {
      if(trusted!==true)throw Error('A host-admitted release is required');
      const a=check(id);if(a.phase!=='active')throw Error('Gesture already released');
      a.phase='finalizing';
      try {
        const result=await evaluate();
        if(active!==a)return {status:'cancelled'};
        check(id);if(!result||!result.values||typeof result.values!=='object'||Array.isArray(result.values))throw Error('Missing final gesture evaluation');
        const finalKeys=Object.keys(result.values);
        if(Object.keys(a.values).some(key=>!finalKeys.includes(key)))throw Error('Final evaluation omits a previously proposed field');
        api.update({id,values:result.values});
        check(id);
        const inner=a.inner.commit({id:a.innerId,identity:a.identity});
        a.proposal=Object.freeze({id:a.id,identity:copy(a.identity),anchor:a.anchor,values:copy(inner.values),request:copy(a.request)});
        // No await between this final check and consuming the write admission.
        a.phase='publishing';
      } catch(error){cancel(id);throw error;}
      try {
        const receipt=await publish(a.proposal);if(active===a)active=null;
        return {status:'committed',receipt};
      } catch(error) {
        if(error?.definite===true){if(active===a)active=null;throw error;}
        a.phase='uncertain';return {status:'uncertain',transactionId:a.id};
      }
    },
    async reconcile() {
      const a=active;if(!a||a.phase!=='uncertain'||typeof reconcile!=='function')throw Error('No reconcilable spatial transaction');
      const result=await reconcile(a.id);
      if(active!==a)throw Error('Spatial transaction replaced');
      if(['committed','failed'].includes(result?.status))active=null;
      return result;
    }
  };
  return Object.freeze(api);
}
