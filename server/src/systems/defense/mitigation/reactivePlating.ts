import { applyStatusEffect, getStatusEffect, getResource, setResource } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

const EFFECT_ID = 'reactive-plating';
// Integer plating currently added to mitigatesDamage.plating from the buff.
const APPLIED_KEY = 'reactivePlatingApplied';

/** Current reactive-plating bonus applied (integer plating). For the buff descriptor. */
export function getReactivePlatingBonus(player: PlayerEntity): number {
  return Math.round(getResource(player.tracksCombat, APPLIED_KEY));
}

/** Remove the applied reactive plating and zero tracking (recalc, before rebuild). */
export function resetReactivePlating(player: PlayerEntity): void {
  const applied = Math.round(getResource(player.tracksCombat, APPLIED_KEY));
  if (applied <= 0) return;
  player.mitigatesDamage.plating -= applied;
  setResource(player.tracksCombat, APPLIED_KEY, 0);
}

/**
 * Register the reactive-plating listener: each direct hit taken adds one stack
 * (up to `hit-plating-max-stacks`) and refreshes the `hit-plating-duration-ms`
 * window. The plating itself is synced from the stack count in runReactivePlating.
 */
export function registerReactivePlating(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;
    if (ctx.metadata['isDot']) return; // direct hits only

    const player = ctx.defender;
    const perStack = player.usesSkills.passives['defense.hit-plating-per-stack'] ?? 0;
    if (perStack <= 0) return;

    const maxStacks  = Math.max(1, Math.round(player.usesSkills.passives['defense.hit-plating-max-stacks'] ?? 1));
    const durationMs = player.usesSkills.passives['defense.hit-plating-duration-ms'] ?? 4000;
    applyStatusEffect(player.tracksCombat, {
      id: EFFECT_ID,
      maxStacks,
      instanced: false,
      refreshable: true,
      remainingMs: durationMs,
      sourceId: player.isPlayer.id,
      data: { totalMs: durationMs, platingPerStack: perStack },
    });
  });
}

/**
 * Per-tick sync of reactive plating onto `mitigatesDamage.plating` from the
 * current stack count (the status effect decays on its own in updateCombatState).
 * Applied in place (networked) so the stat sheet reflects it live.
 */
export function runReactivePlating(world: World, player: PlayerEntity): void {
  const cs = player.tracksCombat;
  const perStack = player.usesSkills.passives['defense.hit-plating-per-stack'] ?? 0;
  const applied = Math.round(getResource(cs, APPLIED_KEY));

  if (perStack <= 0) {
    if (applied > 0) {
      player.mitigatesDamage.plating -= applied;
      setResource(cs, APPLIED_KEY, 0);
      markSliceDirty(world, player, 'mitigatesDamage');
    }
    return;
  }

  const effect = getStatusEffect(cs, EFFECT_ID);
  const target = effect ? Math.round(effect.stacks * perStack) : 0;
  const delta = target - applied;
  if (delta !== 0) {
    player.mitigatesDamage.plating += delta;
    setResource(cs, APPLIED_KEY, target);
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
