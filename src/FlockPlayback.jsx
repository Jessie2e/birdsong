import { useEffect, useId, useRef, useState } from 'react';
import { birds } from './data/birds';
import { activeSpecies, DETECTION_THRESHOLD } from './listening-timeline';

const timeLabel = time => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2,'0')}`;

function BirdDetails({id, match, BirdArt, saved, onConfirm, onPractice, onClose, onReferencePlay, onKeep}) {
  const dialog = useRef(null), reference = useRef(null);
  const heading = useId();
  const bird = birds.find(item => item.scientificName === match.scientificName);
  useEffect(() => {
    const modal = dialog.current, sound = reference.current;
    if (!modal.open) modal.showModal();
    // Removing the dialog also removes its native backdrop. Closing in effect
    // cleanup would dispatch a close event during React StrictMode replay.
    return () => sound?.pause();
  }, []);
  return <dialog id={id} ref={dialog} className="flock-details" aria-labelledby={heading} onClose={() => { reference.current?.pause(); onClose(); }}>
    {match.score < DETECTION_THRESHOLD && <p className="tentative-note">Tentative suggestion · a low model score. Compare the recording carefully before confirming.</p>}
    <button className="flock-details-close" onClick={() => dialog.current.close()} aria-label="Close bird details">×</button>
    {bird && <div className="flock-detail-art"><BirdArt bird={bird} small /></div>}
    <p className="eyebrow">A POSSIBLE VOICE</p>
    <h2 id={heading}>{match.name}</h2><p><em>{match.scientificName}</em></p>
    <p className="flock-score">Model score {Math.round(match.score * 100)}% · not certainty</p>
    {bird ? <><p>{bird.mnemonic}</p><p>{bird.fact}</p><label className="flock-reference-label">Compare its reference call<audio ref={reference} controls preload="none" src={bird.audio} aria-label={`Compare ${bird.commonName} call`} onPlay={onReferencePlay} /></label></> : <p>This voice doesn’t have an illustrated field-guide entry yet.</p>}
    <button className="flock-confirm" disabled={saved} onClick={() => onConfirm(match)}>{saved ? '✓ In your heard list' : 'Confirm this match'}</button>
    {bird && onKeep && <button className="flock-confirm" disabled={!saved} onClick={() => { reference.current?.pause(); onKeep(match); dialog.current.close(); }}>{saved ? "Keep this call →" : "Confirm this match to save a call"}</button>}
    {bird && <button className="flock-practice" onClick={() => { reference.current?.pause(); onPractice(bird.id); }}>Learn this voice →</button>}
  </dialog>;
}

export default function FlockPlayback({clip, waveform, duration, matches, segments, audioRef, BirdArt, heard, onConfirm, onPractice, analyzing, onKeep}) {
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [mediaDuration,setMediaDuration] = useState(0);
  const [selected,setSelected] = useState(null), [error,setError] = useState('');
  const detailId = useId();
  useEffect(() => {
    const playback = audioRef.current;
    return () => playback?.pause();
  }, [audioRef]);
  useEffect(() => {
    if (!playing) return;
    let frame, previous = 0;
    const tick = now => {
      if (now - previous > 80) { setTime(audioRef.current?.currentTime || 0); previous = now; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing,audioRef]);
  const length = duration || mediaDuration;
  const active = activeSpecies(segments, time, playing);
  const progress = length ? Math.min(time / length,1) : 0;
  const selectedMatch = matches?.find(match => match.scientificName === selected);
  async function toggle() {
    const player = audioRef.current;
    if (!player) return;
    if (!player.paused) { player.pause(); return; }
    try { setError(''); await player.play(); } catch { setError('Playback couldn’t start. Tap Play again or choose another clip.'); }
  }
  function seek(value) { const player = audioRef.current; if (!player || !Number.isFinite(player.duration)) return; player.currentTime = Number(value); setTime(player.currentTime); }
  return <section className="flock-player" aria-label="Recording and listening flock">
    <div className="flock-player-heading"><div><p className="eyebrow">3 · PLAY YOUR LISTENING FLOCK</p><h2>{matches?.length ? `${matches.length} possible ${matches.length === 1 ? 'voice' : 'voices'}.` : 'See your sound.'}</h2></div><span className="flock-play-state">{playing ? '♪ Playing' : 'Ready to replay'}</span></div>
    {matches?.length > 0 ? <><div className="listening-flock" role="group" aria-label="Possible voices. Tap a portrait for details.">{matches.map(match => {
      const bird = birds.find(item => item.scientificName === match.scientificName);
      const singing = active.has(match.scientificName);
      return <button className={`flock-voice ${singing ? 'is-singing' : ''}`} key={match.scientificName} aria-label={`${match.name}${match.score < DETECTION_THRESHOLD ? ', tentative suggestion' : ''}${singing ? ', detected here' : ''}. Open details`} aria-haspopup="dialog" aria-controls={detailId} onClick={() => setSelected(match.scientificName)}>
        <span className="flock-portrait"><span className="flock-note" aria-hidden="true">♪</span>{bird ? <span className="flock-bird-art" aria-hidden="true"><BirdArt bird={bird} small /></span> : <span className="flock-unknown" aria-hidden="true">♪</span>}</span>
        <span className="flock-voice-name">{match.name}</span><span className="flock-voice-state">{match.score < DETECTION_THRESHOLD ? 'Tentative' : singing ? 'Detected here' : 'Listen for me'}</span>
      </button>;
    })}</div><p className="flock-timing-note">Suggested voices: play your recording to watch them light up together. Highlights show approximate 3-second detections, not each exact note.</p></> : <p className="flock-timing-note">{analyzing ? 'Finding the voices in your waveform…' : 'Find bird voices to bring your flock to life.'}</p>}
    <div className="flock-waveform" aria-hidden="true"><svg viewBox="0 0 1000 100" preserveAspectRatio="none">{(waveform.length ? waveform : Array(120).fill(0.02)).map((peak,index,array) => {
      const height = Math.max(3,peak * 86), width=1000 / array.length;
      return <rect key={index} x={index * width + 1} y={(100-height)/2} width={Math.max(1,width-3)} height={height} rx="2" fill={index / array.length <= progress ? '#b75a40' : '#78958a'} />;
    })}<line x1={progress * 1000} x2={progress * 1000} y1="0" y2="100" stroke="#254d41" strokeWidth="3" /></svg></div>
    <div className="flock-transport"><button disabled={analyzing} onClick={toggle} aria-label={playing ? 'Pause recording' : 'Play recording'}>{playing ? 'Ⅱ Pause' : '▶ Play'}</button><button onClick={() => seek(0)} aria-label="Restart recording">↺</button><input aria-label="Recording position" type="range" min="0" max={length || 1} step="0.05" value={Math.min(time,length || 1)} disabled={!length} onChange={event => seek(event.target.value)} /><span>{timeLabel(time)} / {timeLabel(length)}</span></div>
    <audio ref={audioRef} src={clip} preload="metadata" onLoadedMetadata={event => { if (Number.isFinite(event.currentTarget.duration)) setMediaDuration(event.currentTarget.duration); }} onPlay={() => setPlaying(true)} onPause={() => {setPlaying(false);setTime(audioRef.current?.currentTime || 0);}} onEnded={() => setPlaying(false)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onError={() => {setPlaying(false);setError('This clip couldn’t be played. Try a different audio format.');}} />
    {error && <p role="alert">{error}</p>}
    {selectedMatch && <BirdDetails id={detailId} match={selectedMatch} BirdArt={BirdArt} saved={heard.some(item => item.scientificName === selected)} onConfirm={onConfirm} onPractice={onPractice} onClose={() => setSelected(null)} onReferencePlay={() => audioRef.current?.pause()} onKeep={onKeep} />}
  </section>;
}
