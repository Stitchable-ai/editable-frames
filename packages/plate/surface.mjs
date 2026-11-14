import {rasterizeSurface} from './raster-surface.mjs';
import {solveHomography,applyHomography,rectQuad,quadArea} from './homography.mjs';
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);

/** A rigid cylindrical body in an authored/tracked projected quad. This is an
 * image-space surface fit, not an inferred metric camera or hidden geometry.
 * The axis/seam is authored when a blank cylinder makes rotation unobservable. */
export function cylinderMesh(quad,{columns=64,rows=8,seam=0,arc=Math.PI*2}={}) {
  if(!Number.isSafeInteger(columns)||columns<2||columns>256||!Number.isSafeInteger(rows)||rows<1||rows>128||!Number.isFinite(seam)||!(arc>0&&arc<=Math.PI*2))throw Error('Invalid cylinder tessellation or seam');
  if(quadArea(quad)<=0)throw Error('Cylinder body quad is mirrored or degenerate');
  const h=solveHomography(rectQuad(1,1),quad),vertices=[],uv=[],triangles=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const nx=x/columns*2-1;
    vertices.push(applyHomography(h,[(nx+1)/2,y/rows]));
    uv.push([.5+Math.asin(Math.max(-1,Math.min(1,nx)))/arc+seam,y/rows]);
  }
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+1,c=a+columns+1,d=c+1;triangles.push([a,b,d],[a,d,c]);}
  return {vertices,uv,triangles};
}

export function validateSurfaceMesh(mesh) {
  if(!mesh||!Array.isArray(mesh.vertices)||mesh.vertices.length<3||mesh.vertices.length>40000||!mesh.vertices.every(point)||!Array.isArray(mesh.uv)||mesh.uv.length!==mesh.vertices.length||!mesh.uv.every(point)||!Array.isArray(mesh.triangles)||mesh.triangles.length>80000)throw Error('Surface needs bounded vertices, UVs and triangles');
  for(const t of mesh.triangles)if(!Array.isArray(t)||t.length!==3||t.some(i=>!Number.isSafeInteger(i)||i<0||i>=mesh.vertices.length)||new Set(t).size!==3)throw Error('Invalid surface triangle');
  return mesh;
}

/** Tracked cloth/mesh import path: each key supplies corresponding vertices.
 * Visibility and tracking quality remain prepared inputs. No extrapolation. */
export function sampleSurface(track,frame) {
  if(!track||track.version!==1||!Array.isArray(track.frames)||!track.frames.length||!Number.isFinite(frame))throw Error('Invalid surface track');
  let previous=-1;
  for(const f of track.frames){if(!Number.isSafeInteger(f.frame)||f.frame<=previous)throw Error('Surface frames must increase');previous=f.frame;validateSurfaceMesh(f);}
  const exact=track.frames.find(f=>f.frame===frame);if(exact){if(exact.valid===false)throw Error(`Invalid surface at ${frame}`);return exact;}
  const next=track.frames.findIndex(f=>f.frame>frame);if(next<=0)throw Error(`Surface frame ${frame} outside tracked range`);
  const a=track.frames[next-1],b=track.frames[next];
  if(a.valid===false||b.valid===false||JSON.stringify(a.triangles)!==JSON.stringify(b.triangles)||a.vertices.length!==b.vertices.length||JSON.stringify(a.uv)!==JSON.stringify(b.uv))throw Error('Surface visibility/topology changes require an explicit key');
  const t=(frame-a.frame)/(b.frame-a.frame);
  return {...a,frame,vertices:a.vertices.map((p,i)=>p.map((v,j)=>v+(b.vertices[i][j]-v)*t))};
}

/** Triangulated UV artwork warp. The caller supplies surface coverage and
 * foreground holdouts. Lids/contact shadows remain in the unmodified plate. */
const scratchCanvases=new WeakMap();
export function drawSurfaceArtwork(context,artwork,mesh,{wrap=false}={}) {
  validateSurfaceMesh(mesh);
  const w=artwork.naturalWidth??artwork.width,h=artwork.naturalHeight??artwork.height;
  if(!(w>0&&h>0))throw Error('Artwork has no decoded dimensions');
  let scratch=scratchCanvases.get(context);
  if(!scratch){const doc=context.canvas.ownerDocument;scratch={source:doc.createElement('canvas'),target:doc.createElement('canvas')};scratchCanvases.set(context,scratch);}
  scratch.source.width=w;scratch.source.height=h;
  const input=scratch.source.getContext('2d',{willReadFrequently:true});input.drawImage(artwork,0,0);
  const width=context.canvas.width,height=context.canvas.height;
  scratch.target.width=width;scratch.target.height=height;
  const target=scratch.target.getContext('2d'),image=target.createImageData(width,height);
  image.data.set(rasterizeSurface(input.getImageData(0,0,w,h).data,w,h,mesh,width,height,{wrap}));target.putImageData(image,0,0);context.drawImage(scratch.target,0,0);
}

/** Preserve observed shading on a neutral original body. `reference` is the
 * original albedo (0..255); arbitrary old printing needs an independent clean
 * albedo/shading estimate, rather than pretending multiplication removes it. */
export function relightArtwork(artwork,plate,{reference=180,strength=1}={}) {
  if(artwork.length!==plate.length||artwork.length%4||!(reference>0&&reference<=255)||!(strength>=0&&strength<=1))throw Error('Invalid reskin rasters or neutral reference');
  const out=new Uint8ClampedArray(artwork);
  for(let i=0;i<out.length;i+=4){const l=(plate[i]*.2126+plate[i+1]*.7152+plate[i+2]*.0722)/reference,light=1+(l-1)*strength;for(let c=0;c<3;c++)out[i+c]=artwork[i+c]*light;}
  return out;
}

/** Landmark mismatch is independent of tracker confidence. */
export function surfaceError(expected,actual) {
  if(!expected.length||expected.length!==actual.length||!expected.every(point)||!actual.every(point))throw Error('Landmark arrays must match');
  const errors=expected.map((p,i)=>Math.hypot(p[0]-actual[i][0],p[1]-actual[i][1])).sort((a,b)=>a-b);
  return {max:errors.at(-1),p95:errors[Math.ceil(errors.length*.95)-1],mean:errors.reduce((a,b)=>a+b,0)/errors.length};
}
