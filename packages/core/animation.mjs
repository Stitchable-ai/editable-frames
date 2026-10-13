import {upsertControlKey,moveControlKey,removeControlKey} from './key-timing.mjs';
// Serializable temporal curves. Scene code, geometry and renderers stay unrestricted.
export function validateEasing(easing = 'linear') {
  if (['linear', 'smooth', 'hold', 'ease', 'ease_in_out', 'ease_in', 'ease_out'].includes(easing)) return;
  if(Array.isArray(easing)&&easing.length===4&&easing.every(Number.isFinite)&&easing.every(v=>v>=0&&v<=1))return;
  if (!easing || easing.type !== 'cubic-bezier' || !Array.isArray(easing.points) || easing.points.length !== 4 ||
      !easing.points.every(Number.isFinite) || easing.points.some(v => v < 0 || v > 1)) {
    throw Error('Invalid easing: use linear, smooth, hold or four cubic-bezier coordinates in [0, 1]');
  }
}
export function easeProgress(progress, easing = 'linear') {
  const x = Math.max(0, Math.min(1, progress));
  if (easing === 'hold') return x === 1 ? 1 : 0;
  if (['smooth','ease','ease_in_out'].includes(easing)) return x*x*(3-2*x);
  if(easing==='ease_in')return x*x;
  if(easing==='ease_out')return 1-(1-x)*(1-x);
  if (easing === 'linear') return x;
  validateEasing(easing);
  if (x === 0 || x === 1) return x;
  const [x1,y1,x2,y2] = Array.isArray(easing)?easing:easing.points;
  const cubic = (t,a,b) => 3*(1-t)*(1-t)*t*a + 3*(1-t)*t*t*b + t*t*t;
  // Solve x(t), not y(progress). Bisection also handles flat endpoint tangents.
  let lo=0, hi=1;
  for (let i=0;i<32;i++) { const t=(lo+hi)/2; if(cubic(t,x1,x2)<x) lo=t; else hi=t; }
  return cubic((lo+hi)/2,y1,y2);
}
export function frameSeconds(frame, fps={num:30,den:1}) {
  if (!Number.isFinite(frame) || frame<0 || !Number.isSafeInteger(fps.num) || fps.num<1 || !Number.isSafeInteger(fps.den) || fps.den<1) throw Error('Invalid frame clock');
  return frame*fps.den/fps.num;
}
// Helpers return ordinary Studio commands. Hosts use execute(command, baseRevision, actor).
// Times are clip SOURCE seconds, independent of the enclosing timeline's trim/rate.
export function editKeyframe(studio,{clip,anchor,property,frame,value,easing,preserveEasing=true,fps=studio.doc.fps}) {
  const c=studio.clip(clip), n=studio.node(c,anchor);
  const rate=studio.templates[c.template].frameRate??fps;
  const keys=upsertControlKey(n.keys?.[property]??[],frameSeconds(frame,fps),value,easing,rate,{preserveEasing});
  return {type:'keyframes',clip,anchor,property,keys,label:`Keyframe ${anchor}.${property}`};
}
export function moveKeyframe(studio,{clip,anchor,property,fromTime,frame,fps=studio.doc.fps}) {
  const c=studio.clip(clip),rate=studio.templates[c.template].frameRate??fps;
  const keys=moveControlKey(studio.node(c,anchor).keys?.[property]??[],fromTime,frameSeconds(frame,fps),rate);
  return {type:'keyframes',clip,anchor,property,keys,label:`Move ${anchor}.${property} keyframe`};
}
export function removeKeyframe(studio,{clip,anchor,property,time}) {
  const c=studio.clip(clip),rate=studio.templates[c.template].frameRate??studio.doc.fps;
  const keys=removeControlKey(studio.node(c,anchor).keys?.[property]??[],time,rate);
  return {type:'keyframes',clip,anchor,property,keys,label:`Delete ${anchor}.${property} keyframe`};
}
