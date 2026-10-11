import {framePoint,pickCanvas} from './selection.mjs';
import {Studio,clone} from '../../packages/core/index.mjs';
import {editKeyframe,moveKeyframe,removeKeyframe,easeProgress} from '../../packages/core/animation.mjs';
import {templates,createStudy,sampled} from './scenes.mjs';
import {PhoneRenderer,drawScene} from './renderers.mjs';
import {binding} from './binding.mjs';
const $=id=>document.getElementById(id), canvas=$('canvas'), stores={trail:createStudy('trail',binding),orbit:createStudy('orbit',binding)};
let id='trail',studio=stores[id],frame=60,playing=false,selected='phone.hero',property='yaw',selectedTime=2,draft=null,hits=[],phone=null,loading=false,proposal=null,generation=0;
let selectionScope='object',pointerGesture=false;
// Each source binding retains its own study history; rebuilding never overwrites older edits.
const storage='editableframes.motion-desk.v1.'+binding;
try{const saved=JSON.parse(localStorage.getItem(storage)||'null');if(saved)for(const key of ['trail','orbit'])if(saved[key])stores[key]=Studio.restore(saved[key],templates,binding);studio=stores[id]}catch(e){notice('Saved study could not be restored: '+e.message)}
function clip(){return studio.doc.clips[0]}function node(){return studio.node(clip(),selected)}function schema(){return studio.schema(clip(),node())}function duration(){return Math.round(clip().duration/120000*30)}
function notice(s){$('toast').textContent=s;$('toast').style.display='block';clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('toast').style.display='none',4500)}
function persist(){try{localStorage.setItem(storage,JSON.stringify(Object.fromEntries(Object.entries(stores).map(([k,s])=>[k,s.serialize()]))))}catch{notice('Browser storage full. Use Save project to retain edits.')}}
function execute(command,actor='user',revision=studio.revision){try{studio.execute(command,revision,actor);draft=null;persist();refresh();return true}catch(e){draft=null;notice(e.message);render();return false}}
function state(){const v=sampled(studio,frame);if(draft)for(const [anchor,props]of Object.entries(draft))Object.assign(v[anchor],props);return v}
async function prepare(){if(id!=='trail'){loading=false;$('loading').hidden=true;return}const request=++generation;loading=true;$('loading').hidden=false;try{await new Promise(requestAnimationFrame);phone??=new PhoneRenderer();await phone.prepare(state()['phone.hero']);if(request===generation){loading=false;$('loading').hidden=true;render()}}catch(e){if(request===generation){loading=false;$('loading').innerHTML='Scene could not load. '+e.message;notice(e.message)}}}
function render(){if(loading)return;if(id==='trail'&&!phone?.cache.has(state()['phone.hero'].model)){prepare();return}const values=state();hits=drawScene(canvas,id,frame/30,values,phone,selected,false,true);paintDom(values);paintSelection(values);$('time').value=`${(frame/30).toFixed(2)} / ${duration()/30}s`;$('seek').value=frame;document.querySelectorAll('.playhead').forEach(e=>e.style.left=(frame/(duration()-1)*100)+'%');$('play').textContent=playing?'Ⅱ Pause':'▶ Play';
 document.querySelectorAll('[data-readout]').forEach(e=>{const p=e.dataset.readout;if(document.activeElement!==e)e.value=Number(state()[selected][p]).toFixed(schema()[p].step===1?0:2)});
 document.querySelectorAll('[data-slider]').forEach(e=>{if(document.activeElement!==e)e.value=state()[selected][e.dataset.slider]});
}
function setFrame(next,pause=true){frame=Math.max(0,Math.min(duration()-1,Math.round(next)));if(pause)playing=false;draft=null;render()}
function fieldEdit(p,value,commit){const s=schema()[p];if(s.type==='number'){value=Number(value);if(!Number.isFinite(value))return;value=Math.max(s.min,Math.min(s.max,value))}if(!commit){draft={[selected]:{[p]:value}};render();return}
 const animated=!!node().keys?.[p]?.length,auto=$('autokey').checked;
 if(s.type==='number'&&(auto||animated)){selectedTime=frame/30;property=p;execute(editKeyframe(studio,{clip:clip().id,anchor:selected,property:p,frame,value}))}
 else execute({type:'set',clip:clip().id,anchor:selected,property:p,value,label:`Set ${node().label} · ${s.label}`});
 if(p==='model')prepare();
}
function inspector(){const select=$('anchor');select.replaceChildren();select.add(new Option('Whole clip','__clip__'));for(const n of clip().nodes){const option=new Option(n.label,n.id);select.add(option)}select.value=selectionScope==='object'?selected:'__clip__';$('anchor-id').textContent=selectionScope==='object'?selected:clip().id;const fields=$('fields');fields.replaceChildren();if(selectionScope!=='object'){fields.innerHTML='<p class="empty-selection">Click a visible headline, device, screen or graphic to adjust that object and reveal its animation tracks. Selection alone creates no edit.</p>';$('static-note').textContent='';return}
 for(const [p,s]of Object.entries(schema())){const row=document.createElement('div');row.className='field';const label=document.createElement('label');label.textContent=s.label;const badge=document.createElement('span');badge.className='badge';badge.textContent=node().keys?.[p]?.length?'◆ '+node().keys[p].length+' keys':s.type==='number'?s.unit||'Value':'Static';label.append(badge);row.append(label);const value=state()[selected][p];
 if(s.type==='number'){const entry=document.createElement('div');entry.className='entry';const slider=document.createElement('input');slider.type='range';slider.min=s.min;slider.max=s.max;slider.step=s.step??.01;slider.value=value;slider.dataset.slider=p;slider.setAttribute('aria-label',s.label+' slider');const n=document.createElement('input');n.type='number';n.min=s.min;n.max=s.max;n.step=s.step??.01;n.value=value;n.dataset.readout=p;n.setAttribute('aria-label',s.label);slider.oninput=()=>fieldEdit(p,slider.value,false);slider.onchange=()=>fieldEdit(p,slider.value,true);n.oninput=()=>fieldEdit(p,n.value,false);n.onchange=()=>fieldEdit(p,n.value,true);n.onblur=()=>{if(draft?.[selected]?.[p]!==undefined)fieldEdit(p,n.value,true)};entry.append(slider,n);row.append(entry)}
 else if(s.type==='enum'){const e=document.createElement('select');e.setAttribute('aria-label',s.label);for(const val of s.values)e.add(new Option(val.replaceAll('-',' '),val));e.value=value;e.onchange=()=>fieldEdit(p,e.value,true);row.append(e)}
 else if(s.type==='color'){const e=document.createElement('input');e.type='color';e.value=value;e.setAttribute('aria-label',s.label);e.oninput=()=>fieldEdit(p,e.value,false);e.onchange=()=>fieldEdit(p,e.value,true);row.append(e)}
 else{const e=document.createElement('textarea');e.rows=2;e.value=value;e.setAttribute('aria-label',s.label);e.onchange=()=>fieldEdit(p,e.value,true);e.onblur=()=>{if(e.value!==state()[selected][p])fieldEdit(p,e.value,true)};row.append(e)}fields.append(row)}
 $('static-note').textContent=$('autokey').checked?'Auto-key: numeric controls insert a source-frame key. Text, models and colors remain static.':'Auto-key off: unanimated properties change their base value. Existing animated properties still edit a key, so the change stays visible.';
}
function selectedKey(){return node().keys?.[property]?.find(k=>Math.abs(k.time-selectedTime)<1e-8)}
function tracks(){const root=$('tracks');root.replaceChildren();$('track-context').textContent=selectionScope==='object'?node().label+' / object animation':'Whole clip / choose an object';if(selectionScope!=='object'&&$('selected-only').checked){root.innerHTML='<p class="empty-selection">Select an object in the video preview to reveal its properties here.</p>';return}const ruler=document.createElement('div');ruler.className='ruler';for(let i=0;i<=6;i++){const s=document.createElement('span');s.textContent=(i*duration()/30/6).toFixed(0)+'s';ruler.append(s)}root.append(ruler);
 for(const n of clip().nodes){if($('selected-only').checked&&n.id!==selected)continue;const group=document.createElement('div');group.className='group-name'+(selectionScope==='object'&&n.id===selected?' active':'');const groupButton=document.createElement('button');groupButton.textContent=n.label;groupButton.onclick=()=>selectObject(n.id);group.append(groupButton);root.append(group);const ns=studio.schema(clip(),n);
 for(const [p,s]of Object.entries(ns)){if(s.type!=='number')continue;const ks=n.keys?.[p]??[];if(!ks.length&&n.id!==selected)continue;const row=document.createElement('div');row.className='track'+(n.id===selected&&property===p?' selected':'');const label=document.createElement('button');label.textContent=s.label;label.onclick=()=>{selectionScope='object';selected=n.id;property=p;selectedTime=ks[0]?.time??frame/30;refresh()};const lane=document.createElement('div');lane.className='lane';lane.setAttribute('aria-label',n.label+' '+s.label+' track');const line=document.createElement('div');line.className='playhead';lane.append(line);lane.onpointerdown=e=>{if(e.target!==lane)return;const b=lane.getBoundingClientRect();setFrame((e.clientX-b.left)/b.width*(duration()-1))};
 for(const k of ks){const diamond=document.createElement('button');diamond.className='diamond'+(n.id===selected&&p===property&&k.time===selectedTime?' selected':'');diamond.style.left=Math.min(100,k.time*30/(duration()-1)*100)+'%';diamond.setAttribute('aria-label',`${n.label} ${s.label} key at ${k.time.toFixed(2)} seconds`);diamond.title=`${k.time.toFixed(2)}s · ${k.value}`;
 diamond.onpointerdown=e=>{e.preventDefault();e.stopPropagation();playing=false;selectionScope='object';selected=n.id;property=p;selectedTime=k.time;const start=e.clientX,b=lane.getBoundingClientRect(),revision=studio.revision;let target=Math.round(k.time*30),moved=false;diamond.setPointerCapture(e.pointerId);inspector();curve();render();diamond.onpointermove=ev=>{moved||=Math.abs(ev.clientX-start)>3;if(moved){target=Math.max(0,Math.min(duration()-1,Math.round((ev.clientX-b.left)/b.width*(duration()-1))));diamond.style.left=target/(duration()-1)*100+'%';setFrame(target)}};diamond.onpointerup=()=>{diamond.onpointermove=null;if(moved){try{const cmd=moveKeyframe(studio,{clip:clip().id,anchor:selected,property,fromTime:k.time,frame:target});if(execute(cmd,'user',revision))selectedTime=target/30}catch(error){notice(error.message)}}else setFrame(k.time*30);refresh()};diamond.onpointercancel=()=>refresh()};lane.append(diamond)}row.append(label,lane);root.append(row)}}
}
function curve(){const key=selectionScope==='object'?selectedKey():null,enabled=!!key;$('add').disabled=selectionScope!=='object'||!property;$('preset').disabled=selectionScope!=='object';$('delete').disabled=!enabled;for(const el of [$('key-frame'),$('key-value'),$('easing')])el.disabled=!enabled;
 $('key-label').textContent=enabled?`${node().label} / ${schema()[property].label}`:'Choose a track, then add a key';$('key-frame').max=duration()-1;$('key-frame').value=enabled?Math.round(key.time*30):'';$('key-value').value=enabled?key.value:'';$('easing').value=typeof key?.easing==='object'?'cubic-bezier':key?.easing??'smooth';drawCurve(key?.easing??'smooth',enabled);
}
function drawCurve(easing,enabled){const pts=typeof easing==='object'?easing.points:easing==='linear'?[0,0,1,1]:[.333,0,.667,1], path=Array.from({length:101},(_,i)=>`${i?'L':'M'} ${20+i*2.1} ${130-easeProgress(i/100,easing)*110}`).join(' ');
 $('curve').innerHTML=`<path d="M20 20V130H230 M20 75H230 M125 20V130" fill="none" stroke="#364535"/><path d="${path}" fill="none" stroke="#d3e8a5" stroke-width="2.5"/>`;
 if(enabled&&easing!=='hold'){const svg=$('curve'),NS='http://www.w3.org/2000/svg';for(let i=0;i<2;i++){const circle=document.createElementNS(NS,'circle');circle.setAttribute('cx',20+pts[i*2]*210);circle.setAttribute('cy',130-pts[i*2+1]*110);circle.setAttribute('r',6);circle.setAttribute('fill',i?'#91bcca':'#e6ac7e');circle.setAttribute('aria-label','Bezier handle '+(i+1));svg.append(circle);circle.onpointerdown=e=>{e.preventDefault();playing=false;const revision=studio.revision,points=[...pts];circle.setPointerCapture(e.pointerId);circle.onpointermove=ev=>{const b=svg.getBoundingClientRect();points[i*2]=Math.max(0,Math.min(1,((ev.clientX-b.left)*250/b.width-20)/210));points[i*2+1]=Math.max(0,Math.min(1,(130-(ev.clientY-b.top)*150/b.height)/110));circle.setAttribute('cx',20+points[i*2]*210);circle.setAttribute('cy',130-points[i*2+1]*110);svg.querySelectorAll('path')[1].setAttribute('d',Array.from({length:61},(_,j)=>`${j?'L':'M'} ${20+j*3.5} ${130-easeProgress(j/60,{type:'cubic-bezier',points})*110}`).join(' '));$('curve-values').textContent=points.map(n=>n.toFixed(2)).join(' · ')};circle.onpointerup=()=>{circle.onpointermove=null;changeEase({type:'cubic-bezier',points},revision)};circle.onpointercancel=()=>curve()}}}
 $('curve-values').textContent=easing==='hold'?'Hold until the next key':pts.map(n=>n.toFixed(2)).join(' · ');
}
function changeEase(easing,revision=studio.revision){const keys=clone(node().keys[property]);keys.find(k=>k.time===selectedTime).easing=easing;execute({type:'keyframes',clip:clip().id,anchor:selected,property,keys,label:'Change temporal curve'},'user',revision)}
function refresh(){inspector();tracks();curve();$('undo').disabled=!studio.canUndo;$('redo').disabled=!studio.canRedo;$('revision').textContent='REV '+studio.seq;$('scene-label').textContent=templates[id].title.toUpperCase();$('clip-title').textContent=templates[id].title;$('clip-strip').textContent=templates[id].title+' · '+duration()/30+'s · 30 fps · source-frame keys';$('seek').max=duration()-1;$('history').replaceChildren();studio.history.forEach((h,i)=>{const li=document.createElement('li');li.textContent=(h.actor==='model'?'Agent · ':'You · ')+h.label;if(i>=studio.cursor)li.className='future';$('history').append(li)});render()}
$('anchor').onchange=e=>selectObject(e.target.value==='__clip__'?null:e.target.value);
$('select-clip').onclick=()=>selectObject(null);$('select-parent').onclick=()=>selectObject('phone.hero');$('selected-only').onchange=tracks;
$('play').onclick=()=>{playing=!playing;render()};$('seek').oninput=e=>setFrame(e.target.value);$('prev').onclick=()=>setFrame(frame-1);$('next').onclick=()=>setFrame(frame+1);$('handles').onchange=render;$('autokey').onchange=inspector;
$('undo').onclick=()=>{studio.undo();draft=null;persist();refresh()};$('redo').onclick=()=>{studio.redo();draft=null;persist();refresh()};
$('add').onclick=()=>{selectedTime=frame/30;execute(editKeyframe(studio,{clip:clip().id,anchor:selected,property,frame,value:state()[selected][property]}))};
$('delete').onclick=()=>execute(removeKeyframe(studio,{clip:clip().id,anchor:selected,property,time:selectedTime}));
$('key-frame').onchange=e=>{try{const next=Number(e.target.value),cmd=moveKeyframe(studio,{clip:clip().id,anchor:selected,property,fromTime:selectedTime,frame:next});if(execute(cmd)){selectedTime=next/30;setFrame(next);refresh()}}catch(e){notice(e.message);curve()}};
$('key-value').onchange=e=>{if(!selectedKey())return;execute(editKeyframe(studio,{clip:clip().id,anchor:selected,property,frame:Math.round(selectedTime*30),value:Number(e.target.value),easing:selectedKey().easing}))};
$('key-frame').onblur=e=>{if(selectedKey()&&Number(e.target.value)!==Math.round(selectedTime*30))$('key-frame').onchange(e)};
$('key-value').onblur=e=>{if(selectedKey()&&Number(e.target.value)!==selectedKey().value)$('key-value').onchange(e)};
$('easing').onchange=e=>changeEase(e.target.value==='cubic-bezier'?{type:'cubic-bezier',points:[.22,.05,.25,1]}:e.target.value);
$('preset').onclick=()=>{const anchor=id==='trail'?'phone.hero':'planet.main',prop=id==='trail'?'yaw':'radius',values=id==='trail'?[-50,0,30,-20]:[45,130,90,120];const keys=values.map((value,i)=>({time:[0,2,7,duration()/30][i],value,easing:{type:'cubic-bezier',points:[.22,0,.2,1]}}));selectionScope='object';selected=anchor;property=prop;selectedTime=2;execute({type:'keyframes',clip:clip().id,anchor,property:prop,keys,label:id==='trail'?'Preset · Slow orbit':'Preset · Expanding world'})};
for(const key of ['trail','orbit'])$(key).onclick=()=>{generation++;id=key;studio=stores[id];frame=60;playing=false;draft=null;selectionScope='object';selected=id==='trail'?'phone.hero':'planet.main';property=id==='trail'?'yaw':'x';selectedTime=node().keys[property][1]?.time??0;for(const name of ['trail','orbit'])$(name).classList.toggle('active',name===id);proposal=null;$('proposal-code').textContent='Select “Preview agent edit” for a revision-checked example.';$('apply-proposal').disabled=true;loading=id==='trail';prepare();refresh()};
$('proposal').onclick=()=>{const anchor=id==='trail'?'screen.route':'planet.main',prop=id==='trail'?'progress':'radius',value=id==='trail'?.85:145;proposal={baseRevision:studio.revision,command:editKeyframe(studio,{clip:clip().id,anchor,property:prop,frame:120,value}),actor:'model'};$('proposal-code').textContent=JSON.stringify(proposal,null,2);$('apply-proposal').disabled=false};
$('apply-proposal').onclick=()=>{if(!proposal)return;if(execute(proposal.command,'model',proposal.baseRevision)){selectionScope='object';selected=proposal.command.anchor;property=proposal.command.property;selectedTime=4;setFrame(120);refresh();notice('Agent proposal applied as one reversible edit')}$('apply-proposal').disabled=true};
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
$('save').onclick=()=>download(new Blob([studio.serialize()],{type:'application/json'}),id+'.editableframes.json');$('open').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>32*1024*1024)throw Error('Project exceeds 32 MiB');const next=Studio.restore(await f.text(),templates,binding);if(next.doc.clips.length!==1||!['trail','orbit'].includes(next.doc.clips[0].template))throw Error('Open one of this study’s single-clip projects');const key=next.doc.clips[0].template;stores[key]=next;$(key).click();persist();notice('Project and undo history restored')}catch(err){notice(err.message)}e.target.value=''};
$('snapshot').onclick=()=>{drawScene(canvas,id,frame/30,state(),phone,selected,false);canvas.toBlob(b=>download(b,id+'-frame-'+frame+'.png'));render()};
// Selection is editor state, not a document mutation or a nested undo stack.
function selectObject(anchor){
 draft=null;selectionScope=anchor?'object':'clip';
 if(anchor){selected=anchor;property=Object.keys(node().keys??{})[0]??Object.keys(schema()).find(k=>schema()[k].type==='number');selectedTime=node().keys?.[property]?.[0]?.time??frame/30;}
 refresh();$('tracks').scrollTop=0;
}
function paintDom(values){
 const viewport=$('viewport'),stage=viewport.parentElement,w=Math.min(stage.clientWidth,stage.clientHeight*1280/720),scale=w/1280;
 viewport.style.width=w+'px';viewport.style.height=w*720/1280+'px';$('dom-scene').style.transform=`scale(${scale})`;
 const title=values['title.hero'],el=$('scene-title');el.style.left=title.x+'px';el.style.top=(title.y-(id==='trail'?62:57))+'px';el.style.opacity=title.opacity;el.style.visibility=title.opacity>.01?'visible':'hidden';el.style.color=id==='trail'?'#243d32':'#e9ebd7';el.style.fontSize=(id==='trail'?67:61)+'px';el.style.lineHeight=(id==='trail'?75:71)+'px';
 const headline=el.querySelector('.headline-lines');if(headline.textContent!==title.text)headline.textContent=title.text;
 const sub=el.querySelector('.scene-subtitle');sub.textContent=id==='trail'?'An everyday escape, beautifully mapped.':'Every object has its own story. And its own timeline.';sub.style.color=id==='trail'?'#687768':'#a5b39d';sub.style.fontSize=(id==='trail'?20:18)+'px';
 const card=$('scene-card'),p=values['callout.route'];card.hidden=!p;if(p){card.style.left=p.x+'px';card.style.top=p.y+'px';card.style.opacity=p.opacity;card.style.visibility=p.opacity>.01?'visible':'hidden';card.querySelector('.card-label').textContent=p.label;}
}
function paintSelection(values){
 const box=$('selection-box'),viewport=$('viewport'),r=viewport.getBoundingClientRect();let bounds=null;
 $('selected-label').textContent=selectionScope==='object'?node().label:'Whole clip';$('select-parent').hidden=selectionScope!=='object'||selected!=='screen.route';
 if(selectionScope==='object'&&$('handles').checked){
  const el=selected==='title.hero'?$('scene-title'):selected==='callout.route'?$('scene-card'):null;
  if(el&&!el.hidden&&getComputedStyle(el).visibility!=='hidden'){const b=el.getBoundingClientRect();bounds={x:b.left-r.left,y:b.top-r.top,w:b.width,h:b.height};}
  else if(!el){const h=id==='trail'?phone?.bounds(selected,values):hits.find(h=>h.id===selected);if(h)bounds={x:h.x*r.width/1280,y:h.y*r.height/720,w:h.w*r.width/1280,h:h.h*r.height/720};}
 }
 box.hidden=!bounds;if(bounds){Object.assign(box.style,{left:bounds.x+'px',top:bounds.y+'px',width:bounds.w+'px',height:bounds.h+'px'});box.firstElementChild.style.top=bounds.y>24?'-22px':'0';box.firstElementChild.textContent=node().label+' · '+(selected==='screen.route'?'3D screen':selected==='phone.hero'?'3D object':selected==='title.hero'||selected==='callout.route'?'HTML element':'Canvas object');}
}
new ResizeObserver(()=>{if(!loading)render()}).observe($('viewport').parentElement);
for(const el of [$('scene-title'),$('scene-card')])el.onclick=e=>{if(e.detail===0)selectObject(el.dataset.efAnchor)};
$('viewport').onpointerdown=e=>{
 if(loading||e.button!==0)return;
 const viewport=$('viewport'),b=viewport.getBoundingClientRect(),point=framePoint(e.clientX,e.clientY,b);if(!point)return;
 const element=e.target.closest('[data-ef-anchor]'),hit=element?{id:element.dataset.efAnchor}:id==='trail'?phone.pick(point.x,point.y,state()):pickCanvas(hits,point.x,point.y);
 if(!hit){selectObject(null);return}selectObject(hit.id);
 // A click keeps playback running. Only an actual position drag pauses for authoring.
 if(!['title.hero','callout.route','planet.main','planet.moon'].includes(selected))return;
 const anchor=selected,revision=studio.revision;let moved=false,initial=null,startFrame=frame;
 viewport.setPointerCapture(e.pointerId);pointerGesture=true;
 viewport.onpointermove=ev=>{
  const dx=(ev.clientX-e.clientX)*1280/b.width,dy=(ev.clientY-e.clientY)*720/b.height;
  if(!moved&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)<4)return;
  if(!moved){initial=state()[anchor];startFrame=frame;playing=false;moved=true;}
  draft={[anchor]:{x:Math.max(schema().x.min,Math.min(schema().x.max,initial.x+dx)),y:Math.max(schema().y.min,Math.min(schema().y.max,initial.y+dy))}};render();
 };
 const finish=commit=>{viewport.onpointermove=null;viewport.onpointerup=null;viewport.onpointercancel=null;pointerGesture=false;if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);
  if(commit&&moved&&draft){const commands=['x','y'].map(p=>($('autokey').checked||node().keys?.[p]?.length)?editKeyframe(studio,{clip:clip().id,anchor,property:p,frame:startFrame,value:draft[anchor][p]}):{type:'set',clip:clip().id,anchor,property:p,value:draft[anchor][p]});execute({type:'batch',commands,label:'Move '+node().label},'user',revision);}
  draft=null;refresh();};
 viewport.onpointerup=()=>finish(true);viewport.onpointercancel=()=>finish(false);
};
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(pointerGesture){if(e.key==='Escape'){e.preventDefault();$('viewport').onpointercancel?.()}else if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();notice('Finish the drag before undoing.')}return;}if(e.key==='Escape'){selectObject(null);return;}if(e.code==='Space'&&e.target.closest?.('[data-ef-anchor]')){e.preventDefault();selectObject(e.target.closest('[data-ef-anchor]').dataset.efAnchor);return;}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click()}else if(e.code==='Space'){e.preventDefault();$('play').click()}});
let last=performance.now(),remainder=0;function tick(now){const delta=Math.min(.2,(now-last)/1000);last=now;if(playing&&!loading){remainder+=delta*30;const step=Math.floor(remainder);remainder-=step;if(step){frame+=step;if(frame>=duration()){if($('loop').checked)frame%=duration();else{frame=duration()-1;playing=false}}render()}}requestAnimationFrame(tick)}
refresh();prepare();requestAnimationFrame(tick);
