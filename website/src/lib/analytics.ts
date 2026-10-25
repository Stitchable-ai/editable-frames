import {createDispatcher} from './analytics-delivery';
import {WEBSITE_POSTHOG} from './analytics-config';
import posthog from 'posthog-js';
export {searchBucket as searchBucketForAnalytics} from './analytics-core';
import {campaignOf, ensureSdkCapture, cleanPayload, cleanProperties, externalReferrer, routeOf, safeTag, WEBSITE_EVENTS} from './analytics-core';

type State = {initialized:boolean; route:string; mode:string; campaign:Record<string,string>; referrer?:string; first?:Record<string,string>; last?:Record<string,string>; qa?:string};
let dispatcher:ReturnType<typeof createDispatcher>|undefined;
let listening=false;
const state:State = {initialized:false,route:'/',mode:'desktop',campaign:{}};
const routes = ["/", "/guide/", "/reference/", "/compare/", "/credits/", "/privacy/", "/genres/castle/", "/genres/device/", "/genres/showreel/", "/genres/unet/", "/genres/paper/", "/genres/underwater/", "/genres/grain/", "/genres/warehouse/", "/genres/storybook/", "/genres/dragon/", "/genres/ink/", "/genres/evolution/"];
const surface = 'editableframes_site';
const product = 'editableframes';
const productionHosts = ['stitchable.ai','www.stitchable.ai','editableframes.stitchable.ai'];
const preferenceKey = 'st_website_analytics';
const attributionKey = 'st_website_attribution_v1';
function cookie(name:string):string|undefined { try { const v=document.cookie.split('; ').find(c=>c.startsWith(name+'='));return v?decodeURIComponent(v.slice(name.length+1)):undefined; } catch {return;} }
function setCookie(name:string,value:string,days=30) { try { const domain=productionHosts.includes(location.hostname)?'; Domain=stitchable.ai':'';document.cookie=name+'='+encodeURIComponent(value)+'; Path=/; SameSite=Lax; Max-Age='+days*86400+domain+(location.protocol==='https:'?'; Secure':'');}catch{} }
function blocked():boolean { return typeof window==='undefined' || cookie(preferenceKey)==='off' || navigator.doNotTrack==='1' || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl===true; }
function environment() {return productionHosts.includes(location.hostname)?'production':'development';}
function qaMark(name:string,detail:unknown){if(!state.qa)return;if(performance.getEntriesByName(name).length>=128)performance.clearMarks(name);performance.mark(name,{detail});}
function context() {return {surface,product,environment:environment(),schema_version:1,release:import.meta.env.PUBLIC_ANALYTICS_RELEASE??WEBSITE_POSTHOG.release,page_route:state.route,presentation_mode:state.mode,is_embedded:window.parent!==window,is_qa:Boolean(state.qa),...(state.qa?{qa_run:state.qa}:{}),...state.campaign,
  first_source:state.first?.utm_source,first_medium:state.first?.utm_medium,first_campaign:state.first?.utm_campaign,
  first_content:state.first?.utm_content,first_term:state.first?.utm_term,first_content_id:state.first?.content_id,
  last_source:state.last?.utm_source,last_medium:state.last?.utm_medium,last_campaign:state.last?.utm_campaign,
  last_content:state.last?.utm_content,last_term:state.last?.utm_term,last_content_id:state.last?.content_id};}
