export * from './skillTree';
export * from './items';
export * from './itemDatabase';
export * from './recipeDatabase';
export * from './monsterDatabase';
export * from './biomeDatabase';
export * from './passives';
export * from './components/effects';
export * from './components/buffs';
export * from './systems/stats';
export * from './systems/skills';
export * from './systems/damage';
export * from './systems/spatial';

import type { EquipmentMap, EquipmentSlot, EssenceType } from './items';
import type { SubVariant } from './skillTree';
import type { PassiveMap } from './passives';
import type { BuffId } from './components/buffs';

// ─── Buff display ─────────────────────────────────────────────────────────────

/**
 * A single active buff entry, populated server-side each tick and sent to the
 * client for display. Only player buffs are tracked here — debuffs on monsters
 * are server-only.
 *
 * Resilience notes:
 *   - `id` will be used as the sprite key when icons are added later.
 *   - `durationPct` of -1 means the buff has no timer (permanent or count-based).
 *   - `stacks` of 1 means no stack badge is shown.
 *   - `color` is a CSS hex string used for the placeholder shape; replace with
 *     icon textures later without changing any other code.
 */
export interface PlayerBuff {
  /** Unique identifier — will double as the future icon sprite key. */
  id: BuffId;
  /** Short label shown beneath the icon (3–6 chars). */
  label: string;
  /** Stack count; 1 = single instance (no badge shown). */
  stacks: number;
  /** 0–100 remaining duration percentage; -1 = no timer. */
  durationPct: number;
  /** CSS hex color string for the placeholder shape, e.g. '#00ffaa'. */
  color: string;
}

// ─── Combat events ────────────────────────────────────────────────────────────

/**
 * Discrete combat events accumulated between broadcast ticks.
 * Bundled with each NodeSnapshot so the client can fire animations and log
 * entries reliably even when logic ticks outrun broadcast ticks.
 */
export type CombatEvent =
  | { kind: 'player-hit';  playerId: string; targetId: string; targetName: string; damage: number; empowered: boolean; execution: boolean; effects?: string[] }
  | { kind: 'player-kill'; playerId: string; targetId: string; targetName: string };

// ─── Combat archetype ─────────────────────────────────────────────────────────

/**
 * Determines which server-side combat mechanic module governs an entity.
 * null  = vanilla behavior (no archetype-specific mechanics).
 * Extend this union as new archetypes are implemented.
 */
export type CombatArchetype = 'cadence' | 'cooldown' | 'energy' | 'reload' | 'dot' | null;

// ─── Shield ───────────────────────────────────────────────────────────────────

/**
 * A temporary hit-point buffer that absorbs damage before real HP.
 * Sent to the client so the HP bar can render the shield layer.
 */
export interface ShieldState {
  /** Current remaining shield HP. */
  amount: number;
  /** Shield HP at creation — used for proportional bar rendering. */
  maxAmount: number;
  /**
   * Remaining duration in milliseconds.
   * -1 = permanent: never expires by timer, depletes only via damage.
   * >0 = timed: decremented each tick; shield is removed when this reaches 0.
   */
  remainingMs: number;
}

// ─── Entity shapes ────────────────────────────────────────────────────────────

