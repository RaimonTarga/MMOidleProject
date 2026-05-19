import type { PlayerState, CombatArchetype } from '@mmo-idle/shared';
import { SKILL_TREE } from '@mmo-idle/shared';
import { recalculatePlayerStats } from './stats';

const CLASS_ARCHETYPES: Record<string, CombatArchetype> = {
  'cadence-root':  'cadence',
  'cooldown-root': 'cooldown',
  'reload-root':   'reload',
  'energy-root':   'energy',
  'dot-root':      'dot',
};

// ── Public API ────────────────────────────────────────────────────────────────

export interface UnlockResult {
  ok: boolean;
  reason?: string;
}

/**
 * Pure validation — does not mutate the player.
 *
 * Unlock rules by tier:
 *   0 — class roots: no class chosen yet; any root is valid.
 *   1 — sub-variants: must match player's selectedClass.
 *   2 — range nodes: universal; player must have a class and sub-variant (tier 1 done).
 *   3+ — path nodes: must match both selectedClass AND selectedSubVariant (full 15-way lock).
 *
 * Across all tiers: node.tier must equal player.currentSkillTier (strict sequential gate).
 */
export function canUnlockSkill(player: PlayerState, skillId: string): UnlockResult {
  const node = SKILL_TREE.get(skillId);
  if (!node)                                   return { ok: false, reason: 'Unknown skill' };
  if (player.unlockedSkills.includes(skillId)) return { ok: false, reason: 'Already unlocked' };
  if (player.skillPoints < node.cost)          return { ok: false, reason: 'Not enough skill points' };
  if (node.tier !== player.currentSkillTier)   return { ok: false, reason: 'Not the current tier' };

  if (node.tier === 0) {
    if (player.selectedClass !== null)          return { ok: false, reason: 'Class already chosen' };
  } else if (node.tier === 1) {
    if (node.classId !== player.selectedClass)  return { ok: false, reason: 'Wrong class' };
  } else if (node.tier === 2) {
    // Universal range nodes — open to all classes, but requires sub-variant chosen first.
    if (player.selectedSubVariant === null)     return { ok: false, reason: 'Sub-variant not chosen' };
  } else {
    // Tier 3+: full 15-way path lock (class × sub-variant).
    if (node.classId !== player.selectedClass)             return { ok: false, reason: 'Wrong class' };
    if (node.subVariantId !== player.selectedSubVariant)   return { ok: false, reason: 'Wrong sub-variant' };
  }

  return { ok: true };
}

/**
 * Validate and apply a skill unlock to the player in-place.
 * Returns false (and does nothing) if validation fails.
 */
export function unlockSkill(player: PlayerState, skillId: string): boolean {
  const result = canUnlockSkill(player, skillId);
  if (!result.ok) return false;

  const node = SKILL_TREE.get(skillId)!;

  player.skillPoints    -= node.cost;
  player.unlockedSkills  = [...player.unlockedSkills, skillId];
  player.currentSkillTier++;

  if (node.tier === 0) {
    player.selectedClass    = skillId;
    player.combatArchetype  = CLASS_ARCHETYPES[skillId] ?? null;
  } else if (node.tier === 1) {
    player.selectedSubVariant = node.subVariantId!;
  } else if (node.tier === 2) {
    player.selectedRange = skillId;
  }

  recalculatePlayerStats(player);
  return true;
}
