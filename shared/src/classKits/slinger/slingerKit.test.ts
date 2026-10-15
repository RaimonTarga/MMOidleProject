/**
 * Slinger kit totals from bible §10 (task K4): families, lesson kinds, the T1 zones,
 * trophy rounds, and the Passive Tree. The shared classKits test checks shape.
 */
import { LESSON_ZONE_LEVEL } from '../kitHelpers';
import { lessonId } from '../registry';
import { SLINGER_KIT, type SlingerFamily } from './kit';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function must<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

const kit = SLINGER_KIT;

function piece(id: string) {
  const found = kit.pieces.find((entry) => entry.id === id);
  if (!found) throw new Error(`missing piece ${id}`);
  return found;
}

const PIECES: ReadonlyArray<{ id: string; name: string; family: SlingerFamily; color: string }> = [
  { id: 'slinger-plain-clip', name: 'Plain clip', family: 'damage', color: '#9aa3ad' },
  { id: 'slinger-scatter', name: 'Scatter', family: 'damage', color: '#f2a33a' },
  { id: 'slinger-snare', name: 'Snare', family: 'control', color: '#39c9b8' },
  { id: 'slinger-venom', name: 'Venom', family: 'damage', color: '#8fdc3c' },
  { id: 'slinger-stopping', name: 'Stopping', family: 'control', color: '#4a78ff' },
  { id: 'slinger-breaching', name: 'Breaching', family: 'damage', color: '#ff5a3c' },
  { id: 'slinger-buckshot', name: 'Buckshot', family: 'damage', color: '#d9822b' },
  { id: 'slinger-shellbreaker', name: 'Shellbreaker', family: 'utility', color: '#b8c4ff' },
  { id: 'slinger-tracer', name: 'Tracer', family: 'utility', color: '#ff6fd8' },
  { id: 'slinger-hollow-point', name: 'Hollow-point', family: 'damage', color: '#ff9f6b' },
  { id: 'slinger-seeker', name: 'Seeker', family: 'utility', color: '#9b7bff' },
  { id: 'slinger-acid', name: 'Acid', family: 'damage', color: '#c6e34a' },
  { id: 'slinger-tether', name: 'Tether', family: 'control', color: '#2fa39a' },
  { id: 'slinger-frost', name: 'Frost', family: 'control', color: '#8fe6ff' },
  { id: 'slinger-incendiary', name: 'Incendiary', family: 'damage', color: '#ff7a1a' },
  { id: 'slinger-thermite', name: 'Thermite', family: 'damage', color: '#ff3d6e' },
  { id: 'slinger-hallowed', name: 'Hallowed', family: 'damage', color: '#fff1b8' },
  { id: 'slinger-exploit', name: 'Exploit', family: 'damage', color: '#b06cff' },
];

assert(kit.pieces.length === 18, `18 pieces, found ${kit.pieces.length}`);
assert(kit.pieces.length === PIECES.length, 'piece table does not cover the kit');
const familyCount: Record<SlingerFamily, number> = { damage: 0, control: 0, utility: 0 };
for (const expected of PIECES) {
  const found = piece(expected.id);
  assert(found.name === expected.name, `${expected.id}: name ${found.name}`);
  assert(found.family === expected.family, `${expected.id}: family ${found.family}`);
  assert(found.color === expected.color, `${expected.id}: color ${found.color}`);
  // The T1-T3 clips and trophy rounds carry their runtime numbers (CL.2, T2-SLINGER, T3-SLINGER); T4 pieces stay empty.
  const t1Clip = ['slinger-scatter', 'slinger-snare', 'slinger-venom', 'slinger-stopping', 'slinger-breaching', 'slinger-buckshot', 'slinger-shellbreaker', 'slinger-tracer', 'slinger-hollow-point', 'slinger-seeker', 'slinger-acid', 'slinger-tether', 'slinger-frost', 'slinger-incendiary'].includes(expected.id);
  assert(t1Clip ? Object.values(found.params).every(Number.isFinite) : Object.keys(found.params).length === 0, `${expected.id}: params empty until their runtime`);
  familyCount[found.family] += 1;
}
assert(familyCount.damage === 11, `damage 11 (plain included), found ${familyCount.damage}`);
assert(familyCount.control === 4, `control 4, found ${familyCount.control}`);
assert(familyCount.utility === 3, `utility 3, found ${familyCount.utility}`);
assert(piece('slinger-plain-clip').plain === true, 'the plain clip stays the plain clip');

