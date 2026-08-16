import { GAME_CONFIG } from "../config/gameConfig";
import { BIOME_DATABASE } from "../biomeDatabase";
import { MONSTER_DATABASE } from "../data/monsters";
import { NODE_BIOMES } from "../world/nodeBiomes";
import type { Vec2 } from "../systems/spatial";
import type {
  DungeonBossDef,
  DungeonDef,
  DungeonGuardDef,
  DungeonMonsterModifiers,
  GuardFollowerDef,
  GuardGroupDef,
  GuardPostureShape,
} from "./dungeonTypes";

export const DUNGEON_SUCCESS_COOLDOWN_MS = 60_000;
export const DUNGEON_IDLE_PRECLEAR_RESET_MS = 90_000;
export const DUNGEON_BOSS_AWAKENING_DELAY_MS = 7_000;
export const DUNGEON_ALTAR_RADIUS = 96;

const ALTAR_X = GAME_CONFIG.NODE_WIDTH / 2;
const ALTAR_Y = GAME_CONFIG.NODE_HEIGHT / 2;

/**
 * On-screen size of a dungeon altar, matching the hub's rune altar so the two read
 * as the same class of object.
 *
 * Was a hardcoded `250` at the render site and missed by BOTH node resizes — on a
 * 4800 node that is a ~5% span, small enough to read as ground clutter rather than
 * the centrepiece of a boss arena. A fraction of the node so it cannot drift again.
 */
export const DUNGEON_ALTAR_SIZE = GAME_CONFIG.NODE_WIDTH * 0.11667;

/**
 * How far a guardian may be dragged past its own territory before it gives up and
 * walks back. Deliberately tighter than these monsters' ambient leash: guardians
 * protect the altar and nothing else, so they can never be kited across the node.
 */
const GUARD_CHASE_MARGIN = 320;

const PATROL_HOLD_MIN_MS = 600;
const PATROL_HOLD_MAX_MS = 1_400;

/**
 * How one biome's guardians hold the altar.
 *
 * Every dungeon of a biome uses the same posture at every tier; only the roster
 * changes, because it is drawn from that biome/tier's own ambient monster pool.
 * Tier difficulty therefore comes from the mobs themselves, not from piling on
 * more bodies.
 *
 * `shape` maps onto shipped ecology primitives (see `GuardPostureShape`), and
 * the counts follow each biome's density identity: swarm biomes guard in big
 * packs, elite biomes guard with a handful of solo sentinels.
 *
 * Every number here is a PLACEHOLDER for the balance pass.
 */
export interface BiomeGuardPosture {
  shape: GuardPostureShape;
  /** Guard stations evenly spaced around the altar. */
  groups: number;
  /** Followers per station (`pack` only; the other shapes are solo). */
  followersPerGroup: number;
  /** Radius of the guard ring the stations sit on. */
  ringRadius: number;
  /** Idle drift around the station (`pack` only). */
  localWanderRadius: number;
  /** Waypoints per orbit lap (`patrol` only). */
  patrolSegments: number;
  /** Detection radius while the altar is idle. */
  pullRange: number;
  leaderName: string;
  label: string;
  modifiers: DungeonMonsterModifiers;
}

