import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePreparedAnalysis,preparedFrame,analyzeMask,sampleMaskCorrections,assertSurfaceLayout,cylinderMesh,sampleSurface,surfaceError,typeMotion,createMaskCorrectionSession,rasterizeSurface,validateDerived,pendingMaskCorrections} from '../packages/plate/index.mjs';
const hash='a'.repeat(64),maskHash='b'.repeat(64);
const receipt=()=>({version:1,kind:'prepared-plate',subject:'hand',revision:'c'.repeat(64),source:{asset:'plate',sha256:hash,width:100,height:80,frames:3,frameRate:{num:24,den:1},pts:[0,1/24,2/24],orientation:0,crop:[0,0,100,80]},alpha:{asset:'mask',sha256:maskHash,channel:'luminance',semantics:'segmentation'},provenance:{method:'manual','preprocess':'test/1'},frames:[0,1,2].map(i=>({sourceFrame:i,maskFrame:i,valid:true,reviewed:true}))});
test('prepared source identity, correspondence and review survive trims/reverse/random seeks',()=>{
 const r=validatePreparedAnalysis(receipt());
 assert.equal(preparedFrame(r,1/24).sourceFrame,1);
 assert.equal(preparedFrame(r,1/24,{start:2/24,speed:-1}).sourceFrame,1);
 assert.equal(preparedFrame(r,0).sourceFrame,0);
 assert.throws(()=>preparedFrame(r,3/24),/outside/);
 const stale=receipt();assert.throws(()=>validatePreparedAnalysis(stale,{...stale.source,sha256:maskHash}),/changed/);
 const missing=receipt();missing.frames.pop();assert.throws(()=>validatePreparedAnalysis(missing),/correspondence/);
 const bad=receipt();bad.frames[1].valid=false;assert.throws(()=>preparedFrame(bad,1/24),/frame 1/);
 bad.frames[1].valid=true;bad.frames[1].reviewed=false;assert.throws(()=>preparedFrame(bad,1/24),/review/);
});
test('mask collapse is flagged without erasing disconnected finger components',()=>{
 const pixels=new Uint8ClampedArray(4*100);for(const p of [1,3,10,99])pixels.fill(255,p*4,p*4+4);
 const a=analyzeMask(pixels,10,10,{previousCoverage:.5});
 assert.equal(a.coverage,.04);assert.deepEqual(a.bounds,[0,0,10,10]);assert.deepEqual(a.issues,['foreground-area-collapse']);
});
test('corrections propagate only inside authored matching intervals',()=>{
 const polygon=x=>({operation:'add',points:[[x,0],[x+4,0],[x+4,4],[x,4]]});
 const b={version:1,sourceSha256:hash,subject:'hand',keys:[{frame:10,interpolation:'linear',polygons:[polygon(0)]},{frame:20,polygons:[polygon(10)]}]};
 assert.equal(sampleMaskCorrections(b,15)[0].points[0][0],5);assert.deepEqual(sampleMaskCorrections(b,21),[]);
 b.keys[1].polygons[0].operation='subtract';assert.throws(()=>sampleMaskCorrections(b,15),/topology/);
});
test('surface layout rejects overflowing footer rather than silently clipping it',()=>{
 assertSurfaceLayout([{x:10,y:10,width:80,height:30}],{width:100,height:60});
 assert.throws(()=>assertSurfaceLayout([{id:'footer',x:0,y:58,width:100,height:10}],{width:100,height:60}),/footer/);
});
test('cylindrical mapping keeps the original body bounds and non-linear UV spacing',()=>{
 const m=cylinderMesh([[10,20],[110,20],[110,220],[10,220]],{columns:4,rows:1});
 assert.deepEqual(m.vertices[0],[10,20]);assert.deepEqual(m.vertices[4],[110,20]);assert.equal(m.vertices.at(-1)[1],220);
 assert.equal(m.uv[2][0],.5);assert.ok(m.uv[1][0]>.25,'surface curvature compresses the edge texture');
 assert.equal(surfaceError(m.vertices,m.vertices).max,0);
 const a={frame:0,...m},b={frame:10,...m,vertices:m.vertices.map(([x,y])=>[x+20,y])};
 assert.equal(sampleSurface({version:1,frames:[a,b]},5).vertices[0][0],20);
 assert.throws(()=>sampleSurface({version:1,frames:[a,b]},11),/outside/);
});
test('all text treatments reproduce after reverse/random seeks and retain readable holds',()=>{
 for(const effect of ['rise','wipe','spring','orbit','extrude']){
  const first=typeMotion(.3,{effect});typeMotion(2,{effect});typeMotion(0,{effect});assert.deepEqual(typeMotion(.3,{effect}),first);
  assert.equal(typeMotion(-1,{effect}).opacity,0);assert.equal(typeMotion(1.5,{effect}).opacity,1);assert.equal(typeMotion(4,{effect}).opacity,0);
 }
});

test('correction gestures propose reversible books without mutating an existing revision',()=>{
 const session=createMaskCorrectionSession(),book={version:1,sourceSha256:hash,subject:'hand',keys:[]};
 const options={book,sourceSha256:hash,subject:'hand',sourceFrame:1,sourceWidth:100,sourceHeight:80,width:200,height:160};
 session.gesture({phase:'begin',id:'stroke',start:{x:50,y:50}},options);
 const proposal=session.gesture({phase:'commit',id:'stroke',point:{x:50,y:50}},options);
 assert.equal(book.keys.length,0);assert.equal(proposal.values.corrections.keys[0].frame,1);assert.equal(proposal.values.corrections.keys[0].polygons[0].points.length,20);
});
test('adjacent surface triangles cover every interior pixel without transparency seams',()=>{
 const art=new Uint8ClampedArray(4*16);for(let i=0;i<art.length;i+=4)art.set([255,30,10,255],i);
 const mesh=cylinderMesh([[2,2],[18,2],[18,18],[2,18]],{columns:8,rows:4}),out=rasterizeSurface(art,4,4,mesh,20,20);
 for(let y=2;y<18;y++)for(let x=2;x<18;x++)assert.deepEqual([...out.subarray((y*20+x)*4,(y*20+x)*4+4)],[255,30,10,255]);
 assert.equal(out[3],0);
});
test('derived roles can distinguish subjects while refusing duplicates per subject',()=>{
 const asset={type:'video',sha256:hash},derived=subject=>({type:'video',sha256:maskHash,derived:{of:'plate',role:'matte',sourceSha256:hash,subject}});
 validateDerived({plate:asset,hand:derived('hand'),person:derived('person')});
 assert.throws(()=>validateDerived({plate:asset,hand:derived('hand'),another:derived('hand')}),/two matte/);
});

test('baked corrections are applied once and subsequent edits remain provisional',()=>{
 const p={operation:'add',points:[[0,0],[5,0],[5,5]]},book={version:1,sourceSha256:hash,subject:'hand',keys:[{frame:0,polygons:[p]}]};
 assert.equal(pendingMaskCorrections(book,structuredClone(book)),null);
 const edited=structuredClone(book);edited.keys[0].polygons.push({...p,operation:'subtract'});
 assert.equal(pendingMaskCorrections(edited,book).keys[0].polygons.length,1);
 assert.throws(()=>pendingMaskCorrections({...book,keys:[]},book),/original mask/);
});
