/**
 * The combat readout's pure rules (docs/briefs/combat-readout-run-2026-10-06.md):
 * band selection by share, DoT coalescing, the lane stack's cap, the bar's size class
 * and chip. No balance numbers.
 * Pure modules only (this file is typechecked by tsconfig.test.json); the style and
 * wiring checks that need client render state live in combatText.test.ts.
 */
import assert from 'node:assert/strict';
import { BAR_TOKENS, NUMBER_TOKENS } from '../../client/src/render/readoutTokens';
import {
  DotCoalescer, LaneStack, bodySizeClass, chipActive, chipAdvance, chipValue, colorInt, healthColor,
  numberBandFor, segmentMarks, shiftBand, type ChipState,
} from '../../client/src/render/readoutModel';

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

// ── Overhead bars: size class, thirds, segments ─────────────────────────────
{
  const { small, large } = BAR_TOKENS.sizeClassPx;
  assert.equal(bodySizeClass(64 * 0.85, false), 'small', 'a Grass Kite (scale 0.85) is small');
  assert.equal(bodySizeClass(64, false), 'medium');
  assert.equal(bodySizeClass(small, false), 'medium', 'the small threshold is exclusive');
  assert.equal(bodySizeClass(large, false), 'large');
  assert.equal(bodySizeClass(32, true), 'boss', 'a boss is a boss whatever its size');
  const w = BAR_TOKENS.width;
  assert(w.small < w.medium && w.medium < w.large && w.large < w.boss, 'widths grow with the body');
  assert(BAR_TOKENS.minion.height < BAR_TOKENS.height.medium, 'summons draw a slimmer bar');
  assert.equal(healthColor(1), BAR_TOKENS.color.high);
  assert.equal(healthColor(BAR_TOKENS.thirds.high), BAR_TOKENS.color.mid, 'exactly half is no longer "high"');
  assert.equal(healthColor(0.3), BAR_TOKENS.color.mid);
  assert.equal(healthColor(0.1), BAR_TOKENS.color.low);
  assert.deepEqual(segmentMarks(), [0.25, 0.5, 0.75]);
  assert.equal(colorInt('#44ee44'), 0x44ee44);
}

// ── The chip's decay ─────────────────────────────────────────────────────────
{
  const { holdMs, drainMs, reholdShare } = BAR_TOKENS.chip;
  let c: ChipState = chipAdvance(undefined, 1, 0);
  assert.equal(chipActive(c, 0), false, 'a fresh bar has no chip');
  c = chipAdvance(c, 0.6, 100);
  assert.equal(chipValue(c, 100), 1, 'the chip holds the old value...');
  assert.equal(chipValue(c, 100 + holdMs), 1, '...for the whole hold');
  const mid = chipValue(c, 100 + holdMs + drainMs / 2);
  assert(mid < 1 && mid > 0.6, 'then drains');
  assert.equal(chipValue(c, 100 + holdMs + drainMs), 0.6, 'and lands on the fill');
  assert.equal(chipActive(c, 100 + holdMs + drainMs + 1), false);
  // A heal to or above the chip snaps it to the fill; one below it drains toward the new fill.
  assert.equal(chipValue(chipAdvance(c, 1, 200), 200), 1);
  const healed = chipAdvance(c, 0.9, 200);
  assert.equal(chipValue(healed, 200), 1, 'no jump');
  assert.equal(chipValue(healed, 200 + drainMs), 0.9);
  // A small drop while the chip is out keeps it draining instead of re-holding.
  let d = chipAdvance(chipAdvance(undefined, 1, 0), 0.8, 0);
  const t = holdMs + drainMs / 2;
  const before = chipValue(d, t);
  d = chipAdvance(d, 0.8 - reholdShare / 2, t);
  assert.equal(chipValue(d, t), before, 'no jump at the moment of the small drop');
  assert(chipValue(d, t + 50) < before, 'and it keeps draining — a 0.5 s DoT never pins it');
  // A fresh hit of at least reholdShare holds again from where the chip is.
  const e = chipAdvance(d, 0.5, t + 50);
  assert.equal(chipValue(e, t + 50 + holdMs), chipValue(d, t + 50), 'a big drop restarts the hold');
}

// ── The tokens module's shape ────────────────────────────────────────────────
{
  const bands = NUMBER_TOKENS.bands;
  assert.equal(bands[0].minShare, 0, 'the lowest band catches every hit');
  for (let i = 1; i < bands.length; i++) {
    assert(bands[i].minShare > bands[i - 1].minShare, 'bands ascend by share');
    assert(bands[i].sizePx > bands[i - 1].sizePx, 'bands ascend by size');
  }
  assert(bands.some(b => b.band === NUMBER_TOKENS.dotMaxBand));
  assert(bands.some(b => b.band === NUMBER_TOKENS.unknownShareBand));
  const hex = /^#[0-9a-f]{6}$/i;
  const numberColors = [...Object.values(NUMBER_TOKENS.color), ...Object.values(NUMBER_TOKENS.element), NUMBER_TOKENS.crit.color];
  for (const c of numberColors) assert.match(c, hex);
  assert.equal(numberColors.filter(c => c === NUMBER_TOKENS.crit.color).length, 1, 'the crit gold is no other kind of number colour');
  for (const m of Object.values(NUMBER_TOKENS.motion)) assert(m.lifeMs > m.popMs && m.popScale >= 1 && m.risePx >= 0);
  assert(NUMBER_TOKENS.motion.dot.risePx < NUMBER_TOKENS.motion.hit.risePx, 'a DoT tick rises small');
  assert(NUMBER_TOKENS.lane.cap >= 1 && NUMBER_TOKENS.dotWindowMs > 0);
  assert(NUMBER_TOKENS.screenFloor > 0 && NUMBER_TOKENS.screenFloor <= 1);
}
console.log('combatReadout.test.ts: ok');
