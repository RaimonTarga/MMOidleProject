import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  SUMMONER_CHORUS_EFFECT_ID,
  SUMMONER_HARRIER_EFFECT_ID,
  SUMMONER_SPECIALIZATION_TUNING,
  emptyEquipment,
  resolveSummonerProfile,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import {
  prepareSpecializationAttack,
  registerSummonerSpecializationHooks,
  tickSummonerSpecializations,
} from '../src/systems/classes/archetypes/summoner/specs';
import { SUMMONER_T4_BUFFS } from '../src/systems/classes/archetypes/summoner/specs/buffs';
import { pickLivingMinion } from '../src/systems/classes/archetypes/summoner/damageSponge';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string, epsilon = 1e-9): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

type Frame = 'light' | 'balanced' | 'heavy';

const SPEC_FRAME: Record<string, Frame> = {
  'summoner-light-t3-a': 'light',
  'summoner-light-t3-b': 'light',
  'summoner-light-t3-c': 'light',
  'summoner-balanced-t3-a': 'balanced',
  'summoner-balanced-t3-b': 'balanced',
  'summoner-balanced-t3-c': 'balanced',
  'summoner-heavy-t3-a': 'heavy',
  'summoner-heavy-t3-b': 'heavy',
  'summoner-heavy-t3-c': 'heavy',
};

function slices(id: string, specId: string, range = 'summoner-range-mid'): PersistedPlayerSlices {
  const frame = SPEC_FRAME[specId]!;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 10_000, maxHp: 10_000, hpRegen: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 4,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root', `summoner-${frame}`, range, specId],
      passives: {}, selectedClass: 'summoner-root', selectedSubVariant: frame,
      selectedRange: range, combatArchetype: 'summoner',
    },
  };
}

function attach(world: World, id: string, specId: string, range?: string) {
  const player = world.attachPlayerEntity(slices(id, specId, range), id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  updateSummonerArchetype(world, 0, 1_000);
  return player;
}

function durableTarget(world: World, x = 520, y = 400) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x, y });
  assert(target !== null, 'test target must exist in the monster database');
  target.hasHealth.hp = 10_000_000;
  target.hasHealth.maxHp = 10_000_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  return target;
}

function minions(world: World, player: ReturnType<typeof attach>) {
  return player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!).filter(Boolean);
}

// All nine paths remain frame-locked and work with all three independent ranges.
{
  const specs = Object.keys(SPEC_FRAME);
  const ranges = [
    ['summoner-range-close', 'melee'],
    ['summoner-range-mid', 'reach'],
    ['summoner-range-far', 'ranged'],
  ] as const;
  for (const specId of specs) {
    for (const [range, attackMode] of ranges) {
      const frame = SPEC_FRAME[specId]!;
      const profile = resolveSummonerProfile({
        selectedSubVariant: frame,
        selectedRange: range,
        unlockedSkills: [specId],
      });
      assert(profile.specialization !== null, `${specId} must resolve on its own frame`);
      assert(profile.attackMode === attackMode, `${specId} must preserve ${range} behavior`);
      assert(profile.slots.length > 0, `${specId} must retain a valid formation at ${range}`);
    }
  }

  const malformed = resolveSummonerProfile({
    selectedSubVariant: 'light', selectedRange: 'summoner-range-mid',
    unlockedSkills: ['summoner-heavy-t3-b'],
  });
  assert(malformed.specialization === null, 'a persisted cross-frame skill must not activate Battle Bond');
  const world = new World();
  const wrongFrame = world.attachPlayerEntity(slices('wrong-frame', 'summoner-heavy-t3-b'), 'wrong-frame');
  wrongFrame.usesSkills.selectedSubVariant = 'light';
  recalculatePlayerEntityStats(world, wrongFrame);
  assert(wrongFrame.cannotAttack !== undefined, 'cross-frame Battle Bond data must not restore direct attacks');
}

