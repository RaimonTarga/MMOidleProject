import { bestiaryNodeId, resolveZoneBestiary } from './bestiary';
import { respawnNodeIdForNodeId } from '../world/nodeBiomes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// Nothing pending: the bestiary describes the node the player is standing in.
assert(
  bestiaryNodeId('node-t1-forest-01', null) === 'node-t1-forest-01',
  'with no respawn in flight the bestiary follows the player node',
);
assert(bestiaryNodeId(null, null) === null, 'no node resolves to no zone');

// Respawn acknowledged, server has not moved the character yet: the zone the
// player died in must not be what the bestiary keeps showing.
for (const deathNode of [
  'node-t1-forest-01',
  'node-t1-mountain-03',
  'node-t1-forest-dungeon',
  'node-t2-forest-01',
]) {
  const bridged = bestiaryNodeId(deathNode, deathNode);
  assert(
    bridged === respawnNodeIdForNodeId(deathNode),
    `${deathNode} should bridge to its region respawn node, got ${bridged}`,
  );
  assert(bridged !== deathNode, `${deathNode} should not describe itself mid-respawn`);
  // The bridge only ever names a real zone.
  assert(
    resolveZoneBestiary(bridged!) !== null,
    `${bridged} should resolve to a zone bestiary`,
  );
}

// The server confirmed the move: the pending node no longer matches, so the
// player's own node wins again — including walking back in later.
assert(
  bestiaryNodeId('node-clearing', 'node-t1-forest-01') === 'node-clearing',
  'once the player has moved the bestiary follows them',
);
assert(
  bestiaryNodeId('node-t1-forest-01', 'node-t1-mountain-03') === 'node-t1-forest-01',
  'a stale pending node never overrides a different current node',
);

// Dying in a hub is a no-op: the destination is the node already occupied.
assert(
  bestiaryNodeId('node-clearing', 'node-clearing') === 'node-clearing',
  'dying in the Clearing respawns in the Clearing',
);

console.log('bestiaryZone.test.ts: ok');
