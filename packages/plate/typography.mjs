/** Seekable motion design. Curves are analytic functions of explicit seconds;
 * no animation depends on the previously requested frame. */
const clamp=x=>Math.max(0,Math.min(1,x));
export function typeMotion(seconds,{start=0,duration=.65,hold=2,exit=.35,index=0,stagger=.06,effect='rise',distance=60,turn=0,pathRadius=80}={}) {
  if(![seconds,start,duration,hold,exit,index,stagger,distance,turn,pathRadius].every(Number.isFinite)||duration<=0||hold<0||exit<0||index<0||stagger<0)throw Error('Invalid typography timing');
  if(!['rise','wipe','spring','orbit','extrude'].includes(effect))throw Error('Unknown typography treatment');
  const t=seconds-start-index*stagger,p=clamp(t/duration),q=exit===0?(t>duration+hold?1:0):clamp((t-duration-hold)/exit),ease=1-(1-p)**3;
  let x=0,y=(1-ease)*distance,scale=1,rotate=(1-ease)*turn;
  if(effect==='spring'){scale=p===1?1:1-Math.exp(-7*p)*Math.cos(11*p);y=(1-p)*distance*Math.exp(-3*p);}
  if(effect==='orbit'){const angle=(1-ease)*Math.PI; x=Math.sin(angle)*pathRadius;y=(1-Math.cos(angle))*pathRadius;rotate+=(1-ease)*90;}
  if(effect==='wipe')y=0;
  return {opacity:t<0?0:(effect==='wipe'?1:ease)*(1-q),x,y:y-q*distance,scale,rotate,clip:effect==='wipe'?`inset(0 ${(1-ease)*100}% 0 0)`:undefined,extrusion:effect==='extrude'?8*(1-q):0};
}

export function createKineticText({root,text='',effect='rise',split='words',document:doc=root.ownerDocument}) {
  const group=doc.createElement('span');group.style.cssText='display:inline;white-space:pre-wrap';root.append(group);
  let signature='',nodes=[];
  return {
    render(seconds,{text:next=text,effect:treatment=effect,split:mode=split,...options}={}){
      const key=JSON.stringify([next,mode]);
      if(key!==signature){signature=key;group.replaceChildren();const units=mode==='characters'?(typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(String(next))].map(s=>s.segment):Array.from(String(next))):String(next).split(/(\s+)/);nodes=units.map(unit=>{const node=doc.createElement('span');node.textContent=unit;node.style.cssText='display:inline-block;white-space:pre;transform-origin:50% 70%';group.append(node);return node;});}
      let index=0;
      for(const node of nodes){const blank=/^\s*$/.test(node.textContent),m=typeMotion(seconds,{...options,effect:treatment,index:blank?Math.max(0,index-1):index++});Object.assign(node.style,{opacity:String(m.opacity),transform:`translate(${m.x}px,${m.y}px) rotate(${m.rotate}deg) scale(${m.scale})`,clipPath:m.clip??'none',textShadow:m.extrusion?Array.from({length:Math.round(m.extrusion)},(_,i)=>`${i+1}px ${i+1}px 0 rgba(0,0,0,.32)`).join(','):'none'});}
    },
    bounds(){return nodes.filter(n=>n.textContent.trim()).map((n,i)=>({id:String(i),x:n.offsetLeft,y:n.offsetTop,width:n.offsetWidth,height:n.offsetHeight}));},
    dispose(){group.remove();},
  };
}
