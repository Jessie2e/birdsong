import {useEffect,useState} from 'react';
import {listRecordings} from './personal-recordings';
export default function useRecordings() {
  const [clips,setClips]=useState([]),[error,setError]=useState('');
  useEffect(()=>{let alive=true, generation=0,urls=[];
    async function refresh(){const task=++generation;try{const saved=await listRecordings();if(!alive||task!==generation)return;const next=saved.sort((a,b)=>b.createdAt-a.createdAt).map(c=>({...c,audio:URL.createObjectURL(c.blob)}));urls.forEach(URL.revokeObjectURL);urls=next.map(c=>c.audio);setClips(next);setError('');}catch{if(alive)setError('Saved calls are unavailable in this browser. Your temporary recording still works.');}}
    refresh();window.addEventListener('birdsong-recordings-changed',refresh);return()=>{alive=false;generation++;window.removeEventListener('birdsong-recordings-changed',refresh);urls.forEach(URL.revokeObjectURL);};
  },[]);
  return {clips,error};
}
