import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {surfaceBounds,surfaceDrop} from '../packages/three/surface-snap.mjs';
import {ThreeSpatialEditor} from '../packages/three/spatial-editor.mjs';
const v=(x,y,z)=>new T.Vector3(x,y,z);
const floor=()=>{const m=new T.Mesh(new T.BoxGeometry(20,.2,20),new T.MeshBasicMaterial());m.position.y=-.1;return m;};
const bounds=new T.Box3(v(-.5,2,-.5),v(.5,4,.5));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('surface drop finds floor and highest support under the footprint, not overhead',()=>{
 const ground=floor(),table=new T.Mesh(new T.BoxGeometry(2,.2,2),ground.material);table.position.y=1;
 near(surfaceDrop({bounds,surfaces:[ground]}).offsetY,-2);
 near(surfaceDrop({bounds,surfaces:[ground,table]}).height,1.1);
 table.position.y=6;near(surfaceDrop({bounds,surfaces:[ground,table]}).height,0);
 assert.equal(surfaceDrop({bounds,delta:v(30,0,0),surfaces:[ground]}),null);
 table.position.set(.9,1,0);near(surfaceDrop({bounds,surfaces:[ground,table]}).height,1.1);
});
test('surface drop repairs small penetration, ignores hidden/self meshes and steep faces',()=>{
 const ground=floor(),root=new T.Group();root.add(ground);root.visible=false;assert.equal(surfaceDrop({bounds,surfaces:[ground]}),null);root.visible=true;
 assert.equal(surfaceDrop({bounds,surfaces:[root],exclude:root}),null);
 near(surfaceDrop({bounds,delta:v(0,-2.1,0),surfaces:[ground]}).offsetY,.1);
 near(surfaceDrop({bounds,delta:v(0,-5,0),surfaces:[ground]}).offsetY,3);
 const slope=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshBasicMaterial({side:T.DoubleSide}));slope.rotation.x=-Math.PI/6;
 assert.equal(surfaceDrop({bounds,surfaces:[slope]}),null);
});
test('support height respects transformed surfaces and visible posed bounds',()=>{
 const root=new T.Group(),ground=floor();root.add(ground);root.position.y=.7;root.scale.setScalar(2);near(surfaceDrop({bounds,surfaces:[ground]}).height,.7);
 const actor=new T.Group(),body=new T.Mesh(new T.BoxGeometry(1,2,1),ground.material),hidden=new T.Mesh(new T.BoxGeometry(1,10,1),ground.material);body.position.y=1;hidden.visible=false;actor.add(body,hidden);actor.position.y=3;
 near(surfaceBounds(actor).min.y,3);near(surfaceBounds(actor).max.y,5);
});
function editorFixture({enabled=true,min,max,parented=false,groundY=0}={}){
 const scene=new T.Scene(),parent=new T.Group(),object=new T.Group(),body=new T.Mesh(new T.BoxGeometry(1,2,1),new T.MeshBasicMaterial());body.position.y=1;object.add(body);parent.add(object);scene.add(parent);object.position.y=2;
 if(parented){parent.rotation.z=.35;parent.scale.setScalar(2);}
 const camera=new T.PerspectiveCamera(45,1280/720,.1,100);camera.position.set(0,3,8);camera.lookAt(0,2,0);camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
 const controls={version:1,fields:[{key:'p',anchor:'a',path:'/p',type:'vec3',animatable:true,role:'position',unit:'world-unit',coordinateSpace:'local',min,max}]};
 const ground=floor();ground.position.y+=groundY;
 const e=new ThreeSpatialEditor({controls,props:{p:[0,2,0]},objects:{a:{object,surfaceSnap:enabled}},camera,width:1280,height:720,surfaceTargets:[ground]});e.setSelection('a');e.setMode('translate','world');
 const c=e.proxy.position.clone().project(camera),start={x:(c.x+1)*640,y:(1-c.y)*360};e.begin({operation:'translate',handle:'screen',space:'world'},start,{surfaceSnap:true});return {e,start,object,parent};
}
test('surface snapping applies only on final movement; one click, drafts and opt-out stay untouched',()=>{
 for(const enabled of [true,false]){const {e,start}=editorFixture({enabled});try{
  near(e.update(start,{final:true}).values.p[1],2);
  const point={x:start.x+40,y:start.y};near(e.update(point).values.p[1],2);
  near(e.update(point,{final:true}).values.p[1],enabled?0:2);
 }finally{e.end();e.dispose();}}
});
test('final grounding converts world Y through rotated scaled parents and respects bounds',()=>{
 const {e,start,parent,object}=editorFixture({parented:true});try{
  const before=surfaceBounds(object),next=e.update({x:start.x+40,y:start.y},{final:true}).values.p;
  const delta=v(...next).sub(v(0,2,0)).multiplyScalar(2).applyQuaternion(parent.quaternion);
  near(before.min.y+delta.y,0);
 }finally{e.end();e.dispose();}
 const bounded=editorFixture({min:-1,max:5,groundY:-3});try{near(bounded.e.update({x:bounded.start.x+40,y:bounded.start.y},{final:true}).values.p[1],2);}finally{bounded.e.end();bounded.e.dispose();}
});
