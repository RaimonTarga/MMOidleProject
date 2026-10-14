/**
 * The Striker's kit against bible §12's totals (§12.4, §12.5–12.7, §12.16). Structure only:
 * every number in the kit is a placeholder, so nothing here reads `params` but to check
 * they are still empty.
 */
import { biomeTierSpan, lessonId } from '../registry';
import { KIT_BIOMES, type LessonDef } from '../types';
import { STRIKER_KIT, type StrikerFamily, type StrikerPiece } from './kit';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
}

function sameSet(actual: readonly string[], expected: readonly string[], what: string): void {
  const a = [...actual].sort().join(', ');
  const e = [...expected].sort().join(', ');
  assert(a === e, `${what}: expected [${e}], got [${a}]`);
}

const kit = STRIKER_KIT;
const pieceById = new Map(kit.pieces.map((p) => [p.id, p] as const));

// ── Pieces: the finisher plus 25 techniques (19 new, 6 sidegrades) ──
assert(kit.pieces.length === 26, `26 pieces, got ${kit.pieces.length}`);
const finishers = kit.pieces.filter((p) => p.finisher);
assert(finishers.length === 1 && finishers[0].id === 'striker-finisher', 'one plain finisher: striker-finisher');
const techniques = kit.pieces.filter((p) => !p.finisher);
assert(techniques.length === 25, `25 techniques, got ${techniques.length}`);
assert(techniques.filter((p) => p.sidegradeOf).length === 6, 'six sidegrades');

const families = countBy(techniques, (p) => p.family);
const expectedFamilies: Record<StrikerFamily, number> = { 'damage': 11, 'attack-setup': 7, 'finisher-setup': 7 };
for (const [family, count] of Object.entries(expectedFamilies)) {
  assert(families[family] === count, `${family}: ${count} by T4, got ${families[family] ?? 0}`);
}

// Every family grows each tier: by the end of T2, damage 4, attack setups 4, finisher setups 3.
function firstTier(piece: StrikerPiece): number {
  const lesson = kit.lessons.find((l) => l.pieceId === piece.id && l.rank === 1);
  assert(lesson !== undefined, `${piece.id}: no rank-1 lesson`);
  const source = (lesson as LessonDef).source;
  return source.kind === 'zone' ? source.tier : 0;
}
const byT2 = countBy(techniques.filter((p) => firstTier(p) <= 2), (p) => p.family);
assert(byT2['damage'] === 4, `damage 4 by T2, got ${byT2['damage'] ?? 0}`);
assert(byT2['attack-setup'] === 4, `attack setups 4 by T2, got ${byT2['attack-setup'] ?? 0}`);
assert(byT2['finisher-setup'] === 3, `finisher setups and control 3 by T2, got ${byT2['finisher-setup'] ?? 0}`);

sameSet(
  kit.pieces.filter((p) => p.control).map((p) => p.id),
  ['striker-hamstring', 'striker-concuss', 'striker-pin', 'striker-upheaval', 'striker-avalanche', 'striker-frostbind'],
  'control techniques',
);
assert(pieceById.get('striker-hamstring')?.family === 'attack-setup', 'Hamstring is an attack setup that is also control');
for (const piece of kit.pieces.filter((p) => p.control && p.id !== 'striker-hamstring')) {
  assert(piece.family === 'finisher-setup', `${piece.id}: control is a finisher setup`);
}
sameSet(
  kit.pieces.filter((p) => p.cast === 'opener').map((p) => p.id),
  ['striker-focus', 'striker-charge', 'striker-shadowstep', 'striker-overheat'],
  'opener casts',
);
sameSet(
  kit.pieces.filter((p) => p.cast === 'windup').map((p) => p.id),
  ['striker-coil', 'striker-earthsplitter', 'striker-avalanche', 'striker-magma-breaker'],
  'wind-up casts',
);

