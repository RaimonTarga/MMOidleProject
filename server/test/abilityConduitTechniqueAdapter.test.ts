/** Focused server-authoritative coverage for Conduit's formation Technique adapter. */
import {
  ABILITY_DATABASE,
  ABILITY_FRENZY_EFFECT_ID,
  ABILITY_IMBUE_EFFECT_ID,
  ABILITY_SWEEP_FX,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  applyStatusEffect,
  getCooldown,
  getStatusEffect,
  referenceAbilityRule,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { fireWithReferenceWiring, wireReferenceAbilities } from './fixtures/abilityWiring';
import { updateAbilityCasts, updateAbilityCharges, cancelAbilityCast } from '../src/systems/player/abilities/abilityCasting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updateMovement } from '../src/systems/world/movement';
import { abilityCooldownKey } from '../src/systems/player/abilities/abilityCooldowns';
import { attackCadenceMult } from '../src/systems/combat/engine/attackCadence';
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
      attunedAbilities: { techniques: [abilityId], guards: [] },
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
  player.usesAutocombat.auto = true;
  wireReferenceAbilities(player);
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
  const minion = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  assert(player.hasAttackTarget === undefined, 'owner must not need a direct attack target');
  setAttackTarget(world, minion, targetId);
  fireWithReferenceWiring(world, now);
  setAttackTarget(world, minion, null);
  assert(player.hasArmedAbility === undefined, 'Conduit should not retain the one-hit armed marker');
  assert(!!player.hasFormationTechnique, 'Conduit should arm a formation Technique state');
}

initCombatSystems();

// Idle formations and stale targets must not spend a Technique cooldown.
for (const state of ['idle', 'dead-minion', 'dead-target', 'other-node', 'foreign-owner'] as const) {
  const { world, player, minions } = setup(`trigger-${state}`, 'sweep', 1);
  const target = createMonster(world, 650);
  const minion = minions[0]!;
  if (state !== 'idle') setAttackTarget(world, minion, target.isMonster.id);
  if (state === 'dead-minion') minion.hasHealth.hp = 0;
  if (state === 'dead-target') target.hasHealth.hp = 0;
  if (state === 'other-node') target.hasPosition.nodeId = 'node-5-6';
  if (state === 'foreign-owner') minion.isMinion.ownerPlayerId = 'another-player';
  fireWithReferenceWiring(world, 1_100);
  assert(!player.hasFormationTechnique && !player.hasArmedAbility, `${state} must not arm Sweep`);
}

// Incoming minion aggro also counts, but never becomes owner-facing Guard aggro.
{
  const { world, player, minions } = setup('summon-aggro-trigger', 'sweep', 1);
  player.tracksProgression.attunedAbilities.guards = ['bramble-guard'];
  for (let i = 0; i < 3; i++) {
    const target = createMonster(world, 650 + i * 20);
    setAggroTarget(world, target, { id: minions[0]!.entityId, kind: 'minion' }, 1_000);
  }
  fireWithReferenceWiring(world, 1_100);
  assert(!!player.hasFormationTechnique, 'minion aggro must arm Sweep without an owner target');
  assert(!world.takeNodeEvents('node-5-5').some(event => event.kind === 'player-guard'),
    'minion aggro must not trigger an owner-pressure Guard');
}

// Full tick wiring: summons acquire their own targets while the owner stays back.
{
  const { world, player, minions } = setup('summon-tick-trigger', 'sweep', 1);
  const target = createMonster(world, 650);
  for (const minion of minions) {
    minion.hasPosition.current = { x: 630, y: 400 };
    minion.performsAttack.lastAttackAt = -10_000;
  }
  // The rune fold runs before summons acquire targets, so the Use Ability rule
  // sees summon combat on the following tick.
  world.tick(100, 2_000);
  world.tick(100, 2_100);
  assert(player.hasAttackTarget === undefined, 'ordinary Conduit must not attack directly');
  assert(!!player.hasFormationTechnique, 'real tick must arm Sweep from summon combat');
  assert(target.hasHealth.hp < target.hasHealth.maxHp, 'summons must actually be fighting');
}

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

