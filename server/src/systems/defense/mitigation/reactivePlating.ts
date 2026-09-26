import { getResource, setResource, isCooldownActive, setCooldown } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

// Integer plating currently added to mitigatesDamage.plating from the stacks.
const APPLIED_KEY = 'reactivePlatingApplied';
const STACKS_KEY = 'reactivePlatingStacks';
// Milliseconds accumulated toward the next single-stack fade.
const FADE_KEY = 'reactivePlatingFadeMs';
// Held while hits keep landing; stacks only start fading once it lapses.
const HOLD_CD = 'reactivePlatingHold';
// After the hold window, stacks leave one at a time rather than all at once, so
// a brief lull in a swarm fight costs a little plating, not the whole build.
const FADE_STEP_MS = 500;

/** Current reactive-plating bonus applied (integer plating). For the buff descriptor. */
export function getReactivePlatingBonus(player: PlayerEntity): number {
  return Math.round(getResource(player.tracksCombat, APPLIED_KEY));
}

/** Remove the applied reactive plating and zero tracking (recalc, before rebuild). */
export function resetReactivePlating(player: PlayerEntity): void {
  const cs = player.tracksCombat;
  setResource(cs, STACKS_KEY, 0);
  setResource(cs, FADE_KEY, 0);
  const applied = Math.round(getResource(cs, APPLIED_KEY));
  if (applied <= 0) return;
  player.mitigatesDamage.plating -= applied;
  setResource(cs, APPLIED_KEY, 0);
}

/**
 * Register the reactive-plating listener: each direct hit taken adds one stack
 * (up to `hit-plating-max-stacks`) and refreshes the `hit-plating-duration-ms`
 * hold window. Big hits do not crack it — the answer to long swarm fights under
 * the Volcano's Heat, where late hits grow large.
 */
export function registerReactivePlating(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;
    if (ctx.metadata['isDot']) return; // direct hits only

    const player = ctx.defender;
    const passives = player.usesSkills.passives;
    if ((passives['defense.hit-plating-per-stack'] ?? 0) <= 0) return;

    const cs = player.tracksCombat;
    const maxStacks = Math.max(1, Math.round(passives['defense.hit-plating-max-stacks'] ?? 1));
    setResource(cs, STACKS_KEY, Math.min(maxStacks, getResource(cs, STACKS_KEY) + 1));
    setResource(cs, FADE_KEY, 0);
    setCooldown(cs, HOLD_CD, passives['defense.hit-plating-duration-ms'] ?? 3000);
  });
}

/**
 * Per-tick: once the hold window lapses, drop one stack every FADE_STEP_MS, then
 * sync the plating onto `mitigatesDamage.plating` in place (networked).
 */
export function runReactivePlating(world: World, player: PlayerEntity, dt: number): void {
  const cs = player.tracksCombat;
  const perStack = player.usesSkills.passives['defense.hit-plating-per-stack'] ?? 0;
  let stacks = perStack > 0 ? getResource(cs, STACKS_KEY) : 0;

  if (stacks > 0 && !isCooldownActive(cs, HOLD_CD)) {
    let fade = getResource(cs, FADE_KEY) + dt;
    while (fade >= FADE_STEP_MS && stacks > 0) { fade -= FADE_STEP_MS; stacks -= 1; }
    setResource(cs, FADE_KEY, stacks > 0 ? fade : 0);
    setResource(cs, STACKS_KEY, stacks);
  }

  const applied = Math.round(getResource(cs, APPLIED_KEY));
  const target = Math.round(stacks * perStack);
  const delta = target - applied;
  if (delta !== 0) {
    player.mitigatesDamage.plating += delta;
    setResource(cs, APPLIED_KEY, target);
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
