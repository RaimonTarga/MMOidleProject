/**
 * The Apprentice's kit against the bible's totals (§9.4, §9.5–§9.9, §9.16). Structure only:
 * every number in the kit is a placeholder.
 */
import { lessonId, learnedLessons, pieceRanks, trophyRanks } from '../registry';
import { APPRENTICE_KIT, type ApprenticeSchool } from './kit';

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
    assert(actual[key] === expected[key], `${what} ${key}: ${actual[key] ?? 0}, expected ${expected[key] ?? 0}`);
  }
}

const kit = APPRENTICE_KIT;
const pieceById = new Map(kit.pieces.map((p) => [p.id, p]));

// Pieces: Detonate, 5 at T1, 3 discipline pieces, 9 new and 3 sidegrades through T4 (§9.16).
assert(kit.pieces.length === 21, `21 pieces, not ${kit.pieces.length}`);
same(countBy(kit.pieces, (p) => p.family), { poison: 7, fire: 9, frost: 5 }, 'pieces in school');

// Lessons: 30 counting rank-ups; Poison 11, Fire 10, Frost 9 (§9.8).
assert(kit.lessons.length === 30, `30 lessons, not ${kit.lessons.length}`);
same(
  countBy(kit.lessons, (l) => l.kind),
  { starter: 1, new: 14, sidegrade: 3, discipline: 3, 'rank-up': 9 },
  'lessons of kind',
);
same(
  countBy(kit.lessons, (l) => pieceById.get(l.pieceId)?.family ?? 'none'),
  { poison: 11, fire: 10, frost: 9 } satisfies Record<ApprenticeSchool, number>,
  'lessons in school',
);

// One T1 zone lesson per T1 biome: Spread, Numb, Siphon, Seize, Converge (§9.4).
const t1 = kit.lessons.filter((l) => l.source.kind === 'zone' && l.source.tier === 1);
same(countBy(t1, (l) => (l.source.kind === 'zone' ? l.source.biome : 'none')), {
  plains: 1, forest: 1, swamp: 1, mountain: 1, cave: 1,
}, 'T1 lessons in');
assert(t1.every((l) => l.kind === 'new'), 'every T1 lesson teaches a new payoff');

// Sidegrades: Blast Back and Cinderfall of Detonate, Spore Burst of Spread.
same(
  Object.fromEntries(kit.pieces.filter((p) => p.sidegradeOf).map((p) => [p.id, 1])),
  { 'apprentice-blast-back': 1, 'apprentice-cinderfall': 1, 'apprentice-spore-burst': 1 },
  'sidegrade',
);
assert(pieceById.get('apprentice-blast-back')?.sidegradeOf === 'apprentice-detonate', 'Blast Back is a Detonate');
assert(pieceById.get('apprentice-cinderfall')?.sidegradeOf === 'apprentice-detonate', 'Cinderfall is a Detonate');
assert(pieceById.get('apprentice-spore-burst')?.sidegradeOf === 'apprentice-spread', 'Spore Burst is a Spread');

// Moments: only the lessons bound to their own moment carry one.
const moments = Object.fromEntries(kit.pieces.filter((p) => p.moment).map((p) => [p.id, p.moment]));
const expectedMoments: Record<string, string> = {
  'apprentice-seep': 'target-out-of-reach',
  'apprentice-recoil': 'debuff-landed',
  'apprentice-melt': 'chill-threshold',
  'apprentice-pyre': 'risen',
  'apprentice-snag': 'target-flees',
  'apprentice-blast-back': 'charging-at-me',
  'apprentice-sear': 'target-shielded',
  'apprentice-frostcrack': 'target-shielded',
};
for (const id of new Set([...Object.keys(moments), ...Object.keys(expectedMoments)])) {
  assert(moments[id] === expectedMoments[id], `${id}: moment ${moments[id]}, expected ${expectedMoments[id]}`);
}

// Trophies: eleven, seven payoff relics and four sigil relics (§9.9).
assert(kit.trophies.length === 11, `11 trophies, not ${kit.trophies.length}`);
const kinds = Object.fromEntries(kit.trophies.map((t) => [t.name, t.kind]));
for (const name of ['Outbreak', 'Glut', 'Petrify', 'Dune Wind', 'Frostheart', 'Dirge', 'Pressure Fuse']) {
  assert(kinds[name] === 'payoff', `${name} is a payoff relic`);
}
for (const name of ['Firstbrand', 'Brood Sigils', 'Scent', 'Magma Core']) {
  assert(kinds[name] === 'sigil', `${name} is a sigil relic`);
}

// The tree: three disciplines, each with its piece, three specializations and three leaves.
const disciplinePiece: Record<string, string> = {
  'apprentice-poison': 'apprentice-wither',
  'apprentice-fire': 'apprentice-fuse',
  'apprentice-frost': 'apprentice-cold-snap',
};
assert(kit.disciplines.length === 3, `3 disciplines, not ${kit.disciplines.length}`);
for (const d of kit.disciplines) {
  assert(disciplinePiece[d.id] === d.pieceId, `${d.id} unlocks ${disciplinePiece[d.id]}`);
  const taught = kit.lessons.find((l) => l.pieceId === d.pieceId);
  assert(taught?.source.kind === 'discipline' && taught.source.disciplineId === d.id, `${d.pieceId} is learned with ${d.id}`);
}
assert(kit.specializations.length === 9, `9 specializations, not ${kit.specializations.length}`);
same(countBy(kit.specializations, (s) => s.disciplineId), {
  'apprentice-poison': 3, 'apprentice-fire': 3, 'apprentice-frost': 3,
}, 'specializations under');
assert(kit.leaves.length === 9, `9 leaves, not ${kit.leaves.length}`);
for (const d of kit.disciplines) {
  const columns = kit.leaves.filter((l) => l.disciplineId === d.id).map((l) => l.column).sort().join();
  assert(columns === 'ambusher,charger,shooter', `${d.id} leaves answer charger, ambusher, shooter: ${columns}`);
}
assert(kit.leaves.every((l) => l.tier === 4), 'every leaf is a T4 leaf');

// The derivations read the kit: the Fire pick teaches Fuse, a T2 Forest ranks Numb up,
// the Desert's T2 boss gives Dune Wind.
const fire = learnedLessons('dot', { biomeLevel: {}, bossesCleared: [], disciplineId: 'apprentice-fire' });
assert(fire.map(lessonId).join() === 'apprentice-detonate,apprentice-fuse', `the Fire pick: ${fire.map(lessonId).join()}`);
const forest8 = pieceRanks('dot', { biomeLevel: { forest: 8 }, bossesCleared: [], disciplineId: null });
assert(forest8.get('apprentice-numb') === 2, 'Forest level 8 (T2) ranks Numb up to 2');
assert(trophyRanks('dot', ['desert:2']).get('apprentice-relic-desert') === 1, 'the T2 Desert boss gives Dune Wind');

console.log('apprenticeKit.test.ts: ok');
