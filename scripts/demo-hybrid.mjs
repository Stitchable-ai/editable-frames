import fs from 'node:fs/promises';import path from 'node:path';import {run,ffmpeg} from './process.mjs';import {fileHash} from './media.mjs';
// A diagnostic plate with a known answer, not footage: a warm wall with a bright
// window (the light), a slate board drifting right (a surface to pin a screen
// to) and a dark bar sweeping across in front of everything (the occluder).
// Its matte, depth and track are generated from the same formulas, so tests can
// state where every pixel must land. Real plates get these from other tools.
export const HYBRID_DEMO={width:640,height:360,fps:24,seconds:3,board:{y:50,width:160,height:90,x:frame=>Math.floor(430+frame/2)},bar:{width:70,x:frame=>Math.floor(60+150*frame/24)},depth:{kind:'inverse',near:1.2,far:12,packing:'gray8'},codes:{wall:38,board:51,bar:230},colors:{wall:'0x9a5a32',window:'0xfff2d0',board:'0x3a3f4a',bar:'0x12324a'}};
export async function createHybridDemo(dir){
 const d=HYBRID_DEMO,size=`${d.width}x${d.height}`,common=`r=${d.fps}:d=${d.seconds}`,gray=v=>'0x'+v.toString(16).padStart(2,'0').repeat(3);
 await fs.mkdir(path.join(dir,'assets'),{recursive:true});
 const source=(color,s)=>`color=c=${color}:s=${s}:${common},format=gbrp`;
 // overlay truncates x to whole pixels in a planar RGB format, matching Math.floor above.
 const boardX=`x='430+t*${d.fps}/2'`,barX=`x='60+150*t'`;
 const graphs={
  'plate.mp4':`${source(d.colors.wall,size)}[w];${source(d.colors.window,'120x90')}[n];${source(d.colors.board,`${d.board.width}x${d.board.height}`)}[b];${source(d.colors.bar,`${d.bar.width}x${d.height}`)}[r];[w][n]overlay=x=40:y=30:format=gbrp[a];[a][b]overlay=${boardX}:y=${d.board.y}:format=gbrp[c];[c][r]overlay=${barX}:y=0:format=gbrp[v]`,
  'plate-matte.mp4':`${source('black',size)}[w];${source('white',`${d.bar.width}x${d.height}`)}[r];[w][r]overlay=${barX}:y=0:format=gbrp[v]`,
  'plate-depth.mp4':`${source(gray(d.codes.wall),size)}[w];${source(gray(d.codes.board),`${d.board.width}x${d.board.height}`)}[b];${source(gray(d.codes.bar),`${d.bar.width}x${d.height}`)}[r];[w][b]overlay=${boardX}:y=${d.board.y}:format=gbrp[c];[c][r]overlay=${barX}:y=0:format=gbrp[v]`,
 };
 for(const [name,graph]of Object.entries(graphs))await run(ffmpeg(),['-v','error','-n','-filter_complex',graph,'-map','[v]','-frames:v',String(d.fps*d.seconds),'-c:v','libx264','-qp','0','-pix_fmt','yuv444p',path.join(dir,'assets',name)]);
 const frames=Array.from({length:d.fps*d.seconds},(_,frame)=>{const x=d.board.x(frame),{y,width,height}=d.board;return {frame,quad:[[x,y],[x+width,y],[x+width,y+height],[x,y+height]],confidence:1}});
 await fs.writeFile(path.join(dir,'assets','board-track.json'),JSON.stringify({version:1,kind:'planar',width:d.width,height:d.height,frameRate:{num:d.fps,den:1},frames}));
 const sha=name=>fileHash(path.join(dir,'assets',name)),plate=await sha('plate.mp4'),derived=(role,extra={})=>({derived:{of:'plate',role,sourceSha256:plate,...extra}});
 await fs.writeFile(path.join(dir,'assets.json'),JSON.stringify({version:1,assets:{
  plate:{src:'assets/plate.mp4',type:'video',sha256:plate},
  'plate-matte':{src:'assets/plate-matte.mp4',type:'video',sha256:await sha('plate-matte.mp4'),...derived('matte')},
  'plate-depth':{src:'assets/plate-depth.mp4',type:'video',sha256:await sha('plate-depth.mp4'),...derived('depth',{encoding:d.depth})},
  'board-track':{src:'assets/board-track.json',type:'data',sha256:await sha('board-track.json'),...derived('track')},
 }},null,2));
}
