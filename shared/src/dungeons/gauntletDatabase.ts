import { GAME_CONFIG } from "../config/gameConfig";
import { BIOME_DATABASE } from "../biomeDatabase";
import { NODE_BIOMES } from "../world/nodeBiomes";
import type {
  DungeonGauntletDef,
  GauntletBossDef,
  DungeonMonsterModifiers,
  GauntletPhaseDef,
} from "./gauntletTypes";

export const DUNGEON_SUCCESS_COOLDOWN_MS = 60_000;
export const DUNGEON_IDLE_PRECLEAR_RESET_MS = 90_000;
export const DUNGEON_BOSS_AWAKENING_DELAY_MS = 7_000;
export const DUNGEON_ALTAR_RADIUS = 96;

const ALTAR_X = GAME_CONFIG.NODE_WIDTH / 2;
const ALTAR_Y = GAME_CONFIG.NODE_HEIGHT / 2;

interface DungeonGauntletContent {
  successCooldownMs?: number;
  bossAwakeningDelayMs?: number;
  guardianPhase?: Partial<GauntletPhaseDef>;
  phases?: GauntletPhaseDef[];
  boss?: Partial<GauntletBossDef>;
}

function biomeTierKey(biomeGroup: string, biomeTier: number): string {
  return `${biomeGroup}:${biomeTier}`;
}

/**
 * Main authoring surface for dungeon composition by biome/tier.
 *
 * Omitted fields fall back to the biome's generated defaults, so entries can
 * start small and become more bespoke over time.
 */
export const DUNGEON_GAUNTLET_CONTENT_BY_BIOME_TIER: Record<string, DungeonGauntletContent> = {
  [biomeTierKey("mountain", 1)]: {
    guardianPhase: {
      requiredKills: 4,
      maxAlive: 4,
      monsterPool: [
        { monsterId: "cliff-hopper", weight: 3 },
        { monsterId: "ridge-archer", weight: 2 },
      ],
    },
    phases: [],
  },
  [biomeTierKey("mountain", 2)]: {
    phases: [
      smallWave("mountain-t2-wave-1", "Outer guard", "stone-eagle"),
    ],
  },
  [biomeTierKey("forest", 2)]: {
    phases: [
      smallWave("forest-t2-wave-1", "Outer guard", "ancient-wolf"),
    ],
  },
  [biomeTierKey("desert", 2)]: {
    phases: [
      smallWave("desert-t2-wave-1", "Outer guard", "sand-scorpion"),
    ],
  },
  [biomeTierKey("jungle", 2)]: {
    phases: [
      smallWave("jungle-t2-wave-1", "Outer guard", "jungle-snake"),
    ],
  },
  [biomeTierKey("cave", 2)]: {
    phases: [
      smallWave("cave-t2-wave-1", "Outer guard", "giant-spider"),
    ],
  },
  [biomeTierKey("plains", 2)]: {
    phases: [
      smallWave("plains-t2-wave-1", "Outer guard", "prairie-wolf"),
    ],
  },
  [biomeTierKey("swamp", 2)]: {
    phases: [
      smallWave("swamp-t2-wave-1", "Outer guard", "mire-stalker"),
    ],
  },
};

/**
 * Optional node-specific overrides for special dungeons.
 *
 * Use this when one dungeon should diverge from the biome/tier template.
 */
export const DUNGEON_GAUNTLET_CONTENT_BY_NODE: Record<string, DungeonGauntletContent> = {};

const BIOME_GUARDIAN_MODIFIERS: Record<string, DungeonMonsterModifiers> = {
  plains: { hpMult: 0.9, atkMult: 0.95, attackSpeedMult: 1.08 },
  forest: { hpMult: 0.9, atkMult: 0.95, attackSpeedMult: 1.25, moveSpeedMult: 1.12 },
  mountain: { hpMult: 1.15, atkMult: 1.35, moveSpeedMult: 0.85 },
  swamp: { hpMult: 1.05, atkMult: 1.05 },
  cave: { hpMult: 1.3, atkMult: 1.15, drAdd: 0.05 },
  desert: { hpMult: 1.2, atkMult: 1.15, moveSpeedMult: 0.95 },
  jungle: { hpMult: 0.95, atkMult: 1.05, attackSpeedMult: 1.2, moveSpeedMult: 1.08 },
  tundra: { hpMult: 1.2, atkMult: 1.05, moveSpeedMult: 0.9 },
  volcanic: { hpMult: 1.0, atkMult: 1.25, attackSpeedMult: 1.1 },
  graveyard: { hpMult: 0.85, atkMult: 0.9, attackSpeedMult: 1.2, moveSpeedMult: 1.1 },
};

