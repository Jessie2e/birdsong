import {learningEligible} from './learning-audio.js';
// Explicitly saved clips stay on this browser/device; raw captures remain temporary.
const DATABASE = 'birdsong-personal-recordings-v1';
function database() {
  return new Promise((resolve,reject)=>{const request=indexedDB.open(DATABASE,1);request.onupgradeneeded=()=>request.result.createObjectStore('clips',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
}
async function transact(mode, action) {
  const db=await database();
  try {return await new Promise((resolve,reject)=>{const tx=db.transaction('clips',mode), request=action(tx.objectStore('clips'));let result;request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>{if(mode==='readwrite')window.dispatchEvent(new Event('birdsong-recordings-changed'));resolve(result);};tx.onerror=()=>reject(tx.error||request.error||new Error("Storage unavailable"));tx.onabort=()=>reject(tx.error||new Error('Storage unavailable'));});} finally {db.close();}
}
// Safari can reject Blob/File values in IndexedDB. Store plain bytes instead;
// hydrate at the read boundary so existing clips and callers remain compatible.
export async function recordingForStorage(recording){const {blob,audio:_audio,...metadata}=recording;return {...metadata,audioBytes:blob?await blob.arrayBuffer():metadata.audioBytes,audioType:blob?.type||metadata.audioType||'audio/wav',enabled:!!recording.enabled&&learningEligible(recording)};}
export function restoreRecording(recording){const {audioBytes,audioType,...metadata}=recording;return {...metadata,blob:audioBytes?new Blob([audioBytes],{type:audioType||'audio/wav'}):recording.blob};}
export const listRecordings=async()=>(await transact('readonly',store=>store.getAll())).map(restoreRecording);
export const putRecording=async recording=>{const stored=await recordingForStorage(recording);return transact('readwrite',store=>store.put(stored));};
export const removeRecording=id=>transact('readwrite',store=>store.delete(id));

export function trimWav(buffer,start,end,minDuration=.5) {
  if (!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>buffer.duration+.001||end-start<minDuration) throw Error('Choose at least half a second within the recording.');
  const first=Math.floor(start*buffer.sampleRate), count=Math.min(buffer.length-first,Math.floor((end-start)*buffer.sampleRate));
  const bytes=new ArrayBuffer(44+count*2), view=new DataView(bytes);
  const text=(offset,value)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
  text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),fade=Math.min(Math.floor(.015*buffer.sampleRate),count/2);
  for(let i=0;i<count;i++){const sample=channels.reduce((sum,c)=>sum+c[first+i],0)/channels.length;const gain=Math.min(1,i/fade,(count-i-1)/fade);view.setInt16(44+i*2,Math.max(-1,Math.min(1,sample*gain))*32767,true);}
  return new Blob([bytes],{type:'audio/wav'});
}
export function personalRounds(rounds,clips,random=Math.random) {
  let used=0;
  return rounds.map(round=>{const choices=clips.filter(c=>c.enabled&&learningEligible(c)&&c.birdId===round.correct.id&&c.audio);if(!choices.length||used>=3||random()>=.5)return round;used++;const clip=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];return {...round,correct:{...round.correct,audio:clip.audio,recordingId:clip.id,personal:true}};});
}
