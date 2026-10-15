import {randomUnit} from './nest-progress';
import {useEffect,useRef,useState} from 'react';
const objects=['☁️','🛸','✈️','🪁','🐞'];
export default function NestFlight({BirdArt,bird,onFinish}){
 const [game,setGame]=useState({running:false,y:50,score:0,obstacles:[],over:false}),keys=useRef(0),world=useRef(null),frame=useRef(null),result=useRef(onFinish),held=useRef(false);
 useEffect(()=>{result.current=onFinish;},[onFinish]);
 useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
 function start(){cancelAnimationFrame(frame.current);world.current={y:50,v:0,score:0,obstacles:[],elapsed:0,spawn:0,last:0};setGame({...world.current,running:true,over:false});frame.current=requestAnimationFrame(tick);}
 function flap(){if(world.current)world.current.v=-34;}
 function tick(now){const w=world.current;if(!w)return;const dt=Math.min(.035,w.last?(now-w.last)/1000:0);w.last=now;w.elapsed+=dt;w.spawn+=dt;if(held.current)w.v-=95*dt;w.v+=65*dt;w.y=Math.max(4,Math.min(94,w.y+w.v*dt));if(w.y===4||w.y===94)w.v=0;
 if(w.spawn>1.8){w.spawn=0;w.obstacles.push({id:keys.current++,x:105,y:12+randomUnit()*72,icon:objects[Math.floor(randomUnit()*objects.length)],passed:false});}
 let hit=false;w.obstacles=w.obstacles.filter(o=>o.x>-10).map(o=>{const n={...o,x:o.x-23*dt};if(n.x<17&&!n.passed){w.score++;n.passed=true;}if(Math.abs(n.x-20)<7&&Math.abs(n.y-w.y)<12)hit=true;return n;});
 if(hit||w.elapsed>=45){world.current=null;setGame({...w,running:false,over:true});result.current(w.score);return;}
 setGame({...w,running:true,over:false});frame.current=requestAnimationFrame(tick);}
 function stop(){cancelAnimationFrame(frame.current);world.current=null;held.current=false;setGame(g=>({...g,running:false,over:true}));}
 return <section className="world-panel"><h2>A little sky time</h2><p>Dodge clouds, kites and very lost spaceships. Tap or press Space to flap; hold to climb. A round lasts up to 45 seconds. Dodge five obstacles to earn one extra species change today.</p><div className="nest-sky" role="button" tabIndex={0} aria-label="Flying game. Press Space or tap to flap" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);held.current=true;flap();}} onPointerUp={()=>held.current=false} onPointerCancel={()=>held.current=false} onKeyDown={e=>{if([' ','ArrowUp'].includes(e.key)){e.preventDefault();flap();}}}><span className="sky-buddy" style={{top:`${game.y}%`}}><BirdArt bird={bird} small/></span>{game.obstacles.map(o=><span className="sky-obstacle" key={o.id} style={{left:`${o.x}%`,top:`${o.y}%`}}>{o.icon}</span>)}<span className="sky-score">Dodged {game.score}</span>{!game.running&&<span className="sky-invitation">{game.over?`Lovely flight! ${game.score} dodged.`:'A whole little sky awaits.'}</span>}</div><div className="companion-actions"><button onClick={game.running?stop:start}>{game.running?'Stop flight':game.over?'Fly again':'Start flying'}</button><button disabled={!game.running} onClick={flap}>Flap ↑</button></div><small>Movement without punishment: a bump simply ends this round. Motion begins only when you start.</small></section>;
}
