import { useEffect, useRef, useState } from "react";
import { birds } from "./data/birds";

const audioCredits = [
  {
    bird: "Northern Cardinal",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Northern_Cardinal.ogg",
    license: "Public Domain",
  },
  {
    bird: "American Robin",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:American_Robin.ogg",
    license: "Public Domain",
  },
  {
    bird: "Blue Jay",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Blue_Jay.ogg",
    license: "Public Domain",
  },
  {
    bird: "Carolina Wren",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Carolina_Wren.ogg",
    license: "Public Domain",
  },
  {
    bird: "Black-capped Chickadee",
    creator: "Jonathon Jongsma",
    source: "Xeno-canto via Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Poecile_atricapillus_-_Black-capped_Chickadee_XC123506.ogg",
    license: "CC BY-SA 3.0",
    licenseUrl:
      "https://creativecommons.org/licenses/by-sa/3.0/",
    edited: false,
  },
  {
    bird: "Mourning Dove",
    creator: "Francis C., Ortega C. & Cruz A.",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Zenaida_macroura_vocalizations_-_pone.0027052.s009.oga",
    license: "CC BY 2.5",
    licenseUrl:
      "https://creativecommons.org/licenses/by/2.5/",
    edited: false,
  },
  {
    bird: "Tufted Titmouse",
    creator: "U.S. Fish & Wildlife Service",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Tufted_Titmouse_call.ogg",
    license: "Public Domain",
  },
  {
    bird: "Eastern Bluebird",
    creator: "Jonathon Jongsma",
    source: "Xeno-canto via Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Sialia_sialis_-_Eastern_Bluebird_-_XC79976.ogg",
    license: "CC BY-SA 3.0",
    licenseUrl:
      "https://creativecommons.org/licenses/by-sa/3.0/",
    edited: false,
  },
  {
    bird: "White-breasted Nuthatch",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:White-breasted_Nuthatch.ogg",
    license: "Public Domain",
  },
  {
    bird: "House Finch",
    creator: "Francis C., Ortega C. & Cruz A.",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Carpodacus_mexicanus_vocalizations_-_pone.0027052.s006.oga",
    license: "CC BY 2.5",
    licenseUrl:
      "https://creativecommons.org/licenses/by/2.5/",
    edited: false,
  },
  {
    bird: "American Crow",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:American_Crow.ogg",
    license: "Public Domain",
  },
  {
    bird: "Red-bellied Woodpecker",
    creator: "Jonathon Jongsma",
    source: "Xeno-canto via Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Melanerpes_carolinus_-_Red-bellied_Woodpecker_-_XC71728.ogg",
    license: "CC BY-SA 3.0",
    licenseUrl:
      "https://creativecommons.org/licenses/by-sa/3.0/",
    edited: false,
  },
  {
    bird: "Barred Owl",
    creator: "Tom Cosburn",
    source: "British Library via Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Barred_Owl_(Strix_varia)_(W1CDR0000351_BD27).ogg",
    license: "CC BY 4.0",
    licenseUrl:
      "https://creativecommons.org/licenses/by/4.0/",
    edited: false,
  },
  {
    bird: "Eastern Towhee",
    creator: "Jonathon Jongsma",
    source: "Xeno-canto via Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Pipilo_erythrophthalmus_-_Eastern_Towhee_-_XC81298.ogg",
    license: "CC BY-SA 3.0",
    licenseUrl:
      "https://creativecommons.org/licenses/by-sa/3.0/",
    edited: false,
  },
  {
    bird: "Killdeer",
    creator: "U.S. National Park Service",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Charadrius_vociferus.ogg",
    license: "Public Domain",
  },
  {
    bird: "Northern Mockingbird",
    creator: "David Illig",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Mimus_polyglottos_Northern_Mockingbird.ogg",
    license: "CC BY-SA 3.0",
    licenseUrl:
      "https://creativecommons.org/licenses/by-sa/3.0/",
    edited: false,
  },
  {
    bird: "Carolina Chickadee",
    creator: "G. McGrane",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Carolina_Chickadee.ogg",
    license: "Public Domain",
  },
];

const GUESS_HISTORY_KEY = "birdsong-guess-history-v1";
const RESET_AT_KEY = "birdsong-reset-at-v1";
const DISCOVERED_KEY = "birdsong-discovered-v3";
const SPOTTED_KEY = "birdsong-spotted-v1";

