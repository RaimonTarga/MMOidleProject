import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack, updateCombat } from '../src/systems/combat/engine/combat';
import { mirrorTargetStatus } from '../src/systems/combat/targetStatus';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 405, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

{
  const boulder = MONSTER_DATABASE.get('peak-archer')?.chargedAttack;
  const slam = MONSTER_DATABASE.get('granite-titan')?.chargedAttack;
  const ward = MONSTER_DATABASE.get('granite-titan')?.lowHealthWard;
  assert(boulder?.name === 'Huge Boulder' && boulder.castMs === 1_500 && boulder.initialCooldownMs === 3_000 && boulder.multiplier === 2.0 && boulder.aoe?.radius === 83, 'Boulder Thrower should author a delayed, high-damage Huge Boulder with a tight impact zone');
  assert(slam?.castMs === 2_400 && slam.initialCooldownMs === 0 && slam.cooldownMs === 6_000 && slam.multiplier === 1.65 && slam.aoe?.radius === 120, 'Granite Titan should open with a heavy, smaller Ground Slam on its six-second cadence');
  assert(ward?.thresholdPct === 0.25 && ward.wardPct === 0.25 && ward.castMs === 1_000, 'Granite Titan should author its 25% HP Granite Barrier cast');
}

// Huge Boulder is held for its full cast, then lands at the planted position as
// a large committed AoE rather than following the player.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('boulder-target'), 'boulder-target');
  const thrower = world.createMonster(NODE, 'peak-archer', { x: 400, y: 400 });
  assert(thrower, 'Boulder Thrower should spawn');
  setAggroTarget(world, thrower, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  thrower.hasAwareness.state = 'attacking';
  thrower.performsAttack.lastAttackAt = 0;

  player.performsAttack.lastAttackAt = 4_000;
  updateCombat(world, 0, 4_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Huge Boulder' && event.castMs === 1_500),
    'Huge Boulder should wait for its three-second initial cooldown then begin a one-and-a-half-second cast',
  );
  player.performsAttack.lastAttackAt = 5_500;
  updateCombat(world, 0, 5_500);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'boss-fx' && event.fx === 'slam' && event.radius === 83),
    'Huge Boulder should resolve as the tight planted AoE impact',
  );
}

// At 25% HP the Titan stops, casts Granite Barrier, projects the ward onto its
// target frame, and absorbs direct player damage before losing health.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('titan-target'), 'titan-target');
  const titan = world.createMonster(NODE, 'granite-titan', { x: 400, y: 400 });
  assert(titan, 'Granite Titan should spawn');
  titan.hasHealth.hp = titan.hasHealth.maxHp * 0.25;
  setAggroTarget(world, titan, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  titan.hasAwareness.state = 'attacking';
  titan.performsAttack.lastAttackAt = 1_000;

  player.performsAttack.lastAttackAt = 1_000;
  updateCombat(world, 0, 1_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Granite Barrier' && event.castMs === 1_000),
    'the low-health Titan should begin its one-second Granite Barrier cast',
  );
  player.performsAttack.lastAttackAt = 2_000;
  updateCombat(world, 0, 2_000);
  const barrier = getStatusEffect(titan.tracksCombat, 'granite-barrier');
  assert(barrier?.data.wardAmount === Math.round(titan.hasHealth.maxHp * 0.25), 'Granite Barrier should grant a ward worth 25% of max HP');
  setAttackTarget(world, player, titan.isMonster.id);
  mirrorTargetStatus(world);
  assert(titan.hasStatus.targetStatus?.some(status => status.id === 'granite-barrier' && status.values?.some(value => value.label === 'Ward')), 'Granite Barrier should be visible on the target status bar');

  player.dealsDamage.attack = 100;
  const hpBeforeHit = titan.hasHealth.hp;
  runPlayerAttack(world, player, titan, 2_100, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });
  assert(titan.hasHealth.hp > hpBeforeHit - 100, 'Granite Barrier should absorb part of the incoming direct hit before Titan HP');
}

console.log('mountainT2ChargedDefenses.test.ts: ok');
