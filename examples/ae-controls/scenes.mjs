import {Studio,ticks} from '../../packages/core/index.mjs';
export const number=(label,min,max,unit='',step=.01)=>({type:'number',label,min,max,unit,step});
const keys=(rows)=>rows.map(([time,value,easing='smooth'])=>({time,value,easing}));
const transform={x:number('Position X',-5,5,'m'),y:number('Position Y',-3,3,'m'),yaw:number('Rotation Y',-180,180,'°',1),pitch:number('Rotation X',-85,85,'°',1),scale:number('Scale',.3,1.6,'×')};
export const templates={
 trail:{title:'TRAIL / Product film',duration:12,schemas:{
  device:{...transform,model:{type:'enum',label:'Phone model',values:['craft-iphone-17-pro','cody-iphone-12','cody-pixel-6']},finish:{type:'enum',label:'Body finish',values:['aluminium','authored']}},
  camera:{azimuth:number('Orbit',-50,50,'°',1),elevation:number('Height',-.5,3,'m'),distance:number('Dolly distance',5.5,12,'m'),exposure:number('Exposure',.3,1.6,'×')},
  screen:{progress:number('Route reveal',0,1,'×'),accent:{type:'color',label:'Trail color'},distance:number('Distance',0,25,'km',.1)},
  title:{x:number('Position X',50,600,'px',1),y:number('Position Y',120,470,'px',1),opacity:number('Opacity',0,1),text:{type:'text',label:'Headline',maxLength:45}},
  card:{x:number('Position X',40,800,'px',1),y:number('Position Y',70,640,'px',1),opacity:number('Opacity',0,1),label:{type:'text',label:'Callout',maxLength:35}}
 },nodes:[
 {id:'phone.hero',type:'device',label:'Hero phone',props:{x:1.45,y:0,yaw:-24,pitch:8,scale:1,model:'craft-iphone-17-pro',finish:'aluminium'},keys:{yaw:keys([[0,-62],[2,-22],[8,20],[12,-15]]),y:keys([[0,-.6],[2,0],[8,.12],[12,0]])}},
 {id:'camera.main',type:'camera',label:'Camera',props:{azimuth:0,elevation:.55,distance:8.4,exposure:1},keys:{distance:keys([[0,10],[3,8.4],[9,7.8],[12,8.4]])}},
 {id:'screen.route',type:'screen',label:'Screen · trail map',props:{progress:0,accent:'#b2db8b',distance:8.4},keys:{progress:keys([[0,0],[2,.05],[8,1],[12,1]])}},
 {id:'title.hero',type:'title',label:'Headline',props:{x:84,y:240,opacity:1,text:'Find your next\nway out.'},keys:{opacity:keys([[0,0],[1.5,1],[10,1],[12,0]])}},
 {id:'callout.route',type:'card',label:'Route callout',props:{x:88,y:490,opacity:1,label:'A little further. A lot freer.'},keys:{opacity:keys([[0,0],[3,0],[4,1],[10,1],[12,0]])}}
 ]},
 orbit:{title:'ORBIT / Graphic explainer',duration:10,schemas:{
  disc:{x:number('Position X',100,1150,'px',1),y:number('Position Y',100,620,'px',1),radius:number('Radius',20,180,'px',1),turn:number('Rotation',-360,720,'°',1),color:{type:'color',label:'Color'}},
  title:{x:number('Position X',40,700,'px',1),y:number('Position Y',100,600,'px',1),opacity:number('Opacity',0,1),text:{type:'text',label:'Headline',maxLength:50}},
  ribbon:{reveal:number('Path reveal',0,1),width:number('Stroke width',1,18,'px',1),color:{type:'color',label:'Line color'}}
 },nodes:[
 {id:'planet.main',type:'disc',label:'Orange planet',props:{x:890,y:345,radius:120,turn:0,color:'#e69368'},keys:{x:keys([[0,1090],[2,890],[7,750],[10,900]]),turn:keys([[0,0,'linear'],[10,360]])}},
 {id:'planet.moon',type:'disc',label:'Blue moon',props:{x:710,y:190,radius:40,turn:0,color:'#96bbca'},keys:{y:keys([[0,510],[3,185],[7,430],[10,510]]),x:keys([[0,650],[3,710],[7,1080],[10,650]])}},
 {id:'title.hero',type:'title',label:'Headline',props:{x:84,y:285,opacity:1,text:'Small changes.\nNew possibilities.'},keys:{opacity:keys([[0,0],[1,1],[9,1],[10,0]])}},
 {id:'orbit.path',type:'ribbon',label:'Orbit path',props:{reveal:1,width:2,color:'#9da98b'},keys:{reveal:keys([[0,0],[4,1],[10,1]])}}
 ]}
};
export function createStudy(template,binding='motion-unit-fixture'){const studio=new Studio(templates,{binding});studio.execute({type:'addClip',template});const doc=structuredClone(studio.doc);return new Studio(templates,{document:doc,binding});}
export function sampled(studio,frame){const clip=studio.doc.clips[0];return Object.fromEntries(studio.values(clip,Math.round(frame*120000/30)).map(n=>[n.id,n.props]));}
