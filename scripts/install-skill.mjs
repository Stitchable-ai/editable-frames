import fs from 'node:fs/promises';import path from 'node:path';import {root} from './build.mjs';
export async function install(agent,target){
 if(!['codex','claude','grok','generic'].includes(agent)||!target)throw Error('Specify agent and exact new skill folder');
 const dest=path.resolve(target);try{await fs.stat(dest);throw Error('Destination exists; choose a new skill folder')}catch(e){if(e.code!=='ENOENT')throw e}
 await fs.cp(path.join(root,'skills/editableframes'),dest,{recursive:true,errorOnExist:true,force:false});
 await fs.writeFile(path.join(dest,'scripts/checkout.json'),JSON.stringify({root},null,2));return {agent,skill:dest,checkout:root,installed:true};
}
