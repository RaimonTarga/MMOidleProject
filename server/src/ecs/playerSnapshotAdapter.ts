/**
 * Boundary adapter for shared formula helpers that still operate on the
 * `PlayerSnapshot` wire DTO.
 *
 * Several shared utilities — `recalculatePlayerStats`, `canUnlockSkill`, and
 * DB serialization — receive a `PlayerSnapshot` and mutate / read every field.
 * Rewriting them to consume the new slice components is out of scope for the
 * Phase 4 cleanup, so we adapt at the seam instead:
 *
 *   1. `assemblePlayerSnapshot` builds a fresh DTO from slices.
 *   2. The shared helper mutates the DTO in place (for recalc) or reads it.
 *   3. `applyPlayerSnapshotDraft` writes the resulting DTO field-by-field
 *      back into the owning slices.
 *
 * Adapter usage is restricted to low-frequency boundary operations:
 * skill unlock, equip/unequip, hydrate, respawn, and test-room resets. It
 * must NOT be called from per-tick hot paths.
 */
import type { PlayerSnapshot } from '@mmo-idle/shared';
import {
  canUnlockSkill,
  recalculatePlayerStats,
  vectorTo,
} from '@mmo-idle/shared';
import type { PlayerEntity } from './components/player';
import { assemblePlayerSnapshot } from './projection';

/**
 * Write every mutable `PlayerSnapshot` field back into the entity's slices.
 *
 * The shared `recalculatePlayerStats` rewrites attack, attackCooldown,
 * mitigation, evasion, passives, regen, archetype mirrors, and many other
 * fields. The adapter must mirror **every** field to avoid stale slice data,
 * not just the obvious numeric stats.
 */
export function applyPlayerSnapshotDraft(entity: PlayerEntity, draft: PlayerSnapshot): void {
  // ── Identity ────────────────────────────────────────────────────────────
  entity.isPlayer.name = draft.name;

  // ── Position / motion ───────────────────────────────────────────────────
  entity.hasPosition.current = { x: draft.x, y: draft.y };
  entity.hasPosition.nodeId  = draft.nodeId;
  entity.hasPosition.speed   = draft.speed;
  entity.isMoving.motion     = vectorTo(
    { x: draft.x,       y: draft.y },
    { x: draft.targetX, y: draft.targetY },
  );

  // ── Health / shields ────────────────────────────────────────────────────
  entity.hasHealth.hp      = draft.hp;
  entity.hasHealth.maxHp   = draft.maxHp;
  entity.hasHealth.hpRegen = draft.hpRegen;
  entity.hasHealth.shields = draft.shields;

  // ── Combat output / timing / mitigation / evasion ───────────────────────
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

  // ── Autocombat ──────────────────────────────────────────────────────────
  entity.usesAutocombat.auto = draft.auto;

  // ── Progression ─────────────────────────────────────────────────────────
  entity.tracksProgression.level            = draft.level;
  entity.tracksProgression.skillPoints      = draft.skillPoints;
  entity.tracksProgression.essences         = draft.essences;
  entity.tracksProgression.biomeXP          = draft.biomeXP;
  entity.tracksProgression.biomeLevel       = draft.biomeLevel;
  entity.tracksProgression.unlockedRecipes  = draft.unlockedRecipes;
  entity.tracksProgression.questProgress    = draft.questProgress;
  entity.tracksProgression.playerTier       = draft.playerTier;
  entity.tracksProgression.currentSkillTier = draft.currentSkillTier;

  // ── Inventory ───────────────────────────────────────────────────────────
  entity.holdsInventory.inventory = draft.inventory;
  entity.holdsInventory.equipment = draft.equipment;

  // ── Skills ──────────────────────────────────────────────────────────────
  entity.usesSkills.unlockedSkills     = draft.unlockedSkills;
  entity.usesSkills.passives           = draft.passives;
  entity.usesSkills.selectedClass      = draft.selectedClass;
  entity.usesSkills.selectedSubVariant = draft.selectedSubVariant;
  entity.usesSkills.selectedRange      = draft.selectedRange;
  entity.usesSkills.combatArchetype    = draft.combatArchetype;

  // ── Status overlays ─────────────────────────────────────────────────────
  entity.hasStatus.activeEffects      = draft.activeEffects;
  entity.hasStatus.activeEffectFrames = draft.activeEffectFrames;
  entity.hasStatus.activeBuffs        = draft.activeBuffs;

  // ── Sacred Cross mirror ─────────────────────────────────────────────────
  entity.showsSacred.sacredBuffActive = draft.sacredBuffActive;
  entity.showsSacred.sacredBuffPct    = draft.sacredBuffPct;

  // ── Archetype mirrors ───────────────────────────────────────────────────
  entity.usesCadence.cadenceSpeedStacks    = draft.cadenceSpeedStacks;
  entity.usesCadence.cadenceCount          = draft.cadenceCount;
  entity.usesCadence.cadenceThreshold      = draft.cadenceThreshold;
  entity.usesCadence.cadenceEmpoweredArmed = draft.cadenceEmpoweredArmed;
  entity.usesEnergy.energyCount       = draft.energyCount;
  entity.usesEnergy.empoweredReady    = draft.empoweredReady;
  entity.appliesDots.targetDotStacks  = draft.targetDotStacks;
  entity.chillsTarget.targetChillStacks = draft.targetChillStacks;
  entity.usesCooldown.executionReady       = draft.executionReady;
  entity.usesCooldown.executionCooldownPct = draft.executionCooldownPct;
  entity.usesCooldown.isChanneling         = draft.isChanneling;
  entity.usesCooldown.channelingPct        = draft.channelingPct;
  entity.usesReload.ammoCount       = draft.ammoCount;
  entity.usesReload.ammoMax         = draft.ammoMax;
  entity.usesReload.heatPct         = draft.heatPct;
  entity.usesReload.laserOverheated = draft.laserOverheated;
}

/**
 * Materialize a `PlayerSnapshot` draft from the entity's slices, run `fn`
 * against it, then write the mutated draft back into the slices.
 *
 */
export function withPlayerSnapshotDraft<T>(
  entity: PlayerEntity,
  fn: (draft: PlayerSnapshot) => T,
): T {
  const draft = assemblePlayerSnapshot(entity);
  const result = fn(draft);
  applyPlayerSnapshotDraft(entity, draft);
  return result;
}

/** Entity-shaped wrapper for the shared `recalculatePlayerStats` helper. */
export function recalculatePlayerEntityStats(entity: PlayerEntity): void {
  withPlayerSnapshotDraft(entity, recalculatePlayerStats);
}

/** Entity-shaped wrapper for the shared `canUnlockSkill` helper. */
export function canUnlockEntitySkill(
  entity: PlayerEntity,
  skillId: string,
): ReturnType<typeof canUnlockSkill> {
  return canUnlockSkill(assemblePlayerSnapshot(entity), skillId);
}
