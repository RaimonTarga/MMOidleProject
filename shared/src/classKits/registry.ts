/**
 * The six class kits and the derivations every system reads from them.
 *
 * What a character has learned and which trophies it holds are not stored: they follow from
 * state the server already persists (biome levels, boss clears, the discipline pick), so they
 * can never drift from it. `learnedLessons`, `pieceRanks` and `trophyRanks` are those
 * derivations; the server diffs them to announce what is new.
 */
import {
  BIOME_FINAL_TIER_BY_GROUP,
  BIOME_LEVELS_PER_TIER,
  BIOME_START_TIER_BY_GROUP,
} from '../config/gameConfig';
import { readBudget, type BudgetReading } from './budget';
import { APPRENTICE_KIT } from './apprentice/kit';
import { CONDUIT_KIT } from './conduit/kit';
import { SLINGER_KIT } from './slinger/kit';
import { SPIRIT_KIT } from './spirit/kit';
import { SQUIRE_KIT } from './squire/kit';
import { STRIKER_KIT } from './striker/kit';
import type {
  ClassArchetype,
  ClassKit,
  KitBiome,
  LessonDef,
  LessonSource,
  PieceDef,
  TrophyDef,
} from './types';

export const CLASS_KITS: Readonly<Record<ClassArchetype, ClassKit>> = {
  cadence: STRIKER_KIT,
  cooldown: SQUIRE_KIT,
  dot: APPRENTICE_KIT,
  reload: SLINGER_KIT,
  energy: SPIRIT_KIT,
  summoner: CONDUIT_KIT,
};

export const CLASS_ARCHETYPES: readonly ClassArchetype[] = Object.keys(CLASS_KITS) as ClassArchetype[];

export function classKitFor(archetype: ClassArchetype): ClassKit {
  return CLASS_KITS[archetype];
}

/** The piece id for rank 1, `<pieceId>-<rank>` above. */
export function lessonId(lesson: LessonDef): string {
  return lesson.rank === 1 ? lesson.pieceId : `${lesson.pieceId}-${lesson.rank}`;
}

/** The biome's first and last tier, from the authored node registry. */
export function biomeTierSpan(biome: KitBiome): { first: number; last: number } {
  const first = BIOME_START_TIER_BY_GROUP[biome] ?? 1;
  return { first, last: BIOME_FINAL_TIER_BY_GROUP[biome] ?? first };
}

/** A zone lesson's biome level as the game counts it (the biome's levels run across tiers). */
export function absoluteZoneLevel(source: Extract<LessonSource, { kind: 'zone' }>): number {
  return (source.tier - biomeTierSpan(source.biome).first) * BIOME_LEVELS_PER_TIER + source.level;
}

/** The boss-clear key for a lineage's boss at a tier (same shape as `bossClearKey`). */
export function lineageBossKey(biome: KitBiome, tier: number): string {
  return `${biome}:${tier}`;
}

const PIECES_BY_ID = new Map<string, PieceDef>();
const TROPHIES_BY_ID = new Map<string, TrophyDef>();
for (const kit of Object.values(CLASS_KITS)) {
  for (const piece of kit.pieces) PIECES_BY_ID.set(piece.id, piece);
  for (const trophy of kit.trophies) TROPHIES_BY_ID.set(trophy.id, trophy);
}

export function findPiece(id: string): PieceDef | undefined {
  return PIECES_BY_ID.get(id);
}

export function findTrophy(id: string): TrophyDef | undefined {
  return TROPHIES_BY_ID.get(id);
}

/** Everything the derivations read; all of it is persisted already. */
export interface ClassKitProgress {
  biomeLevel: Readonly<Record<string, number>>;
  bossesCleared: readonly string[];
  /** The T2 pick, once made. */
  disciplineId: string | null;
}

export function lessonReached(lesson: LessonDef, progress: ClassKitProgress): boolean {
  const { source } = lesson;
  switch (source.kind) {
    case 'starter':
      return true;
    case 'discipline':
      return source.disciplineId === undefined
        ? progress.disciplineId !== null
        : progress.disciplineId === source.disciplineId;
    case 'zone':
      return (progress.biomeLevel[source.biome] ?? 0) >= absoluteZoneLevel(source);
  }
}

/** Every lesson the character has reached, in the kit's order. */
export function learnedLessons(archetype: ClassArchetype, progress: ClassKitProgress): LessonDef[] {
  return classKitFor(archetype).lessons.filter((lesson) => lessonReached(lesson, progress));
}

/** The lessons reached in `after` but not in `before`: what to announce. */
export function newLessons(
  archetype: ClassArchetype,
  before: ClassKitProgress,
  after: ClassKitProgress,
): LessonDef[] {
  return classKitFor(archetype).lessons.filter(
    (lesson) => lessonReached(lesson, after) && !lessonReached(lesson, before),
  );
}

/** Each owned piece's highest learned rank. */
export function pieceRanks(archetype: ClassArchetype, progress: ClassKitProgress): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const lesson of learnedLessons(archetype, progress)) {
    ranks.set(lesson.pieceId, Math.max(ranks.get(lesson.pieceId) ?? 0, lesson.rank));
  }
  return ranks;
}

/**
 * Each owned trophy's rank: the highest rank whose lineage boss has been cleared. A character
 * who first meets a lineage one tier up gets the trophy at that tier's rank.
 */
export function trophyRanks(archetype: ClassArchetype, bossesCleared: readonly string[]): Map<string, number> {
  const cleared = new Set(bossesCleared);
  const ranks = new Map<string, number>();
  for (const trophy of classKitFor(archetype).trophies) {
    const { first } = biomeTierSpan(trophy.lineage);
    let rank = cleared.has(lineageBossKey(trophy.lineage, first)) ? 1 : 0;
    for (const step of trophy.ranks) {
      if (cleared.has(lineageBossKey(trophy.lineage, step.bossTier))) rank = Math.max(rank, step.rank);
    }
    if (rank > 0) ranks.set(trophy.id, rank);
  }
  return ranks;
}

/** The class's room at this Global Mastery, in its own words. */
export function classBudget(archetype: ClassArchetype, globalMasteryValue: number): BudgetReading {
  return readBudget(classKitFor(archetype).budget, globalMasteryValue);
}
