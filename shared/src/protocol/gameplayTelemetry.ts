/** Gameplay-only analytics contract. Never put identity, transport or free-form input here. */
export type GameplayCohort = 'human' | 'test';
export type EncounterOutcome = 'victory' | 'death' | 'retreat' | 'disconnect' | 'interrupted';
export interface GameplayBuild {
  classId: string | null;
  frame: string | null;
  range: string | null;
  tier: number;
  level: number;
  biomeLevels: Array<{ biome: string; level: number }>;
  stats: { maxHp: number; attack: number; attackRange: number; attackCooldown: number; plating: number; damageReduction: number };
  skills: string[];
  equipment: Array<{ slot: string; itemId: string; upgrade: number }>;
  techniques: string[];
  guards: string[];
  stances: string[];
  defaultStance: string | null;
  rites: string[];
  runes: Array<{ conditionId: string; actionId: string; targetStanceId?: string; targetAbilityId?: string; waitOutMode?: "all" | "heat-managed" }>;
  auto: boolean;
  autoTraverse: boolean;
  priorityMode: string;
  acquireRadius: number;
  focusLeaderTarget: boolean;
  fleeWhenLow: boolean;
  fleeHpPct: number;
}
export interface GameplayDamage {
  at: number;
  sourceType: string | null;
  damageType: string;
  hpDamage: number;
}
/**
 * The three lineage-tree facts the Phase 1 playtest has to answer (progression
 * rework plan §1.5): time-to-first-card, swaps per session, and gates paid.
 *
 * They are their OWN payload kind rather than `decision` rows, because a
 * `decision` is dropped unless the projected build changed and `GameplayBuild`
 * projects no lineage state at all — so buying a payoff card, which changes no
 * projected stat, recorded nothing.
 */
export type LineageTelemetryEvent =
  | 'lineage.card-unlocked'
  | 'lineage.card-swapped'
  | 'lineage.gate-paid';

export type GameplayPayload =
  | { kind: 'session-start'; build: GameplayBuild }
  | { kind: 'session-end'; durationMs: number; reason: 'disconnect' | 'interrupted' }
  | { kind: 'exposure'; durationMs: number; combatMs: number }
  | { kind: 'decision'; action: string; choice: string | null; afterFailure: 'death' | 'retreat' | null; before: GameplayBuild; build: GameplayBuild; availableSkills: string[]; ownedItems: string[]; availableRecipes: string[]; knownAbilities: string[]; knownRunes: string[]; knownStances: string[]; knownRites: string[]; skillPoints: number }
  | { kind: 'encounter-start'; attemptId: string; bossType: string; build: GameplayBuild; partySize: number; bossHpFraction: number }
  | { kind: 'encounter-end'; attemptId: string; bossType: string; build: GameplayBuild; partySize: number; outcome: EncounterOutcome; previouslyCleared: boolean; durationMs: number; bossHpFraction: number; damageDealt: number; damageTaken: number }
  | { kind: 'death'; build: GameplayBuild; x: number; y: number; cause: string; ability: string | null; killerType: string | null; damage: number; statuses: Array<{ effectId: string; stacks: number }>; recentDamage: GameplayDamage[] }
  | { kind: 'progression'; milestone: string; value: number; sessionElapsedMs: number }
  | { kind: 'resource'; resource: string; earned: number; spent: number }
  /**
   * One accepted lineage-tree action. Lane and row are plain strings on purpose:
   * a telemetry row outlives the vocabulary it was written against, and a renamed
   * packet must not make a stored row un-typable.
   */
  | {
      kind: 'lineage';
      event: LineageTelemetryEvent;
      lineageId: string;
      /** The lane the card belongs to, or the lane a paid gate's form crowns. */
      lane: string | null;
      row: string | null;
      cardId: string | null;
      /** The card this swap displaced, so a swap is readable as a choice. */
      replacedCardId: string | null;
      /** `lineage.gate-paid` only: the form the gate bought. */
      formRecipeId: string | null;
      essenceSpent: number;
      shardsSpent: number;
      capstonesSpent: number;
      /** Cards owned in this lineage AFTER the action. */
      ownedCards: number;
      /** True on the session's first card purchase — time-to-first-card. */
      firstOfSession: boolean;
      sessionElapsedMs: number;
    };
export interface GameplayEvent {
  id: string;
  schemaVersion: 1;
  ts: number;
  gameVersion: string;
  characterId: string;
  sessionId: string;
  sequence: number;
  cohort: GameplayCohort;
  nodeId: string;
  classId: string;
  tier: number;
  payload: GameplayPayload;
}
export interface GameplayQuery { days?: number; gameVersion?: string; cohort?: GameplayCohort }
export interface GameplayMetric {
  day: string;
  gameVersion: string;
  cohort: GameplayCohort;
  nodeId: string;
  classId: string;
  tier: number;
  metric: string;
  dimension: string;
  count: number;
  value: number;
}
export interface GameplayWriterHealth {
  queued: number;
  inserted: number;
  failedBatches: number;
  dropped: number;
  lastSuccessAt: number | null;
}
export interface GameplaySnapshot {
  generatedAt: number;
  days: number;
  cohort: GameplayCohort;
  gameVersion: string | null;
  versions: string[];
  metrics: GameplayMetric[];
  recent: GameplayEvent[];
  writer: GameplayWriterHealth;
  firstClears: Array<{ bossType: string; classId: string; tier: number; characters: number; meanAttempts: number }>;
}
