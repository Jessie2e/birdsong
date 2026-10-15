import {unlockOrder,initialFlock} from './flock.js';
export const WORLD_KEY='birdsong-world-milestones-v1';
export const milestones={
 'first-arrangement':{name:'Your first little song',description:'Arrange three distinct phrases, play a full loop, then save your song.'},
 'field-note':{name:'A moment outdoors',description:'Write your first field note about something you noticed outside (at least 20 characters).'},
 'companion-days':{name:'A familiar perch',description:'Spend time with your companion on three different days. No streak required.'},
 'phrase-challenge':{name:'A phrase well heard',description:'Score 5/6 in the Studio phrase challenge.'},
};
export function claimMilestone(id,flock,claims=[],now=Date.now()) {
 if(!milestones[id]||claims.some(c=>c.id===id))return null;
 const owned=initialFlock([...flock,...claims.map(c=>c.birdId).filter(Boolean)]);
 const birdId=unlockOrder.find(b=>!owned.includes(b))||null;
 return {id,birdId,createdAt:now};
}
export function arrangementEligible(tracks) {return new Set(Object.values(tracks).filter(t=>t.enabled).map(t=>`${t.birdId}:${t.start}:${t.length}:${t.pitch||0}`)).size>=3;}
export function localDay(date=new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function careProgress(care) {return new Set(care.map(c=>c.day)).size;}
