/**
 * Boundary helpers between wire DTOs (`PlayerSnapshot` / `MonsterSnapshot`)
 * and the typed ECS slice components.
 *
 *   decompose*Snapshot — convert an incoming DTO (DB hydrate, monster spawn)
 *                         into the slice components used by the ECS.
 *   assemble*Snapshot  — produce a fresh, byte-identical wire DTO from the
 *                         current slice state.
 *
 * Slices owned by their respective archetype modules (`UsesCadence`,
 * `UsesEnergy`, …) are also assembled here; their runtime components keep
 * mirrors in sync via `project*ToSnapshot` helpers.
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
import { pointFromMotion, vectorTo } from '@mmo-idle/shared';
import type { MonsterEntity } from './components/monster';
import type { PlayerEntity } from './components/player';
import type {
  AppliesDots,
  ChillsTarget,
  DealsDamage,
  EvadesHits,
  HasAwareness,
  HasHealth,
  HasPosition,
  HasStatus,
  HoldsInventory,
  IsMonster,
  IsMoving,
  IsPlayer,
  MitigatesDamage,
  PerformsAttack,
  ShowsSacred,
  TracksProgression,
  UsesAutocombat,
  UsesCadence,
  UsesCooldown,
  UsesEnergy,
  UsesReload,
  UsesSkills,
} from './components/snapshotSlices';

// ─── Player ──────────────────────────────────────────────────────────────────

/** Set of slice keys that `decomposePlayerSnapshot` populates. */
export type PlayerSliceStamp = {
  isPlayer:          IsPlayer;
  hasPosition:       HasPosition;
  isMoving:          IsMoving;
  hasHealth:         HasHealth;
  dealsDamage:       DealsDamage;
  performsAttack:    PerformsAttack;
  mitigatesDamage:   MitigatesDamage;
  evadesHits:        EvadesHits;
  usesAutocombat:    UsesAutocombat;
  tracksProgression: TracksProgression;
  holdsInventory:    HoldsInventory;
  usesSkills:        UsesSkills;
  hasStatus:         HasStatus;
  showsSacred:       ShowsSacred;
  usesCadence:       UsesCadence;
  usesEnergy:        UsesEnergy;
  appliesDots:       AppliesDots;
  chillsTarget:      ChillsTarget;
  usesCooldown:      UsesCooldown;
  usesReload:        UsesReload;
};

/**
 * Decompose a wire `PlayerSnapshot` DTO into ECS slice components.
 *
 * The caller spreads the result into a `PlayerEntity`. Motion is recovered
 * from `targetX` / `targetY` via `vectorTo(current, target)` so that a
 * subsequent `assemblePlayerSnapshot` reproduces the original DTO exactly.
 */
export function decomposePlayerSnapshot(snapshot: PlayerSnapshot): PlayerSliceStamp {
  return {
    isPlayer: {
      id:   snapshot.id,
      name: snapshot.name,
    },
    hasPosition: {
      current: { x: snapshot.x, y: snapshot.y },
      nodeId:  snapshot.nodeId,
      speed:   snapshot.speed,
    },
    isMoving: {
      motion: vectorTo(
        { x: snapshot.x,       y: snapshot.y },
        { x: snapshot.targetX, y: snapshot.targetY },
      ),
    },
    hasHealth: {
      hp:      snapshot.hp,
      maxHp:   snapshot.maxHp,
      hpRegen: snapshot.hpRegen,
      shields: snapshot.shields,
    },
    dealsDamage: {
      attack:      snapshot.attack,
      onHitDamage: snapshot.onHitDamage,
      attackStyle: snapshot.attackStyle,
    },
    performsAttack: {
      attackRange:    snapshot.attackRange,
      attackCooldown: snapshot.attackCooldown,
      lastAttackAt:   snapshot.lastAttackAt,
      attackTargetId: snapshot.attackTargetId,
    },
    mitigatesDamage: {
      plating:         snapshot.plating,
      damageReduction: snapshot.damageReduction,
    },
    evadesHits: {
      threshold: snapshot.evasion,
      count:     snapshot.evasionCount,
    },
    usesAutocombat: {
      auto: snapshot.auto,
    },
    tracksProgression: {
      level:            snapshot.level,
      skillPoints:      snapshot.skillPoints,
      essences:         snapshot.essences,
      biomeXP:          snapshot.biomeXP,
      biomeLevel:       snapshot.biomeLevel,
      unlockedRecipes:  snapshot.unlockedRecipes,
      questProgress:    snapshot.questProgress,
      playerTier:       snapshot.playerTier,
      currentSkillTier: snapshot.currentSkillTier,
    },
    holdsInventory: {
      inventory: snapshot.inventory,
      equipment: snapshot.equipment,
    },
    usesSkills: {
      unlockedSkills:     snapshot.unlockedSkills,
      passives:           snapshot.passives,
      selectedClass:      snapshot.selectedClass,
      selectedSubVariant: snapshot.selectedSubVariant,
      selectedRange:      snapshot.selectedRange,
      combatArchetype:    snapshot.combatArchetype,
    },
    hasStatus: {
      activeEffects:      snapshot.activeEffects,
      activeEffectFrames: snapshot.activeEffectFrames,
      activeBuffs:        snapshot.activeBuffs,
    },
    showsSacred: {
      sacredBuffActive: snapshot.sacredBuffActive,
      sacredBuffPct:    snapshot.sacredBuffPct,
    },
    usesCadence: {
      cadenceSpeedStacks:    snapshot.cadenceSpeedStacks,
      cadenceCount:          snapshot.cadenceCount,
      cadenceThreshold:      snapshot.cadenceThreshold,
      cadenceEmpoweredArmed: snapshot.cadenceEmpoweredArmed,
    },
    usesEnergy: {
      energyCount:    snapshot.energyCount,
      empoweredReady: snapshot.empoweredReady,
    },
    appliesDots: {
      targetDotStacks: snapshot.targetDotStacks,
    },
    chillsTarget: {
      targetChillStacks: snapshot.targetChillStacks,
    },
    usesCooldown: {
      executionReady:       snapshot.executionReady,
      executionCooldownPct: snapshot.executionCooldownPct,
      isChanneling:         snapshot.isChanneling,
      channelingPct:        snapshot.channelingPct,
    },
    usesReload: {
      ammoCount:       snapshot.ammoCount,
      ammoMax:         snapshot.ammoMax,
      heatPct:         snapshot.heatPct,
      laserOverheated: snapshot.laserOverheated,
    },
  };
}

