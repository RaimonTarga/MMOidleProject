/**
 * Server-only ECS slice components.
 *
 * These components decompose the wire DTOs (`PlayerSnapshot` / `MonsterSnapshot`)
 * into focused, single-responsibility slices that are the entity-side source
 * of truth. The wire DTOs are reassembled byte-identical at broadcast time
 * via the helpers in `./projection.ts`.
 *
 * Naming scheme: two-word UpperCamelCase verb phrases (`HasPosition`,
 * `DealsDamage`, etc.) with corresponding lower-camel entity keys
 * (`hasPosition`, `dealsDamage`).
 *
 * Movement is stored as `HasPosition.current` plus `IsMoving.motion` — a
 * direction + remaining magnitude. `targetX` / `targetY` are wire-only and
 * computed from this vector at projection time.
 */
import type { MotionVector, Vec2 } from '../systems/spatial';
import type { EquipmentMap, EssenceType } from '../items';
import type { PassiveMap } from '../passives';
import type { PlayerBuff } from './buffs';
import type { SubVariant } from '../skillTree';
import type { CombatArchetype, MonsterAIState } from '../types/combat';

// ─── Shared by players and monsters ──────────────────────────────────────────

/** Current position and the node + speed parameters that govern movement. */
export interface HasPosition {
  current: Vec2;
  nodeId: string;
  speed: number;
}

/**
 * Remaining motion vector. `motion.magnitude === 0` means the entity is
 * stationary. The server is free to overwrite this each tick.
 */
export interface IsMoving {
  motion: MotionVector;
}

/** Hit points and any temporary shield buffers. */
export interface HasHealth {
  hp: number;
  maxHp: number;
  /** Optional regen rate (px/s); only players currently use this. */
  hpRegen?: number;
}

/** Outgoing damage values and visual attack style. */
export interface DealsDamage {
  attack: number;
  /** Flat bonus added per direct hit; players only (monsters use 0). */
  onHitDamage: number;
  attackStyle: string;
}

/** Attack range, cadence (cooldown), and current target. */
export interface PerformsAttack {
  attackRange: number;
  attackCooldown: number;
  lastAttackAt: number;
}

/** Flat plating + percentage damage reduction. */
export interface MitigatesDamage {
  plating: number;
  damageReduction: number;
}

/**
 * Hit-counter evasion. `threshold` of 0 disables the mechanic; every Nth
 * incoming hit is fully nullified.
 */
export interface EvadesHits {
  threshold: number;
  count: number;
}

/**
 * Client-facing status overlay slice. Holds the optional effect-overlay
 * maps that go on the wire, plus player-only buff/boss-effect lists.
 */
export interface HasStatus {
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  /** Players only — populated by `syncPlayerBuffs` each tick. */
  activeBuffs?: PlayerBuff[];
  /** Bosses only — populated by `bossScripts.ts` each tick. */
  bossEffects?: string[];
}

// ─── Player-specific ─────────────────────────────────────────────────────────

/** Runtime player identity (socket id + display name). */
export interface IsPlayer {
  id: string;
  name: string;
}

/** Auto-combat opt-in. */
export interface UsesAutocombat {
  auto: boolean;
}

/** Per-player long-term progression state. */
export interface TracksProgression {
  level: number;
  skillPoints: number;
  essences: Record<EssenceType, number>;
  biomeXP: Record<string, number>;
  biomeLevel: Record<string, number>;
  unlockedRecipes: string[];
  questProgress: Record<string, number>;
  playerTier: number;
  currentSkillTier: number;
}

/** Owned items, by inventory bag and equipment slot. */
export interface HoldsInventory {
  inventory: string[];
  equipment: EquipmentMap;
}

/** Skill tree unlocks plus the derived passive map and class selections. */
export interface UsesSkills {
  unlockedSkills: string[];
  passives: PassiveMap;
  selectedClass: string | null;
  selectedSubVariant: SubVariant | null;
  selectedRange: string | null;
  combatArchetype: CombatArchetype;
}

/** Sacred Cross weapon-effect mirrors for wire display. */
export interface ShowsSacred {
  sacredBuffActive: boolean;
  sacredBuffPct: number;
}

// ─── Monster-specific ─────────────────────────────────────────────────────────

/** Static-ish monster identity. */
export interface IsMonster {
  id: string;
  monsterTypeId: string;
  color: number;
  name: string;
  isBoss: boolean;
  behavior: string;
  combatArchetype?: CombatArchetype;
}

/** AI awareness ranges and current state. */
export interface HasAwareness {
  state: MonsterAIState;
  pullRange: number;
  leashRange: number;
}
