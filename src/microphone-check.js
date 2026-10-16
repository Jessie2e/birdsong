export function microphoneRequest(mode='natural'){
 return {audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:mode==='automatic'}};
}
export function recorderOptions(Recorder){
 const mimeType=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>Recorder.isTypeSupported?.(type));
 return {audioBitsPerSecond:256000,...(mimeType?{mimeType}:{})};
}
export function inputDetails(track){const settings=track.getSettings?.()||{};return {name:track.label||'Browser-selected microphone',sampleRate:settings.sampleRate||null,channels:settings.channelCount||null,automaticLevel:settings.autoGainControl,noiseSuppression:settings.noiseSuppression,echoCancellation:settings.echoCancellation};}
export function recordingLevel(quality){
 if(quality.clipped)return 'Some sound is clipping';
 if(quality.strongestDb>-40&&quality.quiet)return 'Brief louder sounds captured';
 return quality.quiet?'Low recorded level':'Sound captured';
}
