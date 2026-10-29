import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {djChirps,preferredDjSource,chirpVoice} from '../src/dj-library.js';

test('approved chirps retain credited, intact, playable PCM assets',async()=>{
 assert.ok(djChirps.length>=8);assert.equal(new Set(djChirps.map(c=>c.id)).size,djChirps.length);
 for(const clip of djChirps){
  assert.ok(clip.creator&&clip.license&&clip.sourceUrl&&clip.sourceId);
  assert.match(clip.audio,/^\/audio\/chirps\/chirp-[\w-]+\.wav$/);
  const wav=await readFile(new URL('../public'+clip.audio,import.meta.url));
  assert.equal(createHash('sha256').update(wav).digest('hex'),clip.sha256);
  assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');
  assert.equal(wav.readUInt16LE(20),1);assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt32LE(24),48000);
  assert.ok(Math.abs((wav.length-44)/96000-clip.duration)<.0001);
  let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));assert.ok(peak>0);
 }
});
test('latest approved chirp becomes preferred while older cuts retain stable identities',()=>{
 const clips=[{id:'old',birdId:'cardinal'},{id:'other',birdId:'robin'},{id:'new',birdId:'cardinal'}];
 assert.equal(preferredDjSource('cardinal',clips).id,'new');assert.equal(preferredDjSource('unknown',clips),null);
 const old=chirpVoice({...clips[0],audio:'/old.wav',duration:.3});assert.equal(old.id,'chirp:old');assert.equal(old.birdId,'cardinal');assert.equal(old.audio,'/old.wav');assert.equal(old.isChirp,true);assert.equal(clips.length,3);
});
