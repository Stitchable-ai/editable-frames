// Real pixels through the real CLI: a code-rendered product inside footage.
// The plate is synthetic so every assertion below has a known answer.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {init,readProject,mutate,rebind,importAsset} from '../scripts/project.mjs';
import {render} from '../scripts/render.mjs';import {run,ffmpeg} from '../scripts/process.mjs';
import {HYBRID_DEMO as demo} from '../scripts/demo-hybrid.mjs';
import {idFromColor,encodeDepth} from '../packages/plate/index.mjs';

const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ef-hybrid-')),dir=path.join(tmp,'film'),checks=[];
const W=demo.width,H=demo.height,hex=value=>[1,3,5].map(i=>parseInt(value.replace('0x','#').slice(i,i+2),16));
const WALL=hex(demo.colors.wall),BAR=hex(demo.colors.bar),BOARD=hex(demo.colors.board),SCREEN=[11,18,32];
async function pixels(file){const data=await run(ffmpeg(),['-v','error','-i',file,'-pix_fmt','rgba','-f','rawvideo','-'],{maxOutput:64*1024**2});assert.equal(data.length,W*H*4);return {at:(x,y)=>[...data.subarray((y*W+x)*4,(y*W+x)*4+4)],data};}
const close=(actual,expected,tolerance=8)=>expected.every((v,i)=>Math.abs(actual[i]-v)<=tolerance);
const frameFile=(folder,frame)=>path.join(folder,String(frame+1).padStart(6,'0')+'.png');
const mean=(image,x0,y0,x1,y1)=>{const sum=[0,0,0];let n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const p=image.at(x,y);for(let c=0;c<3;c++)sum[c]+=p[c];n++}return sum.map(v=>v/n)};
try{
 await init(dir,{template:'hybrid'});
 const project=await readProject(dir);assert.deepEqual(project.scene.passes,['clay','depth','normal','id','matte']);assert.deepEqual(project.studio.doc.fps,{num:24,den:1});

 // --- Beauty: occlusion, layering and tracking --------------------------------
 const beauty=path.join(tmp,'beauty');await render(dir,beauty,{format:'png',frames:40});
 const early=6,late=35,barAt=frame=>demo.bar.x(frame),boardAt=frame=>demo.board.x(frame);
 const a=await pixels(frameFile(beauty,early)),b=await pixels(frameFile(beauty,late));
 // --- An MP4 keeps the levels the browser drew ---------------------------------
 // Decoded with the matrix and range it declares, an MP4 of the starter must give the PNG frame's values: the
 // footage in a hybrid shot is not re-graded on the way out. Converting to the BT.709 camera curve made it
 // 10-13 levels darker (128 -> 115), which no player undoes.
 const movie=path.join(tmp,'movie.mp4');await render(dir,movie,{format:'mp4',frames:early+1});
 const decoded=await run(ffmpeg(),['-v','error','-i',movie,'-vf',`select=eq(n\\,${early}),scale=in_range=tv:out_range=pc:in_color_matrix=bt709,format=rgba`,'-frames:v','1','-f','rawvideo','-'],{maxOutput:64*1024**2});
 assert.equal(decoded.length,W*H*4);
 const shown={at:(x,y)=>[...decoded.subarray((y*W+x)*4,(y*W+x)*4+4)]};
 const drawn=mean(a,0,0,W,H),encoded=mean(shown,0,0,W,H);
 assert.ok(drawn.every((v,i)=>Math.abs(encoded[i]-v)<=2),`MP4 levels ${encoded.map(Math.round)} differ from the drawn frame's ${drawn.map(Math.round)}`);
 checks.push('An MP4 export keeps the levels of the drawn frames');
 // An opaque scene's frames have no alpha channel; the MOV (ProRes 4444) path extracted alpha from them and failed.
 const prores=path.join(tmp,'movie.mov');await render(dir,prores,{format:'mov',frames:early+1});
 const proresFrame=await run(ffmpeg(),['-v','error','-i',prores,'-vf',`select=eq(n\\,${early}),scale=in_range=tv:out_range=pc:in_color_matrix=bt709,format=rgba`,'-frames:v','1','-f','rawvideo','-'],{maxOutput:64*1024**2});
 assert.equal(proresFrame.length,W*H*4);
 const proresShown={at:(x,y)=>[...proresFrame.subarray((y*W+x)*4,(y*W+x)*4+4)]},proresLevels=mean(proresShown,0,0,W,H);
 assert.ok(drawn.every((v,i)=>Math.abs(proresLevels[i]-v)<=2),`MOV levels ${proresLevels.map(Math.round)} differ from the drawn frame's ${drawn.map(Math.round)}`);
 assert.equal(proresShown.at(W>>1,H>>1)[3],255,'an opaque scene stays opaque');
 checks.push('An opaque scene exports to MOV, at the levels of the drawn frames');
 // Frame 6: the bar is far left; the product is in the clear.
 assert.ok(barAt(early)+demo.bar.width<250);
 // Label samples sit on rows 112-140: plain label above its text. The text is laid out with the platform's font, and
 // white text lit by a warm plate has the plate's own colour, so a sample that lands on a letter proves nothing.
 const can=a.at(300,125);assert.ok(!close(can,WALL,30)&&!close(can,BAR,30),'the product is drawn over the wall');assert.ok(can[0]>can[2]*2,'and it is the red can');
 // Frame 35: the bar stands in front of the product's centre, and ONLY the plate's depth says so.
 assert.ok(barAt(late)<320&&barAt(late)+demo.bar.width>320);
 assert.ok(close(b.at(320,170),BAR),'the plate foreground hides the product where it is nearer');
 const beside=b.at(barAt(late)+demo.bar.width+12,125);assert.ok(!close(beside,WALL,30)&&!close(beside,BAR,30),'the product is still visible beside the foreground');
 checks.push('A 3D object is hidden by plate foreground and shown over plate background, from the depth map alone');

 // The headline is DOM text; the cut-out layer puts the plate subject back over it.
 const white=(image,x0,x1)=>{let n=0;for(let y=296;y<340;y++)for(let x=x0;x<x1;x++){const p=image.at(x,y);if(p[0]>235&&p[1]>235&&p[2]>235)n++}return n};
 assert.ok(white(a,200,440)>400,'the headline is drawn');
 assert.equal(white(b,barAt(late)+2,barAt(late)+demo.bar.width-2),0,'no headline pixel survives in front of the bar');
 assert.ok(white(b,200,barAt(late))>50&&white(b,barAt(late)+demo.bar.width,440)>50,'and it continues on both sides');
 checks.push('DOM text passes behind the matted plate subject');

 // The screen is a DOM element pinned to the tracked board, which moves 14px between these frames.
 assert.equal(boardAt(late)-boardAt(early),14);
 for(const [image,frame]of [[a,early],[b,late]]){const x=boardAt(frame);
  assert.ok(close(image.at(x+4,demo.board.y+4),SCREEN),'screen covers the board corner');assert.ok(close(image.at(x+demo.board.width-4,demo.board.y+demo.board.height-4),SCREEN),'and its far corner');
  assert.ok(close(image.at(x-4,demo.board.y+4),WALL),'and stops at the board edge');assert.ok(!close(image.at(x+4,demo.board.y+4),BOARD,6));}
 checks.push('A DOM screen stays corner-pinned to a tracked surface as it moves');

 // --- Lighting from the plate --------------------------------------------------
 // The plate's only bright area is a window on the left, so the can's left side is the lit one.
 const lit=mean(a,262,112,300,140),shade=mean(a,345,112,380,140);assert.ok(lit[0]>shade[0]*1.2,'the side facing the bright window is brighter');
 // The panorama's back half is the plate mirrored, so the side turned away still sees footage, not black.
 assert.ok(shade[0]>90,`the shaded side reflects the footage behind the camera, not an empty half (${Math.round(shade[0])})`);
 await mutate(dir,d=>d.studio.execute({type:'set',clip:d.studio.doc.clips[0].id,anchor:'light',property:'fromPlate',value:false},d.studio.revision,'model'));
 const neutralDir=path.join(tmp,'neutral');await render(dir,neutralDir,{format:'png',frames:early+1});const n=await pixels(frameFile(neutralDir,early));
 const warm=rgb=>rgb[0]/(rgb[2]+1),plateLit=mean(a,262,112,380,140),studioLit=mean(n,262,112,380,140);
 assert.ok(Math.abs(plateLit[0]-studioLit[0])+Math.abs(plateLit[1]-studioLit[1])+Math.abs(plateLit[2]-studioLit[2])>12,'turning plate lighting off changes the product');
 assert.ok(warm(plateLit)>warm(studioLit),'under the warm plate the product reads warmer than under neutral studio light');
 assert.ok(close(n.at(20,340),a.at(20,340),2),'the footage itself is untouched by the lighting control');
 await mutate(dir,d=>d.studio.undo());
 checks.push('The product is lit by the footage: direction follows the bright area, colour follows the plate, and it is an undoable control');

 // --- Control passes ------------------------------------------------------------
 const pass=async(name,folder=name)=>{const out=path.join(tmp,folder);const receipt=await render(dir,out,{format:'png',frames:1,pass:name});assert.equal(receipt.pass,name);return pixels(frameFile(out,0));};
 const id=await pass('id');assert.equal(id.at(5,5)[3],0,'no plate, no DOM: the pass is transparent outside the object');
 assert.equal(idFromColor(id.at(320,200)),0,'the body decodes to the first declared id');
 let lid=false;for(let y=80;y<140&&!lid;y++)lid=id.at(320,y)[3]===255&&idFromColor(id.at(320,y))===1;assert.ok(lid,'the lid decodes to the second');
 const depth=await pass('depth'),front=3-.33,expected=Math.round(encodeDepth(front,demo.depth)*255);
 assert.ok(Math.abs(depth.at(320,200)[0]-expected)<=3,`depth pass encodes the nearest surface (${depth.at(320,200)[0]} vs ${expected})`);assert.ok(depth.at(320,200)[0]>depth.at(262,200)[0],'and falls off toward the silhouette');
 const matte=await pass('matte');assert.deepEqual(matte.at(320,200),[255,255,255,255]);assert.equal(matte.at(5,5)[3],0);
 // Nothing but the object: the capture page's own chrome must not show through a transparent frame.
 let stray=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(matte.at(x,y)[3]&&(x<230||x>410||y<70))stray++;assert.equal(stray,0,'a transparent pass contains only the scene');
 const normal=await pass('normal');assert.ok(normal.at(320,200)[2]>200&&Math.abs(normal.at(320,200)[0]-128)<25,'the surface facing the camera has a camera-facing normal');
 const clay=await pass('clay'),grey=clay.at(300,200),spread=p=>Math.max(...p.slice(0,3))-Math.min(...p.slice(0,3));assert.equal(grey[3],255);assert.ok(!close(grey,can,25)&&spread(grey)<spread(can),'clay replaces the label');
 // Clay is shaded by the scene's own lights, so the warm plate tints it. The material itself has no colour: under neutral light it is grey.
 await mutate(dir,d=>d.studio.execute({type:'set',clip:d.studio.doc.clips[0].id,anchor:'light',property:'fromPlate',value:false},d.studio.revision,'model'));
 const studioClay=(await pass('clay','clay-neutral')).at(300,200);await mutate(dir,d=>d.studio.undo());
 assert.ok(spread(studioClay)<16,`under neutral light clay is neutral grey (${studioClay.slice(0,3)})`);
 await assert.rejects(render(dir,path.join(tmp,'albedo'),{format:'png',frames:1,pass:'albedo'}),/does not declare a albedo pass; it declares: clay/);
 checks.push('clay, depth, normal, id and matte passes export from the same scene; an undeclared pass is refused');

 // --- Derived data is pinned to its take ---------------------------------------
 const short=path.join(tmp,'short.mp4');await run(ffmpeg(),['-v','error','-f','lavfi','-i',`color=c=gray:s=${W}x${H}:r=24:d=1`,'-c:v','libx264','-qp','0','-pix_fmt','yuv444p',short]);
 await importAsset(dir,'plate-normals',short,{role:'normals',of:'plate'});await rebind(dir);
 await assert.rejects(render(dir,path.join(tmp,'mismatch'),{format:'png',frames:1}),/plate-normals has 24 frames but plate has 72/);
 await assert.rejects(importAsset(dir,'second-matte',short,{role:'matte',of:'plate'}),/two matte/);
 const manifest=JSON.parse(await fs.readFile(path.join(dir,'assets.json'),'utf8'));manifest.assets['plate-matte'].derived.sourceSha256='0'.repeat(64);await fs.writeFile(path.join(dir,'assets.json'),JSON.stringify(manifest));
 await assert.rejects(readProject(dir),/regenerate the matte/);
 checks.push('A matte from another take, a second matte, and a derived video with the wrong frame count are refused');
 // The documented import sequence: several asset-add calls, then one rebind.
 const seqDir=path.join(tmp,'sequence');await init(seqDir,{template:'hybrid'});const demoAsset=name=>path.join(seqDir,'assets',name);
 await importAsset(seqDir,'shot',demoAsset('plate.mp4'));
 await importAsset(seqDir,'shot-matte',demoAsset('plate-matte.mp4'),{role:'matte',of:'shot'});
 await importAsset(seqDir,'shot-depth',demoAsset('plate-depth.mp4'),{role:'depth',of:'shot',encoding:demo.depth});
 await importAsset(seqDir,'shot-track',demoAsset('board-track.json'),{role:'track',of:'shot'});
 await rebind(seqDir);const seq=await readProject(seqDir);
 assert.deepEqual(['shot-matte','shot-depth','shot-track'].map(id=>seq.assets[id].derived.of),['shot','shot','shot']);
 checks.push('Several derived assets can be added before one rebind, as docs/hybrid-scenes.md shows');

 // --- Motion blur ------------------------------------------------------------------
 const blurDir=path.join(tmp,'blur-clip');await init(blurDir,{template:'renderer'});
 await fs.writeFile(path.join(blurDir,'clip.mjs'),`import {defineRenderer} from 'editableframes/renderer';export default defineRenderer({id:'mover',renderer:'dom',width:160,height:90,fps:24,durationInFrames:24,async create({root}){const box=document.createElement('div');box.style.cssText='position:absolute;top:30px;width:30px;height:30px;background:#00ff00';root.append(box);return {render(clock){box.style.left=(clock.frame*20)+'px';},dispose(){box.remove();}};}});`);
 await rebind(blurDir,{reset:true});
 const sharpDir=path.join(tmp,'sharp'),softDir=path.join(tmp,'soft');await render(blurDir,sharpDir,{format:'png',frames:4});
 const receipt=await render(blurDir,softDir,{format:'png',frames:4,motionBlur:{angle:180,samples:8}});assert.deepEqual(receipt.motionBlur,{samples:8,angle:180,phase:'centered'});assert.equal((await fs.readdir(softDir)).length,4);
 const row=async file=>{const data=await run(ffmpeg(),['-v','error','-i',file,'-pix_fmt','rgba','-f','rawvideo','-']);return Array.from({length:160},(_,x)=>[...data.subarray((45*160+x)*4,(45*160+x)*4+4)]);};
 const sharp=await row(frameFile(sharpDir,2)),soft=await row(frameFile(softDir,2));
 assert.ok(sharp.every(p=>p[3]===0||p[3]===255),'without a shutter every pixel is fully on or off');
 const partial=soft.filter(p=>p[3]>8&&p[3]<247);assert.ok(partial.length>=8,'the shutter leaves partly covered pixels along the direction of travel');
 // The shutter is open over 1.75..2.25 frames at 20px per frame. Eight samples sit at the middle of
 // eight equal slices, so the first and last are 8.75px apart: 4px of smear on each side of the square.
 assert.equal(soft.filter(p=>p[3]>0).length-sharp.filter(p=>p[3]>0).length,8);
 assert.ok(partial.every(p=>p[1]>=245&&p[0]<=10&&p[2]<=10),'a half-covered pixel keeps the pure colour: samples are averaged premultiplied');
 checks.push('Shutter motion blur averages sub-frame samples with correct edge colour');
 console.log(JSON.stringify({checks},null,2));
}finally{await fs.rm(tmp,{recursive:true,force:true});}
