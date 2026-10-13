/** Canonical control-key identity. Seconds are compatibility/sample values only.
 * Positive ties round up. A million ticks per reduced authored frame retains
 * retimed subframes without the near-duplicate identities of float seconds. */
export const TICKS_PER_FRAME = 1000000;
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
export function keyFrameRate(rate) {
  if(!rate||![rate.num,rate.den].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid authored key frame rate');
  const d=gcd(rate.num,rate.den);return {num:rate.num/d,den:rate.den/d};
}
export function secondsToTick(seconds,rate) {
  rate=keyFrameRate(rate);
  if(!Number.isFinite(seconds)||seconds<0||seconds>86400)throw Error('Invalid source key seconds');
  const tick=Math.round(seconds*(rate.num/rate.den)*TICKS_PER_FRAME);
  if(!Number.isSafeInteger(tick)||tick<0)throw Error('Key tick exceeds the safe integer range');
  return tick;
}
export function tickToSeconds(tick,rate) {
  rate=keyFrameRate(rate);
  if(!Number.isSafeInteger(tick)||tick<0)throw Error('Invalid key tick');
  const seconds=(tick/TICKS_PER_FRAME)*(rate.den/rate.num);
  if(seconds>86400)throw Error('Key time exceeds 86400 seconds');return seconds;
}
export function keySeconds(key) {
  if(key.timingVersion===undefined){if(!Number.isFinite(key.time)||key.time<0||key.time>86400)throw Error('Invalid legacy key time');return key.time;}
  if(key.timingVersion!==2)throw Error('Unsupported key timing version');
  const rate=keyFrameRate(key.frameRate);
  if(rate.num!==key.frameRate.num||rate.den!==key.frameRate.den)throw Error('Key frame rate must be reduced');
  const time=tickToSeconds(key.tick,rate);
  if(key.time!==time)throw Error('Key seconds disagree with canonical tick');return time;
}
/** The grid a track's identities live on. A canonical track carries its own
 * rate, so a later project-FPS change or a newly declared rate cannot strand
 * its keys; only a legacy or empty track adopts the caller's authored rate. */
export function trackFrameRate(keys,fallback) {
  let recorded=null;
  for(const key of keys??[]){
    if(key?.timingVersion===undefined)continue;
    const rate=keyFrameRate(key.frameRate);
    if(recorded&&(recorded.num!==rate.num||recorded.den!==rate.den))throw Error('Track mixes authored frame rates; explicitly migrate the track');
    recorded=rate;
  }
  return recorded??keyFrameRate(fallback);
}
export function canonicalTrack(keys,rate) {
  rate=trackFrameRate(keys,rate);const seen=new Set();
  return keys.map(key=>{
    const time=keySeconds(key);
    const tick=key.timingVersion===2?key.tick:secondsToTick(time,rate);
    if(seen.has(tick))throw Error('Legacy keys collapse onto one tick; explicitly resolve the conflicting keys before editing this track');
    seen.add(tick);return {...structuredClone(key),timingVersion:2,tick,frameRate:rate,time:tickToSeconds(tick,rate)};
  }).sort((a,b)=>a.tick-b.tick);
}
/** The key a write at `seconds` would update, or undefined if it would insert. */
export function keyAtSeconds(keys,seconds,rate) {
  rate=trackFrameRate(keys,rate);const tick=secondsToTick(seconds,rate);
  return (keys??[]).find(key=>(key.timingVersion===2?key.tick:secondsToTick(keySeconds(key),rate))===tick);
}
export function upsertControlKey(keys,seconds,value,easing,rate,{preserveEasing=true}={}) {
  rate=trackFrameRate(keys,rate);
  const next=canonicalTrack(keys,rate),tick=secondsToTick(seconds,rate),existing=next.find(key=>key.tick===tick);
  const result=next.filter(key=>key.tick!==tick);
  result.push({timingVersion:2,tick,frameRate:rate,time:tickToSeconds(tick,rate),value:structuredClone(value),easing:(preserveEasing?existing?.easing:undefined)??easing??'linear'});
  return result.sort((a,b)=>a.tick-b.tick);
}
export function removeControlKey(keys,seconds,rate){rate=trackFrameRate(keys,rate);const tick=secondsToTick(seconds,rate);return canonicalTrack(keys,rate).filter(key=>key.tick!==tick);}
export function moveControlKey(keys,from,to,rate){
  rate=trackFrameRate(keys,rate);
  const next=canonicalTrack(keys,rate),oldTick=secondsToTick(from,rate),tick=secondsToTick(to,rate),key=next.find(k=>k.tick===oldTick);
  if(!key)throw Error('Key no longer exists');
  if(oldTick!==tick&&next.some(k=>k.tick===tick))throw Error('A key already occupies the target tick');
  return next.map(k=>k===key?{...k,tick,time:tickToSeconds(tick,rate)}:k).sort((a,b)=>a.tick-b.tick);
}
