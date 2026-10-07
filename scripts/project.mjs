import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash,randomUUID} from 'node:crypto';import {build} from 'esbuild';
import {root} from './build.mjs';import {Studio,clone} from '../packages/core/index.mjs';import {serve,sendFile} from './server.mjs';import {readAssets,prepareMedia,fileHash} from './media.mjs';
export const hash=s=>createHash('sha256').update(s).digest('hex');
export async function definition(dir){
 dir=await fs.realpath(dir);const file=path.join(dir,'clip.mjs');
 const bundled=await build({entryPoints:[file],bundle:true,format:'esm',platform:'browser',write:false,minify:true,nodePaths:[path.join(root,'node_modules')]});
 const assets=await readAssets(dir);const assetIdentity=Object.fromEntries(Object.entries(assets).map(([id,{file,...rest}])=>[id,rest]));
 const runtimeFiles=['packages/core/index.mjs','packages/core/host.mjs','packages/runtime/editor.mjs','packages/runtime/compositor.mjs','packages/media/ports.mjs','packages/media/browser.mjs','packages/media/audio-plan.mjs','packages/media/playback.mjs','scripts/render.mjs','scripts/audio.mjs','package-lock.json'];
 const runtimeIdentity=Object.fromEntries(await Promise.all(runtimeFiles.map(async file=>[file,hash(await fs.readFile(path.join(root,file)))])));
 const binding=hash(Buffer.concat([Buffer.from(bundled.outputFiles[0].contents),Buffer.from(JSON.stringify(runtimeIdentity)),Buffer.from(JSON.stringify(assetIdentity))]));
 const {template}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].contents).toString('base64'));
 if(!template?.id||!Number.isFinite(template.duration)||template.duration<=0)throw Error('clip.mjs must export a valid template');
 return {dir,file,template,templates:{[template.id]:template},binding,assets,assetIdentity,runtimeIdentity,bundledSource:bundled.outputFiles[0].text};
}
export async function init(dir,{template='canvas'}={}){
 await fs.mkdir(dir,{recursive:true});if((await fs.readdir(dir)).length)throw Error('init needs an empty directory');
 if(!['canvas','media'].includes(template))throw Error('Unknown starter');
 await fs.copyFile(path.join(root,'templates',template,'clip.mjs'),path.join(dir,'clip.mjs'));
 if(template==='media'){const {createDemoMedia}=await import('./demo-media.mjs');await createDemoMedia(dir);}
 const d=await definition(dir),s=new Studio(d.templates,{binding:d.binding});s.doc.clips=[s.make(d.template.id)];s.doc.width=d.template.width??1280;s.doc.height=d.template.height??720;s.doc.fps={num:24,den:1};s.check(s.doc);s.base=clone(s.doc);
 await snapshotSource(d);await fs.writeFile(path.join(dir,'project.json'),s.serialize());return {directory:path.resolve(dir),template:d.template.id};
}
export async function readProject(dir){const d=await definition(dir),raw=await fs.readFile(path.join(d.dir,'project.json'),'utf8');return {...d,raw,revision:hash(raw),studio:Studio.restore(raw,d.templates,d.binding)};}
export async function mutate(dir,operation){
 const lock=path.join(dir,'.editableframe-edit.lock');const fd=await fs.open(lock,'wx').catch(()=>{throw Error('Another edit is active; retry after it finishes')});
 try{const d=await readProject(dir);await operation(d);const raw=d.studio.serialize(),dest=path.join(d.dir,'project.json'),temp=dest+'.'+randomUUID()+'.tmp';try{await fs.writeFile(temp,raw);await fs.rename(temp,dest)}finally{await fs.rm(temp,{force:true})}return {revision:hash(raw),history:d.studio.history.length,cursor:d.studio.cursor};}finally{await fd.close();await fs.rm(lock,{force:true})}
}
export async function preview(dir,{port=8791,editable=true,signal,snapshot}={}){
 const d=snapshot??await readProject(dir),media=await prepareMedia(d.assets,{signal});
 const token=randomUUID();let h;
 try{
 const entry=`import {mount} from ${JSON.stringify(path.join(root,'packages/runtime/editor.mjs'))};import {template,createRenderer} from ${JSON.stringify(d.file)};const loaded=await fetch('/__ef/initial').then(r=>r.json());await mount({templates:{[template.id]:template},createRenderer,binding:${JSON.stringify(d.binding)},initial:loaded.raw,mediaCatalog:${JSON.stringify(media.catalog)},persistence:${editable?'Object.assign('+JSON.stringify({token})+', {revision:loaded.revision})':'null'}});`;
 // Render the frozen bundled source, not a file an agent can change mid-export.
 const plugin={name:'frozen-clip',setup(b){b.onLoad({filter:/clip\.mjs$/},async args=>args.path===d.file?{contents:d.bundledSource,loader:'js',resolveDir:d.dir}:null)}};
 const result=await build({stdin:{contents:entry,resolveDir:d.dir,sourcefile:'editableframe-entry.mjs'},bundle:true,format:'esm',write:false,minify:true,plugins:[plugin],nodePaths:[path.join(root,'node_modules')]});
 h=await serve(d.dir,{port,extra:{'/':await fs.readFile(path.join(root,'packages/runtime/editor.html'),'utf8'),'/project.json':d.raw,'/bundle.js':result.outputFiles[0].text},onRequest:async(req,res,url)=>{
  if(url.pathname==='/__ef/initial'&&req.method==='GET'){const current=editable?await readProject(d.dir):d;if(current.binding!==d.binding)throw Error('Source changed; restart preview');res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({raw:current.raw,revision:current.revision}));return true;}
  if(url.pathname.startsWith('/__ef/audio/')){const id=url.pathname.slice('/__ef/audio/'.length);if(!['GET','HEAD'].includes(req.method)||!Object.hasOwn(media.assets,id)||!media.assets[id].previewAudio)throw Error('Unknown audio');await sendFile(req,res,media.assets[id].previewAudio);return true;}
  if(url.pathname.startsWith('/__ef/source/')){const id=url.pathname.slice('/__ef/source/'.length);if(!['GET','HEAD'].includes(req.method)||!Object.hasOwn(media.assets,id))throw Error('Unknown media');await sendFile(req,res,media.assets[id].file);return true;}
  if(url.pathname.startsWith('/__ef/media/')){
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return true}
   const m=/^\/__ef\/media\/([a-zA-Z0-9_-]+)\/(\d{6}\.png)$/.exec(url.pathname);if(!m||!media.catalog[m[1]])throw Error('Unknown frame');await sendFile(req,res,path.join(media.dir,m[1],m[2]));return true;
  }
  if(!url.pathname.startsWith('/__ef/'))return false;
  if(!editable){res.writeHead(403);res.end('Read-only export');return true}
  const origin='http://'+req.headers.host;
  if(req.headers['x-editableframe-token']!==token||(req.headers.origin&&req.headers.origin!==origin)){res.writeHead(403);res.end('Unauthorized');return true}
  try{
   let next;
   if(url.pathname==='/__ef/state'&&req.method==='GET')next=await readProject(d.dir);
   else if(url.pathname==='/__ef/command'&&req.method==='POST'){
    let data='',size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw Error('Proposal too large');data+=chunk}
    const proposal=JSON.parse(data);await mutate(d.dir,current=>{
     if(current.binding!==d.binding)throw Error('Source changed: restart preview');
     if(current.revision!==proposal.baseRevision)throw Error('Stale revision: reload project');
     if(proposal.action==='undo'||proposal.action==='redo')current.studio[proposal.action]();
     else if(proposal.action==='command')current.studio.execute(proposal.command,current.studio.revision,proposal.actor??'user');
     else throw Error('Unknown edit action');
    });next=await readProject(d.dir);
   }else{res.writeHead(405);res.end();return true}
   if(next.binding!==d.binding)throw Error('Source changed: restart preview');
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({raw:next.raw,revision:next.revision}));
  }catch(e){res.writeHead(409,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}))}return true;
 }});
 return {...h,snapshot:d,media,close:async()=>{await h.close();await media.close()}};
 }catch(e){await h?.close();await media.close();throw e}
}

