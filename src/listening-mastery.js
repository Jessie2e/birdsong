export function masteredByEar(attempts,id){const a=attempts.filter(x=>x.birdId===id);return ['short','close'].every(mode=>{const rounds=a.filter(x=>x.mode===mode);for(let end=5;end<=rounds.length;end++){if(rounds.slice(end-5,end).filter(x=>x.correct).length>=4)return true;}return false;});}

export function readMastery(){try{return JSON.parse(localStorage.getItem('birdsong-advanced-listening-v1')||'[]');}catch{return [];}}
