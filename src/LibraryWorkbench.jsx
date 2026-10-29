import {useEffect,useRef,useState} from 'react';
import {birds} from './data/birds';
import {audioCredits} from './audio-credits';
import {referenceRecordings} from './flight-recordings';
import {renderPhrase} from './phrase-audio';
import WaveformEditor from './WaveformEditor';

export default function LibraryWorkbench({BirdArt}) {
  const [selectionFocus,setSelectionFocus]=useState(0);
  const [birdId,setBirdId]=useState('cardinal'),[sourceId,setSourceId]=useState('cardinal-original');
  const [buffer,setBuffer]=useState(null),[start,setStart]=useState(0),[end,setEnd]=useState(.65),[volume,setVolume]=useState(1);
  const [name,setName]=useState('Northern Cardinal · chirp'),[draftId,setDraftId]=useState(null),[library,setLibrary]=useState({drafts:[],approved:[]});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[previewing,setPreviewing]=useState(false),[loop,setLoop]=useState(true),[heard,setHeard]=useState(false),[confirmed,setConfirmed]=useState(false),[message,setMessage]=useState('');
  const token=useRef(''),sound=useRef(null),url=useRef(null),generation=useRef(0),alive=useRef(true),pending=useRef(null);
  const bird=birds.find(b=>b.id===birdId),sources=referenceRecordings(bird),source=sources.find(s=>s.id===sourceId)||sources[0];
  async function refresh(){const response=await fetch('/__birdsong-library');if(!response.ok)throw Error('Open this workspace in your local Vite preview.');const data=await response.json();if(alive.current){token.current=data.token;setLibrary(data);}}
  function stop(){generation.current++;sound.current?.pause();sound.current=null;if(url.current)URL.revokeObjectURL(url.current);url.current=null;setPreviewing(false);}
  function edit(action){stop();setHeard(false);setConfirmed(false);setMessage('');action();}
  useEffect(()=>{alive.current=true;refresh().catch(error=>setMessage(error.message));return()=>{alive.current=false;generation.current++;sound.current?.pause();if(url.current)URL.revokeObjectURL(url.current);};},[]);
  useEffect(()=>{
    let cancelled=false;stop();setBuffer(null);setLoading(true);setHeard(false);setConfirmed(false);setMessage('');
    const context=new AudioContext();
    fetch(source.audio).then(response=>{if(!response.ok)throw Error('This song couldn’t load. Try another recording.');return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes)).then(decoded=>{
      if(cancelled)return;const draft=pending.current;pending.current=null;setBuffer(decoded);setStart(draft?.sourceStart||0);setEnd(Math.min(decoded.duration,draft?.sourceEnd||.65));setVolume(draft?.volume||1);
      if(draft){setSelectionFocus(n=>n+1);setName(draft.name);setDraftId(library.drafts.some(d=>d.id===draft.id)?draft.id:null);}
    }).catch(error=>{if(!cancelled)setMessage(error.message);}).finally(()=>{if(!cancelled)setLoading(false);void context.close();});
    return()=>{cancelled=true;};
  },[source.audio,sourceId]);
  function chooseBird(id){edit(()=>{pending.current=null;setBirdId(id);setSourceId(`${id}-original`);setName(`${birds.find(b=>b.id===id).commonName} · chirp`);setDraftId(null);});}
  function chooseSource(id){edit(()=>{pending.current=null;setSourceId(id);setDraftId(null);setStart(0);setEnd(.65);setVolume(1);});}
  function open(entry){edit(()=>{
    if(sourceId===entry.sourceId){setStart(entry.sourceStart);setEnd(entry.sourceEnd);setSelectionFocus(n=>n+1);setVolume(entry.volume);setName(entry.name);setDraftId(library.drafts.some(d=>d.id===entry.id)?entry.id:null);}
    else{pending.current=entry;setBirdId(entry.birdId);setSourceId(entry.sourceId);}
    window.scrollTo({top:0,behavior:'instant'});
  });}
  function suggest(){if(!buffer)return;const duration=Math.min(.65,buffer.duration),size=Math.floor(duration*buffer.sampleRate),hop=Math.max(1,Math.floor(buffer.sampleRate*.02));
    // Energy proposes a boundary; the author previews the actual bird before approval.
    const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));let best=0,bestPower=-1,power=0;
    const sample=i=>channels.reduce((sum,c)=>sum+c[i],0)/channels.length;
    for(let i=0;i<size;i++)power+=sample(i)**2;bestPower=power;
    for(let offset=hop;offset+size<=buffer.length;offset+=hop){for(let i=offset-hop;i<offset;i++)power-=sample(i)**2;for(let i=offset+size-hop;i<offset+size;i++)power+=sample(i)**2;if(power>bestPower){best=offset;bestPower=power;}}
    edit(()=>{setStart(best/buffer.sampleRate);setEnd((best+size)/buffer.sampleRate);setSelectionFocus(n=>n+1);});
  }
  async function preview(){
    if(previewing){stop();return;}if(!buffer)return;stop();const task=generation.current;setBusy(true);setMessage('');
    try{const result=await renderPhrase(buffer,{start,end,volume,pitch:0});if(!alive.current||task!==generation.current)return;url.current=URL.createObjectURL(result.blob);const audio=new Audio(url.current);sound.current=audio;audio.loop=loop;audio.onended=()=>{if(sound.current===audio)setPreviewing(false);};audio.onerror=()=>{if(sound.current===audio){stop();setMessage('This preview couldn’t play. Try again.');}};await audio.play();if(alive.current&&task===generation.current){setPreviewing(true);setHeard(true);}}
    catch(error){if(alive.current&&task===generation.current)setMessage(error.message||'Preview couldn’t start.');}finally{if(alive.current)setBusy(false);}
  }
  async function save(status){if(!buffer)return;stop();setBusy(true);setMessage('');
    try{const rendered=await renderPhrase(buffer,{start,end,volume,pitch:0});const bytes=new Uint8Array(await rendered.blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      const response=await fetch('/__birdsong-library/save',{method:'POST',headers:{'Content-Type':'application/json','X-Birdsong-Library-Token':token.current},body:JSON.stringify({sourceId:source.id,name,start,end,volume,status,confirmed:confirmed&&heard,draftId,audioBase64:btoa(binary)})});const result=await response.json();if(!response.ok)throw Error(result.error||'Save failed.');await refresh();if(!alive.current)return;setDraftId(status==='draft'?result.entry.id:null);setMessage(status==='draft'?'Draft saved in this project. You can reopen it in another browser.':'Chirp added to Birdsong’s DJ library. New DJ lanes can use it now.');setConfirmed(false);
    }catch(error){if(alive.current)setMessage(error.message);}finally{if(alive.current)setBusy(false);}
  }
  const credit=audioCredits.find(c=>(c.id||`${c.birdId}-original`)===source.id),valid=buffer&&end-start>=.0499&&end-start<=3.001&&volume>0;
  return <main className="world-screen screen library-workbench"><a className="back-button" href="/">← Back to Birdsong</a><header className="world-header"><p className="eyebrow">YOUR BIRDSONG AUDIO LIBRARY</p><h1>Songs into little chirps.</h1><p>Choose a song, find one clear sound, then save a draft or approve it for the DJ station. Drafts save with this local project; approved chirps join its shared library.</p></header>
    <section className="world-panel library-editor"><div className="library-source"><div className="collection-art" aria-hidden="true"><BirdArt bird={bird} small/></div><div><label>Bird<select aria-label="Bird" value={birdId} disabled={busy} onChange={e=>chooseBird(e.target.value)}>{birds.map(b=><option key={b.id} value={b.id}>{b.commonName}</option>)}</select></label><label>Song recording<select aria-label="Song recording" value={source.id} disabled={busy} onChange={e=>chooseSource(e.target.value)}>{sources.map((s,i)=><option key={s.id} value={s.id}>{i===0?'Familiar recording':`Additional song ${i}`}</option>)}</select></label><label>Reopen a draft<select aria-label="Reopen a draft" disabled={busy||!library.drafts.length} value="" onChange={event=>{const entry=library.drafts.find(d=>d.id===event.target.value);if(entry)open(entry);}}><option value="">Choose a saved draft…</option>{library.drafts.map(entry=><option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label></div></div>
    {loading&&<p role="status">Opening this song…</p>}{buffer&&<><WaveformEditor key={source.id} selectionFocusKey={selectionFocus||null} buffer={buffer} start={start} end={end} disabled={busy} onChange={range=>edit(()=>{setStart(range.start);setEnd(range.end);})}/><p className="world-small-note">DJ chirps can be 0.05–3 seconds. The waveform supports wider selections while you explore. A suggested cut finds a loud moment; listen to check it contains the sound you want.</p><div className="library-actions"><button disabled={busy} onClick={suggest}>Suggest a chirp</button><button disabled={busy||!valid} aria-pressed={previewing} onClick={preview}>{previewing?'■ Stop preview':'▶ Preview chirp'}</button><label className="library-check"><input type="checkbox" checked={loop} onChange={e=>{setLoop(e.target.checked);if(sound.current)sound.current.loop=e.target.checked;}}/>Repeat preview</label></div><div className="library-fields"><label>Chirp name<input aria-label="Chirp name" value={name} maxLength={80} disabled={busy} onChange={e=>setName(e.target.value)}/></label><label>Volume · {Math.round(volume*100)}%<input type="range" min="0" max="2" step=".05" value={volume} disabled={busy} onChange={e=>edit(()=>setVolume(Number(e.target.value)))}/></label></div><label className="library-check"><input type="checkbox" checked={confirmed} disabled={busy||!heard} onChange={e=>setConfirmed(e.target.checked)}/>I previewed this cut and approve it as a DJ chirp.</label><div className="library-actions"><button disabled={busy||!valid||!name.trim()} onClick={()=>save('draft')}>{busy?'Saving…':'Save draft'}</button><button disabled={busy||!valid||!name.trim()||!heard||!confirmed} onClick={()=>save('approved')}>Add to DJ library</button></div>{!valid&&<p role="status">Choose an audible selection of 0.05–3 seconds before saving.</p>}</>}
    {credit&&<p className="library-attribution">{credit.creator} · {credit.license} · <a href={credit.sourceUrl} target="_blank" rel="noreferrer">Source recording</a>{credit.licenseUrl&&<> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">License</a></>}<br/>Saved cuts retain their source credits and edit notes. Pitch stays unchanged.</p>}</section>
    {message&&<p className="music-status" role="status">{message}</p>}
    <section className="world-panel"><h2>Your drafts · {library.drafts.length}</h2><p>Reopen a draft to adjust its edges, volume or name. Only approved chirps appear in the DJ station.</p><div className="library-grid">{library.drafts.map(entry=><article key={entry.id}><h3>{entry.name}</h3><p>{entry.duration.toFixed(2)}s · {birds.find(b=>b.id===entry.birdId)?.commonName}</p><audio controls preload="none" src={entry.audio} aria-label={`Play draft ${entry.name}`} onPlay={event=>{stop();document.querySelectorAll('audio').forEach(audio=>{if(audio!==event.currentTarget)audio.pause();});}}/><button disabled={busy} onClick={()=>open(entry)}>Edit draft</button></article>)}</div></section>
    <section className="world-panel"><h2>Approved DJ chirps · {library.approved.length}</h2><p>These are reusable sounds for players. Edit a copy to preserve existing chirps and saved mixes.</p><div className="library-grid">{library.approved.map(entry=><article key={entry.id}><h3>{entry.name}</h3><p>{entry.duration.toFixed(2)}s · {entry.creator}</p><audio controls preload="none" src={entry.audio} aria-label={`Play approved chirp ${entry.name}`} onPlay={event=>{stop();document.querySelectorAll('audio').forEach(audio=>{if(audio!==event.currentTarget)audio.pause();});}}/><button disabled={busy} onClick={()=>open(entry)}>Edit a copy</button><p><a href={entry.sourceUrl}>Source</a> · {entry.license}</p></article>)}</div></section>
  </main>;
}
