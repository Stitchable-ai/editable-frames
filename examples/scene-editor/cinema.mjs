import {defineRenderer} from '../../packages/core/renderer.mjs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const W=1280,H=720,FPS=24,N=288;
const clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp;
const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a),0,1);return x*x*(3-2*x)};
const pulse=(a,b,c,t)=>smooth(a,b,t)*(1-smooth(b,c,t));
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);


/** Authored camera values are sampled, not the static fallback props. */
export function authoredShot(kind,t,wide=false){
 let position,target,fov,label;
 if(kind==='drama'){
  if(wide||t<3){position=[2.7-t*.09,1.9,4.3];target=[0,1.15,0];fov=42;label='01 / ESTABLISHING TWO-SHOT';}
  else if(t<6){position=[-1.42,1.62,1.15];target=[.55,1.53,0];fov=40;label='02 / OVER HER SHOULDER';}
  else if(t<9){position=[1.35,1.58,1.05];target=[-.55,1.47,0];fov=35;label='03 / REVERSE CLOSE-UP';}
  else{position=[.1,1.65,1.65];target=[.08,1.15,.3];fov=30;label='04 / INSERT — SLIDING THE EVIDENCE';}
 }else{
  if(wide||t<2.8){position=[9-t*.6,5.1,13];target=[0,2.6,0];fov=43;label='01 / REVEAL — ROBOT VS APE';}
  else if(t<4.6){position=[-.5,3.3,8.6];target=[0,3.4,0];fov=46;label='02 / SWING → CONTACT → BLOCK';}
  else if(t<7.3){position=[-5.6,4.4,9.2];target=[.35,3.8,0];fov=40;label='03 / COUNTERPUNCH → RECOIL';}
  else{position=[-8.5+(t-7.3)*.35,4.7,11.5];target=[-.3,2.9,0];fov=43;label='04 / GRAPPLE → SEPARATION';}
 }return {position,target,fov,label};
}