const starterBirds = [
  "cardinal",
  "robin",
  "bluejay",
  "mourning-dove",
];

const unlockOrder = [
  "cardinal",
  "robin",
  "bluejay",
  "mourning-dove",
  "american-crow",
  "carolina-wren",
  "chickadee",
  "titmouse",
  "eastern-bluebird",
  "nuthatch",
  "house-finch",
  "red-bellied-woodpecker",
  "barred-owl",
  "killdeer",
  "eastern-towhee",
  "northern-mockingbird",
  "carolina-chickadee",
];

function getFlockRank(count) {
  if (count >= birds.length) {
    return { name: "Birdsong Naturalist", icon: "🦅" };
  }

  if (count >= 8) {
    return { name: "Song Spotter", icon: "🌳" };
  }

  if (count >= 5) {
    return { name: "Backyard Birder", icon: "🪶" };
  }

  return { name: "Hatchling", icon: "🌱" };
}

function getFlightRating(score) {
  if (score === 10) return "🪶🪶🪶 Perfect flight";
  if (score >= 8) return "🪶🪶 Sharp ears";
  if (score >= 5) return "🪶 Getting the hang of it";
  return "🌱 Learning";
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

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
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

function HomeScreen({
  onPlay,
  onPractice,
  onNearby,
  onGuide,
  onCredits,
  discoveredBirds,
}) {
  const discoveredCount = discoveredBirds.length;
  const rank = getFlockRank(discoveredCount);
  const progress = Math.round(
    (discoveredCount / birds.length) * 100
  );
  return (
    <main className="home-screen screen">
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />

      <div className="home-copy">
        <p className="eyebrow">
          LISTEN · LEARN · PLAY
        </p>

        <h1>
          Bird<span>song</span>
        </h1>

        <p className="home-subtitle">
          Can you name that bird?
        </p>

        <section className="flock-progress-card" aria-label="Flock progress">
          <div className="flock-progress-topline">
            <span>{rank.icon} {rank.name}</span>
            <strong>{discoveredCount}/{birds.length} species</strong>
          </div>

          <div className="flock-progress-track" aria-hidden="true">
            <div
              className="flock-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <small>Finish a 10-bird flight to welcome a new bird.</small>
        </section>

        <button
          className="primary-button"
          onClick={onPlay}
        >
          Play
          <span>→</span>
        </button>

        <div className="secondary-actions">
          <button onClick={onPractice}>
            Practice Calls
          </button>

          <button onClick={onGuide}>
            Field Guide
          </button>

          <button
            className="nearby-home-button"
            onClick={onNearby}
          >
            <span>⌖</span> Practice Nearby
          </button>
        </div>

        <button
          className="audio-credits-link"
          onClick={onCredits}
        >
          ♪ Audio Credits
        </button>
      </div>

      <div className="home-scene">
        <div className="sun" />

        <div className="tree tree-left">
          <div className="tree-top" />
          <div className="tree-trunk" />
        </div>

        <div className="tree tree-right">
          <div className="tree-top" />
          <div className="tree-trunk" />
        </div>

        <div className="hero-branch" />

        <div className="hero-bird">
          <BirdIllustration bird={birds[4]} />
        </div>

        <div className="ground ground-back" />
        <div className="ground ground-front" />
      </div>
    </main>
  );
}

function GameScreen({
  onHome,
  onGuess,
  onUnlockBird,
  unlockBird = null,
  birdPool = birds,
  modeLabel = null,
}) {
  const [rounds, setRounds] = useState(() =>
    createRounds(10, birdPool, birdPool)
  );

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
  }

  function toggleBirdSound() {
    /*
      If a bird is already playing,
      the same button stops it.
    */
    if (audioRef.current) {
      stopCurrentAudio();
      return;
    }

    if (!currentRound.correct.audio) return;

    const audio = new Audio(
      currentRound.correct.audio
    );

    audio.volume = 0.85;

    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      audioRef.current = null;
      setIsPlaying(false);
    };

    audio.onerror = () => {
      audioRef.current = null;
      setIsPlaying(false);
    };

    audio.play().catch((error) => {
      console.error(
        "Could not play bird audio:",
        error
      );

      audioRef.current = null;
      setIsPlaying(false);
    });
  }