// Every specialization owns a distinct player-visible buff id.
{
  const cases = [
    ['summoner-light-t3-c', 'summoner-volatile-brood'],
    ['summoner-light-t3-b', 'summoner-endless-swarm'],
    ['summoner-light-t3-a', 'summoner-harrier-brood'],
    ['summoner-balanced-t3-a', 'summoner-coordinated-hunt'],
    ['summoner-balanced-t3-b', 'summoner-withering-chorus'],
    ['summoner-balanced-t3-c', 'summoner-grand-ritual'],
    ['summoner-heavy-t3-c', 'summoner-colossus'],
    ['summoner-heavy-t3-b', 'summoner-battle-bond'],
    ['summoner-heavy-t3-a', 'summoner-twin-covenant'],
  ] as const;
  for (const [specId, buffId] of cases) {
    const world = new World();
    const player = attach(world, `buff-${buffId}`, specId);
    const target = durableTarget(world);
    const descriptor = SUMMONER_T4_BUFFS.find((buff) => buff.id === buffId);
    assert(descriptor !== undefined, `${buffId} needs a registered descriptor`);
    const projected = descriptor.project({
      player, playerCs: player.tracksCombat, target, targetCs: target.tracksCombat, world, now: 1_000,
    });
    assert(projected?.id === buffId, `${buffId} must project its own wire id`);
  }
}

// Harrier: unique living slots only, duplicate hits refresh, and the target gets its own debuff id.
{
  const world = new World();
  const player = attach(world, 'harrier', 'summoner-light-t3-a');
  const target = durableTarget(world);
  const brood = minions(world, player);
  runFormationAttack(world, player, brood[0]!, target, 2_000);
  runFormationAttack(world, player, brood[0]!, target, 2_100);
  assert(player.controlsSummons!.harrierMarksByTarget[target.isMonster.id]!.slotIds.length === 1,
    'one Harrier slot cannot add duplicate marks');
  runFormationAttack(world, player, brood[1]!, target, 2_200);
  assert(player.controlsSummons!.harrierMarksByTarget[target.isMonster.id]!.slotIds.length === 2,
    'a second living Harrier slot adds one unique mark');
  const effect = target.tracksCombat.statusEffects.find((fx) => fx.id === SUMMONER_HARRIER_EFFECT_ID);
  assert(effect?.stacks === 2, 'Harried must be visible as a two-stack target debuff');
  brood[0]!.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 2_300);
  assert(player.controlsSummons!.harrierMarksByTarget[target.isMonster.id]!.slotIds.length === 1,
    'dead Harrier slots must stop contributing to the offensive mark');
  assert(effect.stacks === 1, 'Harried target status must mirror living unique contributors');
}

// Endless Swarm: count increases while offense/proc budgets stay normalized, and surplus entities clean up.
{
  const world = new World();
  const player = attach(world, 'swarm', 'summoner-light-t3-b');
  let profile = resolveSummonerProfile({
    selectedSubVariant: 'light', selectedRange: 'summoner-range-mid',
    unlockedSkills: ['summoner-light-t3-b'],
  });
  assert(player.summonsMinions!.targetCount === 8 && minions(world, player).length === 8,
    'Endless Swarm must create exactly the controlled eight-body cap');
  close(profile.slots.reduce((sum, slot) => sum + slot.offenseWeight, 0), 1,
    'Endless Swarm total offense weight must remain normalized');
  close(profile.slots.reduce((sum, slot) => sum + slot.procWeight, 0), 1,
    'Endless Swarm total proc weight must remain normalized');
  player.usesSkills.unlockedSkills = player.usesSkills.unlockedSkills
    .filter((id) => id !== 'summoner-light-t3-b')
    .concat('summoner-light-t3-a');
  updateSummonerArchetype(world, 0, 2_000);
  assert(player.summonsMinions!.targetCount === 6 && minions(world, player).length === 6,
    'leaving Endless Swarm must remove its two surplus ECS entities');
}

