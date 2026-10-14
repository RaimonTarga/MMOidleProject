/**
 * Spirit kit totals from bible §11 (task K5). Structure only: the counts, families,
 * lessons, moments and tree the brief pins. No balance numbers.
 */
import { LESSON_ZONE_LEVEL } from '../kitHelpers';
import { lessonId } from '../registry';
import type { KitBiome } from '../types';
import { SPIRIT_KIT, type SpiritFamily, type SpiritTrophyKind } from './kit';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const kit = SPIRIT_KIT;

const FAMILIES: Readonly<Record<string, SpiritFamily>> = {
  'spirit-bolt': 'strike',
  'spirit-chain-lightning': 'strike',
  'spirit-thunderbolt': 'strike',
  'spirit-hailstorm': 'strike',
  'spirit-forked-bolt': 'strike',
  'spirit-ash-lightning': 'strike',
  'spirit-sleet': 'strike',
  'spirit-thunderstorm': 'strike',
  'spirit-ball-lightning': 'strike',
  'spirit-storm-surge': 'strike',
  'spirit-cloudburst': 'strike',
  'spirit-thunderclap': 'squall',
  'spirit-gale': 'squall',
  'spirit-flare': 'squall',
  'spirit-dust-devil': 'squall',
  'spirit-downburst': 'squall',
  'spirit-ground-charge': 'squall',
  'spirit-dust-wall': 'squall',
  'spirit-maelstrom': 'squall',
  'spirit-downpour': 'calm',
  'spirit-eye-of-the-storm': 'calm',
  'spirit-updraft': 'calm',
  'spirit-foehn': 'calm',
  'spirit-tailwind': 'calm',
};

assert(kit.pieces.length === 24, `24 pieces, not ${kit.pieces.length}`);
assert(Object.keys(FAMILIES).length === 24, 'the family table lists every piece');
const familyCount = (family: SpiritFamily) => kit.pieces.filter((piece) => piece.family === family).length;
assert(familyCount('strike') === 11, `strikes 11, not ${familyCount('strike')}`);
assert(familyCount('squall') === 8, `squalls 8, not ${familyCount('squall')}`);
assert(familyCount('calm') === 5, `calms 5, not ${familyCount('calm')}`);
for (const piece of kit.pieces) {
  assert(FAMILIES[piece.id] === piece.family, `${piece.id} is a ${FAMILIES[piece.id] ?? 'missing'} piece, filed as ${piece.family}`);
}

const SIDEGRADES: Readonly<Record<string, string>> = {
  'spirit-forked-bolt': 'spirit-chain-lightning',
  'spirit-sleet': 'spirit-hailstorm',
  'spirit-dust-wall': 'spirit-gale',
};
const sidegrades = kit.pieces.filter((piece) => piece.sidegradeOf);
assert(sidegrades.length === 3, `3 sidegrades, not ${sidegrades.length}`);
for (const piece of sidegrades) {
  assert(SIDEGRADES[piece.id] === piece.sidegradeOf, `${piece.id} sidegrades ${piece.sidegradeOf}`);
}

const WAITS: Readonly<Record<string, string>> = {
  'spirit-thunderclap': 'touched',
  'spirit-downpour': 'carrying-dot',
  'spirit-updraft': 'inside-telegraph',
  'spirit-flare': 'ambush',
  'spirit-dust-devil': 'ranged-attacker',
  'spirit-downburst': 'charging-at-me',
  'spirit-tailwind': 'drag-or-push',
  'spirit-foehn': 'chill-threshold',
  'spirit-maelstrom': 'target-out-of-reach',
};
const waiting = kit.pieces.filter((piece) => piece.waitsFor !== undefined);
assert(waiting.length === Object.keys(WAITS).length, `only the listed spends wait, not ${waiting.length}`);
for (const piece of waiting) {
  assert(WAITS[piece.id] === piece.waitsFor, `${piece.id} waits for ${piece.waitsFor}`);
}
const atFloor = kit.pieces.filter((piece) => piece.atFloor).map((piece) => piece.id);
assert(atFloor.join() === 'spirit-eye-of-the-storm', `only Eye of the Storm sits at the floor, not ${atFloor.join()}`);

