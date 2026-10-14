/**
 * Conduit kit: the bible's totals for §7, pinned so a later edit can't drift them.
 * Structure only. Every number in the kit is a placeholder, and this file checks
 * counts, families, lessons and the brief's field table, never balance.
 */
import { LESSON_ZONE_LEVEL } from '../kitHelpers';
import { biomeTierSpan } from '../registry';
import type { KitBiome } from '../types';
import { CONDUIT_KIT, type ConduitPiece } from './kit';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const pieces = CONDUIT_KIT.pieces;
const lessons = CONDUIT_KIT.lessons;

function piece(id: string): ConduitPiece {
  const found = pieces.find((entry) => entry.id === id);
  assert(found !== undefined, `missing piece ${id}`);
  return found!;
}

function countFamily(family: ConduitPiece['family']): number {
  return pieces.filter((entry) => entry.family === family).length;
}

assert(pieces.length === 27, `27 pieces, got ${pieces.length}`);
assert(countFamily('generic') === 1, `the Thrall, got ${countFamily('generic')}`);
assert(countFamily('tank') === 6, `6 tanks, got ${countFamily('tank')}`);
assert(countFamily('damage') === 11, `11 damage, got ${countFamily('damage')}`);
assert(countFamily('support') === 9, `9 supports, got ${countFamily('support')}`);

const MULTI_COMMAND = [
  'conduit-cave-heavy',
  'conduit-bonecrusher',
  'conduit-warhorn',
  'conduit-obsidian-tortoise',
  'conduit-avalanche',
] as const;
assert(
  pieces.filter((entry) => entry.command >= 2).map((entry) => entry.id).sort().join()
    === [...MULTI_COMMAND].sort().join(),
  'five specialists at 2+ Command',
);
assert(piece('conduit-cave-heavy').command === 2, 'Cave Brute costs 2');
assert(piece('conduit-bonecrusher').command === 2, 'Bonecrusher costs 2');
assert(piece('conduit-warhorn').command === 2, 'Warhorn costs 2');
assert(piece('conduit-obsidian-tortoise').command === 2, 'Obsidian Tortoise costs 2');
assert(piece('conduit-avalanche').command === 3, 'Avalanche costs 3');
for (const entry of pieces) {
  if (!MULTI_COMMAND.includes(entry.id as (typeof MULTI_COMMAND)[number])) {
    assert(entry.command === 1, `${entry.id} costs 1`);
  }
}

const RANGED = [
  'conduit-swamp-spitter',
  'conduit-mountain-marksman',
  'conduit-rockhurler',
  'conduit-barkward',
  'conduit-bloomtender',
  'conduit-executioner',
  'conduit-sporecaller',
  'conduit-frostcaller',
  'conduit-icewarden',
  'conduit-dartcaller',
  'conduit-mirage',
  'conduit-gravecaller',
];
for (const entry of pieces) {
  const mode = RANGED.includes(entry.id) ? 'ranged' : 'melee';
  assert(entry.mode === mode, `${entry.id} is ${mode}, got ${entry.mode}`);
  if (entry.family === 'tank') assert(entry.row === 'front', `${entry.id} stands in front`);
  else if (entry.family === 'generic' || (entry.family === 'damage' && entry.mode === 'melee')) {
    assert(entry.row === 'middle', `${entry.id} stands in the middle`);
  } else {
    assert(entry.row === 'back', `${entry.id} stands at the back`);
  }
  assert(entry.sidegradeOf === undefined, `${entry.id} is not a sidegrade`);
  assert((entry.ranks ?? []).length === 0, `${entry.id} has no ranks`);
  assert(Object.keys(entry.params).length === 0, `${entry.id} params stay empty`);
}

/** piece id, biome, tier. T1's five, then seven a tier (§7.16). */
const ZONES: ReadonlyArray<readonly [string, KitBiome, number]> = [
  ['conduit-plains-tank', 'plains', 1],
  ['conduit-forest-bruiser', 'forest', 1],
  ['conduit-swamp-spitter', 'swamp', 1],
  ['conduit-mountain-marksman', 'mountain', 1],
  ['conduit-cave-heavy', 'cave', 1],
  ['conduit-ironhorn', 'plains', 2],
  ['conduit-barkward', 'forest', 2],
  ['conduit-rockhurler', 'mountain', 2],
  ['conduit-bog-leech', 'swamp', 2],
  ['conduit-bonecrusher', 'cave', 2],
  ['conduit-bloomtender', 'jungle', 2],
  ['conduit-executioner', 'desert', 2],
  ['conduit-warhorn', 'mountain', 3],
  ['conduit-burrower', 'cave', 3],
  ['conduit-sporecaller', 'swamp', 3],
  ['conduit-prowler', 'jungle', 3],
  ['conduit-carapace-guard', 'desert', 3],
  ['conduit-frostcaller', 'tundra', 3],
  ['conduit-cinderling', 'volcanic', 3],
  ['conduit-avalanche', 'mountain', 4],
  ['conduit-icewarden', 'tundra', 4],
  ['conduit-dartcaller', 'jungle', 4],
  ['conduit-mirage', 'desert', 4],
  ['conduit-obsidian-tortoise', 'volcanic', 4],
  ['conduit-gravecaller', 'graveyard', 4],
  ['conduit-abyssal-warden', 'trench', 4],
];
assert(ZONES.length === 26, '26 specialist lessons');

const byKind = (kind: string) => lessons.filter((lesson) => lesson.kind === kind);
assert(byKind('starter').length === 1 && byKind('starter')[0]?.pieceId === 'conduit-thrall', 'the Thrall is the starter');
assert(byKind('new').length === 26, `26 new lessons, got ${byKind('new').length}`);
assert(byKind('sidegrade').length === 0, 'variants are new summons, not sidegrades');
assert(byKind('rank-up').length === 0, 'no rank-ups');
assert(byKind('discipline').length === 0, 'disciplines bring rules, not pieces');
assert(lessons.length === 27, `27 lessons, got ${lessons.length}`);

