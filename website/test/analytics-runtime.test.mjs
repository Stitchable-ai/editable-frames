import test from 'node:test';
import assert from 'node:assert/strict';
import {website} from './helpers/website-runtime.mjs';
const origin='https://editableframes.stitchable.ai';
test('saved creative and content attribution survives an untagged page load',()=>{
 const jar=new Map(),first=website(origin+'/?utm_source=email&utm_campaign=launch&utm_content=video-a&utm_term=founders&content_id=clip17',jar);first.api.initAnalytics();
 const next=website(origin+'/privacy/',jar);next.api.initAnalytics();next.api.capture('agent_setup_copied',{agent_id:'claude'});
 const p=next.deliveries.at(-1).properties;
 for(const prefix of ['first','last']){assert.equal(p[prefix+'_campaign'],'launch');assert.equal(p[prefix+'_content'],'video-a');assert.equal(p[prefix+'_term'],'founders');assert.equal(p[prefix+'_content_id'],'clip17');}
 assert.equal(p.utm_content,undefined,'raw URL tags still describe only the current page');
 const newer=website(origin+'/?utm_source=blog&utm_campaign=second&utm_content=video-b&content_id=clip18',jar);newer.api.initAnalytics();const q=newer.deliveries[0].properties;assert.equal(q.first_content,'video-a');assert.equal(q.last_content,'video-b');assert.equal(q.first_content_id,'clip17');assert.equal(q.last_content_id,'clip18');
});
test('an action wakes a cold tab after another tab re-enables the shared choice',()=>{
 const jar=new Map([['st_website_analytics','off']]),tab=website(origin+'/',jar);tab.api.initAnalytics();tab.api.capture('template_selected',{example_id:'castle'});assert.equal(tab.initializations(),0);assert.equal(tab.deliveries.length,0);
 jar.set('st_website_analytics','on');tab.api.capture('template_selected',{example_id:'castle'});assert.equal(tab.initializations(),1);assert.deepEqual(tab.deliveries.map(e=>e.event),['$pageview','template_selected']);
 tab.window.dispatchEvent(new Event('focus'));assert.equal(tab.initializations(),1);assert.equal(tab.document.listenerCount('click'),1);
});
test('focus and a first CTA click wake dormant tabs without reload or duplicate listeners',()=>{
 for(const method of ['focus','visibility','click']){const jar=new Map([['st_website_analytics','off']]),tab=website(origin+'/',jar);tab.api.initAnalytics();tab.api.initAnalytics();jar.set('st_website_analytics','on');if(method==='focus')tab.window.dispatchEvent(new Event('focus'));else if(method==='visibility')tab.document.dispatchEvent(new Event('visibilitychange'));else tab.click('https://platform.stitchable.ai/account');assert.equal(tab.initializations(),1);assert.equal(tab.deliveries.filter(e=>e.event==='$pageview').length,1);if(method==='click')assert.equal(tab.deliveries.filter(e=>e.event==='cta_clicked').length,1);assert.equal(tab.document.listenerCount('click'),1);}
});
test('wake-up handlers honor Off, DNT and GPC without initializing or sending',()=>{
 for(const privacy of [{},{doNotTrack:'1'},{globalPrivacyControl:true}]){const jar=new Map([['st_website_analytics',Object.keys(privacy).length?'on':'off']]),tab=website(origin+'/',jar,privacy);tab.api.initAnalytics();tab.window.dispatchEvent(new Event('focus'));tab.click('https://platform.stitchable.ai/account');tab.api.capture('template_selected',{example_id:'castle'});assert.equal(tab.initializations(),0);assert.equal(tab.deliveries.length,0);}
});
