export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function recognition(history, birdId) {
  const attempts = history.filter(g => g.birdId === birdId && g.sessionId && g.mode === 'flight');
  for (let end = 5; end <= attempts.length; end++) {
    const window = attempts.slice(end - 5, end);
    if (window.filter(g => g.correct).length >= 4 && new Set(window.map(g => g.sessionId)).size >= 2) return true;
  }
  return false;
}

export function recentStats(history, birdId) {
  const attempts = history.filter(g => g.birdId === birdId).slice(-5);
  return { count: attempts.length, correct: attempts.filter(g => g.correct).length };
}

export function planFlight(pool, history, count = 10, focusBirdId = null) {
  if (!pool.length) return [];
  const ranked = shuffle(pool).sort((a, b) => {
    const priority = bird => {
      const recent = recentStats(history, bird.id);
      return bird.id === focusBirdId ? 100 : recent.count === 0 ? 5 : !recognition(history, bird.id) ? 3 + (recent.count - recent.correct) / recent.count : 1;
    };
    return priority(b) - priority(a);
  });
  const active = ranked.slice(0, Math.min(6, ranked.length));
  const targets = [...active];
  while (targets.length < count) {
    const candidates = active.filter(b => b.id !== targets.at(-1)?.id);
    const source = candidates.length ? candidates : active;
    const min = Math.min(...source.map(b => targets.filter(t => t.id === b.id).length));
    targets.push(shuffle(source.filter(b => targets.filter(t => t.id === b.id).length === min))[0]);
  }
  return targets.slice(0, count).map(correct => ({ correct, options: shuffle([correct, ...shuffle(pool.filter(b => b.id !== correct.id)).slice(0, 3)]) }));
}

export function badgeProgress(history, sessions, spotted) {
  const recognized = ['cardinal', 'robin', 'bluejay', 'mourning-dove', 'american-crow'].filter(id => recognition(history, id)).length;
  const recovered = new Set(history.filter(g => !g.correct).map(g => g.birdId));
  const comeback = [...recovered].filter(id => recognition(history, id)).length;
  return [
    { id: 'first-flight', icon: '🪶', name: 'First Flight', description: 'Complete your first flight.', value: sessions.filter(s => s.mode === 'flight').length, target: 1 },
    { id: 'backyard-ear', icon: '🌿', name: 'Backyard Ear', description: 'Recognize your five starter backyard voices.', value: recognized, target: 5 },
    { id: 'second-listen', icon: '♪', name: 'Second Listen', description: 'Recognize three birds you previously missed.', value: comeback, target: 3 },
    { id: 'sharp-ears', icon: '✨', name: 'Sharp Ears', description: 'Score 10/10 in a flight with at least four species.', value: sessions.some(s => s.mode === 'flight' && s.score === 10 && new Set(s.birdIds).size >= 4) ? 1 : 0, target: 1 },
    { id: 'two-voices', icon: '✨', name: 'Two Voices', description: 'Score at least 5/6 in Cardinal or House Finch Sound-alikes.', value: sessions.some(s => s.mode === 'sound-alikes' && s.pairId === 'cardinal-finch' && s.score >= 5) ? 1 : 0, target: 1 },
    { id: 'wild', icon: '⌖', name: 'Out in the Wild', description: 'Mark your first personal bird sighting.', value: sessions.some(s => s.mode === "sighting") ? 1 : spotted.length, target: 1 },
  ];
}
