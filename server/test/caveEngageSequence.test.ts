import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { applyStun } from '../src/systems/combat/status/stun';
import { buildGroundZoneViews } from '../src/systems/world/groundZones';
import { updateMovement } from '../src/systems/world/movement';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const DEF = MONSTER_DATABASE.get('cave-troll');
assert(!!DEF?.engageSequence, 'cave troll should author the engage sequence');
assert(!!DEF?.chargedAttack?.aoe, 'cave troll sequence needs the existing slam');
const SEQUENCE = DEF!.engageSequence!;
assert(
  SEQUENCE.kind === 'cast-charge-root' && SEQUENCE.castMs === 500 &&
    SEQUENCE.speedMult === 15 && SEQUENCE.rootMs === 1_700 &&
    SEQUENCE.followWithChargedAttack === true,
  'Cave Troll should use a brief cast, rush, root, then arm its Ground Slam',
);

const T3_DEF = MONSTER_DATABASE.get('cavern-troll');
assert(!!T3_DEF?.engageSequence, 'cavern troll should author an engage sequence');
assert(!!T3_DEF?.chargedAttack?.aoe, 'cavern troll sequence needs its existing slam');
const T3_SEQUENCE = T3_DEF!.engageSequence!;
assert(
  T3_SEQUENCE.kind === 'cast-charge-root' && T3_SEQUENCE.castMs === 500 &&
    T3_SEQUENCE.speedMult === 15 && T3_SEQUENCE.rootMs === 1_700 &&
    T3_SEQUENCE.followWithChargedAttack === true && T3_DEF.chargeOnAggro === undefined,
  'Cavern Troll should replace its legacy charge-lock opener with Savage Rush',
);

function playerSlices(id: string, x: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x, y: 400 },
      nodeId: NODE,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
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

function engage(world: World, playerId: string, monsterX: number, now: number) {
  const troll = world.createMonster(NODE, 'cave-troll', { x: monsterX, y: 400 });
  assert(!!troll, 'test needs a cave troll');
  setAggroTarget(world, troll!, { id: playerId, kind: 'player' }, now);
  return troll!;
}

function engageCavernTroll(world: World, playerId: string, monsterX: number, now: number) {
  const troll = world.createMonster(NODE, 'cavern-troll', { x: monsterX, y: 400 });
  assert(!!troll, 'test needs a cavern troll');
  setAggroTarget(world, troll!, { id: playerId, kind: 'player' }, now);
  return troll!;
}

// The Troll plants for a short cast, rushes, roots on contact without stunning,
// then immediately starts its pre-existing Ground Slam.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('sequence-target', 405), 'sequence-target');
  const t0 = 1_000;
  const troll = engage(world, player.isPlayer.id, 400, t0);

  updateMonsters(world, 100, t0);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Savage Rush' && event.castMs === 500),
    'the Troll should cast Savage Rush in place before charging',
  );
  updateMonsters(world, 100, t0 + 500);
  const root = getStatusEffect(player.tracksCombat, 'slow');
  assert(root?.data.speedMult === 0 && root.data.totalMs === 1_700, 'Savage Rush should root on landing');
  assert(player.cannotAttack === undefined, 'Savage Rush should root, not stun or lock player attacks');

  updateCombat(world, 100, t0 + 500);
  const zones = buildGroundZoneViews(world, NODE, t0 + 500) ?? [];
  assert(zones.length === 1 && zones[0].kind === 'slam-telegraph', 'landing should immediately start the existing Ground Slam telegraph');
}

// The T3 continuation must run the same cast -> rush -> root -> slam lifecycle,
// not merely declare a matching data shape.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('t3-sequence-target', 405), 't3-sequence-target');
  const t0 = 6_000;
  engageCavernTroll(world, player.isPlayer.id, 400, t0);

  updateMonsters(world, 100, t0);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Savage Rush' && event.castMs === 500),
    'the Cavern Troll should telegraph Savage Rush before charging',
  );
  updateMonsters(world, 100, t0 + 500);
  const root = getStatusEffect(player.tracksCombat, 'slow');
  assert(root?.data.speedMult === 0 && root.data.totalMs === 1_700, 'Cavern Troll Savage Rush should root on landing');
  assert(player.cannotAttack === undefined, 'Cavern Troll Savage Rush should not lock player attacks');

  updateCombat(world, 100, t0 + 500);
  const zones = buildGroundZoneViews(world, NODE, t0 + 500) ?? [];
  assert(zones.length === 1 && zones[0].kind === 'slam-telegraph', 'Cavern Troll landing should start its Ground Slam telegraph');
}

// The rush speed is an actual position-speed override, not just an animation cue.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('rush-speed-target', 800), 'rush-speed-target');
  const t0 = 4_000;
  const troll = engage(world, player.isPlayer.id, 400, t0);
  updateMonsters(world, 100, t0);
  updateMonsters(world, 100, t0 + 500);
  assert(troll.hasPosition.speed === 225, 'Savage Rush should raise the Troll from 15 to 225 movement speed');
  const before = troll.hasPosition.current.x;
  updateMovement(world, 100, t0 + 500);
  assert(troll.hasPosition.current.x - before >= 22, 'Savage Rush should cover about 22.5 units per 100ms while charging');
}

// A stun during the cast aborts the rush and clears its client telegraph.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('interrupt-target', 405), 'interrupt-target');
  const troll = engage(world, player.isPlayer.id, 400, 2_000);
  updateMonsters(world, 100, 2_000);
  applyStun(troll.tracksCombat, 1_000, player.isPlayer.id);
  updateMonsters(world, 100, 2_100);
  assert(
    getStatusEffect(player.tracksCombat, 'slow') === undefined,
    'interrupting Savage Rush should prevent its landing root',
  );
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired === false),
    'interrupting Savage Rush should clear its cast bar',
  );
}

console.log('cave engage sequence tests passed');
