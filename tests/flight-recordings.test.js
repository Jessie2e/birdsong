import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {referenceRecordings,variedReferenceRounds} from '../src/flight-recordings.js';
import {learningRecordings} from '../src/data/learning-recordings.js';
import {starterBirds} from '../src/flock.js';
import {planFlight} from '../src/progress.js';
import {personalRounds} from '../src/personal-recordings.js';
const bird={id:'bird',audio:'original',mnemonic:'A familiar cue'};
const catalog=[{id:'alternate',birdId:'bird',audio:'another'}];
const makeRound=()=>({correct:bird,options:[bird,{id:'other'}]});

test('references alternate within a flight, keep targets/options unchanged and never mutate input',()=>{
 const rounds=Array.from({length:10},makeRound);
 const result=variedReferenceRounds(rounds,[],catalog,()=>0);
 assert.equal(result.length,10);
 assert.deepEqual(result.map(r=>r.correct.recordingId),Array.from({length:10},(_,i)=>i%2?'alternate':'bird-original'));
 result.forEach((r,i)=>{assert.equal(r.options,rounds[i].options);assert.equal(r.correct.id,bird.id);assert.equal(r.correct.mnemonic,bird.mnemonic);});
 assert.equal(bird.audio,'original');assert.equal(bird.recordingId,undefined);
});

test('new flights avoid the last reference recording for that bird, including legacy history',()=>{
 for(const recordingId of ['bird-original',undefined]){
  const history=[{birdId:'bird',correct:true,mode:'flight',recordingId}];
  assert.equal(variedReferenceRounds([makeRound()],history,catalog,()=>0)[0].correct.recordingId,'alternate');
 }
 assert.equal(variedReferenceRounds([makeRound()],[{birdId:'bird',mode:'flight',recordingId:'alternate'}],catalog,()=>0)[0].correct.recordingId,'bird-original');
});

test('least-used reference examples get a turn, while unrelated and personal histories are ignored',()=>{
 const more=[...catalog,{id:'third',birdId:'bird',audio:'third-source'}];
 const history=[{birdId:'bird',mode:'flight',recordingId:'alternate'},{birdId:'bird',mode:'flight',recordingId:'bird-original'}, {birdId:'other',mode:'flight',recordingId:'third'},{birdId:'bird',mode:'nearby',recordingId:'third'},{birdId:'bird',mode:'flight',recordingId:'personal-clip'}];
 const snapshot=structuredClone(history);
 assert.equal(variedReferenceRounds([makeRound()],history,more,()=>0)[0].correct.recordingId,'third');
 assert.deepEqual(history,snapshot);
});

test('invalid, disabled and duplicate audio choices never enter the eligible pool',()=>{
 const noisy=[...catalog,{...catalog[0]},{id:'duplicate-source',birdId:'bird',audio:'another'},{id:'bad',birdId:'other',audio:'wrong-species'},{id:'disabled',birdId:'bird',audio:'off',enabled:false},{id:'missing',birdId:'bird'}, {id:'bird-original',birdId:'bird',audio:'overridden'}];
 assert.deepEqual(referenceRecordings(bird,noisy).map(r=>r.id),['bird-original','alternate']);
});

test('birds without alternates keep their original recording and birds without audio remain untouched',()=>{
 assert.equal(variedReferenceRounds([makeRound()],[],[],()=>0)[0].correct.audio,'original');
 const unavailable={correct:{id:'missing'},options:[]};
 assert.equal(variedReferenceRounds([unavailable],[],[],()=>0)[0],unavailable);
});

test('personal recordings stay opt-in, unmodified, and capped at three after variety planning',()=>{
 const rounds=Array.from({length:10},makeRound),clips=[{id:'personal',birdId:'bird',audio:'blob:personal',enabled:true}];
 const personal=personalRounds(rounds,clips,()=>0);
 const mixed=variedReferenceRounds(personal,[],catalog,()=>0);
 assert.equal(mixed.filter(r=>r.correct.personal).length,3);
 for(let i=0;i<3;i++){assert.equal(mixed[i],personal[i]);assert.equal(mixed[i].correct.audio,'blob:personal');assert.equal(mixed[i].correct.recordingId,'personal');}
 assert.equal(mixed[3].correct.recordingId,'bird-original');
 assert.equal(mixed[4].correct.recordingId,'alternate');
 assert.ok(variedReferenceRounds(personalRounds(rounds,[{...clips[0],enabled:false}],()=>0),[],catalog,()=>0).every(r=>!r.correct.personal));
});

test('variety decorates the existing ten-question flight plan without changing the species or focus',()=>{
 const pool=Array.from({length:22},(_,i)=>({id:`bird-${i}`,audio:`audio-${i}`}));
 const planned=planFlight(pool,[],10,'bird-21'),varied=variedReferenceRounds(planned,[],[],()=>0);
 assert.deepEqual(varied.map(r=>r.correct.id),planned.map(r=>r.correct.id));
 assert.ok(varied.some(r=>r.correct.id==='bird-21'));
});

test('all eight starter alternates have complete attribution and intact, nonempty PCM audio',()=>{
 assert.deepEqual([...learningRecordings.map(r=>r.birdId)].sort(),[...starterBirds].sort());
 assert.equal(new Set(learningRecordings.map(r=>r.id)).size,8);
 for(const recording of learningRecordings){
  assert.ok(recording.creator&&recording.sourceUrl.startsWith('https://commons.wikimedia.org/')&&recording.license&&recording.sourceSha1);
  assert.ok(recording.license.toLowerCase()==='public domain'||recording.licenseUrl.startsWith('https://creativecommons.org/licenses/by-sa/'));
  assert.equal(recording.edited,true);
  const bytes=readFileSync(new URL(`../public${recording.audio}`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),recording.sha256);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
  assert.equal(bytes.readUInt16LE(20),1);assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt32LE(24),32000);assert.equal(bytes.readUInt16LE(34),16);
  assert.ok(recording.duration>=3&&recording.duration<=12.01);
  let peak=0;for(let offset=44;offset<bytes.length;offset+=2)peak=Math.max(peak,Math.abs(bytes.readInt16LE(offset)));
  assert.ok(peak>1000&&peak<32767,'audible waveform without PCM clipping');
 }
});
