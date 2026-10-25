import {Matrix4,Vector3,Quaternion} from 'three';
const EPS=1e-8;
export function rigidParent(matrix) {
  const e=matrix.elements,a=new Vector3(e[0],e[1],e[2]),b=new Vector3(e[4],e[5],e[6]),c=new Vector3(e[8],e[9],e[10]);
  const lengths=[a.length(),b.length(),c.length()],scale=lengths[0];
  if(!e.every(Number.isFinite)||scale<EPS||matrix.determinant()<=0||lengths.some(l=>Math.abs(l-scale)>EPS*Math.max(1,scale))||Math.max(Math.abs(a.dot(b)),Math.abs(a.dot(c)),Math.abs(b.dot(c)))>EPS*scale*scale)throw Error('Spatial editing requires rigid or positive uniformly scaled ancestry');
  const position=new Vector3(),quaternion=new Quaternion(),scaling=new Vector3();matrix.decompose(position,quaternion,scaling);
  return {matrix:matrix.clone(),inverse:matrix.clone().invert(),quaternion,scale};
}
export function worldPivotToPosition(worldPivot,{parent,pivot,quaternion,scale,convention='pivot'}) {
  const offset=convention==='trs'?pivot.clone().multiplyScalar(scale).applyQuaternion(quaternion):pivot;
  return worldPivot.clone().applyMatrix4(parent.inverse).sub(offset);
}
export function pivotMatrix(position,quaternion,scale,pivot,convention='pivot') {
  const out=new Matrix4().compose(position,quaternion,new Vector3(scale,scale,scale));
  if(convention==='trs')return out;
  return new Matrix4().makeTranslation(position.x+pivot.x,position.y+pivot.y,position.z+pivot.z)
    .multiply(new Matrix4().compose(new Vector3(),quaternion,new Vector3(scale,scale,scale)))
    .multiply(new Matrix4().makeTranslation(-pivot.x,-pivot.y,-pivot.z));
}
/** Project within the selected axis/plane. Component clamping would change the
 * direction under a rotated parent. Plane constraints form a convex polygon. */
export function constrainTranslation({startLocal,basisWorld,parent,desired,min=-Infinity,max=Infinity,snap=0,unitScale=1}) {
  const n=basisWorld.length;if(n<1||n>2)throw Error('Translation needs an axis or plane');
  let point=desired.map(v=>snap>0?Math.round(v/(snap*unitScale))*snap*unitScale:v);
  const inv=parent.inverse,origin=new Vector3().applyMatrix4(inv);
  const basis=basisWorld.map(v=>v.clone().applyMatrix4(inv).sub(origin).toArray());
  const start=startLocal.toArray(),constraints=[];
  for(let i=0;i<3;i++) {
    const row=basis.map(v=>v[i]);
    if(Number.isFinite(max))constraints.push([row,max-start[i]]);
    if(Number.isFinite(min))constraints.push([row.map(v=>-v),start[i]-min]);
  }
  const valid=p=>constraints.every(([r,b])=>r.reduce((s,v,i)=>s+v*p[i],0)<=b+1e-8);
  if(!valid(point)) {
    const candidates=[];
    if(n===1){let lo=-Infinity,hi=Infinity;for(const [[a],b] of constraints){if(Math.abs(a)<EPS){if(b<-EPS)throw Error('Starting position is outside bounds');continue;}if(a>0)hi=Math.min(hi,b/a);else lo=Math.max(lo,b/a);}if(lo>hi)throw Error('No feasible translation');point=[Math.max(lo,Math.min(hi,point[0]))];}
    else {
      for(const [r,b] of constraints){const d=r[0]*r[0]+r[1]*r[1];if(d>EPS){const k=(r[0]*point[0]+r[1]*point[1]-b)/d;const p=[point[0]-k*r[0],point[1]-k*r[1]];if(valid(p))candidates.push(p);}}
      for(let i=0;i<constraints.length;i++)for(let j=i+1;j<constraints.length;j++){const [a,b]=constraints[i],[c,d]=constraints[j],det=a[0]*c[1]-a[1]*c[0];if(Math.abs(det)>EPS){const p=[(b*c[1]-a[1]*d)/det,(a[0]*d-b*c[0])/det];if(valid(p))candidates.push(p);}}
      if(!candidates.length)throw Error('No feasible translation');candidates.sort((a,b)=>Math.hypot(...a.map((v,i)=>v-point[i]))-Math.hypot(...b.map((v,i)=>v-point[i])));point=candidates[0];
    }
  }
  const local=startLocal.clone();for(let i=0;i<n;i++)local.addScaledVector(new Vector3(...basis[i]),point[i]);
  if(!local.toArray().every(Number.isFinite))throw Error('Nonfinite translation');
  // Remove only floating-point boundary overshoot, never a geometric component clamp.
  for(let i=0;i<3;i++){const v=local.getComponent(i),tolerance=1e-8*Math.max(1,Math.abs(v));if(v<min){if(min-v>tolerance)throw Error('Infeasible translation');local.setComponent(i,min);}if(v>max){if(v-max>tolerance)throw Error('Infeasible translation');local.setComponent(i,max);}}
  return local;
}
export function positiveScale(value,{min=.001,max=Infinity,snap=0}={}) {
  if(!Number.isFinite(value))throw Error('Degenerate scale gesture');
  const lower=Math.max(.001,min??.001);
  return Math.max(lower,Math.min(max??Infinity,snap>0?Math.round(value/snap)*snap:value));
}
