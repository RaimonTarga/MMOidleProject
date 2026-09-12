import {
  DEFAULT_RUNE_LOADOUT,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { getAutoTargetId } from '../src/systems/combat/ai/targetPriority';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateAutoTargets } from '../src/systems/combat/ai/autoTarget';
import { updateRuneDerivedConfig } from '../src/systems/combat/ai/runeConfig';
import { markEngaged } from '../src/systems/combat/ai/engagement';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { applyManualMoveIntent } from '../src/systems/world/manualMove';
import {
  clearAutoTraversePath,
  startManualNavigation,
  updateAutoTraverse,
} from '../src/systems/world/autoTraverse';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const START = 'node-clearing';
const DESTINATION = 'node-t1-plains-01';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: START,
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
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [...DEFAULT_RUNE_LOADOUT],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
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

function makeTraveler(id: string) {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices(id), id);
  startManualNavigation(world, player, DESTINATION);
  assert(player.hasAutoTraversePath, 'precondition: navigation installs a persistent route');
  return { world, player };
}

// Uninterrupted navigation remains owned by the retained route.
{
  const { world, player } = makeTraveler('uninterrupted');
  updateRuneDerivedConfig(world, 1_000);
  updateAutoTraverse(world, 1_000);
  assert(player.hasAutoTraversePath?.targetNodeId === DESTINATION, 'uninterrupted travel keeps its destination');
  assert(player.isMoving, 'uninterrupted travel continues moving toward the next gate');
  assert(!player.fightsWhileTraveling, 'uninterrupted travel does not enter combat activity');
}

