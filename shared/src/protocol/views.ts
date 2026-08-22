import type { EquipmentMap, EssenceType } from "../items";
import type { HasAutoIntent, HasEmote, PartyMember, TargetStatusView, UltimateStatus } from "../components";
import type { PassiveMap } from "../passives";
import { isRangedCombatant, type SubVariant } from "../skillTree";
import type { MonsterBehavior } from "../data/monsters/behavior";
import { resolveUpkeepConfig, upkeepStacks, upkeepStage } from "../systems/energyUpkeep";
import type { BuffId, PlayerBuff } from "../components/combat/buffs";
import type {
  CombatArchetype,
  MonsterAIState,
  WardState,
} from "../types/combat";
import type { HitboxRect } from "../hitbox/types";
import type { EquippedRule } from "../runeDatabase";
import {
  abilitySlotCount,
  normalizeEquippedAbilities,
  type AbilitySlot,
  type EquippedAbilities,
} from "../abilities";
import { emptyEquippedStances, type EquippedStances } from "../stances";
import { emptyEquippedRites, type EquippedRites } from "../rites";
import {
  FALLBACK_MONSTER_AABB,
  FALLBACK_PLAYER_AABB,
} from "../hitbox/constants";
import { pointFromMotion, type Vec2 } from "../systems/spatial";
import { globalMastery } from "../config/gameConfig";
import type { MinionMonsterType } from "../components/archetypes/summoner/isMinion";
import {
  computeSummonRespawnMaxMs,
  countActiveSummons,
  projectSummonSlots,
  type SummonSlotView,
} from "../systems/summonerHud";
import type { NetworkedEntity } from "./networkedEntity";

export type { SummonSlotView };

export interface PlayerView {
  id: string;
  name: string;
  pos: Vec2;
  target: Vec2;
  hp: number;
  maxHp: number;
  attack: number;
  onHitDamage: number;
  plating: number;
  damageReduction: number;
  /** Deterministic per-hit dodge rate (0..<1). */
  dodgeRate: number;
  /** Fraction of damage avoided on an evaded hit (0..1; 1 = full avoid). */
  evadeMitigation: number;
  /**
   * The live accumulator (0..<1). Deterministic, so `evadeCharge + dodgeRate >= 1`
   * means the next hit taken WILL be evaded — anticipation, not a prediction.
   */
  evadeCharge: number;
  /** Permanent absorb pool. 0/0 when the build has no `defense.barrier-pct`. */
  barrier: number;
  barrierMax: number;
  /** True while the barrier is actively refilling (no damage for the delay window). */
  barrierRecharging: boolean;
  /** Temporary absorb pools, oldest first — drained before the barrier. */
  wards: WardState[];
  /** Total pending damage-over-time on the player (HP-bar red layer). */
  incomingDot: number;
  /** Pending heal-over-time from regen/absorb pools (HP-bar regen layer). */
  pendingHeal: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackAt: number;
  attackTargetId: string | null;
  auto: boolean;
  autoTraverse: boolean;
  /** Current server-directed action; may remain during manual travel/engaged combat. */
  autoIntent: HasAutoIntent | null;
  /** Active emote; null when none is playing. */
  emote: HasEmote | null;
  partyLeaderId: string | null;
  partyMembers: PartyMember[];
  nodeId: string;
  essences: Record<EssenceType, number>;
  /** Biome catalysts wallet, keyed by biome group. */
  catalysts: Record<string, number>;
  /** Accumulating progress toward the next catalyst, keyed by biome group. */
  catalystProgress: Record<string, number>;
  level: number;
  skillPoints: number;
  unlockedSkills: string[];
  passives: PassiveMap;
  cadenceSpeedStacks: number;
  selectedClass: string | null;
  selectedSubVariant: SubVariant | null;
  selectedRange: string | null;
  currentSkillTier: number;
  hpRegen: number;
  speed: number;
  attackStyle: string;
  inventory: string[];
  equipment: EquipmentMap;
  itemUpgrades: Record<string, number>;
  biomeXP: Record<string, number>;
  biomeLevel: Record<string, number>;
  /** Derived sum of all biome levels (system rework Step 4) — drives RP budget + upgrade ceiling. */
  globalMastery: number;
  unlockedRecipes: string[];
  combatArchetype: CombatArchetype;
  cadenceCount: number;
  cadenceThreshold: number;
  cadenceEmpoweredArmed: boolean;
  ammoCount: number;
  ammoMax: number;
  heatPct: number;
  laserOverheated: boolean;
  executionReady: boolean;
  executionCooldownPct: number;
  energyCount: number;
  energyMax: number;
  flashShiftPct: number;
  flashDamageShiftPct: number;
  flashSpeedBonusPct: number;
  flashEvasionBonusPct: number;
  empoweredReady: boolean;
  targetDotStacks: number;
  /** Server-authored progress toward the current target's next primary DoT tick. */
  targetDotTickPct: number;
  targetChillStacks: number;
  isChanneling: boolean;
  channelingPct: number;
  /** Cannoneer: 0 when idle, else 0→100 as the mid-reload cannon charge fills. */
  cannonChargePct: number;
  /**
   * Active transformation/state aura id (e.g. 'surge'), or null. Drives a persistent
   * tint + glow on the character for "state" classes. Client maps the id to a color.
   */
  aura: string | null;
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  activeBuffs: PlayerBuff[];
  questProgress: Record<string, number>;
  playerTier: number;
  bossesCleared: string[];
  clearedNodes: string[];
  /** Nodes entered through world travel; unlocks the map after first travel. */
  visitedNodes: string[];
  runesOwned: string[];
  runeRecipesCrafted: string[];
  runesEquipped: EquippedRule[];
  /** Abilities learned (crafted) — the slottable pool (system rework Step 7). */
  knownAbilities: string[];
  /** Equipped abilities per slot kind, ordered — list order is fire priority. */
  equippedAbilities: EquippedAbilities;
  /** Ability slots available at this player tier: `{ technique, guard }`. */
  abilitySlots: Record<AbilitySlot, number>;
  /** Stances learned (crafted) — the slottable pool (system rework Step 10). */
  knownStances: string[];
  /** Free default posture; Rune rules carry automated destinations. */
  equippedStances: EquippedStances;
  /** Which posture is currently active (folded into stats). */
  activeStance: string | null;
  /** Rites learned (crafted) — the slottable pool (system rework Step 11). */
  knownRites: string[];
  /** Equipped rites — interchangeable list (length ≤ `riteSlots`), always-on OOC. */
  equippedRites: EquippedRites;
  /** Number of rite slots available (GM-derived; flat 2 for v1). */
  riteSlots: number;
  hitboxRects: HitboxRect[];
  /** Number of minion slots the player has. 0 if not a summoner. */
  summonsMinions: number;
  /** Live summons vs total slots (summoner only). */
  summonActiveCount: number;
  /** Full respawn duration in ms for cooldown bar scaling. */
  summonRespawnMaxMs: number;
  /** Per-slot active / respawn state for the HUD. */
  summonSlots: SummonSlotView[];
  isDead: boolean;
  graveFrame: number | null;
}

