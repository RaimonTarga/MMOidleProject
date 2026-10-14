/**
 * Class kits: the invariants every kit must keep, whoever enters its data (build plan §3.1).
 * Structure only, never balance: every number in a kit is a placeholder.
 */
import { ITEM_DATABASE } from '../itemDatabase';
import { RECIPE_DATABASE } from '../recipeDatabase';
import { SKILL_TREE } from '../skillTree';
import { bossClearKey } from '../systems/biomeProgress';
import {
  absoluteZoneLevel,
  biomeTierSpan,
  CLASS_ARCHETYPES,
  CLASS_KITS,
  classBudget,
  findPiece,
  learnedLessons,
  lessonId,
  lineageBossKey,
  newLessons,
  pieceRanks,
  trophyRanks,
  type ClassKitProgress,
} from './registry';
import { pieceTierScale } from './scaling';
import { CLASS_NAME_BY_ARCHETYPE, KIT_BIOMES, type KitBiome } from './types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const problems: string[] = [];
const allIds = new Map<string, string>();

function claim(id: string, where: string): void {
  if (!KEBAB.test(id)) problems.push(`${where}: id "${id}" is not kebab-case`);
  const previous = allIds.get(id);
  if (previous) problems.push(`${where}: id "${id}" is also used by ${previous}`);
  allIds.set(id, where);
  if (SKILL_TREE.has(id) || RECIPE_DATABASE.has(id) || ITEM_DATABASE.has(id)) {
    problems.push(`${where}: id "${id}" reuses a legacy skill, recipe or item id`);
  }
}

