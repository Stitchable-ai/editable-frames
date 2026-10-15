// Package-local Canvas measurement. Bounds come from the paths, text metrics and
// images actually painted in this frame; no placeholder selection rectangles.
const sessions = new WeakMap();
export function beginObjects(context,props){const state={props,records:new Map(),clips:[],stack:[]};sessions.set(context,state);return state;}
const matrixPoint=(m,x,y)=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];
function inversePoint(m,p){const d=m.a*m.d-m.b*m.c;if(Math.abs(d)<1e-10)throw Error('Object parent transform is singular');const x=p.x-m.e,y=p.y-m.f;return [(m.d*x-m.c*y)/d,(-m.b*x+m.a*y)/d,0];}
export function objectPoint(props,id,point,pivot){const pos=props[id+'Position']??[0,0,0],scale=props[id+'Scale']??1;return [pivot[0]+(point[0]-pivot[0])*scale+pos[0],pivot[1]+(point[1]-pivot[1])*scale+pos[1]-pos[2]];}
export function paintObject(context,props,id,pivot,draw){
 const state=sessions.get(context);if(!state)throw Error('Canvas object frame was not initialized');
 if(props[id+'Visible']===false)return;
 const position=props[id+'Position']??[0,0,0],scale=props[id+'Scale']??1,parent=context.getTransform();
 const clipAtStart=state.clips.map(b=>({...b}));
 const changed=position.some(v=>v!==0)||scale!==1;if(changed){context.save();context.translate(position[0]+pivot[0],position[1]-position[2]+pivot[1]);context.scale(scale,scale);context.translate(-pivot[0],-pivot[1]);}
 let points=[],path=[];const capture=(list,pad=0)=>{for(const [x,y] of list){const m=context.getTransform(),p=matrixPoint(m,x,y);const size=pad*Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d));points.push([p[0]-size,p[1]-size],[p[0]+size,p[1]+size]);}};
 const corners=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 const proxy=new Proxy(context,{get(target,key){const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;return (...args)=>{
  if(key==='save')state.stack.push(state.clips.map(b=>({...b})));
  if(key==='restore'&&state.stack.length)state.clips=state.stack.pop();
  if(key==='clip'&&path.length){const xs=path.map(p=>p[0]),ys=path.map(p=>p[1]);state.clips.push({x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)});}
  if(key==='beginPath')path=[];
  if(key==='moveTo'||key==='lineTo')path.push(matrixPoint(target.getTransform(),args[0],args[1]));
  if(key==='quadraticCurveTo'||key==='bezierCurveTo')for(let i=0;i<args.length;i+=2)path.push(matrixPoint(target.getTransform(),args[i],args[i+1]));
  if(key==='arc')for(const p of corners(args[0]-args[2],args[1]-args[2],args[2]*2,args[2]*2))path.push(matrixPoint(target.getTransform(),...p));
  if(key==='ellipse')for(const p of corners(args[0]-Math.max(args[2],args[3]),args[1]-Math.max(args[2],args[3]),Math.max(args[2],args[3])*2,Math.max(args[2],args[3])*2))path.push(matrixPoint(target.getTransform(),...p));
  if(key==='rect'||key==='roundRect')for(const p of corners(...args.slice(0,4)))path.push(matrixPoint(target.getTransform(),...p));
  if(key==='fill'||key==='stroke'){const pad=key==='stroke'?target.lineWidth/2:0;for(const p of path)points.push([p[0]-pad,p[1]-pad],[p[0]+pad,p[1]+pad]);}
  if(key==='fillRect'||key==='strokeRect')capture(corners(...args.slice(0,4)),key==='strokeRect'?target.lineWidth/2:0);
  if(key==='fillText'||key==='strokeText'){const m=target.measureText(String(args[0])),fontSize=Number(target.font.match(/([\d.]+)px/)?.[1]??16);capture(corners(args[1]-(m.actualBoundingBoxLeft??0),args[2]-(m.actualBoundingBoxAscent??fontSize),(m.actualBoundingBoxLeft??0)+(m.actualBoundingBoxRight??m.width),(m.actualBoundingBoxAscent??fontSize)+(m.actualBoundingBoxDescent??fontSize*.2)),key==='strokeText'?target.lineWidth/2:0);}
  if(key==='drawImage'){const q=args.length===9?args.slice(5):args.slice(1);capture(corners(q[0],q[1],q[2]??args[0].width,q[3]??args[0].height));}
  return value.apply(target,args);
 };},set(target,key,value){return Reflect.set(target,key,value,target);}});
 sessions.set(proxy,state);
 try{draw(proxy);}finally{if(changed)context.restore();}
 if(!points.length)return;
 let minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxX=Math.max(...points.map(p=>p[0])),maxY=Math.max(...points.map(p=>p[1]));
 for(const clip of [...clipAtStart,{x:0,y:0,width:context.canvas.width,height:context.canvas.height}]){minX=Math.max(minX,clip.x);minY=Math.max(minY,clip.y);maxX=Math.min(maxX,clip.x+clip.width);maxY=Math.min(maxY,clip.y+clip.height);}
 if(maxX<=minX||maxY<=minY)return;
 const old=state.records.get(id)?.bounds;if(old){minX=Math.min(minX,old.x);minY=Math.min(minY,old.y);maxX=Math.max(maxX,old.x+old.width);maxY=Math.max(maxY,old.y+old.height);}
 const x=minX,y=minY,width=maxX-minX,height=maxY-minY;
 if(width>0&&height>0)state.records.set(id,{bounds:{x,y,width,height},parent:{a:parent.a,b:parent.b,c:parent.c,d:parent.d,e:parent.e,f:parent.f},pivot:matrixPoint(parent,...objectPoint(props,id,pivot,pivot))});
}
export function canvasObjects(state,ids){return Object.fromEntries(ids.map(id=>[id,{bounds:()=>state()?.records.get(id)?.bounds??null,freeze:()=>{const record=state()?.records.get(id);if(!record)throw Error('Object was not drawn at this frame');const parent={...record.parent};return {pivot:{x:record.pivot[0],y:record.pivot[1]},toLocal:p=>inversePoint(parent,p)};}}]));}
