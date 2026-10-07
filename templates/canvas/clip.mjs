// Replace this renderer with any trusted Canvas / DOM / SVG / Three / WASM code.
// Optional schemas expose handles to humans and agents; they do not define the art.
export const template={id:'my-clip',title:'Make the idea move',duration:6,width:1280,height:720,
 nodes:[{id:'hero',type:'design',label:'Art direction',props:{title:'MAKE IT MOVE',accent:'#b9ef78',speed:1,radius:160},keys:{}}],
 schemas:{design:{title:{type:'text',maxLength:50,label:'Headline'},accent:{type:'color',label:'Accent'},speed:{type:'number',min:.1,max:3,label:'Motion speed'},radius:{type:'number',min:40,max:240,label:'Orbit radius'}}}};
export function createRenderer(canvas){
 canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d');
 return {async render({time,nodes}){const p=nodes[0].props;ctx.fillStyle='#121b26';ctx.fillRect(0,0,1280,720);ctx.strokeStyle='#34424b';ctx.lineWidth=1;
  for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(640,340,150+i*30,60+i*18,-.22,0,Math.PI*2);ctx.stroke()}
  for(let i=0;i<24;i++){const a=i*Math.PI/12+time*p.speed*.8;ctx.fillStyle=p.accent;ctx.globalAlpha=.25+.75*(i/24);ctx.beginPath();ctx.arc(640+Math.cos(a)*p.radius*2,340+Math.sin(a)*p.radius,4+i/8,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1;ctx.fillStyle='#eff5ea';ctx.font='700 60px sans-serif';ctx.textAlign='center';ctx.fillText(p.title,640,355);ctx.font='16px sans-serif';ctx.fillStyle=p.accent;ctx.fillText('CODE THE MOTION. KEEP THE CONTROL.',640,628);
  return canvas;},dispose(){}};
}
