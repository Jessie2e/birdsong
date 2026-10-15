export const starterBirds = [
  'cardinal', 'robin', 'bluejay', 'mourning-dove',
  'american-crow', 'carolina-wren', 'chickadee', 'titmouse',
];

export const unlockOrder = [
  ...starterBirds,
  'eastern-bluebird', 'nuthatch', 'red-winged-blackbird', 'eastern-phoebe',
  'red-shouldered-hawk', 'american-goldfinch', 'yellow-rumped-warbler', 'house-finch',
  'red-bellied-woodpecker', 'barred-owl', 'killdeer', 'eastern-towhee',
  'northern-mockingbird', 'carolina-chickadee',
];

export function initialFlock(saved = []) {
  return [...new Set([...starterBirds, ...(Array.isArray(saved) ? saved : [])])];
}

export function earnsBird(score, total = 10) {
  return Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total && score / total >= 0.8;
}
