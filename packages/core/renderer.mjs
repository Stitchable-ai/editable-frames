/** Merge sparse instance props; nested defaults survive, arrays remain atomic. */
export function mergeRendererProps(defaults = {}, overrides = {}) {
  const plain = value => value !== null && typeof value === 'object' &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  if (!plain(defaults) || !plain(overrides)) return structuredClone(overrides);
  const result = structuredClone(defaults);
  for (const [key, value] of Object.entries(overrides)) {
    const next = Object.hasOwn(defaults, key) ? mergeRendererProps(defaults[key], value) : structuredClone(value);
    Object.defineProperty(result, key, {value: next, writable: true, enumerable: true, configurable: true});
  }
  return result;
}

/** Portable arbitrary-code scene entrypoint. Hosts own execution isolation,
 * asset authority, cancellation and history; renderer names stay open. */
export const RENDERER_PROTOCOL = 1;
export function defineRenderer(scene) {
  if(!scene||typeof scene.id!=='string'||!scene.id.trim()||typeof scene.renderer!=='string'||!scene.renderer.trim()||typeof scene.create!=='function')throw Error('Renderer needs id, renderer and create(context)');
  for(const key of ['width','height','durationInFrames'])if(!Number.isSafeInteger(scene[key])||scene[key]<1)throw Error('Invalid renderer '+key);
  if(!Number.isFinite(scene.fps)||scene.fps<=0)throw Error('Invalid renderer fps');
  if(scene.frameRate&&(!Number.isSafeInteger(scene.frameRate.num)||scene.frameRate.num<1||!Number.isSafeInteger(scene.frameRate.den)||scene.frameRate.den<1||Math.abs(scene.frameRate.num/scene.frameRate.den-scene.fps)>1e-7))throw Error('Renderer frameRate disagrees with fps');
  if(scene.animationPolicy!==undefined&&!['clock','authored'].includes(scene.animationPolicy))throw Error('Invalid animation policy');
  return Object.freeze({...scene,protocol:RENDERER_PROTOCOL});
}
/** Optional picking result; not a grammar for scene objects. Coordinates are
 * renderer-local CSS pixels, so the host can apply its own projection. */
export function selectionResult(value) {
  if(value==null)return null;
  if(typeof value.anchor!=='string'||!value.anchor||value.anchor.length>128)throw Error('Picking needs a stable anchor');
  if(value.property!==undefined&&(typeof value.property!=='string'||!value.property))throw Error('Invalid selected property');
  const result={anchor:value.anchor,...(value.property?{property:value.property}:{})};
  if(value.bounds!==undefined){
    const b=value.bounds;if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<0||b.height<0)throw Error('Invalid selection bounds');
    result.bounds={x:b.x,y:b.y,width:b.width,height:b.height};
  }
  return Object.freeze(result);
}
/** Preserve authored source and arbitrary props. This optional adapter bridges
 * a Canvas implementation into the explicit-time renderer contract. The legacy
 * template render({time, nodes, ...}) API is a separate, unchanged entrypoint. */
export function canvasRenderer({id,width,height,fps,durationInFrames,defaultProps,createRenderer,...metadata}) {
  if(typeof createRenderer!=='function')throw Error('Canvas adapter needs createRenderer(canvas, context)');
  return defineRenderer({...metadata,id,width,height,fps,durationInFrames,defaultProps,renderer:'canvas-2d',async create(context){
    const canvas=context.root.ownerDocument.createElement('canvas');canvas.width=width;canvas.height=height;canvas.style.cssText='width:100%;height:100%;display:block';context.root.append(canvas);
    let instance;try{instance=await createRenderer(canvas,context);}catch(error){canvas.remove();throw error;}
    if(typeof instance?.render!=='function'){canvas.remove();throw Error('Canvas adapter must return render(clock, props)');}
    return {render:clock=>instance.render(clock,context.props),pick:instance.pick?async point=>selectionResult(await instance.pick(point)):undefined,gesture:instance.gesture?event=>instance.gesture(event):undefined,async dispose(){try{await instance.dispose?.();}finally{canvas.remove();}}};
  }});
}
