/** Focused server-authoritative coverage for Conduit's formation Technique adapter. */
import {
  ABILITY_SWEEP_FX,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { updateAbilityFiring } from '../src/systems/player/abilities/abilityFiring';
import { takeWorldLogEvents } from '../src/world/worldLog';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

type FormationFrame = 'light' | 'balanced' | 'heavy' | null;

function slices(
  id: string,
  abilityId: string,
  tier: number,
  frame: FormationFrame = null,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: 'node-5-5',
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
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
      playerTier: tier,
      currentSkillTier: tier,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [abilityId],
      equippedAbilities: { techniques: [abilityId], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [
        'summoner-root',
        ...(frame === 'light' ? ['summoner-light'] : []),
        ...(frame === 'balanced' ? ['summoner-balanced'] : []),
        ...(frame === 'heavy' ? ['summoner-heavy'] : []),
      ],
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: frame,
      selectedRange: null,
      combatArchetype: 'summoner',
    },
  };
}

function createMonster(world: World, x: number) {
  const monster = world.createMonster('node-5-5', 'plains-slime', { x, y: 400 });
  if (!monster) throw new Error('failed to create Conduit Technique target');
  monster.hasHealth.hp = 10_000;
  monster.hasHealth.maxHp = 10_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  return monster;
}

function setup(
  id: string,
  abilityId: string,
  tier: number,
  frame: FormationFrame = null,
  expectedCount = 4,
) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id, abilityId, tier, frame), id);
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  updateSummonerArchetype(world, 0, 1_000);
  const minions = player.summonsMinions?.minionIds.map((entityId) => (
    world.getMinionEntity(entityId)!
  )) ?? [];
  assert(
    minions.length === expectedCount && minions.every(Boolean),
    `formation should have ${expectedCount} summons`,
  );
  return { world, player, minions };
}

function armAgainst(world: World, playerId: string, targetId: string, now: number): void {
  const player = world.getPlayerEntity(playerId)!;
  setAttackTarget(world, player, targetId);
  updateAbilityFiring(world, now);
  setAttackTarget(world, player, null);
  assert(player.hasArmedAbility === undefined, 'Conduit should not retain the one-hit armed marker');
  assert(!!player.hasFormationTechnique, 'Conduit should arm a formation Technique state');
}

initCombatSystems();

// Sweep: each snapshotted summon fires once, but the whole formation pays only
// one 60%-of-attack rider budget. Repeating one summon cannot multiply it.
{
  const { world, player, minions } = setup('conduit-sweep', 'sweep', 1);
  const primary = createMonster(world, 430);
  const secondary = createMonster(world, 470);
  const secondaryHpBefore = secondary.hasHealth.hp;

  armAgainst(world, player.isPlayer.id, primary.isMonster.id, 1_100);
  assert(
    player.hasFormationTechnique?.pendingEntityIds.length === 4,
    'Sweep should snapshot every living summon at arm time',
  );

  runFormationAttack(world, player, minions[0]!, primary, 1_200);
  const afterFirst = secondaryHpBefore - secondary.hasHealth.hp;
  assert(afterFirst === 15, `first root summon should pay its 15-damage share, got ${afterFirst}`);

  runFormationAttack(world, player, minions[0]!, primary, 1_201);
  assert(
    secondaryHpBefore - secondary.hasHealth.hp === afterFirst,
    'the same summon must not deliver a formation Technique twice',
  );

  for (let index = 1; index < minions.length; index++) {
    runFormationAttack(world, player, minions[index]!, primary, 1_210 + index);
  }
  assert(
    secondaryHpBefore - secondary.hasHealth.hp === 60,
    'four root summons should total exactly one Sweep I 60-damage budget',
  );
  assert(
    player.hasFormationTechnique === undefined,
    'the formation Technique should end after every snapshot member delivers',
  );
  const sweepHits = world.takeNodeEvents('node-5-5').filter((event) => (
    event.kind === 'player-hit' && event.effects?.includes(ABILITY_SWEEP_FX)
  ));
  assert(sweepHits.length === 4, 'exactly four summon hits should carry Sweep FX');

  const adapterEvents = takeWorldLogEvents(world, player.isPlayer.id).filter(
    (event) => event.kind === 'technique-adapter',
  );
  const arm = adapterEvents.find((event) => event.event === 'conduit-arm');
  const deliveries = adapterEvents.filter((event) => event.event === 'conduit-delivery');
  const damageEvents = adapterEvents.filter((event) => event.event === 'conduit-secondary-damage');
  assert(arm?.eligibleSummons === 4, 'Conduit arm telemetry should report all four eligible summons');
  assert(deliveries.length === 4, 'Conduit telemetry should report one delivery per summon that paid its share');
  const reportedDamageTotal = damageEvents.reduce((sum, event) => sum + (event.splashDamage ?? 0), 0);
  assert(reportedDamageTotal === 60, 'reported formation Technique damage should equal the real 60-damage Sweep budget');
}

