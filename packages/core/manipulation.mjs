import {normalizeControls,readPointer,validateControlValue} from './controls.mjs';
/** Open spatial adapter: authored code still draws and consumes its own props.
 * Capture coordinates/bounds at begin; never integrate pointer deltas or refit
 * assets during a gesture. Additional renderer transforms belong to toLocal. */
export function createSpatialAdapter({controls,props,objects}) {
  const schema=normalizeControls(controls);let active=null;
  const fields=anchor=>Object.fromEntries(schema.fields.filter(f=>f.anchor===anchor&&f.role).map(f=>[f.role,f]));
  // A declared objects[].pivot is in the object's local authored units; each
  // helper projects it at begin. Render the object's scale about that pivot.
  const declaredPivot=anchor=>schema.objects?.find(o=>o?.id===anchor)?.pivot;
  const capability=anchor=>{
    const binding=objects[anchor],f=fields(anchor);
    return {move:!!binding&&!!f.position,resize:!!binding&&!!f.scale};
  };
  return {
    manipulationCapabilities:({anchor})=>capability(anchor),
    getObjectBounds:({anchor,clock})=>objects[anchor]?.bounds(clock)??null,
    pick:({x,y,clock})=>{
      for(const anchor of Object.keys(objects).reverse()){
        const b=objects[anchor].bounds(clock);
        if(b&&x>=b.x&&y>=b.y&&x<=b.x+b.width&&y<=b.y+b.height)return {anchor,bounds:b};
      }return null;
    },
    gesture(event){
      if(event.phase==='cancel'){active=null;return null;}
      if(event.phase==='begin'){
        const object=objects[event.anchor],f=fields(event.anchor),operation=event.operation??'move';
        if(!object||!capability(event.anchor)[operation==='resize'?'resize':'move'])throw Error('Object has no working spatial binding');
        const b=object.bounds(event.clock);if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error('Object bounds unavailable');
        const frozen=object.freeze?.(event.clock,declaredPivot(event.anchor))??{},toLocal=frozen.toLocal??object.toLocal??(p=>[p.x,p.y,0]);
        const position=f.position?structuredClone(readPointer(props,f.position.path)??f.position.default):null;
        const scale=f.scale?(readPointer(props,f.scale.path)??f.scale.default):null;
        const pivot=frozen.pivot??{x:b.x+b.width/2,y:b.y+b.height/2};
        active={id:event.id,operation,f,position,scale,toLocal,start:toLocal(event.start),pivot,distance:Math.hypot(event.start.x-pivot.x,event.start.y-pivot.y)};
        return null;
      }
      if(!active||active.id!==event.id)throw Error('Spatial gesture is no longer active');
      const a=active,values={};
      // Declared bounds stop the object at the limit; a gesture past them is
      // ordinary pointer travel, never an invalid value.
      const within=(field,n)=>Math.min(field.max??Infinity,Math.max(field.min??-Infinity,n));
      if(a.operation==='resize'){
        const ratio=Math.hypot(event.point.x-a.pivot.x,event.point.y-a.pivot.y)/Math.max(1e-6,a.distance);
        values[a.f.scale.key]=Math.max(Number.EPSILON,within(a.f.scale,a.scale*ratio));
      }else{
        const point=a.toLocal(event.point);
        values[a.f.position.key]=a.position.map((v,i)=>within(a.f.position,v+point[i]-a.start[i]));
      }
      for(const [key,value] of Object.entries(values))validateControlValue(schema.fields.find(f=>f.key===key),value);
      if(event.phase==='commit')active=null;
      return {values};
    },
  };
}

/** DOM affine inversion includes authored nested translation/scale/rotation.
 * The host has already inverted its canvas/clip/iframe fit. Probe coordinates
 * in the element's positioning parent, then freeze this map at drag start. */
function domMatrix(node,percent=false){
  const probe=node.ownerDocument.createElement('i');
  probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;left:0;top:0';node.append(probe);
  try{const o=probe.getBoundingClientRect();probe.style.left=percent?'100%':'1px';const x=probe.getBoundingClientRect();probe.style.left='0';probe.style.top=percent?'100%':'1px';const y=probe.getBoundingClientRect();return {x:o.left,y:o.top,a:x.left-o.left,b:x.top-o.top,c:y.left-o.left,d:y.top-o.top};}finally{probe.remove();}
}
function inverse(m,p){const det=m.a*m.d-m.b*m.c;if(Math.abs(det)<1e-10)throw Error('DOM transform is singular');const x=p.x-m.x,y=p.y-m.y;return [(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det,0];}
function forward(m,p){return {x:m.x+m.a*p.x+m.c*p.y,y:m.y+m.b*p.x+m.d*p.y};}
export function domSpatialObject(element,root,{bounds,pivot}={}) {
  return {
    bounds:bounds??(()=>{const r=domMatrix(root),e=domMatrix(element,true),points=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}].map(p=>inverse(r,forward(e,p)));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};}),
    freeze:(clock,local)=>{
      const r=domMatrix(root),parent=domMatrix(element.offsetParent??element.parentElement);
      // A declared pivot is element-local CSS px; project it into renderer space.
      const declared=local?inverse(r,forward(domMatrix(element),{x:local[0],y:local[1]})):null;
      return {toLocal:p=>inverse(parent,forward(r,p)),...(pivot?{pivot}:declared?{pivot:{x:declared[0],y:declared[1]}}:{})};
    },
  };
}
