import {
  GAME_CONFIG,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayer(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: 'node-clearing',
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

const world = new World();
world.suppressRepopulation = true;

const first = world.attachPlayerEntity(makePlayer('persisted-one'), 'socket-one');
const second = world.attachPlayerEntity(makePlayer('persisted-two'), 'socket-two');

first.tracksProgression.level = 9;
first.tracksProgression.essences.red = 17;
first.holdsInventory.inventory.push('first-only-item');
world.tick(100, 100);

assert(second.tracksProgression.level === 0, 'level state should remain isolated');
assert(second.tracksProgression.essences.red === 0, 'wallet state should remain isolated');
assert(second.holdsInventory.inventory.length === 0, 'inventory state should remain isolated');
assert(world.countPlayersInNode('node-clearing') === 2, 'both players should be attached');

world.detachPlayerEntity('socket-one');

assert(!world.getPlayerEntity('socket-one'), 'detached player should leave the entity index');
assert(world.getPlayerEntity('socket-two') === second, 'other player should remain attached');
assert(world.countPlayersInNode('node-clearing') === 1, 'node occupancy should retain the other player');

console.log('characterIsolation.test.ts: ok');
