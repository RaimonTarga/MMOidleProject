import type { PlayerSnapshot } from '../index';
import { SKILL_TREE } from '../skillTree';

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
export function canUnlockSkill(player: PlayerSnapshot, skillId: string): UnlockResult {
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
