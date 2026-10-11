import {defineRenderer} from 'editableframes/renderer';
export default defineRenderer({
 id:'my-scene',renderer:'canvas',width:640,height:360,fps:30,durationInFrames:90,
 defaultProps:{accent:'#38bdf8',radius:32,headline:'Make it move',custom:{preserved:true}},
 controls:{version:1,objects:[{id:'scene',label:'Scene'},{id:'orb',label:'Orb',parentId:'scene'},{id:'title',label:'Title',parentId:'scene'}],fields:[
  {key:'accent',anchor:'orb',property:'color',path:'/accent',type:'color',label:'Accent'},
  {key:'radius',anchor:'orb',property:'radius',path:'/radius',type:'number',min:8,max:100,label:'Radius',animatable:true},
  {key:'headline',anchor:'title',property:'text',path:'/headline',type:'string',label:'Headline'}
 ]},
 async create({root,props}){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;root.append(canvas);const ctx=canvas.getContext('2d');
  return {render(clock){
   const x=320+Math.sin(clock.frame/clock.fps)*160;ctx.clearRect(0,0,640,360);ctx.fillStyle=props.accent;
   ctx.beginPath();ctx.arc(x,140,props.radius,0,Math.PI*2);ctx.fill();ctx.font='32px sans-serif';ctx.textAlign='center';ctx.fillText(props.headline,320,290);
  },pick({x,y,clock}){const cx=320+Math.sin(clock.frame/clock.fps)*160;return Math.hypot(x-cx,y-140)<=props.radius?{anchor:'orb',property:'color'}:null;},dispose(){canvas.remove();}};
 }
});
