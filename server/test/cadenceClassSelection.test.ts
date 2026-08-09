import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  composePlayerView,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeUnclassedPlayer(): PersistedPlayerSlices {
  return {
    isPlayer: { id: 'cadence-selection-player', name: 'Cadence Selection Tester' },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: 'node-5-5',
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 1,
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
      runesOwned: [...STARTER_RUNE_IDS],
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
const player = world.attachPlayerEntity(makeUnclassedPlayer(), 'cadence-selection-player');

assert(player.usesCadence === undefined, 'unclassed player should not start with a Cadence slice');
assert(unlockSkill(world, player, 'cadence-root'), 'Cadence root should unlock');
assert(!!player.usesCadence, 'Cadence slice should attach during class selection');
assert(player.usesCadence!.threshold === 5, 'Cadence threshold should initialize before the first attack');
assert(player.usesCadence!.count === 0, 'Cadence should begin with zero completed setup attacks');

const view = composePlayerView(player);
assert(!!view, 'selected Cadence player should compose a network view');
assert(view!.cadenceThreshold === 5, 'the first post-selection HUD view should expose threshold five');
assert(view!.cadenceCount === 0, 'the first post-selection HUD view should expose count zero');
assert(view!.cadenceThreshold - 1 === 4, 'baseline Cadence should present four setup chambers');

console.log('cadenceClassSelection.test.ts: ok');