const ZONE_LESSONS: Readonly<Record<string, { biome: KitBiome; tier: number; kind: 'new' | 'sidegrade' }>> = {
  'spirit-chain-lightning': { biome: 'plains', tier: 1, kind: 'new' },
  'spirit-thunderclap': { biome: 'forest', tier: 1, kind: 'new' },
  'spirit-downpour': { biome: 'swamp', tier: 1, kind: 'new' },
  'spirit-eye-of-the-storm': { biome: 'mountain', tier: 1, kind: 'new' },
  'spirit-thunderbolt': { biome: 'cave', tier: 1, kind: 'new' },
  'spirit-gale': { biome: 'plains', tier: 2, kind: 'new' },
  'spirit-hailstorm': { biome: 'mountain', tier: 2, kind: 'new' },
  'spirit-updraft': { biome: 'cave', tier: 2, kind: 'new' },
  'spirit-flare': { biome: 'jungle', tier: 2, kind: 'new' },
  'spirit-dust-devil': { biome: 'desert', tier: 2, kind: 'new' },
  'spirit-downburst': { biome: 'mountain', tier: 3, kind: 'new' },
  'spirit-tailwind': { biome: 'swamp', tier: 3, kind: 'new' },
  'spirit-forked-bolt': { biome: 'jungle', tier: 3, kind: 'sidegrade' },
  'spirit-foehn': { biome: 'tundra', tier: 3, kind: 'new' },
  'spirit-ash-lightning': { biome: 'volcanic', tier: 3, kind: 'new' },
  'spirit-sleet': { biome: 'tundra', tier: 4, kind: 'sidegrade' },
  'spirit-ground-charge': { biome: 'jungle', tier: 4, kind: 'new' },
  'spirit-dust-wall': { biome: 'desert', tier: 4, kind: 'sidegrade' },
  'spirit-thunderstorm': { biome: 'graveyard', tier: 4, kind: 'new' },
  'spirit-maelstrom': { biome: 'trench', tier: 4, kind: 'new' },
};

const RANK_UPS: Readonly<Record<string, { biome: KitBiome; tier: number }>> = {
  'spirit-thunderclap': { biome: 'forest', tier: 2 },
  'spirit-downpour': { biome: 'swamp', tier: 2 },
  'spirit-updraft': { biome: 'cave', tier: 3 },
  'spirit-dust-devil': { biome: 'desert', tier: 3 },
  'spirit-downburst': { biome: 'mountain', tier: 4 },
  'spirit-ash-lightning': { biome: 'volcanic', tier: 4 },
};

const DISCIPLINE_PIECES: Readonly<Record<string, string>> = {
  'spirit-overflow': 'spirit-ball-lightning',
  'spirit-tide': 'spirit-storm-surge',
  'spirit-reservoir': 'spirit-cloudburst',
};

const kindCount = (kind: string) => kit.lessons.filter((lesson) => lesson.kind === kind).length;
assert(kindCount('starter') === 1, `1 starter lesson, not ${kindCount('starter')}`);
assert(kindCount('new') === 17, `17 new lessons, not ${kindCount('new')}`);
assert(kindCount('sidegrade') === 3, `3 sidegrade lessons, not ${kindCount('sidegrade')}`);
assert(kindCount('rank-up') === 6, `6 rank-ups, not ${kindCount('rank-up')}`);
assert(kindCount('discipline') === 3, `3 discipline lessons, not ${kindCount('discipline')}`);
assert(kit.lessons.length === 30, `30 lessons, not ${kit.lessons.length}`);

const starter = kit.lessons.find((lesson) => lesson.kind === 'starter');
assert(starter?.pieceId === 'spirit-bolt' && starter.source.kind === 'starter', 'Bolt is the starter');

for (const lesson of kit.lessons) {
  if (lesson.source.kind !== 'zone') continue;
  assert(lesson.source.level === LESSON_ZONE_LEVEL, `${lessonId(lesson)} uses the default zone level`);
}

for (const [pieceId, expected] of Object.entries(ZONE_LESSONS)) {
  const lesson = kit.lessons.find((entry) => entry.pieceId === pieceId && entry.rank === 1);
  assert(lesson !== undefined, `${pieceId} has a rank-1 lesson`);
  assert(lesson.kind === expected.kind, `${pieceId} is taught as ${lesson.kind}`);
  assert(
    lesson.source.kind === 'zone' && lesson.source.biome === expected.biome && lesson.source.tier === expected.tier,
    `${pieceId} comes from ${expected.biome} T${expected.tier}`,
  );
}

const t1Biomes: readonly KitBiome[] = ['plains', 'forest', 'swamp', 'mountain', 'cave'];
for (const biome of t1Biomes) {
  const lessons = kit.lessons.filter(
    (lesson) => lesson.source.kind === 'zone' && lesson.source.biome === biome && lesson.source.tier === 1,
  );
  assert(lessons.length === 1, `${biome} teaches one T1 lesson, not ${lessons.length}`);
}

assert(Object.keys(RANK_UPS).length === 6, 'six rank-ups');
for (const [pieceId, expected] of Object.entries(RANK_UPS)) {
  const piece = kit.pieces.find((entry) => entry.id === pieceId);
  assert(piece?.ranks?.length === 1 && piece.ranks[0].rank === 2, `${pieceId} has rank 2 only`);
  const lesson = kit.lessons.find((entry) => entry.pieceId === pieceId && entry.rank === 2);
  assert(lesson !== undefined && lesson.kind === 'rank-up', `${pieceId} rank 2 is a rank-up`);
  assert(
    lesson.source.kind === 'zone' && lesson.source.biome === expected.biome && lesson.source.tier === expected.tier,
    `${pieceId} II comes from ${expected.biome} T${expected.tier}`,
  );
}
const rankedPieces = kit.pieces.filter((piece) => (piece.ranks?.length ?? 0) > 0);
assert(rankedPieces.length === 6, `only the six rank-ups have ranks, not ${rankedPieces.length}`);

