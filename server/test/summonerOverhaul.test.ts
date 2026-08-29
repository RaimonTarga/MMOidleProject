import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  composePlayerView,
  emptyEquipment,
  projectSummonSlots,
  resolveSummonerProfile,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { consumeWeightedProc } from '../src/systems/classes/archetypes/summoner/formationAttack';
import type { CombatContext } from '../src/systems/combat/engine/combatPipeline';
import {
  applySummonerCommand,
  clearSummonerCommand,
} from '../src/systems/classes/archetypes/summoner/command';
import { syncSummonerFormationTarget } from '../src/systems/classes/archetypes/summoner/formationTarget';
import { mirrorTargetStatus } from '../src/systems/combat/targetStatus';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function slices(
  id: string,
  unlockedSkills: string[] = ['summoner-root'],
  frame: 'light' | 'balanced' | 'heavy' | null = null,
  range: string | null = null,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
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
      unlockedSkills,
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: frame,
      selectedRange: range,
      combatArchetype: 'summoner',
    },
  };
}

function attachSummoner(world: World, persisted: PersistedPlayerSlices) {
  const player = world.attachPlayerEntity(persisted, persisted.isPlayer.id);
  syncArchetypeSlices(world, player);
  return player;
}

// Root formation and weapon cadence inheritance.
{
  const world = new World();
  const player = attachSummoner(world, slices('root'));
  player.performsAttack.attackCooldown = 1_375;
  updateSummonerArchetype(world, 0, 1_000);
  assert(player.summonsMinions?.targetCount === 4, 'root must create four logical slots');
  assert(player.summonsMinions.minionIds.every(Boolean), 'fresh root slots should spawn immediately');
  for (const id of player.summonsMinions.minionIds) {
    const minion = world.getMinionEntity(id)!;
    assert(minion.performsAttack.attackCooldown === 1_375, 'summon cadence must inherit weapon cooldown');
  }

  // Four fractional physical hits create exactly one generic logical proc.
  let triggers = 0;
  for (let index = 0; index < 4; index++) {
    const ctx = {
      attacker: player,
      attackerType: 'player',
      defender: world.createMonster('node-clearing', 'slime', { x: 500 + index, y: 400 }),
      defenderType: 'monster',
      formation: {
        ownerId: player.isPlayer.id, physicalEntityId: `m${index}`, slotId: `normal:${index}`,
        directDamageWeight: 0.25, onHitMagnitudeWeight: 0.25, procWeight: 0.25,
        targetId: 'logical-target', cycleSerial: 0, cycleCompleted: false, side: 'summon',
      },
    } as unknown as CombatContext;
    triggers += consumeWeightedProc(ctx, 'test.logical-proc');
  }
  assert(triggers === 1, `four summon hits should create one proc, got ${triggers}`);
}

// Shared FIFO reconstruction, defensive cost, and safety-floor pause/resume.
{
  const world = new World();
  const player = attachSummoner(world, slices('queue'));
  updateSummonerArchetype(world, 0, 1_000);
  const summons = player.summonsMinions!;
  world.getMinionEntity(summons.minionIds[0]!)!.hasHealth.hp = 0;
  world.getMinionEntity(summons.minionIds[1]!)!.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 1_100);
  assert(summons.activeReconstruction?.slotId === 'normal:0', 'first dead slot must own queue progress');
  assert(summons.reconstructionQueue[0] === 'normal:1', 'second dead slot must wait in FIFO order');

  const expectedCost = 60; // 1000 max HP * 0.8 formation HP * 1/4 slot * 30% cost.
  player.hasHealth.hp = 250;
  player.dealsDamage.attack = 999_999;
  updateSummonerArchetype(world, 5_000, 6_100);
  assert(!summons.minionIds[0], 'ready reconstruction must pause below the safety floor');
  assert(player.hasHealth.hp === 250, 'blocked reconstruction must not charge HP');

  player.hasHealth.hp = 500;
  updateSummonerArchetype(world, 0, 6_200);
  assert(!!summons.minionIds[0], 'reconstruction should resume when payment is safe');
  assert(player.hasHealth.hp === 500 - expectedCost, 'cost must derive from defensive HP, not huge attack');
  assert(summons.activeReconstruction?.slotId === 'normal:1', 'next slot starts only after the head completes');

  const views = projectSummonSlots(summons, player.usesSkills.passives);
  assert(views[1]?.queuePosition === 0, 'HUD must identify the one active reconstruction');
}

