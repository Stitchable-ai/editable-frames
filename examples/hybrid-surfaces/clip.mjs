import {defineRenderer} from 'editableframes/renderer';
import {createFrameLoader,createForegroundHoldout,validatePreparedAnalysis,preparedFrame,sampleTrackFrame,scalePoints,cylinderMesh,sampleSurface,drawSurfaceArtwork,relightArtwork,createKineticText,loadPreparedAnalysis,pendingMaskCorrections} from 'editableframes/plate';

export const controls={version:1,fields:[
 {key:'foregroundSource',anchor:'surface',path:'/foregroundSource',type:'media',mediaKind:'video',default:'plate',label:'Original object footage'},
 {key:'foregroundMask',anchor:'foreground',path:'/foregroundMask',type:'media',mediaKind:'video',default:'foreground',label:'Prepared foreground'},
 {key:'prepared',anchor:'foreground',path:'/prepared',type:'json',default:null,label:'Prepared analysis'},
 {key:'corrections',anchor:'foreground',path:'/corrections',type:'json',default:null,label:'Subject corrections'},
 {key:'track',anchor:'surface',path:'/track',type:'json',default:null,label:'Original body track'},
 {key:'meshTrack',anchor:'surface',path:'/meshTrack',type:'json',default:null,label:'Optional deforming UV mesh'},
 {key:'label',anchor:'label',path:'/label',type:'string',default:'LUMA',label:'Exact label'},
 {key:'detail',anchor:'label',path:'/detail',type:'string',default:'BLOOD ORANGE',label:'Small print'},
 {key:'color',anchor:'label',path:'/color',type:'color',default:'#ed5426',label:'Body colour'},
 {key:'seam',anchor:'surface',path:'/seam',type:'number',min:-1,max:1,default:0,animatable:true,label:'Authored label rotation'},
 {key:'bodyInset',anchor:'surface',path:'/bodyInset',type:'number',min:0,max:.1,default:.02,label:'Body edge inset'},
 {key:'rimCurve',anchor:'surface',path:'/rimCurve',type:'number',min:0,max:.1,default:.03,label:'Lower body curvature'},
 {key:'reference',anchor:'lighting',path:'/reference',type:'number',min:1,max:255,default:180,label:'Neutral body reference'},
 {key:'shading',anchor:'lighting',path:'/shading',type:'number',min:0,max:1,default:1,label:'Preserve observed shading'},
 {key:'headline',anchor:'headline',path:'/headline',type:'string',default:'MADE TO MOVE.',label:'Motion title'},
 {key:'motion',anchor:'headline',path:'/motion',type:'string',default:'rise',label:'Text treatment'},
 {key:'plateStartFrame',anchor:'surface',path:'/plateStartFrame',type:'number',min:0,max:18000,default:0,label:'Source frame at start'},
 {key:'plateSpeed',anchor:'surface',path:'/plateSpeed',type:'number',min:-8,max:8,default:1,label:'Source speed'},
]};
const defaults=Object.fromEntries(controls.fields.map(f=>[f.key,f.default]));
export default defineRenderer({id:'surface-reskin',renderer:'canvas+dom',width:1920,height:1080,fps:24,durationInFrames:108000,controls,defaultProps:{...defaults,foregroundRequired:true},
 async create({root,props,sourceFrame,asset,mediaInfo}){
  if(!sourceFrame)throw Error('Surface reskin needs the host exact source-frame service');
  const initialPrepared=props.prepared??(mediaInfo?await loadPreparedAnalysis({asset,mediaInfo},'analysis'):null);
  const initialTrack=props.track??(mediaInfo?await (await fetch(asset('track'))).json():null);
  const doc=root.ownerDocument,stage=doc.createElement('div');stage.style.cssText='position:absolute;inset:0;overflow:hidden';root.append(stage);
  const canvas=()=>{const c=doc.createElement('canvas');c.style.cssText='position:absolute;inset:0;width:100%;height:100%';return c;};
  const plate=canvas(),ink=canvas(),art=canvas();art.width=2048;art.height=1024;stage.append(plate);
  const title=doc.createElement('div');title.style.cssText='position:absolute;left:5%;top:8%;width:88%;font:900 72px/1.05 system-ui;color:white';
  const kinetic=createKineticText({root:title}),frames=createFrameLoader({document:doc,max:6});let holdout=null,identity='',labelKey='';
  return {
   async render(clock){
    if(props.preparedError)throw Error(props.preparedError);
    const receipt=validatePreparedAnalysis(props.prepared??initialPrepared),s=receipt.source,track=props.track??initialTrack;
    const pending=pendingMaskCorrections(props.corrections,receipt.provenance.appliedCorrections);
    if(pending)throw Error('Corrections changed; prepare and review a new mask revision before rendering');
    if(!props.foregroundSource||!props.foregroundMask||!track)throw Error('Reskin needs the original source, foreground and original-body track');
    if(track.sourceSha256&&track.sourceSha256!==s.sha256)throw Error('Surface track belongs to a different take');
    const at=preparedFrame(receipt,clock.mediaTime??clock.frame/clock.fps,{startFrame:Number(props.plateStartFrame),speed:Number(props.plateSpeed)});
    const w=root.clientWidth||clock.width,h=root.clientHeight||clock.height;
    for(const c of [plate,ink])if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    if(identity!==s.sha256){identity=s.sha256;holdout?.dispose();holdout=createForegroundHoldout({root:stage,width:s.width,height:s.height});holdout.root.append(ink,title);}
    const info={width:s.width,height:s.height,seconds:at.seconds};
    const [image,mask]=await Promise.all([frames.load(sourceFrame(String(props.foregroundSource),at.sourceFrame,info)),frames.load(sourceFrame(String(props.foregroundMask),at.maskFrame,{...info,seconds:at.maskSeconds}))]);
    const pc=plate.getContext('2d',{willReadFrequently:true});pc.drawImage(image,0,0,w,h);
    const key=JSON.stringify([props.label,props.detail,props.color]);
    if(key!==labelKey){labelKey=key;const c=art.getContext('2d');c.fillStyle=props.color;c.fillRect(0,0,2048,1024);c.fillStyle='white';c.textAlign='center';c.textBaseline='middle';c.font='900 190px system-ui';c.fillText(String(props.label),1024,470,900);c.font='700 38px system-ui';c.fillText(String(props.detail),1024,650,900);}
    const pin=sampleTrackFrame(track,at.sourceFrame);if(pin.held||pin.confidence<=0)throw Error('Original body track is missing at source frame '+at.sourceFrame);
    const fitted=props.meshTrack?sampleSurface(props.meshTrack,at.sourceFrame):null;
    const quad=scalePoints(pin.quad,track,w,h),inset=Number(props.bodyInset),curve=Number(props.rimCurve);
    if(!Number.isFinite(inset)||inset<0||inset>.1||!Number.isFinite(curve)||curve<0||curve>.1)throw Error('Invalid body inset/curvature');
    const fittedQuad=[quad[0].map((v,i)=>v+(quad[1][i]-v)*inset),quad[1].map((v,i)=>v+(quad[0][i]-v)*inset),quad[2].map((v,i)=>v+(quad[3][i]-v)*inset),quad[3].map((v,i)=>v+(quad[2][i]-v)*inset)];
    const mesh=fitted?{...fitted,vertices:scalePoints(fitted.vertices,track,w,h)}:cylinderMesh(fittedQuad,{seam:Number(props.seam)});
    if(!fitted){const bodyHeight=(Math.hypot(quad[3][0]-quad[0][0],quad[3][1]-quad[0][1])+Math.hypot(quad[2][0]-quad[1][0],quad[2][1]-quad[1][1]))/2;mesh.vertices=mesh.vertices.map(([x,y],i)=>{const u=i%65/64,v=Math.floor(i/65)/8;return [x,y-bodyHeight*curve*(2*u-1)**2*v**6];});}
    const ic=ink.getContext('2d',{willReadFrequently:true});ic.clearRect(0,0,w,h);drawSurfaceArtwork(ic,art,mesh,{wrap:true});
    const pixels=ic.getImageData(0,0,w,h);pixels.data.set(relightArtwork(pixels.data,pc.getImageData(0,0,w,h).data,{reference:Number(props.reference),strength:Number(props.shading)}));ic.putImageData(pixels,0,0);
    holdout.update(mask,{channel:receipt.alpha.channel,corrections:pending,frame:at.sourceFrame,sourceSha256:s.sha256,subject:receipt.subject});
    kinetic.render(clock.frame/clock.fps,{text:String(props.headline),effect:String(props.motion),hold:3600,stagger:.08});
   },
   dispose(){frames.dispose();kinetic.dispose();holdout?.dispose();stage.remove();},
  };
 }
});
