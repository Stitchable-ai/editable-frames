// A media port is an editable binding, not a restriction on renderer geometry.
export function resolvePorts(template, nodes) {
 const ports = {};
 for (const [id, spec] of Object.entries(template.media ?? {})) {
  const port = {sourceIn:0, offset:0, rate:1, gain:1, muted:false, end:'transparent', ...spec};
  if (spec.anchor) {
   const node = nodes.find(n => n.id === spec.anchor);
   if (!node) throw Error(`Missing media anchor: ${spec.anchor}`);
   for (const [key, property] of Object.entries(spec.bindings ?? {})) {
    if (!(property in node.props)) throw Error(`Missing media property: ${property}`);
    port[key] = node.props[property];
   }
  }
  if (typeof port.asset !== 'string' || !port.asset) throw Error(`Missing asset for port ${id}`);
  for (const key of ['sourceIn','offset','rate','gain']) if (!Number.isFinite(port[key])) throw Error(`Invalid port ${key}`);
  if(port.sourceIn<0 || port.offset<0 || port.rate<.1 || port.rate>8 || port.gain<0 || port.gain>8 || typeof port.muted!=='boolean' || !['hold','loop','transparent'].includes(port.end)) throw Error(`Invalid media port: ${id}`);
  ports[id] = port;
 }
 return ports;
}
export function mediaTime(port, time, duration) {
 if (time < port.offset) return null;
 let t = port.sourceIn + (time-port.offset)*port.rate;
 if (t >= duration) {
  if(port.end==='transparent') return null;
  if(port.end==='loop') t %= duration;
  else t = Math.max(0,duration-1e-9);
 }
 return t;
}
export function ptsIndex(pts,time) {
 if(!pts.length || !Number.isFinite(time) || time<0) return -1;
 let lo=0,hi=pts.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(pts[mid]<=time+1e-9)lo=mid+1;else hi=mid;}
 return Math.max(0,lo-1);
}
