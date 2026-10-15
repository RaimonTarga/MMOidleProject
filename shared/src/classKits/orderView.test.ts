/**
 * The Order editor's view model (class-first build plan CS.5): beats with their positions,
 * owned techniques with where they may go, the finisher as the trophy, the slot count, and
 * edits that come back as configs the shared validator checks. Structure only.
 */
import { classConfigContextFromState, defaultClassConfig } from './config';
import { composeOrderView, withBeat, withRelic } from './orderView';
import type { ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const input: ClassScreenInput = {
  combatArchetype: 'cadence',
  // Every T1 lesson; Global Mastery 30 opens three beats.
  biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  bossesCleared: ['plains:1'],
  disciplineId: null,
  classConfig: null,
  playerTier: 1,
};
const ctx = classConfigContextFromState(input)!;
const config = defaultClassConfig(ctx);
const view = composeOrderView({ ...input, classConfig: config })!;

assert(composeOrderView({ ...input, combatArchetype: 'cooldown' }) === null, 'only a Striker has an Order');
assert(view.beats.length === 4, 'a T1 combo has four beats before the finisher');
assert(view.beats[0].position === 'opener' && view.beats[3].position === 'windup', 'the two cast positions');
assert(view.slots.open === 3 && view.slots.used <= 3 && view.slots.mastered === 0, 'three open beats at Mastery 30, none mastered');
assert(view.problems.length === 0, `the default Order is valid (${view.problems.join('; ')})`);
assert(view.finisher.trophyId === 'striker-relic-plains' && view.finisher.kind === 'spark', 'auto equips the Plains trophy');

const focus = view.techniques.find((t) => t.id === 'striker-focus')!;
const coil = view.techniques.find((t) => t.id === 'striker-coil')!;
const sweep = view.techniques.find((t) => t.id === 'striker-sweep')!;
assert(focus.allowedBeats.join() === '0' && coil.allowedBeats.join() === '3', 'casts only on their own position');
assert(sweep.allowedBeats.length === 4, 'a technique goes on any beat');
assert(!view.techniques.some((t) => t.id === 'striker-finisher'), 'the plain finisher is not a technique');

// Editing: move Sweep to beat 1; a cast off its position is refused by the validator.
const moved = withBeat(config, 1, 'striker-sweep');
const movedView = composeOrderView({ ...input, classConfig: moved })!;
assert(moved.mode === 'custom', 'an edit makes the Order custom');
assert(movedView.beats[1].pieceId === 'striker-sweep' && movedView.beats.filter((b) => b.pieceId === 'striker-sweep').length === 1,
  'Sweep moved, not copied');
const misplaced = composeOrderView({ ...input, classConfig: withBeat(config, 2, 'striker-focus') })!;
assert(misplaced.problems.some((p) => p.includes('opener')), 'Focus off the first beat is refused, in words');

// The plain finisher with no trophy equipped.
const plain = composeOrderView({ ...input, classConfig: withRelic(config, null) })!;
assert(plain.finisher.kind === 'plain' && plain.finisher.trophyId === null, 'no trophy: the plain finisher');

console.log('orderView.test.ts: ok');
