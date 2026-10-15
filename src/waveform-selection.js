export const MIN_PHRASE = .05;
export const MAX_PHRASE = 30;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function resizeSelection(selection,edge,time,duration) {
 const {start,end}=selection;
 return edge==='start'
  ? {start:clamp(time,Math.max(0,end-MAX_PHRASE),end-MIN_PHRASE),end}
  : {start,end:clamp(time,start+MIN_PHRASE,Math.min(duration,start+MAX_PHRASE))};
}
export function moveSelection(selection,delta,duration) {
 const length=selection.end-selection.start,start=clamp(selection.start+delta,0,Math.max(0,duration-length));
 return {start,end:start+length};
}
export function waveformPeaks(buffer,start=0,end=buffer.duration,bins=600) {
 const first=Math.max(0,Math.floor(start*buffer.sampleRate)),last=Math.min(buffer.length,Math.ceil(end*buffer.sampleRate));
 const count=Math.max(1,Math.min(bins,last-first)),peaks=new Float32Array(count);
 // Scan every sample on every channel so short transients and negative peaks survive zooming.
 for(let channel=0;channel<buffer.numberOfChannels;channel++){
  const input=buffer.getChannelData(channel);
  for(let i=first;i<last;i++){const bin=Math.min(count-1,Math.floor((i-first)*count/Math.max(1,last-first)));peaks[bin]=Math.max(peaks[bin],Math.abs(input[i]));}
 }
 return Array.from(peaks);
}
export function waveformWindow(start,span,duration) {
 const length=clamp(span,Math.min(1,duration),duration);
 return {start:clamp(start,0,Math.max(0,duration-length)),span:length};
}
