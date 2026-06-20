import { getStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import { FRENZY_FX, FRENZY_APS } from '../paths/_constants';

/**
 * Frenzy (Zealot) attack-speed half. While the Frenzy buff (FRENZY_FX, applied on
 * hitting a max-stack target — see initDotT3) is active, reassert the attack-speed
 * bonus each tick from a cached clean cooldown; restore it when the buff lapses.
 * Recalc-safe: if attackCooldown no longer matches what we last wrote, recapture.
 * (The on-hit-damage half is applied at hit time in initDotT3.)
 */
export function updateFrenzy(world: World): void {
  for (const player of world.dotPlayers) {
    if ((player.usesSkills.passives['dot.frenzy'] ?? 0) <= 0) continue;
    const dots = player.appliesDots;
    const active = getStatusEffect(player.tracksCombat, FRENZY_FX) !== undefined;

    if (active) {
      const apsBonus = Math.max(
        0,
        player.usesSkills.passives['dot.frenzy-attack-speed-pct'] ?? FRENZY_APS,
      ); // flat — attack speed does NOT scale per tier
      if (player.performsAttack.attackCooldown !== dots.frenzyAppliedCd) {
        dots.frenzyBaseCd = player.performsAttack.attackCooldown; // clean base (post-recalc)
      }
      const desired = Math.max(150, Math.round(dots.frenzyBaseCd / (1 + apsBonus)));
      if (player.performsAttack.attackCooldown !== desired) {
        player.performsAttack.attackCooldown = desired;
        markSliceDirty(world, player, 'performsAttack');
      }
      dots.frenzyAppliedCd = desired;
    } else if (dots.frenzyBaseCd > 0) {
      if (player.performsAttack.attackCooldown !== dots.frenzyBaseCd) {
        player.performsAttack.attackCooldown = dots.frenzyBaseCd;
        markSliceDirty(world, player, 'performsAttack');
      }
      dots.frenzyBaseCd = 0;
    }
  }
}
