import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignOf,ensureSdkCapture,cleanPayload,cleanProperties,externalReferrer,routeOf,safeTag,searchBucket,WEBSITE_EVENTS} from '../src/lib/analytics-core.ts';
test('only registered event names can leave the browser',()=>{for(const name of ['$identify','$autocapture','$snapshot','$exception','chat_message'])assert.equal(cleanPayload({event:name,properties:{}},'https://stitchable.ai','/'),null);assert(WEBSITE_EVENTS.has('demo_first_manual_edit'));});
test('unknown freeform and sensitive fields are removed',()=>{const input={prompt:'private',text:'secret',email:'someone@example.com',path:'../private',values:{color:'red'},example_id:'reference.castle',format:'png',is_embedded:true,result_count:0};assert.deepEqual(cleanProperties(input),{example_id:'reference.castle',format:'png',is_embedded:true,result_count:0});});
test('queries fragments titles and SDK extras cannot leak',()=>{const event=cleanPayload({event:'$pageview',$set_once:{url:'TOP_SECRET'},$set:{email:'TOP_SECRET'},properties:{$current_url:'https://stitchable.ai/?token=SECRET#private',$referrer:'https://example.com/private?email=SECRET',$session_entry_url:'SECRET',$initial_current_url:'SECRET',$title:'SECRET',$set:{email:'SECRET'},$elements:[{text:'SECRET'}],token:'phc_writeonly',$session_id:'session',distinct_id:'anonymous',surface:'marketing_site'}},'https://stitchable.ai','/pricing/','https://example.com');assert(!JSON.stringify(event).includes('SECRET'));assert.equal(event.properties.$current_url,'https://stitchable.ai/pricing/');assert.equal(event.properties.$session_id,'session');assert.equal(event.properties.token,'phc_writeonly');assert(!('$set_once' in event));assert.equal(event.properties.$process_person_profile,false);});
test('known routes are canonical and unknown paths are normalized',()=>{assert.equal(routeOf('/pricing',['/pricing/']),'/pricing/');assert.equal(routeOf('/i/private-token',['/pricing/']),'/other/');});
test('source tags allow campaign IDs but reject emails URLs and contents',()=>{assert.deepEqual(campaignOf('?utm_source=blog&utm_campaign=launch-1&token=SECRET&utm_content=user%40example.com&utm_term=https%3A%2F%2Fprivate'),{utm_source:'blog',utm_campaign:'launch-1'});assert.equal(safeTag('a'.repeat(97)),undefined);});
test('internal movement is not a fresh external referral',()=>{for(const value of ['https://stitchable.ai/','https://editableframes.stitchable.ai/?utm_source=fake','https://platform.stitchable.ai/'])assert.equal(externalReferrer(value),undefined);assert.equal(externalReferrer('https://www.youtube.com/watch?v=private'),'https://www.youtube.com');assert.equal(externalReferrer('javascript:alert(1)'),undefined);});
test('search records buckets and finite counts only',()=>{assert.deepEqual([0,3,15,100].map(searchBucket),['empty','1-9','10-29','30-plus']);assert.deepEqual(cleanProperties({query:'secret',result_count:NaN,query_length_bucket:searchBucket(15)}),{query_length_bucket:'10-29'});});

test('canonical CTA destinations survive filtering',()=>{assert.equal(cleanProperties({destination:'/download/'}).destination,'/download/');});

test('catalog example IDs retain their bounded namespace',()=>{assert.equal(cleanProperties({example_id:'stitchable/kingdom-in-miniature'}).example_id,'stitchable/kingdom-in-miniature');assert.deepEqual(cleanProperties({example_id:'../private/file'}),{});});

test('shared regrant restores each project SDK without reviving old delivery work',()=>{
  const sdk=()=>({off:false,calls:0,has_opted_out_capturing(){return this.off},opt_in_capturing(options){assert.deepEqual(options,{captureEventName:false});this.off=false;this.calls++}});
  const main=sdk(),editable=sdk();main.off=true;
  assert.equal(ensureSdkCapture(main,false),false);assert.equal(main.calls,0);
  assert.equal(ensureSdkCapture(editable,true),true);assert.equal(editable.calls,0);
  assert.equal(ensureSdkCapture(main,true),true);assert.equal(main.off,false);assert.equal(main.calls,1);
  ensureSdkCapture(main,true);assert.equal(main.calls,1);
});