// Volatile: no-target detonations wait, Far delivers a payload, natural deaths burst, and all deaths queue.
{
  const waitingWorld = new World();
  const waiting = attach(waitingWorld, 'volatile-wait', 'summoner-light-t3-c', 'summoner-range-far');
  updateSummonerArchetype(waitingWorld, 0, 7_000);
  const armedId = waiting.summonsMinions!.volatileMarkedSlotId!;
  updateSummonerArchetype(waitingWorld, 0, 9_000);
  const armedIndex = waiting.summonsMinions!.slotIds.indexOf(armedId);
  assert(!!waiting.summonsMinions!.minionIds[armedIndex], 'Volatile must not sacrifice a summon without a valid target');

  const world = new World();
  const player = attach(world, 'volatile', 'summoner-light-t3-c', 'summoner-range-far');
  const target = durableTarget(world, 700, 400);
  updateSummonerArchetype(world, 0, 7_000);
  const marked = player.summonsMinions!.volatileMarkedSlotId!;
  const markedIndex = player.summonsMinions!.slotIds.indexOf(marked);
  const markedMinion = world.getMinionEntity(player.summonsMinions!.minionIds[markedIndex]!)!;
  markedMinion.hasAttackTarget = { targetId: target.isMonster.id };
  const hpBefore = target.hasHealth.hp;
  updateSummonerArchetype(world, 0, 9_000);
  assert(target.hasHealth.hp < hpBefore, 'Far Volatile must deliver its marked explosion to the valid target');
  assert(player.summonsMinions!.activeReconstruction?.slotId === marked,
    'deliberate Volatile death must enter the shared reconstruction queue');

  const natural = minions(world, player)[0]!;
  const naturalTarget = durableTarget(world, natural.hasPosition.current.x, natural.hasPosition.current.y);
  natural.hasPosition.current = { ...naturalTarget.hasPosition.current };
  assert([...world.monsterEntitiesInNode('node-clearing')].includes(naturalTarget),
    'natural-death target must be present in the node collision candidates');
  assert(player.summonsMinions!.volatileMarkedSlotId === undefined,
    'the deliberate Volatile mark must clear before testing an unrelated natural death');
  const naturalBefore = naturalTarget.hasHealth.hp;
  natural.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 9_100);
  assert(naturalTarget.hasHealth.hp < naturalBefore, 'natural summon death must emit the modest Volatile explosion');
}

// Coordinated Hunt: per-target openers and a true living-formation cadence strike.
{
  const world = new World();
  const player = attach(world, 'hunt', 'summoner-balanced-t3-a');
  const target = durableTarget(world);
  const formation = minions(world, player);
  let before = target.hasHealth.hp;
  runFormationAttack(world, player, formation[0]!, target, 2_000);
  const openingDamage = before - target.hasHealth.hp;
  before = target.hasHealth.hp;
  runFormationAttack(world, player, formation[0]!, target, 2_100);
  const repeatDamage = before - target.hasHealth.hp;
  assert(openingDamage > repeatDamage, 'each slot receives exactly one empowered opener per target');
  for (let index = 1; index < formation.length; index++) {
    runFormationAttack(world, player, formation[index]!, target, 2_200 + index);
  }
  for (let cycle = 2; cycle <= 3; cycle++) {
    for (const minion of formation) runFormationAttack(world, player, minion, target, 3_000 + cycle * 100);
  }
  for (let index = 0; index < formation.length - 1; index++) {
    runFormationAttack(world, player, formation[index]!, target, 4_000 + index);
  }
  before = target.hasHealth.hp;
  runFormationAttack(world, player, formation.at(-1)!, target, 4_100);
  const coordinatedDamage = before - target.hasHealth.hp;
  assert(player.controlsSummons!.cycleSerialByTarget[target.isMonster.id] === 4,
    'Coordinated Hunt must count complete formation cycles, not raw hits');
  assert(coordinatedDamage > repeatDamage * 2,
    'the fourth cycle must resolve a synchronized living-formation strike');

  const target2 = durableTarget(world, 540, 400);
  const fresh = prepareSpecializationAttack(world, player as any, formation[0]!, target2, 5_000, {
    completed: false, serial: 0,
  });
  assert(fresh.openingStrike, 'switching to a genuinely new target grants that target-specific opener');
  formation[0]!.hasHealth.hp = 0;
  const partial = prepareSpecializationAttack(world, player as any, formation[1]!, target, 5_100, {
    completed: true, serial: 4,
  });
  const expectedPartial = (1 - 1 / formation.length)
    * (SUMMONER_SPECIALIZATION_TUNING.coordinatedHunt.coordinatedDamageMult - 1);
  close(partial.directDamageBonusWeight, expectedPartial,
    'missing summons must reduce the synchronized strike instead of donating their budget');
}

