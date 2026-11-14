// Hybrid starter: a code-rendered product inside footage.
//
// Footage ("plate") supplies what should merely look real. Code supplies what
// must be exactly right: the product, its label, the screen and the headline.
// The plate here is a synthetic diagnostic pattern; swap in your own with
// `asset-add`, together with the matte, depth and track made from it.
//
// Layers, back to front:
//   plate            the footage
//   screen           DOM, corner-pinned to a tracked surface in the plate
//   headline         DOM, passes BEHIND the plate's subject
//   cut-out          the plate's subject again (plate x matte), restoring it over the DOM layers
//   product          WebGL, depth-tested against the plate's own depth
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {defineRenderer} from 'editableframes/renderer';
import {sampleTrack,scalePoints,cornerPinTransform,conformSeconds,drawCutout,createFrameLoader,estimateKeyLight} from 'editableframes/plate';
import {createDepthOccluder,createPlateEnvironment,applyKeyLight,dataTexture,renderPass} from 'editableframes/three-plate';

const WIDTH=640,HEIGHT=360,IDS=['can.body','can.lid'];
export default defineRenderer({
 id:'hybrid-product',title:'Product in footage',renderer:'three+dom',width:WIDTH,height:HEIGHT,fps:24,durationInFrames:72,
 passes:['clay','depth','normal','id','matte'],
 defaultProps:{label:'ORBIT',detail:'330 ml  ·  0 kcal',color:'#d8263c',headline:'Cold. Always.',price:'$2.49',distance:3,offset:0,plateLight:true},
 controls:{version:1,objects:[{id:'scene',label:'Scene'},{id:'can',label:'Can',parentId:'scene'},{id:'headline',label:'Headline',parentId:'scene'},{id:'screen',label:'Screen',parentId:'scene'},{id:'light',label:'Lighting',parentId:'scene'}],fields:[
  {key:'label',anchor:'can',property:'label',path:'/label',type:'string',label:'Label'},
  {key:'detail',anchor:'can',property:'detail',path:'/detail',type:'string',label:'Small print'},
  {key:'color',anchor:'can',property:'color',path:'/color',type:'color',label:'Can colour'},
  {key:'distance',anchor:'can',property:'distance',path:'/distance',type:'number',min:1.5,max:8,label:'Distance from camera',animatable:true},
  {key:'offset',anchor:'can',property:'offset',path:'/offset',type:'number',min:-2,max:2,label:'Left / right',animatable:true},
  {key:'headline',anchor:'headline',property:'text',path:'/headline',type:'string',label:'Headline'},
  {key:'price',anchor:'screen',property:'text',path:'/price',type:'string',label:'Screen text'},
  {key:'plateLight',anchor:'light',property:'fromPlate',path:'/plateLight',type:'bool',label:'Light from the footage'},
 ]},
 async create({root,props,asset,mediaFrame,mediaInfo,derived}){
  if(!asset||!mediaFrame||!mediaInfo||!derived)throw Error('This scene needs a host that serves plate media (asset, mediaFrame, mediaInfo, derived)');
  const plate=mediaInfo('plate'),matteId=derived('plate','matte'),depthId=derived('plate','depth'),trackId=derived('plate','track');
  if(!matteId||!depthId||!trackId)throw Error('The plate needs a matte, a depth map and a track; add them with asset-add --role … --of plate');
  const encoding=mediaInfo(depthId).derived.encoding,track=await (await fetch(asset(trackId))).json();
  const doc=root.ownerDocument,layer=(tag,css)=>{const node=doc.createElement(tag);node.style.cssText='position:absolute;left:0;top:0;'+css;stage.append(node);return node;};
  const stage=doc.createElement('div');stage.style.cssText=`position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden`;root.append(stage);
  const sized=canvas=>{canvas.width=WIDTH;canvas.height=HEIGHT;return canvas;};
  const plateCanvas=sized(layer('canvas','')),plateContext=plateCanvas.getContext('2d',{willReadFrequently:true});
  const screen=layer('div','width:160px;height:90px;transform-origin:0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b1220;color:#fff;font:700 34px/1 system-ui,sans-serif');
  screen.dataset.efAnchor='screen';const priceText=doc.createElement('div'),priceNote=doc.createElement('div');priceNote.textContent='per can';priceNote.style.cssText='font:500 11px/1.6 system-ui,sans-serif;opacity:.75';screen.append(priceText,priceNote);
  const headline=layer('div',`width:${WIDTH}px;top:296px;text-align:center;color:#fff;font:800 40px/1 system-ui,sans-serif;letter-spacing:-.01em`);headline.dataset.efAnchor='headline';
  const cutCanvas=sized(layer('canvas','')),cutContext=cutCanvas.getContext('2d'),scratch=doc.createElement('canvas');
  const glCanvas=layer('canvas',`width:${WIDTH}px;height:${HEIGHT}px`);

  const renderer=new THREE.WebGLRenderer({canvas:glCanvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setSize(WIDTH,HEIGHT,false);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,WIDTH/HEIGHT,0.1,50);
  const key=new THREE.DirectionalLight(0xffffff,2);scene.add(key,key.target);
  const can=new THREE.Group();can.userData.passId='can.body';scene.add(can);
  const labelCanvas=doc.createElement('canvas');labelCanvas.width=1024;labelCanvas.height=512;
  const labelMap=new THREE.CanvasTexture(labelCanvas);labelMap.colorSpace=THREE.SRGBColorSpace;labelMap.anisotropy=8;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,1,96,1,true),new THREE.MeshStandardMaterial({map:labelMap,metalness:.25,roughness:.36}));
  // Aluminium reflects about 91% of the light that reaches it; a darker base colour reads as grey metal.
  const lidMaterial=new THREE.MeshStandardMaterial({color:0xf5f6f6,metalness:1,roughness:.22});
  const lids=[.52,-.52].map(y=>{const lid=new THREE.Mesh(new THREE.CylinderGeometry(.3,.33,.04,96),lidMaterial);lid.position.y=y;lid.rotation.x=y<0?Math.PI:0;lid.userData.passId='can.lid';return lid;});
  can.add(body,...lids);
  const occluder=createDepthOccluder(encoding),depthMap=dataTexture(doc.createElement('canvas'));scene.add(occluder.mesh);
  const plateEnvironment=createPlateEnvironment(renderer),pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),neutral=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();
  const frames=createFrameLoader(),probe=doc.createElement('canvas');probe.width=64;probe.height=36;const probeContext=probe.getContext('2d',{willReadFrequently:true});
  let labelKey,litFrom;

  function paintLabel(){
   const next=[props.label,props.detail,props.color].join('\n');if(next===labelKey)return;labelKey=next;
   const c=labelCanvas.getContext('2d');c.fillStyle=props.color;c.fillRect(0,0,1024,512);c.fillStyle='rgba(255,255,255,.14)';c.fillRect(0,96,1024,8);c.fillRect(0,408,1024,8);
   // The label is text laid out by the browser, so it is the same crisp string in every frame and every variant.
   c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';
   for(const x of [256,768]){c.font='900 150px system-ui,sans-serif';c.fillText(String(props.label),x,236);c.font='600 34px system-ui,sans-serif';c.fillText(String(props.detail),x,356);}
   labelMap.needsUpdate=true;
  }
  return {
   async render(clock){
    const pass=clock.pass??'beauty',seconds=clock.frame/clock.fps;
    // Anything locked to the footage moves on the footage's own frame grid.
    const plateTime=conformSeconds(Math.min(clock.mediaTime??seconds,plate.duration-1e-6),plate.frameRate);
    const [plateImage,matteImage,depthImage]=await Promise.all([plateTime,plateTime,plateTime].map((t,i)=>frames.load(mediaFrame(['plate',matteId,depthId][i],t))));
    paintLabel();
    can.position.set(props.offset,-.12,-props.distance);can.rotation.y=seconds*.9+.6;
    if(pass!=='beauty'){stage.style.background='transparent';for(const node of [plateCanvas,screen,headline,cutCanvas])node.style.visibility='hidden';renderPass(renderer,scene,camera,pass,{ids:IDS,encoding});return;}
    for(const node of [plateCanvas,screen,headline,cutCanvas])node.style.visibility='visible';
    plateContext.drawImage(plateImage,0,0,WIDTH,HEIGHT);
    const pin=sampleTrack(track,plateTime);screen.style.transform=cornerPinTransform(160,90,scalePoints(pin.quad,track,WIDTH,HEIGHT));priceText.textContent=String(props.price);
    headline.textContent=String(props.headline);
    drawCutout(cutContext,plateImage,matteImage,scratch);
    depthMap.image=depthImage;depthMap.needsUpdate=true;occluder.update(depthMap,camera);
    // Intensity 1: the environment's light is the plate's own pixel values, with no extra gain. On generated plates,
    // aluminium lit this way was 5-6% brighter than a real can standing beside it, except where the light came from behind it.
    if(props.plateLight){
     if(litFrom!==plateImage){litFrom=plateImage;scene.environment=plateEnvironment.update(plateImage);scene.environmentIntensity=1;probeContext.drawImage(plateImage,0,0,64,36);applyKeyLight(key,estimateKeyLight(probeContext.getImageData(0,0,64,36).data,64,36),{target:can.position});}
    }else{litFrom=null;scene.environment=neutral.texture;scene.environmentIntensity=1;key.position.set(2,4,3);key.target.position.copy(can.position);key.target.updateMatrixWorld();key.color.set(0xffffff);key.intensity=1.2;}
    renderer.render(scene,camera);
   },
   pick({x,y}){const p=new THREE.Vector3().copy(can.position).project(camera);return Math.hypot(x-(p.x+1)/2*WIDTH,y-(1-p.y)/2*HEIGHT)<70?{anchor:'can',property:'label'}:null;},
   dispose(){frames.dispose();occluder.dispose();depthMap.dispose();plateEnvironment.dispose();neutral.dispose();labelMap.dispose();body.geometry.dispose();body.material.dispose();for(const lid of lids)lid.geometry.dispose();lidMaterial.dispose();renderer.dispose();renderer.forceContextLoss?.();stage.remove();},
  };
 }
});
