import { nodeShard, type PacketId } from '@mmo-idle/shared';
import type { CombatContext } from '../../src/systems/combat/engine/combatPipeline';

/** Normal farm kills attributed to the node currency, not the victim's family.
 * Counts kills, not a synthetic wallet balance or reward-multiplied payout.
 */
export function shardKillCounter(killsByShard: Partial<Record<PacketId, number>>): (ctx: CombatContext) => void {
  return (ctx) => {
    if (ctx.defenderType !== 'monster' || ctx.defender.isMonster.isBoss) return;
    const shard = nodeShard(ctx.defender.hasPosition.nodeId);
    if (shard) killsByShard[shard] = (killsByShard[shard] ?? 0) + 1;
  };
}