for (const [disciplineId, pieceId] of Object.entries(DISCIPLINE_PIECES)) {
  const lesson = kit.lessons.find((entry) => entry.pieceId === pieceId);
  assert(lesson?.kind === 'discipline', `${pieceId} is a discipline lesson`);
  assert(
    lesson.source.kind === 'discipline' && lesson.source.disciplineId === disciplineId,
    `${pieceId} comes from ${disciplineId}`,
  );
}

const TROPHIES: Readonly<Record<string, { name: string; kind: SpiritTrophyKind }>> = {
  plains: { name: 'Crosswind', kind: 'spend' },
  forest: { name: 'Squall', kind: 'spend' },
  swamp: { name: 'Marsh Fire', kind: 'storm' },
  mountain: { name: 'Thunderhead', kind: 'storm' },
  cave: { name: 'Static Web', kind: 'spend' },
  jungle: { name: 'Running Storm', kind: 'spend' },
  desert: { name: 'Sandstorm', kind: 'storm' },
  tundra: { name: 'Ice Storm', kind: 'spend' },
  volcanic: { name: 'Pyrocumulus', kind: 'storm' },
  graveyard: { name: 'Stray Bolts', kind: 'spend' },
  trench: { name: 'Depth Charge', kind: 'storm' },
};
assert(kit.trophies.length === 11, `11 trophies, not ${kit.trophies.length}`);
const trophyKindCount = (kind: SpiritTrophyKind) => kit.trophies.filter((trophy) => trophy.kind === kind).length;
assert(trophyKindCount('spend') === 6, `six spend relics, not ${trophyKindCount('spend')}`);
assert(trophyKindCount('storm') === 5, `five storm relics, not ${trophyKindCount('storm')}`);
for (const trophy of kit.trophies) {
  const expected = TROPHIES[trophy.lineage];
  assert(expected !== undefined, `${trophy.id} has a known lineage`);
  assert(trophy.name === expected.name && trophy.kind === expected.kind, `${trophy.lineage} is ${expected.name} (${expected.kind})`);
}

const TREE: Readonly<Record<string, { name: string; pieceId: string; specs: readonly string[]; leaves: Readonly<Record<string, string>> }>> = {
  'spirit-overflow': {
    name: 'Overflow',
    pieceId: 'spirit-ball-lightning',
    specs: ['Stormdancer', 'Spillway', 'Lightning Rod'],
    leaves: { spike: 'Shunt', swarm: 'Static Field', 'slow-drain': 'Burn Off' },
  },
  'spirit-tide': {
    name: 'Tide',
    pieceId: 'spirit-storm-surge',
    specs: ['Spring Tide', 'Slack Water', 'Breakwater'],
    leaves: { spike: 'Turn of the Tide', swarm: 'Wading', 'slow-drain': 'Cleansing Tide' },
  },
  'spirit-reservoir': {
    name: 'Reservoir',
    pieceId: 'spirit-cloudburst',
    specs: ['Gathering Dark', 'Overcast', 'Deep Well'],
    leaves: { spike: 'Dam', swarm: 'Levee', 'slow-drain': 'Calm Depths' },
  },
};

assert(kit.disciplines.length === 3, `3 disciplines, not ${kit.disciplines.length}`);
assert(kit.specializations.length === 9, `9 specializations, not ${kit.specializations.length}`);
assert(kit.leaves.length === 9, `9 leaves, not ${kit.leaves.length}`);
for (const discipline of kit.disciplines) {
  const expected = TREE[discipline.id];
  assert(expected !== undefined, `${discipline.id} is one of the three disciplines`);
  assert(discipline.name === expected.name, `${discipline.id} is named ${expected.name}`);
  assert(discipline.pieceId === expected.pieceId, `${discipline.name} unlocks ${expected.pieceId}`);
  const specs = kit.specializations.filter((spec) => spec.disciplineId === discipline.id).map((spec) => spec.name);
  assert(specs.length === 3 && expected.specs.every((name) => specs.includes(name)), `${discipline.name} has its three specializations`);
  const leaves = kit.leaves.filter((leaf) => leaf.disciplineId === discipline.id);
  assert(leaves.length === 3, `${discipline.name} has three leaves`);
  for (const leaf of leaves) {
    assert(leaf.tier === 4, `${leaf.id} is a T4 leaf`);
    assert(expected.leaves[leaf.column] === leaf.name, `${discipline.name} ${leaf.column} is ${leaf.name}`);
  }
}

console.log('spiritKit.test.ts: ok');
