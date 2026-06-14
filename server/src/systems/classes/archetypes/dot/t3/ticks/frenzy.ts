import { getTotalStacks } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { DOT_EFFECT_ID } from '../core/constants';
import { FRENZY_APS_FACTOR } from '../paths/_constants';

/**
 * Frenzy (Poison Light). While the current target sits at max poison stacks, the
 * player's attack speed doubles; it drops back the instant stacks fall below max
 * (no grace period). Tick-driven so it tracks the live stack count each frame.
 */
export function updateFrenzy(world: World): void {
  for (const player of world.dotPlayers) {
    if ((player.usesSkills.passives['dot.frenzy'] ?? 0) <= 0) continue;

    const dots = player.appliesDots;
    const maxStacks = Math.round(player.usesSkills.passives['dot.max-stacks'] ?? 6);
    const targetId = player.hasAttackTarget?.targetId;
    const monster = targetId ? world.getMonsterEntity(targetId) : undefined;
    const stacks = monster ? getTotalStacks(monster.tracksCombat, DOT_EFFECT_ID) : 0;
    const atMax = maxStacks > 0 && stacks >= maxStacks;

    if (atMax && !dots.frenzyActive) {
      dots.frenzyBaseCd = player.performsAttack.attackCooldown;
      player.performsAttack.attackCooldown = Math.max(150, Math.round(dots.frenzyBaseCd / FRENZY_APS_FACTOR));
      dots.frenzyActive = true;
    } else if (!atMax && dots.frenzyActive) {
      player.performsAttack.attackCooldown = dots.frenzyBaseCd;
      dots.frenzyActive = false;
    }
  }
}
