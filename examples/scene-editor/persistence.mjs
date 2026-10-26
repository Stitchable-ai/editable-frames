/** Browser persistence needs usable locks and storage, not just API presence.
 * Without them, edits stay in memory and the host offers explicit JSON export. */
export function createScenePersistence({getLocks=()=>navigator.locks,getStorage=()=>localStorage}={}) {
 let locks=null,storage=null,supported=false;
 return {
  get supported(){return supported;},
  get storage(){return storage;},
  async initialize(){
   try{
    locks=getLocks();if(typeof locks?.request!=='function')return false;
    await locks.request('editableframes.scene-editor.storage-probe',()=>{
     const candidate=getStorage(),key='editableframes.scene-editor.probe.'+crypto.randomUUID();
     candidate.setItem(key,'1');candidate.removeItem(key);storage=candidate;
    });
    supported=true;
   }catch{supported=false;storage=null;}
   return supported;
  },
  async run(key,action){
   if(!supported)return action();
   let entered=false;
   try{return await locks.request(key,()=>{entered=true;return action();});}
   catch(error){
    // Only fall back if no transaction callback ran. Never retry a potentially
    // published edit merely because the lock promise rejected afterwards.
    if(!entered&&['SecurityError','NotAllowedError'].includes(error?.name)){
     supported=false;storage=null;return action();
    }
    if(!entered)error.definite=true;
    throw error;
   }
  }
 };
}