export interface PlayerSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Server-authoritative destination; clients interpolate toward this. */
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  attack: number;
  /** Flat bonus damage added to each direct attack hit; not scaled by finisher multipliers or DoT. */
  onHitDamage: number;
  /** Flat damage reduction — subtracted from incoming damage before percentage. */
  plating: number;
  /** Percentage damage reduction applied after plating (0.0–1.0). */
  damageReduction: number;
  /**
   * Hit counter threshold for evasion. 0 = disabled.
   * Every N incoming hits, the Nth is fully nullified.
   */
  evasion: number;
  /** Current hit count toward the next evasion trigger. Mirrored from CombatState. */
  evasionCount: number;
  /** Active temporary shields. Damage is absorbed here before reaching HP. */
  shields: ShieldState[];
  /** Pixel radius within which this player can attack a monster. */
  attackRange: number;
  /** Milliseconds between discrete attacks. */
  attackCooldown: number;
  /** Server timestamp (ms) of the last attack — clients use for cooldown-bar progress. */
  lastAttackAt: number;
  /** Monster ID currently being attacked, or null when idle. */
  attackTargetId: string | null;
  /** Whether the server is driving this player toward the nearest monster. */
  auto: boolean;
  nodeId: string;
  /** Accumulated essence resources — keyed by type, granted by server on monster kills. */
  essences: Record<EssenceType, number>;
  /** Flat progression counter — incremented by 1 per kill. */
  level: number;
  /** Unspent points available to invest in the skill tree. */
  skillPoints: number;
  /** IDs of all unlocked skill tree nodes. */
  unlockedSkills: string[];
  /**
   * Accumulated numeric mechanic modifiers from skill nodes' mechanicEffects.
   * Rebuilt by recalculatePlayerStats from scratch on every stat recalculation.
   * Archetype systems read these at runtime to adjust behavior.
   * e.g. passives['cadence.threshold-mod'] = -2 means the cadence threshold is reduced by 2.
   *
   * Keys are typed via the PassiveKey union derived from the per-namespace
   * `*_KEYS` arrays in shared/src/passives.ts.
   */
  passives: PassiveMap;
  /**
   * Active cadence speed stacks (Accelerando passive).
   * Each stack reduces attackCooldown by a fixed amount, up to a cap.
   * Reset to 0 by recalculatePlayerStats (on equip/skill change) and on respawn.
   */
  cadenceSpeedStacks: number;
  /** ID of the class root node that was first unlocked, or null before class selection. */
  selectedClass: string | null;
  /** Which sub-variant (light / balanced / heavy) was chosen at tier 1, or null before that choice. */
  selectedSubVariant: SubVariant | null;
  /** ID of the range node chosen at tier 2 (range-close / range-mid / range-far), or null before that choice. */
  selectedRange: string | null;
  /**
   * The tier currently available to unlock. Starts at 0 (class root selection).
   * Increments by 1 on each successful unlock. Nodes are only unlockable when
   * node.tier === currentSkillTier.
   */
  currentSkillTier: number;
  /** HP recovered per second when out of combat. Modified by equipment. */
  hpRegen: number;
  /** Movement speed in px/s. Modified by equipment. */
  speed: number;
  /** Visual style used for attack animations on the client. */
  attackStyle: string;
  /** Definition IDs of items carried but not equipped. */
  inventory: string[];
  /** Currently equipped items, one per slot. Null means nothing equipped. */
  equipment: EquipmentMap;
  /**
   * Accumulated XP per biome group. Incremented server-side on every kill;
   * capped when biomeLevel[group] reaches GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER[playerTier].
   * e.g. { forest: 350 }
   */
  biomeXP: Record<string, number>;
  /**
   * Current level per biome group, derived from biomeXP.
   * Each level unlocks one or more recipes in that group.
   * e.g. { forest: 3 } means forest biome level 3 has been reached.
   */
  biomeLevel: Record<string, number>;
  /**
   * Recipe IDs the player has unlocked. A recipe is added automatically when
   * the required biomeLevel is reached. Recipes can be crafted from anywhere
   * once unlocked.
   */
  unlockedRecipes: string[];
  /**
   * Which server-side combat mechanic module governs this player.
   * null = vanilla behavior; set server-side only, sent to client for future UI use.
   */
  combatArchetype: CombatArchetype;
  /**
   * Current position in the cadence cycle (0 … cadenceThreshold-1).
   * Reset to 0 after each trigger. Mirrored to PlayerSnapshot every hit so
   * the client can display a live progress bar without extra network overhead.
   */
  cadenceCount: number;
  /**
   * Hits required to complete one cadence cycle.
   * 0 means this player is not using the cadence archetype.
   */
  cadenceThreshold: number;
  /**
   * True when an empowered (finisher) attack has been armed and will fire on
   * the next hit. The cadenceCount is reset to 0 at arming time, so without
   * this flag the client cannot distinguish "start of cycle" from "finisher next".
   */
  cadenceEmpoweredArmed: boolean;
  /** Current ammo count for reload-archetype players. 0 = reloading. */
  ammoCount: number;
  /** Max ammo capacity. 0 means this player is not using the reload archetype. */
  ammoMax: number;
  /** Reload Laser T3: current heat percentage, 0-100. */
  heatPct: number;
  /** Reload Laser T3: true while the laser is locked out and cooling to 0%. */
  laserOverheated: boolean;
  /** Cooldown archetype: true when the execution strike is armed and the next hit will trigger it. */
  executionReady: boolean;
  /** Cooldown archetype: preparation progress 0–100 toward the next execution window. 100 = ready. */
  executionCooldownPct: number;
  /** Energy archetype: current energy level, 0–100. Fills on hits; empowers at 100. */
  energyCount: number;
  /** Energy archetype: true when an empowered attack is armed (consumed on next hit). */
  empoweredReady: boolean;
  /** DoT archetype: number of DoT stacks currently on the player's attack target (0 if no target). */
  targetDotStacks: number;
  /** DoT archetype (Freezing Cold): chill stacks on the attack target (0 if no target or no chill). */
  targetChillStacks: number;
  /** Sacred Cross weapon: true while the divine burst buff is active. */
  sacredBuffActive: boolean;
  /** Sacred Cross weapon: 0–100 progress toward the next buff window (100 = buff active). */
  sacredBuffPct: number;
  /**
   * Cooldown Channeled Beam: true while the channel is active.
   * Server locks movement and skips auto-attacks while this is true.
   * Client should display a channel bar and block move inputs.
   */
  isChanneling: boolean;
  /** Channeled Beam progress 0–100 through the channel window. 0 when not channeling. */
  channelingPct: number;
  /** Client effect overlays currently active on this player, keyed by effect id with remaining ms. */
  activeEffects?: Record<string, number>;
  /** Client effect overlays pinned to a specific frame, keyed by effect id. */
  activeEffectFrames?: Record<string, number>;
  /**
   * Active buffs on this player, populated server-side each tick by syncPlayerBuffs.
   * Only buffs are tracked here — monster debuffs are server-only.
   * The client renders these verbatim; no client-side buff logic is needed.
   */
  activeBuffs: PlayerBuff[];

  // ── Quest progression ────────────────────────────────────────────────────

  /**
   * Kill count toward each active quest. Key = questId, value = kills so far.
   * Missing key = 0 progress. Quest is complete when value >= quest.killsRequired.
   */
  questProgress: Record<string, number>;
  /**
   * Player tier, advanced by completing the tier quest for the current tier.
   * Each tier grants 1 skill point. Starts at 0.
   */
  playerTier: number;
}

