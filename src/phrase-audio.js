import {trimWav} from './personal-recordings.js';
export function phraseProvenance(source,pitch,everShifted=false){return {pitchEdited:!!source.pitchEdited||!!Number(source.pitchSemitones||0)||pitch!==0||everShifted};}
export async function renderPhrase(buffer,{start,end,volume,pitch}) {
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>buffer.duration+.001||end-start<.0499||end-start>30.01)throw Error('Choose a phrase between 0.05 and 30 seconds inside this recording.');
 if(!Number.isFinite(volume)||volume<0||volume>2||!Number.isFinite(pitch)||Math.abs(pitch)>12)throw Error('Choose a valid volume and pitch.');
 const rate=2**(pitch/12),renderer=new OfflineAudioContext(1,Math.ceil((end-start)/rate*48000),48000),source=renderer.createBufferSource(),gain=renderer.createGain();source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=volume;source.connect(gain);gain.connect(renderer.destination);source.start(0,start,end-start);const output=await renderer.startRendering();return {blob:trimWav(output,0,output.duration,.01),duration:output.duration};
}
