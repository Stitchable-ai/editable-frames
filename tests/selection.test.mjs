import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {framePoint,pickCanvas,pickDevice,projectedBounds} from '../examples/ae-controls/selection.mjs';

test('client coordinates account for a scaled and letterboxed preview',()=>{
 const rect={left:123,top:81,width:640,height:360};
 assert.deepEqual(framePoint(443,261,rect),{x:640,y:360});
 assert.equal(framePoint(122,261,rect),null);
 assert.equal(framePoint(443,442,rect),null);
 assert.equal(framePoint(1,1,{...rect,width:0}),null);
});
test('Canvas picking respects silhouettes, path tolerance and drawing order',()=>{
 const planet={id:'planet',circle:{x:100,y:100,r:40},x:60,y:60,w:80,h:80};
 const moon={id:'moon',circle:{x:110,y:100,r:10}};
 assert.equal(pickCanvas([planet],62,62),null); // A bounding-box corner is not the planet.
 assert.equal(pickCanvas([planet,moon],110,100).id,'moon');
 const route={id:'path',path:[{x:10,y:20},{x:200,y:20}],stroke:2};
 assert.equal(pickCanvas([route],100,23).id,'path');
 assert.equal(pickCanvas([route],100,40),null);
});
function scene(){
 const group=new T.Group(),texture=new T.Texture();
 const body=new T.Mesh(new T.BoxGeometry(2,4,.2),new T.MeshBasicMaterial());
 const screen=new T.Mesh(new T.PlaneGeometry(1.6,3.6),new T.MeshBasicMaterial({map:texture}));screen.position.z=.11;
 group.add(body,screen);const camera=new T.PerspectiveCamera(34,1280/720,.1,100);camera.position.z=8;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const point=(x,y,z)=>{const p=new T.Vector3(x,y,z).project(camera);return [(p.x+1)*640,(1-p.y)*360]};
 return {group,texture,body,screen,camera,point};
}
test('3D picking resolves screen versus body using rendered geometry and visibility',()=>{
 const {group,texture,body,screen,camera,point}=scene();
 assert.equal(pickDevice(group,camera,640,360,texture).id,'screen.route');
 assert.equal(pickDevice(group,camera,...point(.95,0,.1),texture).id,'phone.hero');
 screen.material.visible=false;
 assert.equal(pickDevice(group,camera,640,360,texture).id,'phone.hero');
 body.visible=false;assert.equal(pickDevice(group,camera,640,360,texture),null);
 body.visible=true;screen.material.visible=true;group.visible=false;
 assert.equal(pickDevice(group,camera,640,360,texture),null);
});
test('a nearer opaque mesh prevents selecting an occluded screen',()=>{
 const {group,texture,camera}=scene();
 const obstruction=new T.Mesh(new T.PlaneGeometry(2,4),new T.MeshBasicMaterial());obstruction.position.z=.5;group.add(obstruction);
 assert.equal(pickDevice(group,camera,640,360,texture).id,'phone.hero');
 obstruction.material.transparent=true;obstruction.material.opacity=0;
 assert.equal(pickDevice(group,camera,640,360,texture).id,'screen.route');
});
test('selection bounds follow real camera and parent transforms',()=>{
 const {group,camera}=scene();let bounds=projectedBounds([group],camera);
 assert.ok(bounds.x<640&&bounds.x+bounds.w>640);
 group.position.x=2;const moved=projectedBounds([group],camera);assert.ok(moved.x>bounds.x+100);
 camera.position.z=12;camera.updateMatrixWorld(true);const far=projectedBounds([group],camera);assert.ok(far.w<moved.w);
 group.visible=false;assert.equal(projectedBounds([group],camera),null);
});
