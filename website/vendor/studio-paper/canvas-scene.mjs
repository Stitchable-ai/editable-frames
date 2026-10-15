// Original procedural study, MIT; source attribution retained in ATTRIBUTIONS.md.
import {paintObject} from './object-controls.mjs';
import { W, H, mix, ease, out, fract, rand, tau, text, rect, circle, line, poly, grain } from "./drawing.mjs";
function bot(x, a, b, s, p, t, arm = 0) {
  x.save();
  x.translate(a, b);
  x.rotate(Math.sin(t * 2) * 0.025 * p.bounce);
  x.scale(s, s);
  x.shadowColor = "#493e4433";
  x.shadowOffsetX = 6;
  x.shadowOffsetY = 9;
  x.shadowBlur = 6;
  for (const [dx, h] of [[-47, 42], [34, 42]]) rect(x, dx, 25, 18, h, p.body, 3);
  rect(x, -78, -69, 154, 112, p.body, 9);
  if(!p.joinedArms){
    rect(x, -99, -15, 24, 17, p.body, 2);
    x.save();x.translate(75, -20);x.rotate(-arm);
    rect(x, 0, 0, 44, 16, p.body, 2);x.restore();
  }
  x.shadowColor = "transparent";
  x.strokeStyle = "#3f3931";
  x.lineWidth = 2;
  x.strokeRect(-77, -68, 153, 110);
  for (const eye of [-35, 35]) line(x, [[eye - 7, -25], [eye, -31], [eye + 7, -25]], "#352e2c", 2);
  x.beginPath();
  x.arc(0, -13, 15, 0, Math.PI);
  x.stroke();
  circle(x,-48,-13,6,"#e6a2a570");circle(x,48,-13,6,"#e6a2a570");
  x.restore();
}
function sprout(x, a, b, size, p, t) {
  if (size < 1) return;
  const tipX = a - 5, tipY = b - size;
  line(x, [[a, b], [tipX, tipY]], "#485941", 4);
  const growth = Math.min(1, size / 90);
  for (const side of [-1, 1]) {
    const y = b - size * (side < 0 ? 0.49 : 0.65), stemX = a - 5 * (b - y) / size;
    x.save();
    x.translate(stemX, y);
    x.scale(side * growth, growth);
    x.shadowColor = "#40533a22";
    x.shadowBlur = 3;
    x.shadowOffsetY = 3;
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(9, -31, 34, -39, 53, -37);
    x.bezierCurveTo(45, -7, 23, 5, 0, 0);
    x.fillStyle = p.leaf;
    x.fill();
    x.shadowColor = "transparent";
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(25, -17, 48, -34);
    x.strokeStyle = "#e8eed077";
    x.lineWidth = 1.2;
    x.stroke();
    x.restore();
  }
  const bloom = ease((t - 10.5) / 2.2);
  if (!bloom) {
    circle(x, tipX, tipY, Math.min(6, size * 0.07), p.leaf);
    return;
  }
  x.save();
  x.translate(tipX, tipY);
  x.rotate(Math.sin(t * 1.6) * 0.035);
  x.scale(bloom, bloom);
  x.shadowColor = "#80633833";
  x.shadowOffsetY = 3;
  x.shadowBlur = 3;
  for (let i = 0; i < 9; i++) {
    x.save();
    x.rotate(i * tau / 9);
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(-18, -15, -19, -43, 0, -45);
    x.bezierCurveTo(19, -43, 18, -15, 0, 0);
    x.fillStyle = i % 2 ? p.petalColor : p.petalHighlight;
    x.fill();
    x.strokeStyle = "#ba893c";
    x.lineWidth = 0.8;
    x.stroke();
    x.restore();
  }
  x.shadowColor = "transparent";
  circle(x, 0, 0, 13, "#865837");
  circle(x, -3, -3, 9, "#a8743d");
  for (let i = 0; i < 13; i++) {
    const angle = i * 2.4, r = 2 + Math.sqrt(i) * 2;
    circle(x, Math.cos(angle) * r, Math.sin(angle) * r, 1.15, "#e6c580");
  }
  x.restore();
}
function heart(x,a,b,size,color){
  x.save();x.translate(a,b);x.scale(size,size);x.beginPath();x.moveTo(0,4);
  x.bezierCurveTo(-17,-6,-11,-19,0,-10);x.bezierCurveTo(11,-19,17,-6,0,4);
  x.fillStyle=color;x.fill();x.restore();
}
function drawHappyGarden(x,t,p){
  const q=Math.floor(t*p.fps)/p.fps,bob=Math.sin(q*3)*2.5;
  const blue={x:410,y:458+bob},green={x:665,y:458+bob},join={x:537.5,y:447+bob};
  const props={...p,robotPosition:[0,0,0]};
  rect(x,0,0,W,H,"#eee9da");
  for(let k=0;k<22;k++)line(x,[[40,140+k*23],[1230,141+k*23]],"#a99e8610",1);
  line(x,[[90,520],[1190,520]],"#b8b09d",1);
  paintObject(x,props,"sprout",[1000,512],x=>{
    rect(x,940,510,120,9,"#c5ac82",6);sprout(x,1000,512,155,p,12+Math.sin(q)*.15);
    // Even the sunflower enjoys its little shower.
    for(const side of [-1,1])circle(x,995+side*5,355,1.4,"#453d2d");
    x.beginPath();x.arc(995,359,4,0,Math.PI);x.strokeStyle="#453d2d";x.lineWidth=1.2;x.stroke();
  });
  const arm=(context,center,scale,from,to,color)=>{
    const local=point=>[center.x+(point.x-center.x)/scale,center.y+(point.y-center.y)/scale];
    line(context,[local(from),local(to)],color,15);
  };
  paintObject(x,props,"friend",[blue.x,blue.y],x=>{
    bot(x,blue.x,blue.y,1.12,{...p,body:p.friendColor,joinedArms:true},q,0);
    arm(x,blue,p.friendScale,{x:blue.x+90,y:blue.y-14},join,p.friendColor);
    arm(x,blue,p.friendScale,{x:blue.x-90,y:blue.y-14},{x:blue.x-125,y:blue.y-48+Math.sin(q*4)*7},p.friendColor);
  });
  paintObject(x,props,"robot",[green.x,green.y],x=>{
    bot(x,green.x,green.y,1.12,{...p,joinedArms:true},q,0);
    arm(x,green,p.robotScale,{x:green.x-90,y:green.y-14},join,p.body);
    arm(x,green,p.robotScale,{x:green.x+90,y:green.y-14},{x:814,y:414+bob},p.body);
  });
  circle(x,join.x-3,join.y,9,p.friendColor);circle(x,join.x+4,join.y+1,8,p.body);
  line(x,[[join.x-1,join.y-4],[join.x+3,join.y+5]],"#426c7566",1.5);
  paintObject(x,{...p,wateringVisible:true},"watering",[843,431],x=>{
    x.save();x.translate(843,431+bob);x.rotate(.16+Math.sin(q*2)*.025);
    x.shadowColor="#594d3930";x.shadowBlur=5;x.shadowOffsetY=5;
    x.beginPath();x.ellipse(-34,-8,19,22,0,0,tau);x.strokeStyle="#cf9462";x.lineWidth=8;x.stroke();
    rect(x,-34,-26,70,55,"#dbab79",8);rect(x,-30,-26,62,8,"#edc496",4);
    poly(x,[[30,-13],[81,7],[78,17],[29,5]],"#d29b68");
    x.save();x.translate(80,11);x.rotate(.36);rect(x,-3,-10,10,26,"#dfb580",3);x.restore();
    x.shadowColor="transparent";line(x,[[-20,-10],[-20,16]],"#f4d3a5",3);x.restore();
    // Source-time particles form an unmistakable fan of little sprinkles.
    for(let i=0;i<32;i++){
      const u=fract(q*1.15+i*.137),spread=(rand(i*19)-.5)*45;
      const a=mix(925,1000+spread,u),b=456+bob+u*35+u*u*25;
      x.save();x.globalAlpha=Math.sin(u*Math.PI)*.9;
      line(x,[[a-2,b-4],[a+1,b+1]],i%3?"#75afc4":"#b4dbe4",2.5);x.restore();
    }
    for(let i=0;i<3;i++){const u=fract(q*.9+i/3);x.save();x.globalAlpha=(1-u)*.5;x.beginPath();x.ellipse(993+i*12,516,4+u*13,1+u*3,0,0,tau);x.strokeStyle="#8db7c2";x.lineWidth=1.5;x.stroke();x.restore()}
  });
  for(let i=0;i<3;i++){const u=fract(q*.35+i/3);x.save();x.globalAlpha=Math.sin(u*Math.PI)*.65;heart(x,520+(i-1)*38,347-u*45,.55+i*.08,i%2?"#d7a56b":"#dca2aa");x.restore()}
  paintObject(x,p,"captions",[640,627],x=>{text(x,"A little joy grows together.",640,627,34,"#5d5a4c","center","Georgia");text(x,"A SMALL ACT OF CARE / 02",64,58,12,"#8d806b")});
}
function drawPaper(x, t, p) {
  if(t>=16&&p.wateringScene){
    if(p.wateringProgress<1)drawPaper(x,13,{...p,wateringScene:false});
    x.save();x.globalAlpha=ease(p.wateringProgress);drawHappyGarden(x,t,p);x.restore();return;
  }
  const q = Math.floor(t * p.fps) / p.fps;
  rect(x, 0, 0, W, H, "#eee9da");
  for (let k = 0; k < 22; k++) line(x, [[40, 140 + k * 23], [1230, 141 + k * 23]], "#a99e8610", 1);
  line(x, [[90, 520], [1190, 520]], "#b8b09d", 1);
  const grow = ease((q - 8) / 4);
paintObject(x,p,"sprout",[960,512],x=>{
  rect(x, 900, 510, 120, 9, "#c5ac82", 6);
  sprout(x, 960, 512, grow * 155, p, q);
  circle(x, 959, 501, 5, "#826443");

});
  const a = mix(310, 753, ease((q - 1) / 5)), hop = Math.abs(Math.sin(q * 6)) * 7 * p.bounce * (q < 6 ? 1 : 0.15);
paintObject(x,p,"robot",[a,458-hop],x=>{
  bot(x, a, 458 - hop, 1.12, p, q, q > 5 ? 1.05 : 0.2);
paintObject(x,p,"watering",[a+112,420],x=>{
  if (q > 6 && q < 10) {
    const canX = a + 112;
    rect(x, canX, 400, 59, 39, "#84a0a7", 7);
    line(x, [[canX + 57, 414], [canX + 90, 427]], "#84a0a7", 10);
    for (let i = 0; i < 9; i++) {
      const v = fract(q * 1.8 + i * 0.13);
      circle(x, canX + 93 + v * 25, 430 + v * 73, 2.5, "#7eabc0");
    }
  }

});
});

  // Website walkthrough: an added companion uses the same original paper-bot drawing.
  const arrival=p.friendProgress*ease((t-9.5)/1.4);
  if(arrival>0)paintObject(x,p,"friend",[330,458],x=>{
    const appear=out(arrival);x.save();x.globalAlpha=appear;
    bot(x,mix(230,330,appear),458-Math.sin(appear*Math.PI)*35,1.12*appear,{...p,body:p.friendColor??"#6d86cf"},q+.8,.2);x.restore();
  });
  grain(x, q, p.grain);
paintObject(x,p,"captions",[640,627],x=>{
  text(x, q < 5 ? p.caption1 : q < 10 ? p.caption2 : p.caption3, 640, 627, 34, "#5d5a4c", "center", "Georgia");
  text(x, p.overline, 64, 58, 12, "#8d806b");

});
  if (t > 14.7) {
    const u = ease((t - 14.7) / 1.3);
    if(p.wateringScene){
      // Turn the outgoing page all the way over, revealing the next scene
      // during the final 1.3 seconds. Both sides sample the same source clock.
      const edge=u<=.5?[[W*(1-2*u),0],[W,H*2*u]]:[[0,H*(2*u-1)],[W*2*(1-u),H]];
      const reveal=u<=.5?[edge[0],[W,0],edge[1]]:[[0,0],[W,0],[W,H],edge[1],edge[0]];
      x.save();x.beginPath();x.moveTo(...reveal[0]);
      for(const point of reveal.slice(1))x.lineTo(...point);
      x.closePath();x.clip();drawHappyGarden(x,t,p);x.restore();
      if(u>0&&u<1){
        line(x,edge,"#6f60451a",10);
        line(x,edge,"#e4dac5",3);
      }
    }else{
      poly(x, [[1280 * (1 - u), 0], [1280, 0], [1280, 720 * u]], "#d7cdb8");
      line(x, [[1280 * (1 - u), 0], [1280, 720 * u]], "#b8a888", 2);
    }
  }
}
export {
  drawPaper
};
