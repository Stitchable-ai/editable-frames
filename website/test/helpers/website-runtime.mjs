import {build} from 'esbuild';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const compiled=await build({entryPoints:[root+'src/lib/analytics.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},plugins:[{name:'sdk-stub',setup(b){b.onResolve({filter:/^posthog-js$/},()=>({path:'sdk',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default globalThis.__sdk'}));}}]});
function eventTarget(){const listeners=new Map();return {addEventListener(n,f){const list=listeners.get(n)??[];list.push(f);listeners.set(n,list)},dispatchEvent(e){for(const f of listeners.get(e.type)??[])f(e)},listenerCount:n=>(listeners.get(n)??[]).length};}
export function website(url,jar=new Map(),privacy={}){
 let config,off=false,initializations=0;const deliveries=[];
 const sdk={init(_key,c){initializations++;config=c},capture(event,properties){if(!off)config.before_send({event,properties:{...properties,distinct_id:'synthetic-browser'}})},has_opted_out_capturing:()=>off,opt_in_capturing(){off=false},opt_out_capturing(){off=true}};
 const document=Object.assign(eventTarget(),{referrer:'',hidden:false});
 Object.defineProperty(document,'cookie',{get:()=>[...jar].map(([k,v])=>k+'='+v).join('; '),set(s){const [pair,...attrs]=s.split('; '),i=pair.indexOf('='),k=pair.slice(0,i),v=pair.slice(i+1);if(attrs.includes('Max-Age=0'))jar.delete(k);else jar.set(k,v)}});
 const window=eventTarget();window.parent=window;
 class Element {constructor(href){this.href=href;this.dataset={}}closest(s){return s==='a'?this:null}}
 const module={exports:{}},context={module,__sdk:sdk,window,document,navigator:privacy,location:new URL(url),URL,URLSearchParams,crypto:webcrypto,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null},performance:{getEntriesByName:()=>[],mark(){},clearMarks(){}},AbortController,Event,Element,HTMLDetailsElement:class{},setTimeout,clearTimeout,fetch:async(_url,options)=>{deliveries.push(JSON.parse(options.body));return {ok:true,status:200,json:async()=>({status:'Ok'})}}};
 vm.runInNewContext(compiled.outputFiles[0].text,context);
 return {api:module.exports,jar,window,document,deliveries,initializations:()=>initializations,click(href){document.dispatchEvent({type:'click',isTrusted:true,target:new Element(href)})}};
}
