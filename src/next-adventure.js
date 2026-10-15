import {recognition} from './progress.js';
export function nextAdventure(birds,history,sessions,discoveredBirds) {
  const crow=birds.find(b=>b.id==='american-crow');
  if(crow&&discoveredBirds.includes(crow.id)&&!recognition(history,crow.id))return {title:'Know your crow by ear',body:'Recognize American Crow in flights by listening to its call and choosing its name. Four correct answers in five attempts, over at least two flights, adds “Voice recognized” to its card and gives developing voices more practice time.',action:'Listen for Crow in your next flight →',route:'play',birdId:crow.id};
  if(!sessions.some(s=>s.mode==='sound-alikes'&&s.pairId==='cardinal-finch'&&s.score>=5))return {title:'Two whistles. Two different birds.',body:'Learn Cardinal versus House Finch, then score 5/6 to earn your Two Voices badge.',action:'Try Sound-alikes →',route:'compare'};
  const target=birds.find(b=>discoveredBirds.includes(b.id)&&!recognition(history,b.id));
  if(target)return {title:`Get to know ${target.commonName}`,body:'Listen to this bird and try naming it in a flight. Four correct answers in five attempts, over at least two flights, marks its card “Voice recognized” and lets future flights focus more on voices you’re still learning.',action:'Play your next flight →',route:'play',birdId:target.id};
  return {title:'Make a song with the voices you know',body:'Your learned voices are ready in Studio. Try a new bird combination or shape a favorite phrase.',action:'Open your Studio →',route:'studio'};
}
