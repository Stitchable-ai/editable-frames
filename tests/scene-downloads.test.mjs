import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneDownloads} from '../website/vendor/scene-downloads.mjs';
import {environmentPreview} from '../packages/three/environment-image.mjs';
import {DataUtils,HalfFloatType} from 'three';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('preview lighting reduces image size while averaging linear half-float energy',()=>{
 const data=new Uint16Array(4*2*4);for(let i=0;i<8;i++)data.set([i%4<2?2:10,4,8,1].map(DataUtils.toHalfFloat),i*4);
 const image={data,width:4,height:2,type:HalfFloatType},result=environmentPreview(image,1);
 assert.equal(environmentPreview(image,4),image);assert.equal(result.width,1);assert.equal(result.height,1);assert.deepEqual([...result.data].map(DataUtils.fromHalfFloat),[6,4,8,1]);assert.equal(image.data.length,32);
});

test('scene progress combines real streamed bytes, deduplicates requests and reuses downloads',async()=>{
 const streams=new Map(),requests=[],progress=[];
 const downloads=createSceneDownloads({fetcher:async url=>{requests.push(url);return new Response(new ReadableStream({start(controller){streams.set(url,controller)}}))}});
 const unwatch=downloads.watch(['/hdr','/phone'],{'/hdr':4,'/phone':6},p=>progress.push(p));
 const hdr=downloads.buffer('/hdr'),phone=downloads.buffer('/phone');assert.equal(downloads.buffer('/phone'),phone);
 await pause(0);assert.deepEqual(requests,['/hdr','/phone']);
 streams.get('/phone').enqueue(new Uint8Array(3));await pause(0);assert.equal(progress.at(-1).percent,30);assert.equal(progress.at(-1).loaded,3);
 streams.get('/hdr').enqueue(new Uint8Array(4));streams.get('/hdr').close();await hdr;assert.equal(progress.at(-1).percent,70);
 streams.get('/phone').enqueue(new Uint8Array(3));await pause(0);assert.equal(progress.at(-1).percent,99,'Receiving bytes is distinct from successful completion');
 streams.get('/phone').close();await phone;assert.deepEqual(progress.at(-1),{phase:'preparing',loaded:10,total:10,percent:100});
 assert.equal((await downloads.buffer('/phone')).byteLength,6);assert.equal(requests.length,2);
 const count=progress.length;unwatch();downloads.watch(['/hdr'],{'/hdr':4},()=>{});assert.equal(progress.length,count);downloads.dispose();
});

test('compressed Content-Length never becomes an invented decoded-byte percentage',async()=>{
 const progress=[];const downloads=createSceneDownloads({fetcher:async()=>new Response(new Uint8Array(20),{headers:{'content-encoding':'gzip','content-length':'5'}})});
 downloads.watch(['/asset'],{'/asset':20},p=>progress.push(p));await downloads.buffer('/asset');
 assert(progress.every(p=>p.total===20));assert.equal(progress.at(-1).percent,100);downloads.dispose();
});

test('unknown totals stay indeterminate until the response really completes',async()=>{
 let stream;const progress=[],downloads=createSceneDownloads({fetcher:async()=>new Response(new ReadableStream({start(c){stream=c}}))});
 downloads.watch(['/asset'],{},p=>progress.push(p));const pending=downloads.buffer('/asset');await pause(0);stream.enqueue(new Uint8Array(8));await pause(0);
 assert.equal(progress.at(-1).percent,null);stream.close();await pending;assert.equal(progress.at(-1).percent,100);assert.equal(progress.at(-1).loaded,8);downloads.dispose();
});

test('failed and incomplete downloads can retry instead of keeping a rejected promise',async()=>{
 let attempts=0;const downloads=createSceneDownloads({fetcher:async()=>{attempts++;return attempts===1?new Response('unavailable',{status:503}):new Response(new Uint8Array(attempts===2?2:4))}});
 downloads.watch(['/asset'],{'/asset':4},()=>{});await assert.rejects(downloads.buffer('/asset'),/503/);await assert.rejects(downloads.buffer('/asset'),/incomplete/);
 assert.equal((await downloads.buffer('/asset')).byteLength,4);assert.equal(attempts,3);downloads.dispose();
});

test('a stalled response aborts and rejects rather than leaving the loading screen forever',async()=>{
 let signal;const downloads=createSceneDownloads({idleTimeout:20,fetcher:async(_url,options)=>{signal=options.signal;return new Response(new ReadableStream({start(){}}))}});
 downloads.watch(['/asset'],{'/asset':4},()=>{});await assert.rejects(downloads.buffer('/asset'),/stalled/);assert.equal(signal.aborted,true);downloads.dispose();
});
