import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signalQuality,hasRecordedSignal} from '../src/listening-timeline.js';
import {microphoneRequest,recorderOptions,inputDetails,recordingLevel} from '../src/microphone-check.js';
test('brief audible calls are distinguished from the average of long quiet stretches',()=>{const pcm=new Float32Array(48000*45);for(let i=48000;i<48000+480;i++)pcm[i]=.08*Math.sin(i);const quality=signalQuality(pcm);assert.equal(quality.quiet,true);assert.ok(quality.strongestDb>-40);assert.equal(recordingLevel(quality),'Brief louder sounds captured');assert.equal(recordingLevel(signalQuality(new Float32Array(48000))),'Low recorded level');});
test('natural and automatic modes change gain control without requesting voice suppression',()=>{assert.equal(microphoneRequest().audio.autoGainControl,false);assert.equal(microphoneRequest('automatic').audio.autoGainControl,true);assert.equal(microphoneRequest('automatic').audio.noiseSuppression,false);assert.equal(microphoneRequest().audio.echoCancellation,false);});
test('recording format is negotiated and unsupported microphone settings stay unknown',()=>{assert.deepEqual(recorderOptions({isTypeSupported:t=>t==='audio/mp4'}),{audioBitsPerSecond:256000,mimeType:'audio/mp4'});assert.equal(inputDetails({label:'iPhone',getSettings:()=>({sampleRate:48000})}).automaticLevel,undefined);});

test('faint nonzero audio reaches the normalized model instead of being discarded by average volume',()=>{assert.equal(hasRecordedSignal(new Float32Array(48000)),false);const audio=new Float32Array(48000);audio[12000]=.00001;assert.equal(hasRecordedSignal(audio),true);});
