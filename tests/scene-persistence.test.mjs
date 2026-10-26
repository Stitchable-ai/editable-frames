import test from 'node:test';
import assert from 'node:assert/strict';
import {createScenePersistence} from '../examples/scene-editor/persistence.mjs';
const denied=()=>new DOMException("Failed to execute 'request' on 'LockManager': Access to the Locks API is denied in this context.",'SecurityError');
const storage=()=>{const entries=new Map();return {entries,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};};
test('absent or inaccessible Locks API uses memory without accessing storage',async()=>{
 for(const getLocks of [()=>undefined,()=>{throw denied();}]){let actions=0;const p=createScenePersistence({getLocks,getStorage:()=>{throw Error('Must not access storage');}});assert.equal(await p.initialize(),false);assert.equal(await p.run('scene',()=>++actions),1);assert.equal(actions,1);}
});
test('exposed but denied lock requests fall back for synchronous and asynchronous errors',async()=>{
 for(const asyncFailure of [false,true]){let requests=0;const p=createScenePersistence({getLocks:()=>({request(){requests++;if(asyncFailure)return Promise.reject(denied());throw denied();}}),getStorage:()=>{throw Error('Must not access storage');}});assert.equal(await p.initialize(),false);let actions=0;await p.run('scene',()=>actions++);assert.equal(actions,1);assert.equal(requests,1);assert.equal(p.storage,null);}
});
test('unavailable storage also chooses memory and successful probes remove their key',async()=>{
 const store=storage(),locks={request:async(_key,action)=>action()};const good=createScenePersistence({getLocks:()=>locks,getStorage:()=>store});assert.equal(await good.initialize(),true);assert.equal(store.entries.size,0);assert.equal(good.storage,store);
 const bad=createScenePersistence({getLocks:()=>locks,getStorage:()=>({setItem(){throw denied();}})});assert.equal(await bad.initialize(),false);assert.equal(bad.storage,null);
});
test('permission revoked before a transaction callback switches to memory once',async()=>{
 let requests=0,actions=0;const p=createScenePersistence({getLocks:()=>({request:async(_key,action)=>{if(++requests>1)throw denied();return action();}}),getStorage:storage});assert.equal(await p.initialize(),true);
 await p.run('scene',()=>{actions++;assert.equal(p.supported,false);assert.equal(p.storage,null);});await p.run('scene',()=>actions++);assert.equal(actions,2);assert.equal(requests,2);
});
test('callback failures never fall back or replay a transaction',async()=>{
 const p=createScenePersistence({getLocks:()=>({request:async(_key,action)=>action()}),getStorage:storage});await p.initialize();let actions=0;
 await assert.rejects(p.run('scene',()=>{actions++;throw denied();}),{name:'SecurityError'});assert.equal(actions,1);assert.equal(p.supported,true);
});
test('rejection after the callback ran preserves the uncertain outcome without replay',async()=>{
 let requests=0,actions=0;const p=createScenePersistence({getLocks:()=>({request:async(_key,action)=>{const value=action();if(++requests>1)throw denied();return value;}}),getStorage:storage});await p.initialize();
 await assert.rejects(p.run('scene',()=>++actions),{name:'SecurityError'});assert.equal(actions,1);assert.equal(p.supported,true);
});
