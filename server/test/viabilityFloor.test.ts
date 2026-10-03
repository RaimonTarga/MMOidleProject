/**
 * The bench criterion is a VIABILITY FLOOR (design §24.1), and the ordinal
 * encounter check is unchanged (course-correction W3-A).
 *
 * WHAT THIS PINS, on synthetic rows (no world, no bench run):
 *
 *   - the floor is 0.9× the tier's median uplift; a row below it fails, a row at or
 *     above it passes — including a row far ABOVE the median, which the retired
 *     ±3 pp band would have failed (the similarity target is gone);
 *   - the 1.5× outlier ceiling is listed, never failed;
 *   - rows without a reading are neither counted in the median nor judged;
 *   - a non-positive median keeps the floor BELOW the median (a tenth of its size
 *     below it), so the median lane never fails its own tier's floor, and says so;
 *   - the encounter check still ranks lanes by median uplift and reports the
 *     favoured − punished margin without a threshold, whatever the floor says.
 *
 * Run: node --conditions=development --import tsx test/viabilityFloor.test.ts
 */
import type { PacketId } from '@mmo-idle/shared';
import {
  OUTLIER_CEILING_RATIO,
  VIABILITY_FLOOR_RATIO,
  ceilingFor,
  floorFor,
  medianOf,
  viabilityFloor,
} from '../bench/lineage/viabilityFloor';
import { encounterReading, rankLanesByMedian } from '../bench/lineage/encounterOrdinal';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}
const close = (a: number | null, b: number): boolean => a !== null && Math.abs(a - b) < 1e-9;

// ── The constants are the design's ───────────────────────────────────────────

assert(VIABILITY_FLOOR_RATIO === 0.9, `§24.1: the floor is 0.9× the median, got ${VIABILITY_FLOOR_RATIO}`);
assert(OUTLIER_CEILING_RATIO === 1.5, `W3-A: outliers are listed above 1.5× the median, got ${OUTLIER_CEILING_RATIO}`);

// ── The floor on a synthetic tier ────────────────────────────────────────────

{
  // Seven packets, like the T1 weapon set. Median +4%: floor +3.6%, ceiling +6%.
  const rows = [
    { lane: 'engagement', uplift: 0.12 }, // 3× the median: the retired ±3 pp band said NO; the floor says yes
    { lane: 'affliction', uplift: 0.059 }, // just under the 1.5× ceiling: not listed
    { lane: 'control', uplift: 0.05 },
    { lane: 'kill-chain', uplift: 0.04 }, // the median
    { lane: 'empowered', uplift: 0.0361 }, // just above the floor: passes
    { lane: 'tempo', uplift: 0.0359 }, // just under it: fails
    { lane: 'technique', uplift: -0.01 }, // negative: fails
  ];
  const reading = viabilityFloor(rows, (r) => r.uplift);
  assert(close(reading.median, 0.04), `median of seven is the fourth, got ${reading.median}`);
  assert(reading.medianPositive, 'a positive median');
  assert(close(reading.floor, 0.036), `floor = 0.9 × 0.04 = 0.036, got ${reading.floor}`);
  assert(close(reading.ceiling, 0.06), `ceiling = 1.5 × 0.04 = 0.06, got ${reading.ceiling}`);
  const verdict = (lane: string) => reading.rows.find((r) => r.item.lane === lane)!.verdict;
  assert(verdict('engagement') === 'pass', 'far ABOVE the median is not a failure any more');
  assert(verdict('empowered') === 'pass', 'just above the floor passes');
  assert(verdict('tempo') === 'below-floor', 'just under the floor fails');
  assert(verdict('technique') === 'below-floor', 'a negative lane fails');
  assert(
    JSON.stringify(reading.belowFloor.map((r) => r.item.lane)) === JSON.stringify(['tempo', 'technique']),
    `below the floor: tempo and technique, got ${reading.belowFloor.map((r) => r.item.lane).join(',')}`,
  );
  // Listed above the ceiling, never failed: only strictly above 1.5×.
  assert(
    JSON.stringify(reading.aboveCeiling.map((r) => r.item.lane)) === JSON.stringify(['engagement']),
    `above 1.5×: engagement only (affliction sits just under it), got ${reading.aboveCeiling.map((r) => r.item.lane).join(',')}`,
  );
  assert(close(reading.rows[0].ratioToMedian, 3), 'the ratio column reads 3.00× for engagement');
}

// ── Rows without a reading ────────────────────────────────────────────────────

