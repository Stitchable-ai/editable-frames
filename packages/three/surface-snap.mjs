import * as T from 'three';

const up=new T.Vector3(0,1,0);
function visible(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;}
function within(object,root){for(let o=object;o;o=o.parent)if(o===root)return true;return false;}

/** Visible geometry only, including the evaluated skeletal pose. Frozen at admission. */
export function surfaceBounds(root){
  root.updateWorldMatrix(true,true);const bounds=new T.Box3(),point=new T.Vector3();
  root.traverse(object=>{
    if(!object.isMesh||!visible(object))return;
    if(object.isInstancedMesh){object.computeBoundingBox();bounds.union(object.boundingBox.clone().applyMatrix4(object.matrixWorld));return;}
    const position=object.geometry.attributes.position;if(!position)return;
    for(let i=0;i<position.count;i++){object.getVertexPosition(i,point);bounds.expandByPoint(point.applyMatrix4(object.matrixWorld));}
  });return bounds;
}

/** Drop an axis-aligned footprint onto explicitly admitted upward-facing geometry.
 * Nine footprint probes approximate support; this is placement, not collision/IK.
 * The ray starts above the higher of the initial/final base, so downward drags
 * cannot tunnel through a support. Higher surfaces require lifting first.
 */
export function surfaceDrop({bounds,delta=new T.Vector3(),surfaces=[],exclude,maxLift=.25,minUpDot=.7}){
  if(bounds.isEmpty())return null;
  const box=bounds.clone().translate(delta),ceiling=Math.max(bounds.min.y,box.min.y)+maxLift,ray=new T.Raycaster(),normalMatrix=new T.Matrix3();
  const meshes=new Set();
  for(const root of surfaces){root.updateWorldMatrix(true,true);root.traverse(o=>{if(o.isMesh&&visible(o)&&!within(o,exclude))meshes.add(o);});}
  if(!meshes.size)return null;
  for(const mesh of meshes)if(mesh.isSkinnedMesh){mesh.computeBoundingSphere();if(mesh.boundingBox)mesh.computeBoundingBox();}
  let best=null;
  for(const x of [box.min.x,(box.min.x+box.max.x)/2,box.max.x])for(const z of [box.min.z,(box.min.z+box.max.z)/2,box.max.z]){
    ray.set(new T.Vector3(x,ceiling+1e-6,z),new T.Vector3(0,-1,0));
    for(const hit of ray.intersectObjects([...meshes],false)){
      if(!hit.face)continue;
      const matrix=hit.object.matrixWorld.clone();
      if(hit.instanceId!==undefined){const instance=new T.Matrix4();hit.object.getMatrixAt(hit.instanceId,instance);matrix.multiply(instance);}
      const normal=hit.face.normal.clone().applyMatrix3(normalMatrix.getNormalMatrix(matrix)).normalize();
      if(normal.dot(up)<minUpDot||hit.point.y>ceiling+1e-7)continue;
      if(!best||hit.point.y>best.height)best={height:hit.point.y,object:hit.object};
    }
  }
  return best?{...best,offsetY:best.height-box.min.y}:null;
}
