// Broad state coverage, not a claim about the user's exact location.
export const ALABAMA_POINTS = [[34.5,-86.8],[32.5,-86.8],[30.7,-88]];
export const RANGE_THRESHOLD = .03;
export function seasonWeek(date = new Date()) {
  // BirdNET uses four seasonal bins per month, not ISO calendar weeks.
  return date.getMonth() * 4 + Math.min(4,Math.ceil(date.getDate() / 7));
}
export function regionalMatches(matches, cutoff, region, rangeScores) {
  if (!matches) return null;
  if (region !== 'world' && !rangeScores) return [];
  return matches.filter(match => match.score >= cutoff && (region === 'world' || (rangeScores[match.scientificName] || 0) >= RANGE_THRESHOLD));
}
