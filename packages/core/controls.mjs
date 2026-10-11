import {normalizeObjectHierarchy} from './objects.mjs';
import {mergeRendererProps as mergeProps} from './renderer.mjs';
export {mergeProps};
/** Optional portable editing handles. No drawable objects or renderer whitelist. */
const unsafe = new Set(['__proto__', 'prototype', 'constructor']);
const own = (o, k) => Object.hasOwn(o, k);
const copy = value => structuredClone(value);
function id(value, label) {
  if (typeof value !== 'string' || !value || value.length > 128 || unsafe.has(value)) throw Error(`Invalid ${label}`);
  return value;
}
export function pointerParts(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 1024) throw Error('Control path must be a JSON Pointer');
  return path.slice(1).split('/').map(part => {
    if (/~(?![01])/u.test(part)) throw Error('Invalid JSON Pointer escape');
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!key || unsafe.has(key)) throw Error('Unsafe control path');
    return key;
  });
}
export function readPointer(props, path) {
  let value = props;
  for (const key of pointerParts(path)) {
    if (!value || typeof value !== 'object' || !own(value, key)) return undefined;
    value = value[key];
  }
  return value;
}
export function writePointer(props, path, value) {
  const parts = pointerParts(path); let target = props;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!own(target, key)) target[key] = /^\d+$/u.test(parts[i + 1]) ? [] : {};
    if (!target[key] || typeof target[key] !== 'object') throw Error('Control binding traverses a scalar');
    target = target[key];
  }
  target[parts.at(-1)] = copy(value);
}
export function validateControlValue(field, value, {reset = false} = {}) {
  if (reset && value === null) return;
  const finite = n => Number.isFinite(n) && (field.min === undefined || n >= field.min) && (field.max === undefined || n <= field.max);
  const validators = {
    number: () => typeof value === 'number' && finite(value),
    vec3: () => Array.isArray(value) && value.length === 3 && value.every(finite),
    color: () => typeof value === 'string' && /^#[\da-f]{6}([\da-f]{2})?$/iu.test(value),
    string: () => typeof value === 'string', bool: () => typeof value === 'boolean',
    enum: () => field.options.includes(value),
    json: () => value !== undefined && JSON.stringify(value) !== undefined,
    media: () => typeof value === 'string', model: () => typeof value === 'string', device: () => typeof value === 'string',
  };
  if (!validators[field.type]?.()) throw Error(`Invalid value for control ${field.key}`);
}
export function normalizeControls(controls) {
  if (controls == null) return {version: 1, fields: [], presets: []};
  if (controls.version !== 1 || !Array.isArray(controls.fields) || controls.fields.length > 200) throw Error('Invalid controls v1 declaration');
  const keys = new Set(), bindings = new Set(), paths = [];
  const fields = controls.fields.map(raw => {
    const key = id(raw.key, 'control key'), anchor = id(raw.anchor ?? 'root', 'anchor'), property = id(raw.property ?? key, 'property');
    if (keys.has(key) || bindings.has(JSON.stringify([anchor, property]))) throw Error('Duplicate control identity');
    keys.add(key); bindings.add(JSON.stringify([anchor, property]));
    const path = raw.path ?? '/' + key.replace(/~/g, '~0').replace(/\//g, '~1');
    const parts = pointerParts(path);
    if (paths.some(previous => parts.every((v, i) => previous[i] === v) || previous.every((v, i) => parts[i] === v))) throw Error('Overlapping control paths');
    paths.push(parts);
    if (!['number','vec3','color','string','bool','enum','json','media','model','device'].includes(raw.type)) throw Error('Unknown control type');
    for (const bound of ['min','max','step']) if (raw[bound] !== undefined && !Number.isFinite(raw[bound])) throw Error('Invalid control bound');
    if (raw.min !== undefined && raw.max !== undefined && raw.min > raw.max) throw Error('Reversed control bounds');
    if (raw.step !== undefined && raw.step <= 0) throw Error('Invalid control step');
    if (raw.animatable !== undefined && typeof raw.animatable !== 'boolean') throw Error('Invalid animatable flag');
    const interpolation = raw.interpolation ?? (['number','vec3'].includes(raw.type) ? 'continuous' : 'discrete');
    if (!['continuous','discrete'].includes(interpolation) || interpolation === 'continuous' && !['number','vec3'].includes(raw.type)) throw Error('Invalid control interpolation');
    if (raw.type === 'enum' && (!Array.isArray(raw.options) || !raw.options.length || raw.options.some(v => typeof v !== 'string'))) throw Error('Enum needs string options');
    const field = {...copy(raw),key,anchor,property,path,animatable:raw.animatable ?? false,interpolation};
    if (own(field, 'default')) validateControlValue(field, field.default);
    return field;
  });
  const presetIds = new Set();
  if (controls.presets !== undefined && !Array.isArray(controls.presets)) throw Error('Invalid control presets');
  const presets = (controls.presets ?? []).map(preset => {
    const presetId = id(preset.id, 'preset');
    if (presetIds.has(presetId) || !preset.values || typeof preset.values !== 'object' || Array.isArray(preset.values)) throw Error('Invalid control preset');
    presetIds.add(presetId);
    for (const [key, value] of Object.entries(preset.values)) {
      const field = fields.find(f => f.key === key); if (!field) throw Error('Unknown preset control');
      validateControlValue(field, value, {reset:true});
    }
    return copy(preset);
  });
  normalizeObjectHierarchy(controls.objects??[],fields.map(field=>field.anchor));
  return {version:1,fields,presets,...(controls.objects!==undefined?{objects:copy(controls.objects)}:{})};
}
export function controlsIdentity(controls) {
  return JSON.stringify(controls.fields.map(({key,anchor,property,path,type,unit,animatable,interpolation}) =>
    ({key,anchor,property,path,type,unit:unit ?? null,animatable,interpolation})).sort((a,b) => a.key.localeCompare(b.key)));
}
/** Unexposed props remain ordinary authored data; null means reset, not a value. */
export function projectControlProps(defaultProps, instanceProps, controls, nodes, {resetControls=[]}={}) {
  const props = mergeProps(defaultProps ?? {}, instanceProps ?? {}), resets=new Set(resetControls);
  for (const field of controls.fields) {
    const value = nodes.find(node => node.id === field.anchor)?.props[field.property];
    if (value !== null && value !== undefined) writePointer(props, field.path, value);
    else if(resets.has(field.key)) {
      const authored=readPointer(defaultProps??{},field.path);
      if(authored!==undefined)writePointer(props,field.path,authored);
      else {const parts=pointerParts(field.path);let target=props;
        for(const part of parts.slice(0,-1)){if(!target||typeof target!=='object'||!own(target,part)){target=null;break;}target=target[part];}
        if(target&&typeof target==='object')delete target[parts.at(-1)];}
    }
  }
  return props;
}
