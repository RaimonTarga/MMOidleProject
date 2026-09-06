import assert from 'node:assert/strict';
import { World } from '../src/world/World';
import { buildSpectatorNodeSnapshot } from '../src/world/spectatorSnapshot';
import { pushDotTickEvent } from '../src/systems/combat/damage/dotTickEvent';
import { prepareCombatText } from '../../client/src/render/combatText';
import { emptyEquipment, applyStatusEffect } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { attachMarker } from '../src/ecs/markerHelpers';

const world = new World();
const nodeId = 'node-5-5';
const monster = world.createMonster(nodeId, 'bone-crawler', { x: 400, y: 400 });
assert(monster);
const id = monster.isMonster.id;
const dirty = () => ({ patched: new Map(), detached: new Map() });
const broadcast = () => world.buildNodeDelta(nodeId, dirty());
const resync = () => world.buildNodeDelta(nodeId, dirty(), { resync: true });

const initial = broadcast();
assert(initial.deltas.some(d => d.kind === 'add' && d.netId === id));
const before = monster.hasHealth.hp;
monster.hasHealth.hp -= 7;
pushDotTickEvent(world, monster, 'fire', 7);

// Two private viewers joining/resyncing cannot steal the shared node's event or
// advance its previously broadcast HP baseline.
for (let i = 0; i < 2; i++) {
  const sync = resync();
  assert.equal(sync.full, true);
  assert.deepEqual(sync.events, []);
  assert(sync.deltas.some(d => d.kind === 'add' && d.netId === id && d.components.hasHealth?.hp === before - 7));
}
const next = broadcast();
assert.equal(next.events.length, 1);
assert(next.deltas.some(d => d.kind === 'patch' && d.netId === id && d.components?.hasHealth?.hp === before - 7));
assert.deepEqual(prepareCombatText(next.events).entries.map(e => e.amount), [7]);
const spectator = buildSpectatorNodeSnapshot(world, nodeId, next.events);
assert.deepEqual(spectator.events, next.events, 'same batch is available to spectators and player viewers');
assert.deepEqual(broadcast().events, [], 'only the broadcast consumes events');

// A removal observed privately must still be delivered to existing viewers.
world.removeMonsterEntity(id);
resync();
assert(broadcast().deltas.some(d => d.kind === 'remove' && d.netId === id));

// Wiring smoke: real attacks and a real DoT tick share one broadcast. A heal
// changes the HP endpoint but must not change the individual event amounts.
{
  initCombatSystems();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id: 'text-player', name: 'Text Player' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId, speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 0, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: null,
    },
  };
  const player = world.attachPlayerEntity(slices, slices.isPlayer.id);
  const target = world.createMonster(nodeId, 'bone-crawler', { x: 405, y: 400 });
  assert(target);
  target.hasHealth.hp = target.hasHealth.maxHp = 10000;
  const hpBefore = target.hasHealth.hp;
  broadcast();
  const attack = () => runPlayerAttack(world, player, target, 1000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  for (let i = 0; i < 3; i++) assert.equal(attack(), 'hit');
  applyStatusEffect(target.tracksCombat, {
    id: 'dot', sourceId: player.isPlayer.id, stacks: 1, maxStacks: 1, remainingMs: 5000,
    data: { damagePerStack: 7, nextTickIn: 0, tickIntervalMs: 1000 },
  });
  attachMarker(world, target, 'hasDot');
  updateDotArchetype(world, 100);
  target.hasHealth.hp += 5;
  const packet = broadcast();
  const entries = prepareCombatText(packet.events).entries;
  assert.equal(entries.length, 4, 'three hits plus one DoT survive batching');
  assert.equal(entries.filter(e => e.hint.dotElement).length, 1);
  assert.equal(entries.reduce((sum, e) => sum + e.amount, 0), hpBefore - target.hasHealth.hp + 5);

  target.hasHealth.hp = 1;
  assert.equal(attack(), 'killed');
  const lethal = broadcast();
  assert(lethal.deltas.some(d => d.kind === 'remove' && d.netId === target.isMonster.id));
  assert(lethal.events.some(e => e.kind === 'player-kill'));
  assert.equal(prepareCombatText(lethal.events).entries.length, 1, 'hit + kill represent one damage instance');
}
console.log('combatTextResync.test.ts: ok');
