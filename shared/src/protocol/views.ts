import type { EquipmentMap, EssenceType } from '../items';
import type { PartyMember } from '../components';
import type { PassiveMap } from '../passives';
import type { SubVariant } from '../skillTree';
import type { BuffId, PlayerBuff } from '../components/combat/buffs';
import type { CombatArchetype, MonsterAIState, ShieldState } from '../types/combat';
import type { HitboxRect } from '../hitbox/types';
import { FALLBACK_MONSTER_AABB, FALLBACK_PLAYER_AABB } from '../hitbox/constants';
import { pointFromMotion, type Vec2 } from '../systems/spatial';
import type { MinionMonsterType } from '../components/archetypes/summoner/isMinion';
import {
  computeSummonRespawnMaxMs,
  countActiveSummons,
  projectSummonSlots,
  type SummonSlotView,
} from '../systems/summonerHud';
import type { NetworkedEntity } from './networkedEntity';

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
  evasion: number;
  evasionCount: number;
  shields: ShieldState[];
  attackRange: number;
  attackCooldown: number;
  lastAttackAt: number;
  attackTargetId: string | null;
  auto: boolean;
  autoTraverse: boolean;
  partyLeaderId: string | null;
  partyMembers: PartyMember[];
  nodeId: string;
  essences: Record<EssenceType, number>;
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
  flashShiftPct: number;
  flashDamageShiftPct: number;
  flashSpeedBonusPct: number;
  flashEvasionBonusPct: number;
  empoweredReady: boolean;
  targetDotStacks: number;
  targetChillStacks: number;
  sacredBuffActive: boolean;
  sacredBuffPct: number;
  isChanneling: boolean;
  channelingPct: number;
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  activeBuffs: PlayerBuff[];
  questProgress: Record<string, number>;
  playerTier: number;
  bossesCleared: string[];
  clearedNodes: string[];
  hitboxRects: HitboxRect[];
  /** Number of minion slots the player has. 0 if not a summoner. */
  summonsMinions: number;
  /** Live summons vs total slots (summoner only). */
  summonActiveCount: number;
  /** Full respawn duration in ms for cooldown bar scaling. */
  summonRespawnMaxMs: number;
  /** Per-slot active / respawn state for the HUD. */
  summonSlots: SummonSlotView[];
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
  behavior: string;
  isRanged: boolean;
  combatArchetype?: CombatArchetype;
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  bossEffects?: string[];
  hitboxRects: HitboxRect[];
}

const EMPTY_EQUIPMENT = {
  weapon: null,
  armor: null,
  recovery: null,
  mobility: null,
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
  if (!progression || !inventory || !skills || !damage || !attack || !mitigation) {
    return null;
  }
  const pos = entity.hasPosition.current;
  const flashShiftPct = entity.usesEnergy && entity.usesEnergy.energyMax > 0
    ? Math.round((entity.usesEnergy.energy / entity.usesEnergy.energyMax) * 100)
    : 0;
  const summonSlots = projectSummonSlots(entity.summonsMinions, skills.passives);
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
    evasion: entity.evadesHits?.threshold ?? 0,
    evasionCount: entity.evadesHits?.count ?? 0,
    shields: entity.holdsShields?.shields ?? [],
    attackRange: attack.attackRange,
    attackCooldown: attack.attackCooldown,
    lastAttackAt: attack.lastAttackAt,
    attackTargetId: entity.hasAttackTarget?.targetId ?? null,
    auto: entity.usesAutocombat?.auto ?? false,
    autoTraverse: entity.usesAutocombat?.autoTraverse ?? false,
    partyLeaderId: entity.inParty?.leaderId ?? null,
    partyMembers: entity.inParty?.members ?? [],
    nodeId: entity.hasPosition.nodeId,
    essences: progression.essences,
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
    targetChillStacks: entity.chillsTarget?.targetChillStacks ?? 0,
    sacredBuffActive: entity.showsSacred?.sacredBuffActive ?? false,
    sacredBuffPct: entity.showsSacred?.sacredBuffPct ?? 0,
    isChanneling: entity.isChanneling !== undefined,
    channelingPct: entity.isChanneling?.pct ?? 0,
    activeEffects: entity.hasStatus?.activeEffects,
    activeEffectFrames: entity.hasStatus?.activeEffectFrames,
    activeBuffs: entity.hasStatus?.activeBuffs ?? [],
    questProgress: progression.questProgress,
    playerTier: progression.playerTier,
    bossesCleared: progression.bossesCleared ?? [],
    clearedNodes: progression.clearedNodes ?? [],
    hitboxRects: entity.hasHitbox?.rects ?? [FALLBACK_PLAYER_AABB],
    summonsMinions: entity.summonsMinions?.targetCount ?? 0,
    summonActiveCount,
    summonRespawnMaxMs,
    summonSlots,
  };
}

export function composeMonsterView(entity: NetworkedEntity): MonsterView | null {
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
