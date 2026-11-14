/** A renderer gesture proposes an immutable correction book; the embedding
 * editor owns commit/revision checks and Undo. No disk or model side effects. */
export function createMaskCorrectionSession(){
 let active=null;
 return {
  gesture(event,{book,sourceSha256,subject,sourceFrame,sourceWidth,sourceHeight,width,height,operation='add',radius=12}={}){
   if(!['add','subtract','replace'].includes(operation)||![sourceWidth,sourceHeight,width,height,radius].every(n=>Number.isFinite(n)&&n>0)||!Number.isSafeInteger(sourceFrame)||sourceFrame<0)throw Error('Invalid correction gesture context');
   const point=p=>[Math.max(0,Math.min(sourceWidth,p.x/width*sourceWidth)),Math.max(0,Math.min(sourceHeight,p.y/height*sourceHeight))];
   if(event.phase==='cancel'){active=null;return null;}
   if(event.phase==='begin'){
    if(book&&(book.sourceSha256!==sourceSha256||book.subject!==subject))throw Error('Correction source/subject changed');
    active={id:event.id,frame:sourceFrame,points:[point(event.start)],book:structuredClone(book??{version:1,sourceSha256,subject,keys:[]})};return null;
   }
   if(!active||active.id!==event.id)return null;
   if(active.frame!==sourceFrame){active=null;throw Error('Source frame changed during correction');}
   const p=point(event.point),last=active.points.at(-1);
   if(Math.hypot(p[0]-last[0],p[1]-last[1])>1 && active.points.length<4096)active.points.push(p);
   if(event.phase!=='commit')return null;
   const pending=active;active=null;
   const points=pending.points.length<3?Array.from({length:20},(_,i)=>{const a=i/20*Math.PI*2;return[p[0]+Math.cos(a)*radius,p[1]+Math.sin(a)*radius];}):pending.points;
   const next=pending.book,existing=next.keys.find(k=>k.frame===sourceFrame);
   const polygon={operation,points};
   if(existing)existing.polygons.push(polygon);else next.keys.push({frame:sourceFrame,polygons:[polygon]});
   next.keys.sort((a,b)=>a.frame-b.frame);
   return {values:{corrections:next}};
  },
  cancel(){active=null;},
 };
}