/**
 * Whether this player fights at range, derived via the shared
 * {@link isRangedCombatant} predicate. The client uses this to gate the lunge
 * animation so it matches the server's kite-vs-melee approach exactly.
 */
export function isRangedPlayerView(view: PlayerView): boolean {
  return isRangedCombatant({
    attackRange: view.attackRange,
    combatArchetype: view.combatArchetype,
    selectedRange: view.selectedRange,
    flashActive: (view.passives["energy.flash"] ?? 0) > 0,
  });
}

export interface MinionView {
  id: string;
  ownerPlayerId: string;
  slot: number;
  monsterTypeId: MinionMonsterType;
  pos: Vec2;
  target: Vec2;
  hp: number;
  maxHp: number;
  attack: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackAt: number;
  attackTargetId: string | null;
  attackStyle: string;
  speed: number;
  sizeMult: number;
  nodeId: string;
  hitboxRects: HitboxRect[];
}

export interface MonsterView {
  id: string;
  monsterTypeId: string;
  color: number;
  name: string;
  pos: Vec2;
  target: Vec2;
  hp: number;
  maxHp: number;
  attack: number;
  plating: number;
  damageReduction: number;
  speed: number;
  state: MonsterAIState;
  pullRange: number;
  leashRange: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackAt: number;
  attackTargetId: string | null;
  nodeId: string;
  attackStyle: string;
  isBoss: boolean;
  behavior: MonsterBehavior;
  isRanged: boolean;
  combatArchetype?: CombatArchetype;
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  bossEffects?: string[];
  targetStatus?: TargetStatusView[];
  ultimateStatus?: UltimateStatus;
  throneHealing?: boolean;
  hitboxRects: HitboxRect[];
}

const EMPTY_EQUIPMENT = {
  weapon: null,
  armor: null,
  recovery: null,
  mobility: null,
  core: null,
} as EquipmentMap;

