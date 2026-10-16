import {microphoneRequest,recorderOptions,inputDetails,recordingLevel} from './microphone-check';
import { useEffect, useRef, useState } from 'react';
import RecordingShelf from './RecordingShelf';
import FlockPlayback from './FlockPlayback';
import { ALABAMA_POINTS, seasonWeek, regionalMatches } from './listening-region';
import { waveformPeaks, validRecordingDuration, signalQuality, DETECTION_THRESHOLD, FAINT_THRESHOLD } from './listening-timeline';

const HEARD_KEY = 'birdsong-confirmed-heard-v1';
function readHeard() {
  try { const value = JSON.parse(localStorage.getItem(HEARD_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
export default function OutdoorListening({ onHome, BirdArt, onPractice }) {
  const [status, setStatus] = useState('idle');
  const [modelReady, setModelReady] = useState(false);
  const [message, setMessage] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null);
  const [matches, setMatches] = useState(null);
  const [segments, setSegments] = useState([]);
  const [waveform, setWaveform] = useState([]);
  const [duration, setDuration] = useState(0);
  const [sensitivity, setSensitivity] = useState(DETECTION_THRESHOLD);
  const [region, setRegion] = useState(() => {try {return localStorage.getItem('birdsong-listening-region-v1') === 'alabama' ? 'alabama' : 'world';} catch {return 'world';}});
  const regionRef = useRef(region), rangeRequest = useRef(0);
  const [rangeScores, setRangeScores] = useState(null), [rangeStatus, setRangeStatus] = useState('idle');
  const [quality, setQuality] = useState(null);
  const [liveLevel, setLiveLevel] = useState(-100),[livePeak,setLivePeak]=useState(-100),[micMode,setMicMode]=useState('natural'),[micDetails,setMicDetails]=useState(null);
  const meterContext = useRef(null), meterTimer = useRef(null);
  const [keeping,setKeeping] = useState(null);
  const [heard, setHeard] = useState(readHeard);
  const worker = useRef(null), recorder = useRef(null), stream = useRef(null);
  const workTimeout = useRef(null);
  const analysisVersion = useRef(0);
  const timer = useRef(null), stopTimer = useRef(null), audio = useRef(null), context = useRef(null);
  const mounted = useRef(true), ready = useRef(false), blobRef = useRef(null);
  const releaseMic = () => {
    clearInterval(timer.current); clearTimeout(stopTimer.current);
    clearInterval(meterTimer.current); meterTimer.current = null;
    meterContext.current?.close(); meterContext.current = null;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
  };
  useEffect(() => {
    mounted.current = true;
    const playback = audio.current;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      releaseMic(); clearTimeout(workTimeout.current); worker.current?.terminate(); playback?.pause();
      context.current?.close();
    };
  }, []);
  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip); }, [clip]);
  function cancelWork() {
    analysisVersion.current++;
    clearTimeout(workTimeout.current); worker.current?.terminate(); worker.current = null; ready.current = false; setModelReady(false); setStatus('idle'); setMessage('Listening paused. Load your kit to try again.');
  }
  function watchWork() {
    clearTimeout(workTimeout.current);
    workTimeout.current = setTimeout(() => { worker.current?.terminate(); ready.current = false; setModelReady(false); setStatus('error'); setMessage('This took too long on this device. Try loading the kit again or a shorter recording.'); }, 180000);
  }
  function requestRegion(value, instance = worker.current) {
    regionRef.current = value; setRegion(value); setRangeScores(null);
    try {localStorage.setItem('birdsong-listening-region-v1',value);} catch { /* preference is optional */ }
    const requestId = ++rangeRequest.current;
    if (value === 'world') {setRangeStatus('idle'); return;}
    if (!instance || !ready.current) {setRangeStatus('waiting'); return;}
    setRangeStatus('loading');
    instance.postMessage({type:'region',requestId,points:ALABAMA_POINTS,week:seasonWeek()});
  }
  function load() {
    setStatus('loading'); setMessage('Loading your listening kit… This first download is about 57 MB; Wi-Fi is recommended.');
    worker.current?.terminate(); ready.current = false; setModelReady(false); setRangeScores(null); setRangeStatus(regionRef.current === 'world' ? 'idle' : 'waiting');
    const instance = new Worker(new URL('./listening.worker.js', import.meta.url), {type:'module'});
    worker.current = instance;
    watchWork();
    instance.onerror = () => { clearTimeout(workTimeout.current); ready.current = false; setModelReady(false); setStatus('error'); setMessage('This device could not start the listening model. Try an up-to-date Chrome or Safari browser.'); };
    instance.onmessage = ({data}) => {
      if (!mounted.current || worker.current !== instance) return;
      if (data.type === 'progress') setMessage(`Loading your listening kit… ${Math.round(data.value * 100)}%`);
      if (data.type === 'ready') { clearTimeout(workTimeout.current); ready.current = true; setModelReady(true); setStatus('ready'); setMessage(data.backend === 'cpu' ? 'Your kit is ready. This device uses slower analysis; start with a short 3–10 second clip.' : 'Ready when you are. Find a quiet spot and listen for a clear call.'); requestRegion(regionRef.current,instance); }
      if (data.type === 'region-result' && data.requestId === rangeRequest.current) {setRangeScores(data.scores); setRangeStatus('ready');}
      if (data.type === 'region-error' && data.requestId === rangeRequest.current) {setRangeScores(null); setRangeStatus('error');}
      if (data.type === 'analyzing') setMessage(`Finding voices… ${Math.round(data.value * 100)}%`);
      if (data.type === 'results') { clearTimeout(workTimeout.current); setMatches(data.matches); setSegments(data.segments || []); setStatus('ready'); setMessage(''); }
      if (data.type === 'error') { clearTimeout(workTimeout.current); setStatus('error'); setMessage('We couldn’t analyze that recording. Try again, or reload the listening kit.'); }
    };
    instance.postMessage({type:'load'});
  }
  async function analyze(blob) {
    const version = ++analysisVersion.current;
    audio.current?.pause(); setStatus('analyzing'); setMatches(null); setSegments([]); setMessage('Preparing your recording…');
    let decoder;
    try {
      decoder = new AudioContext(); context.current = decoder;
      const decoded = await decoder.decodeAudioData(await blob.arrayBuffer());
      if (!validRecordingDuration(decoded.duration)) throw new Error('Choose a recording between 3 and 45 seconds.');
      const renderer = new OfflineAudioContext(1, Math.ceil(decoded.duration * 48000), 48000);
      const source = renderer.createBufferSource(); source.buffer = decoded; source.connect(renderer.destination); source.start();
      const converted = await renderer.startRendering();
      if (!mounted.current || version !== analysisVersion.current) return;
      const pcm = converted.getChannelData(0).slice();
      setWaveform(waveformPeaks(pcm)); setDuration(converted.duration); setQuality(signalQuality(pcm));
      watchWork();
      worker.current.postMessage({type:'analyze', pcm}, [pcm.buffer]);
    } catch (error) {
      if (mounted.current && version === analysisVersion.current) { setStatus('ready'); setMessage(error.message === 'Choose a recording between 3 and 45 seconds.' ? error.message : 'We couldn’t read this audio. Try a WAV, MP3, or a new microphone recording.'); }
    } finally { if (decoder?.state !== 'closed') await decoder?.close(); context.current = null; }
  }
  async function startRecording() {
    setKeeping(null);setMicDetails(null);setQuality(null); audio.current?.pause(); setMatches(null); setSegments([]); setMessage('Allow microphone access to record up to 45 seconds.');
    setStatus('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('unsupported');
      const input = await navigator.mediaDevices.getUserMedia(microphoneRequest(micMode));
      if (!mounted.current) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      setMicDetails({...inputDetails(input.getAudioTracks()[0]),mode:micMode});
      // Optional input meter. A meter failure must not prevent recording.
      try {
        const meter = new AudioContext(); meterContext.current = meter;
        await meter.resume();
        const analyser = meter.createAnalyser(); analyser.fftSize = 1024;
        meter.createMediaStreamSource(input).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        setLiveLevel(-100);setLivePeak(-100);
        meterTimer.current = setInterval(() => {
          analyser.getFloatTimeDomainData(samples);
          const quality=signalQuality(samples,meter.sampleRate);setLiveLevel(quality.db);setLivePeak(old=>Math.max(old,quality.peakDb));
        }, 120);
      } catch { meterContext.current?.close(); meterContext.current = null; }
      if (!mounted.current) { releaseMic(); return; }
      const chunks = [];
      let capture;try{capture=new MediaRecorder(input,recorderOptions(MediaRecorder));}catch{capture=new MediaRecorder(input);}recorder.current = capture;
      setMicDetails(details=>({...details,format:capture.mimeType,bitrate:capture.audioBitsPerSecond||null}));
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onerror = () => { releaseMic(); setStatus('ready'); setMessage('Recording stopped unexpectedly. Please try again.'); };
      capture.onstop = () => {
        releaseMic(); if (!mounted.current) return;
        const blob = new Blob(chunks, {type:capture.mimeType}); blobRef.current = blob;
        setWaveform([]); setDuration(0); setQuality(null); setClip(URL.createObjectURL(blob)); setStatus('ready'); setMessage('Recording ready. Next, tap Find birds, then play to watch your flock.');
      };
      capture.start(); setSeconds(0); setStatus('recording'); setMessage('Listening… microphone turns off when you stop.');
      timer.current = setInterval(() => setSeconds(value => value + 1), 1000);
      stopTimer.current = setTimeout(() => { if (capture.state === 'recording') capture.stop(); }, 45000);
    } catch (error) {
      releaseMic(); setStatus('ready');
      setMessage(error.name === 'NotAllowedError' ? 'Microphone access was declined. You can allow it in your browser or choose an audio clip instead.' : 'The microphone is unavailable. Try an audio clip instead.');
    }
  }
  function discard() {
    analysisVersion.current++;
    audio.current?.pause(); blobRef.current = null;
    setKeeping(null);setMicDetails(null); setClip(null); setWaveform([]); setDuration(0); setQuality(null); setMatches(null); setSegments([]);
    setMessage('Recording discarded. Ready for another voice.');
  }
  function confirm(match) {
    const entry = {name:match.name, scientificName:match.scientificName, timestamp:new Date().getTime()};
    const next = heard.some(item => item.scientificName === match.scientificName) ? heard : [...heard, entry];
    try { localStorage.setItem(HEARD_KEY, JSON.stringify(next)); setHeard(next); } catch { setMessage('This browser couldn’t save your heard list.'); }
  }
  const visibleMatches = regionalMatches(matches,sensitivity,region,rangeScores);
  const resultMessage = region !== 'world' && rangeStatus !== 'ready' ? 'Waiting for the regional filter before showing suggestions.' : matches !== null ? visibleMatches.length
    ? `Possible voices in your recording. ${visibleMatches.some(match => match.score < DETECTION_THRESHOLD) ? 'Tentative suggestions need a careful listen; they are not confirmed IDs.' : 'Listen and compare before confirming.'}`
    : matches.length ? sensitivity === DETECTION_THRESHOLD ? 'No regional match at the standard cutoff. Try Faint calls to inspect tentative suggestions.' : 'No plausible regional match at this cutoff. A clearer recording may help.'
    : 'The model didn’t find a match at either cutoff. This does not prove that the birds or microphone were too quiet. Replay the clip: if the calls are clear, this may be an identification limitation.' : '';
  const busy = ['loading','analyzing','requesting','recording'].includes(status);
  return <main className={`screen outdoor-screen ${visibleMatches?.length ? "has-flock" : ""}`}>
    <button className="back-button" onClick={onHome}>← Explore</button>
    <p className="eyebrow">TAKE YOUR EAR OUTSIDE · BETA</p>
    <h1>Who’s singing?</h1>
    <p>Record a little birdsong. Discover a voice. Learn it for your next walk.</p><p className="world-small-note">Free noncommercial listening beta. The kit downloads about 57 MB when you load it. Your audio is analyzed on this device; start with a short clip and keep this page open while it works.</p>
    <div className="listening-region"><label>Listening region<select aria-label="Listening region" value={region} onChange={event => {audio.current?.pause(); requestRegion(event.target.value);}}><option value="world">Worldwide · no range filter</option><option value="alabama">Alabama · seasonal range filter</option></select></label><small role="status">{region === 'world' ? 'Worldwide guesses can include birds unlikely in your area.' : rangeStatus === 'ready' ? 'Alabama seasonal filter active. Rare visitors may be hidden; switch to Worldwide to review them. Audio scores are unchanged.' : rangeStatus === 'error' ? 'Range filter unavailable. Reload your kit or choose Worldwide; regional suggestions are hidden.' : rangeStatus === 'loading' ? 'Loading Alabama’s seasonal range filter…' : 'Alabama selected. Load your listening kit to apply the filter.'}</small></div>
    <details className="listening-kit" open={!visibleMatches?.length}><summary>{visibleMatches?.length ? "Record another voice or choose a clip" : "Your outdoor listening kit"}</summary>
      <div aria-label="Outdoor recording">
      <span className="listening-symbol" aria-hidden="true">♪</span>
      <h2>{status === 'recording' ? `Listening · ${seconds}s / 45s` : '1 · Record birdsong'}</h2>
      <p>Audio stays on this device. Recording starts only when you tap Record.</p><label className="mic-mode">Microphone level mode<select aria-label="Microphone level mode" value={micMode} disabled={busy} onChange={event=>setMicMode(event.target.value)}><option value="natural">Natural · no automatic level boost</option><option value="automatic">Automatic level · compare if playback is quiet</option></select></label><p className="world-small-note">Start with a 5–10 second recording, then replay it. If the recording sounds much quieter than the birds, try Automatic level on your next recording. Browser support varies.</p>
      <p role="status" aria-live="polite">{clip && matches !== null ? '' : message || 'Load your listening kit once, then record a 3–45 second call.'}</p>
      {status === 'recording' && <div className="recording-level"><label htmlFor="live-recording-level">Microphone level · {liveLevel < -50 ? 'Low recorded level' : liveLevel > -12 ? 'Very loud' : 'Receiving sound'}</label><meter id="live-recording-level" min="-80" max="0" low="-50" high="-12" optimum="-28" value={Math.max(-80,liveLevel)} /><small>Strongest sound this recording: {Math.round(livePeak)} dBFS. This is recorded volume, not a bird detector or a judgment of how loud the birds are outside.</small></div>}
      {!modelReady ? <button className="primary-button" disabled={status === 'loading'} onClick={load}>{status === 'loading' ? 'Loading…' : 'Load listening kit'} <span>↓</span></button> : <>
        <button className="primary-button" disabled={busy && status !== 'recording'} onClick={status === 'recording' ? () => recorder.current?.stop() : startRecording}>{status === 'recording' ? 'Stop recording' : 'Record birdsong'} <span>{status === 'recording' ? '■' : '●'}</span></button>
        <label className="listening-upload">Or choose a 3–45 second audio clip<input type="file" accept="audio/*" disabled={busy} onChange={event => {
          const file = event.target.files[0]; event.target.value = '';
          if (!file) return;
          if (file.size > 20 * 1024 * 1024) { setMessage('Choose a clip smaller than 20 MB.'); return; }
          setKeeping(null);setMicDetails(null); audio.current?.pause(); setWaveform([]); setDuration(0); setQuality(null); setMatches(null); setSegments([]); blobRef.current = file; setClip(URL.createObjectURL(file)); setMessage('Recording ready. Next, tap Find birds.');
        }} /></label>
      </>}
      {modelReady && <button className="listening-cancel" disabled={busy} onClick={load}>Reload listening kit</button>}
      {['loading','analyzing'].includes(status) && <button className="listening-cancel" onClick={cancelWork}>Cancel</button>}
      </div>
    </details>
    {clip && <>
      <section className="listening-next" aria-label="Find birds in your recording"><h2>2 · Find birds</h2><p>{matches !== null ? 'Your suggestions are ready. Play below to watch your flock.' : 'Identify possible voices before playing your dancing flock.'}</p><button className="flock-analyze" disabled={busy || !modelReady} onClick={() => analyze(blobRef.current)}>{status === 'analyzing' ? 'Finding birds…' : matches !== null ? 'Find birds again' : 'Find birds →'}</button>{status === 'analyzing' && <p role="status">{message}</p>}</section>
      {matches !== null && <div className="recording-result"><p role="status">{resultMessage}</p><label className="recording-sensitivity">Detection sensitivity<select aria-label="Detection sensitivity" value={sensitivity} onChange={event => {audio.current?.pause(); setSensitivity(Number(event.target.value));}}><option value={DETECTION_THRESHOLD}>Standard · 35% cutoff</option><option value={FAINT_THRESHOLD}>Faint calls · 10% cutoff</option></select></label><small>Lowering the cutoff can reveal weak calls and incorrect guesses. Scores are model confidence, not identification certainty.</small></div>}
      {quality && <div className="recording-quality"><p>Recording check: <strong>{recordingLevel(quality)}</strong> · strongest moment {Math.round(quality.strongestDb)} dBFS · peak {Math.round(quality.peakDb)} dBFS · average {Math.round(quality.db)} dBFS.</p><p>{quality.clipped?'Some recorded sound is distorted; compare another recording.':quality.quiet?'The average level is low. Quiet stretches can lower the average even when calls are clear. Listen to playback before changing your recording setup.':'Recorded level alone cannot tell us whether bird calls are identifiable.'} These readings never block identification.</p></div>}

      <FlockPlayback key={clip} clip={clip} waveform={waveform} duration={duration} matches={visibleMatches} segments={segments} audioRef={audio} BirdArt={BirdArt} heard={heard} onConfirm={confirm} onPractice={onPractice} analyzing={status === 'analyzing'} onKeep={match=>{audio.current?.pause();setKeeping({match,blob:blobRef.current});}} />
      
      <div className="recording-retention"><small>Unsaved recording · discarded when you leave. Only trimmed calls you explicitly save are kept on this device.</small><button disabled={busy} onClick={discard}>Discard recording</button></div>
    </>}
    {micDetails&&<details className="mic-details"><summary>Microphone check · {micDetails.name}</summary><p>Requested mode: {micDetails.mode==='automatic'?'Automatic level':'Natural'}. Safari/browser reports:</p><ul><li>Automatic level: {micDetails.automaticLevel===undefined?'not reported':micDetails.automaticLevel?'on':'off'}</li><li>Noise suppression: {micDetails.noiseSuppression===undefined?'not reported':micDetails.noiseSuppression?'on':'off'}</li><li>Echo cancellation: {micDetails.echoCancellation===undefined?'not reported':micDetails.echoCancellation?'on':'off'}</li><li>Sample rate: {micDetails.sampleRate?`${micDetails.sampleRate} Hz`:'not reported'} · channels: {micDetails.channels||'not reported'}</li><li>Recording format: {micDetails.format||'browser default'}{micDetails.bitrate?` · ${Math.round(micDetails.bitrate/1000)} kbps`:''}</li></ul><p>These details stay on this page. If the microphone name is a headset, disconnect it and make a new recording with the phone.</p></details>}
    <RecordingShelf blob={keeping?.blob} match={keeping?.match} onClose={()=>setKeeping(null)} />
    <section className="heard-list"><h2>Your heard list · {heard.length}</h2><p>Your confirmed outdoor discoveries. Your game flock still grows through 80% flights.</p>{heard.length > 0 && <ul>{heard.map(item => <li key={item.scientificName}>{item.name}</li>)}</ul>}</section>
    <p className="listening-credit">Powered by <a href="https://birdnet.cornell.edu/" target="_blank" rel="noreferrer">BirdNET</a>, Cornell Lab of Ornithology and Chemnitz University of Technology. Model: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>. Noncommercial educational beta · independent of BirdNET. <a href="/birdnet/ATTRIBUTION.txt" target="_blank" rel="noreferrer">Model credits</a> · <a href="/birdnet/LICENSE.txt" target="_blank" rel="noreferrer">Full model license</a>.</p>
  </main>;
}