// Every authored ability must activate automatically when its own prerequisites
// hold, with no Rune override and no artificial owner attack target.
for (const champion of [false, true]) for (const ability of ABILITY_DATABASE.values()) {
  const scenario = setup(`auto-roster-${champion}-${ability.id}`, ability.id, 4);
  const { world, player } = scenario;
  let minions = scenario.minions;
  if (champion) {
    player.usesSkills.unlockedSkills = ['summoner-root', 'summoner-heavy', 'summoner-heavy-t3-b'];
    player.usesSkills.selectedSubVariant = 'heavy';
    syncArchetypeSlices(world, player);
    updateSummonerArchetype(world, 0, 1_000);
    minions = player.summonsMinions!.minionIds.map(id => world.getMinionEntity(id)!);
    assert(minions.length === 1, 'Champion fixture must have one bonded summon');
  }
  player.tracksProgression.attunedAbilities = ability.slot === 'guard'
    ? { techniques: [], guards: [ability.id] }
    : { techniques: [ability.id], guards: [] };
  const target = createMonster(world, ability.shape === 'cast' && !champion ? 650
    : ability.id === 'charge' ? 600 : ability.id === 'disengage' ? 480 : 430);
  createMonster(world, target.hasPosition.current.x + 30);
  if (ability.shape === 'cast' && !champion) {
    for (const minion of minions) minion.hasPosition.current = { x: 630, y: 400 };
  }
  setAttackTarget(world, minions[0]!, target.entityId);
  if (champion) setAttackTarget(world, player, target.entityId);
  // Satisfy the ability's reference Rune condition (and Break Free's control gate).
  const wiring = referenceAbilityRule(ability.id)!.conditionId;
  // Guards need something to answer: missing HP for the Recovery Guards.
  if (ability.slot === 'guard') player.hasHealth.hp = player.hasHealth.maxHp * 0.2;
  if (wiring === 'enemy-contact') {
    // The Disengage target sits at 480, within a melee enemy's reach of the owner.
    setAggroTarget(world, target, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  }
  if (wiring === 'n-aggro-3') {
    for (let i = 0; i < 3; i++) {
      setAggroTarget(world, createMonster(world, 450 + i * 10),
        { id: player.isPlayer.id, kind: 'player' }, 1_000);
    }
  }
  if (wiring === 'has-debuff' || ability.id === 'break-free') {
    applyStatusEffect(player.tracksCombat, {
      id: ability.id === 'break-free' ? 'stunned' : 'slow',
      remainingMs: 5_000, maxStacks: 1, refreshable: true,
      sourceId: target.entityId, data: {},
    });
  }
  if (ability.id === 'contagion' || ability.id === 'detonate') {
    applyStatusEffect(target.tracksCombat, {
      id: 'dot', remainingMs: 4_500, maxStacks: 6, refreshable: true,
      sourceId: player.isPlayer.id,
      data: { damagePerStack: 10, nextTickIn: 1_000, tickIntervalMs: 1_000 },
    });
  }
  // Auto OFF must not activate any default, even with valid prerequisites.
  player.usesAutocombat.auto = false;
  fireWithReferenceWiring(world, 1_100);
  assert(!takeWorldLogEvents(world, player.isPlayer.id).some(e => e.kind === 'ability-activation'),
    `${ability.id} must respect Auto OFF`);
  player.usesAutocombat.auto = true;
  fireWithReferenceWiring(world, 1_200);
  assert(takeWorldLogEvents(world, player.isPlayer.id).some(e =>
    e.kind === 'ability-activation' && e.abilityId === ability.id),
  `${ability.id} must activate on its reference wiring for Summoner`);
  if (player.isCastingAbility) {
    if (ability.shape === 'cast' && !champion) {
      assert(player.isCastingAbility.casterMinionId === minions[0]!.entityId,
        `${ability.id} must select exactly one engaged summon while its owner stays back`);
    } else {
      assert(!player.isCastingAbility.casterMinionId,
        `${ability.id} must retain its summoner-owned wind-up`);
    }
    const hpBefore = target.hasHealth.hp;
    updateAbilityCasts(world, player.isCastingAbility.endsAt);
    assert(getCooldown(player.tracksCombat, abilityCooldownKey(ability.id)) > 0,
      `${ability.id} must finish its cast and start cooldown`);
    const effect = ability.ranks.at(-1)!.effect;
    if (effect.kind === 'cast-strike') {
      assert(hpBefore - target.hasHealth.hp === Math.round(player.dealsDamage.attack * effect.damageMult),
        `${ability.id} must deliver one full cast payload, not one per summon`);
    }
    const events = world.takeNodeEvents('node-5-5');
    if (ability.shape === 'cast' && !champion) {
      assert(events.some(e => e.kind === 'player-cast-start' && e.casterMinionId === minions[0]!.entityId),
        `${ability.id} must identify the casting summon for its telegraph`);
      assert(events.some(e => e.kind === 'player-cast-end' && e.fired && e.casterMinionId === minions[0]!.entityId),
        `${ability.id} must identify the casting summon for its impact`);
    }
  }
  if (ability.shape === 'armed') {
    for (const minion of minions) runFormationAttack(world, player, minion, target, 5_000);
    if (champion) {
      assert(player.hasArmedAbility?.abilityId === ability.id, 'bonded summon must not consume owner Technique');
      runPlayerAttack(world, player, target, 5_100, {
        attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' },
      });
      assert(!player.hasArmedAbility, `${ability.id} must deliver from Champion's own attack`);
    }
    assert(!player.hasFormationTechnique, `${ability.id} must not leave a formation charge`);
  }
  if (ability.shape === 'charge') {
    assert(champion ? !!player.isChargingAbility && !player.hasFormationCharge
      : !!player.hasFormationCharge && !player.isChargingAbility,
    'Charge must move Champion itself, but command the formation for other summoners');
  }
  if (ability.id === 'imbue-lightning') {
    const before = getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID)!.data.charges!;
    runFormationAttack(world, player, minions[0]!, target, 5_000);
    assert(getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID)!.data.charges === before - 1,
      'a summon hit must consume an automatically cast Imbue charge');
  }
}

