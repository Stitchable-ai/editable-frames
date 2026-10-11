import {mergeRendererProps as mergeProps} from '../core/renderer.mjs';
/** Trusted-local browser host. No app bridge, account or hidden service. */
export class Readiness {
  #pending = new Map(); #failure; #revision=0;
  hold(label) { const id=Symbol(label);let release;const promise=new Promise(resolve=>release=resolve);this.#pending.set(id,{promise,release});this.#revision++;let done=false;return ()=>{if(done)return;done=true;this.#pending.delete(id);this.#revision++;release();}; }
  fail(error) { this.#failure=error instanceof Error?error:Error(String(error));for(const entry of this.#pending.values())entry.release();this.#pending.clear();this.#revision++; }
  async ready() { for (;;) {if(this.#failure)throw this.#failure;const revision=this.#revision;await Promise.all([...this.#pending.values()].map(v=>v.promise));if(this.#failure)throw this.#failure;if(revision===this.#revision)return;} }
}
const deadline = async (promise,ms,label) => {let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(`${label} timed out`)),ms))]);}finally{clearTimeout(timer);}};
export async function mountRenderer(scene,{root,props={},services={},timeoutMs=30_000}={}) {
  if (!root?.ownerDocument?.createElement || !root.append || !Number.isFinite(timeoutMs) || timeoutMs<=0) throw Error('Renderer host needs a DOM root and positive deadline');
  const current=mergeProps(scene.defaultProps??{},props),readiness=new Readiness(),controller=new AbortController();
  const supplied={};
  for (const key of ['asset','mediaFrame','captureSurface']) if (services[key]!==undefined) {if(typeof services[key]!=='function')throw Error(`Invalid ${key} service`);supplied[key]=services[key];}
  // Each mount owns a replaceable surface. A late async frame can only write
  // into its detached surface, never a retry's DOM. This is not a code sandbox.
  const surface=root.ownerDocument.createElement('div');
  surface.style.cssText='position:relative;width:100%;height:100%';root.append(surface);
  let disposed=false,instance,inputs=structuredClone(props),disposal;
  const retired=new WeakSet();
  const context={root:surface,props:current,readiness,signal:controller.signal,...supplied};
  async function disposeInstance(candidate) {
    if(!candidate||typeof candidate.dispose!=='function'||retired.has(candidate))return;
    retired.add(candidate);await deadline(Promise.resolve().then(()=>candidate.dispose()),timeoutMs,'Renderer disposal');
  }
  function retire(reason=Error('Renderer is disposed')) {
    if(disposed)return disposal;
    disposed=true;controller.abort(reason);readiness.fail(reason);surface.remove();
    disposal=disposeInstance(instance);disposal.catch(()=>{});return disposal;
  }
  const preparing=Promise.resolve().then(()=>scene.create(context));
  preparing.then(candidate=>{if(disposed)return disposeInstance(candidate);}).catch(()=>{});
  try {instance=await deadline(preparing,timeoutMs,'Renderer preparation');if(typeof instance?.render!=='function'||typeof instance?.dispose!=='function')throw Error('Renderer must return render(clock) and dispose()');}
  catch(error){await retire(error).catch(()=>{});throw error;}
  return {
    props:current,
    get disposed(){return disposed;},
    async render(clock,values) {
      if(disposed)throw Error('Renderer is disposed');
      if(values!==undefined)inputs=structuredClone(values);
      const next=mergeProps(scene.defaultProps??{},inputs);
      for(const key of Object.keys(current))delete current[key];Object.assign(current,next);
      try {
        await deadline((async()=>{await instance.render(clock);await readiness.ready();await root.ownerDocument.fonts?.ready;})(),timeoutMs,'Renderer frame');
        if(disposed)throw Error('Renderer is disposed');
      } catch(error){retire(error);throw error;}
    },
    async pick(point){if(disposed)return null;const result=instance.pick?await instance.pick(point):null;return disposed?null:result;},
    gesture:instance.gesture?event=>{if(disposed)throw Error('Renderer is disposed');return instance.gesture(event);}:undefined,
    dispose:()=>retire(),
  };
}
