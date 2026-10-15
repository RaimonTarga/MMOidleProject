import { pushDamageEvent } from '../../../combat/damage/damageEvent';
/**
 * Summoner damage sponge: a fraction of incoming damage to the player is
 * redirected to a random living minion. Implemented as an `onDamageTaken`
 * listener registered inside `initDefenseSystems`: after evasion, the damage
 * cap and wards/barrier, before the owner's hit-to-DoT debt, cheat death and
 * damage-absorb recuperation. Guard (registered earlier) has already applied.
 *
 * Damage routed to the minion never re-enters the combat pipeline; we apply
 * it as a raw HP subtraction and kill the slime if it drops to ≤0. The
 * summoner tick will start the respawn timer on the next pass.
 */
import { CONDUIT_KIT, type MinionMonsterType } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';

/** The living tank summon closest to the owner. */
function nearestTank(world: World, owner: PlayerEntity): MinionEntity | null {
  let best: MinionEntity | null = null;
  let bestSq = Infinity;
  for (const id of owner.summonsMinions?.minionIds ?? []) {
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion || minion.hasHealth.hp <= 0) continue;
    const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === minion.isMinion.slotId.split('#')[0]);
    if (piece?.family !== 'tank') continue;
    const dx = minion.hasPosition.current.x - owner.hasPosition.current.x;
    const dy = minion.hasPosition.current.y - owner.hasPosition.current.y;
    if (dx * dx + dy * dy < bestSq) { bestSq = dx * dx + dy * dy; best = minion; }
  }
  return best;
}

/** Raw HP subtraction on a minion; death is handled by the summoner tick. */
export function redirectDamageToMinion(minion: MinionEntity, amount: number, world: World): void {
  minion.hasHealth.hp -= amount;
  if (minion.hasHealth.hp <= 0) {
    minion.hasHealth.hp = 0;
  }
  markSliceDirty(world, minion, 'hasHealth');
  pushDamageEvent(world, minion, amount);
}

export function registerSummonerDamageSponge(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;
    // Splash already hits nearby summons directly; redirecting the owner's share
    // too would land one AoE on the same body twice.
    if (ctx.metadata['secondarySplash']) return;
    const player = ctx.defender;
    if (!player.summonsMinions) return;

    // Big-Hit Intercept: a hit that would take a large share of your HP goes to the nearest tank.
    const intercept = player.usesSkills.passives['conduit.intercept-pct'] ?? 0;
    if (intercept > 0 && ctx.damage >= player.hasHealth.maxHp * intercept) {
      const tank = nearestTank(world, player);
      if (tank) {
        redirectDamageToMinion(tank, ctx.damage, world);
        ctx.damage = 0;
      }
    }
  });
}
