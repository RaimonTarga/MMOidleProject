import assert from 'node:assert/strict';
import { areaDanger, NODE_BIOMES, WORLD_NODE_LIST, buildNodeGateEntities, GAME_CONFIG } from '@mmo-idle/shared';
import { arrivalKind, nearbyExits } from '../../client/src/hud/areaInformationModel';

for (const node of WORLD_NODE_LIST) {
  const info = NODE_BIOMES[node.id];
  if (node.kind === 'normal' || node.kind === 'dungeon') {
    assert.notEqual(areaDanger(info), null, `Missing danger: ${node.id}`);
  } else if (node.kind === 'sanctuary' || node.kind === 'tutorial') {
    assert.equal(areaDanger(info), null);
  }
  for (const gate of buildNodeGateEntities(node.id)) {
    const pos = { x: gate.bounds.x + gate.bounds.width / 2, y: gate.bounds.y + gate.bounds.height / 2 };
    const preview = nearbyExits(node.id, pos)[0];
    assert.equal(preview?.exitNodeId ?? null, gate.exitNodeId ?? null, `Gate destination: ${gate.id}`);
  }
  assert.deepEqual(nearbyExits(node.id, { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }), []);
  for (const x of [100, GAME_CONFIG.NODE_WIDTH - 100]) {
    for (const y of [100, GAME_CONFIG.NODE_HEIGHT - 100]) {
      const directions = [x === 100 ? 'west' : 'east', y === 100 ? 'north' : 'south'];
      const expected = buildNodeGateEntities(node.id).filter(g => !g.sealed && directions.includes(g.direction));
      const actual = nearbyExits(node.id, { x, y });
      assert.deepEqual(actual.map(g => g.id).sort(), expected.map(g => g.id).sort(), `Corner destinations: ${node.id}`);
      // Prior selection of one side must not suppress the newly approached side.
      assert.deepEqual(nearbyExits(node.id, { x, y }, expected.slice(0, 1).map(g => g.id)).map(g => g.id).sort(), expected.map(g => g.id).sort());
    }
  }
}
const find = (tier: number, biome: string) => WORLD_NODE_LIST.filter(n => n.biomeTier === tier && n.biomeGroup === biome && n.kind === 'normal');
const caves = find(1, 'cave');
const swamp1 = find(1, 'swamp')[0];
const swamp3 = find(3, 'swamp')[0];
assert.equal(areaDanger(NODE_BIOMES[swamp1.id]), 2);
assert.equal(areaDanger(NODE_BIOMES[swamp3.id]), 1);
for (const node of WORLD_NODE_LIST.filter(n => NODE_BIOMES[n.id]?.isDungeon)) {
  assert.equal(areaDanger(NODE_BIOMES[node.id]), 5, `Dungeons are boss fights: ${node.id}`);
}
assert.equal(arrivalKind(caves[0].id, ['node-clearing']), 'discovery');
assert.equal(arrivalKind(caves[1].id, [caves[0].id]), 'new-node');
assert.equal(arrivalKind(caves[0].id, [caves[0].id]), 'return');
assert.equal(arrivalKind(swamp3.id, [swamp1.id]), 'discovery');

const gate = buildNodeGateEntities(caves[0].id).find(g => !g.sealed)!;
const p = { x: gate.bounds.x + gate.bounds.width / 2, y: gate.bounds.y + gate.bounds.height / 2 };
if (gate.direction === 'north') p.y += 520;
if (gate.direction === 'south') p.y -= 520;
if (gate.direction === 'west') p.x += 520;
if (gate.direction === 'east') p.x -= 520;
assert.deepEqual(nearbyExits(caves[0].id, p), []);
assert.equal(nearbyExits(caves[0].id, p, [gate.id])[0]?.id, gate.id, 'Hysteresis retains the preview');
console.log('areaInformation: ok');
