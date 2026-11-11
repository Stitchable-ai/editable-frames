/** Model-neutral, immutable analysis receipts. Frame numbers are source frames,
 * never timeline frames. A receipt records correspondence, not pixel truth. */
const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const integer = x => Number.isSafeInteger(x) && x >= 0;
const finite = x => typeof x === 'number' && Number.isFinite(x);
export function validatePreparedAnalysis(data, source) {
  if (!data || data.version !== 1 || data.kind !== 'prepared-plate') throw Error('Prepared analysis needs version 1, kind prepared-plate');
  const s = data.source;
  if (!s || typeof s.asset!=='string' || !s.asset || !hash(s.sha256) || !integer(s.width) || !s.width || !integer(s.height) || !s.height || !integer(s.frames) || !s.frames || s.frames > 100000) throw Error('Prepared analysis needs a bounded source digest, dimensions and frame count');
  const rate = s.frameRate;
  if (!rate || !integer(rate.num) || !rate.num || !integer(rate.den) || !rate.den) throw Error('Prepared analysis needs a rational source frame rate');
  if (s.orientation !== 0 || !Array.isArray(s.crop) || s.crop.length !== 4 || !s.crop.every(integer) || s.crop.join() !== [0,0,s.width,s.height].join()) throw Error('Prepare analysis from the decoded, oriented full source raster');
  if (!Array.isArray(s.pts) || s.pts.length !== s.frames || s.pts.some((t,i) => !finite(t) || t < 0 || (i && t <= s.pts[i-1])) || s.pts[0] !== 0) throw Error('Prepared analysis needs strictly increasing source presentation times starting at zero');
  if (source) {
    for (const key of ['sha256','width','height','frames']) if (source[key] !== s[key]) throw Error(`Prepared analysis source ${key} changed; prepare this take again`);
    if (source.frameRate && source.frameRate.num * rate.den !== rate.num * source.frameRate.den) throw Error('Prepared source frame rate changed');
    if (source.pts && (source.pts.length !== s.frames || source.pts.some((t,i) => Math.abs(t-s.pts[i]) > 1e-7))) throw Error('Prepared source presentation times changed');
  }
  if (typeof data.subject !== 'string' || !/^[\w.-]{1,80}$/.test(data.subject) || !hash(data.revision)) throw Error('Prepared analysis needs a subject and correction revision digest');
  if (!data.provenance || typeof data.provenance.method !== 'string' || !data.provenance.method || typeof data.provenance.preprocess !== 'string' || !data.provenance.preprocess) throw Error('Prepared analysis needs method and preprocessing provenance');
  if (data.provenance.checkpoint !== undefined && !hash(data.provenance.checkpoint)) throw Error('Checkpoint identity must be a content digest');
  if (!data.alpha || typeof data.alpha.asset !== 'string' || !hash(data.alpha.sha256) || !['luminance','alpha'].includes(data.alpha.channel) || !['segmentation','alpha'].includes(data.alpha.semantics)) throw Error('Prepared analysis needs a pinned alpha/segmentation asset and channel');
  if (!Array.isArray(data.frames) || data.frames.length !== s.frames) throw Error('Prepared analysis is missing source-frame correspondence');
  data.frames.forEach((f,i) => {
    if (f.sourceFrame !== i || !integer(f.maskFrame) || f.maskFrame >= s.frames || typeof f.valid !== 'boolean' || typeof f.reviewed !== 'boolean') throw Error(`Invalid prepared correspondence at source frame ${i}`);
    if (f.issues !== undefined && (!Array.isArray(f.issues) || f.issues.some(x => typeof x !== 'string'))) throw Error(`Invalid issues at source frame ${i}`);
  });
  return data;
}

/** Explicit source mapping handles trim/reverse; out-of-range never holds a tail. */
export function preparedFrame(data, seconds, {start = 0, speed = 1, requireReviewed = true, allowInvalid = false} = {}) {
  if (![seconds,start,speed].every(finite)) throw Error('Prepared sampling needs finite time, trim and speed');
  const time = start + seconds * speed, pts = data.source.pts;
  const end = pts.at(-1) + data.source.frameRate.den / data.source.frameRate.num;
  if (time < -1e-9 || time >= end - 1e-9) throw Error(`Prepared source time ${time} is outside 0..${end}`);
  let lo=0, hi=pts.length;
  while (lo+1<hi) { const mid=(lo+hi)>>1; if(pts[mid]<=time+1e-9)lo=mid;else hi=mid; }
  const f=data.frames[lo];
  if ((!f.valid && !allowInvalid) || (requireReviewed && !f.reviewed)) throw Error(`Prepared subject ${data.subject} needs correction/review at source frame ${lo}${f.issues?.length ? ': '+f.issues.join(', ') : ''}`);
  return {...f, seconds:pts[lo], maskSeconds:pts[f.maskFrame]};
}

/** Bounded diagnostics. Area collapse flags review, not automatic deletion or
 * identity reassignment: a real subject can leave the shot. */
