import {defineRenderer} from './renderer.mjs';
import {normalizeControls, controlsIdentity, readPointer, projectControlProps} from './controls.mjs';
const gcd = (a,b) => b ? gcd(b,a%b) : a;
export function rendererFrameRate(scene) {
  if (scene.frameRate) return {...scene.frameRate};
  let den = 1;
  while (!Number.isInteger(scene.fps * den) && den < 1_000_000) den *= 10;
  const num = Math.round(scene.fps * den), divisor = gcd(num,den);
  return {num:num/divisor,den:den/divisor};
}
/** Adapt editing handles only. Source code never becomes a node grammar. */
export function rendererTemplate(scene) {
  const controls = normalizeControls(scene.controls), identity = controlsIdentity(controls);
  const nodes = [], schemas = {};
  for (const field of controls.fields) {
    let node = nodes.find(n => n.id === field.anchor);
    if (!node) { node={id:field.anchor,type:`renderer:${field.anchor}`,label:field.anchor,props:{},keys:{}};nodes.push(node);schemas[node.type]={}; }
    // Null represents no override; defaults stay renderer-owned and can change
    // during a compatible rebind without manufacturing saved instance edits.
    node.props[field.property] = null;
    const initial = readPointer(scene.defaultProps ?? {},field.path) ?? field.default;
    schemas[node.type][field.property] = {
      ...field, type:({string:'text',bool:'boolean',media:'text',model:'text',device:'text'})[field.type] ?? field.type,
      ...(field.type === 'enum' ? {values:field.options} : {}), maxLength:1_000_000,
      keyframe:field.animatable, resettable:true, default:initial ?? null,
      controlKey:field.key, interpolation:field.interpolation,
    };
  }
  const panel = controls.presets.length ? {groups:[
    ...nodes.map(node => ({title:node.label,fields:controls.fields.filter(f=>f.anchor===node.id).map(f=>({id:f.key,anchor:f.anchor,property:f.property,label:f.label??f.key}))})),
    {title:'Presets',fields:controls.presets.map(p=>({id:`preset:${p.id}`,kind:'preset',label:p.label??p.id,operations:Object.entries(p.values).map(([key,value])=>{const f=controls.fields.find(f=>f.key===key);return {anchor:f.anchor,property:f.property,value};})}))},
  ]} : null;
  return {id:scene.id,title:scene.title??scene.id,width:scene.width,height:scene.height,duration:scene.durationInFrames/scene.fps,
    frameRate:rendererFrameRate(scene),nodes,schemas,panel,payload:{rendererProtocol:1,controlsIdentity:identity,props:{}},
    validatePayload(payload){if(!payload || payload.rendererProtocol!==1 || payload.controlsIdentity!==identity || !payload.props || typeof payload.props!=='object' || Array.isArray(payload.props))throw Error('Renderer controls changed incompatibly; rebind with an explicit reset or migration');
      if(payload.resetControls!==undefined&&(!Array.isArray(payload.resetControls)||payload.resetControls.length>controls.fields.length||new Set(payload.resetControls).size!==payload.resetControls.length||payload.resetControls.some(key=>!controls.fields.some(field=>field.key===key))))throw Error('Invalid reset control identity');},
    controls,
    resolveDefault(clip,node,property){const field=controls.fields.find(f=>f.anchor===node.id&&f.property===property);if(!field)return undefined;
      return readPointer(projectControlProps(scene.defaultProps,clip.payload.props,controls,[],clip.payload),field.path);},
    resetOverride(clip,node,property){const field=controls.fields.find(f=>f.anchor===node.id&&f.property===property);if(!field)return clip.payload;
      return {...clip.payload,resetControls:[...new Set([...(clip.payload.resetControls??[]),field.key])]};},
  };
}
export function normalizeClipModule(module) {
  const candidate = module.default ?? module.scene;
  if (candidate?.protocol === 1 && typeof candidate.create === 'function') {
    const scene=defineRenderer(candidate),template=rendererTemplate(scene);
    return {kind:'renderer',scene,template,templates:{[template.id]:template},frameRate:rendererFrameRate(scene)};
  }
  const {template,createRenderer}=module;
  if (!template?.id || !Number.isFinite(template.duration) || template.duration<=0 || typeof createRenderer!=='function') throw Error('clip.mjs must export a renderer descriptor or template + createRenderer');
  return {kind:'template',template,templates:{[template.id]:template},createRenderer,frameRate:{num:24,den:1}};
}
export function sampledRendererProps(scene,template,clip,nodes) {
  return projectControlProps(scene.defaultProps,clip.payload?.props,template.controls,nodes,clip.payload??{});
}
