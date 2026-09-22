import assert from 'node:assert/strict';
import { SPIRIT_BOSS_CELLS, assertSpiritBossDefinitions } from '../bench/balance/t2SpiritBossSpec';
import { bossContrastDelivery } from '../bench/balance/t2SpiritBossEvidence';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
assertSpiritBossDefinitions();
assert.deepEqual(SPIRIT_BOSS_CELLS.slice(0, 10).map(c => c.identityId),
  SPIRIT_BOSS_CELLS.slice(10).map(c => c.identityId).reverse());
assert(MONSTER_DATABASE.get('stoneplate-juggernaut')!.bossPattern!.steps.some(s =>
  s.kind === 'cast' && s.name === 'Stoneplate' && s.guardable === false));
const hit = { kind: 'player-hit', playerId: 'p', targetId: 'b', empowered: true, damage: 100, absorbed: 9 };
const log = [{ atMs: 0, event: { kind: 'sample', empowered: true } },
  { atMs: 100, event: hit }, { atMs: 100, event: { ...hit, kind: 'damage' } },
  { atMs: 200, event: { ...hit, targetId: 'add' } },
  { atMs: 300, event: { ...hit, empowered: false } }];
const before = JSON.stringify(log);
const result = bossContrastDelivery(log, 'p', 'b', true);
assert.equal(result.ownerHitsOnBoss, 2);
assert.equal(result.spirit!.landedDischargeCount, 1);
assert.equal(result.spirit!.firstDischargeAtMs, 100);
assert.equal(result.spirit!.absorbed, 9);
assert.equal(result.spirit!.usefulHpContribution, null);
assert.equal(bossContrastDelivery(log, 'p', 'b', false).spirit, null);
assert.equal(JSON.stringify(log), before);
console.log('t2SpiritBossPacket: ok (definitions and synthetic event fixtures; no World ticks)');
