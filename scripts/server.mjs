import http from 'node:http';import fs from 'node:fs/promises';import {createReadStream} from 'node:fs';import path from 'node:path';
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4','.wav':'audio/wav','.mov':'video/quicktime'};
export async function sendFile(req,res,file){
 const stat=await fs.stat(file);if(!stat.isFile())throw Error('Not a file');let start=0,end=stat.size-1,status=200;
 if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return}
  if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}
  if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return}status=206;
 }
 res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':Math.max(0,end-start+1),'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===206?{'Content-Range':`bytes ${start}-${end}/${stat.size}`}:{})});
 if(req.method==='HEAD'||!stat.size){res.end();return}const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
export async function serve(root,{port=8790,extra={},onRequest}={}){
 const base=await fs.realpath(root);
 const server=http.createServer(async(req,res)=>{
  try{
   // Refuse DNS rebinding and foreign-host requests even though we bind loopback.
   const address=server.address();if(req.headers.host!==`127.0.0.1:${address.port}`){res.writeHead(403);res.end('Invalid host');return}
   const url=new URL(req.url,'http://'+req.headers.host);
   if(onRequest&&await onRequest(req,res,url))return;
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
   const pathname=decodeURIComponent(url.pathname);
   if(Object.hasOwn(extra,pathname)){const body=extra[pathname];res.writeHead(200,{'Content-Type':(pathname==='/'?'text/html':mime[path.extname(pathname)])||'text/plain','Cache-Control':'no-store'});res.end(req.method==='HEAD'?'':body);return}
   if(pathname.split('/').some(p=>p.startsWith('.')||p==='node_modules'))throw Error('Hidden path');
   let file=path.resolve(base,'.'+pathname);const stat=await fs.stat(file);if(stat.isDirectory())file=path.join(file,'index.html');file=await fs.realpath(file);
   if(!file.startsWith(base+path.sep))throw Error('Outside root');await sendFile(req,res,file);
  }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found')}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)});
 return {server,url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>{server.close(r);server.closeIdleConnections?.()})};
}