function toggleUnlockedBirdSound() {
  if (!newlyUnlocked?.audio) return;

  if (audioRef.current) {
    stopCurrentAudio();
    return;
  }

  const audio = new Audio(newlyUnlocked.audio);

  audio.volume = 0.85;

  audioRef.current = audio;
  setIsPlaying(true);

  audio.onended = () => {
    audioRef.current = null;
    setIsPlaying(false);
  };

  audio.onerror = () => {
    audioRef.current = null;
    setIsPlaying(false);
  };

  audio.play().catch((error) => {
    console.error(
      "Could not play unlocked bird audio:",
      error
    );

    audioRef.current = null;
    setIsPlaying(false);
  });
}
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
      correct
    );

    if (correct) {
      setScore((current) => current + 1);
    }
  }

  function nextRound() {
    stopCurrentAudio();

    if (
      roundIndex ===
      rounds.length - 1
    ) {
      if (unlockBird && onUnlockBird) {
        setNewlyUnlocked(unlockBird);
        onUnlockBird(unlockBird.id);
      }

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

    setRounds(createRounds(10, birdPool, birdPool));
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

  if (finished) {
    return (
      <main className="screen results-screen">
        <button
          className="back-button"
          onClick={goHome}
        >
          ← Home
        </button>

        <div className="results-card">
          <p className="eyebrow">
            FLIGHT COMPLETE
          </p>

          <div className="results-bird">
            <BirdIllustration bird={birds[0]} />
          </div>

          <h2>{score}/10</h2>

          <p className="flight-rating">
            {getFlightRating(score)}
          </p>

          <p>
            {score >= 8
              ? "Well hello, birder."
              : score >= 5
              ? "You're getting the hang of this."
              : "Every birder starts somewhere."}
          </p>

          {newlyUnlocked && (
            <section className="unlock-card" aria-live="polite">
              <p className="eyebrow">NEW BIRD!</p>

              <div className="unlock-bird-art">
                <BirdIllustration bird={newlyUnlocked} small />
              </div>

              <div className="unlock-copy">
  <small>joined your flock</small>
  <h3>{newlyUnlocked.commonName}</h3>
  <p>♪ {newlyUnlocked.mnemonic}</p>

  <button
    className="unlock-listen-button"
    onClick={toggleUnlockedBirdSound}
  >
    <span>{isPlaying ? "■" : "♪"}</span>
    {isPlaying ? "Stop call" : "Hear this bird"}
  </button>
</div>
            </section>
          )}

          {!newlyUnlocked && !modeLabel && (
            <p className="flock-complete-note">
              🦅 Your whole Birdsong flock is unlocked.
            </p>
          )}

          <button
            className="primary-button"
            onClick={restart}
          >
            Play Again
            <span>↻</span>
          </button>

          <button
            className="text-button"
            onClick={goHome}
          >
            Back Home
          </button>
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
          ←
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

      <section className="game-prompt">
        <p className="eyebrow">
          WHO'S SINGING?
        </p>

        <h2>Listen closely.</h2>

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
      </section>

      <section className="bird-options">
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
          <div>
            <p className="answer-status">
              {isCorrect
                ? "✓ Nice ear!"
                : "Almost!"}
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

            <h3>
              {
                currentRound.correct
                  .mnemonic
              }
            </h3>

            <p>
              {
                currentRound.correct
                  .fact
              }
            </p>
          </div>

          <button onClick={nextRound}>
            {roundIndex === 9
              ? "See Score"
              : "Next Bird"}

            <span>→</span>
          </button>
        </section>
      )}
    </main>
  );
}