// Formation frame count never creates extra Sweep budget. The T1 rider is
// 60% of the formation's attack basis: frame offense tuning remains meaningful,
// but each frame's proc/offense shares still sum to one.
for (const expectation of [
  { name: 'root', frame: null, count: 4, splash: 60 },
  { name: 'Splinter', frame: 'light' as const, count: 6, splash: 63 },
  { name: 'Consort', frame: 'balanced' as const, count: 5, splash: 60 },
  { name: 'Effigy', frame: 'heavy' as const, count: 2, splash: 58 },
]) {
  const { world, player, minions } = setup(
    `conduit-sweep-${expectation.name}`,
    'sweep',
    1,
    expectation.frame,
    expectation.count,
  );
  const primary = createMonster(world, 430);
  const secondary = createMonster(world, 470);
  const hpBefore = secondary.hasHealth.hp;

  armAgainst(world, player.isPlayer.id, primary.isMonster.id, 1_500);
  for (let index = 0; index < minions.length; index++) {
    runFormationAttack(world, player, minions[index]!, primary, 1_600 + index);
  }

  assert(
    secondary.hasHealth.hp === hpBefore - expectation.splash,
    `${expectation.name} should pay exactly ${expectation.splash} Sweep damage to one secondary`,
  );
  assert(
    player.hasFormationTechnique === undefined,
    `${expectation.name} should consume its whole formation Technique exactly once`,
  );
}

// The adapter is armed-Technique-generic: Quick Strike's +25% budget is spread
// over the same four summon deliveries instead of being copied four times.
{
  const { world, player, minions } = setup('conduit-quick-strike', 'quick-strike', 3);
  const primary = createMonster(world, 430);
  const hpBefore = primary.hasHealth.hp;

  armAgainst(world, player.isPlayer.id, primary.isMonster.id, 2_000);
  for (let index = 0; index < minions.length; index++) {
    runFormationAttack(world, player, minions[index]!, primary, 2_100 + index);
  }

  // Four ordinary root contributions total 100. The normalized Technique adds
  // one +25 budget (integer shares 6, 6, 6, 7 via the carried remainder).
  assert(
    hpBefore - primary.hasHealth.hp === 125,
    'Quick Strike should total 100 base formation damage plus one normalized +25 rider',
  );
  assert(
    player.hasFormationTechnique === undefined,
    'a non-Sweep armed Technique should use the same formation consumption lifecycle',
  );
}

// Death/reconstruction: a physical summon that dies forfeits its unpaid share;
// the replacement body cannot inherit a Technique armed before it existed.
{
  const { world, player, minions } = setup('conduit-sweep-reconstruction', 'sweep', 1);
  const farTarget = createMonster(world, 5_000);
  armAgainst(world, player.isPlayer.id, farTarget.isMonster.id, 3_000);
  const deadEntityId = minions[3]!.isMinion.id;
  minions[3]!.hasHealth.hp = 0;

  updateSummonerArchetype(world, 0, 3_100);
  assert(
    player.hasFormationTechnique?.pendingEntityIds.length === 3,
    'a dead summon should be pruned from the pending delivery set',
  );
  assert(
    player.hasFormationTechnique?.pendingEntityIds.includes(deadEntityId) === false,
    'the dead physical entity ID should no longer own a delivery',
  );
  assert(
    takeWorldLogEvents(world, player.isPlayer.id).some((event) => (
      event.kind === 'technique-adapter' && event.event === 'conduit-share-lost'
    )),
    'pruning a dead snapshotted summon should report a lost formation Technique share',
  );

  updateSummonerArchetype(world, 4_000, 7_100);
  const replacementId = player.summonsMinions!.minionIds[3]!;
  const replacement = world.getMinionEntity(replacementId)!;
  assert(replacementId !== deadEntityId, 'reconstruction should create a new physical summon ID');
  assert(
    player.hasFormationTechnique?.pendingEntityIds.includes(replacementId) === false,
    'a reconstructed summon must not inherit the dead summon\'s old delivery',
  );

  const primary = createMonster(world, 430);
  const secondary = createMonster(world, 470);
  const secondaryHpBefore = secondary.hasHealth.hp;
  runFormationAttack(world, player, replacement, primary, 7_200);
  assert(
    secondary.hasHealth.hp === secondaryHpBefore,
    'the reconstructed body should fire an ordinary attack, not the old Sweep',
  );
  for (let index = 0; index < 3; index++) {
    runFormationAttack(world, player, minions[index]!, primary, 7_210 + index);
  }
  assert(
    secondaryHpBefore - secondary.hasHealth.hp === 45,
    'the three surviving snapshot members should retain only their original 45 damage',
  );
  assert(
    player.hasFormationTechnique === undefined,
    'the state should end after all surviving snapshot members deliver',
  );
}

console.log('abilityConduitTechniqueAdapter.test.ts: ok');
