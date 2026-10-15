import test from 'node:test';
import assert from 'node:assert/strict';
import {learningEligible} from '../src/learning-audio.js';
import {phraseProvenance,renderPhrase} from '../src/phrase-audio.js';
import {personalRounds} from '../src/personal-recordings.js';
import {appendMemoryNote,memoryAnswer} from '../src/bird-memory.js';
test('pitch history survives editing a copy and always excludes a phrase from learning',()=>{
 const p={kind:'phrase',birdId:'cardinal',confirmed:true,pitchEdited:false};assert.equal(learningEligible(p),true);assert.equal(learningEligible({...p,confirmed:false}),false);assert.equal(learningEligible({...p,birdId:null}),false);
 assert.equal(phraseProvenance({},5).pitchEdited,true);assert.equal(phraseProvenance({},0,true).pitchEdited,true);assert.equal(phraseProvenance({pitchEdited:true},0).pitchEdited,true);assert.equal(learningEligible({...p,pitchEdited:true,enabled:true}),false);
 const result=personalRounds([{correct:{id:'cardinal',audio:'reference'}}],[{...p,pitchEdited:true,enabled:true,audio:'shifted',id:'x'}],()=>0);assert.equal(result[0].correct.audio,'reference');
});
test('phrase rendering bakes volume, pitch, trim and resulting duration into a mono WAV',async()=>{
 const original=globalThis.OfflineAudioContext;let node,gainNode;
 globalThis.OfflineAudioContext=class {constructor(channels,length,rate){this.length=length;this.rate=rate;}createBufferSource(){node={playbackRate:{},connect(){},start(...args){this.args=args;}};return node;}createGain(){gainNode={gain:{},connect(){}};return gainNode;}async startRendering(){return {duration:this.length/this.rate,length:this.length,sampleRate:this.rate,numberOfChannels:1,getChannelData:()=>new Float32Array(this.length).fill(.2)};}};
 try{const result=await renderPhrase({duration:10},{start:2,end:4,volume:1.5,pitch:12});assert.equal(node.playbackRate.value,2);assert.equal(gainNode.gain.value,1.5);assert.deepEqual(node.args,[0,2,2]);assert.equal(result.duration,1);assert.equal(result.blob.type,'audio/wav');await assert.rejects(()=>renderPhrase({duration:10},{start:0,end:11,volume:1,pitch:0}));}
 finally{globalThis.OfflineAudioContext=original;}
});
test('memory rounds add exactly one valid pad and score only the complete correct sequence',()=>{
 const start=[0,3];assert.deepEqual(appendMemoryNote(start,()=>.5),[0,3,2]);assert.deepEqual(start,[0,3]);assert.equal(memoryAnswer([0,3],0,0),'continue');assert.equal(memoryAnswer([0,3],1,3),'complete');assert.equal(memoryAnswer([0,3],1,2),'miss');
});
test('source swaps refresh the audio cache instead of replaying the previous lane bird',async()=>{
 const {StudioAudio}=await import('../src/studio-audio.js');const originalAC=globalThis.AudioContext,originalFetch=globalThis.fetch;let calls=[];
 globalThis.AudioContext=class {async decodeAudioData(bytes){return {value:new Uint8Array(bytes)[0]};}};
 globalThis.fetch=async url=>{calls.push(url);return {ok:true,arrayBuffer:async()=>new Uint8Array([url==='one'?1:2]).buffer};};
 try{const engine=new StudioAudio(()=>{});assert.equal((await engine.load({id:'lane-0',audio:'one'})).value,1);assert.equal((await engine.load({id:'lane-0',audio:'two'})).value,2);await engine.load({id:'lane-0',audio:'two'});assert.deepEqual(calls,['one','two']);}finally{globalThis.AudioContext=originalAC;globalThis.fetch=originalFetch;}
});
