// Renderers own their code. This optional registry describes what they ask of a host.
export class AdapterRegistry {
 #adapters=new Map();
 register(adapter){
  if(!adapter?.id||adapter.protocol!==1||typeof adapter.create!=='function')throw Error('Adapter needs id, protocol:1 and create(context)');
  if(this.#adapters.has(adapter.id))throw Error('Duplicate adapter');
  this.#adapters.set(adapter.id,adapter);return this;
 }
 async create(id,context){
  const adapter=this.#adapters.get(id);if(!adapter)throw Error('Missing adapter: '+id);
  for(const service of adapter.requires??[])if(typeof context.host?.[service]!=='function')throw Error('Missing host service: '+service);
  const instance=await adapter.create(context);
  if(typeof instance?.render!=='function')throw Error('Adapter must provide render(frame)');return instance;
 }
 list(){return [...this.#adapters.values()].map(({id,protocol,requires=[]})=>({id,protocol,requires}));}
}
// Only supplied services are supported. No silent stand-ins for audio, depth, or frames.
export function createEffectHost(services={}){
 return Object.freeze(Object.fromEntries(Object.entries(services).map(([name,service])=>{
  if(typeof service!=='function')throw Error('Host services must be functions');return [name,service];
 })));
}
export function frameRequest(frame,fps={num:24,den:1}){
 if(!Number.isSafeInteger(frame)||frame<0||!Number.isSafeInteger(fps.num)||fps.num<1||!Number.isSafeInteger(fps.den)||fps.den<1)throw Error('Invalid frame clock');
 return Object.freeze({frame,fps:{...fps},time:frame*fps.den/fps.num});
}
