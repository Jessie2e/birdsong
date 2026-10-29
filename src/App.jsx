import { djChirps } from "./dj-library";
import { lazy, Suspense } from "react";
import { songProgress, unlockedSongRecordings } from "./song-progress";
const LibraryWorkbench = import.meta.env.DEV ? lazy(() => import("./LibraryWorkbench")) : null;
import AdvancedListening from './AdvancedListening';
import { useEffect, useRef, useState } from "react";
import { birds } from "./data/birds";
import SoundAlikes from "./SoundAlikes";
import OutdoorListening from "./OutdoorListening";
import BirdsongStudio from "./BirdsongStudio";
import { initialFlock, unlockOrder, earnsBird } from "./flock";
import { shuffle, planFlight, recognition, recentStats, badgeProgress } from "./progress";

import { audioCredits } from "./audio-credits";
import useRecordings from "./useRecordings";
import { personalRounds } from "./personal-recordings";
import { variedReferenceRounds, referenceRecordings } from "./flight-recordings";
import RecordingShelf from "./RecordingShelf";
import BirdHub from "./BirdHub";
import ExploreWorld from "./ExploreWorld";
import Sanctuary from "./Sanctuary";
import {WORLD_KEY,claimMilestone} from "./world-progress";
import NextAdventure from "./NextAdventure";


const GUESS_HISTORY_KEY = "birdsong-guess-history-v1";
const RESET_AT_KEY = "birdsong-reset-at-v1";
const DISCOVERED_KEY = "birdsong-discovered-v3";
const SPOTTED_KEY = "birdsong-spotted-v1";

function getFlightRating(score) {
  if (score === 10) return "🪶🪶🪶 Perfect flight";
  if (score >= 8) return "🪶🪶 Sharp ears";
  if (score >= 5) return "🪶 Getting the hang of it";
  return "🌱 Finding your wings";
}

function readStoredJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function getBirdStats(history, birdId, after = 0) {
  const guesses = history.filter(
    (guess) =>
      guess.birdId === birdId &&
      guess.timestamp >= after
  );

  const correct = guesses.filter(
    (guess) => guess.correct
  ).length;

  return {
    guesses: guesses.length,
    correct,
    accuracy:
      guesses.length > 0
        ? Math.round(
            (correct / guesses.length) * 100
          )
        : null,
  };
}

function createRounds(
  count = 10,
  correctPool = birds,
  optionPool = birds
) {
  const usableCorrectPool =
    correctPool.length > 0 ? correctPool : birds;

  return Array.from({ length: count }, () => {
    const correct =
      usableCorrectPool[
        Math.floor(Math.random() * usableCorrectPool.length)
      ];

    const wrongAnswers = shuffle(
      optionPool.filter((bird) => bird.id !== correct.id)
    ).slice(0, 3);

    return {
      correct,
      options: shuffle([correct, ...wrongAnswers]),
    };
  });
}

function BirdIllustration({ bird, small = false }) {
  return (
    <div
      className={`bird-illustration bird-${bird.id} ${
        small ? "bird-small" : ""
      }`}
      style={{
        "--body": bird.colors.body,
        "--head": bird.colors.head,
        "--wing": bird.colors.wing,
        "--beak": bird.colors.beak,
      }}
    >
      <div className="bird-tail" />

      <div className="bird-body">
        <div className="bird-belly" />
        <div className="bird-throat" />
        <div className="bird-wing" />
      </div>


<div className="bird-head">
  <div className="bird-crest" />
  <div className="bird-cap" />
  <div className="bird-cheek" />

  <div className="bird-eye">
    <span />
  </div>

  <div className="bird-beak" />
</div>

      <div className="bird-leg bird-leg-one" />
      <div className="bird-leg bird-leg-two" />
    </div>
  );
}

function LearnScreen({onHome,onPlay,onPractice,onBadges,onSoundAlikes,onStudio,onAdvanced,discoveredBirds,history,sessions,spottedBirds}) {
 return <main className="world-screen screen"><button className="back-button" onClick={onHome}>← Birdsong</button><header className="world-header"><p className="eyebrow">A LITTLE CHALLENGE. A GROWING EAR.</p><div className="learn-title-row"><h1>Play & Learn.</h1><div className="learn-header-bird bird-facing-left" aria-hidden="true"><BirdIllustration bird={birds.find(b => b.id === "bluejay")} /></div></div><p>Get to know the voices around you, one little flight at a time.</p></header><section className="flight-start-card"><p className="eyebrow">YOUR NEXT FLIGHT</p><h2>Ten calls. How many do you know?</h2><p>A flight is a short listening quiz: play a bird call, then choose its name. There’s no timer. Score <strong>8 out of 10</strong> to welcome the next bird into your Flock.</p><button className="primary-button" onClick={onPlay}>Start a 10-question flight <span>→</span></button><small>Welcomed birds are yours to enjoy in Studio and Your Nest. You can also welcome birds through music, field notes and companion visits.</small></section><details className="learning-explainer"><summary>What does “voice recognized” mean?</summary><p>It means you’re getting familiar with a bird by ear: at least four correct answers in a group of five attempts, spread over two or more flights. It adds a recognition mark to that bird’s Flock card, helps you track what you know, and gives developing voices more priority in future flights. Your learning badges celebrate these milestones too. Recognize two birds to open A sharper ear, with short phrases and two-voice challenges toward Mastered by ear.</p><p>Six consecutive correct answers on a bird’s familiar recording, across at least three completed regular flights, unlock an additional song for future flights. Preview these songs anytime in Practice; earned songs stay yours after later misses.</p><p>Welcoming a bird adds it to your Flock. Recognizing its voice records what you’ve learned about it.</p></details><NextAdventure birds={birds} history={history} sessions={sessions} discoveredBirds={discoveredBirds} onPlay={onPlay} onStudio={onStudio} onSoundAlikes={onSoundAlikes}/><div className="world-actions"><button onClick={onPractice}><strong>Practice calls</strong><span>Listen freely to the birds in your Flock</span></button><button onClick={onSoundAlikes}><strong>Sound-alikes</strong><span>Learn what makes two voices different</span></button></div><section className="world-panel"><h2>A sharper ear</h2><p>Recognize two voices to open short-phrase and two-voice challenges. Learn both to earn Mastered by ear, and earn extra Bird Bestie species changes along the way.</p><button onClick={onAdvanced}>Explore advanced listening →</button></section><ProgressSummary history={history} sessions={sessions} spottedBirds={spottedBirds} onBadges={onBadges}/></main>;
}

