import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validateChirp,saveLibraryChirp,librarySource} from '../scripts/local-audio-library.mjs';
import {trimWav} from '../src/personal-recordings.js';
import {preferredDjSource,chirpVoice} from '../src/dj-library.js';
async function payload(){const buffer={duration:.65,length:31200,sampleRate:48000,numberOfChannels:1,getChannelData:()=>new Float32Array(31200).fill(.3)};const bytes=Buffer.from(await trimWav(buffer,0,.65).arrayBuffer());return {sourceId:'cardinal-xc121457-v1',name:'Cardinal chirp',start:1,end:1.65,volume:1,status:'draft',audioBase64:bytes.toString('base64')};}

test('chirp saving validates source, audio, bounds, duration and approval',async()=>{
 const p=await payload();assert.equal(validateChirp(p).source.birdId,'cardinal');assert.ok(librarySource('robin-original'));
 for(const changes of [{sourceId:'../../etc'},{name:''},{end:5},{start:-1},{volume:0},{status:'approved',confirmed:false},{audioBase64:'<script>'},{end:1.8}])assert.throws(()=>validateChirp({...p,...changes}));
 assert.equal(validateChirp({...p,status:'approved',confirmed:true}).duration,.65);
});
test('project drafts reopen and promote; editing approved chirps makes copies and preserves old assets',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'birdsong-chirps-'));
 try{
  await mkdir(path.join(root,'src/data'),{recursive:true});const p=await payload();
  const draft=await saveLibraryChirp(root,p);
  assert.match(draft.audio,/^\/__birdsong-library\/audio\//);assert.equal(draft.creator,'Jonathon Jongsma');assert.match(draft.note,/pitch unchanged/);
  assert.equal(JSON.parse(await readFile(path.join(root,'.birdsong-library/drafts.json'),'utf8'))[0].id,draft.id);
  const edited=await saveLibraryChirp(root,{...p,name:'Adjusted chirp',draftId:draft.id});assert.equal(edited.id,draft.id);
  const approved=await saveLibraryChirp(root,{...p,draftId:draft.id,status:'approved',confirmed:true});assert.equal(approved.id,draft.id);assert.match(approved.audio,/^\/audio\/chirps\//);
  assert.equal(JSON.parse(await readFile(path.join(root,'.birdsong-library/drafts.json'),'utf8')).length,0);
  const original=await readFile(path.join(root,'public',approved.audio));
  const copy=await saveLibraryChirp(root,{...p,status:'approved',confirmed:true,name:'Another version'});assert.notEqual(copy.id,approved.id);
  assert.deepEqual(await readFile(path.join(root,'public',approved.audio)),original);
  const published=JSON.parse(await readFile(path.join(root,'src/data/dj-chirps.json'),'utf8'));assert.equal(published.length,2);
  assert.equal(preferredDjSource('cardinal',published).id,copy.id);assert.equal(preferredDjSource('robin',published),null);assert.equal(chirpVoice(approved).id,`chirp:${approved.id}`);
  assert.equal(chirpVoice(approved).birdId,'cardinal');
 }finally{await rm(root,{recursive:true,force:true});}
});