export function composePlayerView(entity: NetworkedEntity): PlayerView | null {
  if (!entity.isPlayer || !entity.hasPosition || !entity.hasHealth) return null;
  const target = entity.isMoving
    ? pointFromMotion(entity.hasPosition.current, entity.isMoving.motion)
    : entity.hasPosition.current;
  const progression = entity.tracksProgression;
  const inventory = entity.holdsInventory;
  const skills = entity.usesSkills;
  const damage = entity.dealsDamage;
  const attack = entity.performsAttack;
  const mitigation = entity.mitigatesDamage;
  if (
    !progression ||
    !inventory ||
    !skills ||
    !damage ||
    !attack ||
    !mitigation
  ) {
    return null;
  }
  const pos = entity.hasPosition.current;
  const flashShiftPct =
    entity.usesEnergy && entity.usesEnergy.energyMax > 0
      ? Math.round(
          (entity.usesEnergy.energy / entity.usesEnergy.energyMax) * 100,
        )
      : 0;
  const summonSlots = projectSummonSlots(
    entity.summonsMinions,
    skills.passives,
  );
  const summonActiveCount = countActiveSummons(summonSlots);
  const summonRespawnMaxMs = entity.summonsMinions
    ? computeSummonRespawnMaxMs(skills.passives)
    : 0;
  return {
    id: entity.isPlayer.id,
    name: entity.isPlayer.name,
    pos,
    target,
    hp: entity.hasHealth.hp,
    maxHp: entity.hasHealth.maxHp,
    attack: damage.attack,
    onHitDamage: damage.onHitDamage,
    plating: mitigation.plating,
    damageReduction: mitigation.damageReduction,
    dodgeRate: entity.evadesHits?.dodgeRate ?? 0,
    evadeMitigation: entity.evadesHits?.evadeMitigation ?? 0,
    evadeCharge: entity.evadesHits?.charge ?? 0,
    barrier: entity.hasBarrier?.current ?? 0,
    barrierMax: entity.hasBarrier?.max ?? 0,
    barrierRecharging: entity.hasBarrier?.recharging ?? false,
    wards: entity.holdsWards?.wards ?? [],
    incomingDot: entity.hasStatus?.incomingDot ?? 0,
    pendingHeal: entity.hasStatus?.pendingHeal ?? 0,
    attackRange: attack.attackRange,
    attackCooldown: attack.attackCooldown,
    lastAttackAt: attack.lastAttackAt,
    attackTargetId: entity.hasAttackTarget?.targetId
      ?? entity.summonsMinions?.formationTargetId
      ?? null,
    auto: entity.usesAutocombat?.auto ?? false,
    autoTraverse: entity.usesAutocombat?.autoTraverse ?? false,
    autoIntent: entity.hasAutoIntent ?? null,
    emote: entity.hasEmote ?? null,
    partyLeaderId: entity.inParty?.leaderId ?? null,
    partyMembers: entity.inParty?.members ?? [],
    nodeId: entity.hasPosition.nodeId,
    essences: progression.essences,
    catalysts: progression.catalysts,
    catalystProgress: progression.catalystProgress,
    level: progression.level,
    skillPoints: progression.skillPoints,
    unlockedSkills: skills.unlockedSkills,
    passives: skills.passives,
    cadenceSpeedStacks: entity.usesCadence?.speedStacks ?? 0,
    selectedClass: skills.selectedClass,
    selectedSubVariant: skills.selectedSubVariant,
    selectedRange: skills.selectedRange,
    currentSkillTier: progression.currentSkillTier,
    hpRegen: entity.hasHealth.hpRegen ?? 0,
    speed: entity.hasPosition.speed,
    attackStyle: damage.attackStyle,
    inventory: inventory.inventory,
    equipment: inventory.equipment ?? EMPTY_EQUIPMENT,
    itemUpgrades: inventory.itemUpgrades ?? {},
    biomeXP: progression.biomeXP,
    biomeLevel: progression.biomeLevel,
    globalMastery: globalMastery(progression.biomeLevel),
    unlockedRecipes: progression.unlockedRecipes,
    combatArchetype: skills.combatArchetype,
    cadenceCount: entity.usesCadence?.count ?? 0,
    cadenceThreshold: entity.usesCadence?.threshold ?? 0,
    cadenceEmpoweredArmed: entity.hasEmpoweredAttack !== undefined,
    ammoCount: entity.usesReload?.ammo ?? 0,
    ammoMax: entity.usesReload?.ammoMax ?? 0,
    heatPct: entity.usesReload ? Math.round(entity.usesReload.laserHeat) : 0,
    laserOverheated: entity.usesReload?.laserOverheated ?? false,
    executionReady: entity.hasEmpoweredAttack !== undefined,
    executionCooldownPct: entity.usesCooldown?.executionCooldownPct ?? 0,
    energyCount: entity.usesEnergy?.energy ?? 0,
    energyMax: entity.usesEnergy?.energyMax ?? 100,
    flashShiftPct,
    flashDamageShiftPct: entity.usesEnergy
      ? Math.round((0.45 - (flashShiftPct / 100) * 0.9) * 100)
      : 0,
    flashSpeedBonusPct: entity.usesEnergy
      ? Math.round(entity.usesEnergy.flashSpeedBonusPct * 100)
      : 0,
    flashEvasionBonusPct: entity.usesEnergy
      ? Math.round(entity.usesEnergy.flashEvasionBonusPct * 100)
      : 0,
    empoweredReady: entity.hasEmpoweredAttack !== undefined,
    targetDotStacks: entity.appliesDots?.targetDotStacks ?? 0,
    targetDotTickPct: entity.appliesDots?.targetDotTickPct ?? 0,
    targetChillStacks: entity.chillsTarget?.targetChillStacks ?? 0,
    isChanneling: entity.isChanneling !== undefined,
    channelingPct: entity.isChanneling?.pct ?? 0,
    cannonChargePct: (() => {
      const r = entity.usesReload;
      if (!r || r.cannonFireMs <= 0 || r.cannonChargeTotalMs <= 0) return 0;
      return Math.round((1 - r.cannonFireMs / r.cannonChargeTotalMs) * 100);
    })(),
    // Transformation/state auras. Add future state classes here (each maps to a
    // client aura color). Surge/Overdrive glows yellow; Channeler glows light blue
    // in 3 stages by upkeep stacks.
    aura: (() => {
      // Berserker: Rampage ramps in 3 stages by stack count, the same shape as
      // the Channeler's upkeep stages. Auras are the right channel for STACKING
      // COMBAT STATE — permanent identity lives in the body sprite and the head
      // accent, so the two never compete.
      const cad = entity.usesCadence;
      if (cad && cad.rampageStacks > 0) {
        const max = entity.usesSkills?.passives['cadence.rampage-max-stacks'] ?? 10;
        const frac = cad.rampageStacks / Math.max(1, max);
        return `rampage-${frac >= 0.7 ? 3 : frac >= 0.35 ? 2 : 1}`;
      }
      const e = entity.usesEnergy;
      if (!e) return null;
      if (e.overdriveActive) return 'surge';
      const upkeep = resolveUpkeepConfig(entity.usesSkills?.passives ?? {});
      const stacks = upkeepStacks(e, upkeep.stackIntervalMs);
      if (stacks > 0) return `channel-${upkeepStage(stacks, upkeep)}`;
      // Equinox is always in one of two cycles → always coloured by its current state.
      if ((entity.usesSkills?.passives['energy.binary-cycle'] ?? 0) > 0) {
        return e.binaryDischargeState ? 'equinox-discharge' : 'equinox-charge';
      }
      // Stormbringer: storm aura while empowered strikes remain.
      if (e.awakenedCharges > 0) return 'storm';
      // Aetherist: always wears a sun aura (client tints red→yellow by energy).
      if ((entity.usesSkills?.passives['energy.charge-state'] ?? 0) > 0) return 'aether';
      return null;
    })(),
    activeEffects: entity.hasStatus?.activeEffects,
    activeEffectFrames: entity.hasStatus?.activeEffectFrames,
    activeBuffs: entity.hasStatus?.activeBuffs ?? [],
    questProgress: progression.questProgress,
    playerTier: progression.playerTier,
    bossesCleared: progression.bossesCleared ?? [],
    clearedNodes: progression.clearedNodes ?? [],
    visitedNodes: progression.visitedNodes ?? [],
    runesOwned: progression.runesOwned ?? [],
    runeRecipesCrafted: progression.runeRecipesCrafted ?? [],
    runesEquipped: progression.runesEquipped ?? [],
    knownAbilities: progression.knownAbilities ?? [],
    equippedAbilities: normalizeEquippedAbilities(progression.equippedAbilities),
    abilitySlots: abilitySlotCount(progression.playerTier),
    knownStances: progression.knownStances ?? [],
    equippedStances: progression.equippedStances ?? emptyEquippedStances(),
    activeStance: progression.activeStance ?? null,
    knownRites: progression.knownRites ?? [],
    equippedRites: progression.equippedRites ?? emptyEquippedRites(),
    // Compatibility field for older clients; Rites are RP-capped, not slot-capped.
    riteSlots: (progression.knownRites ?? []).length,
    hitboxRects: entity.hasHitbox?.rects ?? [FALLBACK_PLAYER_AABB],
    summonsMinions: entity.summonsMinions?.targetCount ?? 0,
    summonActiveCount,
    summonRespawnMaxMs,
    summonSlots,
    isDead: entity.isDead !== undefined,
    graveFrame: entity.isDead?.graveFrame ?? null,
  };
}