assert(piece('slinger-buckshot').sidegradeOf === 'slinger-scatter', 'Buckshot sidegrades Scatter');
assert(piece('slinger-acid').sidegradeOf === 'slinger-venom', 'Acid sidegrades Venom');
assert(piece('slinger-thermite').sidegradeOf === 'slinger-incendiary', 'Thermite sidegrades Incendiary');
assert(kit.pieces.filter((entry) => entry.sidegradeOf).length === 3, 'three sidegrades');

const rankUps = kit.pieces.reduce((sum, entry) => sum + (entry.ranks?.length ?? 0), 0);
assert(rankUps === 9, `9 rank-ups, found ${rankUps}`);
assert(piece('slinger-tracer').ranks?.map((rank) => rank.rank).join() === '2,3', 'Tracer ranks II and III');

/** piece, biome, tier, kind. Rank-ups are listed separately. */
const ZONE_LESSONS: ReadonlyArray<[string, string, number, 'new' | 'sidegrade']> = [
  ['slinger-scatter', 'plains', 1, 'new'],
  ['slinger-snare', 'forest', 1, 'new'],
  ['slinger-venom', 'swamp', 1, 'new'],
  ['slinger-stopping', 'mountain', 1, 'new'],
  ['slinger-breaching', 'cave', 1, 'new'],
  ['slinger-buckshot', 'plains', 2, 'sidegrade'],
  ['slinger-shellbreaker', 'mountain', 2, 'new'],
  ['slinger-tracer', 'jungle', 2, 'new'],
  ['slinger-hollow-point', 'desert', 2, 'new'],
  ['slinger-seeker', 'cave', 3, 'new'],
  ['slinger-acid', 'swamp', 3, 'sidegrade'],
  ['slinger-tether', 'desert', 3, 'new'],
  ['slinger-frost', 'tundra', 3, 'new'],
  ['slinger-incendiary', 'volcanic', 3, 'new'],
  ['slinger-thermite', 'volcanic', 4, 'sidegrade'],
  ['slinger-hallowed', 'graveyard', 4, 'new'],
  ['slinger-exploit', 'trench', 4, 'new'],
];

const RANK_UP_LESSONS: ReadonlyArray<[string, number, string, number]> = [
  ['slinger-snare', 2, 'forest', 2],
  ['slinger-venom', 2, 'swamp', 2],
  ['slinger-breaching', 2, 'cave', 2],
  ['slinger-stopping', 2, 'mountain', 3],
  ['slinger-shellbreaker', 2, 'mountain', 4],
  ['slinger-tracer', 2, 'jungle', 3],
  ['slinger-tracer', 3, 'jungle', 4],
  ['slinger-frost', 2, 'tundra', 4],
  ['slinger-hollow-point', 2, 'desert', 4],
];

const byKind = { starter: 0, new: 0, sidegrade: 0, 'rank-up': 0, discipline: 0 };
const seen = new Set<string>();
for (const lesson of kit.lessons) {
  byKind[lesson.kind] += 1;
  seen.add(lessonId(lesson));
  if (lesson.source.kind === 'zone') {
    assert(lesson.source.level === LESSON_ZONE_LEVEL, `${lessonId(lesson)}: zone level is the default`);
  }
}
assert(byKind.starter === 1, `1 starter lesson, found ${byKind.starter}`);
assert(byKind.new === 14, `14 new lessons, found ${byKind.new}`);
assert(byKind.sidegrade === 3, `3 sidegrade lessons, found ${byKind.sidegrade}`);
assert(byKind['rank-up'] === 9, `9 rank-up lessons, found ${byKind['rank-up']}`);
assert(byKind.discipline === 0, 'the disciplines bring no piece');
assert(kit.lessons.length === 27, `27 lessons, found ${kit.lessons.length}`);
assert(kit.lessons[0]?.pieceId === 'slinger-plain-clip' && kit.lessons[0].source.kind === 'starter', 'the plain clip is the starter');

