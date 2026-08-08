import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  describeMonsterMechanics,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { spawnPack } from '../src/systems/world/spawning';
import { applyPlayerProcDamage } from '../src/systems/combat/damage/procDamage';
import {
  DEATH_EMPOWER_EFFECT_ID,
} from '../src/systems/combat/damage/monsterDeathEffects';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function makePlayerSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, hpRegen: 0 },
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
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
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

initCombatSystems();

// A proc kill must enter the normal onKill pipeline, apply the authored radius
// buff to living nearby monsters, leave distant monsters untouched, and publish
// a readable ecology pulse.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('death-killer', 400, 400), 'death-killer');
  const dead = world.createMonster(NODE, 'charnel-brute', { x: 400, y: 400 });
  const near = world.createMonster(NODE, 'bone-crawler', { x: 500, y: 400 });
  const far = world.createMonster(NODE, 'bone-crawler', { x: 800, y: 400 });
  assert(!!dead && !!near && !!far, 'death-effect test monsters should spawn');

  const outcome = applyPlayerProcDamage(world, player, dead!, dead!.hasHealth.maxHp * 2);
  assert(outcome === 'killed', 'the proc should kill the charnel brute');
  assert(!world.hasMonster(dead!.isMonster.id), 'the killed monster should be removed normally');
  assert(
    !!getStatusEffect(near!.tracksCombat, DEATH_EMPOWER_EFFECT_ID),
    'a living monster inside the death radius should receive the empower status',
  );
  assert(
    !getStatusEffect(far!.tracksCombat, DEATH_EMPOWER_EFFECT_ID),
    'a monster outside the death radius must not receive the empower status',
  );
  assert(
    world.takeNodeEvents(NODE).some(
      (event) => event.kind === 'ecology-pulse' && event.pulse === 'death-empower',
    ),
    'an applied death surge should emit its ecology pulse',
  );

  const hpBefore = player.hasHealth.hp;
  runMonsterAttack(world, near!, player, 10_000);
  const empoweredDamage = hpBefore - player.hasHealth.hp;
  const hpMid = player.hasHealth.hp;
  runMonsterAttack(world, far!, player, 20_000);
  const baselineDamage = hpMid - player.hasHealth.hp;
  assert(
    empoweredDamage > baselineDamage,
    `the death surge should increase direct monster damage (${empoweredDamage} <= ${baselineDamage})`,
  );
}

// The same centralized death listener also closes the previously unwired live
// pack-alpha cleanup path (the old ecology test invoked it directly).
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('pack-killer', 400, 400), 'pack-killer');
  const pack = spawnPack(world, NODE, 'wolf', { x: 400, y: 400 });
  assert(!!pack && pack.length > 1, 'wolf pack should spawn an alpha and followers');
  const [alpha, ...followers] = pack!;
  applyPlayerProcDamage(world, player, alpha, alpha.hasHealth.maxHp * 2);
  assert(
    followers.every((follower) => !world.hasMonster(follower.isMonster.id)),
    'killing a pack alpha through the live pipeline should scatter its followers',
  );
}

// Shared presentation must expose the authored mechanic without a server round trip.
{
  const def = MONSTER_DATABASE.get('charnel-brute');
  assert(!!def, 'charnel brute definition should exist');
  assert(
    describeMonsterMechanics(def!).some((line) => line.id === 'death-empower'),
    'the bestiary should describe the death surge',
  );
}

console.log('monsterDeathEffects: ok');
