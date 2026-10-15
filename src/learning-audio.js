export function learningEligible(clip) {
 const pitch=Number(clip.pitchSemitones||0);
 return !!clip.birdId&&Number.isFinite(pitch)&&pitch===0&&!clip.pitchEdited&&(clip.kind!=='phrase'||(clip.confirmed===true&&Number(clip.duration)>=.5));
}