for (const [pieceId, biome, tier, kind] of ZONE_LESSONS) {
  const lesson = must(
    kit.lessons.find((entry) => entry.pieceId === pieceId && entry.rank === 1),
    `no rank-1 lesson for ${pieceId}`,
  );
  assert(lesson.kind === kind, `${pieceId}: kind ${lesson.kind}, expected ${kind}`);
  assert(
    lesson.source.kind === 'zone' && lesson.source.biome === biome && lesson.source.tier === tier,
    `${pieceId}: taught by ${biome} T${tier}`,
  );
}

const T1_BIOMES = ['plains', 'forest', 'swamp', 'mountain', 'cave'];
for (const biome of T1_BIOMES) {
  const lessons = kit.lessons.filter(
    (entry) => entry.source.kind === 'zone' && entry.source.biome === biome && entry.source.tier === 1,
  );
  assert(lessons.length === 1, `${biome}: one T1 zone lesson, found ${lessons.length}`);
}

for (const [pieceId, rank, biome, tier] of RANK_UP_LESSONS) {
  const lesson = must(
    kit.lessons.find((entry) => entry.pieceId === pieceId && entry.rank === rank),
    `no rank-up ${pieceId} ${rank}`,
  );
  assert(lesson.kind === 'rank-up', `${pieceId} rank ${rank}: kind ${lesson.kind}`);
  assert(
    lesson.source.kind === 'zone' && lesson.source.biome === biome && lesson.source.tier === tier,
    `${pieceId} rank ${rank}: taught by ${biome} T${tier}`,
  );
}
assert(seen.size === kit.lessons.length, 'a lesson is taught twice');
assert(seen.size === 1 + ZONE_LESSONS.length + RANK_UP_LESSONS.length, 'a lesson is not in the bible tables');

const TROPHIES: ReadonlyArray<{ id: string; name: string; bossTiers: readonly number[] }> = [
  { id: 'slinger-relic-plains', name: 'Stampede Round', bossTiers: [2] },
  { id: 'slinger-relic-forest', name: 'Twin Round', bossTiers: [2] },
  { id: 'slinger-relic-swamp', name: 'Rot Round', bossTiers: [2, 3] },
  { id: 'slinger-relic-mountain', name: 'Quake Round', bossTiers: [2, 3, 4] },
  { id: 'slinger-relic-cave', name: 'Splinter Round', bossTiers: [2, 3] },
  { id: 'slinger-relic-jungle', name: "Hunter's Round", bossTiers: [3, 4] },
  { id: 'slinger-relic-desert', name: 'Bounty Round', bossTiers: [3, 4] },
  { id: 'slinger-relic-tundra', name: 'Rime Round', bossTiers: [4] },
  { id: 'slinger-relic-volcanic', name: 'Cinder Round', bossTiers: [4] },
  { id: 'slinger-relic-graveyard', name: 'Toll Round', bossTiers: [] },
  { id: 'slinger-relic-trench', name: 'Harpoon Round', bossTiers: [] },
];

