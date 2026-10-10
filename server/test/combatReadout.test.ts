/**
 * The combat readout's pure rules (docs/briefs/combat-readout-run-2026-10-06.md):
 * band selection by share, DoT coalescing, the lane stack's cap, the bar's size class
 * and chip, quarter markers, the boss frame's model. No balance numbers.
 * Pure modules only (this file is typechecked by tsconfig.test.json); the style and
 * wiring checks that need client render state live in combatText.test.ts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BAR_TOKENS, FRAME_TOKENS, NUMBER_TOKENS, readoutCssVars } from '../../client/src/render/readoutTokens';
import {
  DotCoalescer, LaneStack, absorbBand, bodySizeClass, chipActive, chipAdvance, chipValue, colorInt, healthColor,
  barHeightAtZoom, critBand, numberBandFor, numberScreenScale, targetMark, quarterModel, segmentMarks, shiftBand, type ChipState,
} from '../../client/src/render/readoutModel';
import {
  bossFrameEqual, bossFrameModel, liveCast, pickBoss, type BossFrameSource,
} from '../../client/src/hud/bossFrameModel';

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
  // A crit moves up one band and never draws below the crit floor (heavy).
  assert.equal(critBand('chip'), 'heavy', 'a chip-sized crit (a boss) still pops at the floor');
  assert.equal(critBand('hit'), 'heavy');
  assert.equal(critBand('heavy'), 'swing');
  assert.equal(critBand('swing'), 'swing');
  // The target frame's mark: a guardian outranks an elite, as its overhead outline does.
  assert.equal(targetMark(true, true), 'guardian');
  assert.equal(targetMark(true, false), 'guardian');
  assert.equal(targetMark(false, true), 'elite');
  assert.equal(targetMark(false, false), null);
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

// ── Quarter markers from (hp, maxHp) ─────────────────────────────────────────
{
  const at = (hp: number) => quarterModel(hp, 2100);
  assert.equal(at(2100).lost, 0);
  assert.deepEqual(at(2100).markers.map(m => [m.lost, m.next]), [[false, true], [false, false], [false, false]],
    'full: the 75 % boundary is next');
  assert.equal(at(1575).lost, 1, 'exactly 75 % has lost the first quarter');
  assert.equal(at(1576).lost, 0);
  assert.equal(at(1112).lost, 1, 'the Behemoth at 53 %');
  assert.deepEqual(at(1112).markers.map(m => [m.lost, m.next]), [[true, false], [false, true], [false, false]]);
  assert.equal(at(420).lost, 3, 'three lit: the fourth firing is next');
  assert.equal(at(420).markers.every(m => m.lost), true);
  assert.equal(at(420).markers.some(m => m.next), false, 'past the last inner boundary only the kill is next');
  assert.equal(at(1).lost, 3);
  assert.equal(at(0).lost, 4, 'the fourth quarter is lost only at zero');
  assert.equal(quarterModel(10, 0).lost, 4, 'no pool reads as empty');
}

// ── The absorb band ──────────────────────────────────────────────────────────
{
  assert.equal(absorbBand(0.5, 0), null);
  assert.deepEqual(absorbBand(0.5, 0.2), { left: 50, width: 20 }, 'starts where health ends');
  assert.deepEqual(absorbBand(1, 0.2), { left: 80, width: 20 }, 'slides back inside at full HP');
  assert.equal(absorbBand(0.5, 0.001)!.width, FRAME_TOKENS.bar.absorbMinShare * 100, 'a tiny shell keeps a sliver');
}

// ── The boss frame's model from the view ─────────────────────────────────────
{
  const boss = (over: Partial<BossFrameSource> = {}): BossFrameSource => ({
    id: 'b', name: 'Crag Behemoth', monsterTypeId: 'crag-behemoth', nodeId: 'n', hp: 1112, maxHp: 2100,
    isBoss: true, attackTargetId: null, ...over,
  });
  const viewer = { id: 'p', nodeId: 'n', attackTargetId: null as string | null };
  assert.equal(pickBoss([boss()], viewer), null, 'a boss neither targeted nor aggroed shows no frame');
  assert.equal(pickBoss([boss()], { ...viewer, attackTargetId: 'b' })?.reason, 'target');
  assert.equal(pickBoss([boss({ attackTargetId: 'p' })], viewer)?.reason, 'aggro', 'a boss with aggro on the player');
  assert.equal(pickBoss([boss({ attackTargetId: 'other' })], viewer), null, 'aggro on someone else is not enough');
  assert.equal(pickBoss([boss({ attackTargetId: 'p', nodeId: 'elsewhere' })], viewer), null, 'only on the player node');
  assert.equal(pickBoss([boss({ attackTargetId: 'p', hp: 0 })], viewer), null, 'a dead boss shows no frame');
  assert.equal(pickBoss([boss({ attackTargetId: 'p', isBoss: false })], viewer), null, 'an elite is not a boss');
  const two = pickBoss([boss({ id: 'b2', attackTargetId: 'p' }), boss({ id: 'b1' })], { ...viewer, attackTargetId: 'b1' });
  assert.equal(two?.boss.id, 'b1', 'the target wins over another boss with aggro');

  const cast = { label: 'Crag Charge', startedAt: 1000, castMs: 2400 };
  const m = bossFrameModel(boss({ enemyBarrier: { amount: 300, maxAmount: 400 } as never, bossPhase: 'Stampede', primed: true }),
    'target', 2, cast, 2000);
  assert.equal(m.absorb, 300);
  assert.equal(m.phase, 'Stampede');
  assert.equal(m.primed, true);
  assert.equal(m.tier, 2);
  assert.deepEqual(m.cast, cast);
  assert.equal(bossFrameModel(boss(), 'aggro', 1, undefined, 0).phase, null);
  assert.equal(bossFrameModel(boss({ enemyBarrier: { amount: -5, maxAmount: 10 } as never }), 'aggro', 1, undefined, 0).absorb, 0);
  assert.equal(liveCast(cast, 1000 + 2400 + FRAME_TOKENS.cast.graceMs), cast, 'a finished cast waits briefly for its end');
  assert.equal(liveCast(cast, 1000 + 2400 + FRAME_TOKENS.cast.graceMs + 1), null, '...then clears');
  assert.equal(bossFrameEqual(m, { ...m }), true);
  assert.equal(bossFrameEqual(m, { ...m, hp: m.hp - 1 }), false);
  assert.equal(bossFrameEqual(m, { ...m, cast: null }), false);
  assert.equal(bossFrameEqual(null, null), true);
}

// ── The phone camera floor ───────────────────────────────────────────────────
{
  assert.equal(numberScreenScale(1), 1, 'desktop numbers are unchanged');
  assert.equal(numberScreenScale(0), 1, 'a missing zoom is treated as 1');
  const floor = 0.4;
  const s = numberScreenScale(floor);
  assert(Math.abs(s * floor - NUMBER_TOKENS.screenFloor) < 1e-9, 'at the floor a number keeps screenFloor of its screen size');
  assert.equal(numberScreenScale(0.9), 1, 'near zoom 1 the world size already reads');
  assert.equal(barHeightAtZoom(4, 1), 4);
  assert(Math.abs(barHeightAtZoom(4, floor) * floor - BAR_TOKENS.screenFloor.height) < 1e-9, 'a bar keeps its screen thickness at the floor');
  assert.equal(barHeightAtZoom(10, 0.9), 10, 'a bar already thick enough is untouched');
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
  const vars = readoutCssVars();
  for (const [name, value] of Object.entries(vars)) {
    assert(name.startsWith('--ro-'), `css var ${name} is namespaced`);
    assert(value.length > 0, `css var ${name} has a value`);
  }
  for (const size of Object.keys(FRAME_TOKENS.bar.height)) assert(vars[`--ro-h-${size}`] && vars[`--ro-num-${size}`]);
  assert(FRAME_TOKENS.cast.primed !== NUMBER_TOKENS.crit.color, 'the primed line is not crit gold');
  assert(FRAME_TOKENS.lowHealth.at > 0 && FRAME_TOKENS.lowHealth.at < 0.5);
}

// ── The uishot harnesses' copy of the css vars ──────────────────────────────
{
  // tools/uishot/harness/*.html are static pages: they cannot call readoutCssVars(),
  // so readout-vars.css carries a copy. It must say what the tokens say.
  const css = readFileSync(join(__dirname, '../../tools/uishot/harness/readout-vars.css'), 'utf8');
  const copied = Object.fromEntries([...css.matchAll(/(--ro-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const expected = readoutCssVars();
  const block = Object.entries(expected).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  assert.deepEqual(copied, expected, `tools/uishot/harness/readout-vars.css drifted from the tokens; its :root block should read:\n${block}\n`);
}
console.log('combatReadout.test.ts: ok');
