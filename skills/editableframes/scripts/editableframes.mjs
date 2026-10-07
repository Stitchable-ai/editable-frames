#!/usr/bin/env node
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));let root=path.resolve(here,'../../..');
try{root=JSON.parse(await fs.readFile(path.join(here,'checkout.json'),'utf8')).root}catch(e){if(e.code!=='ENOENT')throw e}
process.argv[1]=path.join(root,'bin/editableframes.mjs');await import(pathToFileURL(process.argv[1]).href);
