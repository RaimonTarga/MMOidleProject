/**
 * Networked ECS slice components.
 *
 * These are the component shapes allowed to cross the client/server boundary.
 * Server-only runtime internals such as AI controllers, combat state, boss
 * scripts, persistence metadata, and lookup-only status markers are intentionally
 * excluded from the network protocol.
 */
import type { MotionVector, Vec2 } from '../../systems/spatial';
import type { EquipmentMap, EssenceType } from '../../items';
import type { PassiveMap } from '../../passives';
import type { PlayerBuff } from '../combat/buffs';
import type { SubVariant } from '../../skillTree';
import type { CombatArchetype, MonsterAIState } from '../../types/combat';
import type { HasHitbox } from '../../hitbox/types';

export type { HasHitbox };

// ─── Shared by players and monsters ──────────────────────────────────────────

/** Current position and the node + speed parameters that govern movement. */
export interface HasPosition {
  current: Vec2;
  nodeId: string;
  speed: number;
}

/** Remaining motion vector. Absent means stationary. */
export interface IsMoving {
  motion: MotionVector;
}

/** Hit points and any player-only regen rate. */
export interface HasHealth {
  hp: number;
  maxHp: number;
  hpRegen?: number;
}

/** Outgoing damage values and visual attack style. */
export interface DealsDamage {
  attack: number;
  /** Flat bonus added per direct hit; players only (monsters use 0). */
  onHitDamage: number;
  attackStyle: string;
}

/** Attack range, cadence (cooldown), and current target timing. */
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

/** Hit-counter evasion. Present only while enabled. */
export interface EvadesHits {
  threshold: number;
  count: number;
}

/** Presentation-ready objective row for ultimate boss HUD. */
export interface UltimateObjectiveStatus {
  headline: string;
  detail?: string;
  current?: number;
  total?: number;
}

/** Active environmental hazard synced for ultimate boss HUD. */
export interface UltimateHazardStatus {
  effectId: string;
  dmgPerTick: number;
  tickMs: number;
  hint?: string;
}

/** Ultimate boss encounter HUD payload — populated server-side each tick. */
export interface UltimateStatus {
  stageLabel: string;
  stageIndex: number;
  stageCount: number;
  invulnerable: boolean;
  objective?: UltimateObjectiveStatus;
  hazard?: UltimateHazardStatus;
}

/** Client-facing status overlay and buff slice. */
export interface HasStatus {
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  /** Players only — populated by `syncPlayerBuffs` each tick. */
  activeBuffs?: PlayerBuff[];
  /** Bosses only — populated by `bossScripts.ts` each tick. */
  bossEffects?: string[];
  /** Ultimate bosses only — populated by ultimateEncounter sync. */
  ultimateStatus?: UltimateStatus;
  /** Encounter adds healing inside the void throne ring. */
  throneHealing?: boolean;
}

// ─── Player-specific ─────────────────────────────────────────────────────────

/** Runtime player identity (socket id + display name). */
export interface IsPlayer {
  id: string;
  name: string;
}

export type AutocombatPriorityMode = 'nearest' | 'damage' | 'threat' | 'balanced';

/** User-tunable server-side auto-combat behavior. */
export interface AutocombatConfig {
  /** Allow auto-combat to wake dormant ultimate encounters such as the Void Overlord. */
  engageUltimateBosses: boolean;
  /** Leave combat when low HP and losing the trade. */
  fleeWhenLow: boolean;
  /** HP fraction at or below which flee checks can trigger. */
  fleeHpPct: number;
  /** Preset score weights for target selection. */
  priorityMode: AutocombatPriorityMode;
  /** Maximum non-aggro acquisition distance before distance scoring. */
  acquireRadius: number;
  /** Bias same-party players toward their leader's current target. */
  focusLeaderTarget: boolean;
}

/** Auto-combat opt-in plus user-tunable targeting behavior. */
export interface UsesAutocombat extends AutocombatConfig {
  auto: boolean;
  autoTraverse: boolean;
}

/** What an auto-combat player is about to do — telegraphed via a thought bubble. */
export type AutoIntentKind = 'attack' | 'follow' | 'travel' | 'flee' | 'idle';

/**
 * Networked telegraph of an auto-combat player's next action. Present only
 * while the player has auto-combat enabled. Carries enough denormalized data
 * (monster type, destination biome) that the client can render the right icon
 * even for entities/nodes it cannot currently see.
 */
export interface HasAutoIntent {
  kind: AutoIntentKind;
  /** 'attack' — monster type id of the target; the bubble shows that monster's sprite. */
  targetMonsterTypeId?: string;
  /** 'follow' — leader being followed; the client mirrors that leader's bubble. */
  leaderId?: string;
  /** 'travel' — biome group of the destination node (icon source). */
  destBiomeGroup?: string;
}

/** One entry in a party roster (display identity). */
export interface PartyMember {
  id: string;
  name: string;
}

/**
 * Party membership. Present only while the player is in a party.
 * `leaderId === <own id>` means this player is the leader. `members` is the
 * full roster (recomputed and stamped onto every member on any change) so the
 * client can show the party even when a member is briefly in another zone.
 */
export interface InParty {
  leaderId: string;
  members: PartyMember[];
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
  /** Persisted boss clears keyed as "biomeGroup:tier" (e.g. "forest:1"). */
  bossesCleared: string[];
  /** Persisted non-boss map clears keyed by node id. */
  clearedNodes: string[];
}

/** Owned items, by inventory bag and equipment slot. */
export interface HoldsInventory {
  inventory: string[];
  equipment: EquipmentMap;
  /** Per-item-id upgrade level (+0..+MAX_UPGRADE). Absent key means +0. */
  itemUpgrades: Record<string, number>;
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
  isRanged?: boolean;
  combatArchetype?: CombatArchetype;
}

/** AI awareness ranges and current state. */
export interface HasAwareness {
  state: MonsterAIState;
  pullRange: number;
  leashRange: number;
}
