import type { Vec2 } from "../systems/spatial";

/**
 * A dungeon is an altar guarded by a fixed set of biome guardians, plus the boss
 * they are guarding.
 *
 * The loop is deliberately flat: guardians hold the altar, the player may clear
 * some or all of them, activating the altar aggroes every survivor and wakes the
 * boss, and the boss falling starts a short reform cooldown. There are no waves,
 * no per-dungeon bonus mechanics, and no reward for leaving guardians alive.
 */
export type DungeonStatus = "idle" | "bossAwakening" | "boss" | "cooldown";

export interface DungeonAltarDef extends Vec2 {
  activationRadius: number;
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
 * How a guard group holds its station. Each shape maps onto an already-shipped
 * biome-ecology primitive rather than adding dungeon-only AI:
 *
 * - `pack`    — leader + followers sharing an `inPack` link, milling within
 *               `localWanderRadius` of their station. Call-allies pulls the
 *               group together; killing the leader scatters the followers,
 *               exactly as it does in the open world.
 * - `patrol`  — solo guardians walking an absolute waypoint loop around the
 *               altar (`controlsMonster.holdPost` + `holdPatrol`), evenly
 *               phase-offset so they circle in formation.
 * - `post-hold` — solo guardians standing their station, no wander.
 */
export type GuardPostureShape = "pack" | "patrol" | "post-hold";

export interface GuardFollowerDef {
  monsterId: string;
  count: number;
}

/** One group of guardians holding one station on the altar's guard ring. */
export interface GuardGroupDef {
  id: string;
  shape: GuardPostureShape;
  /** Absolute node coordinates of this group's station on the guard ring. */
  station: Vec2;
  leaderMonsterId: string;
  /** Display name for the group leader ("Stone Warden"); followers keep theirs. */
  leaderName?: string;
  followers?: GuardFollowerDef[];
  /** How far members drift from the station while un-aggroed (`pack` only). */
  localWanderRadius?: number;
  /** Absolute altar-orbit waypoints (`patrol` only). */
  patrolWaypoints?: Vec2[];
  /** Hold time at each patrol waypoint. */
  patrolHoldMinMs?: number;
  patrolHoldMaxMs?: number;
  /**
   * How far a guardian may be dragged before it drops aggro and walks back. For
   * `patrol` groups this is measured from the ALTAR (the orbit is the territory);
   * for the others it is measured from the station.
   */
  leashRadius: number;
  /** Detection radius while the altar is idle — capped below the monster's own. */
  pullRange: number;
}

export interface DungeonGuardDef {
  id: string;
  label: string;
  /** Stat modifiers applied to every guardian — the dungeon's difficulty layer. */
  modifiers?: DungeonMonsterModifiers;
  groups: GuardGroupDef[];
}

export interface DungeonBossDef {
  bossId: string;
  spawnAt: "altar" | "fixed-point";
  fixedSpawnPoint?: Vec2;
}

export interface DungeonDef {
  nodeId: string;
  biomeGroup: string;
  biomeTier: number;
  altar: DungeonAltarDef;
  successCooldownMs: number;
  bossAwakeningDelayMs: number;
  /** Time after the last guardian kill before an un-activated dungeon reforms. */
  idlePreclearResetMs?: number;
  guard: DungeonGuardDef;
  boss: DungeonBossDef;
}

/** Compact per-node dungeon state sent to clients on the node delta. */
export interface DungeonView {
  nodeId: string;
  status: DungeonStatus;
  altar: DungeonAltarDef;
  canActivate: boolean;
  guardLabel: string;
  guardianAlive: number;
  guardianTotal: number;
  /** Living guardians, idle or engaged — the client outlines these in gold. */
  guardianMonsterIds: string[];
  bossMonsterId?: string;
  bossTypeId?: string;
  bossAwakensAtMs?: number;
  bossAwakeningRemainingMs?: number;
  cooldownEndsAtMs?: number;
  cooldownRemainingMs?: number;
}
