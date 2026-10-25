import * as T from 'three';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {normalizeControls,readPointer} from '../core/controls.mjs';
import {normalizeObjectHierarchy,selectableObject} from '../core/objects.mjs';
import {normalizeQuaternion} from '../core/rotation.mjs';
import {rigidParent,worldPivotToPosition,constrainTranslation,positiveScale} from './spatial-math.mjs';

const axes={x:new T.Vector3(1,0,0),y:new T.Vector3(0,1,0),z:new T.Vector3(0,0,1)};
const axisName=h=>h==='uniform'||h==='screen'?'XYZ':h.toUpperCase();
/** Pinned r180 facade. Never connects TransformControls DOM listeners. A host
 * forwards admitted normalized pointers; only sparse values leave this adapter.
 * Helpers occupy an independent scene; content captures never render it. */
export class ThreeSpatialEditor {
  constructor({controls,props,objects,camera,width,height}) {
    this.controls=normalizeControls(controls);this.props=props;this.objects=objects;
    this.rows=normalizeObjectHierarchy(this.controls.objects??[],this.controls.fields.map(f=>f.anchor));
    this.camera=camera;this.width=width;this.height=height;
    this.overlay=new T.Scene();this.proxy=new T.Object3D();this.overlay.add(this.proxy);
    this.transform=new TransformControls(camera,null);this.helper=this.transform.getHelper();this.overlay.add(this.helper);
    const updateGizmo=this.transform._gizmo.updateMatrixWorld.bind(this.transform._gizmo);
    this.transform._gizmo.updateMatrixWorld=(force)=>{updateGizmo(force);for(const group of [this.transform._gizmo.gizmo.scale,this.transform._gizmo.picker.scale])for(const child of group.children)child.visible=child.name==='XYZ';};
    this.transform.size=.8;this.raycaster=new T.Raycaster();this.selected=null;this.mode='translate';this.space='world';this.active=null;
    this.outline=new T.Box3Helper(new T.Box3(),0x86ddd1);this.outline.material.depthTest=false;this.outline.visible=false;this.overlay.add(this.outline);
    this.icons=[];
    for(const [anchor,b] of Object.entries(objects))if(['light','camera'].includes(b.kind)) {
      const icon=new T.Mesh(new T.OctahedronGeometry(.10),new T.MeshBasicMaterial({color:b.kind==='light'?0xffcf7a:0xaeb9ff,depthTest:false}));
      icon.userData.anchor=anchor;this.overlay.add(icon);this.icons.push({anchor,icon});
    }
  }
  fields(anchor){return Object.fromEntries(this.controls.fields.filter(f=>f.anchor===anchor&&f.role).map(f=>[f.role,f]));}
  value(f){return structuredClone(readPointer(this.props,f.path)??f.default);}
  capabilities({anchor}) {
    const b=this.objects[anchor],f=this.fields(anchor);const denied=reason=>({gestureProtocols:[2],bindings:[],disabledReason:reason});
    if(!b||!selectableObject(this.rows,anchor))return denied('Object is not editable');
    try{b.object.updateWorldMatrix(true,true);rigidParent(b.object.parent?.matrixWorld??new T.Matrix4());}catch(e){return denied(e.message);}
    const position=f.position?.coordinateSpace==='local'?f.position:null;
    const rotation=f.rotation?.coordinateSpace==='local'?f.rotation:null;
    const pivot=this.pivot(b),coupled=b.convention==='trs'&&pivot.lengthSq()>0;
    const operations={};
    if(position)operations.translate={handles:['x','y','z','xy','xz','yz','screen'],spaces:['world','local'],keys:[position.key,...(b.extraKeys??[])]};
    if(rotation&&(!coupled||position))operations.rotate={handles:['x','y','z'],spaces:['world','local'],keys:[rotation.key,...(coupled?[position.key]:[]),...(b.extraKeys??[])]};
    if(f.scale&&(!coupled||position))operations.scale={handles:['uniform'],spaces:['local'],keys:[f.scale.key,...(coupled?[position.key]:[]),...(b.extraKeys??[])]};
    return {gestureProtocols:[2],bindings:[{id:'placement',operations}]};
  }
  pivot(binding){const p=typeof binding.pivot==='function'?binding.pivot():binding.pivot;return new T.Vector3(...(p??[0,0,0]));}
  setSelection(anchor){if(this.active)throw Error('Finish the gesture before changing selection');this.selected=this.objects[anchor]&&selectableObject(this.rows,anchor)?anchor:null;this.sync();}
  setMode(mode,space=this.space){if(this.active)throw Error('Finish the gesture before changing mode');this.mode=mode;this.space=mode==='scale'?'local':space;this.transform.setMode(mode);this.transform.setSpace(this.space);this.sync();}
  setCamera(camera){if(this.active)throw Error('Camera changed during manipulation');this.camera=camera;this.transform.camera=camera;this.sync();}
  snapshot() {
    const b=this.objects[this.selected],f=this.fields(this.selected);if(!b)throw Error('No selected spatial object');
    b.object.updateWorldMatrix(true,true);
    const parent=rigidParent(b.object.parent?.matrixWorld??new T.Matrix4()),pivot=this.pivot(b);
    const position=f.position?new T.Vector3(...this.value(f.position)):b.object.position.clone();
    const quaternion=f.rotation?new T.Quaternion(...this.value(f.rotation)):b.object.quaternion.clone();
    const scale=f.scale?this.value(f.scale):b.object.scale.x;
    return {b,f,parent,pivot,position,quaternion,scale,worldPivot:pivot.clone().applyMatrix4(b.object.matrixWorld),worldQuaternion:b.object.getWorldQuaternion(new T.Quaternion()),worldScale:b.object.getWorldScale(new T.Vector3())};
  }
  sync() {
    for(const {anchor,icon} of this.icons){const b=this.objects[anchor];b.object.updateWorldMatrix(true,false);icon.position.copy(b.object.getWorldPosition(new T.Vector3()));icon.scale.setScalar(Math.max(.05,icon.position.distanceTo(this.camera.position)*.012));icon.visible=!!selectableObject(this.rows,anchor);}
    if(!this.selected){this.transform.detach();this.outline.visible=false;return;}
    const b=this.objects[this.selected];
    if(!b){this.transform.detach();this.outline.visible=false;return;}
    if(b.kind!=='light'&&b.kind!=='camera'){this.outline.box.setFromObject(b.object,true);this.outline.visible=!this.outline.box.isEmpty();}else this.outline.visible=false;
    if(this.active)return;
    const cap=this.capabilities({anchor:this.selected}),op=cap.bindings[0]?.operations[this.mode];
    if(!op){this.transform.detach();return;}
    const s=this.snapshot();this.proxy.position.copy(s.worldPivot);this.proxy.quaternion.copy(s.worldQuaternion);this.proxy.scale.copy(s.worldScale);
    this.proxy.updateMatrixWorld(true);this.transform.attach(this.proxy);this.overlay.updateMatrixWorld(true);
    // r180 has per-axis scale handles although this contract only offers uniform scale.
    for(const child of this.transform._gizmo.gizmo.scale.children)child.visible=child.name==='XYZ';
    for(const child of this.transform._gizmo.picker.scale.children)child.visible=child.name==='XYZ';
  }
  pointer(point,button=-1){return {x:point.x/this.width*2-1,y:1-point.y/this.height*2,button};}
  hitHandle(point) {
    if(this.active||!this.selected)return null;
    this.sync();if(!this.transform.object)return null;
    this.camera.updateMatrixWorld(true);this.overlay.updateMatrixWorld(true);
    this.transform.pointerHover(this.pointer(point));
    let axis=this.transform.axis;
    if(!axis)return null;
    if(this.mode==='scale'&&axis!=='XYZ')return null;
    if(this.mode==='rotate'&&!['X','Y','Z'].includes(axis))return null;
    return {anchor:this.selected,bindingId:'placement',operation:this.mode,handle:axis==='XYZ'?(this.mode==='scale'?'uniform':'screen'):axis.toLowerCase(),space:this.space};
  }
  pick(point,scene) {
    this.camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isSkinnedMesh){o.computeBoundingSphere();if(o.boundingBox)o.computeBoundingBox();}});this.raycaster.setFromCamera(this.pointer(point),this.camera);
    const icons=this.raycaster.intersectObjects(this.icons.map(i=>i.icon),false).filter(h=>h.object.visible);
    if(icons[0])return icons[0].object.userData.anchor;
    for(const hit of this.raycaster.intersectObjects(scene.children,true)) {
      let visible=true;for(let o=hit.object;o;o=o.parent)if(!o.visible)visible=false;if(!visible)continue;
      for(let o=hit.object;o;o=o.parent)for(const [anchor,b] of Object.entries(this.objects))if(b.object===o)return selectableObject(this.rows,anchor)?anchor:null;
      // A nearer opaque set object occludes subjects, even if it has no binding.
      if(!hit.object.material?.transparent)return null;
    }return null;
  }
  begin(request,point,{translationSnap=0,rotationSnap=0,scaleSnap=0}={}) {
    if(this.active)throw Error('Adapter gesture is active');
    const op=this.capabilities({anchor:this.selected}).bindings[0]?.operations[request.operation];
    if(!op?.handles.includes(request.handle)||!op.spaces.includes(request.space))throw Error('Unsupported spatial gesture');
    this.sync();const s=this.snapshot();
    this.transform.axis=axisName(request.handle);this.transform.translationSnap=null;this.transform.scaleSnap=null;this.transform.rotationSnap=rotationSnap>0?rotationSnap:null;
    this.transform.pointerDown(this.pointer(point,0));
    if(!this.transform.dragging)throw Error('Handle is not available from this camera');
    if(request.operation==='scale'&&this.transform.pointStart.length()<1e-5){this.transform.pointerUp({button:0});throw Error('Move away from the scale pivot before dragging');}
    const basis=request.handle==='screen'?[new T.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),new T.Vector3(0,1,0).applyQuaternion(this.camera.quaternion)]:[...request.handle].map(a=>axes[a]?.clone()).filter(Boolean);
    if(request.space==='local'&&request.handle!=='screen')basis.forEach(v=>v.applyQuaternion(s.worldQuaternion));
    this.active={...s,extraValues:structuredClone(typeof s.b.extraValues==='function'?s.b.extraValues():s.b.extraValues),request:structuredClone(request),translationSnap,scaleSnap,basis};
  }
  update(point) {
    const a=this.active;if(!a)throw Error('No adapter gesture');
    this.transform.pointerMove(this.pointer(point));
    const values={...a.extraValues},req=a.request;
    if(req.operation==='translate') {
      const delta=this.proxy.position.clone().sub(a.worldPivot);
      const desired=a.basis.map(v=>delta.dot(v));
      const field=a.f.position;
      const nextPosition=constrainTranslation({startLocal:a.position,basisWorld:a.basis,parent:a.parent,desired,min:field.min,max:field.max,snap:a.translationSnap,unitScale:req.space==='local'?a.parent.scale:1});
      values[field.key]=nextPosition.toArray();
      this.proxy.position.copy(a.worldPivot).add(nextPosition.clone().applyMatrix4(a.parent.matrix).sub(a.position.clone().applyMatrix4(a.parent.matrix)));
    } else {
      const quaternion=req.operation==='rotate'?a.parent.quaternion.clone().invert().multiply(this.proxy.quaternion):a.quaternion;
      const scale=req.operation==='scale'?positiveScale(this.proxy.scale.x/a.parent.scale,{min:a.f.scale.min,max:a.f.scale.max,snap:a.scaleSnap}):a.scale;
      if(req.operation==='rotate')values[a.f.rotation.key]=normalizeQuaternion(quaternion.toArray());
      else {values[a.f.scale.key]=scale;this.proxy.scale.setScalar(scale*a.parent.scale);}
      if(a.b.convention==='trs'&&a.pivot.lengthSq()>0)values[a.f.position.key]=worldPivotToPosition(a.worldPivot,{...a,quaternion,scale,convention:'trs'}).toArray();
    }
    return {values};
  }
  end(){this.transform.pointerUp({button:0});this.active=null;this.sync();}
  render(renderer) {
    this.sync();const auto=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(this.overlay,this.camera);renderer.autoClear=auto;
  }
  dispose(){this.active=null;this.transform.detach();// No DOM connection was made; r180 dispose() assumes one. Dispose its helper directly.
    this.helper.dispose();this.outline.geometry.dispose();this.outline.material.dispose();for(const {icon} of this.icons){icon.geometry.dispose();icon.material.dispose();}this.overlay.clear();}
}
