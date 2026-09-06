// Wiring coverage for the death-cancels-every-order pass (2026-09-06).
//
// Dying used to leave standing orders behind: `usesAutocombat.auto` was
// deliberately preserved, so a respawned character started fighting or walking
// with no input from the player between the death screen and the movement. The
// contract now is that death is a full stop, and that the stop is BROADCAST —
// an in-place assignment to a networked slice leaves the client's AUTO button
// lit forever, which is what made the leftover state visible in the first place.

import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent } from '../src/ecs/markerHelpers';
import { setEntityMotion } from '../src/systems/world/movement';
import { startManualNavigation } from '../src/systems/world/autoTraverse';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-clearing';
const TRAVEL_DEST = 'node-t1-plains-01';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 405, y: 400 },
      nodeId: NODE,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

// Death drops auto-combat, auto-traverse, the traverse path and the movement
// itself — and every one of those is observable on the wire.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('dies-mid-order'), 'dies-mid-order');

  // Navigation first: `startManualNavigation` clears auto-combat by design, so
  // the standing orders have to be layered in the order a player would.
  startManualNavigation(world, player, TRAVEL_DEST);
  assert(!!player.hasAutoTraversePath, 'precondition: a traverse path should be installed');
  player.usesAutocombat.auto = true;
  player.usesAutocombat.autoTraverse = true;
  setEntityMotion(world, player, { x: 1200, y: 1200 }, { mode: 'direct' });
  attachComponent(world, player, 'hasManualMoveIntent', {});
  assert(!!player.isMoving, 'precondition: the player should be walking');

  // Drain whatever the setup dirtied so the assertion below can only be
  // satisfied by `killPlayer` marking the slice itself.
  world.dirty.drain();

  world.killPlayer('dies-mid-order', { kind: 'stance', damage: 100, stanceName: 'Test Stance' });

  assert(!!player.isDead, 'the player should be dead');
  assert(player.usesAutocombat.auto === false, 'death must clear auto-combat');
  assert(player.usesAutocombat.autoTraverse === false, 'death must clear auto-traverse');
  assert(!player.hasAutoTraversePath, 'death must clear the traverse path');
  assert(!player.isMoving, 'death must stop movement');
  assert(!player.hasManualMoveIntent, 'death must release the manual-move latch');
  assert(!player.hasAutoIntent, 'death must clear the auto intent');

  const drained = world.dirty.drain();
  const patched = drained.patched.get('dies-mid-order') ?? new Set();
  assert(
    patched.has('usesAutocombat'),
    'the cleared auto flags must be marked dirty, or the client keeps showing AUTO on',
  );
}

// A respawn off the back of that death comes up idle: no auto, no path, no
// movement. This is the floor the future "resume auto on respawn" option gets
// to build on.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('respawns-idle'), 'respawns-idle');

  player.usesAutocombat.auto = true;
  setEntityMotion(world, player, { x: 1200, y: 1200 }, { mode: 'direct' });
  world.killPlayer('respawns-idle', { kind: 'stance', damage: 100, stanceName: 'Test Stance' });
  world.respawnPlayer('respawns-idle');

  assert(!player.isDead, 'the player should be alive again');
  assert(player.hasHealth.hp === player.hasHealth.maxHp, 'a respawn should be at full health');
  assert(player.usesAutocombat.auto === false, 'a respawn must not resume auto-combat');
  assert(player.usesAutocombat.autoTraverse === false, 'a respawn must not resume auto-traverse');
  assert(!player.hasAutoTraversePath, 'a respawn must carry no traverse path');
  assert(!player.isMoving, 'a respawn must stand still');
  assert(!player.hasManualMoveIntent, 'a respawn must carry no manual-move latch');
}

console.log('deathCancelsOrders: ok');
