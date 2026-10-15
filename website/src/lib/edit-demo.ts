type Point = {x:number;y:number};
type DemoOptions = {
 origin: HTMLElement;
 palette: HTMLElement;
 slider: HTMLInputElement;
 treeSlider: HTMLInputElement;
 signal: AbortSignal;
 onPalette: () => void;
 onPreviewHeight: (value:number|null) => void;
 onCommitHeight: (value:number) => void;
 onPreviewTrees: (value:number|null) => void;
 onCommitTrees: (value:number) => void;
};
const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const center=(element:HTMLElement):Point=>{const r=element.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
const cursorSvg='<svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4V28L12 22L17 33L22 30L17 20H28L6 4Z" fill="#284cd7" stroke="#fffefa" stroke-width="2.5" stroke-linejoin="round"/></svg><span class="edit-demo-click-ring"></span><span class="edit-demo-cursor-label">Quick edit</span>';

/** A disposable pointer illustration. Edits use the playground's validated commands. */
export async function runCastleEditDemo({origin,palette,slider,treeSlider,signal,onPalette,onPreviewHeight,onCommitHeight,onPreviewTrees,onCommitTrees}:DemoOptions){
 if(signal.aborted)throw new DOMException('Demo interrupted','AbortError');
 const cursor=document.createElement('div');cursor.className='edit-demo-cursor';cursor.setAttribute('aria-hidden','true');cursor.innerHTML=cursorSvg;document.body.append(cursor);
 // Remove the illustration synchronously on takeover, before promise cleanup runs.
 const clearVisuals=()=>{for(const element of [palette,slider,treeSlider])delete element.dataset.demoFocus;cursor.remove()};
 signal.addEventListener('abort',clearVisuals,{once:true});
 const originPoint=center(origin.querySelector<HTMLElement>('[data-edit-demo-icon]')??origin);
 let position={x:originPoint.x,y:Math.max(24,originPoint.y)};
 const place=(p:Point)=>{position=p;cursor.dataset.side=p.x>window.innerWidth-120?'left':'right';cursor.style.transform=`translate3d(${p.x-6}px,${p.y-4}px,0)`};place(position);
 const ensureActive=()=>{if(signal.aborted)throw new DOMException('Demo interrupted','AbortError')};
 function tween(duration:number,update:(progress:number)=>void){
  return new Promise<void>((resolve,reject)=>{
   let frame=0,start:number|null=null;
   const cleanup=()=>{cancelAnimationFrame(frame);signal.removeEventListener('abort',abort)};
   const abort=()=>{cleanup();reject(new DOMException('Demo interrupted','AbortError'))};
   const tick=(now:number)=>{if(signal.aborted){abort();return}start??=now;const progress=Math.min(1,(now-start)/duration);try{update(progress)}catch(e){cleanup();reject(e);return}if(progress===1){cleanup();resolve()}else frame=requestAnimationFrame(tick)};
   signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return}frame=requestAnimationFrame(tick);
  });
 }
 const wait=(ms:number)=>tween(ms,()=>{});
 const move=async(target:()=>Point,duration:number)=>{const from=position;await tween(duration,t=>{const to=target(),p=ease(t);place({x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p})})};
 const click=async()=>{cursor.dataset.pressed='true';await wait(220);cursor.dataset.pressed='false'};
 const thumb=(input:HTMLInputElement,value:number)=>{const r=input.getBoundingClientRect(),p=(value-Number(input.min))/(Number(input.max)-Number(input.min));return{x:r.left+8+p*(r.width-16),y:r.top+r.height/2}};
 try{
  await tween(220,t=>{cursor.style.opacity=String(t)});
  await move(()=>center(palette),1050);ensureActive();palette.dataset.demoFocus='true';await click();ensureActive();onPalette();
  await wait(750);delete palette.dataset.demoFocus;
  const from=Number(slider.value),min=Number(slider.min),max=Number(slider.max),step=Number(slider.step)||.05;
  const destination=from+(from<(min+max)/2?1:-1)*(max-min)*.28;
  const to=Number(Math.min(max,Math.max(min,min+Math.round((destination-min)/step)*step)).toFixed(6));
  await move(()=>thumb(slider,from),850);slider.dataset.demoFocus='true';cursor.dataset.pressed='true';
  await tween(1650,t=>{const value=from+(to-from)*ease(t);onPreviewHeight(Number((min+Math.round((value-min)/step)*step).toFixed(6)));place(thumb(slider,value))});
  ensureActive();onCommitHeight(to);onPreviewHeight(null);cursor.dataset.pressed='false';await wait(650);delete slider.dataset.demoFocus;
  // Third action: drag the tree count to make a denser forest.
  const treeMin=Number(treeSlider.min),treeMax=Number(treeSlider.max),treeStep=Number(treeSlider.step)||1;
  // A replay at the upper limit starts from a temporary lower count so the gesture remains visible.
  const treeFrom=Number(treeSlider.value)>=treeMax?Math.max(treeMin,treeMax-18):Number(treeSlider.value);
  const treeTo=Math.min(treeMax,treeFrom+18);
  if(treeFrom!==Number(treeSlider.value))onPreviewTrees(treeFrom);
  await move(()=>thumb(treeSlider,treeFrom),650);treeSlider.dataset.demoFocus='true';cursor.dataset.pressed='true';
  await tween(1400,t=>{const value=treeFrom+(treeTo-treeFrom)*ease(t);onPreviewTrees(Number((treeMin+Math.round((value-treeMin)/treeStep)*treeStep).toFixed(6)));place(thumb(treeSlider,value))});
  ensureActive();onCommitTrees(treeTo);onPreviewTrees(null);cursor.dataset.pressed='false';await wait(500);delete treeSlider.dataset.demoFocus;
  const finish=position;await tween(400,t=>{cursor.style.opacity=String(1-t);place({x:finish.x+18*ease(t),y:finish.y-10*ease(t)})});
 }finally{signal.removeEventListener('abort',clearVisuals);onPreviewHeight(null);onPreviewTrees(null);clearVisuals()}
}
