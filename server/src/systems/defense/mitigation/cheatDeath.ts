import { getCounter, setCounter, resetCounter, getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { CHEAT_DEATH_HEAL_POOL_KEY, CHEAT_DEATH_HEAL_RATE_KEY } from '../core/pools';
import { applyHealToPlayer } from '../regen/healing';

const CHEAT_DEATH_USED = 'cheatDeathUsed';

/**
 * Arm the post-cheat-death heal-over-time. Restores `post-cheat-death-heal-pct`
 * of maxHp, spread linearly across `post-cheat-death-heal-ms`. No-op if the
 * armor mechanic isn't equipped. Called the moment cheat-death fires.
 */
function armPostCheatDeathHeal(player: PlayerEntity): void {
  const pct = player.usesSkills.passives['defense.post-cheat-death-heal-pct'] ?? 0;
  const durationMs = player.usesSkills.passives['defense.post-cheat-death-heal-ms'] ?? 0;
  if (pct <= 0 || durationMs <= 0) return;

  const total = player.hasHealth.maxHp * pct;
  setResource(player.tracksCombat, CHEAT_DEATH_HEAL_POOL_KEY, total);
  setResource(player.tracksCombat, CHEAT_DEATH_HEAL_RATE_KEY, total / durationMs);
}

/**
 * Per-tick drain of the post-cheat-death heal pool. Heals at the fixed rate set
 * at trigger time (antiheal applied via `applyHealToPlayer`); zeroes out below
 * 0.5 HP remaining to avoid an asymptotic trickle. Continues even out of combat
 * so the recovery always completes once cheat-death has fired.
 */
export function runPostCheatDeathHeal(world: World, player: PlayerEntity, dt: number): void {
  const cs = player.tracksCombat;
  const pool = getResource(cs, CHEAT_DEATH_HEAL_POOL_KEY);
  if (pool <= 0) return;

  const rate = getResource(cs, CHEAT_DEATH_HEAL_RATE_KEY);
  const healAmount = Math.min(pool, rate * dt);
  const left = pool - healAmount;
  if (left < 0.5) {
    setResource(cs, CHEAT_DEATH_HEAL_POOL_KEY, 0);
    setResource(cs, CHEAT_DEATH_HEAL_RATE_KEY, 0);
  } else {
    setResource(cs, CHEAT_DEATH_HEAL_POOL_KEY, left);
  }
  applyHealToPlayer(player, cs, healAmount, world);
}

/**
 * Register the cheat-death listener on `onDamageTaken`.
 *
 * Fires after debt (which has already redirected its share) and before absorb
 * (so absorb sizes its HoT pool from the actual surviving damage). If the
 * remaining ctx.damage would be lethal and the mechanic hasn't triggered this
 * combat, ctx.damage is capped to hp - 1, leaving the player at exactly 1 HP.
 */
export function registerCheatDeath(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;

    const player = ctx.defender;
    if ((player.usesSkills.passives['defense.cheat-death'] ?? 0) <= 0) return;
    if (getCounter(player.tracksCombat, CHEAT_DEATH_USED) > 0) return;

    if (ctx.damage >= player.hasHealth.hp) {
      ctx.damage = Math.max(0, player.hasHealth.hp - 1);
      setCounter(player.tracksCombat, CHEAT_DEATH_USED, 1);
      armPostCheatDeathHeal(player);
    }
  });
}

/**
 * Cheat-death check for DoT and debt drain paths that bypass the combat pipeline.
 * Call this after HP has been reduced; if it hit zero, this restores HP to 1
 * and marks the mechanic as used.
 *
 * Returns true if cheat death fired — the caller should skip `killPlayer`.
 */
export function tryCheatDeath(_world: World, player: PlayerEntity): boolean {
  if ((player.usesSkills.passives['defense.cheat-death'] ?? 0) <= 0) return false;
  if (getCounter(player.tracksCombat, CHEAT_DEATH_USED) > 0) return false;

  player.hasHealth.hp = 1;
  setCounter(player.tracksCombat, CHEAT_DEATH_USED, 1);
  armPostCheatDeathHeal(player);
  return true;
}

/**
 * Reset the cheat-death trigger when the player leaves combat, making it
 * available again for the next engagement. No-op if the passive isn't present.
 */
export function resetCheatDeath(player: PlayerEntity): void {
  if ((player.usesSkills.passives['defense.cheat-death'] ?? 0) <= 0) return;
  resetCounter(player.tracksCombat, CHEAT_DEATH_USED);
}
