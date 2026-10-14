import type { PlayerView } from '../protocol/views';
import type { TracksProgression, UsesSkills } from '../components/core/networkedSlices';
import { SKILL_TREE } from '../skillTree';

export interface UnlockResult {
  ok: boolean;
  reason?: string;
}

/** Minimal slice view for skill-unlock validation. */
export interface SkillUnlockTarget {
  usesSkills:        Pick<UsesSkills, 'unlockedSkills' | 'selectedClass' | 'disciplineId'>;
  tracksProgression: Pick<TracksProgression, 'skillPoints' | 'currentSkillTier'>;
}

/**
 * Pure validation — does not mutate the player.
 *
 * Unlock rules by code tier (class-first build plan §3.5):
 *   0 — class roots: no class chosen yet; any root is valid.
 *   1 — disciplines: must belong to the player's class.
 *   2+ — specializations and leaves: must belong to the player's class AND discipline.
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
  } else {
    if (node.classId !== target.usesSkills.selectedClass) return { ok: false, reason: 'Wrong class' };
    if (!target.usesSkills.disciplineId) return { ok: false, reason: 'Discipline not chosen' };
    if (node.disciplineId !== target.usesSkills.disciplineId) return { ok: false, reason: 'Wrong discipline' };
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
        disciplineId:       player.disciplineId,
      },
      tracksProgression: {
        skillPoints:      player.skillPoints,
        currentSkillTier: player.currentSkillTier,
      },
    },
    skillId,
  );
}
