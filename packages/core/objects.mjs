/** Optional semantic hierarchy. These records never define drawable primitives. */
const safeId = value => typeof value === 'string' && value.length > 0 && value.length <= 128 && /^[A-Za-z0-9_.-]+$/.test(value) && !['__proto__','constructor','prototype'].includes(value);
export function normalizeObjectHierarchy(objects = [], anchors = []) {
  if (!Array.isArray(objects) || !Array.isArray(anchors) || objects.length > 500 || anchors.length > 500) throw Error('Object hierarchy exceeds its budget');
  const records = new Map();
  for (const object of objects) {
    if (!object || !safeId(object.id) || records.has(object.id)) throw Error('Invalid or duplicate object ID');
    if (object.parentId !== undefined && !safeId(object.parentId)) throw Error('Invalid parentId');
    if (object.label !== undefined && (typeof object.label !== 'string' || !object.label.trim() || new TextEncoder().encode(object.label).length > 100)) throw Error('Invalid object label');
    for (const flag of ['hidden','locked']) if (object[flag] !== undefined && typeof object[flag] !== 'boolean') throw Error('Invalid object policy');
    records.set(object.id, {id:object.id,label:object.label ?? object.id,...(object.parentId ? {parentId:object.parentId} : {}),hidden:object.hidden ?? false,locked:object.locked ?? false});
  }
  for (const object of records.values()) if(object.parentId&&!records.has(object.parentId))throw Error('Object parent must be explicitly declared');
  for (const id of anchors) {if (!safeId(id)) throw Error('Invalid anchor ID');if (!records.has(id)) records.set(id,{id,label:id,hidden:false,locked:false});}
  if (records.size > 500) throw Error('Object hierarchy exceeds its budget');
  const resolved = new Map(), visiting = new Set();
  function visit(id) {
    if (resolved.has(id)) return resolved.get(id);
    if (visiting.has(id)) throw Error('Object hierarchy contains a cycle');
    const object = records.get(id);if (!object) throw Error('Object parent is missing');
    visiting.add(id);const parent = object.parentId ? visit(object.parentId) : null;
    const hidden=object.hidden || !!parent?.hidden,locked=object.locked || !!parent?.locked;
    const row=Object.freeze({...object,hidden,locked,disabledReason:hidden?'hidden':locked?'locked':null,depth:parent?parent.depth+1:0});
    visiting.delete(id);resolved.set(id,row);return row;
  }
  for (const id of records.keys()) visit(id);
  // Stable preorder gives consumers an accessible parent-before-child object list.
  const ordered=[];function append(parentId) {for (const object of records.values()) if (object.parentId === parentId) {ordered.push(resolved.get(object.id));append(object.id);}}
  append(undefined);return Object.freeze(ordered);
}
export function selectableObject(objects,id) {return objects.find(object=>object.id===id&&!object.hidden&&!object.locked) ?? null;}
export function parentObjectId(objects,id) {
  let current=objects.find(object=>object.id===id);const seen=new Set();
  while(current?.parentId) {if(seen.has(current.parentId))throw Error('Object hierarchy contains a cycle');seen.add(current.parentId);current=objects.find(object=>object.id===current.parentId);if(current&&!current.hidden&&!current.locked)return current.id;}
  return null;
}
export function resolveObjectSelection(controls,selection) {
  if (selection == null) return null;
  if (!safeId(selection.anchor)) throw Error('Invalid selected anchor');
  const fields=controls?.fields ?? [],objects=normalizeObjectHierarchy(controls?.objects ?? [],fields.map(field=>field.anchor ?? 'root'));
  if (!selectableObject(objects,selection.anchor)) return null;
  if (selection.property !== undefined && !fields.some(field=>(field.anchor??'root')===selection.anchor&&(field.property??field.key)===selection.property)) return null;
  const result={anchor:selection.anchor,...(selection.property!==undefined?{property:selection.property}:{})};
  if(selection.bounds!==undefined){const b=selection.bounds;if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<0||b.height<0)throw Error('Invalid selection bounds');result.bounds={x:b.x,y:b.y,width:b.width,height:b.height};}
  return Object.freeze(result);
}
