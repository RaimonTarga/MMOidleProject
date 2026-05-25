/**
 * Boundary helpers from typed ECS slice components to legacy wire DTOs
 * (`PlayerSnapshot` / `MonsterSnapshot`).
 *
 *   assemble*Snapshot  — produce a fresh, byte-identical wire DTO from the
 *                         current slice state.
 *
 * Slices owned by their respective archetype modules (`UsesCadence`,
 * `UsesEnergy`, …) are also assembled here; their runtime components keep
 * mirrors in sync on the entity slices.
 *
 * Motion is the only field where the wire shape differs from the ECS shape:
 *   wire:   `x`, `y`, `targetX`, `targetY`
 *   ECS:    `hasPosition.current` + `isMoving.motion` (direction + magnitude)
 * The assemble step recovers `targetX` / `targetY` via `pointFromMotion`.
 */
import type {
  MonsterSnapshot,
  PlayerSnapshot,
} from '@mmo-idle/shared';
import { pointFromMotion } from '@mmo-idle/shared';
import type { MonsterEntity } from './components/monster';
import type { PlayerEntity } from './components/player';

// ─── Player ──────────────────────────────────────────────────────────────────

/**
 * Reassemble a byte-identical `PlayerSnapshot` from a fully stamped entity.
 * Never mutates the entity. `targetX` / `targetY` are computed from the
 * stored motion vector.
 */
export function assemblePlayerSnapshot(entity: PlayerEntity): PlayerSnapshot {
  const identity    = entity.isPlayer;
  const position    = entity.hasPosition;
  const target      = entity.isMoving
    ? pointFromMotion(position.current, entity.isMoving.motion)
    : position.current;
  const health      = entity.hasHealth;
  const output      = entity.dealsDamage;
  const timing      = entity.performsAttack;
  const mitigation  = entity.mitigatesDamage;
  const autocombat  = entity.usesAutocombat;
  const progression = entity.tracksProgression;
  const inventory   = entity.holdsInventory;
  const skills      = entity.usesSkills;
  const status      = entity.hasStatus;
  const sacred      = entity.showsSacred;

  return {
    id:                    identity.id,
    name:                  identity.name,
    x:                     position.current.x,
    y:                     position.current.y,
    targetX:               target.x,
    targetY:               target.y,
    hp:                    health.hp,
    maxHp:                 health.maxHp,
    attack:                output.attack,
    onHitDamage:           output.onHitDamage,
    plating:               mitigation.plating,
    damageReduction:       mitigation.damageReduction,
    evasion:               entity.evadesHits?.threshold ?? 0,
    evasionCount:          entity.evadesHits?.count ?? 0,
    shields:               entity.holdsShields?.shields ?? [],
    attackRange:           timing.attackRange,
    attackCooldown:        timing.attackCooldown,
    lastAttackAt:          timing.lastAttackAt,
    attackTargetId:        entity.hasAttackTarget?.targetId ?? null,
    auto:                  autocombat.auto,
    nodeId:                position.nodeId,
    essences:              progression.essences,
    level:                 progression.level,
    skillPoints:           progression.skillPoints,
    unlockedSkills:        skills.unlockedSkills,
    passives:              skills.passives,
    cadenceSpeedStacks:    entity.usesCadence?.speedStacks    ?? 0,
    selectedClass:         skills.selectedClass,
    selectedSubVariant:    skills.selectedSubVariant,
    selectedRange:         skills.selectedRange,
    currentSkillTier:      progression.currentSkillTier,
    hpRegen:               health.hpRegen ?? 0,
    speed:                 position.speed,
    attackStyle:           output.attackStyle,
    inventory:             inventory.inventory,
    equipment:             inventory.equipment,
    biomeXP:               progression.biomeXP,
    biomeLevel:            progression.biomeLevel,
    unlockedRecipes:       progression.unlockedRecipes,
    combatArchetype:       skills.combatArchetype,
    cadenceCount:          entity.usesCadence?.count          ?? 0,
    cadenceThreshold:      entity.usesCadence?.threshold      ?? 0,
    cadenceEmpoweredArmed: entity.hasEmpoweredAttack !== undefined,
    ammoCount:             entity.usesReload?.ammo            ?? 0,
    ammoMax:               entity.usesReload?.ammoMax         ?? 0,
    heatPct:               entity.usesReload ? Math.round(entity.usesReload.laserHeat) : 0,
    laserOverheated:       entity.usesReload?.laserOverheated ?? false,
    executionReady:        entity.hasEmpoweredAttack !== undefined,
    executionCooldownPct:  entity.usesCooldown?.executionCooldownPct ?? 0,
    energyCount:           entity.usesEnergy?.energy          ?? 0,
    empoweredReady:        entity.hasEmpoweredAttack !== undefined,
    targetDotStacks:       entity.appliesDots?.targetDotStacks ?? 0,
    targetChillStacks:     entity.chillsTarget?.targetChillStacks ?? 0,
    sacredBuffActive:      sacred.sacredBuffActive,
    sacredBuffPct:         sacred.sacredBuffPct,
    isChanneling:          entity.isChanneling !== undefined,
    channelingPct:         entity.isChanneling?.pct ?? 0,
    activeEffects:         status.activeEffects,
    activeEffectFrames:    status.activeEffectFrames,
    activeBuffs:           status.activeBuffs ?? [],
    questProgress:         progression.questProgress,
    playerTier:            progression.playerTier,
  };
}

// ─── Monster ─────────────────────────────────────────────────────────────────

/**
 * Reassemble a byte-identical `MonsterSnapshot` from a fully stamped entity.
 * Never mutates the entity. `targetX` / `targetY` are computed from the
 * stored motion vector.
 */
export function assembleMonsterSnapshot(entity: MonsterEntity): MonsterSnapshot {
  const identity   = entity.isMonster;
  const position   = entity.hasPosition;
  const target     = entity.isMoving
    ? pointFromMotion(position.current, entity.isMoving.motion)
    : position.current;
  const health     = entity.hasHealth;
  const output     = entity.dealsDamage;
  const timing     = entity.performsAttack;
  const mitigation = entity.mitigatesDamage;
  const awareness  = entity.hasAwareness;
  const status     = entity.hasStatus;

  return {
    id:                 identity.id,
    monsterTypeId:      identity.monsterTypeId,
    color:              identity.color,
    name:               identity.name,
    x:                  position.current.x,
    y:                  position.current.y,
    targetX:            target.x,
    targetY:            target.y,
    hp:                 health.hp,
    maxHp:              health.maxHp,
    attack:             output.attack,
    plating:            mitigation.plating,
    damageReduction:    mitigation.damageReduction,
    speed:              position.speed,
    state:              awareness.state,
    pullRange:          awareness.pullRange,
    leashRange:         awareness.leashRange,
    attackRange:        timing.attackRange,
    attackCooldown:     timing.attackCooldown,
    lastAttackAt:       timing.lastAttackAt,
    attackTargetId:     entity.hasAttackTarget?.targetId ?? null,
    nodeId:             position.nodeId,
    attackStyle:        output.attackStyle,
    isBoss:             identity.isBoss,
    behavior:           identity.behavior,
    combatArchetype:    identity.combatArchetype,
    activeEffects:      status.activeEffects,
    activeEffectFrames: status.activeEffectFrames,
    bossEffects:        status.bossEffects,
  };
}