export const BIOME_GUARD_POSTURE: Record<string, BiomeGuardPosture> = {
  // Swarm biome: many bodies, herded around a few callers.
  plains: {
    shape: "pack",
    groups: 3,
    followersPerGroup: 3,
    ringRadius: 480,
    localWanderRadius: 110,
    patrolSegments: 0,
    pullRange: 175,
    leaderName: "Prairie Defender",
    label: "Guarding Herds",
    modifiers: { attackSpeedMult: 1.08 },
  },
  // Pack hunters: fewer, faster, led from the front.
  forest: {
    shape: "pack",
    groups: 3,
    followersPerGroup: 2,
    ringRadius: 460,
    localWanderRadius: 90,
    patrolSegments: 0,
    pullRange: 180,
    leaderName: "Forest Sentinel",
    label: "Guarding Packs",
    modifiers: { attackSpeedMult: 1.25, moveSpeedMult: 1.12 },
  },
  // Low density, per-hit threat: heavy sentries rooted to their posts.
  mountain: {
    shape: "post-hold",
    groups: 4,
    followersPerGroup: 0,
    ringRadius: 440,
    localWanderRadius: 0,
    patrolSegments: 0,
    pullRange: 190,
    leaderName: "Stone Warden",
    label: "Stone Watch",
    modifiers: { hpMult: 1.15, atkMult: 1.35 },
  },
  // Attrition biome: rot-soaked keepers holding the wet ground in small groups.
  swamp: {
    shape: "pack",
    groups: 3,
    followersPerGroup: 1,
    ringRadius: 470,
    localWanderRadius: 80,
    patrolSegments: 0,
    pullRange: 170,
    leaderName: "Mire Keeper",
    label: "Mire Watch",
    modifiers: { hpMult: 1.05, atkMult: 1.05, dotMult: 1.3 },
  },
  // Sparse elites with overpull-range detection, circling the altar in formation.
  cave: {
    shape: "patrol",
    groups: 3,
    followersPerGroup: 0,
    ringRadius: 420,
    localWanderRadius: 0,
    patrolSegments: 8,
    pullRange: 240,
    leaderName: "Cave Sentinel",
    label: "Deep Watch",
    modifiers: { hpMult: 1.3, atkMult: 1.15, drAdd: 0.05 },
  },
  // Standoff biome: few, spread wide, punishing the approach.
  desert: {
    shape: "post-hold",
    groups: 3,
    followersPerGroup: 0,
    ringRadius: 520,
    localWanderRadius: 0,
    patrolSegments: 0,
    pullRange: 200,
    leaderName: "Dune Keeper",
    label: "Dune Watch",
    modifiers: { hpMult: 1.2, atkMult: 1.15, openingStrikeMult: 1.7 },
  },
  // High density ambushers: tight groups packed close to the shrine.
  jungle: {
    shape: "pack",
    groups: 3,
    followersPerGroup: 2,
    ringRadius: 430,
    localWanderRadius: 100,
    patrolSegments: 0,
    pullRange: 185,
    leaderName: "Jungle Warden",
    label: "Canopy Watch",
    modifiers: {
      atkMult: 1.05,
      attackSpeedMult: 1.2,
      moveSpeedMult: 1.08,
      dotMult: 1.2,
      openingStrikeMult: 1.8,
    },
  },
  // Cold, deliberate pairs prowling a wide ring.
  tundra: {
    shape: "patrol",
    groups: 3,
    followersPerGroup: 0,
    ringRadius: 480,
    localWanderRadius: 0,
    patrolSegments: 6,
    pullRange: 200,
    leaderName: "Frost Warden",
    label: "Frost Watch",
    modifiers: { hpMult: 1.2, atkMult: 1.05 },
  },
  // Eruption biome: packs clustered near the heat at the centre.
  volcanic: {
    shape: "pack",
    groups: 3,
    followersPerGroup: 2,
    ringRadius: 450,
    localWanderRadius: 95,
    patrolSegments: 0,
    pullRange: 185,
    leaderName: "Ember Warden",
    label: "Ember Watch",
    modifiers: { atkMult: 1.25, attackSpeedMult: 1.1, dotMult: 1.25 },
  },
  // The densest swarm: shambling groups packed around the grave.
  graveyard: {
    shape: "pack",
    groups: 3,
    followersPerGroup: 3,
    ringRadius: 470,
    localWanderRadius: 105,
    patrolSegments: 0,
    pullRange: 180,
    leaderName: "Grave Warden",
    label: "Grave Watch",
    modifiers: { attackSpeedMult: 1.2, moveSpeedMult: 1.1, dotMult: 1.25 },
  },
  // Rare abyssal terrors: two of them, and that is plenty.
  trench: {
    shape: "post-hold",
    groups: 2,
    followersPerGroup: 0,
    ringRadius: 500,
    localWanderRadius: 0,
    patrolSegments: 0,
    pullRange: 210,
    leaderName: "Abyssal Guardian",
    label: "Abyssal Watch",
    modifiers: { hpMult: 1.35, atkMult: 1.3, openingStrikeMult: 1.9 },
  },
};