// Champion must not borrow its bonded summon's reach to cast remotely.
{
  const { world, player } = setup('champion-owner-reach', 'power-strike', 3);
  player.usesSkills.unlockedSkills = ['summoner-root', 'summoner-heavy', 'summoner-heavy-t3-b'];
  player.usesSkills.selectedSubVariant = 'heavy';
  syncArchetypeSlices(world, player);
  updateSummonerArchetype(world, 0, 1_000);
  const minion = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  const target = createMonster(world, 650);
  minion.hasPosition.current = { x: 630, y: 400 };
  setAttackTarget(world, minion, target.entityId);
  fireWithReferenceWiring(world, 1_100);
  assert(!player.isCastingAbility, 'Champion must wait for its own casting reach');
  player.hasPosition.current = { x: 630, y: 400 };
  setAttackTarget(world, player, target.entityId);
  fireWithReferenceWiring(world, 1_200);
  assert(!!player.isCastingAbility && !player.isCastingAbility.casterMinionId,
    'Champion must cast from its own body once in reach');
}

// A formation Charge moves every eligible physical summon and pays one shared
// rider on arrival. It never moves the owner or copies a full rider per body.
{
  const { world, player, minions } = setup('formation-charge-movement', 'charge', 2);
  const target = createMonster(world, 650);
  const ownerStart = { ...player.hasPosition.current };
  for (const m of minions) m.hasPosition.current = { x: 420, y: 400 };
  fireWithReferenceWiring(world, 1_000);
  assert(!!player.isCastingAbility, 'Charge must begin its command wind-up');
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  assert(player.hasFormationCharge?.pendingEntityIds.length === 4, 'all four summons must join Charge');
  assert(minions.every(m => !!m.isChargingAbility), 'each summon must own its rush movement');
  const before = target.hasHealth.hp;
  for (let now = 1_400; now <= 2_700 && player.hasFormationCharge; now += 100) {
    updateSummonerArchetype(world, 0, now);
    updateAbilityCharges(world, now);
    updateMovement(world, 100, now);
  }
  assert(!player.hasFormationCharge && minions.every(m => !m.isChargingAbility), 'arrival must clear rush states');
  assert(!player.hasFormationTechnique, 'arrival strikes must spend each shared rider exactly once');
  assert(player.hasPosition.current.x === ownerStart.x && player.hasPosition.current.y === ownerStart.y,
    'formation Charge must leave the summoner in place');
  assert(minions.every(m => m.hasPosition.current.x > 420), 'every summon must physically rush');
  assert(before - target.hasHealth.hp === 220, 'Charge must total 100 base damage and one +120 shared rider');
}

for (const interruption of ['expiry', 'owner-death', 'target-death', 'rooted-summons', 'move-command'] as const) {
  const { world, player, minions } = setup(`charge-cancel-${interruption}`, 'charge', 2);
  const target = createMonster(world, 650);
  for (const m of minions) m.hasPosition.current = { x: 420, y: 400 };
  fireWithReferenceWiring(world, 1_000);
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  const before = target.hasHealth.hp;
  if (interruption === 'owner-death') {
    player.hasHealth.hp = 0;
    cancelAbilityCast(world, player);
  } else {
    if (interruption === 'target-death') target.hasHealth.hp = 0;
    if (interruption === 'rooted-summons') {
      for (const m of minions) applyStatusEffect(m.tracksCombat,
        { id: 'stunned', remainingMs: 5_000, refreshable: true, data: {} });
    }
    if (interruption === 'move-command') player.hasSummonerCommand = { kind: 'move', monsterId: null, pos: { x: 400, y: 400 } };
    updateAbilityCharges(world, interruption === 'expiry' ? 5_000 : 1_500);
  }
  assert(!player.hasFormationCharge && !player.hasFormationTechnique, `${interruption} must forfeit unpaid shares`);
  assert(minions.every(m => !m.isChargingAbility && !m.isMoving), `${interruption} must end all rush movement`);
  assert(target.hasHealth.hp === (interruption === 'target-death' ? 0 : before), `${interruption} must not deal arrival damage`);
}