function readAttribution(){try{const saved=JSON.parse(cookie(attributionKey)??'null');if(saved?.expires>Date.now()){state.first=campaignOf(new URLSearchParams(saved.first).toString());state.last=campaignOf(new URLSearchParams(saved.last).toString());}}catch{}}
function saveAttribution(){if(blocked())return;setCookie(attributionKey,JSON.stringify({first:state.first,last:state.last,expires:Date.now()+30*86400000}));}
export function capture(event:string,properties:Record<string,unknown>={}) {
  if(blocked()||!WEBSITE_EVENTS.has(event))return;
  try{if(!state.initialized)initAnalytics();if(!state.initialized||!ensureSdkCapture(posthog,!blocked()))return;posthog.capture(event,{interaction_origin:'user',...cleanProperties(properties),...context(),$insert_id:crypto.randomUUID()});}catch{/* Measurement cannot interrupt a visitor's action. */}
}
export function setRouteContext(pathname:string){state.route=routeOf(pathname,routes);}
export function setPresentationMode(mode:'desktop'|'website'|'mobile'){state.mode=mode;}
export function trackPage(pathname:string,reason='navigation') {
  const next=routeOf(pathname,routes);if(next===state.route&&reason!=='initial')return;
  state.route=next;
  if(window.parent===window){capture('$pageview',{interaction_origin:reason==='initial'?'system':'user'});if(next==='/pricing/')capture('pricing_viewed',{ict_stage:'comparison'});}
}
export function analyticsPreference():string {return blocked()?'off':'on';}
export function setAnalyticsPreference(enabled:boolean){
  dispatcher?.stop();setCookie('st_website_analytics_revision',crypto.randomUUID(),365);
  setCookie(preferenceKey,enabled?'on':'off',365);
  try {
    if(enabled&&!blocked()) {initAnalytics(false);posthog.opt_in_capturing({captureEventName:false});trackPage(location.pathname,'initial');}
    else {posthog.opt_out_capturing();setCookie(attributionKey,'',0);state.first=undefined;state.last=undefined;state.campaign={};}
  } catch {}
  window.dispatchEvent(new Event('stitchable:analytics-preference'));
}
export function initAnalytics(recordInitial=true){
  if(typeof window==='undefined')return;
  // Install wake-up handlers even when this tab opens with the shared choice Off.
  if(!listening){
    listening=true;
    window.addEventListener('focus',()=>initAnalytics());
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)initAnalytics();});
    document.addEventListener('click',event=>{initAnalytics();onLink(event);},true);
    document.addEventListener('toggle',event=>{const el=event.target;if(el instanceof HTMLDetailsElement&&el.open)capture('faq_opened',{kind:el.closest('[data-faq-list]')?.getAttribute('data-faq-list')??'website',placement:el.id||'details'});},true);
    window.addEventListener('popstate',()=>{initAnalytics(false);trackPage(location.pathname,'history');});
    window.addEventListener('pagehide',()=>{if(state.initialized&&window.parent===window)capture('$pageleave');});
  }
  if(state.initialized||blocked())return;
  const prod=environment()==='production';const key=prod?(import.meta.env.PUBLIC_POSTHOG_KEY??WEBSITE_POSTHOG.key):import.meta.env.PUBLIC_POSTHOG_DEV_KEY;
  if(!key)return;
  state.mode=matchMedia('(max-width: 700px)').matches?'mobile':'website';
  state.route=routeOf(location.pathname,routes);state.campaign=campaignOf(location.search);state.referrer=externalReferrer(document.referrer);
  const qa=new URLSearchParams(location.search).get('qa_run');state.qa=qa&&/^webqa-[a-z0-9-]{1,60}$/.test(qa)?qa:cookie('st_website_qa');if(state.qa&&!/^webqa-[a-z0-9-]{1,60}$/.test(state.qa))state.qa=undefined;if(qa==='off'){state.qa=undefined;setCookie('st_website_qa','',0);}else if(state.qa)setCookie('st_website_qa',state.qa,1/48);
  readAttribution();if(Object.keys(state.campaign).length||state.referrer){const touch={...state.campaign,...(!state.campaign.utm_source&&state.referrer?{utm_source:new URL(state.referrer).hostname,utm_medium:'referral'}:{})};state.first??=touch;state.last=touch;saveAttribution();}
  dispatcher=createDispatcher({key,host:import.meta.env.PUBLIC_POSTHOG_HOST??WEBSITE_POSTHOG.host,allowed:()=>!blocked(),revision:()=>cookie('st_website_analytics_revision')??'initial',result:(event,status)=>{qaMark('stitchable-analytics-delivery',{event:event.event,id:event.properties.$insert_id,status});}});
  posthog.init(key,{
    api_host:import.meta.env.PUBLIC_POSTHOG_HOST??WEBSITE_POSTHOG.host,ui_host:'https://us.posthog.com',
    autocapture:false,capture_pageview:false,capture_pageleave:false,disable_session_recording:true,
    disable_surveys:true,disable_product_tours:true,disable_conversations:true,disable_external_dependency_loading:true,advanced_disable_flags:true,advanced_disable_feature_flags:true,
    get_current_url:()=>location.origin+state.route,disable_capture_url_hashes:true,
    capture_performance:false,capture_heatmaps:false,capture_dead_clicks:false,capture_exceptions:false,
    person_profiles:'never',save_referrer:false,save_campaign_params:false,
    persistence:'cookie',cross_subdomain_cookie:prod,secure_cookie:location.protocol==='https:',cookie_expiration:30,
    opt_out_capturing_persistence_type:'cookie',respect_dnt:true,request_batching:false,
    before_send:(payload)=>{if(blocked())return null;const clean=cleanPayload(payload,location.origin,state.route,state.referrer);if(clean){qaMark('stitchable-analytics-captured',{event:clean.event,id:clean.properties.$insert_id,properties:{...clean.properties,token:undefined}});dispatcher?.send(clean);}return null;},
  });
  state.initialized=true;
  ensureSdkCapture(posthog,!blocked());
  if(recordInitial&&!posthog.has_opted_out_capturing())trackPage(location.pathname,'initial');
}
function onLink(event:MouseEvent){
  if(!event.isTrusted)return;const el=event.target instanceof Element?event.target.closest('a'):null;if(!el?.href)return;
  let url:URL;try{url=new URL(el.href);}catch{return;}
  const destination=url.hostname==='platform.stitchable.ai'?'platform':url.hostname==='cal.com'?'calendar':url.hostname==='github.com'?'github':url.hostname==='stitchable.ai'&&location.hostname!=='stitchable.ai'?'stitchable':url.origin===location.origin?routeOf(url.pathname,routes):['chatgpt.com','claude.ai','gemini.google.com','grok.com'].includes(url.hostname)?'ai_tool':'external';
  const isCta=['/download/','/pricing/','platform','calendar','stitchable'].includes(destination);
  if(isCta||url.origin!==location.origin)capture(isCta?'cta_clicked':'outbound_clicked',{destination,placement:el.dataset.analyticsCta??(el.closest('header')?'header':el.closest('footer')?'footer':'content'),window_id:el.closest('[data-window-id]')?.getAttribute('data-window-id')??undefined,plan:safeTag(url.searchParams.get('plan'))??undefined,ict_stage:isCta?'transactional':'informational'});
  // Preserve bounded campaign tags on our platform handoff; never append visitor identifiers.
  if(url.hostname==='platform.stitchable.ai'&&!blocked()){for(const[k,v]of Object.entries(state.last??state.campaign))if(!url.searchParams.has(k))url.searchParams.set(k,v);el.href=url.href;}
}
