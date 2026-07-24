import {
  GAME_CONFIG,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function playerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: 1,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
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
      equippedStances: { default: null, reactive: null },
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

const cases = [
  ['node-t1-forest-01', 'node-clearing'],
  ['node-t2-desert-01', 'node-t2-sanctuary'],
  ['node-t3-volcanic-01', 'node-t3-sanctuary'],
  ['node-t4-trench-01', 'node-t4-sanctuary'],
] as const;

for (const [fromNodeId, expectedNodeId] of cases) {
  const world = new World();
  const id = `player-${expectedNodeId}`;
  const player = world.attachPlayerEntity(playerSlices(id, fromNodeId), id);
  world.respawnPlayer(id);
  assert(
    player.hasPosition.nodeId === expectedNodeId,
    `${fromNodeId} should respawn at ${expectedNodeId}`,
  );
  assert(
    player.hasHealth.hp === player.hasHealth.maxHp,
    `${fromNodeId} respawn should restore health`,
  );
}

const sanctuaryWorld = new World();
for (const sanctuaryId of [
  'node-t2-sanctuary',
  'node-t3-sanctuary',
  'node-t4-sanctuary',
]) {
  sanctuaryWorld.ensurePopulation(sanctuaryId);
  sanctuaryWorld.ensureBoss(sanctuaryId);
  assert(
    sanctuaryWorld.getMonsterCountInNode(sanctuaryId) === 0 &&
      sanctuaryWorld.getBossCountInNode(sanctuaryId) === 0,
    `${sanctuaryId} must remain empty`,
  );
}

console.log('regionalRespawn.test.ts: ok');
