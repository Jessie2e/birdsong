import { learningRecordings } from './data/learning-recordings.js';

// The familiar recording remains first; callers can add examples without changing birds.
export function referenceRecordings(bird, catalog = learningRecordings) {
  const candidates = [
    { id: `${bird.id}-original`, birdId: bird.id, audio: bird.audio },
    ...catalog.filter(recording => recording.birdId === bird.id && recording.enabled !== false),
  ];
  const ids = new Set(), sources = new Set();
  return candidates.filter(recording => {
    if (!recording.id || !recording.audio || ids.has(recording.id) || sources.has(recording.audio)) return false;
    ids.add(recording.id); sources.add(recording.audio);
    return true;
  });
}

// Choose once when planning a flight, so every replay of a question is identical.
// Existing recording IDs provide repeat history; no new storage or learning rules.
export function variedReferenceRounds(rounds, history, catalog = learningRecordings, random = Math.random) {
  const planned = new Map();
  return rounds.map(round => {
    if (round.correct.personal) return round;
    const bird = round.correct;
    const choices = referenceRecordings(bird, catalog);
    if (!choices.length) return round;
    let recent = planned.get(bird.id);
    if (!recent) {
      const validIds = new Set(choices.map(choice => choice.id));
      recent = history.filter(attempt => attempt.birdId === bird.id && attempt.mode === 'flight')
        .map(attempt => attempt.recordingId || `${bird.id}-original`)
        .filter(id => validIds.has(id)).slice(-8);
      planned.set(bird.id, recent);
    }
    const eligible = choices.length > 1 ? choices.filter(choice => choice.id !== recent.at(-1)) : choices;
    const count = choice => recent.filter(id => id === choice.id).length;
    const leastUsed = Math.min(...eligible.map(count));
    const candidates = eligible.filter(choice => count(choice) === leastUsed);
    const selected = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    recent.push(selected.id);
    if (recent.length > 8) recent.shift();
    return { ...round, correct: { ...bird, audio: selected.audio, recordingId: selected.id } };
  });
}