/**
 * All valid AI states for a monster.
 * The state machine starts at 'idle'; 'chasing', 'attacking', 'returning'
 * are plugged in when combat AI is added.
 */
export type MonsterAIState =
  | 'idle'
  | 'wandering'
  | 'chasing'
  | 'attacking'
  | 'returning'
  | 'knocked-back';

export interface MonsterSnapshot {
  id: string;
  /** Key into MONSTER_DATABASE — drives stat lookup and reward lookup. */
  monsterTypeId: string;
  /** Placeholder rectangle color, copied from MonsterDefinition.color at spawn. */
  color: number;
  name: string;
  x: number;
  y: number;
  /** Server-authoritative destination; clients interpolate toward this. */
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  attack: number;
  /** Flat damage reduction — subtracted from incoming damage before percentage. */
  plating: number;
  /** Percentage damage reduction applied after plating (0.0–1.0). Default 0. */
  damageReduction: number;
  /** Movement speed in px/s — clients use this for accurate interpolation. */
  speed: number;
  /** Current AI state — clients can use for animation/visual cues. */
  state: MonsterAIState;
  /** Pixel radius within which this monster notices and chases a player. */
  pullRange: number;
  /** Pixel radius at which this monster gives up and returns to spawn. */
  leashRange: number;
  /** Pixel radius within which this monster deals damage to its target. */
  attackRange: number;
  /** Milliseconds between discrete attacks. */
  attackCooldown: number;
  /** Server timestamp (ms) of the last attack — clients use for cooldown-bar progress. */
  lastAttackAt: number;
  /** Player ID currently being attacked, or null when not in melee contact. */
  attackTargetId: string | null;
  nodeId: string;
  /** Visual style used for attack animations on the client. */
  attackStyle: string;
  /** True for dungeon boss monsters — clients render them larger with a distinct label. */
  isBoss: boolean;
  /** Combat style — 'melee' lunges toward target on attack; extend union for 'ranged' / 'caster'. */
  behavior: string;
  /** Future: allows elite/boss monsters to use archetype mechanics. */
  combatArchetype?: CombatArchetype;
  /** Client effect overlays currently active on this monster, keyed by effect id with remaining ms. */
  activeEffects?: Record<string, number>;
  /** Client effect overlays pinned to a specific frame, keyed by effect id. */
  activeEffectFrames?: Record<string, number>;
  /**
   * Names of currently active boss script effects (e.g. 'enrage', 'shield', 'regen').
   * Populated by bossScripts.ts each tick; only present on isBoss monsters.
   * Clients can use this to render buff icons or visual indicators.
   */
  bossEffects?: string[];
}

/**
 * @deprecated Use `PlayerSnapshot`. This alias exists only to keep the
 * unmodified client building during the server ECS migration; it is removed
 * by `client.md` C7 after C1–C6 finish migrating client imports.
 */
