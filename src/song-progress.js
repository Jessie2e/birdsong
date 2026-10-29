import {learningRecordings} from './data/learning-recordings.js';

// A bonus repertoire milestone, independent of recognition, mastery and ownership.
// Derive permanent eligibility from completed flights; no progress migration needed.
export function songProgress(history, sessions, birdId) {
  const completed = new Set(sessions.filter(s => s.mode === 'flight').map(s => s.id));
  let correct = 0, flights = new Set(), unlocked = false;
  for (const answer of history) {
    if (answer.birdId !== birdId || answer.mode !== 'flight' || !completed.has(answer.sessionId)) continue;
    if (!answer.correct) { correct = 0; flights = new Set(); continue; }
    // Personal clips and alternate songs do not advance the familiar-song streak.
    if (answer.recordingId && answer.recordingId !== `${birdId}-original`) continue;
    correct++; flights.add(answer.sessionId);
    if (correct >= 6 && flights.size >= 3) unlocked = true;
  }
  return {unlocked, correct, flights:flights.size};
}

export function unlockedSongRecordings(history, sessions, catalog = learningRecordings) {
  const seen = new Set();
  return catalog.filter(recording => {
    if (recording.enabled === false || seen.has(recording.birdId)) return false;
    seen.add(recording.birdId);
    return songProgress(history, sessions, recording.birdId).unlocked;
  });
}
