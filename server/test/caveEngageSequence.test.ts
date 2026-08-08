import {
  CAVE_LOCKDOWN_EFFECT_ID,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffects,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent } from '../src/ecs/markerHelpers';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { applyStun } from '../src/systems/combat/status/stun';
import { buildGroundZoneViews } from '../src/systems/world/groundZones';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const DEF = MONSTER_DATABASE.get('cave-troll');
assert(!!DEF?.engageSequence, 'cave troll should author the engage sequence');
assert(!!DEF?.chargedAttack?.aoe, 'cave troll sequence needs the existing slam');
const SEQUENCE = DEF!.engageSequence!;

function playerSlices(id: string, x: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x, y: 400 },
      nodeId: NODE,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100_000, maxHp: 100_000, hpRegen: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null, reactive: null }, activeStance: null,
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

// Contact begins a source-owned root + attack lock, then forces the existing slam.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('sequence-target', 405), 'sequence-target');
  const t0 = 1_000;
  const troll = engage(world, player.isPlayer.id, 400, t0);

  updateMonsters(world, 100, t0);
  assert(player.isRooted !== undefined, 'contact should root the player');
  assert(player.cannotAttack !== undefined, 'contact should lock player attacks');
  assert(
    getStatusEffects(player.tracksCombat, CAVE_LOCKDOWN_EFFECT_ID).length === 1,
    'contact should create one source-owned lockdown status',
  );

  const hp = player.hasHealth.hp;
  troll.performsAttack.lastAttackAt = 0;
  updateCombat(world, 100, t0);
  assert(player.hasHealth.hp === hp, 'the lockdown beat must suppress troll basic attacks');

  updateCombatState(world, SEQUENCE.lockoutMs);
  assert(!player.isRooted, 'lock expiry should release movement');
  assert(!player.cannotAttack, 'lock expiry should release attacks');

  const slamAt = t0 + SEQUENCE.lockoutMs + 1;
  updateMonsters(world, 100, slamAt);
  updateCombat(world, 100, slamAt);
  const zones = buildGroundZoneViews(world, NODE, slamAt) ?? [];
  assert(zones.length === 1, 'lock completion should immediately start one slam telegraph');
  assert(zones[0].kind === 'slam-telegraph', 'the forced finisher should reuse the slam');
}

// A stun during the lockdown aborts the sequence and releases its markers.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('interrupt-target', 405), 'interrupt-target');
  const troll = engage(world, player.isPlayer.id, 400, 2_000);
  updateMonsters(world, 100, 2_000);
  applyStun(troll.tracksCombat, 1_000, player.isPlayer.id);
  updateMonsters(world, 100, 2_100);

  assert(!player.isRooted, 'interrupting the lock should release its root');
  assert(!player.cannotAttack, 'interrupting the lock should release its attack marker');
  assert(
    getStatusEffects(player.tracksCombat, CAVE_LOCKDOWN_EFFECT_ID).length === 0,
    'interrupting should remove only the troll-owned lockdown instance',
  );
}

// Releasing the cave-owned lock must not remove an intrinsic Summoner marker.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('summoner-target', 405), 'summoner-target');
  attachComponent(world, player, 'cannotAttack', {});
  const troll = engage(world, player.isPlayer.id, 400, 3_000);
  updateMonsters(world, 100, 3_000);
  applyStun(troll.tracksCombat, 1_000, player.isPlayer.id);
  updateMonsters(world, 100, 3_100);
  assert(
    player.cannotAttack !== undefined,
    'sequence cleanup must preserve a pre-existing cannotAttack marker',
  );
}

// At range the opener owns the charge speed; CC aborts it for this session.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('charge-target', 620), 'charge-target');
  const troll = engage(world, player.isPlayer.id, 400, 4_000);
  updateMonsters(world, 100, 4_000);
  assert(troll.hasAwareness.state === 'chasing', 'distant opener should chase');
  assert(
    troll.hasPosition.speed === Math.round(troll.controlsMonster.baseSpeed * SEQUENCE.speedMult),
    'distant opener should use the authored charge multiplier',
  );

  applyStun(troll.tracksCombat, 500, player.isPlayer.id);
  updateMonsters(world, 100, 4_100);
  updateCombatState(world, 500);
  updateMonsters(world, 100, 4_700);
  assert(
    troll.hasPosition.speed !== Math.round(troll.controlsMonster.baseSpeed * SEQUENCE.speedMult),
    'an interrupted charge must not resume in the same aggro session',
  );
}

console.log('cave engage sequence tests passed');