const DEFAULT_POSTURE: BiomeGuardPosture = {
  shape: "post-hold",
  groups: 4,
  followersPerGroup: 0,
  ringRadius: 460,
  localWanderRadius: 0,
  patrolSegments: 0,
  pullRange: 190,
  leaderName: "Guardian",
  label: "Altar Watch",
  modifiers: {},
};

export interface BiomeDungeonMessages {
  activation: string;
  bossAwakening: string;
}

export const BIOME_DUNGEON_MESSAGES: Record<string, BiomeDungeonMessages> = {
  plains:    { activation: "The herds turn on you as one.",           bossAwakening: "Something massive stirs at the heart of the plains." },
  forest:    { activation: "The packs close in around the altar.",     bossAwakening: "Ancient roots tremble. The forest's guardian awakens." },
  mountain:  { activation: "The stone wardens leave their posts.",     bossAwakening: "The summit shudders. A great weight stirs from below." },
  swamp:     { activation: "The mire answers. The keepers close in.",  bossAwakening: "The miasma thickens. The rot-lord stirs." },
  cave:      { activation: "The watch breaks formation.",              bossAwakening: "The depths roar. Something old stirs in the dark." },
  desert:    { activation: "The dune keepers abandon the sand.",       bossAwakening: "The dunes heave. The desert's warden rises." },
  jungle:    { activation: "The canopy erupts around the shrine.",     bossAwakening: "The canopy falls silent. A predator approaches." },
  tundra:    { activation: "The frost wardens turn inward.",           bossAwakening: "The cold sharpens. The tundra's sovereign stirs." },
  volcanic:  { activation: "The ember wardens ignite as one.",         bossAwakening: "The magma surges. An infernal lord awakens." },
  graveyard: { activation: "The dead answer the altar.",               bossAwakening: "The grave hums. The death-lord stirs." },
  trench:    { activation: "The guardians rise from the dark water.",  bossAwakening: "The pressure drops. Something vast rises from the abyss." },
};

/** Optional per-node overrides for a dungeon that should diverge from its biome. */
export interface DungeonContentOverride {
  successCooldownMs?: number;
  bossAwakeningDelayMs?: number;
  posture?: Partial<BiomeGuardPosture>;
  boss?: Partial<DungeonBossDef>;
}

export const DUNGEON_CONTENT_BY_NODE: Record<string, DungeonContentOverride> = {};

export function guardPostureFor(
  biomeGroup: string,
  nodeId?: string,
): BiomeGuardPosture {
  const base = BIOME_GUARD_POSTURE[biomeGroup] ?? DEFAULT_POSTURE;
  const override = nodeId ? DUNGEON_CONTENT_BY_NODE[nodeId]?.posture : undefined;
  return override ? { ...base, ...override } : base;
}

/**
 * Rank a biome/tier's ambient pool into a leader plus follower bodies.
 *
 * A `pack` station is led by the pool's own pack alpha when it has one, so a
 * guard group is the same shape the biome fields in the open world. Failing
 * that (and for the solo shapes) the leader is the pool's toughest entry by
 * hp x attack — "the biggest thing here, plus its lessers".
 *
 * `authoredFollowers` is the alpha's own entourage from the monster database. It
 * wins over the posture's synthesized bodies, because that entourage IS the
 * biome's answer to what this creature travels with.
 *
 * Deterministic — no RNG, so a node re-thaws with the same roster.
 */
