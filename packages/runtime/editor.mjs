import {normalizeObjectHierarchy,selectableObject,parentObjectId} from '../core/objects.mjs';
import {createRendererCompositor} from './renderer-compositor.mjs';import {ptsIndex} from '../media/ports.mjs';
import {Studio,clone,HZ} from '../core/index.mjs';import {createMediaHost} from '../media/browser.mjs';import {createAudioPlayback} from '../media/playback.mjs';import {createCompositor} from './compositor.mjs';
export async function mount({templates,createRenderer,scene,binding,initial,mediaCatalog={},assetIds=[],persistence=null,capture=false}){
 const $=s=>document.querySelector(s);let canvas=$('#screen');
 if(scene){const stage=document.createElement('div');stage.id='screen';canvas.replaceWith(stage);canvas=stage;if(capture){stage.style.background='transparent';stage.style.borderRadius='0';document.documentElement.style.background='transparent';document.body.style.background='transparent';}}
 let studio;
 if(initial)studio=Studio.restore(initial,templates,binding);else{studio=new Studio(templates,{binding});studio.doc.clips=Object.keys(templates).map(id=>studio.make(id));studio.check(studio.doc);studio.base=clone(studio.doc)}
 let selected=studio.doc.clips[0]?.id,time=0,playing=false,last=0,timeline=false,revision=persistence?.revision,operations=Promise.resolve(),disposed=false;
 const host=createMediaHost(mediaCatalog),services={};
 if(assetIds.length)services.asset=id=>{if(!assetIds.includes(id))throw Error('Undeclared asset: '+id);return '/__ef/source/'+encodeURIComponent(id);};
 if(Object.keys(mediaCatalog).length)services.mediaFrame=(id,time)=>{const a=mediaCatalog[id];if(!a||a.type==='audio')throw Error('Missing visual asset: '+id);const index=ptsIndex(a.pts,time);return index<0?undefined:a.url+String(index+1).padStart(6,'0')+'.png';};
 const renderer=scene?createRendererCompositor(canvas,{scene,templates,services,capture}):createCompositor(canvas,{templates,createRenderer,host}),audio=createAudioPlayback(mediaCatalog);let selection=null,selectionVersion=0;
 if(scene)canvas.addEventListener('pointerdown',async event=>{
  const ticket=++selectionVersion;
  try{const next=await renderer.pick(event.target,event.clientX,event.clientY);
   if(disposed||ticket!==selectionVersion||next===undefined)return;
   selection=next;if(selection)selected=selection.clip;refresh();
   if(selection){const label=[...$('#controls').querySelectorAll('label')].find(label=>label.dataset.anchor===selection.anchor&&(!selection.property||label.dataset.property===selection.property));label?.querySelector('input,textarea,select')?.focus();}
  }catch(error){if(!disposed&&ticket===selectionVersion)fail(error);}
 });
 const clip=()=>studio.clip(selected),spec=()=>templates[clip().template],duration=()=>timeline?Math.max(0,...studio.doc.clips.map(c=>(c.start+c.duration)/HZ)):clip().duration/HZ;
 const objectRows=()=>normalizeObjectHierarchy(spec().controls?.objects??[],(spec().controls?.fields??[]).map(f=>f.anchor??'root'));
 function selectObject(anchor){if(anchor!==null&&!selectableObject(objectRows(),anchor))return false;selectionVersion++;selection=anchor===null?null:{clip:selected,anchor};refresh();return true;}
 const selectParent=()=>selectObject(selection?parentObjectId(objectRows(),selection.anchor):null);
 const keySelection=event=>{if(scene&&selection&&(event.key==='Escape'||event.altKey&&event.key==='ArrowUp')){event.preventDefault();selectParent();}};
 if(scene)document.addEventListener('keydown',keySelection);
 const fail=e=>{$('#status').textContent=e.message;playing=false;audio.stop();$('#play').textContent='Play'};
 function draw(){selectionVersion++;const hadSelection=selection!==null;selection=null;if(hadSelection)refresh();const at=time,mode=timeline,id=selected;return renderer.render(studio,at,{selected:id,timeline:mode,playing})}
 function context(){return {...studio.capabilities(selected),baseRevision:persistence?revision:studio.revision,...(scene?{selection,objects:objectRows(),capture:{kind:'dom',selector:'#screen'}}:{})}}
 function refresh(){
  if(!studio.doc.clips.some(c=>c.id===selected))selected=studio.doc.clips[0]?.id;
  if(!selected)throw Error('Empty project: add a clip with the CLI before preview');
  const c=clip();$('#title').textContent=timeline?'Project timeline':spec().title;$('#seek').max=duration();$('#controls').replaceChildren();$('#undo').disabled=!studio.canUndo;$('#redo').disabled=!studio.canRedo;
  $('#clips').replaceChildren();for(const item of studio.doc.clips){const b=document.createElement('button');b.textContent=item.name;b.onclick=()=>{selected=item.id;time=0;playing=false;audio.stop();refresh();draw().catch(fail)};$('#clips').append(b)}
  if(scene){const rows=objectRows();if(rows.length){const nav=document.createElement('nav');nav.setAttribute('aria-label','Scene objects');const whole=document.createElement('button');whole.textContent='Whole clip';whole.onclick=()=>selectObject(null);nav.append(whole);const back=document.createElement('button');back.textContent='Parent';back.disabled=!selection;back.onclick=selectParent;nav.append(back);
    for(const object of rows){const button=document.createElement('button');button.textContent=object.label+(object.disabledReason?' ('+object.disabledReason+')':'');button.style.cssText=`display:block;margin-left:${object.depth*12}px`;button.disabled=!!object.disabledReason;button.setAttribute('aria-pressed',String(selection?.anchor===object.id));button.onclick=()=>selectObject(object.id);nav.append(button);}$('#controls').append(nav);}}
  const groups=c.panel?.groups??c.nodes.map(n=>({title:n.label,fields:Object.entries(studio.schema(c,n)).map(([property,s])=>({id:n.id+'.'+property,anchor:n.id,property,label:s.label??property}))}));
  for(const g of groups){const heading=document.createElement('h3');heading.textContent=g.title;$('#controls').append(heading);for(const f of g.fields){
   if(scene&&selection&&((f.kind==='preset'&&f.operations.some(o=>o.anchor!==selection.anchor))||f.kind!=='preset'&&f.anchor!==selection.anchor))continue;
   if(f.when&&studio.controlValue(c,studio.node(c,f.when.anchor),f.when.property)!==f.when.equals)continue;
   if(f.kind==='preset'){const b=document.createElement('button');b.textContent=f.label;b.onclick=()=>edit({type:'batch',label:f.label,commands:f.operations.map(o=>({type:'set',clip:selected,...o}))}).catch(fail);$('#controls').append(b);continue}
   const macro=f.kind==='macro',node=macro?null:studio.node(c,f.anchor),s=macro?{type:'number',min:f.min,max:f.max}:studio.schema(c,node)[f.property];
   const label=document.createElement('label');label.textContent=f.label;label.dataset.anchor=f.anchor??'';label.dataset.property=f.property??'';const jsonInput=['json','vec3'].includes(s.type);const input=document.createElement(s.type==='enum'?'select':jsonInput?'textarea':'input');input.setAttribute('aria-label',f.label);
   if(s.type==='enum')for(const v of s.values)input.add(new Option(v,v));else if(!jsonInput)input.type=s.type==='number'?'range':s.type==='boolean'?'checkbox':s.type==='color'?'color':'text';
   if(s.type==='number'){input.min=s.min??0;input.max=s.max??100;input.step=s.integer?1:s.step??.01}
   const shown=macro?f.min:studio.controlValue(c,node,f.property);input.value=jsonInput?JSON.stringify(shown):shown??'';input.checked=!!shown;
   input.onchange=()=>{try{let value=s.type==='number'?Number(input.value):s.type==='boolean'?input.checked:jsonInput?JSON.parse(input.value):input.value;
    const cmd=macro?{type:'batch',label:f.label,commands:f.mappings.map(m=>({type:'set',clip:selected,anchor:m.anchor,property:m.property,value:m.from+(m.to-m.from)*(value-f.min)/(f.max-f.min)}))}:{type:'set',clip:selected,anchor:f.anchor,property:f.property,value};edit(cmd).catch(fail);
   }catch(e){fail(e)}};label.append(input);$('#controls').append(label)
  }}
  $('#history').textContent=studio.history.map((e,i)=>(i<studio.cursor?'✓ ':'↪ ')+e.label).join('\n');$('#status').textContent=(persistence?'Saved · ':'Local · ')+(revision??studio.revision);
 }
 async function remote(action,command,baseRevision,actor){const response=await fetch('/__ef/command',{method:'POST',headers:{'Content-Type':'application/json','X-EditableFrame-Token':persistence.token},body:JSON.stringify({action,command,baseRevision,actor})});const result=await response.json();if(!response.ok)throw Error(result.error);studio=Studio.restore(result.raw,templates,binding);revision=result.revision}
 function change(action,command,baseRevision,actor='user'){
  const task=operations.catch(()=>{}).then(async()=>{playing=false;audio.stop();if(persistence)await remote(action,command,baseRevision??revision,actor);else if(action==='command')studio.execute(command,baseRevision??studio.revision,actor);else studio[action]();refresh();await draw();return context()});operations=task;return task;
 }
 function edit(cmd,baseRevision,actor='user'){return change('command',cmd,baseRevision,actor)}
 const download=(name,text)=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
 $('#save').textContent=persistence?'Download snapshot':'Save project';$('#save').onclick=()=>download('project.json',studio.serialize());$('#context').onclick=()=>download('edit-context.json',JSON.stringify(context(),null,2));
 $('#undo').onclick=()=>change('undo').catch(fail);$('#redo').onclick=()=>change('redo').catch(fail);$('#seek').oninput=e=>{time=Number(e.target.value);playing=false;audio.stop();draw().catch(fail)};
 $('#play').onclick=()=>{audio.resume().catch(fail);playing=!playing;last=performance.now();$('#play').textContent=playing?'Pause':'Play';if(!playing)audio.stop()};
 if($('#timeline'))$('#timeline').onchange=e=>{timeline=e.target.checked;time=0;playing=false;audio.stop();refresh();draw().catch(fail)};
 if($('#reload')){$('#reload').hidden=!persistence;$('#reload').onclick=async()=>{try{const r=await fetch('/__ef/state',{headers:{'X-EditableFrame-Token':persistence.token}}),p=await r.json();if(!r.ok)throw Error(p.error);studio=Studio.restore(p.raw,templates,binding);revision=p.revision;refresh();await draw()}catch(e){fail(e)}}}
 $('#open').disabled=!!persistence;$('#open').title=persistence?'Disk-backed preview: use a separate project directory for another snapshot':'';
 $('#open').onchange=async e=>{try{studio=Studio.restore(await e.target.files[0].text(),templates,binding);refresh();await draw()}catch(e){fail(e)}};
 $('#apply').onclick=()=>{try{const p=JSON.parse($('#proposal').value);edit(p.command,p.baseRevision,'model').catch(fail)}catch(e){fail(e)}};
 async function loop(now){if(disposed)return;if(playing){try{time=(time+Math.max(0,Math.min(.1,(now-last)/1000)))%duration();$('#seek').value=time;await draw();let s=studio,t=time;if(!timeline){s=Object.create(studio);s.doc={...studio.doc,clips:[{...clip(),start:0}]}}if(playing)await audio.update(s,t,true);else audio.stop()}catch(e){fail(e)}}last=now;requestAnimationFrame(loop)}requestAnimationFrame(loop);
 refresh();await draw();window.editableframes=window.editableframe={ready:true,get studio(){return studio},get selected(){return selected},templates,binding,context,selectObject,selectParent,select(id){selected=studio.doc.clips.find(c=>c.template===id||c.id===id)?.id??selected;time=0;playing=false;audio.stop();refresh();return draw()},async seek(t,options={}){playing=false;audio.stop();time=t;timeline=options.timeline??timeline;await draw()},edit,undo:()=>change('undo'),redo:()=>change('redo'),serialize:()=>studio.serialize(),captureTarget:scene?{kind:'dom',selector:'#screen'}:{kind:'canvas',selector:'#screen'},png:()=>{if(scene)throw Error('This renderer uses DOM-root capture; screenshot captureTarget after seek');return canvas.toDataURL('image/png')} ,stats:()=>({...host.stats(),audio:audio.stats()}),async dispose(){disposed=true;document.removeEventListener('keydown',keySelection);await audio.dispose();await renderer.dispose()}};
}
