export function appendMemoryNote(sequence,random=Math.random){return [...sequence,Math.min(3,Math.floor(random()*4))];}
export function memoryAnswer(sequence,index,pad){if(sequence[index]!==pad)return 'miss';return index===sequence.length-1?'complete':'continue';}