for (const [id, biome, tier] of ZONES) {
  const lesson = lessons.find((entry) => entry.pieceId === id);
  assert(lesson !== undefined, `no lesson for ${id}`);
  assert(lesson!.kind === 'new', `${id} is a new lesson`);
  assert(lesson!.rank === 1, `${id} is taught at rank 1`);
  assert(lesson!.source.kind === 'zone', `${id} comes from a zone`);
  if (lesson!.source.kind === 'zone') {
    assert(lesson!.source.biome === biome && lesson!.source.tier === tier, `${id} is ${biome} T${tier}`);
    assert(lesson!.source.level === LESSON_ZONE_LEVEL, `${id} uses the default zone level`);
  }
}
for (const tier of [1, 2, 3, 4]) {
  const count = ZONES.filter((entry) => entry[2] === tier).length;
  assert(count === (tier === 1 ? 5 : 7), `T${tier} teaches ${tier === 1 ? 5 : 7}, got ${count}`);
}
for (const biome of ['plains', 'forest', 'swamp', 'mountain', 'cave'] as const) {
  const count = lessons.filter(
    (lesson) => lesson.source.kind === 'zone' && lesson.source.biome === biome && lesson.source.tier === 1,
  ).length;
  assert(count === 1, `${biome} teaches one T1 specialist, got ${count}`);
}

const T1_BODIES: Readonly<Record<string, string>> = {
  'conduit-plains-tank': 'conduit-summon-effigy',
  'conduit-forest-bruiser': 'conduit-summon-splinter',
  'conduit-swamp-spitter': 'conduit-summon-chorister',
  'conduit-mountain-marksman': 'conduit-summon-inquisitor',
  'conduit-cave-heavy': 'conduit-summon-idolwright',
};
for (const [id, body] of Object.entries(T1_BODIES)) {
  assert(piece(id).body === body, `${id} wears ${body}`);
}

assert(CONDUIT_KIT.trophies.length === 11, `11 Souls, got ${CONDUIT_KIT.trophies.length}`);
const SOUL_NAMES: Readonly<Record<string, string>> = {
  plains: 'Razortusk Soul',
  forest: 'Timberclaw Soul',
  swamp: 'Mire Behemoth Soul',
  mountain: 'Stoneplate Soul',
  cave: 'Dreadbore Soul',
  jungle: 'Dread-Gorger Soul',
  desert: 'Dune-Stalker Soul',
  tundra: 'Rime-Mammoth Soul',
  volcanic: 'Magma Salamander Soul',
  graveyard: 'Charnel-Crown Soul',
  trench: 'Elder Serpent Soul',
};
const SOUL_BODIES: Readonly<Record<string, string>> = {
  plains: 'conduit-summon-champion',
  forest: 'conduit-summon-consort',
  swamp: 'conduit-summon-ritualist',
  mountain: 'conduit-summon-covenanter-defense',
  cave: 'conduit-summon-marshal',
};
for (const trophy of CONDUIT_KIT.trophies) {
  assert(trophy.kind === 'soul', `${trophy.id} is a Soul`);
  assert(trophy.name === SOUL_NAMES[trophy.lineage], `${trophy.lineage} Soul is named ${trophy.name}`);
  assert(Object.keys(trophy.params).length === 0, `${trophy.id} params stay empty`);
  const span = biomeTierSpan(trophy.lineage);
  assert(trophy.ranks.length === span.last - span.first, `${trophy.id} has a rank per later tier`);
  for (const rank of trophy.ranks) {
    assert(rank.text === 'The Soul grows stronger.', `${trophy.id} rank ${rank.rank} is the placeholder`);
  }
  const named = SOUL_BODIES[trophy.lineage];
  if (named) assert(trophy.body === named, `${trophy.id} wears ${named}`);
}

assert(CONDUIT_KIT.disciplines.length === 3, '3 disciplines');
assert(
  CONDUIT_KIT.disciplines.map((entry) => entry.id).join() === 'conduit-swarm,conduit-pack,conduit-elite',
  'Swarm, Pack, Elite',
);
for (const entry of CONDUIT_KIT.disciplines) {
  assert(entry.pieceId === undefined, `${entry.id} unlocks no piece`);
  assert(Object.keys(entry.params).length === 0, `${entry.id} params stay empty`);
  assert(
    CONDUIT_KIT.specializations.filter((spec) => spec.disciplineId === entry.id).length === 3,
    `${entry.id} has 3 specializations`,
  );
  assert(
    CONDUIT_KIT.leaves.filter((leaf) => leaf.disciplineId === entry.id).length === 3,
    `${entry.id} has 3 leaves`,
  );
}
assert(CONDUIT_KIT.specializations.length === 9, '9 specializations');
assert(CONDUIT_KIT.leaves.length === 9, '9 leaves');
for (const column of ['die-well', 'come-back-well', 'survive']) {
  assert(
    CONDUIT_KIT.leaves.filter((leaf) => leaf.column === column).length === 3,
    `${column} has one leaf per discipline`,
  );
}
for (const entry of CONDUIT_KIT.specializations) {
  assert(Object.keys(entry.params).length === 0, `${entry.id} params stay empty`);
}
for (const entry of CONDUIT_KIT.leaves) {
  assert(entry.tier === 4, `${entry.id} is a T4 leaf`);
  assert(Object.keys(entry.params).length === 0, `${entry.id} params stay empty`);
}

console.log('conduitKit.test.ts: ok');
