import library from './data/dj-chirps.json' with {type:'json'};
export const djChirps = library.filter(clip => clip.id && clip.audio && clip.duration > 0 && clip.duration <= 3);
export function preferredDjSource(birdId, chirps = djChirps) {
  return [...chirps].reverse().find(clip => clip.birdId === birdId) || null;
}
export function chirpVoice(clip) {
  return {id:`chirp:${clip.id}`,birdId:clip.birdId,commonName:clip.name,audio:clip.audio,duration:clip.duration,isChirp:true,attribution:clip};
}
