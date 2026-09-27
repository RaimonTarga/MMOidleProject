import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  composeMonsterView,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { applyStun } from '../src/systems/combat/status/stun';
import { World } from '../src/world/World';

// The charge-on-aggro burst is published as `hasStatus.charging` for the client's
// charge-rush aura: present exactly on the ticks the burst is applied.

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const CHARGER = 'boar';
const PLAIN = 'forest-slime';
const charge = MONSTER_DATABASE.get(CHARGER)?.chargeOnAggro;
assert(!!charge, 'the boar should author chargeOnAggro');
assert(!MONSTER_DATABASE.get(PLAIN)?.chargeOnAggro, 'the control monster should not charge');

function playerSlices(id: string, x: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
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

function engage(world: World, typeId: string, playerId: string, now: number) {
  const monster = world.createMonster(NODE, typeId, { x: 400, y: 400 });
  assert(!!monster, `test needs a ${typeId}`);
  setAggroTarget(world, monster!, { id: playerId, kind: 'player' }, now);
  return monster!;
}

// Charging while the burst carries it in, then cleared (key absent) once spent.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('charge-target', 2_000), 'charge-target');
  const boar = engage(world, CHARGER, player.isPlayer.id, 1_000);

  updateMonsters(world, 100, 1_000);
  assert(boar.hasStatus.charging === true, 'a charging boar should publish the charging bit');
  assert(composeMonsterView(boar)?.charging === true, 'the monster view should carry the charging bit');

  const ticks = Math.ceil(charge!.durationMs / 100) + 1;
  for (let i = 1; i <= ticks; i++) updateMonsters(world, 100, 1_000 + i * 100);
  assert(boar.hasAwareness.state === 'chasing', 'the boar should still be chasing after the burst');
  assert(!('charging' in boar.hasStatus), 'a spent burst should remove the charging key, not leave false');
}

// A stun mid-charge clears the bit: the burst is not being applied.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('stun-target', 2_000), 'stun-target');
  const boar = engage(world, CHARGER, player.isPlayer.id, 1_000);
  updateMonsters(world, 100, 1_000);
  assert(boar.hasStatus.charging === true, 'precondition: charging');
  applyStun(boar.tracksCombat, 1_000, player.isPlayer.id);
  updateMonsters(world, 100, 1_100);
  assert(boar.hasStatus.charging === undefined, 'a stunned charger should not be drawn charging');
}

// A monster without chargeOnAggro never publishes it.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('plain-target', 2_000), 'plain-target');
  const slime = engage(world, PLAIN, player.isPlayer.id, 1_000);
  for (let i = 0; i < 5; i++) updateMonsters(world, 100, 1_000 + i * 100);
  assert(slime.hasStatus.charging === undefined, 'a non-charger should never publish charging');
}

console.log('chargeOnAggroVisual: ok');
