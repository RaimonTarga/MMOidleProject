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
  // Mountain (density 10 → 3): one of each type — ram, archer, titan
  [biomeTierKey("mountain", 2)]: {
    phases: [
      tieredWave("mountain-t2-wave-1", "Stone Guard", 3, [
        { monsterId: "granite-titan", weight: 1 },
        { monsterId: "stone-eagle", weight: 1 },
        { monsterId: "peak-archer", weight: 1 },
      ]),
    ],
  },
  // Forest (density 13 → 3): wolf-led pack with a golem bruiser
  [biomeTierKey("forest", 2)]: {
    phases: [
      tieredWave("forest-t2-wave-1", "Pack Guard", 3, [
        { monsterId: "ancient-wolf", weight: 2 },
        { monsterId: "ironwood-golem", weight: 1 },
      ]),
    ],
  },
  // Desert (density 8 → 2): basilisk + djinn — standoff pair
  [biomeTierKey("desert", 2)]: {
    phases: [
      tieredWave("desert-t2-wave-1", "Dune Watch", 2, [
        { monsterId: "stone-basilisk", weight: 1 },
        { monsterId: "dust-djinn", weight: 1 },
      ]),
    ],
  },
  // Jungle (density 15 → 4): fast pack with every archetype represented
  [biomeTierKey("jungle", 2)]: {
    phases: [
      tieredWave("jungle-t2-wave-1", "Jungle Rush", 4, [
        { monsterId: "jungle-snake", weight: 2 },
        { monsterId: "jungle-ape", weight: 1 },
        { monsterId: "jungle-blowdarter", weight: 1 },
      ]),
    ],
  },
  // Cave (density 8 → 2): spider + troll — fast + bruiser pairing
  [biomeTierKey("cave", 2)]: {
    phases: [
      tieredWave("cave-t2-wave-1", "Cavern Watch", 2, [
        { monsterId: "giant-spider", weight: 1 },
        { monsterId: "cave-troll", weight: 1 },
      ]),
    ],
  },
  // Plains (density 16 → 4): swarm with aerial support
  [biomeTierKey("plains", 2)]: {
    phases: [
      tieredWave("plains-t2-wave-1", "Prairie Surge", 4, [
        { monsterId: "prairie-wolf", weight: 2 },
        { monsterId: "stampede-bull", weight: 1 },
        { monsterId: "savanna-hawk", weight: 1 },
      ]),
    ],
  },
  // Swamp (density 10 → 3): one of each type — hydra, witch, stalker
  [biomeTierKey("swamp", 2)]: {
    phases: [
      tieredWave("swamp-t2-wave-1", "Mire Guard", 3, [
        { monsterId: "swamp-hydra", weight: 1 },
        { monsterId: "bog-witch", weight: 1 },
        { monsterId: "mire-stalker", weight: 1 },
      ]),
    ],
  },

  // ── T3 waves (6–3 mobs, scaled to each biome's mob density) ──────────────

  // Mountain (density 10 → 4): charging rams + siege mortars, no magma elites
  [biomeTierKey("mountain", 3)]: {
    phases: [
      tieredWave("mountain-t3-wave-1", "Colossus Guard", 4, [
        { monsterId: "avalanche-ram", weight: 2 },
        { monsterId: "crag-mortar", weight: 1 },
        { monsterId: "mountain-colossus", weight: 1 },
      ]),
    ],
  },

  // Swamp (density 10 → 4): DoT-heavy tide; hydra-led
  [biomeTierKey("swamp", 3)]: {
    phases: [
      tieredWave("swamp-t3-wave-1", "Plague Tide", 4, [
        { monsterId: "plague-hydra", weight: 2 },
        { monsterId: "mire-hex-spitter", weight: 1 },
        { monsterId: "bog-lurker", weight: 1 },
      ]),
    ],
  },

  // Cave (density 8 → 3): one of each type — the biome's signature mixed trio
  [biomeTierKey("cave", 3)]: {
    phases: [
      tieredWave("cave-t3-wave-1", "Deep Sentinels", 3, [
        { monsterId: "deep-spider", weight: 1 },
        { monsterId: "cavern-troll", weight: 1 },
        { monsterId: "crystal-gargoyle", weight: 1 },
      ]),
    ],
  },

  // Jungle (density 15 → 5): fast pack, mostly agile with one brute
  [biomeTierKey("jungle", 3)]: {
    phases: [
      tieredWave("jungle-t3-wave-1", "Canopy Surge", 5, [
        { monsterId: "jungle-stalker", weight: 2 },
        { monsterId: "canopy-harrier", weight: 2 },
        { monsterId: "silverback", weight: 1 },
      ]),
    ],
  },

  // Tundra (density 8 → 3): two glacial bears + a frost caster
  [biomeTierKey("tundra", 3)]: {
    phases: [
      tieredWave("tundra-t3-wave-1", "Glacial Wall", 3, [
        { monsterId: "glacier-bear", weight: 2 },
        { monsterId: "rime-caster", weight: 1 },
      ]),
    ],
  },

  // Desert (density 8 → 3): even spread of the three desert archetypes
  [biomeTierKey("desert", 3)]: {
    phases: [
      tieredWave("desert-t3-wave-1", "Dune Ambush", 3, [
        { monsterId: "dune-stalker", weight: 1 },
        { monsterId: "desert-basilisk", weight: 1 },
        { monsterId: "sandweaver", weight: 1 },
      ]),
    ],
  },

  // Volcanic (density 18 → 6): mixed swarm; magma-brute excluded to avoid stacking the heaviest elite
  [biomeTierKey("volcanic", 3)]: {
    phases: [
      tieredWave("volcanic-t3-wave-1", "Eruption Wave", 6, [
        { monsterId: "ember-scuttler", weight: 2 },
        { monsterId: "cinder-hound", weight: 2 },
        { monsterId: "ash-slinger", weight: 2 },
      ]),
    ],
  },

  // ── T4 waves (2 waves each: horde first, then 2 elites) ───────────────────

  // Mountain (density 10): wave 1 = 5-mob assault of riders + aerial; wave 2 = mammoth + tyrant pair
  [biomeTierKey("mountain", 4)]: {
    phases: [
      tieredWave("mountain-t4-wave-1", "Summit Assault", 5, [
        { monsterId: "cragback-rhino", weight: 2 },
        { monsterId: "cliffside-roc", weight: 2 },
        { monsterId: "avalanche-tyrant", weight: 1 },
      ]),
      tieredWave("mountain-t4-wave-2", "Titan Vanguard", 2, [
        { monsterId: "granite-mammoth", weight: 1 },
        { monsterId: "avalanche-tyrant", weight: 1 },
      ]),
    ],
  },

  // Desert (density 8): wave 1 = 4-mob viper swarm + basilisk; wave 2 = tyrant + basilisk pair
  [biomeTierKey("desert", 4)]: {
    phases: [
      tieredWave("desert-t4-wave-1", "Dune Blitz", 4, [
        { monsterId: "sand-viper", weight: 2 },
        { monsterId: "sandspitter-cobra", weight: 1 },
        { monsterId: "dune-basilisk", weight: 1 },
      ]),
      tieredWave("desert-t4-wave-2", "Tyrant's Guard", 2, [
        { monsterId: "dune-tyrant", weight: 1 },
        { monsterId: "dune-basilisk", weight: 1 },
      ]),
    ],
  },

  // Jungle (density 15): wave 1 = 6-mob predator pack; wave 2 = apex silverback + constrictor
  [biomeTierKey("jungle", 4)]: {
    phases: [
      tieredWave("jungle-t4-wave-1", "Predator Rush", 6, [
        { monsterId: "hunting-panther", weight: 2 },
        { monsterId: "thornback-lizard", weight: 2 },
        { monsterId: "emerald-constrictor", weight: 2 },
      ]),
      tieredWave("jungle-t4-wave-2", "Apex Hunters", 2, [
        { monsterId: "apex-silverback", weight: 1 },
        { monsterId: "emerald-constrictor", weight: 1 },
      ]),
    ],
  },

  // Tundra (density 8): wave 1 = 4-mob frozen tide; wave 2 = behemoth + mastodon pair
  [biomeTierKey("tundra", 4)]: {
    phases: [
      tieredWave("tundra-t4-wave-1", "Frozen Tide", 4, [
        { monsterId: "hoarfrost-yeti", weight: 2 },
        { monsterId: "glacial-direbear", weight: 1 },
        { monsterId: "rime-tusk-mastodon", weight: 1 },
      ]),
      tieredWave("tundra-t4-wave-2", "Ancient Behemoths", 2, [
        { monsterId: "permafrost-behemoth", weight: 1 },
        { monsterId: "rime-tusk-mastodon", weight: 1 },
      ]),
    ],
  },

  // Volcanic (density 18): wave 1 = 7-mob eruption swarm; wave 2 = tortoise tank + magma-salamander
  [biomeTierKey("volcanic", 4)]: {
    phases: [
      tieredWave("volcanic-t4-wave-1", "Eruption Front", 7, [
        { monsterId: "ember-skink", weight: 2 },
        { monsterId: "infernal-direhound", weight: 2 },
        { monsterId: "ashspitter-salamander", weight: 2 },
        { monsterId: "magma-salamander", weight: 1 },
      ]),
      tieredWave("volcanic-t4-wave-2", "Infernal Core", 2, [
        { monsterId: "obsidian-tortoise", weight: 1 },
        { monsterId: "magma-salamander", weight: 1 },
      ]),
    ],
  },

  // Graveyard (density 20): wave 1 = 8-mob undead horde (all commons); wave 2 = 2 charnel-brutes
  [biomeTierKey("graveyard", 4)]: {
    phases: [
      tieredWave("graveyard-t4-wave-1", "Undead Swarm", 8, [
        { monsterId: "bone-crawler", weight: 2 },
        { monsterId: "plague-hound", weight: 2 },
        { monsterId: "carrion-vulture", weight: 2 },
        { monsterId: "plague-rat", weight: 2 },
      ]),
      tieredWave("graveyard-t4-wave-2", "Death's Guard", 2, [
        { monsterId: "charnel-brute", weight: 1 },
      ]),
    ],
  },

  // Trench (density 5): guardian count overridden — formula would give 10 but this biome is few + terrifying
  [biomeTierKey("trench", 4)]: {
    guardianPhase: { requiredKills: 4, maxAlive: 4 },
    phases: [
      tieredWave("trench-t4-wave-1", "Abyssal Surge", 3, [
        { monsterId: "abyssal-serpent", weight: 2 },
        { monsterId: "hadal-stalker", weight: 1 },
      ]),
      tieredWave("trench-t4-wave-2", "Deep Leviathans", 2, [
        { monsterId: "elder-leviathan", weight: 1 },
      ]),
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
  plains:    { attackSpeedMult: 1.08 },
  forest:    { attackSpeedMult: 1.25, moveSpeedMult: 1.12 },
  mountain:  { hpMult: 1.15, atkMult: 1.35 },
  swamp:     { hpMult: 1.05, atkMult: 1.05, dotMult: 1.3 },
  cave:      { hpMult: 1.3, atkMult: 1.15, drAdd: 0.05 },
  desert:    { hpMult: 1.2, atkMult: 1.15 },
  jungle:    { atkMult: 1.05, attackSpeedMult: 1.2, moveSpeedMult: 1.08, dotMult: 1.2 },
  tundra:    { hpMult: 1.2, atkMult: 1.05 },
  volcanic:  { hpMult: 1.0, atkMult: 1.25, attackSpeedMult: 1.1, dotMult: 1.25 },
  graveyard: { attackSpeedMult: 1.2, moveSpeedMult: 1.1, dotMult: 1.25 },
  trench:    { hpMult: 1.35, atkMult: 1.3 },
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

function tieredWave(
  id: string,
  label: string,
  count: number,
  monsterPool: Array<{ monsterId: string; weight: number }>,
): GauntletPhaseDef {
  return {
    id,
    label,
    requiredKills: count,
    maxAlive: count,
    spawnPattern: "wide-ring",
    monsterPool,
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
