import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { World } from '../../server/src/world/World';
import { gameplayPlayerSlices } from '../../server/test/fixtures/gameplayPlayer';
import { grantMonsterRewards } from '../../server/src/systems/player/progression/rewards';
import { biomeXpForBiomeLevel } from '../../shared/src/index';

const out = dirname(fileURLToPath(import.meta.url));
const inventory = JSON.parse(readFileSync(resolve(out, 'inventory.json'), 'utf8'));
let cases = 0;
for (const row of inventory.rows) {
  const world = new World();
  world.rewardMultiplier = 1;
  const slices = gameplayPlayerSlices('study');
  slices.tracksProgression.playerTier = row.tier;
  slices.hasPosition.nodeId = row.nodeId;
  const player = world.attachPlayerEntity(slices, 'study');
  for (const def of row.monsters) {
    player.tracksProgression.biomeLevel[row.biome] = row.entryLevel;
    player.tracksProgression.biomeXP[row.biome] = biomeXpForBiomeLevel(row.biome, row.entryLevel);
    const monster = world.createMonster(row.nodeId, def.id, { x: 800, y: 800 });
    if (!monster) throw new Error(`Cannot create ${def.id}`);
    const result = grantMonsterRewards(world, 'study', monster);
    if (result?.biomeXpGained !== def.xp || result?.essenceGained !== def.essence) throw new Error(`Payout mismatch ${row.nodeId}/${def.id}: ${JSON.stringify(result)}`);
    world.removeMonsterEntity(monster.isMonster.id);
    cases++;
  }
}
const result = { checkedAt: new Date().toISOString(), payoutCases: cases, nodes: inventory.rows.length, passed: true, method: 'Direct calls to authoritative grantMonsterRewards, not combat or pacing simulation.' };
writeFileSync(resolve(out, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
