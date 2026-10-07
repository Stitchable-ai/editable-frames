export const W=1280,H=720,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>{t=clamp(t);return t*t*(3-2*t)},out=t=>1-Math.pow(1-clamp(t),3),fract=t=>t-Math.floor(t),rand=n=>fract(Math.sin(n*127.1+311.7)*43758.5453),tau=Math.PI*2;
export function text(x,s,a,b,size=30,color='#fff',align='left',font='Arial',weight=400){x.fillStyle=color;x.font=`${weight} ${size}px ${font}`;x.textAlign=align;x.fillText(s,a,b)}
export function rect(x,a,b,w,h,color,r=0){x.fillStyle=color;if(!r){x.fillRect(a,b,w,h);return}x.beginPath();x.roundRect(a,b,w,h,r);x.fill()}
export function circle(x,a,b,r,color){x.fillStyle=color;x.beginPath();x.arc(a,b,r,0,tau);x.fill()}
export function line(x,points,color,width=2){x.strokeStyle=color;x.lineWidth=width;x.lineJoin='round';x.lineCap='round';x.beginPath();for(let i=0;i<points.length;i++)x[i?'lineTo':'moveTo'](...points[i]);x.stroke()}
export function poly(x,points,color,stroke){x.beginPath();for(let i=0;i<points.length;i++)x[i?'lineTo':'moveTo'](...points[i]);x.closePath();x.fillStyle=color;x.fill();if(stroke){x.strokeStyle=stroke;x.lineWidth=1;x.stroke()}}
const grainFrames=[];
// Screen-space grain uses an explicit source-over pixel blend. Reading the base
// frame first also resolves deferred Canvas paint before applying this texture.
// The result depends only on the frame and seed, never on prior seek order.
export function grain(x,t,amount=.2){
 if(!grainFrames.length)for(let f=0;f<6;f++){const data=new Uint8ClampedArray(320*180*4);for(let i=0;i<data.length;i+=4){const v=rand(i+f*17371)>.5?255:0;data[i]=data[i+1]=data[i+2]=v;data[i+3]=Math.floor(rand(i+f*19)*145)}grainFrames.push(data)}
 amount=clamp(amount);if(!amount)return;
 const w=x.canvas.width,h=x.canvas.height,frame=x.getImageData(0,0,w,h),pixels=frame.data,noise=grainFrames[((Math.floor(t*12)%6)+6)%6];
 for(let y=0;y<h;y++){const row=Math.floor(y*180/h)*320;for(let a=0;a<w;a++){
  const i=(y*w+a)*4,n=(row+Math.floor(a*320/w))*4,sa=noise[n+3]/255*amount,da=pixels[i+3]/255,alpha=sa+da*(1-sa);if(!alpha)continue;
  const source=noise[n]*sa,dest=da*(1-sa);for(let k=0;k<3;k++)pixels[i+k]=(source+pixels[i+k]*dest)/alpha;pixels[i+3]=alpha*255;
 }}x.putImageData(frame,0,0);
}
export function caption(x,label,sub,fg='#f2eadb'){text(x,label,62,622,36,fg,'left','Georgia');if(sub)text(x,sub,63,655,15,fg)}
export function star(x,a,b,r,color,points=5){const p=[];for(let i=0;i<points*2;i++){const k=i%2?r*.45:r,z=i*Math.PI/points-Math.PI/2;p.push([a+Math.cos(z)*k,b+Math.sin(z)*k])}poly(x,p,color)}
export function sketch(x,points,color,width,t,rough=.5){for(let pass=0;pass<2;pass++){const f=Math.floor(t*9);line(x,points.map(([a,b],i)=>[a+(rand(i*23+f*7+pass)*2-1)*rough*2,b+(rand(i*47+f*9+pass)*2-1)*rough*2]),color,width*(pass?.45:1))}}
