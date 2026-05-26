import type { PlayerView } from '../protocol/views';
import type { TracksProgression, UsesSkills } from '../components/networkedSlices';
import { SKILL_TREE } from '../skillTree';

export interface UnlockResult {
  ok: boolean;
  reason?: string;
}

/** Minimal slice view for skill-unlock validation. */
export interface SkillUnlockTarget {
  usesSkills:        Pick<UsesSkills, 'unlockedSkills' | 'selectedClass' | 'selectedSubVariant' | 'selectedRange'>;
  tracksProgression: Pick<TracksProgression, 'skillPoints' | 'currentSkillTier'>;
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
export function canUnlockSkill(target: SkillUnlockTarget, skillId: string): UnlockResult {
  const node = SKILL_TREE.get(skillId);
  if (!node) return { ok: false, reason: 'Unknown skill' };
  if (target.usesSkills.unlockedSkills.includes(skillId)) return { ok: false, reason: 'Already unlocked' };
  if (target.tracksProgression.skillPoints < node.cost) return { ok: false, reason: 'Not enough skill points' };
  if (node.tier !== target.tracksProgression.currentSkillTier) return { ok: false, reason: 'Not the current tier' };

  if (node.tier === 0) {
    if (target.usesSkills.selectedClass !== null) return { ok: false, reason: 'Class already chosen' };
  } else if (node.tier === 1) {
    if (node.classId !== target.usesSkills.selectedClass) return { ok: false, reason: 'Wrong class' };
  } else if (node.tier === 2) {
    if (target.usesSkills.selectedSubVariant === null) return { ok: false, reason: 'Sub-variant not chosen' };
  } else {
    if (node.classId !== target.usesSkills.selectedClass) return { ok: false, reason: 'Wrong class' };
    if (node.subVariantId !== target.usesSkills.selectedSubVariant) return { ok: false, reason: 'Wrong sub-variant' };
  }

  return { ok: true };
}

/** Validate unlock eligibility from the client-facing player view. */
export function canUnlockSkillFromView(player: PlayerView, skillId: string): UnlockResult {
  return canUnlockSkill(
    {
      usesSkills: {
        unlockedSkills:     player.unlockedSkills,
        selectedClass:      player.selectedClass,
        selectedSubVariant: player.selectedSubVariant,
        selectedRange:      player.selectedRange,
      },
      tracksProgression: {
        skillPoints:      player.skillPoints,
        currentSkillTier: player.currentSkillTier,
      },
    },
    skillId,
  );
}
