import { buildPlayerSummaries } from '../src/admin/playerSummaries';
import type { PlayerEntity } from '../src/ecs/entity';
import type { PlayerSocketSession } from '../src/net/socketSession';
import type { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const player = {
  isPlayer: { id: 'socket-1', name: 'Stable Hero' },
  hasPosition: { nodeId: 'node-clearing' },
  hasHealth: { hp: 9, maxHp: 10 },
  tracksProgression: { level: 3, playerTier: 1, skillPoints: 2 },
  usesSkills: {
    combatArchetype: 'cadence',
    selectedClass: 'cadence-root',
    selectedSubVariant: null,
    selectedRange: null,
  },
  usesAutocombat: { auto: true, autoTraverse: false },
  isDead: undefined,
  inParty: undefined,
} as unknown as PlayerEntity;

const world = { playerEntities: [player] } as unknown as World;
const sessions = new Map<string, PlayerSocketSession>([
  ['socket-1', { accountId: 'account-1', characterId: 'character-1' }],
]);

const [summary] = buildPlayerSummaries(world, sessions, new Set(['socket-1']));
assert(summary?.id === 'socket-1', 'admin actions should retain the runtime socket id');
assert(summary?.characterId === 'character-1', 'summary should expose stable character id');
assert(summary?.accountId === 'account-1', 'summary should expose stable account id');
assert(summary?.inactive === true, 'summary should retain live socket state');

const lobbyOnly = buildPlayerSummaries(
  world,
  new Map([['socket-1', { accountId: 'account-1', characterId: null }]]),
  new Set(),
);
assert(lobbyOnly.length === 0, 'unattached lobby sessions should not appear as players');

console.log('adminPlayerSummaries.test.ts: ok');