// Fight Back is a temporary activity scoped to actual attackers. An uninvolved,
// closer monster must neither steal the target nor become a farming fallback.
{
  const { world, player } = makeTraveler('single-interruption');
  const attacker = world.createMonster(START, 'tiny-slime', { x: 540, y: 400 });
  const bystander = world.createMonster(START, 'tiny-slime', { x: 430, y: 400 });
  assert(attacker && bystander, 'precondition: interruption monsters spawn');
  setAggroTarget(world, attacker, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  markEngaged(world, player, 1_000);

  updateRuneDerivedConfig(world, 1_000);
  updateAutoTraverse(world, 1_000);
  updateAutoTargets(world, 1_000);

  assert(player.fightsWhileTraveling, 'an attacker temporarily interrupts travel');
  assert(player.hasAutoTraversePath?.targetNodeId === DESTINATION, 'combat preserves the requested destination');
  assert(getAutoTargetId(player) === attacker.isMonster.id, 'Fight Back targets the actual attacker, not a closer bystander');

  world.removeMonsterEntity(attacker.isMonster.id);
  updateRuneDerivedConfig(world, 1_100);
  updateAutoTraverse(world, 1_100);
  const resumedGoal = player.hasMovePath?.goal;
  updateAutoTargets(world, 1_100);

  assert(!player.fightsWhileTraveling, 'the temporary combat activity ends as soon as the threat clears');
  assert(player.hasAutoTraversePath?.targetNodeId === DESTINATION, 'the original destination survives the interruption');
  assert(player.isMoving && resumedGoal, 'travel resumes immediately after the attacker dies');
  assert(player.hasMovePath?.goal.x === resumedGoal.x && player.hasMovePath.goal.y === resumedGoal.y, 'auto-targeting does not replace resumed gate movement');
  assert(getAutoTargetId(player) === null, 'the bystander is not acquired after the interruption');
  const bystanderHp = bystander.hasHealth.hp;
  updateCombat(world, 100, 5_000);
  assert(bystander.hasHealth.hp === bystanderHp, 'resumed travel does not auto-attack an uninvolved monster in reach');

  // The same retained intent may be interrupted and resumed repeatedly.
  const secondAttacker = world.createMonster(START, 'tiny-slime', { x: 520, y: 420 });
  assert(secondAttacker, 'precondition: second attacker spawns');
  setAggroTarget(world, secondAttacker, { id: player.isPlayer.id, kind: 'player' }, 1_200);
  markEngaged(world, player, 1_200);
  updateRuneDerivedConfig(world, 1_200);
  updateAutoTraverse(world, 1_200);
  updateAutoTargets(world, 1_200);
  assert(player.fightsWhileTraveling, 'a later attacker can interrupt the resumed route');
  assert(getAutoTargetId(player) === secondAttacker.isMonster.id, 'the later interruption targets its attacker');

  world.removeMonsterEntity(secondAttacker.isMonster.id);
  updateRuneDerivedConfig(world, 1_300);
  updateAutoTraverse(world, 1_300);
  updateAutoTargets(world, 1_300);
  assert(!player.fightsWhileTraveling && player.isMoving, 'travel resumes after every sequential interruption');
  assert(player.hasAutoTraversePath?.targetNodeId === DESTINATION, 'sequential interruptions retain one destination intent');
}

// Cancelling while interrupted destroys both the route and its temporary combat
// authority, so clearing the attacker later cannot resurrect travel.
{
  const { world, player } = makeTraveler('cancelled-interruption');
  const attacker = world.createMonster(START, 'tiny-slime', { x: 500, y: 400 });
  assert(attacker, 'precondition: cancellation attacker spawns');
  setAggroTarget(world, attacker, { id: player.isPlayer.id, kind: 'player' }, 2_000);
  updateRuneDerivedConfig(world, 2_000);
  updateAutoTraverse(world, 2_000);
  assert(player.fightsWhileTraveling, 'precondition: travel is interrupted');

  clearAutoTraversePath(world, player);
  assert(!player.hasAutoTraversePath, 'explicit cancellation clears the persistent route');
  assert(!player.fightsWhileTraveling, 'explicit cancellation clears temporary Fight Back authority');
  world.removeMonsterEntity(attacker.isMonster.id);
  updateRuneDerivedConfig(world, 2_100);
  updateAutoTraverse(world, 2_100);
  assert(!player.hasAutoTraversePath && !player.fightsWhileTraveling, 'a cancelled route never resumes after combat');
}

// A direct player movement order is an incompatible intent and must cancel an
// interrupted route before the combat pause gets another chance to retain it.
{
  const { world, player } = makeTraveler('manual-cancel');
  const attacker = world.createMonster(START, 'tiny-slime', { x: 500, y: 400 });
  assert(attacker, 'precondition: manual-cancel attacker spawns');
  setAggroTarget(world, attacker, { id: player.isPlayer.id, kind: 'player' }, 2_500);
  updateRuneDerivedConfig(world, 2_500);
  updateAutoTraverse(world, 2_500);
  assert(player.fightsWhileTraveling, 'precondition: direct-move route is interrupted');

  const move = applyManualMoveIntent(world, player, { x: 300, y: 300 });
  assert(move.accepted && player.hasManualMoveIntent, 'precondition: direct player movement is accepted');
  updateAutoTraverse(world, 2_600);
  assert(!player.hasAutoTraversePath, 'an incompatible movement order cancels the route while interrupted');
  assert(!player.fightsWhileTraveling, 'manual cancellation also releases Fight Back authority');
}

// Reaching the destination consumes the route normally.
{
  const { world, player } = makeTraveler('arrival');
  player.hasPosition.nodeId = DESTINATION;
  updateRuneDerivedConfig(world, 3_000);
  updateAutoTraverse(world, 3_000);
  assert(!player.hasAutoTraversePath, 'arrival clears the stored travel intent');
  assert(!player.fightsWhileTraveling, 'arrival leaves no interruption activity behind');
}

// Corrupt/invalid next-hop state keeps its existing cancellation semantics.
{
  const { world, player } = makeTraveler('invalid-path');
  player.hasAutoTraversePath.remainingPath[0] = 'not-a-neighbor';
  updateRuneDerivedConfig(world, 4_000);
  updateAutoTraverse(world, 4_000);
  assert(!player.hasAutoTraversePath && !player.fightsWhileTraveling, 'an invalid path cancels travel instead of retrying it');
}

// Outside travel, the ordinary auto-combat acquisition loop is untouched.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('ordinary-combat'), 'ordinary-combat');
  player.usesAutocombat.auto = true;
  const target = world.createMonster(START, 'tiny-slime', { x: 460, y: 400 });
  assert(target, 'precondition: ordinary combat target spawns');
  updateRuneDerivedConfig(world, 5_000);
  updateAutoTargets(world, 5_000);
  assert(getAutoTargetId(player) === target.isMonster.id, 'non-travel auto-combat still acquires ordinary targets');
  const targetHp = target.hasHealth.hp;
  updateCombat(world, 100, 5_000);
  assert(target.hasHealth.hp < targetHp, 'non-travel combat still attacks an ordinary target in reach');
}

console.log('travelFightBack: ok');