export function analyzeMask(rgba, width, height, {channel='luminance', previousCoverage, collapseRatio=.2,expected=true} = {}) {
  if (!integer(width) || !width || !integer(height) || !height || rgba.length !== width*height*4) throw Error('Mask raster dimensions do not match');
  if (!['luminance','alpha'].includes(channel)) throw Error('Mask channel must be luminance or alpha');
  let area=0, opaque=0, left=width,top=height,right=-1,bottom=-1;
  for(let p=0;p<width*height;p++) {
    const i=p*4, a=channel==='alpha'?rgba[i+3]:(rgba[i]*54+rgba[i+1]*183+rgba[i+2]*19)/256;
    area+=a/255;
    if(a>127){opaque++;const x=p%width,y=Math.floor(p/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  const coverage=opaque/(width*height), issues=[];
  if(expected&&opaque===0)issues.push('foreground-absent');
  if(expected && finite(previousCoverage) && previousCoverage>.001 && coverage<previousCoverage*collapseRatio)issues.push('foreground-area-collapse');
  return {coverage,alphaCoverage:area/(width*height),bounds:right<0?null:[left,top,right-left+1,bottom-top+1],issues};
}

export function validateMaskCorrections(book) {
  if(!book || book.version!==1 || !hash(book.sourceSha256) || typeof book.subject!=='string' || !Array.isArray(book.keys) || book.keys.length>10000)throw Error('Invalid subject correction book');
  let last=-1;
  for(const k of book.keys){
    if(!integer(k.frame)||k.frame<=last||!Array.isArray(k.polygons)||k.polygons.length>128)throw Error('Correction keys must have increasing whole frames and bounded polygons');last=k.frame;
    for(const p of k.polygons){
      if(!['add','subtract','replace'].includes(p.operation)||!Array.isArray(p.points)||p.points.length<3||p.points.length>4096||p.points.some(v=>!Array.isArray(v)||v.length!==2||!v.every(finite)))throw Error('Correction polygon needs finite source-raster points and an operation');
    }
  }
  return book;
}

/** Propagation is explicit and bounded between matching authored polygon keys.
 * No extrapolation beyond them, and no blind optical-flow identity guess. */
export function sampleMaskCorrections(book, frame) {
  validateMaskCorrections(book);
  if(!integer(frame))throw Error('Correction sample needs a whole source frame');
  const exact=book.keys.find(k=>k.frame===frame);if(exact)return structuredClone(exact.polygons);
  const next=book.keys.findIndex(k=>k.frame>frame);if(next<=0)return [];
  const a=book.keys[next-1],b=book.keys[next];if(a.interpolation!=='linear')return [];
  if(a.polygons.length!==b.polygons.length||a.polygons.some((p,i)=>p.operation!==b.polygons[i].operation||p.points.length!==b.polygons[i].points.length))throw Error(`Correction topology changes across ${a.frame}..${b.frame}`);
  const t=(frame-a.frame)/(b.frame-a.frame);
  return a.polygons.map((p,i)=>({...p,points:p.points.map((v,j)=>v.map((n,c)=>n+(b.polygons[i].points[j][c]-n)*t))}));
}

/** Layout is tested in surface coordinates before projective mapping. */
export function assertSurfaceLayout(boxes, {width,height,padding=0}) {
  for(const b of boxes)if(![b.x,b.y,b.width,b.height].every(finite)||b.width<0||b.height<0||b.x<padding||b.y<padding||b.x+b.width>width-padding||b.y+b.height>height-padding)throw Error(`Artwork ${b.id??''} exceeds the surface safe area`);
  return true;
}

export async function loadPreparedAnalysis({asset,mediaInfo}, id) {
  if(!asset||!mediaInfo)throw Error('Prepared media requires asset and mediaInfo host services');
  const response=await fetch(asset(id));if(!response.ok)throw Error(`Cannot load prepared analysis ${id}`);
  const data=await response.json(), source=mediaInfo(data.source.asset);
  validatePreparedAnalysis(data,source);
  const mask=mediaInfo(data.alpha.asset);
  if(mask.sha256!==data.alpha.sha256 || mask.frames!==data.source.frames || mask.width!==data.source.width || mask.height!==data.source.height)throw Error('Prepared mask bytes, dimensions or frame count changed');
  return data;
}

const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])])):value;
/** Canonical masks already contain approved corrections. Live strokes are
 * provisional; only an append-only delta can be previewed without raw input. */
export function pendingMaskCorrections(book,applied){
 if(!book)return null;
 validateMaskCorrections(book);
 const equal=(a,b)=>JSON.stringify(ordered(a))===JSON.stringify(ordered(b));
 if(equal(book,applied))return null;
 if(!applied)return book.keys.some(k=>k.polygons.length)?structuredClone(book):null;
 validateMaskCorrections(applied);
 if(book.sourceSha256!==applied.sourceSha256||book.subject!==applied.subject)throw Error('Correction identity changed');
 // Editing either endpoint or inserting inside a baked interpolation interval
 // changes its whole span, which cannot be represented as a live delta.
 for(let i=0;i<applied.keys.length-1;i++){
  const a=applied.keys[i],b=applied.keys[i+1];
  if(a.interpolation==='linear'&&book.keys.some(k=>k.frame>a.frame&&k.frame<b.frame))throw Error('Re-prepare from the original mask to change a baked interpolation interval');
  if(a.interpolation==='linear'&&[a,b].some(old=>!equal(book.keys.find(k=>k.frame===old.frame),old)))throw Error('Re-prepare from the original mask to change a baked interpolation interval');
 }
 const pending=structuredClone(book);pending.keys=[];
 for(const old of applied.keys)if(!book.keys.some(k=>k.frame===old.frame))throw Error('Re-prepare from the original mask to remove baked corrections');
 for(const key of book.keys){const old=applied.keys.find(k=>k.frame===key.frame);const count=old?.polygons.length??0;
  if(old&&(!equal(key.polygons.slice(0,count),old.polygons)||key.interpolation!==old.interpolation))throw Error('Re-prepare from the original mask to change baked corrections');
  if(key.polygons.length>count)pending.keys.push({...structuredClone(key),polygons:structuredClone(key.polygons.slice(count))});
 }
 return pending.keys.length?pending:null;
}