for (const archetype of CLASS_ARCHETYPES) {
  const kit = CLASS_KITS[archetype];
  const prefix = `${CLASS_NAME_BY_ARCHETYPE[archetype]}-`;
  const where = kit.displayName;
  assert(kit.classId === archetype, `${where}: classId ${kit.classId} filed under ${archetype}`);
  assert(kit.className === CLASS_NAME_BY_ARCHETYPE[archetype], `${where}: className mismatch`);

  // Every content id is the class's own, unique across all six kits, and new.
  const owned = [
    ...kit.pieces.map((p) => ({ id: p.id, classId: p.classId, what: 'piece' })),
    ...kit.trophies.map((t) => ({ id: t.id, classId: t.classId, what: 'trophy' })),
    ...kit.disciplines.map((d) => ({ id: d.id, classId: d.classId, what: 'discipline' })),
    ...kit.specializations.map((s) => ({ id: s.id, classId: s.classId, what: 'specialization' })),
    ...kit.leaves.map((l) => ({ id: l.id, classId: l.classId, what: 'leaf' })),
  ];
  for (const entry of owned) {
    claim(entry.id, `${where} ${entry.what}`);
    if (!entry.id.startsWith(prefix)) problems.push(`${where} ${entry.what} ${entry.id}: must start with "${prefix}"`);
    if (entry.classId !== archetype) problems.push(`${where} ${entry.what} ${entry.id}: classId is ${entry.classId}`);
  }

  // Pieces: text present; sidegrades and ranks well formed.
  const pieceIds = new Set(kit.pieces.map((p) => p.id));
  for (const piece of kit.pieces) {
    if (!piece.name.trim() || !piece.text.trim()) problems.push(`${where} ${piece.id}: needs a name and text`);
    if (piece.sidegradeOf && !pieceIds.has(piece.sidegradeOf)) {
      problems.push(`${where} ${piece.id}: sidegradeOf ${piece.sidegradeOf} is not in the kit`);
    }
    (piece.ranks ?? []).forEach((rank, i) => {
      if (rank.rank !== i + 2) problems.push(`${where} ${piece.id}: ranks must run 2, 3, ... in order`);
      if (!rank.text.trim()) problems.push(`${where} ${piece.id} rank ${rank.rank}: needs text`);
    });
  }

  // Lessons: each piece is taught once at rank 1 and each of its ranks once, from a real place.
  const disciplineIds = new Set(kit.disciplines.map((d) => d.id));
  const taught = new Map<string, number>();
  for (const lesson of kit.lessons) {
    const id = lessonId(lesson);
    taught.set(id, (taught.get(id) ?? 0) + 1);
    const piece = kit.pieces.find((p) => p.id === lesson.pieceId);
    if (!piece) { problems.push(`${where} lesson ${id}: no piece ${lesson.pieceId}`); continue; }
    if (lesson.rank === 1) {
      const expected = piece.sidegradeOf ? 'sidegrade' : undefined;
      if (lesson.kind === 'rank-up') problems.push(`${where} lesson ${id}: rank 1 cannot be a rank-up`);
      if (expected && lesson.source.kind === 'zone' && lesson.kind !== expected) {
        problems.push(`${where} lesson ${id}: a sidegrade piece is taught by a 'sidegrade' lesson`);
      }
      if (!piece.sidegradeOf && lesson.kind === 'sidegrade') {
        problems.push(`${where} lesson ${id}: a 'sidegrade' lesson needs the piece's sidegradeOf`);
      }
    } else {
      if (lesson.kind !== 'rank-up') problems.push(`${where} lesson ${id}: ranks above 1 are rank-ups`);
      if (!(piece.ranks ?? []).some((r) => r.rank === lesson.rank)) {
        problems.push(`${where} lesson ${id}: ${piece.id} has no rank ${lesson.rank}`);
      }
    }
    const { source } = lesson;
    if (source.kind === 'zone') {
      const span = biomeTierSpan(source.biome);
      if (source.tier < span.first || source.tier > span.last) {
        problems.push(`${where} lesson ${id}: ${source.biome} has no tier ${source.tier} (it spans T${span.first}–T${span.last})`);
      }
      if (source.level < 1 || source.level > 6) problems.push(`${where} lesson ${id}: level must be 1–6 within the tier`);
    }
    if (source.kind === 'discipline' && source.disciplineId !== undefined && !disciplineIds.has(source.disciplineId)) {
      problems.push(`${where} lesson ${id}: no discipline ${source.disciplineId}`);
    }
  }
  for (const [id, count] of taught) if (count > 1) problems.push(`${where} lesson ${id}: taught ${count} times`);
  for (const piece of kit.pieces) {
    if (!taught.has(piece.id)) problems.push(`${where} ${piece.id}: no lesson teaches it`);
    for (const rank of piece.ranks ?? []) {
      if (!taught.has(`${piece.id}-${rank.rank}`)) problems.push(`${where} ${piece.id} rank ${rank.rank}: no lesson teaches it`);
    }
  }
  if (!kit.lessons.some((l) => l.source.kind === 'starter')) problems.push(`${where}: needs a starter piece`);

  // Trophies: one per lineage, ranks follow the lineage's tiers.
  const lineages = new Set<KitBiome>();
  for (const trophy of kit.trophies) {
    if (!KIT_BIOMES.includes(trophy.lineage)) problems.push(`${where} ${trophy.id}: unknown lineage ${trophy.lineage}`);
    if (lineages.has(trophy.lineage)) problems.push(`${where} ${trophy.id}: a second trophy for ${trophy.lineage}`);
    lineages.add(trophy.lineage);
    if (trophy.id !== `${prefix}relic-${trophy.lineage}`) problems.push(`${where} ${trophy.id}: must be ${prefix}relic-${trophy.lineage}`);
    const span = biomeTierSpan(trophy.lineage);
    trophy.ranks.forEach((rank, i) => {
      if (rank.rank !== i + 2) problems.push(`${where} ${trophy.id}: ranks must run 2, 3, ... in order`);
      if (rank.bossTier !== span.first + rank.rank - 1) {
        problems.push(`${where} ${trophy.id} rank ${rank.rank}: granted at T${span.first + rank.rank - 1}, not T${rank.bossTier}`);
      }
      if (rank.bossTier > span.last) problems.push(`${where} ${trophy.id} rank ${rank.rank}: ${trophy.lineage} has no T${rank.bossTier} boss`);
    });
  }

  // The tree's content hangs off the class's own disciplines.
  for (const spec of kit.specializations) {
    if (!disciplineIds.has(spec.disciplineId)) problems.push(`${where} ${spec.id}: no discipline ${spec.disciplineId}`);
  }
  for (const leaf of kit.leaves) {
    if (!disciplineIds.has(leaf.disciplineId)) problems.push(`${where} ${leaf.id}: no discipline ${leaf.disciplineId}`);
    if (leaf.tier < 4) problems.push(`${where} ${leaf.id}: leaves start at T4`);
  }
  if (kit.disciplines.length > 0 && kit.disciplines.length !== 3) problems.push(`${where}: three disciplines, not ${kit.disciplines.length}`);

  // The budget starts at Mastery 0 and never shrinks.
  const steps = kit.budget.steps;
  if (steps[0]?.mastery !== 0) problems.push(`${where}: the budget's first step is at Mastery 0`);
  for (let i = 1; i < steps.length; i += 1) {
    if (steps[i].mastery <= steps[i - 1].mastery) problems.push(`${where}: budget steps must ascend by mastery`);
    if (steps[i].value < steps[i - 1].value) problems.push(`${where}: the budget never shrinks`);
  }
}

