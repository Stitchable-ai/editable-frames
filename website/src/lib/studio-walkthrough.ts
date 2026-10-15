type Step='properties'|'annotate'|'comment'|'chat'|'editing'|'annotate-water'|'comment-water'|'chat-water'|'watering-edit'|'playback'|'complete';
type Edit='friend'|'watering';
type Walkthrough={
 root:HTMLElement;signal:AbortSignal;
 onStep:(step:Step)=>void;onSelect:()=>void;onColor:()=>void;
 onScale:(scale:number,commit?:boolean)=>void;
 onAnnotate:()=>void;onOpenNote:(object:'robot'|'friend')=>void;onNoteText:(text:string)=>void;onAttach:(object:'robot'|'friend'|'gardeners',text:string)=>void;
 onRegion:(box:{x:number;y:number;width:number;height:number})=>void;onOpenRegion:()=>void;
 onChatText:(text:string)=>void;onSend:(edit:Edit)=>void;onProgress:(progress:number,edit:Edit)=>void;onComplete:(edit:Edit)=>void;
 onWateringStart:()=>void;onRestart:()=>void;
};
const ease=(t:number)=>t*t*(3-2*t);

/** Presentation-only pointer; the callbacks also back the demo's real controls. */
export async function runStudioWalkthrough(o:Walkthrough){
 const {root,signal}=o,cursor=root.querySelector<HTMLElement>('[data-studio-pointer]')!;
 const find=(selector:string)=>{const el=root.querySelector<HTMLElement>(selector);if(!el)throw Error('Demo target unavailable');return el};
 const point=(el:HTMLElement)=>{const r=el.getBoundingClientRect(),box=root.getBoundingClientRect();return{x:r.left-box.left+r.width/2,y:r.top-box.top+r.height/2}};
 let position=point(find('[data-studio-origin]'));
 const place=(p:typeof position)=>{position=p;cursor.style.transform=`translate3d(${p.x-5}px,${p.y-4}px,0)`};
 const clear=()=>{cursor.hidden=true;cursor.style.opacity='0';for(const el of root.querySelectorAll<HTMLElement>('[data-studio-focus]'))delete el.dataset.studioFocus};
 function tween(ms:number,paint:(t:number)=>void){return new Promise<void>((resolve,reject)=>{
  let frame=0,start:number|undefined;
  const abort=()=>{cancelAnimationFrame(frame);signal.removeEventListener('abort',abort);reject(new DOMException('Walkthrough stopped','AbortError'))};
  const tick=(now:number)=>{if(signal.aborted){abort();return}start??=now;const t=Math.min(1,(now-start)/ms);try{paint(t)}catch(e){signal.removeEventListener('abort',abort);reject(e);return}if(t===1){signal.removeEventListener('abort',abort);resolve()}else frame=requestAnimationFrame(tick)};
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return}frame=requestAnimationFrame(tick);
 })}
 const wait=(ms:number)=>tween(ms,()=>{});
 const paint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 const move=(selector:string,ms=500)=>{const from=position;return tween(ms,t=>{const to=point(find(selector)),u=ease(t);place({x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u})})};
 const click=async()=>{cursor.dataset.pressed='true';await wait(140);cursor.dataset.pressed='false'};
 const type=async(text:string,write:(text:string)=>void)=>{let last=-1;await tween(text.length*42,t=>{const n=Math.floor(t*text.length);if(n!==last){write(text.slice(0,n));last=n}})};
 signal.addEventListener('abort',clear,{once:true});
 try{
  if(signal.aborted)throw new DOMException('Walkthrough stopped','AbortError');
  cursor.hidden=false;cursor.dataset.mode='arrow';place(position);await tween(180,t=>{cursor.style.opacity=String(t)});
  o.onStep('properties');await move('[data-studio-object="robot"]',650);await click();o.onSelect();await paint();
  await move('[data-studio-swatch="mint"]');await click();o.onColor();await wait(400);
  const slider=find('[data-studio-scale]') as HTMLInputElement,from=Number(slider.value),to=1.12;
  const thumb=(value:number)=>{const r=slider.getBoundingClientRect(),box=root.getBoundingClientRect(),ratio=(value-Number(slider.min))/(Number(slider.max)-Number(slider.min));return{x:r.left-box.left+7+ratio*(r.width-14),y:r.top-box.top+r.height/2}};
  const start=position;await tween(450,t=>{const target=thumb(from),u=ease(t);place({x:start.x+(target.x-start.x)*u,y:start.y+(target.y-start.y)*u})});
  slider.dataset.studioFocus='true';cursor.dataset.pressed='true';await tween(900,t=>{const n=from+(to-from)*ease(t);o.onScale(n);place(thumb(n))});o.onScale(to,true);cursor.dataset.pressed='false';delete slider.dataset.studioFocus;await wait(300);
  o.onStep('annotate');await move('[data-studio-annotate]',500);await click();o.onAnnotate();cursor.dataset.mode='bubble';await wait(180);
  await move('[data-studio-object="robot"]',650);await click();o.onOpenNote('robot');o.onStep('comment');await paint();
  await move('[data-studio-note-input]',300);await type('Add a blue friend.',o.onNoteText);await wait(280);
  await move('[data-studio-attach]',350);await click();o.onAttach('robot','Add a blue friend.');o.onStep('chat');cursor.dataset.mode='arrow';await paint();
  await move('[data-studio-chat-input]',600);await type('Make that change.',o.onChatText);await wait(250);
  await move('[data-studio-send]',350);await click();o.onSend('friend');o.onStep('editing');cursor.hidden=true;
  await tween(1400,t=>o.onProgress(ease(t),'friend'));o.onComplete('friend');await wait(850);
  // Drag a region around both moving characters, then annotate that region.
  cursor.hidden=false;o.onStep('annotate-water');await move('[data-studio-annotate]',550);await click();o.onAnnotate();cursor.dataset.mode='region';await wait(180);
  const stage=find('[data-studio-stage]'),a=find('[data-studio-object="robot"]').getBoundingClientRect(),b=find('[data-studio-object="friend"]').getBoundingClientRect(),s=stage.getBoundingClientRect();
  const box={x:Math.max(0,(Math.min(a.left,b.left)-s.left-8)/s.width),y:Math.max(0,(Math.min(a.top,b.top)-s.top-8)/s.height),width:0,height:0};
  const right=Math.min(1,(Math.max(a.right,b.right)-s.left+8)/s.width),bottom=Math.min(1,(Math.max(a.bottom,b.bottom)-s.top+8)/s.height),regionFrom=position;
  const regionPoint=(x:number,y:number)=>{const r=stage.getBoundingClientRect(),p=root.getBoundingClientRect();return{x:r.left-p.left+x*r.width,y:r.top-p.top+y*r.height}};
  await tween(650,t=>{const target=regionPoint(box.x,box.y),u=ease(t);place({x:regionFrom.x+(target.x-regionFrom.x)*u,y:regionFrom.y+(target.y-regionFrom.y)*u})});
  cursor.dataset.pressed='true';await tween(1100,t=>{const u=ease(t),region={...box,width:(right-box.x)*u,height:(bottom-box.y)*u};o.onRegion(region);place(regionPoint(region.x+region.width,region.y+region.height))});cursor.dataset.pressed='false';o.onOpenRegion();cursor.dataset.mode='bubble';o.onStep('comment-water');await paint();
  const waterNote='Hold hands and happily sprinkle water on the flower.';
  await move('[data-studio-note-input]',300);await type(waterNote,o.onNoteText);await wait(400);
  await move('[data-studio-attach]',350);await click();o.onAttach('gardeners',waterNote);o.onStep('chat-water');cursor.dataset.mode='arrow';await paint();
  await move('[data-studio-chat-input]',600);await type('Make this the next scene.',o.onChatText);await wait(250);
  await move('[data-studio-send]',350);await click();o.onSend('watering');o.onStep('watering-edit');cursor.hidden=true;o.onWateringStart();
  await tween(1700,t=>o.onProgress(ease(t),'watering'));o.onComplete('watering');await wait(2600);
  // Restart playback, rather than replaying the app walkthrough.
  cursor.hidden=false;o.onStep('playback');await move('[data-studio-restart]',850);await click();o.onRestart();await wait(450);
  await tween(220,t=>{cursor.style.opacity=String(1-t)});o.onStep('complete');
 }finally{signal.removeEventListener('abort',clear);clear()}
}
