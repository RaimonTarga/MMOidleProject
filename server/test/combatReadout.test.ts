/**
 * The combat readout's pure rules (docs/briefs/combat-readout-run-2026-10-06.md):
 * band selection by share, DoT coalescing, the lane stack's cap. No balance numbers.
 * Pure modules only (this file is typechecked by tsconfig.test.json); the style and
 * wiring checks that need client render state live in combatText.test.ts.
 */
import assert from 'node:assert/strict';
import { NUMBER_TOKENS } from '../../client/src/render/readoutTokens';
import { DotCoalescer, LaneStack, numberBandFor, shiftBand } from '../../client/src/render/readoutModel';

// ── Band by share ────────────────────────────────────────────────────────────
{
  const [chip, hit, heavy, swing] = NUMBER_TOKENS.bands;
  assert.equal(numberBandFor(1, 100), 'chip');
  assert.equal(numberBandFor(hit.minShare * 100, 100), 'hit', 'a band starts at its own minShare');
  assert.equal(numberBandFor(hit.minShare * 100 - 0.01, 100), 'chip');
  assert.equal(numberBandFor(heavy.minShare * 1000, 1000), 'heavy');
  assert.equal(numberBandFor(swing.minShare * 50, 50), 'swing');
  assert.equal(numberBandFor(500, 100), 'swing', 'overkill stays at the top band');
  assert.equal(numberBandFor(20, undefined), NUMBER_TOKENS.unknownShareBand, 'unknown pool draws at the fallback band');
  assert.equal(numberBandFor(20, 0), NUMBER_TOKENS.unknownShareBand);
  // The same 21 is a chip on a boss and a heavy hit on a rat: size says share, not digits.
  assert.equal(numberBandFor(21, 2100), 'chip');
  assert.equal(numberBandFor(21, 160), 'heavy');
  assert.equal(shiftBand('swing', 1), 'swing');
  assert.equal(shiftBand('chip', -1), 'chip');
  assert.equal(shiftBand('hit', 1), 'heavy');
  assert(chip.sizePx < hit.sizePx && hit.sizePx < heavy.sizePx && heavy.sizePx < swing.sizePx, 'bands grow');
}

// ── DoT coalescing ───────────────────────────────────────────────────────────
{
  const c = new DotCoalescer<{ amount: number; at: number }>(1000);
  c.add('m|bleed', { amount: 3, at: 0 }, 0);
  c.add('m|bleed', { amount: 2, at: 500 }, 500);
  c.add('m|poison', { amount: 4, at: 600 }, 600);
  assert.deepEqual(c.flush(999), [], 'nothing draws before the window closes');
  const first = c.flush(1000);
  assert.deepEqual(first.map(e => e.amount), [5], 'one number per target and element per window');
  assert.equal(first[0].at, 500, 'the newest tick carries the position');
  assert.deepEqual(c.flush(1600).map(e => e.amount), [4], 'another element keeps its own window');
  assert.equal(c.size, 0);
  c.add('m|bleed', { amount: 1, at: 2000 }, 2000);
  c.reset();
  assert.deepEqual(c.flush(9999), [], 'reset drops open windows');
}

// ── The lane stack ───────────────────────────────────────────────────────────
function floater(height = 10) {
  const f = { height, lift: -1, alive: true, destroyed: false,
    isAlive: () => f.alive, setLift: (l: number) => { f.lift = l; }, destroy: () => { f.alive = false; f.destroyed = true; } };
  return f;
}
{
  const lanes = new LaneStack<ReturnType<typeof floater>>(3, 2);
  const a = floater(), b = floater(), c = floater(20), d = floater();
  lanes.push('m', a);
  assert.equal(a.lift, 0);
  lanes.push('m', b);
  assert.deepEqual([b.lift, a.lift], [0, 12], 'newest at the base, older lifted by height + gap');
  lanes.push('m', c);
  assert.deepEqual([c.lift, b.lift, a.lift], [0, 22, 34]);
  const dropped = lanes.push('m', d);
  assert.deepEqual(dropped, [a], 'past the cap the OLDEST is dropped');
  assert(a.destroyed);
  assert.equal(lanes.liveCount('m'), 3);
  lanes.push('other', floater());
  assert.equal(lanes.liveCount('m'), 3, 'lanes are per target');
  b.alive = false;
  lanes.prune();
  assert.equal(lanes.liveCount('m'), 2, 'expired floaters leave the lane');
  assert.deepEqual(lanes.lifts('m'), [0, 12]);
  lanes.clear();
  assert(d.destroyed && c.destroyed);
}

console.log('combatReadout.test.ts: ok');
