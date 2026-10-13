/** THREE is injected by the harness; core never pins a rendering library.
 * Bind the complete calibrated rig root, including its screen, to position /
 * uniform scale props. No GLB loading or normalization happens here. */
export function threeSpatialObject({THREE,object,camera,width,height,pivot}) {
  // Pivots are object-local authored units; the default is the visual center.
  const center=local=>(local??pivot)?new THREE.Vector3(...(local??pivot)).applyMatrix4(object.matrixWorld):new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
  const project=(v,c)=>{const p=v.clone().project(c);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};};
  return {
    bounds(){object.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object),points=[];
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(project(new THREE.Vector3(x,y,z),camera));
      const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
    },
    freeze(clock,local){
      object.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
      const frozen=camera.clone();frozen.matrixWorld.copy(camera.matrixWorld);frozen.matrixWorldInverse.copy(camera.matrixWorldInverse);frozen.projectionMatrix.copy(camera.projectionMatrix);frozen.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      const worldPivot=center(local),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(frozen.getWorldDirection(new THREE.Vector3()),worldPivot);
      const parentInverse=object.parent?object.parent.matrixWorld.clone().invert():new THREE.Matrix4(),ray=new THREE.Raycaster();
      return {pivot:project(worldPivot,frozen),toLocal:p=>{
        ray.setFromCamera(new THREE.Vector2(p.x/width*2-1,1-p.y/height*2),frozen);
        const hit=ray.ray.intersectPlane(plane,new THREE.Vector3());if(!hit)throw Error('Pointer ray is parallel to the manipulation plane');
        return hit.applyMatrix4(parentInverse).toArray();
      }};
    },
  };
}
