import assert from 'node:assert/strict';
import { FAMILY_DATABASE, nodeShard, type PacketId } from '@mmo-idle/shared';
import { laneNodes } from '../bench/lineage/laneMeasure';
import { shardKillCounter } from '../bench/lineage/shardAccounting';
import type { CombatContext } from '../src/systems/combat/engine/combatPipeline';

const nodes = laneNodes();
for (const node of nodes) assert.equal(node.dropsLane, nodeShard(node.nodeId), `${node.nodeId}: authored node currency`);
const blended = nodes.find(node => node.mobs.some(mob => FAMILY_DATABASE.get(mob.family)!.drops !== nodeShard(node.nodeId)));
assert(blended, 'a real blended node carries minority bodies with a different family shard');
const minority = blended.mobs.find(mob => FAMILY_DATABASE.get(mob.family)!.drops !== nodeShard(blended.nodeId))!;
const paid = nodeShard(blended.nodeId)!;
const familyShard = FAMILY_DATABASE.get(minority.family)!.drops;
assert.notEqual(paid, familyShard);
const counts: Partial<Record<PacketId, number>> = {};
const onKill = shardKillCounter(counts);
const kill = (isBoss: boolean): CombatContext => ({
  defenderType: 'monster',
  defender: { isMonster: { monsterTypeId: minority.monsterTypeId, isBoss }, hasPosition: { nodeId: blended.nodeId } },
} as CombatContext);
onKill(kill(false));
onKill(kill(false));
assert.deepEqual(counts, { [paid]: 2 }, 'minority kills pay only the node shard');
onKill(kill(true));
assert.deepEqual(counts, { [paid]: 2 }, 'boss capstones are not normal node shards');
console.log(`benchNodeShards: ok (${minority.monsterTypeId} in ${blended.nodeId}: ${familyShard} -> ${paid})`);
