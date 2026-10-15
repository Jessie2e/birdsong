import test from 'node:test';
import assert from 'node:assert/strict';
import {moveSelection,resizeSelection,waveformPeaks,waveformWindow} from '../src/waveform-selection.js';
test('moving the whole phrase preserves its length and clamps at both recording edges',()=>{
 assert.deepEqual(moveSelection({start:1,end:4},100,10),{start:7,end:10});assert.deepEqual(moveSelection({start:1,end:4},-100,10),{start:0,end:3});assert.deepEqual(moveSelection({start:1,end:4},2,10),{start:3,end:6});
});
test('trim handles cannot cross, exceed the source or extend beyond the 30-second phrase limit',()=>{
 assert.deepEqual(resizeSelection({start:2,end:4},'start',99,40),{start:3.5,end:4});assert.deepEqual(resizeSelection({start:2,end:4},'end',-10,40),{start:2,end:2.5});assert.deepEqual(resizeSelection({start:2,end:4},'end',100,40),{start:2,end:32});assert.deepEqual(resizeSelection({start:2,end:35},'start',-100,40),{start:5,end:35});assert.deepEqual(resizeSelection({start:8,end:9},'end',100,10),{start:8,end:10});
});
test('waveform peaks preserve one-sample transients, negative sound and every source channel',()=>{
 const left=new Float32Array(1000),right=new Float32Array(1000);left[333]=-.8;right[701]=.95;const buffer={duration:10,length:1000,sampleRate:100,numberOfChannels:2,getChannelData:c=>c?right:left};const overview=waveformPeaks(buffer,0,10,10);assert.ok(Math.abs(overview[3]-.8)<.00001);assert.ok(Math.abs(overview[7]-.95)<.00001);const detail=waveformPeaks(buffer,3,4,100);assert.ok(Math.abs(detail[33]-.8)<.00001);assert.equal(Math.max(...waveformPeaks(buffer,0,1,50)),0);
});
test('zoom and pan windows remain inside the recording, including sub-second sources',()=>{
 assert.deepEqual(waveformWindow(-10,5,20),{start:0,span:5});assert.deepEqual(waveformWindow(19,5,20),{start:15,span:5});assert.deepEqual(waveformWindow(0,100,20),{start:0,span:20});assert.deepEqual(waveformWindow(0,.01,20),{start:0,span:1});assert.deepEqual(waveformWindow(4,10,.6),{start:0,span:.6});
});
