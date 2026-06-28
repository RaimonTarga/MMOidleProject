import type { Vec2 } from "../systems/spatial";
import type { MonsterPatrolRoute } from "../components/targeting/controlsMonster";

export type GauntletStatus =
  | "idle"
  | "active"
  | "bossAwakening"
  | "boss"
  | "cooldown";

export interface DungeonAltarDef extends Vec2 {
  activationRadius: number;
}

export type GauntletSpawnPattern =
  | "altar-ring"
  | "near-altar"
  | "wide-ring"
  | "fixed-points";

export interface DungeonMonsterPoolEntry {
  monsterId: string;
  weight: number;
}

export interface DungeonMonsterModifiers {
  hpMult?: number;
  atkMult?: number;
  attackSpeedMult?: number;
  moveSpeedMult?: number;
  armorMult?: number;
  drAdd?: number;
  /** Multiplies damagePerStack on the monster's dotEffect, if it has one. */
  dotMult?: number;
  /** Injects an opening-strike multiplier on the first hit of each aggro session. */
  openingStrikeMult?: number;
}

/**
 * A pre-encounter "den": instead of N ring guardians, spawn one coordinated pack
 * (a pack-alpha monster plus its authored `pack.followers`). The alpha is the main
 * danger; the followers are modest bodies. Used for the Forest alpha-den exam.
 */
export interface GauntletDenDef {
  /** Pack-alpha monster id; its `pack.followers` provide the rest of the den. */
  alphaMonsterId: string;
}

export interface GauntletPhaseDef {
  id: string;
  label: string;
  requiredKills: number;
  maxAlive: number;
  spawnPattern: GauntletSpawnPattern;
  fixedSpawnPoints?: Vec2[];
  monsterPool: DungeonMonsterPoolEntry[];
  modifiers?: DungeonMonsterModifiers;
  /**
   * When set, this phase spawns a single pack/den (alpha + followers) instead of
   * a ring of `requiredKills` pool monsters. Only the alpha receives `modifiers`.
   */
  den?: GauntletDenDef;
}

export type PreEncounterRole = "leader" | "follower" | "keeper";

export interface PreEncounterAuraDef {
  kind: "damage" | "attack-speed";
  range: number;
  mult: number;
}

/**
 * Display-only status effect id stamped on a pre-encounter aura SOURCE (the pack
 * caller / den alpha) so the HUD target frame shows a "Rally" buff tile when you
 * target it — the readable "this one is buffing its allies, kill it first" signal.
 * Purely an indicator; the aura mechanic itself rides `TracksDungeon.preEncounterAura`.
 */
export const PRE_ENCOUNTER_AURA_EFFECT_ID = "pre-encounter-aura";

export interface PreEncounterFollowerDef {
  monsterId: string;
  count: number;
}

export interface PreEncounterPackDef {
  kind: "pack";
  id: string;
  label: string;
  anchor: Vec2;
  leaderMonsterId: string;
  followers?: PreEncounterFollowerDef[];
  leaderName?: string;
  leaderModifiers?: DungeonMonsterModifiers;
  followerModifiers?: DungeonMonsterModifiers;
  aura?: PreEncounterAuraDef;
  localWanderRadius?: number;
  leashRadius?: number;
  pullRange?: number;
  /**
   * Runtime patrol route for the group leader, applied to its `controlsMonster`
   * at spawn. Overrides the monster-def patrol — used to give dungeon guardians
   * a bespoke route (e.g. orbiting the altar) distinct from their open-world one.
   */
  patrolOverride?: MonsterPatrolRoute;
}

export interface PreEncounterBasinDef {
  kind: "basin";
  id: string;
  label: string;
  anchor: Vec2;
  keeperMonsterId: string;
  keeperName?: string;
  keeperModifiers?: DungeonMonsterModifiers;
  radius: number;
  localWanderRadius?: number;
  leashRadius?: number;
  pullRange?: number;
}

export type PreEncounterGroupDef = PreEncounterPackDef | PreEncounterBasinDef;