assert(kit.trophies.length === 11, `11 trophies, found ${kit.trophies.length}`);
for (const expected of TROPHIES) {
  const found = kit.trophies.find((entry) => entry.id === expected.id);
  if (!found) throw new Error(`missing trophy ${expected.id}`);
  assert(found.name === expected.name, `${expected.id}: name ${found.name}`);
  assert(found.kind === 'round', `${expected.id}: kind ${found.kind}`);
  const t1Round = ['slinger-relic-plains', 'slinger-relic-forest', 'slinger-relic-swamp', 'slinger-relic-mountain', 'slinger-relic-cave', 'slinger-relic-jungle', 'slinger-relic-desert', 'slinger-relic-tundra', 'slinger-relic-volcanic'].includes(expected.id);
  assert(t1Round ? Object.values(found.params).every(Number.isFinite) : Object.keys(found.params).length === 0, `${expected.id}: params empty until their runtime`);
  assert(
    found.ranks.map((rank) => rank.bossTier).join() === expected.bossTiers.join(),
    `${expected.id}: boss tiers ${found.ranks.map((rank) => rank.bossTier).join()}`,
  );
}

const SPEC_BY_DISCIPLINE: Record<string, readonly string[]> = {
  'slinger-gunslinger': ['slinger-fan-the-hammer', 'slinger-crossfire', 'slinger-gun-kata'],
  'slinger-siege': ['slinger-deathmark', 'slinger-entrenched', 'slinger-rolling-fire'],
  'slinger-trickshot': ['slinger-ricochet', 'slinger-pierce', 'slinger-deadeye'],
};

const LEAF_BY_DISCIPLINE: Record<string, Record<string, string>> = {
  'slinger-gunslinger': {
    'caught-reloading': 'slinger-light-hands',
    'they-reach-you': 'slinger-slip-away',
    'wrong-clip': 'slinger-quick-swap',
  },
  'slinger-siege': {
    'caught-reloading': 'slinger-bunker',
    'they-reach-you': 'slinger-stakes',
    'wrong-clip': 'slinger-fresh-powder',
  },
  'slinger-trickshot': {
    'caught-reloading': 'slinger-cool-reload',
    'they-reach-you': 'slinger-steady-nerve',
    'wrong-clip': 'slinger-improvise',
  },
};

assert(kit.disciplines.length === 3, `3 disciplines, found ${kit.disciplines.length}`);
assert(kit.specializations.length === 9, `9 specializations, found ${kit.specializations.length}`);
assert(kit.leaves.length === 9, `9 leaves, found ${kit.leaves.length}`);
for (const entry of kit.disciplines) {
  assert(entry.pieceId === undefined, `${entry.id}: a discipline piece was not in the bible`);
  assert(entry.fantasy.trim().length > 0 && entry.text.trim().length > 0, `${entry.id}: needs fantasy and text`);
  assert(Object.keys(entry.params).length === 0, `${entry.id}: params must be empty`);
  const specs = kit.specializations.filter((spec) => spec.disciplineId === entry.id).map((spec) => spec.id);
  assert(specs.join() === SPEC_BY_DISCIPLINE[entry.id]?.join(), `${entry.id}: specs ${specs.join()}`);
  const leaves = LEAF_BY_DISCIPLINE[entry.id] ?? {};
  for (const [column, id] of Object.entries(leaves)) {
    const found = must(
      kit.leaves.find((leaf) => leaf.disciplineId === entry.id && leaf.column === column),
      `${entry.id} ${column}: missing leaf`,
    );
    assert(found.id === id && found.tier === 4, `${entry.id} ${column}: leaf ${found.id}`);
  }
}

const FIGURE = /\d|%/;
const SYSTEM_WORD = /\b(stacks|proc|dps|budget|global mastery|trigger)\b/i;
function plainText(text: string, where: string): void {
  assert(!FIGURE.test(text), `${where}: text has a figure`);
  assert(!SYSTEM_WORD.test(text), `${where}: text has a system word`);
}
for (const entry of kit.pieces) {
  plainText(entry.text, entry.id);
  for (const rank of entry.ranks ?? []) plainText(rank.text, `${entry.id} rank ${rank.rank}`);
}
for (const entry of kit.trophies) {
  plainText(entry.text, entry.id);
  for (const rank of entry.ranks) plainText(rank.text, `${entry.id} rank ${rank.rank}`);
}
for (const entry of [...kit.disciplines, ...kit.specializations, ...kit.leaves]) {
  plainText(entry.text, entry.id);
}

console.log('slingerKit.test.ts: ok');