// A chosen caster alone stops attacking; other summons keep fighting. Invalid
// physical casters/targets abort without charging cooldown or handing off.
for (const loss of ['dead-caster', 'missing-caster', 'range', 'node', 'stun', 'dead-target', 'owner-stun'] as const) {
  const { world, player, minions } = setup(`cast-abort-${loss}`, 'power-strike', 1);
  const target = createMonster(world, 650);
  for (const minion of minions) {
    minion.hasPosition.current = { x: 630, y: 400 };
    minion.performsAttack.lastAttackAt = -10_000;
    setAttackTarget(world, minion, target.entityId);
  }
  fireWithReferenceWiring(world, 1_000);
  const castEnd = player.isCastingAbility!.endsAt;
  updateSummonerArchetype(world, 0, 1_100);
  assert(minions[0]!.performsAttack.lastAttackAt === 1_100, 'caster must hold its attack timer');
  assert(minions.slice(1).every(m => m.performsAttack.lastAttackAt === 1_100), 'other summons must attack');
  const hits = world.takeNodeEvents('node-5-5').filter(e => e.kind === 'player-hit');
  assert(hits.length === minions.length - 1, 'only non-casting summons may land ordinary hits');
  if (loss === 'dead-caster') minions[0]!.hasHealth.hp = 0;
  if (loss === 'missing-caster') player.summonsMinions!.minionIds[0] = '';
  if (loss === 'range') target.hasPosition.current.x = 5_000;
  if (loss === 'node') minions[0]!.hasPosition.nodeId = 'node-5-6';
  if (loss === 'dead-target') target.hasHealth.hp = 0;
  if (loss === 'stun' || loss === 'owner-stun') {
    applyStatusEffect(loss === 'stun' ? minions[0]!.tracksCombat : player.tracksCombat,
      { id: 'stunned', remainingMs: 5_000, refreshable: true, data: {} });
  }
  updateAbilityCasts(world, castEnd);
  assert(!player.isCastingAbility, `${loss} must abort the summon cast`);
  assert(getCooldown(player.tracksCombat, abilityCooldownKey('power-strike')) === 0,
    `${loss} must not consume cooldown`);
  assert(world.takeNodeEvents('node-5-5').some(e => e.kind === 'player-cast-end'
    && !e.fired && e.casterMinionId === minions[0]!.entityId), `${loss} must end that summon's telegraph`);
}

// Real tick ordering must take a remote summon cast all the way to resolution.
{
  const { world, player, minions } = setup('summon-cast-world-tick', 'power-strike', 1);
  player.hasPosition.speed = 0; // Keep the owner out of reach throughout the fixture.
  createMonster(world, 650);
  for (const minion of minions) minion.hasPosition.current = { x: 630, y: 400 };
  const events: ReturnType<World['takeNodeEvents']> = [];
  for (let now = 10_000; now <= 12_000; now += 100) {
    world.tick(100, now);
    events.push(...world.takeNodeEvents('node-5-5'));
  }
  assert(player.hasAttackTarget === undefined, 'owner must never need a direct attack target');
  assert(events.some(e => e.kind === 'player-cast-end' && e.ability === 'power-strike'
    && e.fired && !!e.casterMinionId), 'World.tick must resolve an automatically delegated cast');
}

// Frenzy must change actual summon attack timing, not merely light its HUD buff.
{
  const { world, player, minions } = setup('auto-frenzy-cadence', 'frenzy', 3);
  createMonster(world, 650);
  for (const minion of minions) {
    minion.hasPosition.current = { x: 630, y: 400 };
    minion.performsAttack.lastAttackAt = 1_000;
  }
  updateSummonerArchetype(world, 0, 1_000);
  fireWithReferenceWiring(world, 1_000);
  assert(!!getStatusEffect(player.tracksCombat, ABILITY_FRENZY_EFFECT_ID), 'Frenzy must activate');
  const baseCooldown = minions[0]!.performsAttack.attackCooldown;
  const hastedAttackAt = 1_000 + Math.ceil(baseCooldown * attackCadenceMult(player.tracksCombat));
  assert(hastedAttackAt < 1_000 + baseCooldown, 'fixture must test before the unhasted attack');
  updateSummonerArchetype(world, 0, hastedAttackAt);
  assert(minions.every(m => m.performsAttack.lastAttackAt === hastedAttackAt),
    'Frenzy must accelerate each summon using the owner haste');
  assert(minions.every(m => m.performsAttack.attackCooldown === baseCooldown),
    'temporary haste must not mutate the base cooldown');
}

console.log('abilityConduitTechniqueAdapter.test.ts: ok');
