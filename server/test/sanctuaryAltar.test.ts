import {
  GAME_CONFIG,
  NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
  SKILL_TREE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { resetPlayerClass } from '../src/admin/gameActions';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function playerSlices(id: string, nodeId: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'Altar Tester' },
    hasPosition: {
      current: { x, y },
      nodeId,
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
      currentSkillTier: 1,
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

const refundableSkill = [...SKILL_TREE.values()].find(skill => skill.cost > 0);
assert(!!refundableSkill, 'skill tree has a refundable passive');
if (!refundableSkill) throw new Error('unreachable');

for (const nodeId of [
  'node-clearing',
  'node-t2-sanctuary',
  'node-t3-sanctuary',
  'node-t4-sanctuary',
]) {
  const altar = (NODE_FEATURES[nodeId] ?? []).find(
    feature => feature.id === RUNE_ALTAR_FEATURE_ID,
  );
  assert(!!altar, `${nodeId} exposes the reset altar feature`);
  if (!altar) throw new Error('unreachable');

  const world = new World();
  const player = world.attachPlayerEntity(
    playerSlices(`${nodeId}-player`, nodeId, altar.x, altar.y),
    `${nodeId}-socket`,
  );
  player.usesSkills.unlockedSkills = [refundableSkill.id];

  const result = resetPlayerClass(world, player, { requireAltar: true });
  assert(result.ok, `${nodeId} altar permits a passive reset`);
  assert(
    player.tracksProgression.skillPoints === refundableSkill.cost,
    `${nodeId} altar refunds passive points`,
  );
  assert(player.usesSkills.unlockedSkills.length === 0, `${nodeId} clears passives`);
}

const outsideWorld = new World();
const outside = outsideWorld.attachPlayerEntity(
  playerSlices('outside-player', 'node-t2-sanctuary', 100, 100),
  'outside-socket',
);
assert(
  !resetPlayerClass(outsideWorld, outside, { requireAltar: true }).ok,
  'sanctuary reset still requires standing on the altar',
);

console.log('sanctuaryAltar.test.ts: ok');