function guardRoster(
  biomeGroup: string,
  biomeTier: number,
  shape: GuardPostureShape,
): {
  leaderMonsterId: string;
  followerIds: string[];
  authoredFollowers?: GuardFollowerDef[];
} | null {
  const pool = BIOME_DATABASE.get(biomeGroup)?.monsterPoolByTier[biomeTier] ?? [];
  const unique = [...new Set(pool)];
  if (unique.length === 0) return null;

  const ranked = [...unique].sort((a, b) => threatRank(b) - threatRank(a));
  const alpha =
    shape === "pack"
      ? ranked.find((id) => MONSTER_DATABASE.get(id)?.pack?.role === "alpha")
      : undefined;
  const leaderMonsterId = alpha ?? ranked[0];
  const followerIds = ranked.filter((id) => id !== leaderMonsterId);
  const authored = alpha
    ? MONSTER_DATABASE.get(alpha)?.pack?.followers?.map((f) => ({
        monsterId: f.typeId,
        count: f.count,
      }))
    : undefined;
  return {
    leaderMonsterId,
    followerIds: followerIds.length > 0 ? followerIds : [leaderMonsterId],
    authoredFollowers: authored && authored.length > 0 ? authored : undefined,
  };
}

function threatRank(monsterId: string): number {
  const stats = MONSTER_DATABASE.get(monsterId)?.stats;
  if (!stats) return 0;
  return stats.hp * stats.attack;
}

function ringPoint(radius: number, angle: number): Vec2 {
  return clampToNode({
    x: ALTAR_X + Math.cos(angle) * radius,
    y: ALTAR_Y + Math.sin(angle) * radius,
  });
}

function clampToNode(pos: Vec2): Vec2 {
  const margin = 64;
  return {
    x: Math.max(margin, Math.min(GAME_CONFIG.NODE_WIDTH - margin, pos.x)),
    y: Math.max(margin, Math.min(GAME_CONFIG.NODE_HEIGHT - margin, pos.y)),
  };
}

function guardGroup(
  posture: BiomeGuardPosture,
  slot: number,
  roster: NonNullable<ReturnType<typeof guardRoster>>,
): GuardGroupDef {
  const { leaderMonsterId, followerIds, authoredFollowers } = roster;
  // Stations start at the top of the ring and spread evenly, so groups always
  // read as separate stations rather than one blob.
  const startAngle = (slot / posture.groups) * Math.PI * 2 - Math.PI / 2;
  const station = ringPoint(posture.ringRadius, startAngle);

  const base: GuardGroupDef = {
    id: `guard-${slot}`,
    shape: posture.shape,
    station,
    leaderMonsterId,
    leaderName: posture.leaderName,
    // Territory is the station, so the leash is measured from it.
    leashRadius: GUARD_CHASE_MARGIN,
    pullRange: posture.pullRange,
  };

  if (posture.shape === "patrol") {
    const segments = Math.max(3, posture.patrolSegments);
    const waypoints: Vec2[] = [];
    for (let i = 1; i <= segments; i++) {
      waypoints.push(
        ringPoint(posture.ringRadius, startAngle + (i / segments) * Math.PI * 2),
      );
    }
    return {
      ...base,
      patrolWaypoints: waypoints,
      patrolHoldMinMs: PATROL_HOLD_MIN_MS,
      patrolHoldMaxMs: PATROL_HOLD_MAX_MS,
      // A patrolling guardian's territory is the whole orbit, so its leash is
      // measured from the ALTAR: it may cross the ring but never leave it.
      leashRadius: posture.ringRadius + GUARD_CHASE_MARGIN,
    };
  }

  if (posture.shape === "pack") {
    const followers =
      authoredFollowers ?? packFollowers(posture, slot, followerIds);
    if (followers.length === 0) return base;
    return {
      ...base,
      followers,
      localWanderRadius: posture.localWanderRadius,
    };
  }

  return base;
}

