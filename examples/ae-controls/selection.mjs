// Optional renderer-side picking: stable anchors, never a core scene grammar.
import {Box3,Vector2,Vector3,Raycaster} from 'three';
export function framePoint(clientX,clientY,rect,width=1280,height=720){
 if(rect.width<=0||rect.height<=0)return null;
 const x=(clientX-rect.left)*width/rect.width,y=(clientY-rect.top)*height/rect.height;
 return x<0||y<0||x>width||y>height?null:{x,y};
}
function visible(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true}
export function pickDevice(group,camera,x,y,screenTexture){
 group.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
 const ray=new Raycaster();ray.setFromCamera(new Vector2(x/1280*2-1,1-y/720*2),camera);
 for(const hit of ray.intersectObject(group,true)){
  const material=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex??0]:hit.object.material;
  if(!visible(hit.object)||!material?.visible||(material.transparent&&material.opacity<=.001))continue;
  return {id:material.map===screenTexture?'screen.route':'phone.hero',parent:material.map===screenTexture?'phone.hero':null};
 }
 return null;
}
export function projectedBounds(objects,camera){
 const box=new Box3();for(const object of objects)if(visible(object))box.union(new Box3().setFromObject(object));
 if(box.isEmpty())return null;const points=[];
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const p=new Vector3(x,y,z).project(camera);if(p.z>=-1&&p.z<=1)points.push({x:(p.x+1)*640,y:(1-p.y)*360});
 }
 if(!points.length)return null;const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y));
 return {x:left,y:top,w:Math.max(...points.map(p=>p.x))-left,h:Math.max(...points.map(p=>p.y))-top};
}
export function pickCanvas(hits,x,y){
 for(const h of [...hits].reverse()){
  if(h.circle){if(Math.hypot(x-h.circle.x,y-h.circle.y)<=h.circle.r)return h;continue;}
  if(h.path){for(let i=1;i<h.path.length;i++){const a=h.path[i-1],b=h.path[i],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,u=l?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l)):0;if(Math.hypot(x-a.x-u*dx,y-a.y-u*dy)<=Math.max(6,h.stroke/2))return h;}continue;}
  if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)return h;
 }
 return null;
}
