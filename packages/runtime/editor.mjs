import {Studio,clone,HZ} from '../core/index.mjs';import {createMediaHost} from '../media/browser.mjs';import {createAudioPlayback} from '../media/playback.mjs';import {createCompositor} from './compositor.mjs';
export async function mount({templates,createRenderer,binding,initial,mediaCatalog={},persistence=null}){
 const $=s=>document.querySelector(s),canvas=$('#screen');let studio;
 if(initial)studio=Studio.restore(initial,templates,binding);else{studio=new Studio(templates,{binding});studio.doc.clips=Object.keys(templates).map(id=>studio.make(id));studio.check(studio.doc);studio.base=clone(studio.doc)}
 let selected=studio.doc.clips[0]?.id,time=0,playing=false,last=0,timeline=false,revision=persistence?.revision,operations=Promise.resolve(),disposed=false;
 const host=createMediaHost(mediaCatalog),renderer=createCompositor(canvas,{templates,createRenderer,host}),audio=createAudioPlayback(mediaCatalog);
 const clip=()=>studio.clip(selected),spec=()=>templates[clip().template],duration=()=>timeline?Math.max(0,...studio.doc.clips.map(c=>(c.start+c.duration)/HZ)):clip().duration/HZ;
 const fail=e=>{$('#status').textContent=e.message;playing=false;audio.stop();$('#play').textContent='Play'};
 function draw(){const at=time,mode=timeline,id=selected;return renderer.render(studio,at,{selected:id,timeline:mode})}
 function context(){return {...studio.capabilities(selected),baseRevision:persistence?revision:studio.revision}}
 function refresh(){
  if(!studio.doc.clips.some(c=>c.id===selected))selected=studio.doc.clips[0]?.id;
  if(!selected)throw Error('Empty project: add a clip with the CLI before preview');
  const c=clip();$('#title').textContent=timeline?'Project timeline':spec().title;$('#seek').max=duration();$('#controls').replaceChildren();$('#undo').disabled=!studio.canUndo;$('#redo').disabled=!studio.canRedo;
  $('#clips').replaceChildren();for(const item of studio.doc.clips){const b=document.createElement('button');b.textContent=item.name;b.onclick=()=>{selected=item.id;time=0;playing=false;audio.stop();refresh();draw().catch(fail)};$('#clips').append(b)}
  const groups=c.panel?.groups??c.nodes.map(n=>({title:n.label,fields:Object.entries(studio.schema(c,n)).map(([property,s])=>({id:n.id+'.'+property,anchor:n.id,property,label:s.label??property}))}));
  for(const g of groups){const heading=document.createElement('h3');heading.textContent=g.title;$('#controls').append(heading);for(const f of g.fields){
   if(f.when&&studio.node(c,f.when.anchor).props[f.when.property]!==f.when.equals)continue;
   if(f.kind==='preset'){const b=document.createElement('button');b.textContent=f.label;b.onclick=()=>edit({type:'batch',label:f.label,commands:f.operations.map(o=>({type:'set',clip:selected,...o}))}).catch(fail);$('#controls').append(b);continue}
   const macro=f.kind==='macro',node=macro?null:studio.node(c,f.anchor),s=macro?{type:'number',min:f.min,max:f.max}:studio.schema(c,node)[f.property];
   const label=document.createElement('label');label.textContent=f.label;const input=document.createElement(s.type==='enum'?'select':s.type==='json'?'textarea':'input');input.setAttribute('aria-label',f.label);
   if(s.type==='enum')for(const v of s.values)input.add(new Option(v,v));else if(s.type!=='json')input.type=s.type==='number'?'range':s.type==='boolean'?'checkbox':s.type==='color'?'color':'text';
   if(s.type==='number'){input.min=s.min??0;input.max=s.max??100;input.step=s.integer?1:s.step??.01}
   input.value=macro?f.min:s.type==='json'?JSON.stringify(node.props[f.property]):node.props[f.property];input.checked=!!node?.props[f.property];
   input.onchange=()=>{try{let value=s.type==='number'?Number(input.value):s.type==='boolean'?input.checked:s.type==='json'?JSON.parse(input.value):input.value;
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
 refresh();await draw();window.editableframe={ready:true,get studio(){return studio},get selected(){return selected},templates,binding,context,select(id){selected=studio.doc.clips.find(c=>c.template===id||c.id===id)?.id??selected;time=0;playing=false;audio.stop();refresh();return draw()},async seek(t,options={}){playing=false;audio.stop();time=t;timeline=options.timeline??timeline;await draw()},edit,undo:()=>change('undo'),redo:()=>change('redo'),serialize:()=>studio.serialize(),png:()=>canvas.toDataURL('image/png'),stats:()=>({...host.stats(),audio:audio.stats()}),async dispose(){disposed=true;await audio.dispose();await renderer.dispose()}};
}