// The owner target frame follows summon combat without borrowing HasAttackTarget.
{
  const world = new World();
  const player = attachSummoner(world, slices('formation-target'));
  updateSummonerArchetype(world, 0, 1_000);
  const summoner = player as typeof player & {
    summonsMinions: NonNullable<typeof player.summonsMinions>;
  };
  const minions = summoner.summonsMinions.minionIds.map((id) => world.getMinionEntity(id)!);
  const targetA = world.createMonster('node-clearing', 'plains-slime', { x: 520, y: 400 });
  const targetB = world.createMonster('node-clearing', 'plains-slime', { x: 760, y: 400 });
  assert(targetA !== null && targetB !== null, 'formation target fixtures must spawn');

  setAttackTarget(world, minions[0]!, targetB.isMonster.id);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetB.isMonster.id,
    'formation target should follow a summon attack target');
  assert(composePlayerView(player)?.attackTargetId === targetB.isMonster.id,
    'player view should project the formation target into the existing target frame');
  assert(player.hasAttackTarget === undefined,
    'formation targeting must not give an ordinary Conduit a direct attack target');

  // A split formation retains its previous valid target rather than flickering
  // back to whichever logical slot happens to be evaluated first.
  setAttackTarget(world, minions[0]!, targetA.isMonster.id);
  setAttackTarget(world, minions[1]!, targetB.isMonster.id);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetB.isMonster.id,
    'split-target formations should retain the previous active display target');

  applySummonerCommand(world, player, targetA.hasPosition.current);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetA.isMonster.id,
    'manual focus should immediately override the displayed formation target');

  applyStatusEffect(targetA.tracksCombat, {
    id: 'test-formation-debuff',
    sourceId: player.isPlayer.id,
    remainingMs: 5_000,
    data: { totalMs: 5_000 },
  });
  mirrorTargetStatus(world);
  assert(targetA.hasStatus.targetStatus?.some((status) => status.id === 'test-formation-debuff') === true,
    'formation target debuffs should be mirrored into the target-frame status list');

  applySummonerCommand(world, player, { x: 700, y: 700 });
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === null,
    'a formation move command should clear the displayed combat target');

  clearSummonerCommand(world, player);
  setAttackTarget(world, minions[0]!, targetA.isMonster.id);
  targetA.hasHealth.hp = 0;
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetB.isMonster.id,
    'a dead displayed target should fall back to another summon target');
  setAttackTarget(world, minions[1]!, null);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === null,
    'the formation target should clear when no living summon has a valid target');
}

// Grand Ritual grants finite charges only to slots alive at the trigger.
{
  const world = new World();
  const skills = ['summoner-root', 'summoner-balanced', 'summoner-range-mid', 'summoner-balanced-t3-c'];
  const player = attachSummoner(world, slices('ritual', skills, 'balanced', 'summoner-range-mid'));
  updateSummonerArchetype(world, 0, 1_000);
  const missing = world.getMinionEntity(player.summonsMinions!.minionIds[4]!)!;
  missing.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 11_000);
  const charges = player.summonsMinions!.ritualCharges!;
  assert(charges.slice(0, 4).every((charge) => charge === 2), 'living ritual slots receive two charges');
  assert(charges[4] === 0, 'dead ritual slot must receive no retroactive package');
}

// Volatile marking and deliberate death use the same reconstruction queue.
{
  const world = new World();
  const skills = ['summoner-root', 'summoner-light', 'summoner-range-far', 'summoner-light-t3-c'];
  const player = attachSummoner(world, slices('volatile', skills, 'light', 'summoner-range-far'));
  updateSummonerArchetype(world, 0, 1_000);
  const target = world.createMonster('node-clearing', 'plains-slime', { x: 650, y: 400 });
  assert(target !== null, 'volatile test target must exist');
  target.hasHealth.hp = 1_000_000;
  target.hasHealth.maxHp = 1_000_000;
  updateSummonerArchetype(world, 0, 7_000);
  assert(!!player.summonsMinions!.volatileMarkedSlotId, 'volatile timer should visibly mark one slot');
  const markedIndex = player.summonsMinions!.slotIds.indexOf(player.summonsMinions!.volatileMarkedSlotId!);
  world.getMinionEntity(player.summonsMinions!.minionIds[markedIndex]!)!.hasAttackTarget = {
    targetId: target.isMonster.id,
  };
  updateSummonerArchetype(world, 0, 9_000);
  assert(player.summonsMinions!.activeReconstruction !== undefined, 'detonated slot must enter shared reconstruction');
}

// Heavy transformations and the sole direct-attack exception.
{
  const twin = resolveSummonerProfile({
    selectedSubVariant: 'heavy', selectedRange: 'summoner-range-close',
    unlockedSkills: ['summoner-heavy-t3-a'],
  });
  assert(twin.slots[0]?.role === 'offense-twin' && twin.slots[1]?.role === 'defense-twin', 'twins need stable distinct roles');
  assert(twin.slots[0]!.offenseWeight > twin.slots[1]!.offenseWeight, 'offense twin must carry more offense');
  assert(twin.slots[1]!.defenseWeight > twin.slots[0]!.defenseWeight, 'defense twin must carry more defense');

  const world = new World();
  const ordinary = attachSummoner(world, slices('ordinary'));
  recalculatePlayerEntityStats(world, ordinary);
  assert(ordinary.cannotAttack !== undefined, 'ordinary Conduit must not attack directly');

  const bondSkills = ['summoner-root', 'summoner-heavy', 'summoner-range-mid', 'summoner-heavy-t3-b'];
  const bonded = attachSummoner(world, slices('bonded', bondSkills, 'heavy', 'summoner-range-mid'));
  recalculatePlayerEntityStats(world, bonded);
  assert(bonded.cannotAttack === undefined, 'Battle Bond must restore the Conduit direct attack');
  const bondProfile = resolveSummonerProfile({
    selectedSubVariant: 'heavy', selectedRange: 'summoner-range-mid', unlockedSkills: bondSkills,
  });
  assert(bondProfile.slots.length === 1, 'Battle Bond keeps one bonded summon');
  assert(Math.abs(bondProfile.slots[0]!.offenseWeight + bondProfile.battleBondConduitOffenseWeight - 1) < 1e-9,
    'Battle Bond offense sides must sum to one budget');
}

console.log('summonerOverhaul.test.ts: ok');
