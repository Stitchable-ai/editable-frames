import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../artifacts/scene-editor/scene-studio.html');
await fs.access(file);const port=Number(process.env.PORT)||4189;
const server=http.createServer(async(req,res)=>{if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)||!['GET','HEAD'].includes(req.method)){res.writeHead(403).end();return;}if(!['/','/scene-studio.html'].includes(req.url)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});try{res.end(req.method==='HEAD'?undefined:await fs.readFile(file));}catch{res.destroy();}});
server.listen(port,'127.0.0.1',()=>console.log('Scene Studio: http://127.0.0.1:'+port));