export interface DungeonBossRotPoolDef {
  kind: "rot-pool";
  intervalMs: number;
  initialDelayMs?: number;
  durationMs: number;
  radius: number;
  maxAlive: number;
  damagePerTick: number;
  tickIntervalMs: number;
  slowSpeedMult?: number;
}

export interface DungeonPreEncounterDef {
  id: string;
  label: string;
  groups: PreEncounterGroupDef[];
  unclearedRole?: PreEncounterRole;
  bossRotPools?: DungeonBossRotPoolDef;
}

export interface GauntletBossDef {
  bossId: string;
  spawnAt: "altar" | "fixed-point";
  fixedSpawnPoint?: Vec2;
}

/**
 * How counted pre-encounter threats make a T1 dungeon boss fight harder.
 *
 * T1 dungeons are "pre-encounter + boss": they do NOT run the gauntlet wave
 * system. Every guardian still alive when the altar is activated joins as an
 * optional threat while the countdown runs. Counted survivors also feed exactly
 * one of these biome-authored difficulty hooks. Clearing the guardians first
 * removes the hook entirely.
 */
export type UnclearedThreatMode =
  | "join" // no extra hook beyond surviving guardians joining the boss fight
  | "empower" // the boss gains stats per surviving guardian
  | "extra-adds" // extra adds spawn with the boss, scaled by surviving count
  | "hazard"; // an extra hazard is enabled (biome-authored later)

export interface UnclearedThreatEffect {
  mode: UnclearedThreatMode;
  /** "empower": additive boss stat bonus applied per surviving guardian. */
  empowerPerGuardian?: Pick<
    DungeonMonsterModifiers,
    "hpMult" | "atkMult" | "attackSpeedMult" | "drAdd"
  >;
  /** "extra-adds": extra adds spawned per surviving guardian (rounded down). */
  extraAddsPerGuardian?: number;
  /** "extra-adds": hard cap on total extra adds regardless of survivor count. */
  maxExtraAdds?: number;
  /** "hazard": id of the biome-authored hazard to enable (placeholder for now). */
  hazardId?: string;
}

export interface DungeonGauntletDef {
  nodeId: string;
  biomeGroup: string;
  biomeTier: number;
  altar: DungeonAltarDef;
  successCooldownMs: number;
  bossAwakeningDelayMs: number;
  idlePreclearResetMs?: number;
  guardianPhase: GauntletPhaseDef;
  /**
   * Authored pre-boss encounter for dungeons that have moved beyond the old
   * generated guardian ring. When present, this replaces `guardianPhase` for the
   * idle T1 pre-encounter; `guardianPhase` remains as a migration fallback and
   * for higher-tier wave scaffolding.
   */
  preEncounter?: DungeonPreEncounterDef;
  phases: GauntletPhaseDef[];
  boss: GauntletBossDef;
  /**
   * T1 pre-encounter rule: how uncleared guardians affect the boss fight.
   * Ignored by tiers that run the gauntlet wave system (phases-based).
   */
  unclearedThreat?: UnclearedThreatEffect;
}

export interface DungeonGauntletView {
  nodeId: string;
  status: GauntletStatus;
  altar: DungeonAltarDef;
  canActivate: boolean;
  guardianAlive: number;
  guardianTotal: number;
  phaseIndex: number;
  phaseLabel?: string;
  killsInPhase: number;
  requiredKillsForCurrentPhase: number;
  guardianMonsterIds: string[];
  activeMonsterIds: string[];
  /** T1 pre-encounter: how uncleared guardians modify the boss fight. */
  unclearedThreatMode?: UnclearedThreatMode;
  /** T1 pre-encounter: guardians left alive when the altar was activated. */
  unclearedThreatCount?: number;
  preEncounterLabel?: string;
  temporaryHazards?: Array<{
    id: string;
    kind: "rot-pool";
    x: number;
    y: number;
    radius: number;
    expiresAtMs: number;
    remainingMs: number;
  }>;
  bossMonsterId?: string;
  bossTypeId?: string;
  bossAwakensAtMs?: number;
  bossAwakeningRemainingMs?: number;
  cooldownEndsAtMs?: number;
  cooldownRemainingMs?: number;
}