export type PlayerState = PlayerSnapshot;

/**
 * @deprecated Use `MonsterSnapshot`. This alias exists only to keep the
 * unmodified client building during the server ECS migration; it is removed
 * by `client.md` C7 after C1–C6 finish migrating client imports.
 */
export type MonsterState = MonsterSnapshot;

// ─── Node / zone definitions ──────────────────────────────────────────────────

export type NodeDirection = 'north' | 'south' | 'east' | 'west';

export interface NodeDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Which biome family this node belongs to (e.g. "forest", "mountain"). */
  biomeGroup: string;
  /** Difficulty tier within the biome family — higher tiers have harder mobs. */
  biomeTier: number;
  /** Adjacent node ids keyed by the direction of travel. Only present exits are listed. */
  exits: Partial<Record<NodeDirection, string>>;
  /**
   * True for dungeon variant nodes. Enemies within deal extra damage and have more HP.
   * One boss monster is maintained alongside the normal population.
   */
  isDungeon: boolean;
}

export const TEST_ROOM_NODE_ID = 'node-test-room';

/**
 * 11×11 grid map. Center is node-5-5 (T0 clearing).
 * Chebyshev distance from center determines tier band:
 *   0        — clearing (T0)                    1 node
 *   1–2      — T1 biomes (24 nodes)             forest, mountain, plains, swamp, cave, jungle
 *   3        — T2 biomes (24 nodes)             + tundra, desert
 *   4        — T3 biomes (32 nodes)             + volcanic, necropolis (first appearance)
 *   5        — T4 biomes (40 nodes)             + abyss (first appearance)
 *
 * Each tier has exactly one dungeon per biome present at that tier.
 * Geographic layout:
 *   North (rows 0–2)         — tundra / mountain
 *   NE   (rows 0–4, cols 7+) — forest / plains
 *   East (col 10)            — plains / desert / jungle
 *   SE   (rows 8–10, cols 7+)— jungle
 *   South (rows 9–10)        — volcanic / necropolis / abyss
 *   West  (col 0)            — swamp / cave / abyss
 *   NW   (rows 0–4, cols 0–4)— swamp / tundra
 */
