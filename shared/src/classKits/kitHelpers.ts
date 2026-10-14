/**
 * Small builders for authoring class kits, so every kit file reads the same way.
 */
import type { KitBiome, LessonDef, LessonSource } from './types';

/**
 * The level within a tier's six-level biome segment where a zone teaches its lesson.
 * STAND-IN: the second level, which lands the first T1 lesson around minute 6 of a guided
 * run ("the Plains teaches ... around minute 6", bible §7.4, §8.4, §9.4, §10.4, §11.4, §12.4)
 * and always before the zone's boss. Lessons are learned automatically and for free when the
 * level is reached (build plan question Q1).
 */
export const LESSON_ZONE_LEVEL = 2;

export const STARTER: LessonSource = { kind: 'starter' };

export function zone(biome: KitBiome, tier: number, level: number = LESSON_ZONE_LEVEL): LessonSource {
  return { kind: 'zone', biome, tier, level };
}

/** Learned with that discipline's pick; with no id, with any discipline's pick. */
export function fromDiscipline(disciplineId?: string): LessonSource {
  return disciplineId === undefined ? { kind: 'discipline' } : { kind: 'discipline', disciplineId };
}

/** Rank 1 of a piece: from the starter kit, a zone (new or sidegrade) or the discipline. */
export function learn(
  pieceId: string,
  source: LessonSource,
  kind: 'new' | 'sidegrade' = 'new',
): LessonDef {
  const resolved = source.kind === 'starter' ? 'starter' : source.kind === 'discipline' ? 'discipline' : kind;
  return { pieceId, rank: 1, kind: resolved, source };
}

/** A rank above 1 of a piece the class already learns. */
export function rankUp(pieceId: string, rank: number, source: LessonSource): LessonDef {
  return { pieceId, rank, kind: 'rank-up', source };
}
