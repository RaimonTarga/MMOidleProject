import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 800, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
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
  const hawkDef = MONSTER_DATABASE.get('savanna-hawk');
  const eagleDef = MONSTER_DATABASE.get('stone-eagle');
  const rocDef = MONSTER_DATABASE.get('cliffside-roc');
  assert(hawkDef?.behavior === 'melee' && hawkDef.stats.attackRange === 12, 'Savanna Hawk should be a close-range melee attacker');
  assert(hawkDef.stats.speed === 110 && hawkDef.stats.pullRange === 440 && hawkDef.ai.leashRange === 1_200, 'Savanna Hawk should have its faster movement, wider pull radius, and extended leash');
  assert(hawkDef.engageSequence?.kind === 'cast-charge-root' && hawkDef.engageSequence.castMs === 1_000, 'Savanna Hawk should author a one-second Dive Bomb cast');
  assert(eagleDef?.stats.speed === 105 && eagleDef.ai.idleMinMs === 180 && eagleDef.ai.leashRange === 1_200, 'Stone Eagle should be significantly faster, change direction frequently while idle, and keep its target over a longer leash');
  assert(eagleDef.engageSequence?.kind === 'cast-charge-strike' && eagleDef.engageSequence.damageMultiplier === 2, 'Stone Eagle should author Skyfall Rend as a doubled landing strike');
  assert(rocDef?.attackStyle === 'talons' && rocDef.behavior === 'melee', 'Cliffside Roc should reuse the shared talon melee attack');
  assert(rocDef.engageSequence?.kind === 'cast-charge-strike' && rocDef.engageSequence.damageMultiplier === 2.25 && rocDef.engageSequence.fx === 'dive-bomb', 'Cliffside Roc should inherit the telegraphed Skyfall Rend with an apex landing strike');
}

// Sighting the player begins the cast in place. Once it resolves, the hawk
// charges at the authored burst speed, then roots on contact before its talons hit.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('hawk-target'), 'hawk-target');
  const hawk = world.createMonster(NODE, 'savanna-hawk', { x: 400, y: 400 });
  assert(hawk, 'Dive Bomb test hawk should spawn');

  updateMonsters(world, 0, 1_000);
  assert(hawk.hasAwareness.state === 'attacking' && !hawk.isMoving, 'the hawk should cast Dive Bomb in place as soon as it spots a player');
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Dive Bomb' && event.castMs === 1_000),
    'sighting a player should publish the Dive Bomb cast bar',
  );
  const hpBeforeCast = player.hasHealth.hp;
  updateCombat(world, 0, 1_000);
  assert(player.hasHealth.hp === hpBeforeCast, 'the Dive Bomb wind-up should suppress ordinary attacks');

  updateMonsters(world, 0, 2_000);
  assert(hawk.hasAwareness.state === 'chasing' && hawk.hasPosition.speed === 374, 'when the cast resolves, the hawk should rush at its Dive Bomb speed');
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'dive-bomb'),
    'the cast completion should publish the Dive Bomb flight cue',
  );

  hawk.hasPosition.current = { x: 789, y: 400 };
  updateMonsters(world, 0, 2_100);
  const root = getStatusEffect(player.tracksCombat, 'slow');
  assert(root?.remainingMs === 2_000 && root.data.speedMult === 0, 'contact at the end of Dive Bomb should root the player for two seconds');
  assert(!getStatusEffect(player.tracksCombat, 'stunned'), 'Dive Bomb should not stun the player');
  syncPlayerBuffs(world, 2_100);
  const rootTile = player.hasStatus.activeBuffs.find(buff => buff.id === 'debuff-root');
  assert(rootTile?.label === 'ROOT' && rootTile.remainingMs === 2_000, 'Dive Bomb root should appear as a timed ROOT debuff on the player buff bar');
  updateCombat(world, 0, 2_100);
  assert(player.hasHealth.hp < hpBeforeCast, 'the hawk should immediately follow its landing with its melee talon strike');
}

// Stone Eagle has the same cast-and-rush readability, but its Skyfall Rend pays
// out as a larger first talon hit instead of applying any landing control.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('eagle-target'), 'eagle-target');
  const eagle = world.createMonster(NODE, 'stone-eagle', { x: 400, y: 400 });
  assert(eagle, 'Skyfall Rend test eagle should spawn');

  updateMonsters(world, 0, 1_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Skyfall Rend'),
    'Stone Eagle should telegraph Skyfall Rend before it crosses the gap',
  );
  updateMonsters(world, 0, 2_000);
  assert(eagle.hasPosition.speed === 420 && eagle.hasAwareness.state === 'chasing', 'Skyfall Rend should charge at four times the Eagle’s already-fast base speed');

  eagle.hasPosition.current = { x: 789, y: 400 };
  const hpBeforeLanding = player.hasHealth.hp;
  updateMonsters(world, 0, 2_100);
  assert(!getStatusEffect(player.tracksCombat, 'slow') && !getStatusEffect(player.tracksCombat, 'stunned'), 'Skyfall Rend should land damage without rooting or stunning');
  updateCombat(world, 0, 2_100);
  assert(player.hasHealth.hp < hpBeforeLanding, 'Skyfall Rend should land its alpha strike');
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-hit' && event.empowered),
    'Skyfall Rend’s landing hit should be emitted as the amplified strike',
  );
}

console.log('plainsHawkDiveBomb.test.ts: ok');