{
  const rows = [
    { id: 'a', uplift: 0.1 }, { id: 'b', uplift: null }, { id: 'c', uplift: 0.2 },
    { id: 'd', uplift: Number.NaN }, { id: 'e', uplift: 0.3 },
  ];
  const reading = viabilityFloor(rows, (r) => r.uplift);
  assert(close(reading.median, 0.2), `the median ignores rows with no reading, got ${reading.median}`);
  assert(reading.rows[1].verdict === 'no-reading' && reading.rows[3].verdict === 'no-reading', 'and judges none of them');
  assert(reading.belowFloor.length === 1 && reading.belowFloor[0].item.id === 'a', '0.1 < 0.18: only a fails');

  const empty = viabilityFloor([{ uplift: null }], (r) => r.uplift);
  assert(empty.median === null && empty.floor === null && empty.belowFloor.length === 0, 'no reading, no floor, no verdict');
}

// ── A non-positive median ─────────────────────────────────────────────────────

{
  // At a −2% median, "0.9×" would be −1.8% — ABOVE the median, failing half the
  // tier including the median lane. The floor stays a tenth of the median's size
  // below it instead.
  assert(close(floorFor(-0.02), -0.022), `floor at a −2% median is −2.2%, got ${floorFor(-0.02)}`);
  assert(close(floorFor(0.05), 0.045), 'and exactly 0.9× for a positive median');
  assert(close(ceilingFor(-0.02), -0.01), `ceiling at a −2% median is −1%, got ${ceilingFor(-0.02)}`);
  const rows = [{ u: -0.05 }, { u: -0.021 }, { u: -0.02 }, { u: 0 }, { u: 0.01 }];
  const reading = viabilityFloor(rows, (r) => r.u);
  assert(!reading.medianPositive, 'the reading says the median is not positive');
  assert(reading.rows[2].verdict === 'pass', 'the median lane never fails its own floor');
  assert(reading.rows[1].verdict === 'pass', '−2.1% is within a tenth of the median\'s size');
  assert(reading.belowFloor.length === 1 && reading.belowFloor[0].item.u === -0.05, 'only −5% fails');

  const zero = viabilityFloor([{ u: -0.01 }, { u: 0 }, { u: 0.02 }], (r) => r.u);
  assert(close(zero.floor, 0), 'a zero median puts the floor at zero');
  assert(zero.belowFloor.length === 1 && zero.belowFloor[0].item.u === -0.01, 'so only a negative lane fails');
}

assert(medianOf([]) === null && medianOf([3, 1, 2]) === 2 && medianOf([4, 1, 3, 2]) === 2.5, 'the plain median');

// ── The ordinal encounter check is unchanged ─────────────────────────────────

{
  // Favoured `tempo`, punished `control`, on a family's own node. Medians: tempo
  // +5% (three refs: +3, +5, +9), affliction +4% (one ref), control +0.5% (two
  // refs, −1 and +2, averaged).
  const byLane = new Map<PacketId, number[]>([
    ['control', [-0.01, 0.02]],
    ['tempo', [0.03, 0.05, 0.09]],
    ['affliction', [0.04]],
  ]);
  const ranks = rankLanesByMedian(byLane);
  assert(
    JSON.stringify(ranks.map((r) => [r.lane, r.rank, r.refs])) === JSON.stringify([['tempo', 1, 3], ['affliction', 2, 1], ['control', 3, 2]]),
    `ranked by median uplift, strongest first: ${JSON.stringify(ranks)}`,
  );
  assert(close(ranks[2].up, 0.005), `an even list's median averages the middle two, got ${ranks[2].up}`);
  const reading = encounterReading(ranks, 'tempo', 'control');
  assert(reading.favouredAhead === true, 'the favoured lane ranks above the punished one');
  assert(close(reading.margin, 0.045), `the margin is favoured − punished, reported as is: ${reading.margin}`);

  // The margin is never thresholded and the floor does not enter the check: a
  // favoured lane that FAILS the floor still ranks, and an inversion is reported
  // as an inversion, not as a floor verdict.
  const inverted = encounterReading(ranks, 'control', 'tempo');
  assert(inverted.favouredAhead === false && close(inverted.margin, -0.045), 'an inversion reads as one, with its margin');
  const unranked = encounterReading(ranks, 'tempo', 'kill-chain');
  assert(unranked.margin === null && unranked.favouredAhead === null, 'a lane with no reference on the node is unranked');
  assert(rankLanesByMedian(new Map([['tempo', []]])).length === 0, 'a lane with no readings is not ranked at all');
}

console.log('viabilityFloor: ok');
