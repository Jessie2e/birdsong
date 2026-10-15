// A musical excerpt, not an isolated or classified chirp. Preserve source attribution.
export function oracleExcerpt(buffer,seconds=1.8){
 const length=Math.min(buffer.length,Math.round(buffer.sampleRate*seconds));
 if(!length)return {start:0,duration:0};
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 const hop=Math.max(1,Math.round(buffer.sampleRate*.05));
 let energy=0,bestEnergy=-1,best=0;
 function power(i){let value=0;for(const channel of channels)value+=channel[i]*channel[i];return value;}
 for(let i=0;i<length;i++)energy+=power(i);
 bestEnergy=energy;
 for(let i=1;i+length<=buffer.length;i++){energy+=power(i+length-1)-power(i-1);if((i%hop===0||i+length===buffer.length)&&energy>bestEnergy){best=i;bestEnergy=energy;}}
 return {start:best/buffer.sampleRate,duration:length/buffer.sampleRate};
}
export class OracleChorus{
 constructor(){this.version=0;this.sources=[];this.timers=[];this.cache=new Map();}
 stop(){this.version++;this.abort?.abort();for(const timer of this.timers)clearTimeout(timer);this.timers=[];for(const source of this.sources){source.onended=null;try{source.stop();}catch{/* source already ended */}source.disconnect();}this.sources=[];}
 async play(birds,{onBird,onEnd}){
  this.stop();const version=this.version;this.context??=new AudioContext();await this.context.resume();if(version!==this.version)return false;this.abort=new AbortController();
  let buffers;try{buffers=await Promise.all(birds.map(async bird=>{if(this.cache.has(bird.audio))return this.cache.get(bird.audio);const response=await fetch(bird.audio,{signal:this.abort.signal});if(!response.ok)throw Error('A bird call couldn’t load.');const buffer=await this.context.decodeAudioData(await response.arrayBuffer());if(version===this.version)this.cache.set(bird.audio,buffer);return buffer;}));}catch(error){if(version!==this.version)return false;throw error;}
  if(version!==this.version)return false;
  let delay=.08;
  buffers.forEach((buffer,i)=>{const excerpt=oracleExcerpt(buffer);if(!excerpt.duration)throw Error('This recording is empty.');const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.connect(gain);gain.connect(this.context.destination);const at=this.context.currentTime+delay;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.8,at+.025);gain.gain.setValueAtTime(.8,at+Math.max(.025,excerpt.duration-.04));gain.gain.linearRampToValueAtTime(0,at+excerpt.duration);this.sources.push(source);this.timers.push(setTimeout(()=>{if(version===this.version)onBird(i);},delay*1000));source.onended=()=>{source.disconnect();gain.disconnect();if(version===this.version){onBird(null);if(i===buffers.length-1){this.sources=[];onEnd();}}};source.start(at,excerpt.start,excerpt.duration);delay+=excerpt.duration+.4;});
  return true;
 }
 dispose(){this.stop();this.context?.close();this.cache.clear();}
}
