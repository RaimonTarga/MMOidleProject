import {
  WORLD_NODE_LIST,
  respawnNodeIdForNodeId,
  shortestWorldPath,
} from '../nodeBiomes';
import { DENSITY_MODIFIERS_ENABLED } from '../nodeModifiers';
import { NODE_MODIFIERS } from '../nodeModifierMap';
import { validateWorldMap } from './validation';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const violations = validateWorldMap();
assert(
  violations.length === 0,
  `canonical world is invalid:\n- ${violations.join('\n- ')}`,
);
assert(WORLD_NODE_LIST.length === 170, 'world count snapshot');
assert(DENSITY_MODIFIERS_ENABLED === false, 'density modifiers stay disabled');
assert(
  Object.values(NODE_MODIFIERS).every((modifier) => modifier.density === undefined),
  'canonical world projects no density modifiers',
);

for (const node of WORLD_NODE_LIST) {
  assert(
    shortestWorldPath('node-clearing', node.id) !== null,
    `${node.id} is unreachable from Clearing`,
  );
}

assert(
  respawnNodeIdForNodeId('node-t1-forest-01') === 'node-clearing',
  'T1 respawns at Clearing',
);
assert(
  respawnNodeIdForNodeId('node-t2-desert-01') === 'node-t2-sanctuary',
  'T2 respawns at its sanctuary',
);
assert(
  respawnNodeIdForNodeId('node-t3-volcanic-01') === 'node-t3-sanctuary',
  'T3 respawns at its sanctuary',
);
assert(
  respawnNodeIdForNodeId('node-t4-trench-01') === 'node-t4-sanctuary',
  'T4 respawns at its sanctuary',
);

console.log('map/validation.test.ts: ok');
