import {nextAdventure} from './next-adventure';
export default function NextAdventure({birds,history,sessions,discoveredBirds,onPlay,onStudio,onSoundAlikes}) {
  const goal=nextAdventure(birds,history,sessions,discoveredBirds);
  return <section className="next-adventure" aria-label="Your next adventure"><p className="eyebrow">A FOCUSED ADVENTURE</p><h2>{goal.title}</h2><p>{goal.body}</p><p className="adventure-note">{goal.route==='play' ? 'A regular ten-question flight with extra focus on this voice.' : 'A different way to play between regular flights.'}</p><button onClick={goal.route==='studio'?onStudio:goal.route==='compare'?onSoundAlikes:()=>onPlay(goal.birdId)}>{goal.action}</button></section>;
}
