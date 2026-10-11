// Loopback-only study server; no writes, credentials or external services.
import './build.mjs';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{try{if(req.headers.host!==`127.0.0.1:${server.address().port}`||!['GET','HEAD'].includes(req.method)){res.writeHead(403);res.end();return}const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const relative=pathname==='/'?'examples/ae-controls/index.html':pathname.startsWith('/devices/')?'website/public'+pathname:pathname.slice(1);const target=path.resolve(root,relative);const allowed=target.startsWith(path.join(root,'examples/ae-controls')+path.sep)||target.startsWith(path.join(root,'website/public/devices')+path.sep);if(!allowed){res.writeHead(404);res.end();return}const real=await fs.realpath(target);if(real!==target){res.writeHead(404);res.end();return}const bytes=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes)}catch{res.writeHead(404);res.end('Not found')}});
server.listen(Number(process.env.PORT)||0,'127.0.0.1',()=>console.log('Motion desk: http://127.0.0.1:'+server.address().port));
