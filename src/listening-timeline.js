export const DETECTION_THRESHOLD = 0.35;
export const FAINT_THRESHOLD = 0.10;
export const WINDOW_SECONDS = 3;
export const HOP_SECONDS = 1.5;

export function waveformPeaks(pcm, bins = 120) {
  const count = Math.min(bins, pcm.length);
  if (!count) return [];
  const peaks = [];
  for (let bin = 0; bin < count; bin++) {
    let peak = 0;
    const start = Math.floor(bin * pcm.length / count), end = Math.floor((bin + 1) * pcm.length / count);
    for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(pcm[i]));
    peaks.push(peak);
  }
  const maximum = Math.max(...peaks);
  return peaks.map(peak => maximum ? peak / maximum : 0);
}

// Half-open intervals prevent a finished detection lingering at a seek boundary.
// Any number of overlapping species can be active at the same playback time.
export function activeSpecies(segments, time, playing) {
  if (!playing) return new Set();
  return new Set(segments.filter(segment => segment.start <= time && time < segment.end).flatMap(segment => segment.detections.map(item => item.scientificName)));
}

export function summarizeSegments(segments, labels, threshold = DETECTION_THRESHOLD) {
  const peaks = new Map();
  for (const segment of segments) for (const detection of segment.detections) {
    peaks.set(detection.scientificName, Math.max(peaks.get(detection.scientificName) || 0, detection.score));
  }
  return labels.map(label => {
    const [scientificName, name] = label.split('_');
    return {scientificName, name, score:peaks.get(scientificName) || 0};
  }).filter(item => item.score >= threshold && /^[A-Z][a-z]+ [a-z]+$/.test(item.scientificName)).sort((a,b) => b.score - a.score);
}

// Allow a small MediaRecorder stop-event delay beyond the 45-second cap.
export function validRecordingDuration(seconds) {
  return Number.isFinite(seconds) && seconds >= 3 && seconds <= 45.5;
}

// Keep absolute input levels separate from the normalized display waveform.
export function signalQuality(pcm) {
  if (!pcm.length) return {rms:0, peak:0, db:-100, quiet:true, clipped:false};
  let energy = 0, peak = 0, clipped = 0;
  for (const value of pcm) {energy += value * value; peak = Math.max(peak,Math.abs(value)); if (Math.abs(value) >= .99) clipped++;}
  const rms = Math.sqrt(energy / pcm.length);
  return {rms, peak, db:Math.max(-100,20 * Math.log10(rms || 1e-5)), quiet:rms < .003, clipped:clipped / pcm.length > .01};
}