export async function snapshotSource(d){
 const dest=path.join(d.dir,'.editableframe','sources',d.binding);await fs.mkdir(dest,{recursive:true});await fs.writeFile(path.join(dest,'clip.bundle.mjs'),d.bundledSource);await fs.copyFile(d.file,path.join(dest,'clip.mjs'));await fs.copyFile(path.join(root,'packages/core/index.mjs'),path.join(dest,'core.mjs'));await fs.writeFile(path.join(dest,'runtime.json'),JSON.stringify(d.runtimeIdentity,null,2));await fs.writeFile(path.join(dest,'assets.json'),JSON.stringify({version:1,assets:d.assetIdentity},null,2));
}
export async function rebind(dir,{reset=false}={}){
 const lock=path.join(dir,'.editableframe-edit.lock'),fd=await fs.open(lock,'wx');
 try{const d=await definition(dir),file=path.join(d.dir,'project.json'),raw=await fs.readFile(file,'utf8'),p=JSON.parse(raw);
 let s;if(reset){s=new Studio(d.templates,{binding:d.binding});s.doc.clips=[s.make(d.template.id)];s.base=clone(s.doc);}else{s=Studio.restore(raw,d.templates,p.binding);s.binding=d.binding;}
 const archive=path.join(d.dir,'.editableframe','revisions');await fs.mkdir(archive,{recursive:true});const backup=path.join(archive,hash(raw)+'.json');await fs.writeFile(backup,raw);await snapshotSource(d);
 const temp=file+'.'+randomUUID()+'.tmp';try{await fs.writeFile(temp,s.serialize());await fs.rename(temp,file)}finally{await fs.rm(temp,{force:true})}
 return {binding:d.binding,backup,reset};
 }finally{await fd.close();await fs.rm(lock,{force:true})}
}

export async function importAsset(dir,id,source,{type}={}){
 if(['__proto__','constructor','prototype'].includes(id)||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error('Invalid asset ID');
 dir=await fs.realpath(dir);const lock=path.join(dir,'.editableframe-edit.lock'),fd=await fs.open(lock,'wx');
 try{
  const d=await readProject(dir);if(Object.hasOwn(d.assets,id))throw Error('Asset IDs are immutable; use a new ID and swap the port');
  const ext=path.extname(source).toLowerCase();type??=(['.png','.jpg','.jpeg','.webp'].includes(ext)?'image':['.wav','.mp3','.flac','.m4a'].includes(ext)?'audio':'video');
  if(!['image','audio','video'].includes(type)||!/^\.[a-z0-9]{1,8}$/.test(ext))throw Error('Invalid asset type/extension');
  const sha256=await fileHash(source),src='assets/'+sha256+ext;await fs.mkdir(path.join(dir,'assets'),{recursive:true});await fs.copyFile(source,path.join(dir,src));
  const manifest={version:1,assets:{...d.assetIdentity,[id]:{src,type,sha256}}};
  const file=path.join(dir,'assets.json'),tmp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify(manifest,null,2));await fs.rename(tmp,file);
  // Rebinding is separate and explicit; the old project/source snapshot is retained.
  return {id,sha256,next:'Run rebind to accept the added asset; set a media port to its ID.'};
 }finally{await fd.close();await fs.rm(lock,{force:true})}
}
