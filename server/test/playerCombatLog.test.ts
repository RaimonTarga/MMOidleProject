import { strict as assert } from 'node:assert';
import type { WorldLogEvent } from '@mmo-idle/shared';
import { applyWorldLogEvents } from '../../client/src/worldLog/formatWorldLog';
import { combatLog, type LogEntry } from '../../client/src/combatLog';

const player = { id: 'player', name: 'Player', actorType: 'player' as const };
const monster = { id: 'monster', name: 'Monster', actorType: 'monster' as const };
const base = { id: 1, tick: 1, serverTime: 1, nodeId: 'test' };
let entries: LogEntry[] = [];
const unsubscribe = combatLog.subscribe(next => { entries = next; });

// Chatter must not evict meaningful events from the bounded player log.
applyWorldLogEvents([
  { ...base, kind: 'damage', source: player, target: monster, hpDamage: 10,
    absorbed: 0, damageType: 'direct' },
], player.id);
const notices: WorldLogEvent[] = [
  { ...base, kind: 'ability-activation', player, abilityId: 'cleanse', slot: 'guard' },
  ...(['buff-gain', 'buff-update', 'buff-expire'] as const).map(kind => ({
    ...base, kind, target: player, buffId: 'debuff-slow' as const, label: 'Slow',
    stacks: 1, stackDelta: 1, category: 'neutral' as const, sourceName: 'Monster',
    sourceSide: 'enemy' as const, effectText: 'Slowed', durationPct: 1,
  })),
];
for (let i = 0; i < 600; i++) applyWorldLogEvents(notices, player.id);
assert.equal(entries.length, 1);
assert.equal(entries[0].kind, 'damage-out');

applyWorldLogEvents([
  { ...base, kind: 'heal', target: player, amount: 5 },
  { ...base, kind: 'ward-gain', target: player, amount: 5 },
  { ...base, kind: 'kill', killer: player, victim: monster, damage: 10 },
], player.id);
assert.deepEqual(entries.map(entry => entry.kind), ['damage-out', 'heal', 'shield', 'kill']);
unsubscribe();
console.log('playerCombatLog: ok');
