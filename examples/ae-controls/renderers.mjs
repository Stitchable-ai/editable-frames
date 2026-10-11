import {pickDevice,projectedBounds} from './selection.mjs';
import {DeviceScene} from './device.mjs';
const text=(c,s,x,y,size=18,color='#e8eadd',family='Arial')=>{c.fillStyle=color;c.font=`${size}px ${family}`;c.fillText(s,x,y)};
const box=(c,x,y,w,h,r,fill)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()};
const route=Array.from({length:120},(_,i)=>[100+Math.sin(i*.055)*105+i*1.85,765-i*4.2+Math.sin(i*.12)*30]);
function trailScreen(canvas,p){const c=canvas.getContext('2d');c.fillStyle='#132625';c.fillRect(0,0,480,1040);
 for(let j=0;j<17;j++){c.beginPath();for(let i=0;i<100;i++){const x=i*5,y=220+j*34+Math.sin(i*.11+j*.5)*24+Math.cos(i*.17)*12;c[i?'lineTo':'moveTo'](x,y)}c.strokeStyle=j%3?'#24443d':'#365444';c.lineWidth=1;c.stroke()}
 text(c,'9:41',36,44,18);text(c,'TRAIL',30,142,38,p.accent);text(c,'Your next chapter starts outside.',30,184,18,'#a5b3a2');
 const pts=route.slice(0,Math.max(1,Math.round(route.length*p.progress)));c.beginPath();pts.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));c.strokeStyle=p.accent;c.lineWidth=7;c.lineCap='round';c.lineJoin='round';c.stroke();const [x,y]=pts.at(-1);c.fillStyle='#f8eed3';c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.fill();
 box(c,24,804,432,152,24,'#f0eedc');text(c,'RIDGELINE LOOP',45,843,17,'#365343');text(c,(p.distance*p.progress).toFixed(1)+' km',45,895,37,'#1d372d');text(c,'↑  420 m',280,891,23,'#516b51');text(c,'Keep going. You’re on the right path.',45,928,16,'#516b51');box(c,163,1018,154,5,3,'#eeeeda');
}
export class PhoneRenderer extends DeviceScene {
 pick(x,y,v){const item=this.cache.get(v['phone.hero'].model);return item?pickDevice(item.group,this.camera,x,y,item.display):null}
 bounds(anchor,v){const item=this.cache.get(v['phone.hero'].model);if(!item)return null;const objects=[];if(anchor==='phone.hero')objects.push(item.group);else if(anchor==='screen.route')item.group.traverse(o=>{if(o.isMesh&&[o.material].flat().some(m=>m.map===item.display))objects.push(o)});return projectedBounds(objects,this.camera)}
 render(t,v){const p=v['phone.hero'],cam=v['camera.main'];const item=this.cache.get(p.model);if(!item)return null;for(const [id,m]of this.cache)m.group.visible=id===p.model;
 item.materials.apply(p.finish);item.group.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat())if(item.hidden.includes(m.name))m.visible=false;});trailScreen(this.screen,v['screen.route']);item.display.needsUpdate=true;
 this.lighting.apply({exposure:cam.exposure,rotation:110,background:'#e8e6de'});
 this.pivot.position.set(p.x,p.y,0);this.pivot.rotation.set(p.pitch*Math.PI/180,p.yaw*Math.PI/180,0);this.pivot.scale.setScalar(p.scale);
 const a=cam.azimuth*Math.PI/180;this.camera.position.set(Math.sin(a)*cam.distance,cam.elevation,Math.cos(a)*cam.distance);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);return this.renderer.domElement;
 }
}
export function drawScene(canvas,id,t,v,phone,selected,handles=true,domText=false){const c=canvas.getContext('2d');c.clearRect(0,0,1280,720);const hit=[];
 if(id==='trail'){const img=phone.render(t,v);if(img)c.drawImage(img,0,0);const title=v['title.hero'],card=v['callout.route'];
 text(c,'T R A I L   /   FIND YOUR WAY',84,70,16,'#536859');text(c,'PRODUCT STUDY    01 / 02',958,70,12,'#536859');
 if(!domText){c.save();c.globalAlpha=title.opacity;title.text.split('\n').forEach((s,i)=>text(c,s,title.x,title.y+i*75,67,'#243d32','Georgia'));text(c,'An everyday escape, beautifully mapped.',title.x,title.y+160,20,'#687768');c.restore();
 c.save();c.globalAlpha=card.opacity;box(c,card.x,card.y,377,82,14,'#213d32');text(c,card.label,card.x+22,card.y+34,19,'#edf1dc');text(c,'RIDGELINE LOOP    ·    8.4 KM    ·    420 M ↑',card.x+22,card.y+59,11,'#b5cb9b');c.restore();
 }
 text(c,'PROCEDURAL SCREEN  /  REAL GLB  /  KEYFRAMED CAMERA',84,673,12,'#637664');if(!domText){if(title.opacity>.01)hit.push({id:'title.hero',x:title.x-8,y:title.y-60,w:470,h:240});if(card.opacity>.01)hit.push({id:'callout.route',x:card.x,y:card.y,w:377,h:82})}
 }else{
 c.fillStyle='#182722';c.fillRect(0,0,1280,720);c.strokeStyle='#344039';c.lineWidth=1;for(let x=40;x<1280;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,720);c.stroke()}for(let y=40;y<720;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(1280,y);c.stroke()}
 const path=v['orbit.path'];c.save();c.translate(895,355);c.rotate(-.4);c.beginPath();c.ellipse(0,0,280,146,0,-Math.PI/2,-Math.PI/2+Math.PI*2*path.reveal);c.strokeStyle=path.color;c.lineWidth=path.width;c.stroke();c.restore();const count=Math.max(2,Math.ceil(path.reveal*180));const points=Array.from({length:count},(_,i)=>{const angle=-Math.PI/2+i/(count-1)*Math.PI*2*path.reveal,x=280*Math.cos(angle),y=146*Math.sin(angle);return {x:895+x*Math.cos(-.4)-y*Math.sin(-.4),y:355+x*Math.sin(-.4)+y*Math.cos(-.4)}});if(path.reveal>0)hit.push({id:'orbit.path',path:points,stroke:path.width,x:590,y:170,w:610,h:370});
 for(const id of ['planet.main','planet.moon']){const p=v[id];c.save();c.translate(p.x,p.y);c.rotate(p.turn*Math.PI/180);const g=c.createRadialGradient(-p.radius*.35,-p.radius*.4,2,0,0,p.radius);g.addColorStop(0,p.color);g.addColorStop(1,id==='planet.main'?'#865c42':'#375b65');c.fillStyle=g;c.beginPath();c.arc(0,0,p.radius,0,Math.PI*2);c.fill();c.save();c.clip();c.strokeStyle='#ffffff25';for(let i=-4;i<=4;i++){c.beginPath();c.ellipse(0,i*p.radius*.22,p.radius,p.radius*.24,0,0,Math.PI*2);c.stroke()}c.restore();c.restore();hit.push({id,x:p.x-p.radius,y:p.y-p.radius,w:p.radius*2,h:p.radius*2,circle:{x:p.x,y:p.y,r:p.radius}})}
 const p=v['title.hero'];if(!domText){c.save();c.globalAlpha=p.opacity;p.text.split('\n').forEach((s,i)=>text(c,s,p.x,p.y+i*71,61,'#e9ebd7','Georgia'));text(c,'Every object has its own story. And its own timeline.',p.x,p.y+160,18,'#a5b39d');c.restore();}text(c,'O R B I T    /    A STUDY IN CONNECTION',84,70,14,'#b5c79e');text(c,'CANVAS 2D  /  THE SAME ANCHORS, CURVES AND HISTORY',84,673,12,'#a5b39d');if(!domText&&p.opacity>.01)hit.push({id:'title.hero',x:p.x-8,y:p.y-60,w:535,h:240});
 }
 if(handles){const h=hit.find(o=>o.id===selected);if(h){c.strokeStyle=id==='trail'?'#487956':'#d1e1a6';c.lineWidth=1.5;c.setLineDash([5,5]);c.strokeRect(h.x,h.y,h.w,h.h);c.setLineDash([]);for(const [x,y]of [[h.x,h.y],[h.x+h.w,h.y],[h.x,h.y+h.h],[h.x+h.w,h.y+h.h]])box(c,x-4,y-4,8,8,1,'#c7e99c')}}return hit;
}
