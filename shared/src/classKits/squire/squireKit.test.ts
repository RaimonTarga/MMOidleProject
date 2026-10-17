/**
 * The Squire's kit against the bible's totals through T4 (§8.8, §8.9, §8.16). Structure
 * only, never balance: every number in the kit is a placeholder.
 */
import { MOMENTS } from '../moments';
import { learnedLessons, lessonId, trophyRanks } from '../registry';
import { SQUIRE_KIT, type SquireFamily } from './kit';
import { classConfigContextFromState, defaultClassConfig } from '../config';
import { JUGGERNAUT_HOLD_SLAM_BELOW } from '../configs/squire';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return counts;
}

function same(actual: Record<string, number>, expected: Record<string, number>, what: string): void {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  for (const key of keys) {
    assert((actual[key] ?? 0) === (expected[key] ?? 0), `${what} ${key}: ${actual[key] ?? 0}, expected ${expected[key] ?? 0}`);
  }
}

const kit = SQUIRE_KIT;
const pieceById = new Map(kit.pieces.map((p) => [p.id, p]));

// Pieces: the slam, 16 new, 2 sidegrades, 3 discipline pieces and Last Breath.
assert(kit.pieces.length === 23, `23 pieces, not ${kit.pieces.length}`);
same(countBy(kit.pieces, (p) => p.family), {
  guard: 8, counter: 7, hold: 6, slam: 1, emergency: 1,
} satisfies Record<SquireFamily, number>, 'family');
assert(pieceById.get('squire-stand-fast')?.sidegradeOf === 'squire-guard', 'Stand Fast is a sidegrade of Guard');
assert(pieceById.get('squire-disarm')?.sidegradeOf === 'squire-shield-bash', 'Disarm is a sidegrade of Shield Bash');
assert(kit.pieces.filter((p) => p.sidegradeOf).length === 2, 'two sidegrades');

// Every response answers one enemy action; the slam answers none.
for (const piece of kit.pieces) {
  if (piece.family === 'slam') {
    assert(piece.answers === undefined, 'the slam answers no moment');
  } else {
    assert(piece.answers !== undefined && piece.answers in MOMENTS, `${piece.id} answers a known moment`);
  }
  // Placeholders for the designer; the runtime reads them (C-squire CQ.1–CQ.2).
  assert(Object.values(piece.params).every((v) => Number.isFinite(v) && v >= 0), `${piece.id}: finite params`);
}

// Lessons: 16 new, 2 sidegrades, 8 rank-ups, 4 from the discipline pick, the starter slam.
same(countBy(kit.lessons, (l) => l.kind), {
  starter: 1, new: 16, sidegrade: 2, 'rank-up': 8, discipline: 4,
}, 'lesson kind');
const t1Zones = kit.lessons.filter((l) => l.source.kind === 'zone' && l.source.tier === 1);
same(countBy(t1Zones, (l) => (l.source.kind === 'zone' ? l.source.biome : '')), {
  plains: 1, forest: 1, swamp: 1, mountain: 1, cave: 1,
}, 'T1 zone lesson in');

// Trophies: one per lineage, six Resolve relics and five slam relics.
assert(kit.trophies.length === 11, `11 trophies, not ${kit.trophies.length}`);
same(countBy(kit.trophies, (t) => t.kind), { resolve: 6, slam: 5 }, 'trophy kind');

// The tree: three disciplines, three specializations and three T4 leaves under each.
assert(kit.disciplines.length === 3, 'three disciplines');
assert(kit.specializations.length === 9, 'nine specializations');
assert(kit.leaves.length === 9, 'nine leaves');
for (const discipline of kit.disciplines) {
  assert(discipline.pieceId !== undefined && pieceById.has(discipline.pieceId), `${discipline.id} unlocks a kit piece`);
  assert(kit.specializations.filter((s) => s.disciplineId === discipline.id).length === 3, `${discipline.id}: three specializations`);
  const leaves = kit.leaves.filter((l) => l.disciplineId === discipline.id);
  assert(leaves.length === 3 && leaves.every((l) => l.tier === 4), `${discipline.id}: three T4 leaves`);
  assert(
    leaves.map((l) => l.column).sort().join() === 'empty-bar,quiet,wasted-answer',
    `${discipline.id}: one leaf per T4 column`,
  );
}

// The derivations: the pick brings its own piece and Last Breath, never another's.
const bulwark = learnedLessons('cooldown', { biomeLevel: {}, bossesCleared: [], disciplineId: 'squire-bulwark' });
assert(
  bulwark.map(lessonId).sort().join() === 'squire-intercept,squire-last-breath,squire-slam',
  `a fresh Bulwark knows the slam, Intercept and Last Breath: ${bulwark.map(lessonId).join()}`,
);
assert(trophyRanks('cooldown', ['jungle:2', 'jungle:4']).get('squire-relic-jungle') === 3, 'the T4 Jungle boss gives Strangler Vine III');

// The auto default per discipline (§8.13, OV2-SQUIRE): only the Juggernaut holds its slam, on a nearly dead target.
for (const disciplineId of ['squire-avenger', 'squire-bulwark', 'squire-juggernaut']) {
  const ctx = classConfigContextFromState({
    combatArchetype: 'cooldown', biomeLevel: { plains: 12 }, bossesCleared: ['plains:1', 'mountain:1'], disciplineId,
  })!;
  const system = defaultClassConfig(ctx).system;
  assert(system.kind === 'responses', `${disciplineId}: Response rules`);
  const hold = system.kind === 'responses' ? system.holdSlam : [];
  if (disciplineId === 'squire-juggernaut') {
    assert(hold.length === 1 && hold[0].id === 'target-low' && hold[0].param === JUGGERNAUT_HOLD_SLAM_BELOW, 'the Juggernaut holds the slam on a low target');
  } else {
    assert(hold.length === 0, `${disciplineId}: the slam is never held`);
  }
}

console.log('squireKit.test.ts: ok');