/**
 * Fill a station's follower slots from the roster, offset by the group index so
 * neighbouring stations do not all field the same body.
 */
function packFollowers(
  posture: BiomeGuardPosture,
  slot: number,
  followerIds: string[],
): GuardFollowerDef[] {
  if (posture.followersPerGroup <= 0) return [];
  const counts = new Map<string, number>();
  for (let i = 0; i < posture.followersPerGroup; i++) {
    const monsterId = followerIds[(slot + i) % followerIds.length];
    counts.set(monsterId, (counts.get(monsterId) ?? 0) + 1);
  }
  return [...counts].map(([monsterId, count]) => ({ monsterId, count }));
}

function buildGuardDef(nodeId: string): DungeonGuardDef | null {
  const info = NODE_BIOMES[nodeId];
  if (!info) return null;
  const posture = guardPostureFor(info.biomeGroup, nodeId);
  const roster = guardRoster(info.biomeGroup, info.biomeTier, posture.shape);
  if (!roster) return null;
  const groups: GuardGroupDef[] = [];
  for (let slot = 0; slot < posture.groups; slot++) {
    groups.push(guardGroup(posture, slot, roster));
  }
  return {
    id: `${info.biomeGroup}-t${info.biomeTier}-guard`,
    label: posture.label,
    modifiers: posture.modifiers,
    groups,
  };
}

function bossForDungeon(nodeId: string): string | null {
  const info = NODE_BIOMES[nodeId];
  if (!info?.isDungeon) return null;
  if (info.bossTypeId) return info.bossTypeId;
  const biome = BIOME_DATABASE.get(info.biomeGroup);
  return biome?.bossPoolByTier?.[info.biomeTier]?.[0] ?? null;
}

function buildDungeonDef(nodeId: string): DungeonDef | null {
  const info = NODE_BIOMES[nodeId];
  if (!info?.isDungeon) return null;
  // The Void Overlord throne keeps its own ultimate-encounter system.
  if (info.bossTypeId === "void-overlord") return null;
  const bossId = bossForDungeon(nodeId);
  const guard = buildGuardDef(nodeId);
  if (!bossId || !guard) return null;
  const override = DUNGEON_CONTENT_BY_NODE[nodeId];
  return {
    nodeId,
    biomeGroup: info.biomeGroup,
    biomeTier: info.biomeTier,
    altar: {
      x: ALTAR_X,
      y: ALTAR_Y,
      activationRadius: DUNGEON_ALTAR_RADIUS,
    },
    successCooldownMs: override?.successCooldownMs ?? DUNGEON_SUCCESS_COOLDOWN_MS,
    bossAwakeningDelayMs:
      override?.bossAwakeningDelayMs ?? DUNGEON_BOSS_AWAKENING_DELAY_MS,
    idlePreclearResetMs: DUNGEON_IDLE_PRECLEAR_RESET_MS,
    guard,
    boss: { bossId, spawnAt: "altar", ...override?.boss },
  };
}

export const DUNGEON_DEFS: Map<string, DungeonDef> = new Map(
  Object.keys(NODE_BIOMES)
    .map((nodeId) => buildDungeonDef(nodeId))
    .filter((def): def is DungeonDef => def !== null)
    .map((def) => [def.nodeId, def]),
);

export function getDungeonDef(nodeId: string): DungeonDef | undefined {
  return DUNGEON_DEFS.get(nodeId);
}

export function isDungeonNode(nodeId: string): boolean {
  return DUNGEON_DEFS.has(nodeId);
}

/** Total guardian bodies a dungeon spawns when idle. */
export function guardianTotalFor(def: DungeonDef): number {
  return def.guard.groups.reduce(
    (total, group) =>
      total + 1 + (group.followers ?? []).reduce((sum, f) => sum + f.count, 0),
    0,
  );
}
