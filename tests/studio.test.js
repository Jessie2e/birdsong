import test from 'node:test';
import assert from 'node:assert/strict';
import { excerpt, studioUnlocked } from '../src/studio-audio.js';
const context = {createBuffer(channels,length,rate) { const data = Array.from({length:channels},()=>new Float32Array(length)); return {length,sampleRate:rate,getChannelData:c=>data[c]}; }};
test('phrase trimming clamps at recording end and fades both edges on every channel',()=>{
  const input = {duration:2,length:200,sampleRate:100,numberOfChannels:2,getChannelData:c=>new Float32Array(200).fill(c ? .5 : 1)};
  const cut = excerpt(input,1.5,2,context);
  assert.equal(cut.length,50); assert.equal(cut.getChannelData(0)[0],0); assert.equal(cut.getChannelData(1).at(-1),0);
  assert.equal(cut.getChannelData(0)[20],1); assert.equal(cut.getChannelData(1)[20],.5);
  assert.equal(excerpt(input,10,1,context).length,10);
});
test('studio reward requires the saved achievement or recognition of both reward birds',()=>{
  const recognize=(history,id)=>history.includes(id);
  assert.equal(studioUnlocked(false,[],recognize),false);
  assert.equal(studioUnlocked(false,['robin'],recognize),false);
  assert.equal(studioUnlocked(false,['robin','carolina-wren'],recognize),true);
  assert.equal(studioUnlocked(true,[],recognize),true);
});
test('cancelling while a voice loads prevents delayed preview audio',async()=>{
  const {StudioAudio} = await import('../src/studio-audio.js');
  const original = globalThis.AudioContext;
  globalThis.AudioContext = class {async resume(){} async close(){}};
  try {
    const engine = new StudioAudio(()=>{}); let finish, sounds = 0;
    engine.load = ()=>new Promise(resolve=>{finish=resolve;}); engine.sound = ()=>sounds++;
    const pending = engine.preview({id:'cardinal'},0,2);
    await Promise.resolve(); engine.stop(); finish({duration:3}); await pending;
    assert.equal(sounds,0);
  } finally { globalThis.AudioContext=original; }
});

test('duplicate bird lanes keep independent entry beats and shifted phrase timing',async()=>{
  const {StudioAudio}=await import('../src/studio-audio.js');
  const originalContext=globalThis.AudioContext, originalInterval=globalThis.setInterval;
  let schedule;
  globalThis.setInterval=fn=>{schedule=fn;return 1;};
  globalThis.AudioContext=class {constructor(){this.currentTime=0;}async resume(){} async close(){} createBuffer(...args){return {...context.createBuffer(...args),duration:args[1]/args[2]};}};
  try {
    const engine=new StudioAudio(()=>{}), calls=[];
    const buffer={duration:3,length:300,sampleRate:100,numberOfChannels:1,getChannelData:()=>new Float32Array(300).fill(.5)};
    engine.load=async()=>buffer;engine.cacheBuffer={'lane-0':buffer,'lane-1':buffer};
    engine.sound=(clip,time,volume,pitch)=>calls.push({time,volume,pitch});
    await engine.start([{id:'lane-0'},{id:'lane-1'}],100,'none',()=>({'lane-0':{enabled:true,step:0,start:0,length:2,volume:.3,pitch:12},'lane-1':{enabled:true,step:0,start:0,length:2,volume:.6,pitch:0}}));
    schedule();assert.equal(calls.length,2);assert.equal(calls[0].time,calls[1].time);assert.equal(calls[0].pitch,12);assert.equal(calls[1].volume,.6);
    assert.equal(engine.events.find(e=>e.id==='lane-0').end-engine.events.find(e=>e.id==='lane-0').time,1);
    engine.stop();
  } finally {globalThis.AudioContext=originalContext;globalThis.setInterval=originalInterval;}
});