const BIOME_GUARDIAN_COUNTS: Record<string, number> = {
  plains: 5,
  cave: 3,
  desert: 3,
  tundra: 3,
  graveyard: 5,
};

const GUARDIANS_PER_EXTRA_TIER = 2;

function bossForDungeon(nodeId: string): string | null {
  const info = NODE_BIOMES[nodeId];
  if (!info?.isDungeon) return null;
  if (info.bossTypeId) return info.bossTypeId;
  const biome = BIOME_DATABASE.get(info.biomeGroup);
  return biome?.bossPoolByTier?.[info.biomeTier]?.[0] ?? null;
}

function monsterPoolForDungeon(nodeId: string): string[] {
  const info = NODE_BIOMES[nodeId];
  if (!info) return [];
  return BIOME_DATABASE.get(info.biomeGroup)?.monsterPoolByTier[info.biomeTier] ?? [];
}

function guardianPhaseFor(nodeId: string): GauntletPhaseDef | null {
  const info = NODE_BIOMES[nodeId];
  if (!info) return null;
  const pool = monsterPoolForDungeon(nodeId);
  if (pool.length === 0) return null;
  const count = guardianCountFor(info.biomeGroup, info.biomeTier);
  const content = contentForDungeon(nodeId);
  const overrides = content?.guardianPhase ?? {};
  return {
    id: `${info.biomeGroup}-guardians`,
    label: "Guardians",
    requiredKills: count,
    maxAlive: count,
    spawnPattern: "altar-ring",
    monsterPool: pool.map((monsterId) => ({ monsterId, weight: 1 })),
    modifiers: BIOME_GUARDIAN_MODIFIERS[info.biomeGroup],
    ...overrides,
  };
}

function guardianCountFor(biomeGroup: string, biomeTier: number): number {
  const baseCount = BIOME_GUARDIAN_COUNTS[biomeGroup] ?? 4;
  return baseCount + Math.max(0, biomeTier - 1) * GUARDIANS_PER_EXTRA_TIER;
}

function smallWave(
  id: string,
  label: string,
  monsterId: string,
): GauntletPhaseDef {
  return {
    id,
    label,
    requiredKills: 2,
    maxAlive: 2,
    spawnPattern: "wide-ring",
    monsterPool: [{ monsterId, weight: 1 }],
  };
}

function buildDungeonGauntletDef(nodeId: string): DungeonGauntletDef | null {
  const info = NODE_BIOMES[nodeId];
  if (!info?.isDungeon) return null;
  if (info.bossTypeId === "void-overlord") return null;
  const bossId = bossForDungeon(nodeId);
  const guardianPhase = guardianPhaseFor(nodeId);
  if (!bossId || !guardianPhase) return null;
  const content = contentForDungeon(nodeId);
  const boss: GauntletBossDef = {
    bossId,
    spawnAt: "altar",
    ...content?.boss,
  };
  return {
    nodeId,
    biomeGroup: info.biomeGroup,
    biomeTier: info.biomeTier,
    altar: {
      x: ALTAR_X,
      y: ALTAR_Y,
      activationRadius: DUNGEON_ALTAR_RADIUS,
    },
    successCooldownMs: content?.successCooldownMs ?? DUNGEON_SUCCESS_COOLDOWN_MS,
    bossAwakeningDelayMs: content?.bossAwakeningDelayMs ?? DUNGEON_BOSS_AWAKENING_DELAY_MS,
    idlePreclearResetMs: DUNGEON_IDLE_PRECLEAR_RESET_MS,
    guardianPhase,
    phases: content?.phases ?? [],
    boss,
  };
}

function contentForDungeon(nodeId: string): DungeonGauntletContent | undefined {
  const info = NODE_BIOMES[nodeId];
  if (!info) return DUNGEON_GAUNTLET_CONTENT_BY_NODE[nodeId];
  return DUNGEON_GAUNTLET_CONTENT_BY_NODE[nodeId] ??
    DUNGEON_GAUNTLET_CONTENT_BY_BIOME_TIER[
      biomeTierKey(info.biomeGroup, info.biomeTier)
    ];
}

export const DUNGEON_GAUNTLET_DEFS: Map<string, DungeonGauntletDef> = new Map(
  Object.keys(NODE_BIOMES)
    .map((nodeId) => buildDungeonGauntletDef(nodeId))
    .filter((def): def is DungeonGauntletDef => def !== null)
    .map((def) => [def.nodeId, def]),
);

export function getDungeonGauntletDef(
  nodeId: string,
): DungeonGauntletDef | undefined {
  return DUNGEON_GAUNTLET_DEFS.get(nodeId);
}

export function isGauntletDungeonNode(nodeId: string): boolean {
  return DUNGEON_GAUNTLET_DEFS.has(nodeId);
}
