import {oracleExcerpt} from './oracle-audio.js';
// Natural-speed excerpts; a shared Web Audio clock keeps every voice in time.
export function excerpt(buffer, start, length, context) {
  const offset = Math.max(0, Math.min(start, buffer.duration - .1));
  const count = Math.max(1, Math.min(Math.round(length * buffer.sampleRate), buffer.length - Math.floor(offset * buffer.sampleRate)));
  const result = context.createBuffer(buffer.numberOfChannels, count, buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const input = buffer.getChannelData(channel), output = result.getChannelData(channel);
    const first = Math.floor(offset * buffer.sampleRate), fade = Math.min(Math.floor(.025 * buffer.sampleRate), count / 2);
    for (let i = 0; i < count; i++) output[i] = input[first + i] * Math.min(1, i / fade, (count - i - 1) / fade);
  }
  return result;
}
export function studioUnlocked(saved, history, recognition) {
  return saved || ['robin', 'carolina-wren'].every(id => recognition(history, id));
}
export class StudioAudio {
  constructor(onPulse) { this.context = new AudioContext(); this.cache = new Map(); this.chirps = new Map(); this.nodes = new Set(); this.onPulse = onPulse; this.events = []; this.generation = 0; }
  async load(bird) {
    const key=`${bird.id}:${bird.audio}`;
    if (!this.cache.has(key)) this.cache.set(key, fetch(bird.audio).then(response => { if (!response.ok) throw Error('Audio unavailable'); return response.arrayBuffer(); }).then(bytes => this.context.decodeAudioData(bytes)).catch(error => { this.cache.delete(key); throw error; }));
    return this.cache.get(key);
  }
  sound(buffer, when, gain = .55, pitch = 0) {
    const source = this.context.createBufferSource(), volume = this.context.createGain();
    source.buffer = buffer; source.playbackRate.value = 2 ** (pitch / 12); volume.gain.value = gain; source.connect(volume); volume.connect(this.context.destination);
    this.nodes.add(source); source.onended = () => {this.nodes.delete(source); source.disconnect(); volume.disconnect();}; source.start(when);
  }
  drum(when, beat, style) {
    const osc = this.context.createOscillator(), gain = this.context.createGain();
    const kick = beat % 2 === 0;
    osc.type = kick ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(kick ? 130 : style === 'woodland' ? 650 : 1600, when);
    osc.frequency.exponentialRampToValueAtTime(kick ? 45 : 180, when + .12);
    gain.gain.setValueAtTime(kick ? .18 : .045, when); gain.gain.exponentialRampToValueAtTime(.0001, when + .15);
    osc.connect(gain); gain.connect(this.context.destination); this.nodes.add(osc);
    osc.onended = () => {this.nodes.delete(osc); osc.disconnect(); gain.disconnect();}; osc.start(when); osc.stop(when + .16);
  }
  async preview(bird, start, length, pitch = 0, gain = .7) {
    const token = this.generation;
    await this.context.resume(); const buffer = await this.load(bird);
    if (token !== this.generation) return 0;
    this.sound(excerpt(buffer, start, length, this.context), this.context.currentTime + .03, gain, pitch);
    return Math.min(length, buffer.duration - start);
  }
  async previewChirp(bird,length=.65) {const token=this.generation;await this.context.resume();const buffer=await this.load(bird);if(token!==this.generation)return;const key=`${bird.id}:${bird.audio}:${length}`;if(!this.chirps.has(key)){const section=oracleExcerpt(buffer,length);this.chirps.set(key,excerpt(buffer,section.start,section.duration,this.context));}this.sound(this.chirps.get(key),this.context.currentTime+.03,.7);}
  async prepareChirps(voices,length=.65){await this.prepare(voices);for(const bird of voices){const key=`${bird.id}:${bird.audio}:${length}`;if(!this.chirps.has(key)){const buffer=await this.load(bird),section=oracleExcerpt(buffer,length);this.chirps.set(key,excerpt(buffer,section.start,section.duration,this.context));}}}
  womp(){const now=this.context.currentTime;[210,140].forEach((frequency,i)=>{const osc=this.context.createOscillator(),gain=this.context.createGain(),at=now+i*.18;osc.type='triangle';osc.frequency.setValueAtTime(frequency,at);osc.frequency.exponentialRampToValueAtTime(frequency*.6,at+.2);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.14,at+.02);gain.gain.exponentialRampToValueAtTime(.0001,at+.22);osc.connect(gain);gain.connect(this.context.destination);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+.24);});}
  async start(voices, bpm, style, getSettings) {
    const token = this.generation;
    await this.context.resume(); await Promise.all(voices.map(bird => this.load(bird)));
    if (token !== this.generation) return;
    this.next = this.context.currentTime + .12; this.step = 0; const beatSeconds = 60 / bpm;
    this.interval = setInterval(() => {
      while (this.next < this.context.currentTime + .2) {
        const settings = getSettings(), step = this.step % 8;
        if (style !== 'none') this.drum(this.next, step, style);
        voices.forEach((bird, index) => {
          const track = settings[bird.id];
          if (track?.enabled && step === (track.step ?? index * 2)) {
            const clip = excerpt(this.cacheBuffer[bird.id], track.start, Math.min(track.length,8 * beatSeconds * (2 ** ((track.pitch || 0) / 12))), this.context);
            this.sound(clip, this.next, track.volume, track.pitch || 0); this.events.push({id:bird.id,time:this.next,end:this.next + clip.duration / (2 ** ((track.pitch || 0) / 12))});
          }
        });
        this.events.push({step,time:this.next,end:this.next + beatSeconds}); this.step++; this.next += beatSeconds;
      }
      const now = this.context.currentTime;
      this.events = this.events.filter(event => event.end > now);
      this.onPulse(this.events.filter(event => event.time <= now));
    }, 30);
  }
  async prepare(voices) { this.cacheBuffer = Object.fromEntries(await Promise.all(voices.map(async bird => [bird.id, await this.load(bird)]))); }
  stop() { this.generation++; clearInterval(this.interval); this.events = []; for (const node of this.nodes) { try { node.stop(); } catch { /* already ended */ } } this.nodes.clear(); this.onPulse([]); }
  close() { this.stop(); void this.context.close(); }
}
