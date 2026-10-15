export function nestDay(now=new Date()){return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;}
export function nestState(saved={},day=nestDay()){
 const daily=saved.day===day?saved:{};
 return {...saved,day,meters:{food:35,rest:45,fresh:40,move:30,...daily.meters},actions:daily.actions||[],switches:daily.switches||0,credits:saved.credits||0,bonds:saved.bonds||{},earned:saved.earned||[]};
}
export function tendNest(saved,birdId,action,day=nestDay()){
 const s=nestState(saved,day);if(!['food','rest','fresh','move'].includes(action))return s;
 const token=`${birdId}:${action}`;const first=!s.actions.includes(token);
 return {...s,meters:{...s.meters,[action]:Math.min(100,s.meters[action]+35)},actions:first?[...s.actions,token]:s.actions,bonds:{...s.bonds,[birdId]:(s.bonds[birdId]||0)+(first?1:0)}};
}
export function changeCompanion(saved,day=nestDay()){
 const s=nestState(saved,day);if(s.switches>=2&&s.credits<1)return null;
 return {...s,switches:s.switches+1,credits:s.credits-(s.switches>=2?1:0)};
}
export function earnNestCredit(saved,token){const s=nestState(saved);return s.earned.includes(token)?s:{...s,earned:[...s.earned,token],credits:s.credits+1};}
export function snackFor(id){
 if(['american-goldfinch','house-finch','cardinal','mourning-dove'].includes(id))return {icon:'🌻',name:'a seed snack',fact:'Seeds are on this bird’s menu.'};
 if(['red-shouldered-hawk','barred-owl'].includes(id))return {icon:'🐭',name:'a pretend prey snack',fact:'This bird is a predator, with a diet that includes small animals.'};
 if(['eastern-phoebe','yellow-rumped-warbler'].includes(id))return {icon:'🪰',name:'a bug snack',fact:'Insects are on this bird’s menu.'};
 if(['bluejay','american-crow','red-bellied-woodpecker','red-winged-blackbird','eastern-towhee','northern-mockingbird'].includes(id))return {icon:'🫐',name:'a mixed snack',fact:'This bird eats a varied diet. This snack is pretend play.'};
 return {icon:'〰',name:'a wiggle worm',fact:'Invertebrates are on this bird’s menu. Our snack is pretend play.'};
}

export const NEST_KEY='birdsong-nest-care-v1';
export function readNest(){try{return nestState(JSON.parse(localStorage.getItem(NEST_KEY)||'{}'));}catch{return nestState();}}
export function randomUnit(){return Math.random();}
export function attemptTime(){return Date.now();}
