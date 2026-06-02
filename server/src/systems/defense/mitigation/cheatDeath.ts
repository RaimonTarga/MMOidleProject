import { getCounter, setCounter, resetCounter } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../../combat/engine/combatPipeline';

const CHEAT_DEATH_USED = 'cheatDeathUsed';

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
