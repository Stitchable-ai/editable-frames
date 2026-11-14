// Keep exact foreground geometry out of unconstrained background generation.
// Supply a clean background asset named world, or world/worldInfo props in a host.
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {defineRenderer} from 'editableframes/renderer';
import {createKineticText,createFrameLoader,conformSeconds} from 'editableframes/plate';
import {renderPass,createPlateEnvironment} from 'editableframes/three-plate';
export default defineRenderer({id:'code-first-product',renderer:'three+html',width:832,height:480,fps:16,durationInFrames:81,
 passes:['clay','depth','normal','id','matte'],defaultProps:{label:'LUMA',model:'',world:'world',worldInfo:null,backplate:true,spin:false},
 controls:{version:1,fields:[{key:'world',anchor:'background',type:'media',mediaKind:'video',default:'world',label:'Empty background'},{key:'worldInfo',anchor:'background',type:'json',default:null,label:'Background frame metadata'},{key:'model',anchor:'product',type:'model',default:'',label:'Optional photo model'},{key:'label',type:'string',label:'Exact label'},{key:'spin',type:'bool',label:'Rotate model'}]},
 async create({root,props,asset,mediaInfo,mediaFrame,sourceFrame}){
  root.style.background='#d6dcd6';
  const canvas=document.createElement('canvas');root.append(canvas);
  const r=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(832,480);r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.setClearColor(0,0);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.NeutralToneMapping;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,832/480,.1,30);camera.position.set(0,.1,4.5);camera.lookAt(0,0,0);
  scene.add(new T.HemisphereLight(0xf4fff8,0x646b71,2));const key=new T.DirectionalLight(0xffffff,3);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.bias=-.0002;scene.add(key);
  const product=new T.Group();product.userData.passId='product';product.position.set(.55,-.13,0);scene.add(product);
  let modelKey,labelKey,labelCanvas,labelTexture;
  const release=object=>{const resources=new Set();object.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){resources.add(m);for(const value of Object.values(m))if(value?.isTexture)resources.add(value);}});for(const resource of resources)resource.dispose();};
  async function updateProduct(){
   const next=String(props.model??'');
   if(next!==modelKey){
    const replacement=new T.Group();let canvas,texture;
    if(next){
     const gltf=await new GLTFLoader().loadAsync(asset(next)),model=gltf.scene;
     const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());
     if(!Number.isFinite(size.y)||size.y<=0){release(model);throw Error('Product model has no finite height');}
     model.position.sub(centre);const fit=new T.Group();fit.add(model);fit.scale.setScalar(1.25/size.y);replacement.add(fit);
    }else{
     canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
     replacement.add(new T.Mesh(new T.CylinderGeometry(.31,.31,1.18,64),new T.MeshStandardMaterial({map:texture,metalness:.2,roughness:.36})));
     for(const y of [-.61,.61]){const lid=new T.Mesh(new T.CylinderGeometry(.30,.31,.04,64),new T.MeshStandardMaterial({color:0xb9bfc0,metalness:.9,roughness:.22}));lid.position.y=y;replacement.add(lid);}
    }
    replacement.traverse(o=>{if(o.isMesh)o.castShadow=true;});release(product);product.clear();product.add(replacement);
    modelKey=next;labelCanvas=canvas;labelTexture=texture;labelKey=undefined;
   }
   const label=String(props.label??'');
   if(labelCanvas&&label!==labelKey){const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#ef633f';ctx.fillRect(0,0,1024,512);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='900 95px Arial';for(const x of [256,768])ctx.fillText(label,x,280);labelTexture.needsUpdate=true;labelKey=label;}
  }
  const floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.ShadowMaterial({opacity:.32}));floor.receiveShadow=true;floor.userData.passExclude=true;floor.rotation.x=-Math.PI/2;floor.position.y=-.76;scene.add(floor);
  const title=document.createElement('div');title.style.cssText='position:absolute;left:46px;top:42px;color:#17251e;font:800 32px/1.05 Arial;letter-spacing:-1px;max-width:310px';root.append(title);
  const sub=document.createElement('div');sub.style.cssText='position:absolute;left:46px;bottom:42px;color:#17251e;font:600 13px Arial;letter-spacing:2px';root.append(sub);
  const kinetic=createKineticText({root:title});let bg,bgctx;const loader=createFrameLoader(),env=createPlateEnvironment(r);if(props.backplate){bg=document.createElement('canvas');bg.width=832;bg.height=480;root.prepend(bg);bg.style.cssText='position:absolute;inset:0';canvas.style.cssText='position:absolute;inset:0';bgctx=bg.getContext('2d');}
  return {async render(clock){
   await updateProduct();
   const time=clock.frame/clock.fps;product.rotation.y=props.spin?time*.65:-1.3;kinetic.render(time,{text:'BUILT IN CODE. SET IN MOTION.',effect:'orbit',stagger:.09,duration:.8,hold:3600,pathRadius:30});sub.textContent=props.model?'PHOTO → GLB → EDITABLE HTML':String(props.label)+' / BLOOD ORANGE';
   if(props.backplate){const info=props.worldInfo??mediaInfo?.(String(props.world));if(!info?.frameRate||!info.frames)throw Error('Supply verified empty-background metadata');const at=conformSeconds(clock.mediaTime??time,info.frameRate),index=Math.floor(at*info.frameRate.num/info.frameRate.den+1e-6);if(index<0||index>=info.frames)throw Error('Empty background frame outside source range');const image=await loader.load(sourceFrame?sourceFrame(String(props.world),index,{width:info.width,height:info.height,seconds:at}):mediaFrame(String(props.world),at));bgctx.drawImage(image,0,0,832,480);scene.environment=env.update(image);scene.environmentIntensity=1;floor.visible=true;title.style.color=sub.style.color='white';}
   const pass=clock.pass??'beauty';title.style.visibility=sub.style.visibility=pass==='beauty'?'visible':'hidden';if(bg)bg.style.visibility=pass==='beauty'?'visible':'hidden';
   if(pass!=='beauty'){root.style.background='transparent';renderPass(r,scene,camera,pass,{ids:['product']});}else{root.style.background=props.backplate?'#202620':'#d6dcd6';r.render(scene,camera);}
  },dispose(){kinetic.dispose();loader.dispose();env.dispose();release(product);release(floor);r.dispose();r.forceContextLoss();root.replaceChildren();}};
 }});