export function composeMonsterView(
  entity: NetworkedEntity,
): MonsterView | null {
  if (
    !entity.isMonster ||
    !entity.hasPosition ||
    !entity.hasHealth ||
    !entity.dealsDamage ||
    !entity.performsAttack ||
    !entity.mitigatesDamage ||
    !entity.hasAwareness
  ) {
    return null;
  }
  const target = entity.isMoving
    ? pointFromMotion(entity.hasPosition.current, entity.isMoving.motion)
    : entity.hasPosition.current;
  const pos = entity.hasPosition.current;
  return {
    id: entity.isMonster.id,
    monsterTypeId: entity.isMonster.monsterTypeId,
    color: entity.isMonster.color,
    name: entity.isMonster.name,
    pos,
    target,
    hp: entity.hasHealth.hp,
    maxHp: entity.hasHealth.maxHp,
    attack: entity.dealsDamage.attack,
    plating: entity.mitigatesDamage.plating,
    damageReduction: entity.mitigatesDamage.damageReduction,
    speed: entity.hasPosition.speed,
    state: entity.hasAwareness.state,
    pullRange: entity.hasAwareness.pullRange,
    leashRange: entity.hasAwareness.leashRange,
    attackRange: entity.performsAttack.attackRange,
    attackCooldown: entity.performsAttack.attackCooldown,
    lastAttackAt: entity.performsAttack.lastAttackAt,
    attackTargetId: entity.hasAttackTarget?.targetId ?? null,
    nodeId: entity.hasPosition.nodeId,
    attackStyle: entity.dealsDamage.attackStyle,
    isBoss: entity.isMonster.isBoss,
    behavior: entity.isMonster.behavior,
    isRanged: entity.isMonster.isRanged ?? false,
    combatArchetype: entity.isMonster.combatArchetype,
    activeEffects: entity.hasStatus?.activeEffects,
    activeEffectFrames: entity.hasStatus?.activeEffectFrames,
    bossEffects: entity.hasStatus?.bossEffects,
    targetStatus: entity.hasStatus?.targetStatus,
    ultimateStatus: entity.hasStatus?.ultimateStatus,
    throneHealing: entity.hasStatus?.throneHealing,
    hitboxRects: entity.hasHitbox?.rects ?? [FALLBACK_MONSTER_AABB],
  };
}

