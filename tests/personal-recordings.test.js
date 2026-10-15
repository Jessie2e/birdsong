import test from 'node:test';
import assert from 'node:assert/strict';
import {trimWav,personalRounds} from '../src/personal-recordings.js';
import {planFlight} from '../src/progress.js';
const buffer={duration:2,length:200,sampleRate:100,numberOfChannels:2,getChannelData:()=>new Float32Array(200).fill(.5)};
test('trimmed calls produce playable mono PCM WAV with the selected duration and faded edges',async()=>{
 const blob=trimWav(buffer,.5,1.5),v=new DataView(await blob.arrayBuffer());assert.equal(blob.type,'audio/wav');assert.equal(blob.size,244);assert.equal(v.getUint32(24,true),100);assert.equal(v.getUint16(22,true),1);assert.equal(v.getInt16(44,true),0);assert.equal(v.getInt16(242,true),0);assert.ok(v.getInt16(100,true)>0);
});
test('invalid trim boundaries are rejected rather than saving empty or wrong excerpts',()=>{
 for(const [start,end] of [[-1,1],[0,3],[1,1.2],[NaN,2],[1.5,1]])assert.throws(()=>trimWav(buffer,start,end));
});
test('personal audio is opt-in, matches the target species and never replaces more than three flight questions',()=>{
 const rounds=Array.from({length:10},()=>({correct:{id:'crow',audio:'reference'},options:[{id:'crow'}]}));
 const clips=[{id:'personal',birdId:'crow',enabled:true,audio:'blob:test'},{id:'wrong',birdId:'wren',enabled:true,audio:'wrong'}];
 const result=personalRounds(rounds,clips,()=>0);assert.equal(result.filter(r=>r.correct.personal).length,3);assert.ok(result.slice(3).every(r=>r.correct.audio==='reference'));assert.equal(result[0].correct.recordingId,'personal');assert.equal(result[0].options,rounds[0].options);assert.equal(rounds[0].correct.audio,'reference');assert.ok(personalRounds(rounds,[{...clips[0],enabled:false}],()=>0).every(r=>!r.correct.personal));
});
test('an adventure bird stays in the bounded flight even with many other developing voices',()=>{
 const birds=Array.from({length:30},(_,i)=>({id:`bird-${i}`}));const result=planFlight(birds,[],10,'bird-29');assert.equal(result.length,10);assert.ok(result.some(r=>r.correct.id==='bird-29'));assert.ok(new Set(result.map(r=>r.correct.id)).size<=6);
});

import {nextAdventure} from '../src/next-adventure.js';
test('adventures move from a focused crow reward to comparisons and then the next developing voice',()=>{
 const birds=[{id:'american-crow',commonName:'American Crow'},{id:'robin',commonName:'American Robin'}],flock=birds.map(b=>b.id);
 assert.equal(nextAdventure(birds,[],[],flock).birdId,'american-crow');
 const history=Array.from({length:5},(_,i)=>({birdId:'american-crow',correct:i<4,mode:'flight',sessionId:i<3?'a':'b'}));
 assert.equal(nextAdventure(birds,history,[],flock).route,'compare');
 assert.equal(nextAdventure(birds,history,[{mode:'sound-alikes',pairId:'cardinal-finch',score:5}],flock).birdId,'robin');
});
