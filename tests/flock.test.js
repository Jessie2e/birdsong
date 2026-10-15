import test from 'node:test';
import assert from 'node:assert/strict';
import { earnsBird, initialFlock, starterBirds, unlockOrder } from '../src/flock.js';

test('only completed scores of 80% or higher earn a bird', () => {
  for (let score = 0; score < 8; score++) assert.equal(earnsBird(score), false);
  for (const score of [8, 9, 10]) assert.equal(earnsBird(score), true);
  for (const score of [NaN, -1, 11, 7.9]) assert.equal(earnsBird(score), false);
  assert.equal(earnsBird(8, 0), false);
});

test('new players start with exactly eight unique birds', () => {
  assert.equal(starterBirds.length, 8);
  assert.equal(new Set(initialFlock()).size, 8);
  assert.deepEqual(initialFlock(), starterBirds);
});

test('existing players receive the starters and retain previously unlocked birds', () => {
  const saved = ['cardinal', 'house-finch', 'barred-owl'];
  const migrated = initialFlock(saved);
  for (const id of [...saved, ...starterBirds]) assert.ok(migrated.includes(id));
  assert.equal(migrated.length, 10);
  assert.deepEqual(initialFlock(migrated), migrated);
  assert.deepEqual(initialFlock(null), starterBirds);
});

test('new expansion birds occur once in the progression', () => {
  assert.equal(unlockOrder.length, 22);
  assert.equal(new Set(unlockOrder).size, 22);
  for (const id of ['red-shouldered-hawk', 'yellow-rumped-warbler', 'eastern-phoebe', 'red-winged-blackbird', 'american-goldfinch']) assert.ok(unlockOrder.includes(id));
});