export function composeMinionView(entity: NetworkedEntity): MinionView | null {
  if (
    !entity.isMinion ||
    !entity.hasPosition ||
    !entity.hasHealth ||
    !entity.dealsDamage ||
    !entity.performsAttack
  ) {
    return null;
  }
  const target = entity.isMoving
    ? pointFromMotion(entity.hasPosition.current, entity.isMoving.motion)
    : entity.hasPosition.current;
  const pos = entity.hasPosition.current;
  return {
    id: entity.isMinion.id,
    ownerPlayerId: entity.isMinion.ownerPlayerId,
    slot: entity.isMinion.slot,
    monsterTypeId: entity.isMinion.monsterTypeId,
    pos,
    target,
    hp: entity.hasHealth.hp,
    maxHp: entity.hasHealth.maxHp,
    attack: entity.dealsDamage.attack,
    attackRange: entity.performsAttack.attackRange,
    attackCooldown: entity.performsAttack.attackCooldown,
    lastAttackAt: entity.performsAttack.lastAttackAt,
    attackTargetId: entity.hasAttackTarget?.targetId ?? null,
    attackStyle: entity.dealsDamage.attackStyle,
    speed: entity.hasPosition.speed,
    sizeMult: entity.isMinion.sizeMult ?? 1.0,
    nodeId: entity.hasPosition.nodeId,
    hitboxRects: entity.hasHitbox?.rects ?? [FALLBACK_MONSTER_AABB],
  };
}

export type EntityView = PlayerView | MonsterView | MinionView;
