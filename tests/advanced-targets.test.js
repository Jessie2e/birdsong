import test from 'node:test';
import assert from 'node:assert/strict';
import { planAdvancedTargets } from '../src/progress.js';

test('advanced challenges keep six targets and balanced repeats with small eligible pools', () => {
  assert.deepEqual(planAdvancedTargets([]), []);
  for (const size of [2, 3, 4, 5, 6, 7, 22]) {
    const pool = Array.from({ length: size }, (_, id) => ({ id }));
    const original = [...pool];
    const targets = planAdvancedTargets(pool);
    assert.equal(targets.length, 6);
    assert.ok(targets.every(bird => pool.includes(bird)));
    assert.equal(new Set(targets).size, Math.min(size, 6));
    const counts = pool.map(bird => targets.filter(target => target === bird).length);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
    assert.deepEqual(pool, original);
  }
});

test('birds beyond the first six can be selected regardless of catalog order', () => {
  const previous = Math.random;
  try {
    // Deterministically move later eligible birds into the selected group.
    for (const size of [7, 8, 22]) {
      const pool = Array.from({ length: size }, (_, id) => ({ id }));
      for (const ordered of [pool, [...pool].reverse()]) {
        let calls = 0;
        Math.random = () => calls++ === 0 ? 0 : 0.999999;
        const targets = planAdvancedTargets(ordered);
        assert.ok(targets.includes(ordered.at(-1)));
      }
    }
  } finally {
    Math.random = previous;
  }
});

test('every eligible bird can appear with different eligible counts and input orders', () => {
  const previous = Math.random;
  try {
    for (const size of [2, 5, 6, 7, 22]) {
      const pool = Array.from({ length: size }, (_, id) => ({ id }));
      for (const ordered of [pool, [...pool].reverse()]) {
        for (let index = 0; index < size; index++) {
          let step = size - 1;
          // Keep other positions stable and bring this eligible bird to the front.
          Math.random = () => step-- === index ? 0 : 0.999999;
          assert.ok(planAdvancedTargets(ordered).includes(ordered[index]));
        }
      }
    }
  } finally {
    Math.random = previous;
  }
});
