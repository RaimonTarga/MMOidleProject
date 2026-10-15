import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  composePlayerView,
  emptyEquipment,
  projectSummonSlots,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { consumeWeightedProc } from '../src/systems/classes/archetypes/summoner/formationAttack';
import type { CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { syncSummonerFormationTarget } from '../src/systems/classes/archetypes/summoner/formationTarget';
import { mirrorTargetStatus } from '../src/systems/combat/targetStatus';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';

function assert(condition: unknown, message: string): void {
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
      
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 4,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
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
  // Four equal Thralls. The default roster also fills Command, which is 4 at
  // Mastery 0; pin it so the cost and cadence checks do not follow the budget.
  if (player.configuresClass?.config.system.kind === 'formation') {
    player.configuresClass.config = {
      mode: 'custom',
      relic: [],
      system: {
        kind: 'formation',
        roster: ['conduit-thrall', 'conduit-thrall', 'conduit-thrall', 'conduit-thrall'],
        orders: { attackFirst: 'closest', tanksGuard: 'conduit', recallWhen: [], rebuildFirst: 'as-fallen' },
      },
    };
  }
  return player;
}

// Root formation and weapon cadence inheritance.
{
  const world = new World();
  const player = attachSummoner(world, slices('root'));
  player.performsAttack.attackCooldown = 1_375;
  updateSummonerArchetype(world, 0, 1_000);
  assert(player.summonsMinions?.targetCount === 4, 'root must create four logical slots');
  assert(player.summonsMinions!.minionIds.every(Boolean), 'fresh root slots should spawn immediately');
  for (const id of player.summonsMinions!.minionIds) {
    const minion = world.getMinionEntity(id)!;
    assert(minion.performsAttack.attackCooldown === 1_375, 'summon cadence must inherit weapon cooldown');
    assert(minion.performsAttack.attackRange === 24, 'root summons must fight at near-melee range');
    assert(minion.hasPosition.speed >= player.hasPosition.speed,
      'root summons must keep pace with their Conduit');
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
  assert(summons.activeReconstruction?.slotId === summons.slotIds[0], 'first dead slot must own queue progress');
  assert(summons.reconstructionQueue[0] === summons.slotIds[1], 'second dead slot must wait in FIFO order');

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
  assert(summons.activeReconstruction?.slotId === summons.slotIds[1], 'next slot starts only after the head completes');

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

  setAttackTarget(world, minions[0]!, targetB!.isMonster.id);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetB!.isMonster.id,
    'formation target should follow a summon attack target');
  assert(composePlayerView(player)?.attackTargetId === targetB!.isMonster.id,
    'player view should project the formation target into the existing target frame');
  assert(player.hasAttackTarget === undefined,
    'formation targeting must not give an ordinary Conduit a direct attack target');

  // A split formation retains its previous valid target rather than flickering
  // back to whichever logical slot happens to be evaluated first.
  setAttackTarget(world, minions[0]!, targetA!.isMonster.id);
  setAttackTarget(world, minions[1]!, targetB!.isMonster.id);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetB!.isMonster.id,
    'split-target formations should retain the previous active display target');

  applyStatusEffect(targetB!.tracksCombat, {
    id: 'test-formation-debuff',
    sourceId: player.isPlayer.id,
    remainingMs: 5_000,
    data: { totalMs: 5_000 },
  });
  mirrorTargetStatus(world);
  assert(targetB!.hasStatus.targetStatus?.some((status) => status.id === 'test-formation-debuff') === true,
    'formation target debuffs should be mirrored into the target-frame status list');

  targetB!.hasHealth.hp = 0;
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === targetA!.isMonster.id,
    'a dead displayed target should fall back to another summon target');
  setAttackTarget(world, minions[0]!, null);
  syncSummonerFormationTarget(world, summoner);
  assert(summoner.summonsMinions.formationTargetId === null,
    'the formation target should clear when no living summon has a valid target');
}

// The Conduit does not attack. The formation does.
{
  const world = new World();
  const ordinary = attachSummoner(world, slices('ordinary'));
  recalculatePlayerEntityStats(world, ordinary);
  assert(ordinary.cannotAttack !== undefined, 'a Conduit must not attack directly');
}

console.log('summonerOverhaul.test.ts: ok');
