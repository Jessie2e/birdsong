import test from 'node:test';
import assert from 'node:assert/strict';
import { realSpectrum } from '../src/listening-spectrum.js';

test('windowed FFT matches a direct Fourier transform, including the Nyquist bin', () => {
  const signal = Float32Array.from([0.3, -0.2, 0.8, 0.1, -0.5, 0.4, 0.7, -0.1, 0.6, 0.2, 0.1, 0]);
  const {result, frames, bins} = realSpectrum(signal, 8, 4);
  assert.equal(frames, 2); assert.equal(bins, 5);
  for (let frame = 0; frame < frames; frame++) for (let bin = 0; bin < bins; bin++) {
    let expected = 0;
    for (let i = 0; i < 8; i++) expected += signal[frame * 4 + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / 8)) * Math.cos(2 * Math.PI * bin * i / 8);
    assert.ok(Math.abs(result[frame * bins + bin] - expected) < 1e-6);
  }
});
test('silence produces no spectral energy', () => {
  assert.ok(realSpectrum(new Float32Array(32), 8, 4).result.every(value => value === 0));
});

import { activeSpecies, waveformPeaks, summarizeSegments } from '../src/listening-timeline.js';
test('simultaneous voices highlight together, stop when paused, and respect seek boundaries', () => {
  const segments = [{start:0,end:3,detections:[{scientificName:'Corvus brachyrhynchos',score:.9}]},{start:1.5,end:4.5,detections:[{scientificName:'Cardinalis cardinalis',score:.8}]}];
  assert.deepEqual([...activeSpecies(segments,2,true)].sort(),['Cardinalis cardinalis','Corvus brachyrhynchos']);
  assert.equal(activeSpecies(segments,2,false).size,0);
  assert.deepEqual([...activeSpecies(segments,3,true)],['Cardinalis cardinalis']);
  assert.equal(activeSpecies(segments,4.5,true).size,0);
});
test('waveform preserves localized peaks and handles silence without invalid numbers', () => {
  assert.deepEqual(waveformPeaks(Float32Array.from([0,.5,0,1]),2),[.5,1]);
  assert.deepEqual(waveformPeaks(new Float32Array(10),2),[0,0]);
  assert.deepEqual(waveformPeaks(new Float32Array()),[]);
});
test('flock summaries deduplicate overlapping detections and exclude non-species labels', () => {
  const segments=[{start:0,end:3,detections:[{scientificName:'Corvus brachyrhynchos',score:.8},{scientificName:'Noise',score:.99}]},{start:1.5,end:4.5,detections:[{scientificName:'Corvus brachyrhynchos',score:.9}]}];
  assert.deepEqual(summarizeSegments(segments,['Corvus brachyrhynchos_American Crow','Noise_Noise']),[{scientificName:'Corvus brachyrhynchos',name:'American Crow',score:.9}]);
});

 test('capture and worker share the 45-second recording boundary',async()=>{
  const {validRecordingDuration} = await import('../src/listening-timeline.js');
  assert.equal(validRecordingDuration(45),true);
  assert.equal(validRecordingDuration(45.2),true);
  assert.equal(validRecordingDuration(46),false);
  assert.equal(validRecordingDuration(2.9),false);
  assert.equal(validRecordingDuration(NaN),false);
});

test('faint-call results stay tentative and the standard cutoff remains unchanged',async()=>{
  const {summarizeSegments, FAINT_THRESHOLD} = await import('../src/listening-timeline.js');
  const segments = [{start:0,end:3,detections:[{scientificName:'Corvus brachyrhynchos',score:.129},{scientificName:'Piranga rubra',score:.033}]}];
  const labels = ['Corvus brachyrhynchos_American Crow','Piranga rubra_Summer Tanager'];
  assert.deepEqual(summarizeSegments(segments,labels),[]);
  assert.equal(summarizeSegments(segments,labels,FAINT_THRESHOLD)[0].name,'American Crow');
  assert.equal(summarizeSegments(segments,labels,FAINT_THRESHOLD).length,1);
});
test('recording quality uses absolute levels rather than a normalized waveform',async()=>{
  const {signalQuality,waveformPeaks} = await import('../src/listening-timeline.js');
  const quiet = new Float32Array(1000).fill(.001), loud = new Float32Array(1000).fill(.1);
  assert.deepEqual(waveformPeaks(quiet),waveformPeaks(loud));
  assert.equal(signalQuality(quiet).quiet,true);assert.equal(signalQuality(loud).quiet,false);
  assert.ok(Math.abs(signalQuality(quiet).db+60)<.001);
  assert.equal(signalQuality(new Float32Array(100).fill(1)).clipped,true);
  assert.equal(signalQuality(new Float32Array(100)).db,-100);
});
