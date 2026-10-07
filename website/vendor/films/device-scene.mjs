import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import models from './devices.json';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function rounded(x,a,b,w,h,r,color){x.fillStyle=color;x.beginPath();x.roundRect(a,b,w,h,r);x.fill();}
function type(x,str,a,b,size,color='#eef4f0',weight=500){x.fillStyle=color;x.font=`${weight} ${size}px Arial`;x.fillText(str,a,b);}
// Authored app UI is rasterized to the real model's mapped display, not a floating plane.
function appScreen(canvas,t,p){
 const x=canvas.getContext('2d');x.clearRect(0,0,480,1040);rounded(x,0,0,480,1040,0,'#101d23');
 type(x,'9:41',36,45,19);type(x,'•••  ▰',367,45,19);type(x,p.brand.toUpperCase(),32,131,28,p.accent,700);type(x,'Good morning, Alex',32,176,18,'#99aaa9');
 if(p.app==='Wallet'){
  type(x,'TOTAL BALANCE',32,250,15,'#a1b2b4');type(x,'$24,680.50',32,313,52,'#f5f7ef',600);type(x,'↗  +4.28% this month',32,351,18,p.accent);
  const reveal=ease(t/3);x.save();x.beginPath();x.rect(28,380,424*reveal,180);x.clip();
  const pts=Array.from({length:55},(_,i)=>[28+i*8,524-i*1.65-Math.sin(i*.33)*19-Math.cos(i*.71)*9]);
  x.beginPath();pts.forEach(([a,b],i)=>x[i?'lineTo':'moveTo'](a,b));x.lineWidth=4;x.strokeStyle=p.accent;x.stroke();x.lineTo(460,558);x.lineTo(28,558);const g=x.createLinearGradient(0,400,0,560);g.addColorStop(0,p.accent+'55');g.addColorStop(1,p.accent+'00');x.fillStyle=g;x.fill();x.restore();
  ['Send ↗','Receive ↙','Swap ⇄'].forEach((s,i)=>{rounded(x,30+i*145,592,130,58,16,i===0?p.accent:'#24353b');type(x,s,46+i*145,629,17,i===0?'#102123':'#edf2f0',600)});
  type(x,'Your assets',32,703,23);[['B','Bitcoin','0.284 BTC','$17,420'],['Ξ','Ethereum','2.10 ETH','$7,260']].forEach(([icon,name,unit,value],i)=>{const y=754+i*100;rounded(x,30,y-28,48,48,24,i?'#758ec8':'#e9ac58');type(x,icon,46,y+5,25,'#14232a',700);type(x,name,95,y,21);type(x,unit,95,y+25,15,'#91a2a5');type(x,value,352,y+8,20)});
 }else if(p.app==='Analytics'){
  type(x,'Your business, at a glance.',32,241,24);rounded(x,28,276,424,202,24,'#24353b');type(x,'MONTHLY REVENUE',51,319,14,'#a0b5b4');type(x,'$48,920',51,382,50,p.accent,600);type(x,'↑ 18.4% vs. last month',51,430,19);
  type(x,'Weekly activity',32,544,25);for(let i=0;i<7;i++){const h=(50+i*17+Math.sin(i*2)*35)*ease((t+i*.15)/2);rounded(x,33+i*61,769-h,38,h,8,i===5?p.accent:'#416a6d');type(x,'MTWTFSS'[i],43+i*61,802,15,'#aabbbb')}
  rounded(x,28,850,424,81,17,'#24353b');type(x,'↗  Your best week yet',52,898,22,p.accent);
 }else{
  type(x,'Meet your next',32,270,44,'#f2f5ef',700);type(x,'great idea.',32,325,48,p.accent,700);
  x.save();x.translate(242,526);x.rotate(t*.14);for(let i=0;i<8;i++){x.rotate(Math.PI/4);rounded(x,-24,-128,48,114,22,i%2?p.accent:'#426a6d')}x.restore();
  type(x,'Less friction.',32,758,26);type(x,'More possibility.',32,801,26);rounded(x,28,856,424,67,22,p.accent);type(x,'Get started   →',151,899,22,'#142526',700);
 }
 rounded(x,0,969,480,71,0,'#16272e');['◉','▤','⇄','○'].forEach((s,i)=>type(x,s,51+i*112,1006,23,i===0?p.accent:'#79918f'));rounded(x,166,1026,148,5,3,'#e2e9e5');
}
export class DeviceScene{
 constructor(){
  this.renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});this.renderer.setSize(1280,720);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();this.scene.background=new T.Color('#eceae4');this.scene.fog=new T.Fog('#eceae4',7,21);this.camera=new T.PerspectiveCamera(34,1280/720,.1,100);this.camera.position.set(0,.8,8.4);this.camera.lookAt(0,0,0);
  this.pivot=new T.Group();this.scene.add(this.pivot);this.cache=new Map();this.loading=new Map();this.disposed=false;
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#e8e5df',roughness:.82}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.1;floor.receiveShadow=true;this.scene.add(floor);
  const plinth=new T.Mesh(new T.CylinderGeometry(1.12,1.2,.19,96),new T.MeshStandardMaterial({color:'#d4d6d0',roughness:.4,metalness:.12}));plinth.position.set(1.3,-1.98,0);plinth.receiveShadow=true;plinth.castShadow=true;this.scene.add(plinth);
  const key=new T.DirectionalLight('#fff5e8',2.4);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.0003;key.shadow.radius=4;this.scene.add(key);this.scene.add(new T.HemisphereLight('#eaf1ff','#9b9080',.25));
  this.screen=document.createElement('canvas');this.screen.width=480;this.screen.height=1040;
 }
 async environment(){
  if(!this.envPromise)this.envPromise=(async()=>{const raw=await new RGBELoader().loadAsync('/devices/studio_small_09_2k.hdr');if(this.disposed){raw.dispose();return;}const pmrem=new T.PMREMGenerator(this.renderer);this.env=pmrem.fromEquirectangular(raw);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.9;raw.dispose();pmrem.dispose();})().catch(e=>{this.envPromise=null;throw e});
  return this.envPromise;
 }
 async prepare(p){
  await this.environment();if(this.disposed)return;
  if(!this.cache.has(p.model)){
   if(!this.loading.has(p.model))this.loading.set(p.model,this.load(p.model).finally(()=>this.loading.delete(p.model)));
   await this.loading.get(p.model);
  }
 }
 async load(id){
  const spec=models.find(m=>m.id===id);if(!spec)throw Error('Unknown phone model');
  const gltf=await new GLTFLoader().loadAsync(spec.url);const root=gltf.scene;const b=spec.binding;
  const display=new T.CanvasTexture(this.screen);display.colorSpace=T.SRGBColorSpace;display.flipY=false;display.anisotropy=this.renderer.capabilities.getMaxAnisotropy();if(b.flipU){display.repeat.x=-1;display.offset.x=1}if(b.flipV){display.repeat.y=-1;display.offset.y=1}
  let screens=0;
  root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   if(o.name===b.mesh){o.material=new T.MeshBasicMaterial({map:display,toneMapped:false,side:T.DoubleSide});screens++;}
   else {const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){
    if(b.hideMaterials.includes(m.name)){m.visible=false;}
    // Preserve source colors/textures. The pack documents this aluminum-only correction.
    if(id==='craft-iphone-17-pro'&&m.name==='Anodized_aluminum'){m.metalness=1;m.roughness=.3;m.specularIntensity=1;m.specularIntensityMap=null;}
   }}
  });if(!screens)throw Error('Screen binding missing');
  root.rotation.set(...b.modelRotation);root.updateMatrixWorld(true);let box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());root.scale.setScalar(3.35/Math.max(size.x,size.y,size.z));root.updateMatrixWorld(true);box=new T.Box3().setFromObject(root);root.position.sub(box.getCenter(new T.Vector3()));
  const group=new T.Group();group.add(root);group.visible=false;this.pivot.add(group);const item={group,display};this.cache.set(id,item);if(this.disposed)this.release(item);
 }
 draw(t,p){
  const item=this.cache.get(p.model);if(!item)throw Error('Phone has not loaded');for(const [id,m]of this.cache)m.group.visible=id===p.model;
  appScreen(this.screen,t,p);item.display.needsUpdate=true;this.renderer.toneMappingExposure=p.exposure;
  this.pivot.position.set(1.3,.02+Math.sin(t*.85)*.1*p.float,0);this.pivot.rotation.set(p.pitch+Math.sin(t*.45)*.015*p.float,p.yaw+Math.sin(t*.5)*p.orbit,Math.sin(t*.6)*.025*p.float);
  this.camera.position.set(Math.sin(t*.3)*p.orbit*.3,.72,8.4);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);return this.renderer.domElement;
 }
 release(item){const textures=new Set();item.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose()}}});textures.forEach(t=>t.dispose());item.display.dispose();this.pivot.remove(item.group);}
 dispose(){this.disposed=true;for(const item of this.cache.values())this.release(item);this.cache.clear();this.env?.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose?.()});this.renderer.dispose();this.renderer.forceContextLoss();}
}