function GameScreen({
  onHome,
  onGuess,
  onUnlockBird,
  unlockBird = null,
  birdPool = birds,
  modeLabel = null,
  history = [], sessions = [], spottedBirds = [], onComplete, onPracticeMissed, onVisitBird, onRegularFlight, personalClips = [], focusBirdId = null,
}) {
  const [rounds, setRounds] = useState(() =>
    modeLabel ? createRounds(10, birdPool, birdPool) : variedReferenceRounds(personalRounds(planFlight(birdPool, history,10,focusBirdId),personalClips), history, unlockedSongRecordings(history, sessions))
  );

  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [startedHistory, setStartedHistory] = useState(history);
  const [answers, setAnswers] = useState([]);

  const [roundIndex, setRoundIndex] =
    useState(0);

  const [selectedBird, setSelectedBird] =
    useState(null);

  const [score, setScore] = useState(0);

  const [finished, setFinished] =
    useState(false);

  const [newlyUnlocked, setNewlyUnlocked] =
    useState(null);

  const audioRef = useRef(null);
  const completedRef = useRef(false);
  const feedbackRef = useRef(null);
  const lastRequestedBird = useRef(null);
  const [activeAudio, setActiveAudio] = useState(null);
  const headingRef = useRef(null);
  const [audioError, setAudioError] = useState("");

  const [isPlaying, setIsPlaying] =
    useState(false);

  const currentRound = rounds[roundIndex];

  function stopCurrentAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);
    setActiveAudio(null);
  }

  function playSound(bird) {
    if (audioRef.current) {
      const same = activeAudio === bird?.audio;
      stopCurrentAudio();
      if (same) return;
    }
    lastRequestedBird.current = bird;
    setAudioError("");
    if (!bird?.audio) {
      setAudioError("This bird call couldn’t play. Try again in a moment.");
      return;
    }
    const audio = new Audio(bird.audio);
    audio.volume = 0.85;
    audioRef.current = audio;
    setActiveAudio(bird.audio);
    setIsPlaying(true);
    const fail = () => {
      if (audioRef.current !== audio) return;
      stopCurrentAudio();
      setAudioError("This bird call couldn’t play. Check your connection, then try again.");
    };
    audio.onended = () => {
      if (audioRef.current !== audio) return;
      audioRef.current = null;
      setIsPlaying(false);
    };
    audio.onerror = fail;
    audio.play().catch(fail);
  }
  function toggleBirdSound() { playSound(currentRound.correct); }
  function toggleUnlockedBirdSound() { playSound(newlyUnlocked); }

  useEffect(() => {
    if (selectedBird && !finished) feedbackRef.current?.focus({ preventScroll: true });
    if (selectedBird && !finished) feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedBird, finished]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, [finished, roundIndex]);

  /*
    Stop the previous bird automatically
    whenever the round changes.
  */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);
  }, [roundIndex]);

  /*
    Stop audio if the player leaves
    the game screen.
  */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  function chooseBird(bird) {
    if (selectedBird) return;

    const correct =
      bird.id === currentRound.correct.id;

    setSelectedBird(bird);

    onGuess(
      currentRound.correct.id,
      correct, { selectedBirdId: bird.id, sessionId: sessionId, mode: modeLabel ? "nearby" : "flight", recordingId: currentRound.correct.recordingId || currentRound.correct.id + "-original" }
    );
    setAnswers(current => [...current, { birdId: currentRound.correct.id, correct }]);

    if (correct) {
      setScore((current) => current + 1);
    }
  }

  function nextRound() {
    if (!selectedBird || completedRef.current) return;
    stopCurrentAudio();
    setAudioError("");

    if (
      roundIndex ===
      rounds.length - 1
    ) {
      completedRef.current = true;
      if (unlockBird && onUnlockBird && earnsBird(score, rounds.length)) {
        setNewlyUnlocked(unlockBird);
        onUnlockBird(unlockBird.id);
      }

      onComplete?.({ id: sessionId, timestamp: Date.now(), mode: modeLabel ? "nearby" : "flight", score, birdIds: answers.map(a => a.birdId) });
      setFinished(true);
      return;
    }

    setRoundIndex(
      (current) => current + 1
    );

    setSelectedBird(null);
  }

  function restart() {
    stopCurrentAudio();

    completedRef.current = false;
    setAudioError("");
    setSessionId(crypto.randomUUID());
    setStartedHistory(history);
    setAnswers([]);
    setRounds(modeLabel ? createRounds(10, birdPool, birdPool) : variedReferenceRounds(personalRounds(planFlight(birdPool, history,10),personalClips), history, unlockedSongRecordings(history, sessions)));
    setRoundIndex(0);
    setSelectedBird(null);
    setScore(0);
    setFinished(false);
    setNewlyUnlocked(null);
  }

  function goHome() {
    stopCurrentAudio();
    onHome();
  }

  const newlyRecognized = birdPool.filter(b => recognition(history, b.id) && !recognition(startedHistory, b.id));
  const earlierSongIds = new Set(unlockedSongRecordings(startedHistory, sessions.filter(s => s.id !== sessionId)).map(r => r.id));
  const newlyUnlockedSongs = unlockedSongRecordings(history, sessions).filter(r => !earlierSongIds.has(r.id));
  const missed = [...new Set(answers.filter(a => !a.correct).map(a => a.birdId))];
  const beforeBadges = badgeProgress(startedHistory, sessions.filter(s => s.id !== sessionId), spottedBirds);
  const earnedBadges = badgeProgress(history, sessions, spottedBirds).filter(b => b.value >= b.target && beforeBadges.find(previous => previous.id === b.id)?.value < b.target);
  if (finished) {
    return (
      <main className="screen results-screen">
        <button
          className="back-button"
          onClick={goHome}
        >
          ← {modeLabel?"Birds nearby":"Play & Learn"}
        </button>

        <div className={`results-card ${score === 10 ? 'perfect-flight' : score >= 8 ? 'high-flight' : 'growing-flight'}`}>
          <header className="flight-celebration">
            <p className="eyebrow">FLIGHT COMPLETE · TEN LITTLE LISTENS</p>
            <p className="flight-rating">{getFlightRating(score)}</p>
            <h1 ref={headingRef} tabIndex={-1}>{score}<span>/10</span><small>birds identified</small></h1>
            <h2>{score === 10 ? "You made every call count!" : score >= 8 ? "That’s a flight to celebrate!" : score >= 5 ? "Your ears are finding their wings." : "A little more familiar, one call at a time."}</h2>
            <p>{score === 10 ? "Ten calls, ten right answers. Take a little bow." : score >= 8 ? "Look at you, getting to know the birds around you." : "The calls you met today will be waiting for another listen."}</p>
          </header>

          {newlyUnlocked && (
            <section className="unlock-card" aria-label="New bird in your Flock">
              <p className="eyebrow">A NEW FRIEND FOR YOUR FLOCK</p>
              <div className="unlock-bird-art" aria-hidden="true"><BirdIllustration bird={newlyUnlocked} small /></div>
              <div className="unlock-copy">
                <h3>{newlyUnlocked.commonName}</h3>
                <p>Has joined your Flock!</p>
                <button className="unlock-listen-button" aria-pressed={isPlaying && activeAudio === newlyUnlocked.audio} onClick={toggleUnlockedBirdSound}>{isPlaying && activeAudio === newlyUnlocked.audio ? "■ Stop call" : "♪ Hear your new bird"}</button>
              </div>
              <p className="unlock-home">Meet this bird on your Practice Perch, make music together in Studio, or choose it as a Bird Bestie in Your Nest.</p>
            </section>
          )}
          {audioError && <div className="flight-audio-error" role="alert"><p>{audioError}</p><button onClick={() => playSound(lastRequestedBird.current)}>Retry bird call</button></div>}

          {newlyUnlockedSongs.length > 0 && <section className="song-rewards" aria-label="New songs unlocked"><p className="eyebrow">A NEW SONG TO DISCOVER</p>{newlyUnlockedSongs.map(recording => {
            const bird = birds.find(b => b.id === recording.birdId), singing = isPlaying && activeAudio === recording.audio;
            return <article className="song-reward" key={recording.id}><div className="recognition-art" aria-hidden="true"><BirdIllustration bird={bird} small /></div><div><h3>{bird.commonName}</h3><p>Six in a row across three flights. Another song is yours to keep—and can join your next flight.</p><button className="review-button" aria-pressed={singing} onClick={() => playSound({...bird,audio:recording.audio})}>{singing ? '■ Stop new song' : '♪ Hear your new song'}</button></div></article>;})}<p>Welcoming a bird and recognizing its voice keep their own milestones.</p></section>}
          {(newlyRecognized.length > 0 || earnedBadges.length > 0) && <div className="flight-growth">
            {newlyRecognized.length > 0 && <section className="recognition-rewards" aria-label="Newly recognized voices">
              <p className="eyebrow">A VOICE YOU KNOW</p>
              {newlyRecognized.map(b => <div className="recognized-bird" key={b.id}><div className="recognition-art" aria-hidden="true"><BirdIllustration bird={b} small /></div><p><strong>{b.commonName}</strong><span>✓ Voice recognized</span></p></div>)}
              <p>You’re learning to recognize these voices by ear. This is a listening milestone, separate from welcoming a bird into your Flock.</p>
            </section>}
            {earnedBadges.length > 0 && <section className="badge-rewards" aria-label="Newly earned badges"><p className="eyebrow">LOOK WHAT YOU EARNED</p><div className="flight-badges">{earnedBadges.map(b => <article key={b.id}><span aria-hidden="true">{b.icon}</span><div><h3>{b.name}</h3><p>New badge · {b.description}</p></div></article>)}</div></section>}
          </div>}

          {!newlyUnlocked && !newlyRecognized.length && !earnedBadges.length && !newlyUnlockedSongs.length && <p className="flight-saved-note">A few more voices in your memory. Your flight is saved; keep exploring at your own pace.</p>}
          {!newlyUnlocked && !modeLabel && unlockBird && <p className="unlock-goal">Your next Flock friend is waiting. A score of 8/10 welcomes a new bird.</p>}
          {!newlyUnlocked && !modeLabel && !unlockBird && <p className="flock-complete-note">Your whole Birdsong Flock is with you. There’s always another voice to get to know.</p>}

          <nav className="flight-result-actions" aria-label="After your flight">
            <button className="primary-button" onClick={modeLabel ? () => { stopCurrentAudio(); onRegularFlight(); } : restart}>KEEP FLYING <span aria-hidden="true">→</span></button>
            <p className="next-flight-note">Another ten-question flight. Your progress comes with you.</p>
            <div className="flight-secondary-actions">
              {missed.length > 0 && <button className="review-button" onClick={() => { stopCurrentAudio(); onPracticeMissed?.(missed); }}>♪ Practice the {missed.length === 1 ? 'bird' : `${missed.length} birds`} you missed</button>}
              {newlyUnlocked && <button className="review-button" onClick={() => { stopCurrentAudio(); onVisitBird?.(newlyUnlocked.id); }}>Visit your {newlyUnlocked.commonName} →</button>}
              <button className="text-button" onClick={goHome}>Return to {modeLabel ? "Birds nearby" : "Play & Learn"}</button>
            </div>
          </nav>
        </div>
      </main>
    );
  }

  const isCorrect =
    selectedBird?.id ===
    currentRound.correct.id;

  return (
    <main className="screen game-screen">
      <div className="game-topbar">
        <button
          className="back-button"
          onClick={goHome}
        >
          <span aria-hidden="true">←</span><span className="sr-only">Return to {modeLabel ? "Birds nearby" : "Play & Learn"}</span>
        </button>

        <div className="round-counter">
          {modeLabel && (
            <small className="round-mode">
              {modeLabel}
            </small>
          )}
          Round {roundIndex + 1}
          <span>/ 10</span>
        </div>

        <div className="score">
          {score} pts
        </div>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${
              ((roundIndex + 1) / 10) *
              100
            }%`,
          }}
        />
      </div>

      {!modeLabel && unlockBird && <p className="flight-unlock-target">Your goal: 8/10 to welcome a new bird</p>}
      <section className="game-prompt">
        <p className="eyebrow">
          WHO'S SINGING?
        </p>

        <h2 ref={headingRef} tabIndex={-1}>Listen closely.</h2>

        <button
          className={`sound-button ${
            isPlaying
              ? "sound-playing"
              : ""
          }`}
          onClick={toggleBirdSound}
          aria-pressed={isPlaying}
        >
          <span className="sound-icon">
            {isPlaying ? "■" : "♪"}
          </span>

          <span>
            <strong>
              {isPlaying
                ? "Stop bird call"
                : "Play bird call"}
            </strong>

            <small>
              {isPlaying
                ? "tap to stop"
                : "tap to listen again"}
            </small>
          </span>
        </button>
        {audioError && <div className="flight-audio-error" role="alert"><p>{audioError}</p><button onClick={toggleBirdSound}>Retry bird call</button></div>}
      </section>

      <section className="bird-options" aria-label="Choose the singing bird">
        {currentRound.options.map(
          (bird) => {
            const wasSelected =
              selectedBird?.id === bird.id;

            const isAnswer =
              currentRound.correct.id ===
              bird.id;

            let className =
              "bird-option";

            if (
              selectedBird &&
              isAnswer
            ) {
              className +=
                " correct-option";
            }

            if (
              selectedBird &&
              wasSelected &&
              !isAnswer
            ) {
              className +=
                " wrong-option";
            }

            return (
              <button
                key={bird.id}
                className={className}
                onClick={() =>
                  chooseBird(bird)
                }
                disabled={Boolean(
                  selectedBird
                )}
              >
                <div className="option-art">
                  <BirdIllustration
                    bird={bird}
                    small
                  />
                </div>

                <span>
                  {bird.commonName}
                </span>
              </button>
            );
          }
        )}
      </section>

      {selectedBird && (
        <section
          className={`answer-card ${
            isCorrect
              ? "answer-correct"
              : "answer-wrong"
          }`}
        >
          <div className="answer-summary" ref={feedbackRef} tabIndex={-1} role="group" aria-label={isCorrect ? `Nice ear! ${currentRound.correct.commonName}.` : `That was ${currentRound.correct.commonName}.`} >
            <div role="status"><p className="answer-status">
              {isCorrect
                ? "✓ Nice ear!"
                : "Another listen for this one."}
            </p>

            {!isCorrect && (
              <p className="answer-reveal">
                That was the{" "}
                <strong>
                  {
                    currentRound.correct
                      .commonName
                  }
                </strong>
                .
              </p>
            )}

            </div>
            <button className="answer-next" onClick={nextRound}>
              {roundIndex === 9 ? "See Score" : "Next Bird"}<span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="answer-field-note">
            <h3>{currentRound.correct.mnemonic}</h3>
            <p>{currentRound.correct.fact}</p>
          </div>
        </section>
      )}
    </main>
  );
}

function PracticeScreen({ onHome, onPlay, history = [], sessions = [], birdPool, targeted = false, outdoor = false, visiting = false }) {
  const [recordingSelections, setRecordingSelections] = useState({});
  const [practiceError, setPracticeError] = useState(null);
  const audioRef = useRef(null);
  const [activeBirdId, setActiveBirdId] =
    useState(null);

  function stopPracticeAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setActiveBirdId(null);
  }

  function togglePracticeSound(bird) {
    setPracticeError(null);
    if (!bird.audio) { setPracticeError(bird); return; }

    // Clicking the bird that is already playing stops it.
    if (
      activeBirdId === bird.id &&
      audioRef.current
    ) {
      stopPracticeAudio();
      return;
    }

    // Clicking a different bird stops the old one first.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const audio = new Audio(bird.audio);
    audio.volume = 0.85;

    audioRef.current = audio;
    setActiveBirdId(bird.id);

    audio.onended = () => {
      if (audioRef.current !== audio) return;
      audioRef.current = null;
      setActiveBirdId(null);
    };
    const failed = () => {
      if (audioRef.current !== audio) return;
      stopPracticeAudio();
      setPracticeError(bird);
    };
    audio.onerror = failed;
    audio.play().catch(failed);
  }

  function goHome() {
    stopPracticeAudio();
    onHome();
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <main className="screen collection-screen">
      <button
        className="back-button"
        onClick={goHome}
      >
        ← {outdoor?"Listen outside":"Play & Learn"}
      </button>

      <header className="section-header">
        <p className="eyebrow">
          PRACTICE PERCH
        </p>

        <h2>{outdoor ? "Remember this voice." : visiting ? "Meet your new Flock friend." : targeted ? "Your next breakthrough." : "Meet the flock."}</h2>

        <p>
          {outdoor ? "Compare this call with what you heard outside. Listening here won’t affect accuracy or unlock your game flock." : visiting ? "Your new bird is here! Hear its call, then take your ears on another flight. You can also find this bird in Studio and Your Nest." : targeted ? "Listen to the voices you missed, then return for another flight. Listening here won’t affect accuracy." : "Tap a bird to hear its call. Start with eight birds. Score 8/10 or higher in a flight to grow your practice perch."}
        </p>
      </header>

      {!outdoor && <button className="primary-button practice-flight" onClick={() => { stopPracticeAudio(); onPlay(); }}>KEEP FLYING <span>→</span></button>}
      <div className="practice-flock-count">
        {outdoor ? "Your outdoor discovery" : targeted ? `${birdPool.length} voices to revisit` : `${birdPool.length} of ${birds.length} birds in your flock`}
      </div>

      <div className="collection-grid">
        {birdPool.map((bird) => {
          const song = songProgress(history, sessions, bird.id);
          const recordings = outdoor ? referenceRecordings(bird).slice(0, 1) : referenceRecordings(bird);
          const recordingIndex = Math.max(0, recordings.findIndex(recording => recording.id === recordingSelections[bird.id]));
          const recording = recordings[recordingIndex];
          const isPlaying =
            activeBirdId === bird.id;

          return (
            <article className="practice-entry" key={bird.id}>
            <button
              className={`practice-card ${
                isPlaying
                  ? "practice-card-playing"
                  : ""
              }`}
              key={bird.id}
              onClick={() =>
                togglePracticeSound({ ...bird, audio: recording?.audio || bird.audio })
              }
              aria-pressed={isPlaying}
            >
              <div className="practice-bird-art">
                <BirdIllustration
                  bird={bird}
                  small
                />
              </div>

              <div className="practice-copy">
                <strong>
                  {bird.commonName}
                </strong>

                <em>
                  {bird.scientificName}
                </em>

                <span>
                  {isPlaying
                    ? "■ Stop call"
                    : "♪ Hear call"}
                  {recordings.length > 1 && <small className="practice-recording-count">Recording {recordingIndex + 1} of {recordings.length}</small>}
                </span>
              </div>
            </button>
            {recordings.length > 1 && !outdoor && <p className="practice-song-status">{song.unlocked ? "✓ New song ready for flights" : "Preview here · earn this song for flights"}</p>}
            {recordings.length > 1 && !outdoor && <button className="practice-another-recording" aria-label={`Hear another recording of ${bird.commonName}`} onClick={() => {
              const next = recordings[(recordingIndex + 1) % recordings.length];
              stopPracticeAudio();
              setRecordingSelections(current => ({ ...current, [bird.id]: next.id }));
              togglePracticeSound({ ...bird, audio: next.audio });
            }}>♪ Hear another recording</button>}
            {practiceError?.id === bird.id && <div className="flight-audio-error" role="alert"><p>This recording couldn’t play. Check your connection and try again.</p><button onClick={() => togglePracticeSound(practiceError)}>Retry bird call</button></div>}
            </article>
          );
        })}
      </div>
    </main>
  );
}

function NearbyScreen({
  onHome,
  onStartPractice,
  spottedBirds,
}) {
  const [status, setStatus] = useState("idle");
  const [radius, setRadius] = useState(25);
  const [nearbyBirds, setNearbyBirds] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [placeError, setPlaceError] = useState("");
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sampleMode, setSampleMode] = useState(false);

  async function searchPlaces(event) {
    event.preventDefault();
    if (placeQuery.trim().length < 2) { setPlaceError("Enter a city or ZIP code."); return; }
    setSearchingPlaces(true); setPlaceError(""); setPlaces([]);
    try {
      const response = await fetch(`/api/location-search?q=${encodeURIComponent(placeQuery.trim())}`, { signal: AbortSignal.timeout(12000) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Location search is unavailable.");
      setPlaces(payload.places || []);
      if (!payload.places?.length) setPlaceError("No places found. Try a city with its state or country, or another ZIP code.");
    } catch { setPlaceError("We couldn’t search places right now. Check your connection and try again."); }
    finally { setSearchingPlaces(false); }
  }

  function showSample() {
    setSampleMode(true); setNearbyBirds(birds.filter(b => ["cardinal", "robin", "bluejay", "mourning-dove", "carolina-wren", "red-shouldered-hawk"].includes(b.id))); setErrorMessage(""); setStatus("success");
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Location services are not available in this browser."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 5 * 60 * 1000,
        }
      );
    });
  }

  function formatObservationDate(value) {
    if (!value) return "Reported recently";

    const parsed = new Date(value.replace(" ", "T"));

    if (Number.isNaN(parsed.getTime())) {
      return `Reported ${value}`;
    }

    return `Reported ${parsed.toLocaleDateString(
      undefined,
      { month: "short", day: "numeric" }
    )}`;
  }

  async function findNearby(nextRadius = radius, place = selectedPlace) {
    setSampleMode(false);
    setRadius(nextRadius);
    setNearbyBirds([]);
    setErrorMessage("");
    setStatus(place ? "loading" : "locating");

    try {
      const position = place ? {coords:{latitude:place.latitude, longitude:place.longitude}} : await getPosition();
      const lookupPlace = place || {latitude:position.coords.latitude, longitude:position.coords.longitude, label:"Your current location"};
      setSelectedPlace(lookupPlace);

      /*
        Round to two decimals before the request. That is
        plenty accurate for a 25–50 km bird search and means
        Birdsong never needs to send precise GPS coordinates.
      */
      const lat = position.coords.latitude.toFixed(2);
      const lng = position.coords.longitude.toFixed(2);

      setStatus("loading");

      const response = await fetch(
        `/api/nearby-birds?lat=${encodeURIComponent(
          lat
        )}&lng=${encodeURIComponent(
          lng
        )}&dist=${nextRadius}&back=7`, { signal: AbortSignal.timeout(15000) }
      );

      const payload = await response.json().catch(() => { throw new Error("The Nearby connection is unavailable. Restart the local preview and try again."); });

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Birdsong couldn't reach nearby bird reports right now."
        );
      }

      const observationByScientificName = new Map();

      for (const observation of payload.observations || []) {
        if (observation.sciName) {
          observationByScientificName.set(
            observation.sciName,
            observation
          );
        }
      }

      const matches = birds
        .filter((bird) =>
          observationByScientificName.has(
            bird.scientificName
          )
        )
        .map((bird) => ({
          ...bird,
          nearbyObservation:
            observationByScientificName.get(
              bird.scientificName
            ),
        }))
        .sort((a, b) => {
          const aDate =
            a.nearbyObservation?.obsDt || "";
          const bDate =
            b.nearbyObservation?.obsDt || "";
          return bDate.localeCompare(aDate);
        });

      setNearbyBirds(matches);
      setStatus("success");
    } catch (error) {
      console.error("Nearby bird lookup failed:", error);

      let message =
        error?.message ||
        "Birdsong couldn't find nearby reports right now.";

      if (error?.code === 1) {
        message =
          "Location permission was denied. Allow location access for Birdsong, then try again.";
      } else if (error?.code === 2) {
        message =
          "Your location couldn't be determined. Check location services and try again.";
      } else if (error?.code === 3) {
        message =
          "Finding your location took too long. Try again in a moment.";
      }

      setErrorMessage(message);
      setStatus("error");
    }
  }

  const isBusy =
    status === "locating" || status === "loading";

  return (
    <main className="screen collection-screen nearby-screen">
      <button className="back-button" onClick={onHome}>
        ← Explore
      </button>

      <header className="section-header nearby-header">
        <p className="eyebrow">PRACTICE NEARBY</p>
        <h2>Learn who's around.</h2>
        <p>
          Birdsong checks recent eBird reports and matches
          them with the species you can practice here.
        </p>
      </header>

      <section className="nearby-place-picker" aria-labelledby="nearby-place-heading">
        <h3 id="nearby-place-heading">Choose your perch</h3>
        <p>Automatic location not working? Search a city or ZIP instead.</p>
        <form onSubmit={searchPlaces}>
          <label htmlFor="nearby-place">City or ZIP code</label>
          <div className="nearby-place-form"><input id="nearby-place" value={placeQuery} onChange={event => setPlaceQuery(event.target.value)} placeholder="e.g. Chicago, IL or 60614" maxLength={100} disabled={isBusy || searchingPlaces} /><button disabled={isBusy || searchingPlaces}>{searchingPlaces ? "Searching…" : "Find place"}</button></div>
        </form>
        {placeError && <p role="alert">{placeError}</p>}
        {places.length > 0 && <ul className="nearby-place-results" aria-label="Matching places">{places.map(place => <li key={place.id}><button disabled={isBusy} onClick={() => { setSelectedPlace(place); setPlaces([]); findNearby(25, place); }}><span>{place.label}</span><span aria-hidden="true">→</span></button></li>)}</ul>}
        {selectedPlace && <p className="nearby-selected-place">Selected place: <strong>{selectedPlace.label}</strong></p>}
        <small>Place search by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> / <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a>. Your search is sent to the place provider; Birdsong doesn’t save it.</small>
        {import.meta.env.DEV && <button className="nearby-sample-button" disabled={isBusy || searchingPlaces} onClick={showSample}>Try sample birds · local preview</button>}
      </section>

      {status === "idle" && (
        <section className="nearby-intro-card">
          <div className="nearby-compass" aria-hidden="true">
            ⌖
          </div>
          <div>
            <h3>What could you hear outside?</h3>
            <p>
              Use your location to find Birdsong species
              reported within 25 km during the last 7 days.
            </p>
            <button
              className="primary-button nearby-find-button"
              onClick={() => findNearby(25, null)}
              disabled={searchingPlaces}
            >
              Use my location
              <span>→</span>
            </button>
            <small>
              Your coordinates are rounded before the lookup
              and are not saved by Birdsong.
            </small>
          </div>
        </section>
      )}

      {isBusy && (
        <section className="nearby-loading" aria-live="polite">
          <div className="nearby-loader" aria-hidden="true">
            ♪
          </div>
          <h3>
            {status === "locating"
              ? "Finding your perch…"
              : "Checking recent sightings…"}
          </h3>
          <p>
            Looking for birds in the Birdsong flock near you.
          </p>
        </section>
      )}

      {status === "error" && (
        <section className="nearby-message-card" role="alert">
          <span className="nearby-message-icon">!</span>
          <div>
            <h3>Couldn't check nearby birds.</h3>
            <p>{errorMessage}</p>
            <button onClick={() => findNearby(radius)}>
              Try again
            </button>
          </div>
        </section>
      )}

      {status === "success" && (
        <>
          <section className="nearby-summary">
            <div>
              <p className="eyebrow">{sampleMode ? "LOCAL PREVIEW · SAMPLE DATA" : "RECENTLY REPORTED"}</p>
              <h3>
                {nearbyBirds.length} of {birds.length} Birdsong
                {" "}{sampleMode ? "sample species" : "species nearby"}
              </h3>
              <p>
                {sampleMode ? "Sample birds for testing · not live sightings" : `${selectedPlace?.label || "Your current location"} · Within ${radius} km · last 7 days`}
              </p>
            </div>

            <button
              className="nearby-refresh-button"
              onClick={() => sampleMode ? showSample() : findNearby(radius)}
            >
              ↻ Refresh
            </button>
          </section>

          {nearbyBirds.length > 0 ? (
            <>
              <div className="nearby-grid">
                {nearbyBirds.map((bird) => (
                  <article
                    className="nearby-bird-card"
                    key={bird.id}
                  >
                    <div className="nearby-bird-art">
                      <BirdIllustration bird={bird} small />
                    </div>

                    <div className="nearby-bird-copy">
                      <div className="nearby-bird-heading">
                        <div>
                          <strong>{bird.commonName}</strong>
                          <em>{bird.scientificName}</em>
                        </div>

                        {spottedBirds.includes(bird.id) && (
                          <span className="life-badge">
                            ✓ Spotted
                          </span>
                        )}
                      </div>

                      <span className="nearby-report-date">
                        {sampleMode ? "Sample bird · not a sighting" : formatObservationDate(
                          bird.nearbyObservation?.obsDt
                        )}
                      </span>

                      <p>{bird.mnemonic}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="nearby-actions">
                <button
                  className="primary-button"
                  onClick={() =>
                    onStartPractice(nearbyBirds)
                  }
                >
                  Practice these {nearbyBirds.length}
                  <span>→</span>
                </button>

                {!sampleMode && radius < 50 && (
                  <button
                    className="nearby-secondary-button"
                    onClick={() => findNearby(50)}
                  >
                    Widen search to 50 km
                  </button>
                )}
              </div>
            </>
          ) : (
            <section className="nearby-empty-card">
              <div className="nearby-compass" aria-hidden="true">
                ♫
              </div>
              <h3>No flock matches yet.</h3>
              <p>
                eBird may have plenty of birds nearby, but none
                of Birdsong's current {birds.length} species were
                in the recent results.
              </p>

              {radius < 50 ? (
                <button
                  className="primary-button"
                  onClick={() => findNearby(50)}
                >
                  Try 50 km
                  <span>→</span>
                </button>
              ) : (
                <button
                  className="nearby-secondary-button"
                  onClick={() => findNearby(25)}
                >
                  Check again
                </button>
              )}
            </section>
          )}

          <p className="nearby-source-note">
            {sampleMode ? "Sample birds for testing this preview. These are not eBird observations and do not represent birds reported at your location." : "Recent observation data from eBird · Cornell Lab of Ornithology. Reports show where species have been observed, not a guarantee that a bird is currently present."}
          </p>
        </>
      )}
    </main>
  );
}

function FieldGuideScreen({
  onHome,
  history,
  resetAt,
  discoveredBirds,
  spottedBirds,
  onSetSpotted,
  onStartFresh,
}) {
  const [period, setPeriod] = useState("fresh");
  const [guideFilter, setGuideFilter] = useState("all");
  const [search, setSearch] = useState("");
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const periodHistory = period === "last" ? history.filter(g => g.timestamp < thisMonth) : history;
  const periodStart = period === "month" ? thisMonth : period === "last" ? lastMonth : period === "all" ? 0 : resetAt;
  const visibleBirds = birds.filter(bird => {
    const matchesSearch = `${bird.commonName} ${bird.scientificName}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (guideFilter === "all") return true;
    if (guideFilter === "spotted") return spottedBirds.includes(bird.id);
    if (!discoveredBirds.includes(bird.id)) return false;
    if (guideFilter === "recognized") return recognition(history, bird.id);
    if (guideFilter === "review") return !recognition(history, bird.id);
    return true;
  });
  const [flippedBirdId, setFlippedBirdId] =
    useState(null);

  const discoveredCount = birds.filter(
    (bird) =>
      discoveredBirds.includes(bird.id)
  ).length;

  const spottedCount = birds.filter(
    (bird) => spottedBirds.includes(bird.id)
  ).length;

  function startFresh() {
    const okay = window.confirm(
      "Start a fresh accuracy period? Your lifetime stats will stay exactly as they are."
    );

    if (okay) {
      setFlippedBirdId(null);
      onStartFresh();
    }
  }

  return (
    <main className="screen collection-screen">
      <button
        className="back-button"
        onClick={onHome}
      >
        ← Explore
      </button>

      <header className="section-header guide-header">
        <p className="eyebrow">
          FIELD GUIDE
        </p>

        <h2>Your Flock.</h2>

        <p>
          {discoveredCount} / {birds.length} species
          discovered · {spottedCount} spotted in the wild.
          Tap a discovered bird to flip its card, see your
          call accuracy, and mark whether you’ve spotted it.
        </p>

        <div className="guide-stat-controls">
          <span>
            Fresh-start period since{" "}
            {new Date(resetAt).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              }
            )}
          </span>

          <button onClick={startFresh}>
            Start Fresh
          </button>
        </div>
      </header>

      <div className="guide-tools">
        <label>Find a bird<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names" /></label>
        <label>Show<select value={guideFilter} onChange={e => setGuideFilter(e.target.value)}><option value="flock">My flock</option><option value="all">All birds</option><option value="review">Still learning</option><option value="recognized">👂 Recognized by ear</option><option value="spotted">👁 Spotted</option></select></label>
        <label>Accuracy period<select value={period} onChange={e => setPeriod(e.target.value)}><option value="fresh">Since fresh start</option><option value="month">This month</option><option value="last">Last month</option><option value="all">All time</option></select></label>
      </div>
      <p className="guide-filter-help">👂 Recognized: four correct answers in five attempts over at least two flights. 👁 Spotted: a sighting you marked yourself. Still learning: birds in your Flock without an ear mark yet.</p>
      {visibleBirds.length === 0 && <p className="guide-empty" role="status">No birds match yet. Try another filter or search.</p>}
      <div className="guide-grid">
        {visibleBirds.map((bird) => {
          const unlocked =
            discoveredBirds.includes(bird.id);

          const lifetime = getBirdStats(
            history,
            bird.id
          );

          const current = getBirdStats(
            periodHistory,
            bird.id,
            periodStart
          );

          const flipped =
            flippedBirdId === bird.id;

          return (
            <article
              className={`guide-card guide-flip-card ${
                flipped ? "is-flipped" : ""
              } ${
                unlocked
                  ? ""
                  : "locked-guide-card"
              }`}
              key={bird.id}
              tabIndex={unlocked ? 0 : undefined}
              onClick={
                unlocked
                  ? () =>
                      setFlippedBirdId(
                        flipped ? null : bird.id
                      )
                  : undefined
              }
              onKeyDown={
                unlocked
                  ? (event) => {
                      if (event.target !== event.currentTarget) return;
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setFlippedBirdId(
                          flipped ? null : bird.id
                        );
                      }
                    }
                  : undefined
              }
              aria-label={
                unlocked
                  ? `${bird.commonName}. Flip card for accuracy stats and spotting status.`
                  : "Undiscovered bird"
              }
            >
              <div className="guide-card-inner">
                <div className="guide-card-face guide-card-front" aria-hidden={flipped} inert={flipped}>
                  <div className="guide-art">
                    <BirdIllustration
                      bird={bird}
                      small
                    />

                    {!unlocked && (
                      <div className="locked-mark">
                        ?
                      </div>
                    )}
                  </div>

                  {unlocked ? (
                    <>
                      <span className="recognition-chip">{recognition(history, bird.id) ? "👂 Recognized by ear" : "♪ Learning"}</span>
                      {spottedBirds.includes(bird.id)&&<span className="recognition-chip">👁 Spotted outside</span>}
                      <p className="difficulty">
                        {"●".repeat(
                          bird.difficulty
                        )}

                        <span>
                          {"○".repeat(
                            3 -
                              bird.difficulty
                          )}
                        </span>
                      </p>

                      <h3>
                        {bird.commonName}
                      </h3>

                      <em>
                        {bird.scientificName}
                      </em>

                      <p>{bird.habitat}</p>

                      <div className="call-chip">
                        ♪ {bird.mnemonic}
                      </div>

                      <span className="flip-hint">
                        Flip for stats ↻
                      </span>
                    </>
                  ) : (
                    <div className="locked-copy">
                      <h3>Undiscovered</h3>
                      <p>
                        Score 8/10 or higher in a flight
                        to welcome a new bird into your flock.
                      </p>
                    </div>
                  )}
                </div>

                <div className="guide-card-face guide-card-back" aria-hidden={!flipped} inert={!flipped}>
                  <p className="eyebrow">
                    {bird.commonName}
                  </p>

                  <h3>Your accuracy</h3>

                  <div className="accuracy-block">
                    <span>Lifetime</span>

                    <strong>
                      {lifetime.accuracy === null
                        ? "—"
                        : `${lifetime.accuracy}%`}
                    </strong>

                    <small>
                      {lifetime.guesses === 0
                        ? "No guesses yet"
                        : `${lifetime.correct} correct · ${lifetime.guesses} heard`}
                    </small>
                  </div>

                  <p className="recent-ear">Recent: {recentStats(history, bird.id).correct} of {recentStats(history, bird.id).count} correct</p>
                  <div className="accuracy-block current-accuracy">
                    <span>{{ fresh: "Since fresh start", month: "This month", last: "Last month", all: "All time" }[period]}</span>

                    <strong>
                      {current.accuracy === null
                        ? "—"
                        : `${current.accuracy}%`}
                    </strong>

                    <small>
                      {current.guesses === 0
                        ? "No guesses yet"
                        : `${current.correct} correct · ${current.guesses} heard`}
                    </small>
                  </div>

                  <div
                    className="spotted-block"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <span>Have you spotted this bird?</span>

                    <div
                      className="spotted-options"
                      role="group"
                      aria-label={`Have you spotted ${bird.commonName}?`}
                    >
                      <button
                        type="button"
                        className={
                          spottedBirds.includes(bird.id)
                            ? "is-selected"
                            : ""
                        }
                        aria-pressed={spottedBirds.includes(
                          bird.id
                        )}
                        onClick={() =>
                          onSetSpotted(bird.id, true)
                        }
                      >
                        Yes ✓
                      </button>

                      <button
                        type="button"
                        className={
                          spottedBirds.includes(bird.id)
                            ? ""
                            : "is-selected"
                        }
                        aria-pressed={!spottedBirds.includes(
                          bird.id
                        )}
                        onClick={() =>
                          onSetSpotted(bird.id, false)
                        }
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <button className="flip-hint" onClick={event=>{event.stopPropagation();setFlippedBirdId(null);}}>Back to bird ↻</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
function CreditsScreen({ onHome }) {
  return (
    <main className="screen credits-screen">
      <button
        className="back-button"
        onClick={onHome}
      >
        ← Home
      </button>

      <header className="section-header">
        <p className="eyebrow">
          THANKS FOR THE TWEETS
        </p>

        <h2>Audio credits.</h2>

        <p>
          Bird recordings used in Birdsong are
          sourced from Wikimedia Commons and
          Xeno-canto.
        </p>
      </header>

      <div className="credits-list">
        {[...audioCredits, ...djChirps].map((credit) => (
          <article
            className="credit-card"
            key={credit.id || credit.sourceUrl}
          >
            <div>
              <h3>{credit.bird || credit.name}</h3>

              <p>
                Recording by{" "}
                <strong>{credit.creator}</strong>
              </p>
              {credit.note && <p className="credit-note">{credit.note}</p>}
            </div>

            <div className="credit-meta">
              <a
                href={credit.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {credit.source} ↗
              </a>

              {credit.licenseUrl ? (
                <a
                  href={credit.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {credit.license} ↗
                </a>
              ) : (
                <span>{credit.license}</span>
              )}

              {credit.edited === false && <span>Original recording · unmodified</span>}
              {credit.edited && (
                <span>Edited for length</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="credits-note">
        Thank you to the recordists who make
        wildlife sounds available for learning,
        listening and play.
      </p>
    </main>
  );
}

function ProgressSummary({ history, sessions, spottedBirds, onBadges }) {
  const badges = badgeProgress(history, sessions, spottedBirds);
  const next = badges.find(b => b.value < b.target);
  const recognized = birds.filter(b => recognition(history, b.id)).length;
  const week = new Date();
  week.setHours(0, 0, 0, 0);
  week.setDate(week.getDate() - (week.getDay() + 6) % 7);
  const days = new Set(sessions.filter(s => ['flight', 'sound-alikes'].includes(s.mode) && s.timestamp >= week.getTime()).map(s => new Date(s.timestamp).toDateString())).size;
  const goal = next?.id === 'backyard-ear' ? 'Recognize your first five backyard birds to earn this badge.' : next?.description;
  return <section className="ear-progress" aria-labelledby="journey-title">
    <h2 id="journey-title">Your listening journey</h2>
    <div className="journey-stats">
      <div><span>Birds recognized</span><strong>{recognized}</strong><small>4 of 5 correct across two flights</small></div>
      <div><span>This week</span><strong>{Math.min(days, 3)} <span>of 3 days</span></strong><small>Complete a flight or Sound-alikes</small></div>
    </div>
    <div className="journey-badge">
      <span>{next ? 'Next badge' : 'All badges earned'}</span>
      <strong>{next ? `${next.icon} ${next.name}` : '✨ What a good ear!'}</strong>
      {next && <span className="journey-badge-count">{Math.min(next.value, next.target)} of {next.target}{next.id === 'backyard-ear' ? ' birds' : ''}</span>}
    </div>
    {goal && <p className="journey-goal">{goal}</p>}
    <button className="journey-badges-button" onClick={onBadges}>View your badges <span aria-hidden="true">→</span></button>
  </section>;
}

function BadgesScreen({ history, sessions, spottedBirds, onHome }) {
  const badges = badgeProgress(history, sessions, spottedBirds);
  return <main className="screen collection-screen"><button className="back-button" onClick={onHome}>← Home</button><header className="section-header"><p className="eyebrow">LITTLE MILESTONES</p><h2>Growing a good ear.</h2><p>Recognize a bird with four of five correct answers across at least two flights. Nearby quizzes stay separate. Earned listening badges stay with you.</p></header><div className="badge-grid">{badges.map(b => <article className={`badge-card ${b.value >= b.target ? 'earned' : ''}`} key={b.id}><span className="badge-icon" aria-hidden="true">{b.icon}</span><h3>{b.name}</h3><p>{b.description}</p><strong>{b.value >= b.target ? '✓ Earned' : `${Math.min(b.value, b.target)} / ${b.target}`}</strong><progress max={b.target} value={Math.min(b.value, b.target)} aria-label={b.name} /></article>)}</div></main>;
}

function AppContent() {
  const {clips:personalClips} = useRecordings();
  const [claims,setClaims] = useState(()=>readStoredJSON(WORLD_KEY,[]));
  const [focusBirdId,setFocusBirdId] = useState(null);
  const [sessions, setSessions] = useState(() => readStoredJSON("birdsong-sessions-v1", []));
  const [practiceIds, setPracticeIds] = useState(null);
  const [practiceVisit, setPracticeVisit] = useState(false);
  const [practiceOutdoor, setPracticeOutdoor] = useState(false);
  useEffect(() => localStorage.setItem("birdsong-sessions-v1", JSON.stringify(sessions)), [sessions]);
  const completeFlight = session => setSessions(current => current.some(s => s.id === session.id) ? current : [...current, session]);
  const practiceMissed = (ids, outdoor = false) => { setPracticeVisit(false); setPracticeOutdoor(outdoor); setPracticeIds(ids); setScreen("practice"); };
  const [screen, setScreen] =
    useState("home");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [screen]);

  const [nearbyBirdIds, setNearbyBirdIds] =
    useState([]);

  const [history, setHistory] =
    useState(() =>
      readStoredJSON(
        GUESS_HISTORY_KEY,
        []
      )
    );

  const [resetAt, setResetAt] =
    useState(() => {
      const saved =
        Number(
          localStorage.getItem(
            RESET_AT_KEY
          )
        );

      return saved || Date.now();
    });

  const [
    discoveredBirds,
    setDiscoveredBirds,
  ] = useState(() => initialFlock([...readStoredJSON(DISCOVERED_KEY, []),...readStoredJSON(WORLD_KEY,[]).map(c=>c.birdId).filter(Boolean)]));

  const [spottedBirds, setSpottedBirds] =
    useState(() =>
      readStoredJSON(SPOTTED_KEY, [])
    );

  useEffect(() => {
    localStorage.setItem(
      GUESS_HISTORY_KEY,
      JSON.stringify(history)
    );
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      RESET_AT_KEY,
      String(resetAt)
    );
  }, [resetAt]);

  useEffect(() => {
    localStorage.setItem(
      DISCOVERED_KEY,
      JSON.stringify(discoveredBirds)
    );
  }, [discoveredBirds]);

  useEffect(() => {
    localStorage.setItem(
      SPOTTED_KEY,
      JSON.stringify(spottedBirds)
    );
  }, [spottedBirds]);

  const unlockedBirds = birds.filter((bird) =>
    discoveredBirds.includes(bird.id)
  );

  const nextUnlockBird = unlockOrder
    .map((birdId) =>
      birds.find((bird) => bird.id === birdId)
    )
    .find(
      (bird) =>
        bird && !discoveredBirds.includes(bird.id)
    );

  function navigate(place) {try {localStorage.setItem('birdsong-last-place-v1',place);} catch { /* navigation still works */ }setScreen(place);}
  function awardMilestone(id) {
    const previous=readStoredJSON(WORLD_KEY,[]),claim=claimMilestone(id,discoveredBirds,previous);
    if(!claim)return;
    try {const next=[...previous,claim];localStorage.setItem(WORLD_KEY,JSON.stringify(next));setClaims(next);if(claim.birdId)setDiscoveredBirds(current=>[...new Set([...current,claim.birdId])]);const bird=birds.find(b=>b.id===claim.birdId);window.dispatchEvent(new CustomEvent('birdsong-world-reward',{detail:bird?`${bird.commonName} has joined your world. Find your new card in Your Nest.`:'Milestone completed. Every bird in this Flock is already with you.'}));}
    catch {window.dispatchEvent(new CustomEvent('birdsong-world-reward',{detail:'This browser couldn’t save your Flock reward. You can try this milestone again.'}));}
  }
  if(screen==='advanced')return <AdvancedListening history={history} onHome={()=>setScreen('learn')}/>;
  const learningProps={onAdvanced:()=>setScreen('advanced'),onHome:()=>setScreen('home'),onPlay:id=>{setFocusBirdId(typeof id==='string'?id:null);setScreen('game');},onPractice:()=>{setPracticeVisit(false);setPracticeIds(null);setPracticeOutdoor(false);setScreen('practice');},onBadges:()=>setScreen('badges'),onSoundAlikes:()=>setScreen('sound-alikes'),onStudio:()=>navigate('studio'),discoveredBirds,history,sessions,spottedBirds};
  if(screen==='learn')return <LearnScreen {...learningProps}/>;
  if(screen==='explore')return <ExploreWorld onHome={()=>setScreen('home')} onListen={()=>setScreen('listen')} onNearby={()=>setScreen('nearby')} onGuide={()=>setScreen('guide')} onCalls={()=>setScreen('calls')} onMilestone={awardMilestone}/>;
  if(screen==='sanctuary')return <Sanctuary onHome={()=>setScreen('home')} BirdArt={BirdIllustration} discoveredBirds={discoveredBirds} history={history} spottedBirds={spottedBirds} claims={claims} onMilestone={awardMilestone}/>;

  function recordGuess(
    birdId,
    correct, details = {}
  ) {
    setHistory((current) => [
      ...current,
      {
        birdId,
        correct,
        timestamp: Date.now(),
        ...details,
      },
    ]);
  }

  function unlockBird(birdId) {
    setDiscoveredBirds((current) =>
      current.includes(birdId)
        ? current
        : [...current, birdId]
    );
  }

  function setBirdSpotted(birdId, spotted) {
    if (spotted) setSessions(current => current.some(s => s.mode === "sighting") ? current : [...current, { id: crypto.randomUUID(), mode: "sighting", timestamp: Date.now() }]);
    setSpottedBirds((current) => {
      if (spotted) {
        return current.includes(birdId)
          ? current
          : [...current, birdId];
      }

      return current.filter((id) => id !== birdId);
    });
  }

  function startFresh() {
    setResetAt(Date.now());
  }

  if (screen === "game") {
    return (
      <GameScreen
        onHome={() =>
          setScreen("learn")
        }
        onGuess={recordGuess}
        onUnlockBird={unlockBird}
        unlockBird={nextUnlockBird || null}
        birdPool={unlockedBirds}
        personalClips={personalClips} focusBirdId={focusBirdId}
        history={history} sessions={sessions} spottedBirds={spottedBirds} onComplete={completeFlight} onPracticeMissed={practiceMissed} onRegularFlight={() => { setFocusBirdId(null); setScreen("game"); }} onVisitBird={id => { setPracticeVisit(true); setPracticeOutdoor(false); setPracticeIds([id]); setScreen("practice"); }}
      />
    );
  }

  if (screen === "practice") {
    return (
      <PracticeScreen
        onHome={() =>
          setScreen(practiceOutdoor?"listen":"learn")
        }
        birdPool={practiceIds ? birds.filter(b => practiceIds.includes(b.id)) : unlockedBirds}
        onPlay={() => { setFocusBirdId(null); setScreen("game"); }}
        history={history} sessions={sessions}
        targeted={Boolean(practiceIds)} outdoor={practiceOutdoor} visiting={practiceVisit}
      />
    );
  }

  if (screen === "nearby") {
    return (
      <NearbyScreen
        onHome={() => setScreen("explore")}
        spottedBirds={spottedBirds}
        onStartPractice={(nearbyMatches) => {
          setNearbyBirdIds(
            nearbyMatches.map((bird) => bird.id)
          );
          setScreen("nearby-game");
        }}
      />
    );
  }

  if (screen === "nearby-game") {
    const nearbyPool = birds.filter((bird) =>
      nearbyBirdIds.includes(bird.id)
    );

    return (
      <GameScreen
        onHome={() => setScreen("nearby")}
        onGuess={recordGuess}
        birdPool={nearbyPool}
        modeLabel="NEARBY"
        history={history} sessions={sessions} spottedBirds={spottedBirds} onComplete={completeFlight} onPracticeMissed={practiceMissed} onRegularFlight={() => { setFocusBirdId(null); setScreen("game"); }} onVisitBird={id => { setPracticeVisit(true); setPracticeOutdoor(false); setPracticeIds([id]); setScreen("practice"); }}
      />
    );
  }

  if (screen === "guide") {
    return (
      <FieldGuideScreen
        onHome={() =>
          setScreen("explore")
        }
        history={history}
        resetAt={resetAt}
        discoveredBirds={
          discoveredBirds
        }
        spottedBirds={spottedBirds}
        onSetSpotted={setBirdSpotted}
        onStartFresh={startFresh}
      />
    );
  }

  if (screen === "listen") return <OutdoorListening onHome={() => setScreen("explore")} BirdArt={BirdIllustration} onPractice={id => practiceMissed([id], true)} />;

  if (screen === "calls") return <main className="screen outdoor-screen"><button className="back-button" onClick={()=>setScreen("explore")}>← Explore</button><RecordingShelf /></main>;

  if (screen === "studio") return <BirdsongStudio onHome={() => setScreen("home")} BirdArt={BirdIllustration} history={history} discoveredBirds={discoveredBirds} onMilestone={awardMilestone} />;

  if (screen === "sound-alikes") return <SoundAlikes onHome={() => setScreen("learn")} onComplete={completeFlight} sessions={sessions} BirdArt={BirdIllustration} />;

  if (screen === "badges") return <BadgesScreen history={history} sessions={sessions} spottedBirds={spottedBirds} onHome={() => setScreen("learn")} />;

  if (screen === "credits") {
    return (
      <CreditsScreen
        onHome={() =>
          setScreen("home")
        }
      />
    );
  }

  return <BirdHub BirdArt={BirdIllustration} discoveredBirds={discoveredBirds} onNavigate={navigate} onCredits={()=>setScreen('credits')}/>;
}
function WorldRewardNotice(){const [notice,setNotice]=useState('');useEffect(()=>{const show=e=>setNotice(e.detail);window.addEventListener('birdsong-world-reward',show);return()=>window.removeEventListener('birdsong-world-reward',show);},[]);return notice?<aside className="world-reward-notice" aria-label="Flock update"><p role="status">{notice}</p><button aria-label="Dismiss Flock update" onClick={()=>setNotice('')}>×</button></aside>:null;}

export default function App() { if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("workbench") === "audio") return <Suspense fallback={<main className="world-screen screen"><p>Opening your audio library…</p></main>}><LibraryWorkbench BirdArt={BirdIllustration}/><footer className="studio-footer">Designed by 2e Studio</footer></Suspense>; return <><div className="world-clouds" aria-hidden="true"><span className="cloud cloud-one"/><span className="cloud cloud-two"/><span className="cloud cloud-three"/></div><AppContent /><WorldRewardNotice /><footer className="studio-footer">Designed by 2e Studio</footer></>; }
