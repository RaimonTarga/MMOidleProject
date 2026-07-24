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
import type { MonsterBehavior } from '../../data/monsters/behavior';
import type { HasHitbox } from '../../hitbox/types';
import type { EquippedRule } from '../../runeDatabase';
import type { EquippedAbilities } from '../../abilities';
import type { EquippedStances } from '../../stances';
import type { EquippedRites } from '../../rites';

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

/**
 * Deterministic evasion. Present only while the player has any evasion.
 *
 * `dodgeRate` is a per-hit rate (NOT a probability — evasion is fully
 * deterministic). A server-side fractional accumulator in `tracksCombat` adds
 * `dodgeRate` each incoming hit and evades when it crosses 1.0. `evadeMitigation`
 * is the fraction of damage avoided on an evaded hit (1.0 = full avoid).
 */
export interface EvadesHits {
  dodgeRate: number;
  evadeMitigation: number;
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

/**
 * Compact debuff descriptor for the target frame. Populated only for monsters
 * that are currently a player's attack target (see the server targetStatus
 * mirror), so the HUD can show what's afflicting the thing you're fighting.
 */
export interface TargetStatusView {
  id: string;
  stacks: number;
  /** Remaining duration (ms); -1 = permanent. */
  remainingMs: number;
  /** Total duration when known (from effect.data.totalMs); 0 = unknown → countdown, no sweep. */
  totalMs: number;
}

/** Client-facing status overlay and buff slice. */
export interface HasStatus {
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  /** Players only — populated by `syncPlayerBuffs` each tick. */
  activeBuffs?: PlayerBuff[];
  /** Bosses only — populated by `bossScripts.ts` each tick. */
  bossEffects?: string[];
  /** Monsters only — current debuffs for the target frame (targeted monsters). */
  targetStatus?: TargetStatusView[];
  /** Players only — total pending damage-over-time on the player (HP-bar forecast). */
  incomingDot?: number;
  /** Players only — pending heal-over-time (regen/absorb pools) for the HP bar. */
  pendingHeal?: number;
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

export type AutocombatPriorityMode =
  | 'nearest'
  | 'lowest-hp'
  | 'highest-max-hp'
  | 'damage'
  | 'threat'
  | 'balanced';

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

/** What a server-directed player is about to do — telegraphed via HUD/bubbles. */
export type AutoIntentKind = 'attack' | 'follow' | 'travel' | 'flee' | 'idle';

/**
 * Networked telegraph of the player's current server-directed action. This can
 * remain present with auto-combat off while manual map navigation or an already
 * engaged basic attack continues. The explanation text is authored by the
 * server; clients only format the structured action target.
 */
export interface HasAutoIntent {
  kind: AutoIntentKind;
  /** Concise authoritative explanation of why this action currently owns. */
  reason: string;
  /** Governing automation source or named rune rule. */
  source: string;
  /** 'attack' — monster type id of the target; the bubble shows that monster's sprite. */
  targetMonsterTypeId?: string;
  /** 'follow' — leader being followed; the client mirrors that leader's bubble. */
  leaderId?: string;
  /** 'travel' — biome group of the destination node (icon source). */
  destBiomeGroup?: string;
}

/** Active player emote — present only while the emote is playing. */
export interface HasEmote {
  emoteId: string;
  expiresAt: number;
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
  /**
   * Biome catalysts wallet, keyed by biome group (e.g. `forest`). One catalyst
   * per biome group, uncapped. Minted from `catalystProgress` crossing a
   * threshold; spent alongside essence on catalyst-gated recipes/upgrades.
   */
  catalysts: Record<string, number>;
  /**
   * Accumulating kill-progress toward the next catalyst, keyed by biome group.
   * Each kill adds the monster's catalyst weight; crossing
   * `GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT` mints 1 catalyst and carries the
   * remainder.
   */
  catalystProgress: Record<string, number>;
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
  /** Every rune condition + action fragment id the player has found. */
  runesOwned: string[];
  /** One-time rune forge recipes the player has crafted. */
  runeRecipesCrafted: string[];
  /** Assembled rune rules, ordered (loadout). Drives the auto-combat config. */
  runesEquipped: EquippedRule[];
  /**
   * Abilities the player has learned (crafted) — the slottable pool
   * (system rework Step 7). Stored here like runes (build/loadout data).
   */
  knownAbilities: string[];
  /**
   * Equipped abilities as ordered lists per slot kind — Technique (offensive)
   * and Guard (defensive). List order is arbitration priority; each list's
   * length is bounded by `abilitySlotCount(playerTier)`.
   */
  equippedAbilities: EquippedAbilities;
  /**
   * Stances the player has learned (crafted) — the slottable pool
   * (system rework Step 10). Stored here like runes/abilities (build/loadout data).
   */
  knownStances: string[];
  /** Equipped stances by slot: default (active posture) + reactive (auto-switch target). */
  equippedStances: EquippedStances;
  /**
   * Runtime: which posture is currently folded into stats. Initialized to
   * `equippedStances.default` on attach and reconciled each tick by the stance-switch
   * system; a switch triggers a stat recalc. Networked so the client shows it.
   */
  activeStance: string | null;
  /**
   * Rites the player has learned (crafted) — the slottable pool (system rework
   * Step 11). Stored here like runes/abilities/stances (build/loadout data).
   */
  knownRites: string[];
  /**
   * Equipped rites — an interchangeable list (length ≤ `riteSlotCount`). Rites are
   * always-on OOC passives, so there is no active/slot-role distinction. Their
   * `mechanicEffects` fold into stats on recalc; the OOC systems read the `rite.*` keys.
   */
  equippedRites: EquippedRites;
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

// ─── Monster-specific ─────────────────────────────────────────────────────────

/** Static-ish monster identity. */
export interface IsMonster {
  id: string;
  monsterTypeId: string;
  color: number;
  name: string;
  isBoss: boolean;
  behavior: MonsterBehavior;
  isRanged?: boolean;
  combatArchetype?: CombatArchetype;
}

/** AI awareness ranges and current state. */
export interface HasAwareness {
  state: MonsterAIState;
  pullRange: number;
  leashRange: number;
}
