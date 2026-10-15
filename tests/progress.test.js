import test from 'node:test';
import assert from 'node:assert/strict';
import { recognition, badgeProgress, planFlight } from '../src/progress.js';

const attempts = Array.from({ length: 5 }, (_, index) => ({ birdId: 'cardinal', correct: index !== 2, mode: 'flight', sessionId: index < 3 ? 'first' : 'second' }));

test('recognition requires repeated success across sessions and retains earned progress', () => {
  assert.equal(recognition(attempts, 'cardinal'), true);
  assert.equal(recognition(attempts.map(guess => ({ ...guess, sessionId: 'one' })), 'cardinal'), false);
  assert.equal(recognition(attempts.slice(0, 4), 'cardinal'), false);
  assert.equal(recognition([...attempts, ...attempts.map(guess => ({ ...guess, correct: false }))], 'cardinal'), true);
});

test('guided comparison and nearby attempts do not earn flight recognition', () => {
  for (const mode of ['sound-alikes', 'nearby']) assert.equal(recognition(attempts.map(guess => ({ ...guess, mode })), 'cardinal'), false);
});

test('Two Voices is specific to the comparison pair and five correct answers', () => {
  const badge = sessions => badgeProgress([], sessions, []).find(item => item.id === 'two-voices');
  assert.equal(badge([{ mode: 'sound-alikes', pairId: 'cardinal-finch', score: 4 }]).value, 0);
  assert.equal(badge([{ mode: 'flight', pairId: 'cardinal-finch', score: 6 }]).value, 0);
  assert.equal(badge([{ mode: 'sound-alikes', pairId: 'other', score: 6 }]).value, 0);
  const earned = { mode: 'sound-alikes', pairId: 'cardinal-finch', score: 5 };
  assert.equal(badge([earned]).value, 1);
  assert.equal(badge([earned, { ...earned, score: 0 }]).value, 1);
});

test('comparison scores do not earn flight badges', () => {
  const badges = badgeProgress([], [{ mode: 'sound-alikes', pairId: 'cardinal-finch', score: 6, birdIds: ['cardinal', 'house-finch'] }], []);
  assert.equal(badges.find(badge => badge.id === 'first-flight').value, 0);
  assert.equal(badges.find(badge => badge.id === 'sharp-ears').value, 0);
});

test('expanded catalogs keep flights bounded and answer options distinct', () => {
  const pool = Array.from({ length: 1000 }, (_, index) => ({ id: String(index) }));
  const rounds = planFlight(pool, []);
  assert.equal(rounds.length, 10);
  assert.equal(new Set(rounds.map(round => round.correct.id)).size, 6);
  for (const round of rounds) {
    assert.equal(round.options.length, 4);
    assert.equal(new Set(round.options.map(bird => bird.id)).size, 4);
    assert.ok(round.options.includes(round.correct));
  }
});