/**
 * Reassemble a byte-identical `PlayerSnapshot` from a fully stamped entity.
 * Never mutates the entity. `targetX` / `targetY` are computed from the
 * stored motion vector.
 */
export function assemblePlayerSnapshot(entity: PlayerEntity): PlayerSnapshot {
  const identity    = entity.isPlayer;
  const position    = entity.hasPosition;
  const motion      = entity.isMoving;
  const target      = pointFromMotion(position.current, motion.motion);
  const health      = entity.hasHealth;
  const output      = entity.dealsDamage;
  const timing      = entity.performsAttack;
  const mitigation  = entity.mitigatesDamage;
  const evasion     = entity.evadesHits;
  const autocombat  = entity.usesAutocombat;
  const progression = entity.tracksProgression;
  const inventory   = entity.holdsInventory;
  const skills      = entity.usesSkills;
  const status      = entity.hasStatus;
  const sacred      = entity.showsSacred;
  const cadence     = entity.usesCadence;
  const energy      = entity.usesEnergy;
  const dot         = entity.appliesDots;
  const chill       = entity.chillsTarget;
  const cooldown    = entity.usesCooldown;
  const reload      = entity.usesReload;

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
    evasion:               evasion.threshold,
    evasionCount:          evasion.count,
    shields:               health.shields ?? [],
    attackRange:           timing.attackRange,
    attackCooldown:        timing.attackCooldown,
    lastAttackAt:          timing.lastAttackAt,
    attackTargetId:        timing.attackTargetId,
    auto:                  autocombat.auto,
    nodeId:                position.nodeId,
    essences:              progression.essences,
    level:                 progression.level,
    skillPoints:           progression.skillPoints,
    unlockedSkills:        skills.unlockedSkills,
    passives:              skills.passives,
    cadenceSpeedStacks:    cadence.cadenceSpeedStacks,
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
    cadenceCount:          cadence.cadenceCount,
    cadenceThreshold:      cadence.cadenceThreshold,
    cadenceEmpoweredArmed: cadence.cadenceEmpoweredArmed,
    ammoCount:             reload.ammoCount,
    ammoMax:               reload.ammoMax,
    heatPct:               reload.heatPct,
    laserOverheated:       reload.laserOverheated,
    executionReady:        cooldown.executionReady,
    executionCooldownPct:  cooldown.executionCooldownPct,
    energyCount:           energy.energyCount,
    empoweredReady:        energy.empoweredReady,
    targetDotStacks:       dot.targetDotStacks,
    targetChillStacks:     chill.targetChillStacks,
    sacredBuffActive:      sacred.sacredBuffActive,
    sacredBuffPct:         sacred.sacredBuffPct,
    isChanneling:          cooldown.isChanneling,
    channelingPct:         cooldown.channelingPct,
    activeEffects:         status.activeEffects,
    activeEffectFrames:    status.activeEffectFrames,
    activeBuffs:           status.activeBuffs ?? [],
    questProgress:         progression.questProgress,
    playerTier:            progression.playerTier,
  };
}

// ─── Monster ─────────────────────────────────────────────────────────────────