export const NODE_BIOMES: Record<string, { biomeGroup: string; biomeTier: number; isDungeon?: boolean }> = {

  // ── T0 center — starting clearing ─────────────────────────────────────────
  'node-5-5': { biomeGroup: 'clearing',   biomeTier: 0 },
  [TEST_ROOM_NODE_ID]: { biomeGroup: 'testroom', biomeTier: 0 },

  // ── T1 band (Chebyshev distance 1–2) — 6 biomes × 4 nodes ────────────────
  // Forest T1 — NE quadrant
  'node-4-6': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-4-7': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-3-6': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-3-7': { biomeGroup: 'forest',     biomeTier: 1, isDungeon: true },   // forest-warden

  // Mountain T1 — North
  'node-4-5': { biomeGroup: 'mountain',   biomeTier: 1 },
  'node-3-5': { biomeGroup: 'mountain',   biomeTier: 1, isDungeon: true },   // mountain-sentinel
  'node-4-4': { biomeGroup: 'mountain',   biomeTier: 1 },
  'node-3-4': { biomeGroup: 'mountain',   biomeTier: 1 },

  // Plains T1 — East
  'node-5-6': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-5-7': { biomeGroup: 'plains',     biomeTier: 1, isDungeon: true },   // plains-champion
  'node-6-6': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-6-7': { biomeGroup: 'plains',     biomeTier: 1 },

  // Swamp T1 — NW
  'node-5-4': { biomeGroup: 'swamp',      biomeTier: 1 },
  'node-5-3': { biomeGroup: 'swamp',      biomeTier: 1, isDungeon: true },   // bog-sovereign
  'node-4-3': { biomeGroup: 'swamp',      biomeTier: 1 },
  'node-3-3': { biomeGroup: 'swamp',      biomeTier: 1 },

  // Cave T1 — West
  'node-6-4': { biomeGroup: 'cave',       biomeTier: 1 },
  'node-6-3': { biomeGroup: 'cave',       biomeTier: 1, isDungeon: true },   // cave-sentinel
  'node-7-3': { biomeGroup: 'cave',       biomeTier: 1 },
  'node-7-4': { biomeGroup: 'cave',       biomeTier: 1 },

  // Plains T1 — SE extension (jungle moved to T2+)
  'node-6-5': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-7-5': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-7-6': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-7-7': { biomeGroup: 'plains',     biomeTier: 1 },

  // ── T2 band (Chebyshev distance 3) — 7 biomes, 4 dungeons ──────────────────
  // Swamp T2 — NW (5 nodes: 3 original + 2 ex-tundra slots folded in)
  'node-2-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-2-3': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-3-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-4-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-5-2': { biomeGroup: 'swamp',      biomeTier: 2 },

  // Mountain T2 — North (4 nodes: 3 original + 1 ex-tundra slot folded in)
  'node-2-4': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-5': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-6': { biomeGroup: 'mountain',   biomeTier: 2, isDungeon: true },
  'node-2-7': { biomeGroup: 'mountain',   biomeTier: 2 },

  // Forest T2 — NE
  'node-2-8': { biomeGroup: 'forest',     biomeTier: 2 },
  'node-3-8': { biomeGroup: 'forest',     biomeTier: 2, isDungeon: true },
  'node-4-8': { biomeGroup: 'forest',     biomeTier: 2 },

  // Plains T2 — East
  'node-5-8': { biomeGroup: 'plains',     biomeTier: 2 },
  'node-6-8': { biomeGroup: 'plains',     biomeTier: 2 },
  'node-7-8': { biomeGroup: 'plains',     biomeTier: 2 },

  // Desert T2 — SE (new biome)
  'node-8-6': { biomeGroup: 'desert',     biomeTier: 2 },
  'node-8-7': { biomeGroup: 'desert',     biomeTier: 2, isDungeon: true },
  'node-8-8': { biomeGroup: 'desert',     biomeTier: 2 },

  // Jungle T2 — South (new biome)
  'node-8-3': { biomeGroup: 'jungle',     biomeTier: 2 },
  'node-8-4': { biomeGroup: 'jungle',     biomeTier: 2, isDungeon: true },
  'node-8-5': { biomeGroup: 'jungle',     biomeTier: 2 },

  // Cave T2 — SW
  'node-6-2': { biomeGroup: 'cave',       biomeTier: 2 },
  'node-7-2': { biomeGroup: 'cave',       biomeTier: 2 },
  'node-8-2': { biomeGroup: 'cave',       biomeTier: 2 },

  // ── T3 band (Chebyshev distance 4) — 9 biomes, 4 dungeons ──────────────────
  // Tundra T3 — NW (new biome, 4 nodes)
  'node-1-1': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-1-2': { biomeGroup: 'tundra',     biomeTier: 3, isDungeon: true },
  'node-1-3': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-2-1': { biomeGroup: 'tundra',     biomeTier: 3 },

  // Mountain T3 — North
  'node-1-4': { biomeGroup: 'mountain',   biomeTier: 3 },
  'node-1-5': { biomeGroup: 'mountain',   biomeTier: 3, isDungeon: true },
  'node-1-6': { biomeGroup: 'mountain',   biomeTier: 3 },

  // Forest T3 — NE
  'node-1-7': { biomeGroup: 'forest',     biomeTier: 3 },
  'node-1-8': { biomeGroup: 'forest',     biomeTier: 3 },
  'node-1-9': { biomeGroup: 'forest',     biomeTier: 3 },

  // Plains T3 — East
  'node-2-9': { biomeGroup: 'plains',     biomeTier: 3 },
  'node-3-9': { biomeGroup: 'plains',     biomeTier: 3 },
  'node-4-9': { biomeGroup: 'plains',     biomeTier: 3 },

  // Desert T3 — East-SE
  'node-5-9': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-6-9': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-7-9': { biomeGroup: 'desert',     biomeTier: 3 },

  // Jungle T3 — SE
  'node-8-9': { biomeGroup: 'jungle',     biomeTier: 3 },
  'node-9-8': { biomeGroup: 'jungle',     biomeTier: 3 },
  'node-9-9': { biomeGroup: 'jungle',     biomeTier: 3 },

  // Volcanic T3 — South (new biome, 5 nodes: 3 original + 2 ex-necropolis slots)
  'node-9-3': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-9-4': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-9-5': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-9-6': { biomeGroup: 'volcanic',   biomeTier: 3, isDungeon: true },
  'node-9-7': { biomeGroup: 'volcanic',   biomeTier: 3 },

  // Cave T3 — West (4 nodes: 3 original + 1 ex-necropolis slot)
  'node-7-1': { biomeGroup: 'cave',       biomeTier: 3 },
  'node-8-1': { biomeGroup: 'cave',       biomeTier: 3, isDungeon: true },
  'node-9-1': { biomeGroup: 'cave',       biomeTier: 3 },
  'node-9-2': { biomeGroup: 'cave',       biomeTier: 3 },

  // Swamp T3 — NW
  'node-3-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-4-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-5-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-6-1': { biomeGroup: 'swamp',      biomeTier: 3 },

  // ── T4 band (Chebyshev distance 5) — 11 biomes, 4 dungeons ────────────────
  // Tundra T4 — NW corner (row 0, cols 0–3)
  'node-0-0': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-1': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-2': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-3': { biomeGroup: 'tundra',     biomeTier: 4 },

  // Mountain T4 — North center (row 0, cols 4–6)
  'node-0-4': { biomeGroup: 'mountain',   biomeTier: 4 },
  'node-0-5': { biomeGroup: 'mountain',   biomeTier: 4, isDungeon: true },
  'node-0-6': { biomeGroup: 'mountain',   biomeTier: 4 },

  // Forest T4 — NE (row 0, cols 7–10)
  'node-0-7':  { biomeGroup: 'forest',    biomeTier: 4 },
  'node-0-8':  { biomeGroup: 'forest',    biomeTier: 4 },
  'node-0-9':  { biomeGroup: 'forest',    biomeTier: 4, isDungeon: true },
  'node-0-10': { biomeGroup: 'forest',    biomeTier: 4 },

  // Plains T4 — East (col 10, rows 1–4)
  'node-1-10': { biomeGroup: 'plains',    biomeTier: 4 },
  'node-2-10': { biomeGroup: 'plains',    biomeTier: 4 },
  'node-3-10': { biomeGroup: 'plains',    biomeTier: 4 },
  'node-4-10': { biomeGroup: 'plains',    biomeTier: 4 },

  // Desert T4 — East (col 10, rows 5–7)
  'node-5-10': { biomeGroup: 'desert',    biomeTier: 4 },
  'node-6-10': { biomeGroup: 'desert',    biomeTier: 4 },
  'node-7-10': { biomeGroup: 'desert',    biomeTier: 4 },

  // Jungle T4 — SE (col 10 rows 8–10 + row 10 cols 8–9)
  'node-8-10':  { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-9-10':  { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-10-10': { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-10-9':  { biomeGroup: 'jungle',   biomeTier: 4 },
  'node-10-8':  { biomeGroup: 'jungle',   biomeTier: 4 },

  // Volcanic T4 — South (row 10, cols 5–7)
  'node-10-5': { biomeGroup: 'volcanic',  biomeTier: 4 },
  'node-10-6': { biomeGroup: 'volcanic',  biomeTier: 4 },
  'node-10-7': { biomeGroup: 'volcanic',  biomeTier: 4 },

  // Necropolis T4 — SW (row 10, cols 2–4; first appearance)
  'node-10-2': { biomeGroup: 'necropolis', biomeTier: 4 },
  'node-10-3': { biomeGroup: 'necropolis', biomeTier: 4, isDungeon: true },
  'node-10-4': { biomeGroup: 'necropolis', biomeTier: 4 },

  // Abyss T4 — SW corner (row 10 cols 0–1 + col 0 rows 8–9; first appearance)
  'node-10-0': { biomeGroup: 'abyss',     biomeTier: 4 },
  'node-10-1': { biomeGroup: 'abyss',     biomeTier: 4 },
  'node-9-0':  { biomeGroup: 'abyss',     biomeTier: 4, isDungeon: true },
  'node-8-0':  { biomeGroup: 'abyss',     biomeTier: 4 },

  // Cave T4 — West (col 0, rows 5–7)
  'node-5-0': { biomeGroup: 'cave',       biomeTier: 4 },
  'node-6-0': { biomeGroup: 'cave',       biomeTier: 4 },
  'node-7-0': { biomeGroup: 'cave',       biomeTier: 4 },

  // Swamp T4 — NW (col 0, rows 1–4)
  'node-1-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-2-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-3-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-4-0': { biomeGroup: 'swamp',      biomeTier: 4 },
};

/** Full world state for a node, sent every tick and on join. */
export interface NodeSnapshot {
  players: PlayerSnapshot[];
  monsters: MonsterSnapshot[];
  /** Combat events accumulated since the last broadcast — used for client animations and combat log. */
  events: CombatEvent[];
}

// ─── Quest system ─────────────────────────────────────────────────────────────

/**
 * A quest that requires the player to kill a set number of specific monsters.
 * Completing the quest advances the player's tier by 1 and grants 1 skill point.
 */
export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  /**
   * The player tier at which this quest is active.
   * Completing it advances the player to tierRequired + 1.
   */
  tierRequired: number;
  /** Monster type IDs (keys in MONSTER_DATABASE) that count toward this quest. */
  targetMonsterTypes: string[];
  /** Total kills required to complete the quest. */
  killsRequired: number;
}

/**
 * All tier-advancement quests — one per tier.
 * Each quest requires slaying any ONE of the dungeon bosses found at that tier.
 * Boss list matches bossPoolByTier entries in biomeDatabase for that biomeTier.
 */
export const QUEST_DATABASE = new Map<string, QuestDefinition>([
  ['tier-0', {
    id: 'tier-0',
    name: 'First Blood',
    description: 'Prove yourself in the Clearing by slaying 10 Tiny Slimes.',
    tierRequired: 0,
    targetMonsterTypes: ['tiny-slime'],
    killsRequired: 10,
  }],
  ['tier-1', {
    id: 'tier-1',
    name: 'Dungeon Delver',
    description: 'Seek out a Tier 1 dungeon and slay its guardian boss.',
    tierRequired: 1,
    // All T1 dungeon bosses — one per biome at biomeTier 1 (5 biomes)
    targetMonsterTypes: [
      'forest-warden', 'mountain-sentinel', 'plains-champion',
      'bog-sovereign', 'cave-sentinel',
    ],
    killsRequired: 1,
  }],
  ['tier-2', {
    id: 'tier-2',
    name: 'Zone Conqueror',
    description: 'Conquer a Tier 2 dungeon by defeating its mighty guardian.',
    tierRequired: 2,
    // All T2 dungeon bosses — one per biome at biomeTier 2
    targetMonsterTypes: [
      'glacial-colossus', 'stone-warden', 'forest-elder', 'plains-overlord',
      'desert-pharaoh', 'jungle-colossus', 'cave-terror', 'mire-lord',
    ],
    killsRequired: 1,
  }],
  ['tier-3', {
    id: 'tier-3',
    name: "Veteran's Trial",
    description: 'Prove your might against an elite Tier 3 dungeon lord.',
    tierRequired: 3,
    // All T3 dungeon bosses — one per biome at biomeTier 3
    targetMonsterTypes: [
      'frost-colossus', 'peak-titan', 'elder-forest-warden', 'plains-warlord',
      'sand-emperor', 'jungle-titan-lord', 'volcanic-titan', 'lich-king',
      'cave-overlord', 'bog-ancient',
    ],
    killsRequired: 1,
  }],
  ['tier-4', {
    id: 'tier-4',
    name: 'Final Reckoning',
    description: 'Face the most fearsome dungeon lords of Tier 4 and emerge victorious.',
    tierRequired: 4,
    // All T4 dungeon bosses — one per biome at biomeTier 4
    targetMonsterTypes: [
      'glacial-titan', 'mountain-titan', 'elder-treant-lord', 'stampede-emperor',
      'desert-eternal', 'jungle-ancient-lord', 'inferno-lord', 'undying-lord',
      'void-titan', 'cave-titan', 'swamp-sovereign',
    ],
    killsRequired: 1,
  }],
]);

// ─── Socket.IO event maps ─────────────────────────────────────────────────────

/** Events the server sends to clients */
export interface ServerToClientEvents {
  /** Full snapshot sent to a newly connected player */
  'state:sync': (snapshot: NodeSnapshot) => void;
  /** Authoritative world snapshot broadcast every server tick */
  'node:state': (snapshot: NodeSnapshot) => void;
  /** Immediate result of a crafting attempt — success or reason for failure. */
  'crafting:result': (result: { success: boolean; reason?: string }) => void;
  /** Sent to a player whose HP reached zero — they are simultaneously respawned server-side. */
  'player:died': () => void;
  /** Sent when a player unlocks a skill and advances to the next tier. */
  'player:ascended': (tier: number) => void;
}

/** Events clients send to the server */
export interface ClientToServerEvents {
  /** Set the player's movement destination (click-to-move or AI-issued). */
  'player:move': (position: { x: number; y: number }) => void;
  /** Enable or disable server-side auto-targeting for this player. */
  'player:setAuto': (enabled: boolean) => void;
  /** Request to unlock a skill tree node by ID. Server validates and applies. */
  'player:unlockSkill': (skillId: string) => void;
  /** Equip an item from inventory by its definition ID. */
  'inventory:equipItem': (definitionId: string) => void;
  /** Move the item in the given slot back to inventory. */
  'inventory:unequip': (slot: EquipmentSlot) => void;
  /** Attempt to craft a recipe by ID. Server validates and applies. */
  'crafting:craftRecipe': (recipeId: string) => void;
  /** Dev-only: teleport the player to the debug test room. Server ignores in production. */
  'debug:goToTestRoom': () => void;
  /** Dev-only: leave the debug test room and return to the clearing. Server ignores in production. */
  'debug:leaveTestRoom': () => void;
}

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Logical pixel dimensions of a single node (the scrollable world area) */
  NODE_WIDTH:  3200,
  NODE_HEIGHT: 2400,
  /** Half-width of each cardinal gate opening along the border edge */
  GATE_HALF: 160,
  /** Simulation tick rate in Hz — controls attack timing, AI, movement precision */
  LOGIC_TICK_RATE: 10,
  /** State broadcast rate in Hz — controls how often clients receive snapshots */
  BROADCAST_TICK_RATE: 5,
  /** Player movement speed in pixels per second */
  PLAYER_SPEED: 120,
  /** Maximum number of monsters alive in a node at any time */
  MONSTERS_PER_NODE: 12,

  // ── Player base stats ────────────────────────────────────────────────────────
  PLAYER_MAX_HP:  100,
  PLAYER_ATTACK:  15,  // damage per hit (before plating)
  PLAYER_PLATING: 2,
  /** Pixel radius within which a player can hit a monster */
  PLAYER_ATTACK_RANGE: 60,
  /** Milliseconds between attacks when unarmed. Overridden by weapon attacksPerSecond when a weapon is equipped. */
  PLAYER_ATTACK_COOLDOWN: 3000,
  /** Out-of-combat HP regen as a percentage of maxHp per second (10 = 10%/s). */
  PLAYER_HP_REGEN: 10,
  /** Milliseconds after leaving combat (no monster aggroed) before player regen starts */
  COMBAT_REGEN_DELAY: 4000,
  /** Milliseconds after last aggro drop before a monster starts regenerating */
  MONSTER_REGEN_DELAY: 5000,
  /** Monster OOC regen rate as a percentage of maxHp per second */
  MONSTER_REGEN_RATE: 20,

  // ── Spawn ─────────────────────────────────────────────────────────────────────
  /** Minimum pixel distance between two monsters at spawn time */
  MONSTER_MIN_SPAWN_DIST: 120,

  // ── AoE splash ────────────────────────────────────────────────────────────────
  /** Pixel radius of the empowered-attack splash, centered on the primary target. */
  EMPOWERED_AOE_RADIUS: 80,
  /**
   * Fraction of the attacker's raw `attack` stat dealt as splash damage to each
   * secondary target. Using the attack stat (not the empowered hit damage) keeps
   * splash independent of each archetype's multiplier.
   */
  EMPOWERED_AOE_MULT: 0.5,

  // ── Biome XP / recipe unlock system ──────────────────────────────────────
  /**
   * XP needed to reach level 1. Higher levels cost BASE * level^EXPONENT total XP.
   * Use biomeXpForLevel(n) from this package to compute thresholds.
   */
  BIOME_XP_BASE: 80,
  /**
   * Power-curve exponent. 1.7 means each level costs noticeably more than the last.
   * Tune alongside BIOME_XP_BASE and BIOME_XP_BY_NODE_TIER.
   */
  BIOME_XP_EXPONENT: 1.7,
  /** XP granted per kill, indexed by the node's biomeTier (0–5). */
  BIOME_XP_BY_NODE_TIER: [5, 10, 20, 35, 55, 80] as unknown as readonly number[],
  /** Maximum biome level attainable at each playerTier (index = playerTier). T2 recipes start at level 6. */
  BIOME_LEVEL_CAP_BY_TIER: [2, 5, 10, 15, 20, 25, 30, 35] as unknown as readonly number[],
} as const;

/**
 * Total XP required to reach biome level `n` (from 0).
 * Formula: round(BASE × n ^ EXPONENT)
 * Example with defaults (BASE=80, EXP=1.7):
 *   Lv 1 →   80 XP   (8 T1 kills)
 *   Lv 2 →  260 XP   (26 T1 kills total)
 *   Lv 3 →  518 XP   (52 T1 kills total)
 *   Lv 4 →  845 XP   (85 T1 kills total)
 *   Lv 6 → 1831 XP   (92 T2 kills total)
 *   Lv 9 → 3848 XP   (192 T2 kills total)
 */
export function biomeXpForLevel(n: number): number {
  if (n <= 0) return 0;
  return Math.round(GAME_CONFIG.BIOME_XP_BASE * Math.pow(n, GAME_CONFIG.BIOME_XP_EXPONENT));
}