// Withering Chorus: unique voices, group refresh, target isolation, and visible expiry.
{
  const world = new World();
  const player = attach(world, 'chorus', 'summoner-balanced-t3-b');
  const target = durableTarget(world);
  const formation = minions(world, player);
  runFormationAttack(world, player, formation[0]!, target, 2_000);
  runFormationAttack(world, player, formation[1]!, target, 2_100);
  runFormationAttack(world, player, formation[1]!, target, 2_200);
  let state = player.controlsSummons!.chorusByTarget[target.isMonster.id]!;
  assert(state.slotIds.length === 2, 'same Chorus slot must refresh without adding duplicate voices');
  const firstExpiry = state.expiresAt;
  formation[0]!.hasHealth.hp = 0;
  runFormationAttack(world, player, formation[1]!, target, 3_000);
  state = player.controlsSummons!.chorusByTarget[target.isMonster.id]!;
  assert(state.slotIds.length === 2 && state.expiresAt > firstExpiry,
    'any living summon must refresh all already-established Chorus voices');
  const effect = target.tracksCombat.statusEffects.find((fx) => fx.id === SUMMONER_CHORUS_EFFECT_ID);
  assert(effect?.stacks === 2, 'Withering Chorus needs its own visible two-stack target debuff');
  const target2 = durableTarget(world, 560, 400);
  runFormationAttack(world, player, formation[1]!, target2, 3_100);
  assert(player.controlsSummons!.chorusByTarget[target2.isMonster.id]!.slotIds.length === 1,
    'a new Chorus target must establish a separate unique-slot set');
  tickSummonerSpecializations(world, player as any, 9_100);
  assert(player.controlsSummons!.chorusByTarget[target.isMonster.id] === undefined,
    'an unrefreshed Chorus must expire cleanly');
  assert(!target.tracksCombat.statusEffects.some((fx) => fx.id === SUMMONER_CHORUS_EFFECT_ID),
    'expired Chorus status must disappear from the target UI');
}

// Grand Ritual: living-at-trigger grants only, finite consumption, and chaotic misses preserve charges.
{
  const world = new World();
  const player = attach(world, 'ritual', 'summoner-balanced-t3-c');
  const formation = minions(world, player);
  formation.at(-1)!.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 11_000);
  const charges = player.summonsMinions!.ritualCharges!;
  assert(charges.slice(0, -1).every((charge) => charge === 2) && charges.at(-1) === 0,
    'Grand Ritual grants a fixed package only to slots living at trigger time');
  const target = durableTarget(world);
  player.usesSkills.passives['weapon.dead-swing-interval'] = 1;
  player.controlsSummons!.procProgress['weapon.chaotic-logical-hit'] = 0.8;
  runFormationAttack(world, player, formation[0]!, target, 11_100);
  assert(charges[0] === 2, 'a chaotic dead swing must preserve its Grand Ritual charge');
  player.usesSkills.passives['weapon.dead-swing-interval'] = 0;
  runFormationAttack(world, player, formation[0]!, target, 11_200);
  assert(charges[0] === 1, 'a landed empowered summon attack consumes exactly one Ritual charge');
  updateSummonerArchetype(world, 20_000, 31_200);
  assert(player.summonsMinions!.ritualCharges!.at(-1) === 0,
    'reconstruction after a ritual must not retroactively receive that ritual package');
}

