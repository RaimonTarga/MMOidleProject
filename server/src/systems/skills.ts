import type { PlayerState, CombatArchetype } from '@mmo-idle/shared';
import { SKILL_TREE } from '@mmo-idle/shared';
import { recalculatePlayerStats } from './stats';

// Maps the four skill-tree class root IDs to their server-side combat archetype.
// null means the class has no active archetype mechanic yet.
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
 * Unlock rules (tier-based, no parent traversal):
 *   1. Node must exist and not already be unlocked.
 *   2. Player must have enough skill points.
 *   3. node.tier must equal player.currentSkillTier (strict tier gate).
 *   4. Tier 0 nodes (class roots): only before class is chosen.
 *   5. Tier 1+ nodes: node.classId must match player.selectedClass.
 */
export function canUnlockSkill(player: PlayerState, skillId: string): UnlockResult {
  const node = SKILL_TREE.get(skillId);
  if (!node)                                   return { ok: false, reason: 'Unknown skill' };
  if (player.unlockedSkills.includes(skillId)) return { ok: false, reason: 'Already unlocked' };
  if (player.skillPoints < node.cost)          return { ok: false, reason: 'Not enough skill points' };
  if (node.tier !== player.currentSkillTier)   return { ok: false, reason: 'Not the current tier' };

  if (node.tier === 0) {
    if (player.selectedClass !== null)         return { ok: false, reason: 'Class already chosen' };
  } else {
    if (node.classId !== player.selectedClass) return { ok: false, reason: 'Wrong class' };
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
    player.selectedClass   = skillId;
    player.combatArchetype = CLASS_ARCHETYPES[skillId] ?? null;
  }

  recalculatePlayerStats(player);
  return true;
}