function PracticeScreen({ onHome, birdPool }) {
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
    if (!bird.audio) return;

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
      audioRef.current = null;
      setActiveBirdId(null);
    };

    audio.onerror = () => {
      audioRef.current = null;
      setActiveBirdId(null);
    };

    audio.play().catch((error) => {
      console.error(
        "Could not play bird audio:",
        error
      );

      audioRef.current = null;
      setActiveBirdId(null);
    });
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
        ← Home
      </button>

      <header className="section-header">
        <p className="eyebrow">
          PRACTICE PERCH
        </p>

        <h2>Meet the flock.</h2>

        <p>
          Tap a bird to hear its call. Your practice perch grows
          each time you finish a 10-bird flight.
        </p>
      </header>

      <div className="practice-flock-count">
        {birdPool.length} of {birds.length} birds in your flock
      </div>

      <div className="collection-grid">
        {birdPool.map((bird) => {
          const isPlaying =
            activeBirdId === bird.id;

          return (
            <button
              className={`practice-card ${
                isPlaying
                  ? "practice-card-playing"
                  : ""
              }`}
              key={bird.id}
              onClick={() =>
                togglePracticeSound(bird)
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
                </span>
              </div>
            </button>
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

  async function findNearby(nextRadius = radius) {
    setRadius(nextRadius);
    setNearbyBirds([]);
    setErrorMessage("");
    setStatus("locating");

    try {
      const position = await getPosition();

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
        )}&dist=${nextRadius}&back=7`
      );

      const payload = await response.json().catch(() => ({}));

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
        ← Home
      </button>

      <header className="section-header nearby-header">
        <p className="eyebrow">PRACTICE NEARBY</p>
        <h2>Learn who's around.</h2>
        <p>
          Birdsong checks recent eBird reports and matches
          them with the species you can practice here.
        </p>
      </header>

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
              onClick={() => findNearby(25)}
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
              <p className="eyebrow">RECENTLY REPORTED</p>
              <h3>
                {nearbyBirds.length} of {birds.length} Birdsong
                {" "}species nearby
              </h3>
              <p>
                Within {radius} km · reported in the last 7 days
              </p>
            </div>

            <button
              className="nearby-refresh-button"
              onClick={() => findNearby(radius)}
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
                        {formatObservationDate(
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

                {radius < 50 && (
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
            Recent observation data from eBird · Cornell Lab of
            Ornithology. Reports show where species have been
            observed, not a guarantee that a bird is currently
            present.
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
        ← Home
      </button>

      <header className="section-header guide-header">
        <p className="eyebrow">
          FIELD GUIDE
        </p>

        <h2>Your birds.</h2>

        <p>
          {discoveredCount} / {birds.length} species
          discovered · {spottedCount} spotted in the wild.
          Tap a discovered bird to flip its card, see your
          call accuracy, and mark whether you’ve spotted it.
        </p>

        <div className="guide-stat-controls">
          <span>
            Current stats since{" "}
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

      <div className="guide-grid">
        {birds.map((bird) => {
          const unlocked =
            discoveredBirds.includes(bird.id);

          const lifetime = getBirdStats(
            history,
            bird.id
          );

          const current = getBirdStats(
            history,
            bird.id,
            resetAt
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
                <div className="guide-card-face guide-card-front">
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
                        Complete a flight to welcome
                        this bird into your flock.
                      </p>
                    </div>
                  )}
                </div>

                <div className="guide-card-face guide-card-back">
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

                  <div className="accuracy-block current-accuracy">
                    <span>Since fresh start</span>

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

                  <span className="flip-hint">
                    Back to bird ↻
                  </span>
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
        {audioCredits.map((credit) => (
          <article
            className="credit-card"
            key={credit.bird}
          >
            <div>
              <h3>{credit.bird}</h3>

              <p>
                Recording by{" "}
                <strong>{credit.creator}</strong>
              </p>
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

export default function App() {
  const [screen, setScreen] =
    useState("home");

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
  ] = useState(() =>
    readStoredJSON(
      DISCOVERED_KEY,
      starterBirds
    )
  );

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

  function recordGuess(
    birdId,
    correct
  ) {
    setHistory((current) => [
      ...current,
      {
        birdId,
        correct,
        timestamp: Date.now(),
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
          setScreen("home")
        }
        onGuess={recordGuess}
        onUnlockBird={unlockBird}
        unlockBird={nextUnlockBird || null}
        birdPool={unlockedBirds}
      />
    );
  }

  if (screen === "practice") {
    return (
      <PracticeScreen
        onHome={() =>
          setScreen("home")
        }
        birdPool={unlockedBirds}
      />
    );
  }

  if (screen === "nearby") {
    return (
      <NearbyScreen
        onHome={() => setScreen("home")}
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
      />
    );
  }

  if (screen === "guide") {
    return (
      <FieldGuideScreen
        onHome={() =>
          setScreen("home")
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

  if (screen === "credits") {
    return (
      <CreditsScreen
        onHome={() =>
          setScreen("home")
        }
      />
    );
  }

  return (
    <HomeScreen
      onPlay={() =>
        setScreen("game")
      }
      onPractice={() =>
        setScreen("practice")
      }
      onNearby={() =>
        setScreen("nearby")
      }
      onGuide={() =>
        setScreen("guide")
      }
      onCredits={() =>
        setScreen("credits")
      }
      discoveredBirds={discoveredBirds}
    />
  );
}
