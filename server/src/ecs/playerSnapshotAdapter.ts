/**
 * Boundary adapter for shared formula helpers that still operate on the
 * `PlayerSnapshot` wire DTO.
 *
 * Archetype slice attach/detach is centralized here via `syncArchetypeSlices`.
 * Any code path that mutates `combatArchetype` or archetype-relevant passives
 * MUST go through this adapter (or call `syncArchetypeSlices` directly).
 */
import type { PlayerSnapshot } from '@mmo-idle/shared';
import {
  canUnlockSkill,
  recalculatePlayerStats,
  vectorTo,
} from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from './components/player';
import { syncArchetypeSlices } from './archetypeSliceSync';
import { assemblePlayerSnapshot } from './projection';

export function applyPlayerSnapshotDraft(
  world: World,
  entity: PlayerEntity,
  draft: PlayerSnapshot,
): void {
  entity.isPlayer.name = draft.name;

  entity.hasPosition.current = { x: draft.x, y: draft.y };
  entity.hasPosition.nodeId  = draft.nodeId;
  entity.hasPosition.speed   = draft.speed;
  entity.isMoving.motion     = vectorTo(
    { x: draft.x,       y: draft.y },
    { x: draft.targetX, y: draft.targetY },
  );

  entity.hasHealth.hp      = draft.hp;
  entity.hasHealth.maxHp   = draft.maxHp;
  entity.hasHealth.hpRegen = draft.hpRegen;
  entity.hasHealth.shields = draft.shields;

  entity.dealsDamage.attack          = draft.attack;
  entity.dealsDamage.onHitDamage     = draft.onHitDamage;
  entity.dealsDamage.attackStyle     = draft.attackStyle;
  entity.performsAttack.attackRange     = draft.attackRange;
  entity.performsAttack.attackCooldown  = draft.attackCooldown;
  entity.performsAttack.lastAttackAt    = draft.lastAttackAt;
  entity.performsAttack.attackTargetId  = draft.attackTargetId;
  entity.mitigatesDamage.plating         = draft.plating;
  entity.mitigatesDamage.damageReduction = draft.damageReduction;
  entity.evadesHits.threshold = draft.evasion;
  entity.evadesHits.count     = draft.evasionCount;

  entity.usesAutocombat.auto = draft.auto;

  entity.tracksProgression.level            = draft.level;
  entity.tracksProgression.skillPoints      = draft.skillPoints;
  entity.tracksProgression.essences         = draft.essences;
  entity.tracksProgression.biomeXP          = draft.biomeXP;
  entity.tracksProgression.biomeLevel       = draft.biomeLevel;
  entity.tracksProgression.unlockedRecipes  = draft.unlockedRecipes;
  entity.tracksProgression.questProgress    = draft.questProgress;
  entity.tracksProgression.playerTier       = draft.playerTier;
  entity.tracksProgression.currentSkillTier = draft.currentSkillTier;

  entity.holdsInventory.inventory = draft.inventory;
  entity.holdsInventory.equipment = draft.equipment;

  entity.usesSkills.unlockedSkills     = draft.unlockedSkills;
  entity.usesSkills.passives           = draft.passives;
  entity.usesSkills.selectedClass      = draft.selectedClass;
  entity.usesSkills.selectedSubVariant = draft.selectedSubVariant;
  entity.usesSkills.selectedRange      = draft.selectedRange;
  entity.usesSkills.combatArchetype    = draft.combatArchetype;

  entity.hasStatus.activeEffects      = draft.activeEffects;
  entity.hasStatus.activeEffectFrames = draft.activeEffectFrames;
  entity.hasStatus.activeBuffs        = draft.activeBuffs;

  entity.showsSacred.sacredBuffActive = draft.sacredBuffActive;
  entity.showsSacred.sacredBuffPct    = draft.sacredBuffPct;

  syncArchetypeSlices(world, entity, draft);
}

export function withPlayerSnapshotDraft<T>(
  world: World,
  entity: PlayerEntity,
  fn: (draft: PlayerSnapshot) => T,
): T {
  const draft = assemblePlayerSnapshot(entity);
  const result = fn(draft);
  applyPlayerSnapshotDraft(world, entity, draft);
  return result;
}

export function recalculatePlayerEntityStats(world: World, entity: PlayerEntity): void {
  withPlayerSnapshotDraft(world, entity, recalculatePlayerStats);
}

export function canUnlockEntitySkill(
  entity: PlayerEntity,
  skillId: string,
): ReturnType<typeof canUnlockSkill> {
  return canUnlockSkill(assemblePlayerSnapshot(entity), skillId);
}
