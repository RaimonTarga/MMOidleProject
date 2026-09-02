import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { monsterAttackCooldown } from '../src/systems/combat/engine/monsterMechanics';
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
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

// Howl is immediately ready on combat entry, casts for 1.5 seconds, then hastes
// every nearby living monster (including the Dire Wolf) for the authored 5 seconds.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('howl-target'), 'howl-target');
  const wolf = world.createMonster(NODE, 'ancient-wolf', { x: 400, y: 400 });
  const whelp = world.createMonster(NODE, 'dire-whelp', { x: 600, y: 400 });
  const distant = world.createMonster(NODE, 'dire-whelp', { x: 800, y: 400 });
  assert(wolf && whelp && distant, 'Howl test monsters should spawn');
  setAggroTarget(world, wolf, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  wolf.hasAwareness.state = 'attacking';
  wolf.performsAttack.lastAttackAt = 0;

  updateCombat(world, 0, 5_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Howl' && event.castMs === 1_500),
    'Howl should start as a 1.5-second monster cast as soon as its first attack is due',
  );
  updateCombat(world, 0, 6_500);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'howl'),
    'Howl should publish its dedicated resolve animation cue',
  );

  const wolfHowl = getStatusEffect(wolf.tracksCombat, 'monster-howl-haste');
  assert(wolfHowl?.remainingMs === 5_000, 'Howl should give the caster a five-second status-backed haste window');
  assert(getStatusEffect(whelp.tracksCombat, 'monster-howl-haste') !== undefined, 'Howl should buff nearby mobs');
  assert(getStatusEffect(distant.tracksCombat, 'monster-howl-haste') === undefined, 'Howl should not buff distant mobs');
  assert(monsterAttackCooldown(wolf) === Math.round(1_100 / 1.5), 'Howl should raise attack speed by exactly 50%');

  setAttackTarget(world, player, wolf.isMonster.id);
  mirrorTargetStatus(world);
  const tile = wolf.hasStatus.targetStatus?.find(status => status.id === 'monster-howl-haste');
  assert(tile?.totalMs === 5_000, 'Howl should project a timed target-frame buff tile');
  assert(tile.values?.some(value => value.label === 'Attack speed' && value.value === '+50%'), 'Howl tile should expose its live magnitude');
}

// Howl is a pack command, not a bite: the Dire Wolf should plant its feet and
// cast it from its current position even while the player is still far away.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('distant-howl-target'), 'distant-howl-target');
  player.hasPosition.current = { x: 1_000, y: 400 };
  const wolf = world.createMonster(NODE, 'ancient-wolf', { x: 400, y: 400 });
  assert(wolf, 'distant Howl wolf should spawn');
  setAggroTarget(world, wolf, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  wolf.performsAttack.lastAttackAt = 0;

  updateMonsters(world, 0, 5_000);
  assert(wolf.hasAwareness.state === 'attacking' && !wolf.isMoving, 'an armed Howl should hold the wolf in place out of bite range');
  updateCombat(world, 0, 5_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Howl'),
    'the out-of-range Dire Wolf should begin Howl instead of chasing first',
  );
}

// Barrage waits three seconds on a fresh pull, then grants three fast basic attacks
// rather than the Thorn Spitter's old periodic extra-hit volley.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('barrage-target'), 'barrage-target');
  const spitter = world.createMonster(NODE, 'canopy-sprite', { x: 400, y: 400 });
  assert(spitter, 'Barrage test spitter should spawn');
  setAggroTarget(world, spitter, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  spitter.hasAwareness.state = 'attacking';
  spitter.performsAttack.lastAttackAt = 0;

  updateCombat(world, 0, 2_500);
  assert(
    !world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Barrage'),
    'Barrage must respect its three-second starting cooldown',
  );
  updateCombat(world, 0, 5_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Barrage' && event.castMs === 1_000),
    'Barrage should begin as a one-second cast after its starting cooldown',
  );
  updateCombat(world, 0, 6_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'barrage'),
    'Barrage should publish its dedicated resolve animation cue',
  );
  assert(getStatusEffect(spitter.tracksCombat, 'thorn-spitter-barrage')?.stacks === 3, 'Barrage should begin with three attack charges');
  assert(monsterAttackCooldown(spitter) === 800, 'Barrage should give exactly 200% attack speed');

  updateCombat(world, 0, 6_001);
  assert(getStatusEffect(spitter.tracksCombat, 'thorn-spitter-barrage')?.stacks === 2, 'first hasted attack should spend one Barrage charge');
  updateCombat(world, 0, 6_801);
  assert(getStatusEffect(spitter.tracksCombat, 'thorn-spitter-barrage')?.stacks === 1, 'second hasted attack should spend one Barrage charge');
  updateCombat(world, 0, 7_601);
  assert(!getStatusEffect(spitter.tracksCombat, 'thorn-spitter-barrage'), 'third hasted attack should consume Barrage completely');
}

console.log('forestT2CastedAbilities.test.ts: ok');
