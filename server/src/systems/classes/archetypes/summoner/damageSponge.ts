import { pushDamageEvent } from '../../../combat/damage/damageEvent';
/**
 * Summoner damage sponge: a fraction of incoming damage to the player is
 * redirected to a random living minion. Implemented as an `onDamageTaken`
 * listener — runs after shield/absorb listeners (registration order is
 * controlled in `server/src/index.ts`).
 *
 * Damage routed to the minion never re-enters the combat pipeline; we apply
 * it as a raw HP subtraction and kill the slime if it drops to ≤0. The
 * summoner tick will start the respawn timer on the next pass.
 */
import type { MinionMonsterType } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import { summonerProfileFor } from './profile';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';

export function pickLivingMinion(world: World, owner: PlayerEntity): MinionEntity | null {
  if (!owner.summonsMinions) return null;
  const summons = owner.summonsMinions;
  const ids = summons.minionIds;
  const candidates: MinionEntity[] = [];
  for (const id of ids) {
    if (!id) continue;
    const m = world.getMinionEntity(id);
    if (m && m.hasHealth.hp > 0) candidates.push(m);
  }
  if (candidates.length === 0) return null;
  const defenseTwin = candidates.find((candidate) => candidate.isMinion.role === 'defense-twin');
  if (defenseTwin) return defenseTwin;
  const index = summons.redirectCursor % candidates.length;
  summons.redirectCursor = (summons.redirectCursor + 1) % Math.max(1, summons.targetCount);
  return candidates[index]!;
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
    const player = ctx.defender;
    if (!player.summonsMinions) return;

    const spongePct = summonerProfileFor(player).redirectionPct;
    if (spongePct <= 0) return;

    const minion = pickLivingMinion(world, player);
    if (!minion) return;

    const redirected = Math.max(1, Math.round(ctx.damage * spongePct));
    ctx.damage = Math.max(0, ctx.damage - redirected);
    redirectDamageToMinion(minion, redirected, world);
  });
}
