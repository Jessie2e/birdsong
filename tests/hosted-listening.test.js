import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/birdnet/',import.meta.url);
test('hosted model is complete and every redistributed asset matches its original checksum',async()=>{const manifest=JSON.parse(await readFile(new URL('SOURCES.json',root),'utf8'));assert.equal(manifest.modified,false);assert.equal(manifest.license,'CC BY-NC-SA 4.0');for(const file of manifest.files){const bytes=await readFile(new URL(file.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);}for(const path of ['model.json','area-model/model.json']){const model=JSON.parse(await readFile(new URL(path,root),'utf8'));for(const group of model.weightsManifest)for(const shard of group.paths)assert.ok((await readFile(new URL(shard,new URL(path,root)))).length>0);}const license=await readFile(new URL('LICENSE.txt',root),'utf8');assert.match(license,/NonCommercial/);});