assert(problems.length === 0, `class kit problems:\n  ${problems.join('\n  ')}`);

// ── The derivations ──────────────────────────────────────────────────────────

assert(lineageBossKey('plains', 2) === bossClearKey('plains', 2), 'lineage keys must match boss-clear keys');
assert(absoluteZoneLevel({ kind: 'zone', biome: 'plains', tier: 2, level: 2 }) === 8, 'Plains T2 level 2 is Plains level 8');
assert(absoluteZoneLevel({ kind: 'zone', biome: 'jungle', tier: 2, level: 2 }) === 2, 'the Jungle starts at T2: its T2 level 2 is level 2');

const fresh: ClassKitProgress = { biomeLevel: {}, bossesCleared: [], disciplineId: null };
const plains2: ClassKitProgress = { biomeLevel: { plains: 2 }, bossesCleared: [], disciplineId: null };
assert(learnedLessons('cadence', fresh).map(lessonId).join() === 'striker-finisher', 'a fresh Striker knows only the finisher');
assert(learnedLessons('cadence', plains2).some((l) => l.pieceId === 'striker-sweep'), 'Plains level 2 teaches Sweep');
assert(newLessons('cadence', fresh, plains2).map(lessonId).join() === 'striker-sweep', 'Sweep is the one new lesson');
const swamp8 = pieceRanks('cadence', { biomeLevel: { swamp: 8 }, bossesCleared: [], disciplineId: null });
assert(swamp8.get('striker-rend') === 2, 'Swamp level 8 (T2) ranks Rend up to 2');
assert(findPiece('striker-rend')?.classId === 'cadence', 'findPiece finds across kits');

assert(trophyRanks('cadence', []).size === 0, 'no boss, no trophy');
assert(trophyRanks('cadence', ['plains:1']).get('striker-relic-plains') === 1, 'the T1 Plains boss gives Wide Arc');
assert(trophyRanks('cadence', ['plains:1', 'plains:2']).get('striker-relic-plains') === 2, 'the T2 Plains boss ranks it up');
assert(trophyRanks('cadence', ['mountain:3']).get('striker-relic-mountain') === 3, 'first met at T3: rank 3');

const conduitStart = classBudget('summoner', 0);
assert(conduitStart.value === 4 && conduitStart.text === 'Command 4, next at Mastery 15', `Conduit at Mastery 0: ${conduitStart.text}`);
assert(classBudget('summoner', 30).value === 6, 'Command 6 at the end of T1');
assert(classBudget('summoner', 72).value === 9, 'Command 9 at the end of T2');
assert(classBudget('cadence', 15).value === 2, 'a second technique slot at Mastery 15');
assert(classBudget('reload', 86).text === 'Rack 4, 1 double load, next at Mastery 100', `Slinger at 86: ${classBudget('reload', 86).text}`);
assert(classBudget('reload', 156).nextAt === null, 'the last step has no next');

assert(pieceTierScale(0) === 1 && pieceTierScale(1) === 1, 'the Clearing and T1 scale at 1');
assert(pieceTierScale(4) === 10 && pieceTierScale(7) === 10, 'tiers above the authored curve hold its top');

const counts = CLASS_ARCHETYPES.map((a) => `${CLASS_NAME_BY_ARCHETYPE[a]} ${CLASS_KITS[a].pieces.length}p/${CLASS_KITS[a].trophies.length}t`).join(', ');
console.log(`classKits.test.ts: ok (${counts})`);
