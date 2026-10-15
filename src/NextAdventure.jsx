import {nextAdventure} from './next-adventure';
export default function NextAdventure({birds,history,sessions,discoveredBirds,onPlay,onStudio,onSoundAlikes}) {
  const goal=nextAdventure(birds,history,sessions,discoveredBirds);
  return <section className="next-adventure" aria-label="Your next adventure"><p className="eyebrow">YOUR NEXT ADVENTURE</p><h2>{goal.title}</h2><p>{goal.body}</p><button onClick={goal.route==='studio'?onStudio:goal.route==='compare'?onSoundAlikes:()=>onPlay(goal.birdId)}>{goal.action}</button></section>;
}
