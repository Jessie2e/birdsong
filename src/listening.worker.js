import * as tf from '@tensorflow/tfjs';

import { realSpectrum } from './listening-spectrum';
import { FAINT_THRESHOLD, WINDOW_SECONDS, HOP_SECONDS, summarizeSegments, validRecordingDuration } from './listening-timeline';

class MelSpecLayerSimple extends tf.layers.Layer {
  constructor(config) { super(config); this.config = config; this.filters = tf.tensor2d(config.melFilterbank); }
  build() { this.scale = this.addWeight('magnitude_scaling', [], 'float32', tf.initializers.constant({value: 1.23})); super.build(); }
  computeOutputShape(shape) { return [shape[0], ...this.config.specShape, 1]; }
  call(inputs) {
    return tf.tidy(() => {
      const batch = inputs[0].dataSync(), width = inputs[0].shape[1];
      const output = [];
      for (let offset = 0; offset < batch.length; offset += width) {
        const samples = batch.slice(offset, offset + width);
        let min = Infinity, max = -Infinity;
        for (const value of samples) { min = Math.min(min, value); max = Math.max(max, value); }
        for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] - min) / (max - min + 1e-6) * 2 - 1;
        const { result, frames, bins } = realSpectrum(samples, this.config.frameLength, this.config.frameStep);
        let spec = tf.tensor2d(result, [frames, bins]).matMul(this.filters).square();
        spec = spec.pow(tf.scalar(1).div(tf.scalar(1).add(this.scale.read().exp())));
        output.push(spec.reverse(-1).transpose().expandDims(-1));
      }
      return tf.stack(output);
    });
  }
  static get className() { return 'MelSpecLayerSimple'; }
}
tf.serialization.registerClass(MelSpecLayerSimple);
let model, labels, areaModelPromise;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await tf.setBackend('webgl'); await tf.ready();
      model = await tf.loadLayersModel('/birdnet/model.json', {onProgress: value => self.postMessage({type:'progress', value})});
      const response = await fetch('/birdnet/labels.txt');
      if (!response.ok) throw new Error('Species labels are unavailable.');
      labels = (await response.text()).trim().split('\n');
      self.postMessage({type:'ready'});
    } else if (data.type === 'region') {
      if (!labels) throw new Error('Load the listening kit first.');
      areaModelPromise ||= tf.loadGraphModel('/birdnet/area-model/model.json').catch(error => {areaModelPromise = null; throw error;});
      const areaModel = await areaModelPromise;
      const peaks = new Float32Array(labels.length);
      for (const [latitude,longitude] of data.points) {
        const input = tf.tensor2d([[latitude,longitude,data.week]]);
        let output;
        try {
          output = areaModel.predict(input);
          const scores = await output.data();
          if (scores.length !== labels.length) throw new Error('Range labels do not match the sound model.');
          for (let i=0;i<scores.length;i++) peaks[i] = Math.max(peaks[i],scores[i]);
        } finally {input.dispose(); output?.dispose();}
      }
      const scores = Object.fromEntries(labels.map((label,i)=>[label.split('_')[0],peaks[i]]));
      self.postMessage({type:'region-result',requestId:data.requestId,scores});
    } else if (data.type === 'analyze') {
      if (!model) throw new Error('The listening model is not ready.');
      const segments = [];
      const pcm = data.pcm;
      if (!pcm?.length || !validRecordingDuration(pcm.length / 48000)) throw new Error('Invalid recording length.');
      let energy = 0;
      for (const sample of pcm) energy += sample * sample;
      if (Math.sqrt(energy / pcm.length) < 0.0001) { self.postMessage({type:'results', matches:[], segments:[]}); return; }
      const windowSamples = WINDOW_SECONDS * 48000;
      const hopSamples = HOP_SECONDS * 48000;
      const starts = [];
      for (let start = 0; start <= pcm.length - windowSamples; start += hopSamples) starts.push(start);
      const tailStart = Math.max(0, pcm.length - windowSamples);
      if (starts.at(-1) !== tailStart) starts.push(tailStart);
      for (let frame = 0; frame < starts.length; frame++) {
        const start = starts[frame];
        const window = new Float32Array(144000); window.set(pcm.subarray(start, start + 144000));
        const input = tf.tensor2d(window, [1, 144000]);
        let prediction;
        try {
          prediction = model.predict(input);
          const scores = await prediction.data();
          const detections = [];
          for (let i = 0; i < scores.length; i++) {
            const scientificName = labels[i].split("_")[0];
            if (scores[i] >= FAINT_THRESHOLD && /^[A-Z][a-z]+ [a-z]+$/.test(scientificName)) detections.push({scientificName, score:scores[i]});
          }
          segments.push({start:start / 48000, end:Math.min(pcm.length / 48000, start / 48000 + WINDOW_SECONDS), detections});
        } finally { input.dispose(); prediction?.dispose(); }
        self.postMessage({type:'analyzing', value: (frame + 1) / starts.length});
      }
      const matches = summarizeSegments(segments, labels, FAINT_THRESHOLD);
      self.postMessage({type:'results', matches, segments});
    }
  } catch (error) { self.postMessage({type:data.type === 'region' ? 'region-error' : 'error', requestId:data.requestId, message:error.message}); }
};
