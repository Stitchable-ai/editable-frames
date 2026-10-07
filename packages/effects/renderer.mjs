import * as T from 'three';
import {byId} from './catalog.mjs';
const W=1280,H=720;
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 vUv;uniform sampler2D inputTex,extraTex;uniform vec2 size;uniform int mode;uniform float p0,p1,p2,time,seed;uniform vec3 colorA,colorB;
vec4 at(vec2 uv){if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec4(0.);return texture2D(inputTex,uv);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed*13.7)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03)+.15*noise(p*4.07);}
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 toS(vec3 c){return mix(12.92*c,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 toL(vec3 c){return mix(c/12.92,pow(max((c+.055)/1.055,vec3(0.)),vec3(2.4)),step(vec3(.04045),c));}
void main(){vec2 uv=vUv,px=1./size;vec4 a=at(uv);vec3 c=a.rgb/max(a.a,.00001);float alpha=a.a;
if(mode==0){a.rgb*=a.a;}
else if(mode==1||mode==2){vec2 dir=mode==1?vec2(p1,p2):vec2(cos(radians(p1)),sin(radians(p1)));vec4 sum=vec4(0.);float weight=0.;for(int i=-16;i<=16;i++){float f=float(i)/16.;float k=mode==1?exp(-f*f*4.5):1.;sum+=at(uv+dir*px*p0*f)*k;weight+=k;}a=sum/weight;}
else if(mode==4){a.rgb*=exp2(p0);}
else if(mode==5){float an=radians(p0);vec3 k=normalize(vec3(1.));c=c*cos(an)+cross(k,c)*sin(an)+k*dot(k,c)*(1.-cos(an));c=mix(vec3(lum(c)),c,p1);a.rgb=max(c,vec3(0.))*alpha;}
else if(mode==6){a.rgb=mix(c,mix(colorA,colorB,clamp(lum(c),0.,1.)),p0)*alpha;}
else if(mode==7){a.rgb=mix(c,toL(1.-clamp(toS(c),0.,1.)),p0)*alpha;}
else if(mode==8){vec2 q=uv*p1+vec2(time*p2,.31*time*p2);vec2 d=vec2(fbm(q),fbm(q+17.3))-.5;a=at(uv+d*p0*px*2.);}
else if(mode==9){vec2 q=uv-.5;q.x*=size.x/size.y;float r=length(q),an=atan(q.y,q.x)+radians(p0)*pow(max(0.,1.-r/p1),2.);vec2 w=vec2(cos(an),sin(an))*r;w.x/=size.x/size.y;a=at(w+.5);}
else if(mode==10){a=at(uv+vec2(sin(uv.y*p1*6.283+time*p2*2.)*p0/size.x,0.));}
else if(mode==11){a=at((floor(uv*size/p0)+.5)*p0/size);}
else if(mode==12){float gx=0.,gy=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){float v=lum(at(uv+vec2(float(x),float(y))*px).rgb);gx+=v*float(x)*(y==0?2.:1.);gy+=v*float(y)*(x==0?2.:1.);}float edge=clamp(length(vec2(gx,gy))*p0,0.,1.);a=vec4(vec3(edge),1.);}
else if(mode==13){a.rgb=toL(floor(clamp(toS(c),0.,1.)*(p0-1.)+.5)/(p0-1.))*alpha;}
else if(mode==14){float n=hash(floor(uv*size)+floor(time*24.)*vec2(31.,71.))-.5;a.rgb=max(c+n*p0,vec3(0.))*alpha;}
else if(mode==15){float f=clamp(dot(uv-.5,vec2(cos(radians(p0)),sin(radians(p0))))+.5,0.,1.);a=vec4(mix(colorA,colorB,f),1.);}
else if(mode==16){float f=1.-smoothstep(p0-p1,p0+p1,uv.x);a*=f;}
else if(mode==17){float angle=fract(atan(uv.x-.5,uv.y-.5)/6.283+1.);a*=1.-smoothstep(p0-p1,p0+p1,angle);}
else if(mode==18){float f=fract(uv.y*p1);a*=1.-smoothstep(p0-.015,p0+.015,f);}
else if(mode==21){a*=texture2D(extraTex,uv).r;}
else if(mode==22){float distanceToGreen=length(toS(c)-vec3(0.,1.,0.));float keep=smoothstep(p0,p0+p1,distanceToGreen);a*=keep;}
else if(mode==23){vec2 q=uv-.5;q.x*=size.x/size.y;float v=smoothstep(p1*.4,p1+ .5,length(q));a.rgb*=1.-v*p0;}
else if(mode==24){vec2 origin=vec2(.18,.3),end=vec2(.82,.55+.15*sin(time));vec2 pa=uv-origin,ba=end-origin;float f=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);float d=length(pa-ba*f);float beam=exp(-d*d/max(.000001,p0*p0));a=vec4(colorA*beam*p1,clamp(beam,0.,1.));}
else if(mode==31){float gate=smoothstep(p0,p0+.15,lum(c));a*=gate;}
else if(mode==33){vec4 bloom=texture2D(extraTex,uv);a.rgb+=bloom.rgb*p0;a.a=max(a.a,clamp(bloom.a*p0,0.,1.));}
else if(mode==99){vec3 bg=mix(vec3(.012,.023,.048),vec3(.026,.054,.069),uv.y);float grid=step(.98,fract(uv.x*32.))+step(.98,fract(uv.y*18.));bg+=grid*.006;a=vec4(a.rgb+bg*(1.-a.a),1.);}
gl_FragColor=a;
#include <colorspace_fragment>
}`;
function rounded(ctx,x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function sourceDraw(ctx,t,p,weight=1){ctx.save();ctx.globalAlpha=weight;const tm=t*p.speed,accent=p.accent;
if(p.style==='key'){ctx.fillStyle='#00ff00';ctx.fillRect(0,0,W,H);ctx.translate(640+70*Math.sin(tm),360);ctx.fillStyle='#fecb88';ctx.beginPath();ctx.arc(0,-78,78,0,Math.PI*2);ctx.fill();rounded(ctx,-118,3,236,225,58,'#244dab');ctx.strokeStyle='#fecb88';ctx.lineWidth=40;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(105,45);ctx.lineTo(160+30*Math.sin(tm*2),-45);ctx.stroke();ctx.fillStyle='#17253c';for(const x of [-25,25]){ctx.beginPath();ctx.arc(x,-90,5,0,7);ctx.fill()}ctx.restore();return;}
if(p.style==='product'){const x=540+Math.sin(tm)*20;rounded(ctx,x,125,555,470,28,'#e8eee9');rounded(ctx,x+23,151,509,44,12,'#cbd9d4');ctx.fillStyle='#18363e';ctx.font='600 22px Arial';ctx.fillText('NORTH / ANALYTICS',x+43,180);ctx.font='500 44px Arial';ctx.fillText('$ 48,920',x+42,278);ctx.font='18px Arial';ctx.fillText('Revenue this month',x+42,315);ctx.beginPath();ctx.moveTo(x+42,510);for(let i=0;i<60;i++){const yy=450-i*1.3-Math.sin(i*.3+tm)*24;ctx.lineTo(x+42+i*7.5,yy)}ctx.strokeStyle='#278979';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle=accent;ctx.font='600 66px Arial';ctx.fillText('A clearer',85,280);ctx.fillText('perspective.',85,354);ctx.fillStyle='#b3c5d2';ctx.font='22px Arial';ctx.fillText('A coded interface. An editable finish.',88,420);ctx.restore();return;}
if(p.style==='type'){ctx.translate(640,350);ctx.rotate(Math.sin(tm*.5)*.035);ctx.font='900 133px Arial';ctx.textAlign='center';ctx.fillStyle='#e5ede6';ctx.fillText('MAKE IT',0,-35);ctx.fillStyle=accent;ctx.fillText('FLOW.',0,100);ctx.strokeStyle=accent;ctx.lineWidth=2;for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(0,0,330+i*25,230+i*11,tm*.03,0,Math.PI*2);ctx.stroke()}ctx.restore();return;}
// Transparent orbital source: temporal effects can resample moving objects without repeating a background.
const x=640+Math.sin(tm*1.5)*185,y=352+Math.cos(tm*1.1)*115;
ctx.strokeStyle='#3d6279';ctx.lineWidth=1.5;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(640,360,310+i*36,160+i*22,-.25,0,7);ctx.stroke()}
ctx.save();ctx.translate(x,y);ctx.rotate(tm*.45);let g=ctx.createLinearGradient(-120,-100,100,130);g.addColorStop(0,'#effbdc');g.addColorStop(.45,accent);g.addColorStop(1,'#4d63ba');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(-95,-95,190,190,44);ctx.fill();ctx.strokeStyle='#ffffffbb';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#102841';ctx.font='700 84px Arial';ctx.textAlign='center';ctx.fillText('e',0,26);ctx.restore();for(let i=0;i<12;i++){const an=i/12*Math.PI*2+tm*.6;ctx.fillStyle=i%3===0?'#ffe0a8':accent;ctx.beginPath();ctx.arc(640+Math.cos(an)*315,360+Math.sin(an)*175,3+(i%3)*2,0,7);ctx.fill()}
ctx.fillStyle='#e7efec';ctx.font='500 36px Arial';ctx.fillText(p.title,68,92);ctx.fillStyle='#96b0c4';ctx.font='16px Arial';ctx.fillText('EDITABLEFRAME   /   EFFECT STUDIES',70,641);ctx.restore();}
export function createRenderer(canvas){const r=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,alpha:false});r.setSize(W,H,false);r.setPixelRatio(1);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.NoToneMapping;
if(!r.extensions.has('EXT_color_buffer_float'))throw Error('This study requires WebGL2 floating-point render targets');
const source=document.createElement('canvas');source.width=W;source.height=H;const ctx=source.getContext('2d'),tex=new T.CanvasTexture(source);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearFilter;tex.generateMipmaps=false;
const mask=document.createElement('canvas');mask.width=W;mask.height=H;const mx=mask.getContext('2d'),maskTex=new T.CanvasTexture(mask);maskTex.colorSpace=T.NoColorSpace;maskTex.minFilter=T.LinearFilter;maskTex.generateMipmaps=false;
const targets=Array.from({length:4},()=>new T.WebGLRenderTarget(W,H,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false,stencilBuffer:false}));
const scene=new T.Scene(),camera=new T.Camera(),uniforms={inputTex:{value:null},extraTex:{value:null},size:{value:new T.Vector2(W,H)},mode:{value:0},p0:{value:0},p1:{value:0},p2:{value:0},time:{value:0},seed:{value:17},colorA:{value:new T.Color()},colorB:{value:new T.Color()}};
const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,depthTest:false,depthWrite:false,toneMapped:false});scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));let inspected={};
function pass(input,target,mode,p=[],extra=null,colors=[]){uniforms.inputTex.value=input;uniforms.extraTex.value=extra||input;uniforms.mode.value=mode;for(let i=0;i<3;i++)uniforms['p'+i].value=p[i]??0;if(colors[0])uniforms.colorA.value.set(colors[0]);if(colors[1])uniforms.colorB.value.set(colors[1]);r.setRenderTarget(target);r.render(scene,camera);return target?.texture;}
function makeSource(t,p,echo=null){ctx.clearRect(0,0,W,H);if(echo){ctx.globalCompositeOperation='lighter';for(let i=echo.count;i>=0;i--)sourceDraw(ctx,t-i*echo.spacing,p,Math.pow(echo.decay,i)/1.5);ctx.globalCompositeOperation='source-over'}else sourceDraw(ctx,t,p);tex.needsUpdate=true;}
function draw(t,nodes,order,bypass=false){const start=performance.now(),p=nodes.find(n=>n.id==='source').props;uniforms.time.value=t;uniforms.seed.value=17;const requestedTimes=[t];makeSource(t,p);let input=pass(tex,targets[0],0),passes=1;
if(!bypass)for(const id of order){const node=nodes.find(n=>n.id===id);if(!node||!node.props.enabled)continue;const e=byId[node.effect],q=node.props,out=input===targets[0].texture?targets[1]:targets[0];let a=[];let colors=[];
if(e.mode===19||e.mode===20){const st=e.mode===20?Math.floor(t*q.fps)/q.fps:t;makeSource(st,p,e.mode===19?q:null);if(e.mode===19)for(let i=1;i<=q.count;i++)requestedTimes.push(t-i*q.spacing);else requestedTimes.push(st);input=pass(tex,out,0);passes++;continue;}
if((e.mode===1||e.mode===2)&&q.radius===0)continue;
if(e.mode===3){pass(input,targets[2],31,[q.threshold]);pass(targets[2].texture,targets[3],1,[q.radius,1,0]);pass(targets[3].texture,targets[2],1,[q.radius,0,1]);input=pass(input,out,33,[q.strength],targets[2].texture);passes+=4;continue;}
if(e.mode===1){pass(input,targets[2],1,[q.radius,1,0]);input=pass(targets[2].texture,out,1,[q.radius,0,1]);passes+=2;continue;}
switch(e.mode){case 2:a=[q.radius,q.angle];break;case 4:a=[q.stops];break;case 5:a=[q.hue,q.saturation];break;case 6:a=[q.amount];colors=[q.dark,q.light];break;case 7:a=[q.amount];break;case 8:a=[q.amount,q.scale,q.speed];break;case 9:a=[q.angle,q.radius];break;case 10:a=[q.amount,q.frequency,q.speed];break;case 11:a=[q.size];break;case 12:a=[q.strength];break;case 13:a=[q.levels];break;case 14:a=[q.amount];uniforms.seed.value=q.seed;break;case 15:a=[q.angle];colors=[q.start,q.end];break;case 16:case 17:a=[q.progress,q.feather];break;case 18:a=[q.progress,q.bands];break;case 21:{const cx=640+Math.sin(t)*160,cy=360;const radius=q.radius*H;mx.fillStyle='#000';mx.fillRect(0,0,W,H);const gradient=mx.createRadialGradient(cx,cy,Math.max(0,radius-q.softness*H),cx,cy,radius+q.softness*H);gradient.addColorStop(0,'white');gradient.addColorStop(1,'black');mx.fillStyle=gradient;mx.fillRect(0,0,W,H);maskTex.needsUpdate=true;break;}case 22:a=[q.tolerance,q.softness];break;case 23:a=[q.amount,q.radius];break;case 24:a=[q.width,q.intensity];colors=[q.color];break;default:throw Error('Unknown effect renderer')}
input=pass(input,out,e.mode,a,e.mode===21?maskTex:null,colors);passes++;}
pass(input,null,99);passes++;inspected={t,requestedTimes,passes,backend:'WebGL2',intermediates:'linear RGBA16F / premultiplied alpha',output:'sRGB',textures:r.info.memory.textures,cpuSubmissionMs:performance.now()-start};return inspected;}
return {draw,inspect:()=>structuredClone(inspected),png:()=>canvas.toDataURL('image/png'),jpg:()=>canvas.toDataURL('image/jpeg',.94)};
}
