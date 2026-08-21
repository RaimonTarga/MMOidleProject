import {
  WORLD_NODE_LIST,
  DUNGEON_BIOME_GROUPS,
  respawnNodeIdForNodeId,
  shortestWorldPath,
} from '../nodeBiomes';
import { NODE_MODIFIER_FAMILIES } from '../nodeModifiers';
import { NODE_MODIFIERS } from '../nodeModifierMap';
import { NODE_FEATURES, RUNE_ALTAR_FEATURE_ID } from '../nodeFeatures';
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
// Node count is derived from the modifier list: one node per non-banned modifier,
// plus a second for each biome's native. Changing the list or the ban table shifts
// this snapshot and will break the hand-cut region masks.
const knownModifiers = new Set<string>(NODE_MODIFIER_FAMILIES);
assert(
  Object.values(NODE_MODIFIERS).every((info) => knownModifiers.has(info.modifier)),
  'canonical world projects only known modifiers',
);

const canonicalDungeonBiomes = new Set(
  WORLD_NODE_LIST.filter(node => node.kind === 'dungeon').map(node => node.biomeGroup),
);
assert(
  canonicalDungeonBiomes.size === DUNGEON_BIOME_GROUPS.length &&
    DUNGEON_BIOME_GROUPS.every(group => canonicalDungeonBiomes.has(group)),
  'dungeon altar biome list covers every canonical dungeon family',
);

for (const node of WORLD_NODE_LIST) {
  assert(
    shortestWorldPath('node-clearing', node.id) !== null,
    `${node.id} is unreachable from Clearing`,
  );
}

for (const nodeId of [
  'node-clearing',
  'node-t2-sanctuary',
  'node-t3-sanctuary',
  'node-t4-sanctuary',
]) {
  const altars = (NODE_FEATURES[nodeId] ?? []).filter(
    feature => feature.id === RUNE_ALTAR_FEATURE_ID,
  );
  assert(altars.length === 1, `${nodeId} has exactly one passive-reset altar`);
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
