import type { Vec2 } from "../systems/spatial";

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
}

export interface GauntletBossDef {
  bossId: string;
  spawnAt: "altar" | "fixed-point";
  fixedSpawnPoint?: Vec2;
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
  phases: GauntletPhaseDef[];
  boss: GauntletBossDef;
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
  bossMonsterId?: string;
  bossTypeId?: string;
  bossAwakensAtMs?: number;
  bossAwakeningRemainingMs?: number;
  cooldownEndsAtMs?: number;
  cooldownRemainingMs?: number;
}