// Colossus: one transformed entity, concentrated budget, scale, and catastrophic reconstruction.
{
  const world = new World();
  const player = attach(world, 'colossus', 'summoner-heavy-t3-c', 'summoner-range-far');
  const profile = resolveSummonerProfile({
    selectedSubVariant: 'heavy', selectedRange: 'summoner-range-far',
    unlockedSkills: ['summoner-heavy-t3-c'],
  });
  const colossus = minions(world, player)[0]!;
  assert(player.summonsMinions!.targetCount === 1 && colossus.isMinion.role === 'colossus',
    'Colossus must replace both old Heavy slots with one logical and physical entity');
  // Measured against an unspecialised Heavy formation at the SAME range, not a
  // fixed number: range now scales summon size too (SummonerRangeTuning.sizeMult),
  // so an absolute threshold would encode one range's tuning as a rule.
  const heavyBaseline = resolveSummonerProfile({
    selectedSubVariant: 'heavy', selectedRange: 'summoner-range-far', unlockedSkills: [],
  });
  assert(colossus.isMinion.sizeMult > heavyBaseline.slots[0]!.sizeMult && colossus.dealsDamage.attack > 0,
    'Colossus must have distinct visual scale and concentrated attack behavior');
  assert(profile.slots[0]!.offenseWeight === 1 && profile.slots[0]!.defenseWeight === 1,
    'Colossus must own the full transformed formation budgets');
  colossus.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 2_000);
  assert(player.summonsMinions!.activeReconstruction!.durationMs > 5_000,
    'catastrophic Colossus loss must use its longer specialization reconstruction');
}

// Battle Bond: only this path restores direct attacks, splits budget, counts fixed landed events, and survives partner loss.
{
  registerSummonerSpecializationHooks();
  const world = new World();
  const player = attach(world, 'bond', 'summoner-heavy-t3-b');
  assert(player.cannotAttack === undefined, 'Battle Bond must restore the Conduit direct attack');
  const target = durableTarget(world);
  const bonded = minions(world, player)[0]!;
  for (let index = 0; index < SUMMONER_SPECIALIZATION_TUNING.battleBond.threshold; index++) {
    if (index % 2 === 0) {
      runPlayerAttack(world, player, target, 2_000 + index, {
        attackOrigin: player.hasPosition.current,
        aggroSource: { id: player.isPlayer.id, kind: 'player' },
      });
    } else {
      runFormationAttack(world, player, bonded, target, 2_000 + index);
    }
  }
  assert(player.controlsSummons!.bondProgress === 0 && player.summonsMinions!.bondCharge === 0,
    'fixed Conduit/summon events must execute and reset the deterministic linked strike threshold');
  bonded.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 3_000);
  recalculatePlayerEntityStats(world, player);
  assert(player.cannotAttack === undefined && player.summonsMinions!.activeReconstruction !== undefined,
    'the Conduit keeps its split direct attack while the bonded summon reconstructs');
  const before = target.hasHealth.hp;
  runPlayerAttack(world, player, target, 3_100, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  assert(target.hasHealth.hp < before, 'Battle Bond direct offense remains functional during partner loss');
}

// Twin Covenant: stable complementary roles, defense-first interception, bounded survivor fallback, exact-role rebuild.
{
  const world = new World();
  const player = attach(world, 'twins', 'summoner-heavy-t3-a');
  const [offense, defense] = minions(world, player);
  assert(offense!.isMinion.role === 'offense-twin' && defense!.isMinion.role === 'defense-twin',
    'Twin Covenant roles must remain stable and differentiated');
  assert(offense!.dealsDamage.attack > defense!.dealsDamage.attack && defense!.hasHealth.maxHp > offense!.hasHealth.maxHp,
    'offense and defense weights must be visible in runtime stats');
  assert(pickLivingMinion(world, player)?.isMinion.role === 'defense-twin',
    'damage redirection must prefer the living defense twin');
  offense!.hasHealth.hp = 0;
  const fallback = prepareSpecializationAttack(world, player as any, defense!, durableTarget(world), 2_000, {
    completed: false, serial: 0,
  });
  close(fallback.damageMult, 1.1, 'the lone survivor receives only the bounded fallback multiplier');
  defense!.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 2_100);
  const queuedDefense = player.summonsMinions!.reconstructionQueue.includes('defense:0')
    || player.summonsMinions!.activeReconstruction?.slotId === 'defense:0';
  assert(queuedDefense, 'the defense twin must retain its own logical reconstruction identity');
}

console.log('summonerSpecializations.test.ts: ok');
