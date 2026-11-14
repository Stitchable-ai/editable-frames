import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {chromiumOptions} from '../scripts/browser.mjs';

test('managed browser is the default and no path is guessed',()=>{
 assert.deepEqual(chromiumOptions({}),{});
 assert.deepEqual(chromiumOptions({EDITABLEFRAMES_CHROMIUM_EXECUTABLE:''}),{});
});
test('configured browser preserves an existing absolute path including spaces',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ef-browser-'));
 try {const file=path.join(dir,'Browser With Spaces');fs.writeFileSync(file,'fixture only');assert.deepEqual(chromiumOptions({EDITABLEFRAMES_CHROMIUM_EXECUTABLE:file}),{executablePath:file});}
 finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('bad explicit configuration is rejected rather than silently falling back',()=>{
 assert.throws(()=>chromiumOptions({EDITABLEFRAMES_CHROMIUM_EXECUTABLE:'relative/chrome'}),/absolute/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ef-browser-'));
 try {assert.throws(()=>chromiumOptions({EDITABLEFRAMES_CHROMIUM_EXECUTABLE:dir}),/file/);assert.throws(()=>chromiumOptions({EDITABLEFRAMES_CHROMIUM_EXECUTABLE:path.join(dir,'missing')}),/existing/);}
 finally {fs.rmSync(dir,{recursive:true,force:true});}
});