const placement=()=>({position:[0,0,0],orientation:[0,0,0,1],scale:1});
export function cinemaScene(kind='drama') {
 const names=kind==='drama'?['Maya · lead','Elias · partner']:['Mecha · robot','Titan · giant ape'];
 const defaults={kind,clay:false,camera:'edit',soldier:'civilian',michelle:'michelle',actors:{lead:placement(),partner:placement()},set:placement(),key:{position:[-5,10,7],intensity:3.5,color:'#ffdfb8'},shot:{override:false,position:kind==='drama'?[2.7,1.9,4.3]:[9,5.1,13],target:kind==='drama'?[0,1.15,0]:[0,2.6,0],fov:kind==='drama'?42:43}};
 const fields=[];
 for(const [anchor,path] of [['lead','/actors/lead'],['partner','/actors/partner'],['set','/set']])fields.push(
  {key:anchor+'.position',anchor,property:'position',path:path+'/position',type:'vec3',role:'position',coordinateSpace:'local',unit:'world-unit',animatable:true},
  {key:anchor+'.orientation',anchor,property:'orientation',path:path+'/orientation',type:'quaternion',role:'rotation',coordinateSpace:'local',animatable:true},
  {key:anchor+'.scale',anchor,property:'scale',path:path+'/scale',type:'number',role:'scale',min:.05,max:5,animatable:true});
 fields.push(
  {key:'key.position',anchor:'key',property:'position',path:'/key/position',type:'vec3',role:'position',coordinateSpace:'local',unit:'world-unit',animatable:true},
  {key:'key.intensity',anchor:'key',property:'intensity',path:'/key/intensity',type:'number',min:0,max:15,animatable:true},
  {key:'key.color',anchor:'key',property:'color',path:'/key/color',type:'color'},
  {key:'camera.position',anchor:'camera',property:'position',path:'/shot/position',type:'vec3',role:'position',coordinateSpace:'local',unit:'world-unit',animatable:true},
  {key:'camera.target',anchor:'camera',property:'target',path:'/shot/target',type:'vec3',unit:'world-unit',animatable:true},
  {key:'camera.fov',anchor:'camera',property:'fov',path:'/shot/fov',type:'number',min:15,max:100,unit:'°',animatable:true},
  {key:'camera.override',anchor:'camera',property:'override',path:'/shot/override',type:'bool'},
  {key:'look.clay',anchor:'look',property:'clay',path:'/clay',type:'bool'});
 const controls={version:2,spatialSemantics:'cinema-placement-pivot-v1',objects:[{id:'lead',label:names[0]},{id:'partner',label:names[1]},{id:'set',label:'Set & props'},{id:'key',label:'Key light'},{id:'camera',label:'Shot camera'},{id:'look',label:'Reference look'}],fields};
 return defineRenderer({id:'character-cinema-'+kind,renderer:'three',width:W,height:H,fps:FPS,durationInFrames:N,controls,
 defaultProps:defaults,
 async create({root,props,asset}){
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.domElement.style.cssText='width:100%;height:100%;display:block';root.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,W/H,.05,160);scene.background=new T.Color('#101e2b');scene.fog=new T.FogExp2('#182c3c',.018);
  const mat=(c,metal=0,rough=.6)=>new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
  const glow=(c,n=3)=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:n,roughness:.3});
  const mesh=(g,m,p=scene,pos=V(),scale=V(1,1,1))=>{const o=new T.Mesh(g,m);o.position.copy(pos);o.scale.copy(scale);o.castShadow=true;o.receiveShadow=true;p.add(o);return o};
  const box=(w,h,d,m,p=scene,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),m,p,V(x,y,z));
  const ell=(x,y,z,m,p=scene,a=0,b=0,c=0)=>mesh(new T.SphereGeometry(1,24,16),m,p,V(a,b,c),V(x,y,z));
  const cylinder=(r,h,m,p=scene,x=0,y=0,z=0)=>mesh(new T.CylinderGeometry(r,r,h,24),m,p,V(x,y,z));
  function link(a,b,r1,r2,m,parent){const o=mesh(new T.CylinderGeometry(r2,r1,1,12),m,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=a.distanceTo(b);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o;}
  // Deterministic two-link IK. Targets and elbow poles are in the same coordinate space.
  function elbow(s,target,l1,l2,pole){const d=target.clone().sub(s),len=clamp(d.length(),.001,l1+l2-.001);d.normalize();const a=(l1*l1-l2*l2+len*len)/(2*len),h=Math.sqrt(Math.max(0,l1*l1-a*a));const perpendicular=pole.clone().sub(s).addScaledVector(d,-pole.clone().sub(s).dot(d)).normalize();return s.clone().addScaledVector(d,a).addScaledVector(perpendicular,h);}
  const hemi=new T.HemisphereLight('#a4c4e6','#241a16',1.4);scene.add(hemi);
  const key=new T.DirectionalLight('#ffdfb8',3.5);key.position.set(-5,10,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-14,right:14,top:18,bottom:-10});key.shadow.normalBias=.02;scene.add(key);
  const rim=new T.DirectionalLight('#518dde',3);rim.position.set(8,7,-5);scene.add(rim);
  // A cheap, local lighting environment gives metal readable reflections without a fetched HDRI.
  const env=new T.Scene();env.background=new T.Color('#455260');for(const [x,y,z,c] of [[-5,5,0,'#fff0d0'],[5,2,1,'#7bbbdc'],[0,6,-5,'#c4d3dc']]){const panel=box(4,4,.1,new T.MeshBasicMaterial({color:c}),env,x,y,z);panel.lookAt(0,0,0);}const pm=new T.PMREMGenerator(renderer),envTarget=pm.fromScene(env,.02);scene.environment=envTarget.texture;
  let animate,shotName='';
  const editable={},placements=[];
  const register=(id,object)=>{const wrapper=new T.Group();object.parent.add(wrapper);wrapper.add(object);const pivot=V();editable[id]={object:wrapper,pivot:()=>pivot.toArray(),convention:'pivot'};placements.push({id,object,wrapper,pivot});};
  if(props.kind==='drama'){
    scene.fog.density=.035;renderer.toneMappingExposure=1.1;
    const ground=mat('#293338',.15,.45),wall=mat('#334854');box(20,.1,15,ground,scene,0,-.08,0);box(12,4,.15,wall,scene,0,2,-2.4);
    // Concrete station room, night city and practical lighting.
    box(4.8,2.5,.2,mat('#091828'),scene,0,2.1,-2.28);
    for(let x=-2.4;x<=2.4;x+=1.2)box(.055,2.5,.16,mat('#71818b',.5),scene,x,2.1,-2.13);
    for(let i=0;i<28;i++){const x=-2.2+(i%7)*.65,y=1.1+Math.floor(i/7)*.5;box(.1,.13,.02,glow(i%3?'#5bafbd':'#efb36c',1.4),scene,x,y,-2.14);}
    for(const x of [-3.0,3.0]){box(.09,2.8,.12,glow('#e2ad6b',2),scene,x,1.7,-2.08);const light=new T.PointLight('#f7ad65',12,8,2);light.position.set(x,2,-1);scene.add(light);}
    box(2.2,.12,.9,mat('#593f32',.1,.4),scene,0,1.0,.58);for(const x of [-1,1])box(.1,1,.65,mat('#17222a',.6),scene,x,.5,.58);const fill=new T.PointLight('#d7e9ff',11,10,2);fill.position.set(0,2.8,3);scene.add(fill);
    const device=box(.13,.018,.24,mat('#0b1219',.6),scene,0,1.12,.1);box(.11,.003,.20,glow('#76c8dd',.8),device,0,.012,0);
    const loader=new GLTFLoader();
    function makeStandIn(id){const root=new T.Group(),cloth=mat(id==='michelle'?'#8f4f40':'#354a62'),skin=mat('#c99677'),hair=mat('#292124');ell(.24,.43,.15,cloth,root,0,1.18,0);ell(.15,.21,.15,skin,root,0,1.78,0);ell(.16,.12,.16,hair,root,0,1.92,-.02);for(const side of [-1,1]){link(V(side*.13,.92,0),V(side*.14,.2,0),.085,.1,cloth,root);ell(.09,.07,.16,hair,root,side*.14,.1,.05);link(V(side*.26,1.45,0),V(side*.34,.95,.12),.07,.09,cloth,root);ell(.065,.1,.06,skin,root,side*.34,.88,.12);}return root;}
    async function loadCharacter(id,targetHeight,x,yaw){const url=asset?.(id);const gltf=url?await loader.loadAsync(url):{scene:makeStandIn(id),animations:[]};const model=gltf.scene;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model);const s=targetHeight/bounds.getSize(V()).y;model.scale.multiplyScalar(s);model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model);model.position.y-=b.min.y;const group=new T.Group();group.add(model);group.position.x=x;group.rotation.y=yaw;scene.add(group);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});const bones={};model.traverse(o=>{if(o.isBone)bones[o.name.replace('mixamorig:','').replace('mixamorig','')]=o;});const rest=new Map(Object.values(bones).map(b=>[b,b.quaternion.clone()]));return {group,model,bones,rest,gltf};}
    const woman=await loadCharacter(String(props.michelle),1.72,-.75,Math.PI/2),man=await loadCharacter(String(props.soldier),1.87,.75,-Math.PI/2);
    register('lead',woman.group);register('partner',man.group);
    const manPositions=new Map(Object.values(man.bones).map(b=>[b,b.position.clone()]));
    // Preserve skinned human geometry; author poses by joint targets rather than primitive mannequins.
    function aimBone(bone,child,target){if(!bone||!child)return;scene.updateMatrixWorld(true);const p=bone.getWorldPosition(V()),old=child.getWorldPosition(V()).sub(p).normalize(),desired=target.clone().sub(p).normalize();const q=new T.Quaternion().setFromUnitVectors(old,desired).multiply(bone.getWorldQuaternion(new T.Quaternion()));bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));scene.updateMatrixWorld(true);}
    function arm(a,side,target,pole){const upper=a.bones[side+'Arm'],fore=a.bones[side+'ForeArm'],hand=a.bones[side+'Hand'];if(!upper||!fore||!hand)return;scene.updateMatrixWorld(true);const s=upper.getWorldPosition(V()),e=fore.getWorldPosition(V()),h=hand.getWorldPosition(V());const bend=elbow(s,target,s.distanceTo(e),e.distanceTo(h),pole);aimBone(upper,fore,bend);aimBone(fore,hand,target);}
    const initialPositions=new Map(Object.values(woman.bones).map(b=>[b,b.position.clone()]));
    animate=t=>{
      for(const [b,q] of woman.rest){b.quaternion.copy(q);b.position.copy(initialPositions.get(b));}
      for(const [b,q] of man.rest){b.quaternion.copy(q);b.position.copy(manPositions.get(b));}
      woman.group.position.set(-.55,0,0);woman.group.rotation.y=Math.PI/2;
      man.group.position.set(.55,0,0);man.group.rotation.y=-Math.PI/2;
      scene.updateMatrixWorld(true);
      const offer=smooth(0,3,t),take=smooth(9,11.5,t);
      const phoneX=mix(-.2,.2,take);const hand=V(mix(-.48,phoneX,offer),mix(.95,1.14,offer),.33);
      arm(woman,'Right',hand,V(-.8,.85,.75));arm(woman,'Left',V(-.64,.85,-.15),V(-1.1,.95,-.55));
      arm(man,'Left',V(mix(.50,.20,take),mix(.85,1.14,take),.34),V(.8,.95,.7));arm(man,'Right',V(.60,.85,-.1),V(1.2,1,-.5));
      woman.bones.Head?.rotateY(.10*Math.sin(t*.75));woman.bones.Head?.rotateX(-.07*smooth(8,10,t));
      man.bones.Head?.rotateX(.10*smooth(8,10,t));
      scene.updateMatrixWorld(true);device.position.set(phoneX,1.075,.39);device.rotation.y=.2;man.model.traverse(o=>{if(o.morphTargetDictionary){for(const [name,index] of Object.entries(o.morphTargetDictionary)){if(name==='mouthOpen')o.morphTargetInfluences[index]=t>3&&t<6?.07*Math.max(0,Math.sin(t*7)):0;}}});

    };
  }else{
    renderer.toneMappingExposure=1.35;hemi.intensity=1.6;scene.fog.density=.022;
    const asphalt=mat('#30383c',.2,.75);box(90,.2,80,asphalt,scene,0,-.15,0);
    for(let i=0;i<20;i++){const x=(i%2?1:-1)*(8+(i%4)*2),z=-8-Math.floor(i/2)*3,h=5+(i*7%9);box(3,h,2.5,mat(i%2?'#273743':'#33404b'),scene,x,h/2,z);for(let y=1;y<h;y+=1.1)for(let a=-1;a<=1;a++)box(.3,.45,.04,glow('#9eb6ba',.35),scene,x+a*.8,y,z+1.26);}
    for(let i=0;i<40;i++){const a=i*2.39,r=3+(i%8)*.9;const d=box(.15+(i%3)*.12,.1,.24,mat('#64635d'),scene,Math.sin(a)*r,.05,Math.cos(a)*r);d.rotation.y=a;}
    const orange=mat('#bc4230',.6,.35),blue=mat('#174369',.75,.27),steel=mat('#a9b9bd',.8,.3),black=mat('#17232b',.55,.35),cyan=glow('#73e1fa',2.2);
    const robot=new T.Group();scene.add(robot);
    box(1.4,.65,.8,black,robot,0,2.3,0);const torso=box(1.7,1.65,.85,blue,robot,0,3.55,0);box(1.1,.4,.95,steel,robot,0,2.8,.05);
    for(const s of [-1,1]){const panel=box(.76,.65,.12,mat('#22698a',.8,.13),robot,s*.43,4.0,.5);panel.rotation.y=s*.12;box(.7,.28,.23,orange,robot,s*.65,3.25,.5);for(let i=0;i<4;i++)box(.16,.34,.08,steel,robot,s*(.15+i*.12),3.1,.65);}
    const head=new T.Group();head.position.set(0,4.85,.06);robot.add(head);box(.82,.85,.7,blue,head,0,.16,0);box(.6,.22,.1,black,head,0,.22,.4);box(.5,.065,.12,cyan,head,0,.27,.47);box(.47,.32,.17,steel,head,0,-.08,.43);for(const s of [-1,1])box(.12,.85,.22,blue,head,s*.47,.32,0);
    const wings=[];for(const s of [-1,1]){const wing=new T.Group();wing.position.set(s*.8,4.2,-.35);robot.add(wing);box(.9,1.3,.15,orange,wing,s*.4,0,0);wings.push({wing,s});const wheel=cylinder(.44,.28,black,robot,s*.95,3.8,-.48);wheel.rotation.z=Math.PI/2;const hub=cylinder(.22,.3,steel,robot,s*.96,3.8,-.48);hub.rotation.z=Math.PI/2;}
    // Jointed arms with anchored hand geometry, recalculated from target positions every frame.
    function makeLimb(parent,s,ape=false){const shoulder=V(s*(ape?1.03:1.1),ape?3.65:4.0,0);const upper=mesh(new T.CylinderGeometry(ape?.46:.28,ape?.55:.34,1,12),ape?fur:steel,parent);const lower=mesh(new T.CylinderGeometry(ape?.36:.35,ape?.48:.28,1,12),ape?fur:blue,parent);const joint=ell(ape?.4:.28,ape?.4:.28,ape?.4:.28,ape?fur:black,parent);const hand=new T.Group();parent.add(hand);ell(ape?.42:.3,ape?.34:.27,ape?.4:.3,ape?skin:steel,hand);for(let i=0;i<4;i++)box(ape?.13:.1,ape?.35:.2,.15,ape?skin:steel,hand,(i-1.5)*(ape?.16:.13),-.2,.22);return {shoulder,upper,lower,joint,hand,l1:ape?1.55:1.2,l2:ape?1.45:1.2};}
    function setLimb(l,target,pole){const delta=target.clone().sub(l.shoulder);if(delta.length()>l.l1+l.l2-.001)target=l.shoulder.clone().add(delta.setLength(l.l1+l.l2-.001));const e=elbow(l.shoulder,target,l.l1,l.l2,pole);for(const [o,a,b] of [[l.upper,l.shoulder,e],[l.lower,e,target]]){o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=a.distanceTo(b);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}l.joint.position.copy(e);l.hand.position.copy(target);}
    const robotArms=[makeLimb(robot,-1),makeLimb(robot,1)];for(const limb of robotArms){box(.68,.68,.52,orange,limb.upper,0,.02,.08);box(.68,.65,.58,blue,limb.lower,0,0,.08);for(let i=0;i<3;i++)box(.5,.05,.08,steel,limb.lower,0,-.18+i*.16,.4);}
    const robotLegs=[];for(const s of [-1,1]){const leg=new T.Group();leg.position.set(s*.48,2.05,0);robot.add(leg);box(.6,.95,.6,steel,leg,0,-.4,0);box(.7,.9,.7,blue,leg,0,-1.3,.1);box(.74,.32,1.12,black,leg,0,-1.9,.3);box(.5,.3,.1,orange,leg,0,-.85,.4);robotLegs.push(leg);}
    const fur=mat('#251b16',.05,.9),skin=mat('#49392d',0,.85),mouth=mat('#170e0c'),ivory=mat('#dac5a0');
    const ape=new T.Group();scene.add(ape);ell(1.14,1.7,.85,fur,ape,0,2.65,-.1);ell(.92,1.03,.2,skin,ape,0,2.8,.72);ell(1.1,.8,.78,fur,ape,0,3.7,.05);
    const apeHead=new T.Group();apeHead.position.set(0,4.05,.35);ape.add(apeHead);ell(.7,.86,.65,fur,apeHead,0,.35,0);ell(.59,.5,.31,skin,apeHead,0,.2,.5);ell(.45,.15,.2,skin,apeHead,0,.65,.57);ell(.28,.17,.18,mouth,apeHead,0,.32,.79);for(const s of [-1,1]){ell(.13,.09,.07,ivory,apeHead,s*.27,.59,.67);ell(.055,.065,.055,mouth,apeHead,s*.25,.59,.73);ell(.11,.07,.05,mouth,apeHead,s*.12,.32,.95);}
    const jaw=ell(.35,.26,.16,mouth,apeHead,0,.03,.77);for(const s of [-1,1]){const tooth=mesh(new T.ConeGeometry(.08,.23,8),ivory,apeHead,V(s*.22,.10,.90));tooth.rotation.z=Math.PI;}
    // Fur tufts add a readable gorilla silhouette, all locally authored geometry.
    const tuftGeo=new T.ConeGeometry(.045,.09,4);const tufts=new T.InstancedMesh(tuftGeo,fur,440),dummy=new T.Object3D();for(let i=0;i<440;i++){const y=-1+2*(i+.5)/440,a=i*2.399963,r=Math.sqrt(1-y*y);const n=V(Math.cos(a)*r,y,Math.sin(a)*r);dummy.position.set(n.x*1.15,2.7+n.y*1.65,n.z*.86-.1);dummy.quaternion.setFromUnitVectors(V(0,1,0),n);dummy.scale.setScalar(.6+(i%7)/10);dummy.updateMatrix();tufts.setMatrixAt(i,dummy.matrix);}tufts.castShadow=true;ape.add(tufts);
    for(const s of [-1,1]){ell(.48,.87,.5,fur,ape,s*.56,1.05,-.05);ell(.44,.28,.68,skin,ape,s*.62,.28,.32);for(let i=0;i<4;i++)ell(.12,.15,.27,skin,ape,s*.62+(i-1.5)*.17,.18,.78);}
    const apeArms=[makeLimb(ape,-1,true),makeLimb(ape,1,true)];
    register('lead',robot);register('partner',ape);
    const particles=[];for(let i=0;i<45;i++){const o=mesh(new T.IcosahedronGeometry(.06+(i%4)*.035,0),i%3?mat('#766954'):glow('#ffc16a',2),scene);particles.push(o);}
    function local(root,p){root.updateMatrixWorld(true);return root.worldToLocal(p.clone());}
    animate=t=>{
      const deploy=smooth(0,1.8,t),approach=smooth(1.3,3,t),hit=pulse(4.6,5.4,6.5,t),recoil=pulse(5.25,5.8,7.3,t),push=pulse(7.2,8.7,10.7,t);
      robot.position.set(mix(-3.3,-1.65,approach)+hit*.75-push*.6,0,0);robot.rotation.y=Math.PI/2;robot.scale.y=mix(.67,1,deploy);
      ape.position.set(mix(3.2,1.7,approach)+recoil*.7,0,0);ape.rotation.y=-Math.PI/2;ape.rotation.z=recoil*.15;
      wings.forEach(({wing,s})=>{wing.rotation.z=s*mix(1.3,.18,deploy);wing.rotation.y=s*.35});robotLegs.forEach((l,i)=>l.rotation.x=(i?1:-1)*.12*Math.sin(t*4)*(1-approach));
      apeHead.rotation.x=-.15*pulse(.2,1.1,2.2,t)+recoil*.25;jaw.scale.y=1+1.7*pulse(.2,1,2,t);
      scene.updateMatrixWorld(true);
      let rr=robot.localToWorld(V(.95,2.9,.65)),rl=robot.localToWorld(V(-.95,3.0,.75)),ar=ape.localToWorld(V(1.3,1.7,.7)),al=ape.localToWorld(V(-1.3,1.7,.7));
      // Ape swing meets the robot's block; later the robot fist reaches the ape's face.
      const swing=pulse(2.4,3.6,4.5,t),block=pulse(2.2,3.5,4.5,t);ar.lerp(V(-.05,3.85,.48),swing);rl.lerp(V(-.12,3.85,.48),block);
      rl.lerp(ape.localToWorld(V(0,4.35,.95)),hit);al.lerp(V(-.1-push*.3,3.5,-.45),push);rl.lerp(V(-.1-push*.3,3.5,-.45),push);
      for(const [l,target,s] of [[robotArms[0],rl,-1],[robotArms[1],rr,1]])setLimb(l,local(robot,target),V(s*2,3.1,-.5));
      for(const [l,target,s] of [[apeArms[0],al,-1],[apeArms[1],ar,1]])setLimb(l,local(ape,target),V(s*2.2,2.8,-.4));
      const impact=Math.max(pulse(3.5,3.65,4.2,t),pulse(5.35,5.5,6.2,t));particles.forEach((o,i)=>{o.visible=impact>.01;const a=i*2.399;o.position.set((t<4.5?0:1.35)+Math.sin(a)*(1-impact)*1.8,3.8+Math.cos(a)*(1-impact)*1.2,(i%5-.2)*.12);o.scale.setScalar(impact);});

    };
  }
  const clay=new T.MeshStandardMaterial({color:'#b8b0a2',roughness:.85});
  const setRoot=new T.Group();
  for(const object of [...scene.children])if(!object.isLight&&!placements.some(p=>p.wrapper===object))setRoot.add(object);
  scene.add(setRoot);editable.set={object:setRoot,pivot:[0,0,0],convention:'pivot'};
  editable.key={object:key,kind:'light',convention:'trs'};
  editable.camera={object:camera,kind:'camera',convention:'trs',extraKeys:['camera.override','camera.target','camera.fov'],extraValues:()=>({'camera.override':true,'camera.target':props.shot.target,'camera.fov':props.shot.fov})};
  scene.add(camera);
  let editorCamera=null,lastClock=null;
  function applyPlacement(object,value,pivot){object.quaternion.fromArray(value.orientation);object.scale.setScalar(value.scale);object.position.fromArray(value.position).add(pivot).sub(pivot.clone().multiplyScalar(value.scale).applyQuaternion(object.quaternion));object.updateMatrixWorld(true);}
  return {
   editing:{scene,camera,renderer,objects:editable,setView(view){editorCamera=view;},get shot(){return shotName;}},
   render(clock){
    lastClock=clock;
    // Evaluate authored action with identity placement, then apply editable placement.
    // Moving a character does not rewrite its skeleton or accumulate animation state.
    for(const p of placements){p.wrapper.position.set(0,0,0);p.wrapper.quaternion.identity();p.wrapper.scale.setScalar(1);}
    setRoot.position.set(0,0,0);setRoot.quaternion.identity();setRoot.scale.setScalar(1);scene.updateMatrixWorld(true);
    animate(clock.frame/clock.fps);
    const shot=authoredShot(props.kind,clock.frame/clock.fps,props.camera==='wide');camera.position.fromArray(shot.position);camera.lookAt(...shot.target);camera.fov=shot.fov;camera.updateProjectionMatrix();shotName=shot.label;
    for(const p of placements){p.pivot.copy(p.object.position);applyPlacement(p.wrapper,props.actors[p.id],p.pivot);}
    applyPlacement(setRoot,props.set,V());key.position.fromArray(props.key.position);key.intensity=props.key.intensity;key.color.set(props.key.color);
    if(props.shot.override){camera.position.fromArray(props.shot.position);camera.lookAt(...props.shot.target);camera.fov=props.shot.fov;camera.updateProjectionMatrix();shotName='CUSTOM / SHOT CAMERA';}
    scene.overrideMaterial=props.clay?clay:null;scene.userData.shot=shotName;renderer.domElement.dataset.shot=shotName;
    renderer.render(scene,clock.capture?camera:(editorCamera??camera));
   },
   png(){return renderer.domElement.toDataURL('image/png');},
   dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();for(const graph of [scene,env])graph.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());clay.dispose();envTarget.dispose();pm.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  };
 }
});
}
