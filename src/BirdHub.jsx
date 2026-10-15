import {useState} from 'react';
import {birds} from './data/birds';
const destinations=[
 {id:'learn',title:'Play & Learn',tag:'A LITTLE CHALLENGE',description:'Meet a voice. Find your good ear.',bird:'bluejay',color:'sky'},
 {id:'explore',title:'Explore',tag:'FOLLOW YOUR CURIOSITY',description:'Listen outside. Notice something new.',bird:'carolina-wren',color:'sage'},
 {id:'studio',title:'Make Music',tag:'YOUR OWN LITTLE CHORUS',description:'Turn familiar calls into something yours.',bird:'cardinal',color:'peach'},
 {id:'sanctuary',title:'Your Nest',tag:'A PLACE TO COME BACK TO',description:'Your Bird Bestie. Your growing Flock.',bird:'mourning-dove',color:'butter'},
];
function readLast(){try{return localStorage.getItem('birdsong-last-place-v1');}catch{return null;}}
export default function BirdHub({BirdArt,onNavigate,discoveredBirds,onCredits}) {
 const [last]=useState(readLast),resume=destinations.find(d=>d.id===last);
 return <main className="bird-hub screen"><header className="hub-header"><p className="eyebrow">A LITTLE WORLD OF BIRDS</p><h1 className="hub-wordmark">Bird<span>song</span></h1><p className="hub-invitation">Find your own way into birds.</p></header><nav className="hub-destinations" aria-label="Choose your Birdsong adventure">{destinations.map(place=><button key={place.id} className={`hub-door ${place.color}`} onClick={()=>onNavigate(place.id)}><span className="hub-door-copy"><span className="eyebrow">{place.tag}</span><strong>{place.title}</strong><span>{place.description}</span><span className="hub-door-link">Come on in <span aria-hidden="true">↗</span></span></span><span className="hub-bird" aria-hidden="true"><BirdArt bird={birds.find(b=>b.id===place.bird)} small /></span></button>)}</nav><section className="hub-bottom" aria-label="Your Birdsong world"><div><span className="eyebrow">ONE FLOCK. MANY WAYS TO GROW.</span><p><strong>{discoveredBirds.length} of {birds.length}</strong> birds welcomed into your world.</p><button className="hub-text-button" onClick={()=>onNavigate('sanctuary')}>Visit your Flock →</button></div>{resume?<div className="hub-resume"><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><button onClick={()=>onNavigate(resume.id)}>{resume.title} <span aria-hidden="true">→</span></button></div>:<p className="hub-first-visit">A walk, a song, a little discovery.<br/>There’s no wrong place to start.</p>}</section><button className="hub-credits" onClick={onCredits}>Recording credits</button></main>;
}