// ── Lessons: the starter, 19 new, 6 sidegrades, 1 rank-up; one per living biome per tier ──
const kinds = countBy(kit.lessons, (l) => l.kind);
assert(kinds['starter'] === 1, `one starter lesson, got ${kinds['starter'] ?? 0}`);
assert(kinds['new'] === 19, `19 new techniques, got ${kinds['new'] ?? 0}`);
assert(kinds['sidegrade'] === 6, `6 sidegrades, got ${kinds['sidegrade'] ?? 0}`);
assert(kinds['rank-up'] === 1, `one rank-up, got ${kinds['rank-up'] ?? 0}`);
assert((kinds['discipline'] ?? 0) === 0, 'the Striker\'s disciplines bring a resource, not pieces');
assert(kit.lessons.some((l) => l.kind === 'rank-up' && lessonId(l) === 'striker-rend-2'), 'the rank-up is Rend II');

const zoneLessons = kit.lessons.flatMap((l) => (l.source.kind === 'zone' ? [l.source] : []));
for (const tier of [1, 2, 3, 4]) {
  const taught = zoneLessons.filter((s) => s.tier === tier).map((s) => s.biome);
  const living = KIT_BIOMES
    .filter((biome) => { const span = biomeTierSpan(biome); return span.first <= tier && tier <= span.last; });
  sameSet(taught, living, `T${tier}: one lesson per biome`);
}
sameSet(
  zoneLessons.filter((s) => s.tier === 1).map((s) => s.biome),
  ['plains', 'forest', 'swamp', 'mountain', 'cave'],
  'one T1 zone lesson per T1 biome',
);

// ── Trophies: eleven, one per lineage, ranked by each of the lineage's later bosses ──
assert(kit.trophies.length === 11, `11 trophies, got ${kit.trophies.length}`);
sameSet(
  kit.trophies.filter((t) => t.kind === 'spark').map((t) => t.name),
  ['Wide Arc', 'Double Slash', 'Hoarfrost', 'Grave Toll'],
  'spark trophies',
);
assert(kit.trophies.filter((t) => t.kind === 'weight').length === 7, 'seven weight trophies');
for (const trophy of kit.trophies) {
  const span = biomeTierSpan(trophy.lineage);
  assert(trophy.ranks.length === span.last - span.first, `${trophy.id}: a rank for every later ${trophy.lineage} boss`);
}

// ── The Passive Tree: 3 disciplines, 3 specializations and 3 T4 leaves each ──
sameSet(kit.disciplines.map((d) => d.id), ['striker-light', 'striker-balanced', 'striker-heavy'], 'disciplines');
assert(kit.specializations.length === 9, `9 specializations, got ${kit.specializations.length}`);
assert(kit.leaves.length === 9, `9 leaves, got ${kit.leaves.length}`);
for (const d of kit.disciplines) {
  assert(d.pieceId === undefined, `${d.id}: the Striker's disciplines unlock no piece`);
  assert(kit.specializations.filter((s) => s.disciplineId === d.id).length === 3, `${d.id}: three specializations`);
  const leaves = kit.leaves.filter((l) => l.disciplineId === d.id);
  assert(leaves.every((l) => l.tier === 4), `${d.id}: T4 leaves`);
  sameSet(leaves.map((l) => l.column), ['spike', 'swarm', 'slow-bleed'], `${d.id}: one leaf per T4 column`);
}

// ── Numbers come later: every params is empty ──
const allParams = [
  ...kit.pieces.flatMap((p) => [p.params, ...(p.ranks ?? []).map((r) => r.params ?? {})]),
  ...kit.trophies.flatMap((t) => [t.params, ...t.ranks.map((r) => r.params ?? {})]),
  ...kit.disciplines.map((d) => d.params),
  ...kit.specializations.map((s) => s.params),
  ...kit.leaves.map((l) => l.params),
];
assert(allParams.every((params) => Object.keys(params).length === 0), 'params stay empty until the class runtime');

console.log('strikerKit.test.ts: ok');
