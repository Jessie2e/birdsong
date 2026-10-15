import { useEffect, useRef, useState } from 'react';
import { birds } from './data/birds';
import { shuffle } from './progress';

const pair = ['cardinal', 'house-finch'].map(id => birds.find(bird => bird.id === id));
const cues = {
  cardinal: { title: 'Clear, repeated whistles', detail: 'Listen for distinct whistled phrases, often repeated: “cheer, cheer, cheer.”', source: 'https://www.allaboutbirds.org/guide/Northern_Cardinal/sounds' },
  'house-finch': { title: 'A jumble of warbling notes', detail: 'Listen for a flowing mix of notes, often with a sliding note at the end.', source: 'https://www.allaboutbirds.org/guide/House_Finch/sounds' },
};

function makeRounds() {
  return shuffle([...pair, ...pair, ...pair]);
}

export default function SoundAlikes({ onHome, onComplete, sessions, BirdArt }) {
  const [stage, setStage] = useState('compare');
  const [quizStarted, setQuizStarted] = useState(false);
  const [heard, setHeard] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [rounds, setRounds] = useState(makeRounds);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [roundHeard, setRoundHeard] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const target = rounds[index];
  const score = answers.filter(answer => answer.correct).length;
  const previousBest = Math.max(0, ...sessions.filter(session => session.mode === 'sound-alikes' && session.pairId === 'cardinal-finch').map(session => session.score));

  function stop() {
    clearTimeout(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(null);
    setLoading(false);
  }

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    audioRef.current?.pause();
  }, []);

  function play(bird) {
    if (playing === bird.id) { stop(); return; }
    stop();
    setAudioError('');
    setPlaying(bird.id);
    setLoading(true);
    const audio = new Audio(bird.audio);
    audio.volume = 0.85;
    audioRef.current = audio;
    const failed = () => {
      if (audioRef.current !== audio) return;
      stop();
      setAudioError('This recording couldn’t load. Check your connection and try listening again.');
    };
    timerRef.current = setTimeout(failed, 15000);
    audio.onplaying = () => {
      if (audioRef.current !== audio) return;
      clearTimeout(timerRef.current);
      setLoading(false);
      if (stage === 'compare') setHeard(current => current.includes(bird.id) ? current : [...current, bird.id]);
      else setRoundHeard(true);
      // Keep long source recordings manageable; every replay starts at the beginning.
      timerRef.current = setTimeout(() => { if (audioRef.current === audio) stop(); }, 10000);
    };
    audio.onended = () => { if (audioRef.current === audio) stop(); };
    audio.onerror = failed;
    audio.play().catch(failed);
  }

  function begin() {
    stop();
    setAudioError('');
    setRounds(makeRounds());
    setIndex(0);
    setSelected(null);
    setRoundHeard(false);
    setAnswers([]);
    setSessionId(crypto.randomUUID());
    setQuizStarted(true);
    setStage('quiz');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function choose(bird) {
    if (selected || !roundHeard) return;
    stop();
    setSelected(bird.id);
    setAnswers(current => [...current, { birdId: target.id, selectedBirdId: bird.id, correct: bird.id === target.id, recordingId: `${target.id}-original`, timestamp: Date.now() }]);
  }

  function next() {
    stop();
    setAudioError('');
    if (index === rounds.length - 1) {
      const completedAt = answers.at(-1).timestamp;
      onComplete({ id: sessionId, mode: 'sound-alikes', pairId: 'cardinal-finch', timestamp: completedAt, score, total: rounds.length, birdIds: answers.map(answer => answer.birdId), answers });
      setQuizStarted(false);
      setStage('results');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    setIndex(current => current + 1);
    setSelected(null);
    setRoundHeard(false);
  }

  function compareAgain() {
    stop();
    setAudioError('');
    setStage('compare');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return <main className="screen collection-screen sound-alikes-screen">
    <button className="back-button" onClick={() => { stop(); onHome(); }}>← Home</button>
    {stage === 'compare' && <>
      <header className="section-header compare-header">
        <p className="eyebrow">SOUND-ALIKES · FIRST PAIR</p>
        <h2>Two birds. Two voices.</h2>
        <p>Cardinal or House Finch? Hear both, find the difference, then test your ear in six questions.</p>
      </header>
      <div className="compare-grid">
        {pair.map(bird => <article className="compare-card" key={bird.id}>
          <div className="compare-art"><BirdArt bird={bird} small /></div>
          <h3>{bird.commonName}</h3>
          <strong>{cues[bird.id].title}</strong>
          <p>{cues[bird.id].detail}</p>
          <button className="compare-listen" aria-pressed={playing === bird.id} onClick={() => play(bird)}>
            {playing === bird.id ? loading ? 'Loading… · Cancel' : '■ Stop song' : '♪ Listen to song'}
          </button>
          <span className="compare-heard">{heard.includes(bird.id) ? '✓ Listened' : 'Listen before the challenge'}</span>
        </article>)}
      </div>
      <div className="compare-tip"><strong>Listen for the pattern.</strong> Compare the repeated whistles with the more varied warble. These are two examples; each species has other sounds, too.</div>
      <div className="compare-start">
        <button className="primary-button" disabled={heard.length < 2} onClick={quizStarted ? () => { stop(); setAudioError(''); setStage('quiz'); window.scrollTo({ top: 0, behavior: 'instant' }); } : begin}>{quizStarted ? 'Continue challenge' : 'Test my ear'} <span>→</span></button>
        <p>{heard.length < 2 ? `Listen to ${heard.length === 0 ? 'both birds' : 'the other bird'} to start.` : 'Ready when you are. Replays are always allowed.'}</p>
        <p className="comparison-goal">{previousBest >= 5 ? `✨ Two Voices earned · Personal best: ${previousBest}/6` : previousBest > 0 ? `Your best: ${previousBest}/6 · Aim for 5/6 to earn Two Voices.` : "Aim for 5/6 to earn the Two Voices badge."}</p>
        <small>This challenge has its own score. Your flight accuracy and flock unlocks stay separate.</small>
      </div>
      <p className="compare-sources">Listening cues: <a href={cues.cardinal.source} target="_blank" rel="noreferrer">Cornell’s Cardinal guide ↗</a> · <a href={cues['house-finch'].source} target="_blank" rel="noreferrer">House Finch guide ↗</a></p>
    </>}
    {stage === 'quiz' && <>
      <div className="comparison-topline"><span className="eyebrow">SOUND-ALIKES</span><strong>Question {index + 1} of {rounds.length} · {score} correct</strong></div>
      <progress className="comparison-progress" max={rounds.length} value={index} aria-label="Challenge progress" />
      <header className="section-header compare-header"><h2>Which voice is this?</h2><p>Listen for the pattern. Take your time.</p></header>
      <button className="sound-button comparison-sound" aria-pressed={Boolean(playing)} onClick={() => play(target)}>
        <span className="sound-icon">{playing ? '■' : '♪'}</span>
        <span><strong>{playing ? loading ? 'Loading… · Cancel' : 'Stop song' : 'Play mystery song'}</strong><small>Replay whenever you like</small></span>
      </button>
      <div className="compare-answers">{pair.map(bird => <button key={bird.id} disabled={!roundHeard || Boolean(selected)} className={`comparison-answer ${selected && bird.id === target.id ? 'is-correct' : selected === bird.id ? 'is-wrong' : ''}`} onClick={() => choose(bird)}><div className="comparison-answer-art"><BirdArt bird={bird} small /></div><span>{bird.commonName}</span></button>)}</div>
      {!roundHeard && <p className="comparison-instruction" role="status">Play the song before choosing a bird.</p>}
      {selected && <section className="comparison-feedback" aria-live="polite"><strong>{selected === target.id ? '✓ Nice ear!' : `That was the ${target.commonName}.`}</strong><p>{cues[target.id].detail}</p><button className="primary-button" onClick={next}>{index === rounds.length - 1 ? 'See my result' : 'Next voice'} <span>→</span></button></section>}
      <button className="text-button" onClick={compareAgain}>Compare the songs again</button>
    </>}
    {stage === 'results' && <section className="comparison-results">
      <p className="eyebrow">PAIR COMPLETE</p><h2>{score}/{rounds.length}</h2><h3>{score >= 5 ? 'Two voices, sharper ears.' : 'One difference worth another listen.'}</h3>
      <p>{score >= 5 ? 'You picked out the patterns in these two recordings. Keep listening for them on your next walk.' : 'Try hearing the repeated whistles next to the varied warble again, then come back for another go.'}</p>
      <p className="comparison-best">Personal best: {previousBest}/{rounds.length}</p>
      {score >= 5 && <p className="comparison-badge">✨ {sessions.some(session => session.mode === 'sound-alikes' && session.pairId === 'cardinal-finch' && session.id !== sessionId && session.score >= 5) ? 'Two Voices badge earned' : 'New badge: Two Voices'}</p>}
      <button className="primary-button" onClick={begin}>Try the pair again <span>↻</span></button>
      <button className="review-button" onClick={compareAgain}>♪ Compare the songs</button>
      <button className="text-button" onClick={() => { stop(); onHome(); }}>Back Home</button>
    </section>}
    {audioError && <p className="comparison-error" role="alert">{audioError}</p>}
  </main>;
}