/** Set of slice keys that `decomposeMonsterSnapshot` populates. */
export type MonsterSliceStamp = {
  isMonster:       IsMonster;
  hasPosition:     HasPosition;
  isMoving:        IsMoving;
  hasHealth:       HasHealth;
  dealsDamage:     DealsDamage;
  performsAttack:  PerformsAttack;
  mitigatesDamage: MitigatesDamage;
  hasAwareness:    HasAwareness;
  hasStatus:       HasStatus;
};

/** Decompose a wire `MonsterSnapshot` DTO into ECS slice components. */
export function decomposeMonsterSnapshot(snapshot: MonsterSnapshot): MonsterSliceStamp {
  return {
    isMonster: {
      id:              snapshot.id,
      monsterTypeId:   snapshot.monsterTypeId,
      color:           snapshot.color,
      name:            snapshot.name,
      isBoss:          snapshot.isBoss,
      behavior:        snapshot.behavior,
      combatArchetype: snapshot.combatArchetype,
    },
    hasPosition: {
      current: { x: snapshot.x, y: snapshot.y },
      nodeId:  snapshot.nodeId,
      speed:   snapshot.speed,
    },
    isMoving: {
      motion: vectorTo(
        { x: snapshot.x,       y: snapshot.y },
        { x: snapshot.targetX, y: snapshot.targetY },
      ),
    },
    hasHealth: {
      hp:    snapshot.hp,
      maxHp: snapshot.maxHp,
    },
    dealsDamage: {
      attack:      snapshot.attack,
      onHitDamage: 0,
      attackStyle: snapshot.attackStyle,
    },
    performsAttack: {
      attackRange:    snapshot.attackRange,
      attackCooldown: snapshot.attackCooldown,
      lastAttackAt:   snapshot.lastAttackAt,
      attackTargetId: snapshot.attackTargetId,
    },
    mitigatesDamage: {
      plating:         snapshot.plating,
      damageReduction: snapshot.damageReduction,
    },
    hasAwareness: {
      state:      snapshot.state,
      pullRange:  snapshot.pullRange,
      leashRange: snapshot.leashRange,
    },
    hasStatus: {
      activeEffects:      snapshot.activeEffects,
      activeEffectFrames: snapshot.activeEffectFrames,
      bossEffects:        snapshot.bossEffects,
    },
  };
}

// ─── Wire parity validation ──────────────────────────────────────────────────
//
// A round trip `snapshot → decompose → (synthesised entity) → assemble` must
// reproduce the original DTO byte-for-byte (modulo floating-point tolerance on
// motion fields). The harness is exported for use in dev-boot checks or tests
// and is intentionally light — it does not allocate ECS entities.

const MOTION_EPSILON = 1e-6;

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= MOTION_EPSILON;
}

/** Player wire-parity check; returns the list of field names that differ. */
export function diffPlayerRoundTrip(snapshot: PlayerSnapshot): string[] {
  const stamp = decomposePlayerSnapshot(snapshot);
  const synthetic = {
    entityId: snapshot.id,
    combatState: undefined,
    combatAt: 0,
    ...stamp,
  } as unknown as PlayerEntity;
  const rebuilt = assemblePlayerSnapshot(synthetic);
  return diffSnapshotKeys(snapshot as unknown as Record<string, unknown>, rebuilt as unknown as Record<string, unknown>);
}

/** Monster wire-parity check; returns the list of field names that differ. */
export function diffMonsterRoundTrip(snapshot: MonsterSnapshot): string[] {
  const stamp = decomposeMonsterSnapshot(snapshot);
  const synthetic = {
    entityId: snapshot.id,
    combatState: undefined,
    monsterAi: undefined,
    ...stamp,
  } as unknown as MonsterEntity;
  const rebuilt = assembleMonsterSnapshot(synthetic);
  return diffSnapshotKeys(snapshot as unknown as Record<string, unknown>, rebuilt as unknown as Record<string, unknown>);
}

function diffSnapshotKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  const out: string[] = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    // Allow tiny floating-point drift on the motion-derived fields.
    if ((k === 'targetX' || k === 'targetY' || k === 'x' || k === 'y') &&
        typeof av === 'number' && typeof bv === 'number') {
      if (!approxEqual(av, bv)) out.push(k);
      continue;
    }
    if (!deepEqual(av, bv)) out.push(k);
  }
  return out;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    const bk = Object.keys(bo);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!deepEqual(ao[k], bo[k])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Reassemble a byte-identical `MonsterSnapshot` from a fully stamped entity.
 * Never mutates the entity. `targetX` / `targetY` are computed from the
 * stored motion vector.
 */
export function assembleMonsterSnapshot(entity: MonsterEntity): MonsterSnapshot {
  const identity   = entity.isMonster;
  const position   = entity.hasPosition;
  const motion     = entity.isMoving;
  const target     = pointFromMotion(position.current, motion.motion);
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
    attackTargetId:     timing.attackTargetId,
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
