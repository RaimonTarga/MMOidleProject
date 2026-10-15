/**
 * The Conduit's Formation at runtime (class-first build plan CD.1; bible §7.3): the roster in
 * the class config becomes the formation: one slot per body, each wearing its piece's body and
 * attacking from its mode's range. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  CONDUIT_KIT,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  SUMMONER_BASELINE_ATTACK_RANGE,
  getResource,
  getStatusEffect,
  SUMMONER_RANGE_TUNING,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { isSummonerRecalling } from '../src/systems/classes/archetypes/summoner/command';
import { orderedTarget, rebuildRank, syncFormationRecall } from '../src/systems/classes/archetypes/summoner/formationOrders';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { computeMinionMitigation } from '../src/systems/classes/archetypes/summoner/spawn';
import { runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { classConfigContextOf } from '../src/systems/player/progression/classConfig';
import { equipItem } from '../src/systems/player/economy/inventory';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };

function setup(roster?: string[], relic?: string) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'conduit', name: 'Conduit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
    },
  } as PersistedPlayerSlices, 'conduit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  const ctx = classConfigContextFromState({
    combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null,
  })!;
  const config = defaultClassConfig(ctx);
  assert.equal(config.system.kind, 'formation');
  if (roster && config.system.kind === 'formation') config.system.roster = roster;
  if (relic) config.relic = [relic];
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  return { world, player };
}

const piece = (id: string) => CONDUIT_KIT.pieces.find((p) => p.id === id)!;

// The default roster is the Formation's: its slots follow the config, not the old frame.
{
  const { world, player } = setup();
  const system = player.configuresClass!.config.system;
  assert.equal(system.kind, 'formation');
  const roster = system.kind === 'formation' ? system.roster : [];
  assert.ok(roster.length > 0, 'a default roster exists');
  updateSummonerArchetype(world, 100, Date.now());
  const summons = player.summonsMinions!;
  assert.equal(summons.targetCount, roster.length, 'one slot per roster entry');
  assert.deepEqual(summons.slotIds.map((id) => id.split('#')[0]), roster, 'slots are the roster pieces, in order');
}

// A mixed roster: each body wears its piece's body and attacks from its mode's range.
{
  const roster = ['conduit-plains-tank', 'conduit-mountain-marksman', 'conduit-cave-heavy'];
  const { world, player } = setup(roster);
  const profile = summonerProfileFor(player);
  assert.equal(profile.slots.length, 3);
  assert.deepEqual(profile.slots.map((slot) => slot.slotId), roster.map((id) => `${id}#0`));
  // Weights follow Command spent (1, 1, 2), and a complete formation still totals 1.
  const total = profile.slots.reduce((sum, slot) => sum + slot.offenseWeight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights total 1, got ${total}`);
  assert.ok(profile.slots[2]!.offenseWeight > profile.slots[0]!.offenseWeight, 'the 2-Command heavy carries more');

  updateSummonerArchetype(world, 100, Date.now());
  updateSummonerArchetype(world, 100, Date.now());
  const minions = player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
  assert.ok(minions.every(Boolean), 'every slot is fielded');
  roster.forEach((id, i) => {
    assert.equal(minions[i]!.isMinion.monsterTypeId, piece(id).body, `${id} wears its body`);
  });
  assert.equal(minions[0]!.performsAttack.attackRange, SUMMONER_BASELINE_ATTACK_RANGE, 'melee fights close in');
  assert.equal(minions[1]!.performsAttack.attackRange, SUMMONER_RANGE_TUNING.far.attackRange, 'ranged reaches far');
}

// Repeats get their own slots.
{
  const { player } = setup(['conduit-thrall', 'conduit-thrall', 'conduit-thrall']);
  assert.deepEqual(summonerProfileFor(player).slots.map((slot) => slot.slotId), ['conduit-thrall#0', 'conduit-thrall#1', 'conduit-thrall#2']);
}

// CD.2: each T1 type does its job through the owner's attack pipeline.
{
  const { world, player } = setup(['conduit-plains-tank', 'conduit-swamp-spitter', 'conduit-mountain-marksman']);
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const [warden, spitter, marksman] = player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
  assert.ok(warden && spitter && marksman, 'all three fielded');
  const mk = (x: number) => {
    const m = world.createMonster('node-5-5', 'bone-crawler', { x, y: 400 })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 20;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  const target = mk(430);
  const bystander = mk(470);

  runFormationAttack(world, player, spitter, target, 2_000);
  assert.ok(getStatusEffect(target.tracksCombat, 'plating-shred'), 'the Spitter strips plating');

  runFormationAttack(world, player, warden, target, 3_000);
  assert.ok(target.heldByTaunt && bystander.heldByTaunt, 'the Warden taunts the target and the enemies around it');
  assert.equal(target.heldByTaunt!.taunterId, warden.isMinion.id);

  const dmg: number[] = [];
  for (let i = 0; i < 3; i++) {
    const before = target.hasHealth.hp;
    runFormationAttack(world, player, marksman, target, 4_000 + i * 2_000);
    dmg.push(before - target.hasHealth.hp);
  }
  assert.ok(dmg[2]! > dmg[0]! * 1.5, `the third shot is the heavy one: ${dmg.join(', ')}`);
}

// CD.3: the orders steer targets, rebuilds and Recall.
{
  const { world, player } = setup(['conduit-plains-tank', 'conduit-forest-bruiser', 'conduit-swamp-spitter']);
  const orders = (player.configuresClass!.config.system as unknown as { orders: Record<string, unknown> }).orders;
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const [warden, bruiser, spitter] = player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
  const near = world.createMonster('node-5-5', 'bone-crawler', { x: 440, y: 400 })!;
  const weak = world.createMonster('node-5-5', 'bone-crawler', { x: 520, y: 400 })!;
  const attacker = world.createMonster('node-5-5', 'bone-crawler', { x: 560, y: 400 })!;
  for (const m of [near, weak, attacker]) m.hasHealth.hp = m.hasHealth.maxHp = 1_000;
  weak.hasHealth.hp = 100;
  setAggroTarget(world, attacker, { kind: 'player', id: player.isPlayer.id }, 0);

  orders.attackFirst = 'closest';
  assert.equal(orderedTarget(world, player, bruiser, 320), near, 'closest');
  bruiser.controlsMinion.currentTargetId = null;
  orders.attackFirst = 'weakest';
  assert.equal(orderedTarget(world, player, bruiser, 320), weak, 'weakest');
  orders.attackFirst = 'attacking-me';
  assert.equal(orderedTarget(world, player, spitter, 320), attacker, 'what attacks the Conduit');
  // A tank guards the Conduit first, whatever the others do.
  orders.attackFirst = 'closest';
  assert.equal(orderedTarget(world, player, warden, 320), attacker, 'the tank takes whoever is on the Conduit');
  // Sticky: a valid current target is kept.
  bruiser.controlsMinion.currentTargetId = weak.isMonster.id;
  assert.equal(orderedTarget(world, player, bruiser, 320), weak, 'a valid target is kept');

  // Rebuild order: tanks first puts a fallen tank ahead of a fallen damage dealer.
  orders.rebuildFirst = 'tanks';
  assert.ok(rebuildRank(player, bruiser.isMinion.slotId) > rebuildRank(player, warden.isMinion.slotId), 'tanks rebuild first');
  orders.rebuildFirst = 'damage';
  assert.ok(rebuildRank(player, bruiser.isMinion.slotId) < rebuildRank(player, warden.isMinion.slotId), 'damage rebuilds first');
  orders.rebuildFirst = 'as-fallen';
  assert.equal(rebuildRank(player, bruiser.isMinion.slotId), rebuildRank(player, warden.isMinion.slotId), 'as fallen is one rank');

  // Recall: the free rule sets the flag while its conditions hold.
  orders.recallWhen = [{ id: 'hp-low' }];
  player.hasHealth.hp = player.hasHealth.maxHp;
  updatePlayerMoments(world, player, 2_000);
  syncFormationRecall(world, player, 2_000);
  assert.equal(isSummonerRecalling(player), false, 'no recall at full HP');
  player.hasHealth.hp = Math.round(player.hasHealth.maxHp * 0.1);
  updatePlayerMoments(world, player, 2_100);
  syncFormationRecall(world, player, 2_100);
  assert.equal(isSummonerRecalling(player), true, 'low HP recalls the formation');
  orders.recallWhen = [];
  syncFormationRecall(world, player, 2_200);
  assert.equal(isSummonerRecalling(player), false, 'an empty rule never recalls');
}

// CD.4: a Soul is a free extra body plus its seed line.
{
  const roster = ['conduit-plains-tank', 'conduit-forest-bruiser', 'conduit-mountain-marksman'];
  const { world, player } = setup(roster, 'conduit-relic-plains');
  const profile = summonerProfileFor(player);
  assert.equal(profile.slots.length, 4, 'the Soul adds a body');
  assert.equal(profile.slots[3]!.slotId, 'conduit-relic-plains#0');
  assert.equal(profile.slots[3]!.body, 'conduit-summon-champion', 'the Soul wears its own body');
  assert.ok(Math.abs(profile.slots[0]!.offenseWeight - 1 / 3) < 1e-9, 'a free Soul dilutes no paid body');

  const mk = (x: number) => {
    const m = world.createMonster('node-5-5', 'bone-crawler', { x, y: 400 })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    return m;
  };
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const target = mk(430);
  player.summonsMinions!.formationTargetId = target.isMonster.id;
  const hpBefore = target.hasHealth.hp;
  updateSummonerArchetype(world, 100, 50_000);
  assert.ok(target.hasHealth.hp < hpBefore, 'Razortusk: the melee summons charge the target together');
}
{
  const { world, player } = setup(['conduit-forest-bruiser', 'conduit-plains-tank'], 'conduit-relic-forest');
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const minion = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  const mon = world.createMonster('node-5-5', 'bone-crawler', { x: 460, y: 400 })!;
  setAggroTarget(world, mon, { kind: 'player', id: player.isPlayer.id }, 0);
  minion.hasHealth.hp = Math.round(minion.hasHealth.maxHp * 0.5);
  const before = minion.hasHealth.hp;
  updateSummonerArchetype(world, 1_000, Date.now());
  assert.ok(minion.hasHealth.hp > before, 'Timberclaw: summons mend during a fight');
}
{
  const { world, player } = setup(['conduit-forest-bruiser', 'conduit-plains-tank'], 'conduit-relic-swamp');
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const dying = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  const mon = world.createMonster('node-5-5', 'bone-crawler', { x: dying.hasPosition.current.x + 30, y: dying.hasPosition.current.y })!;
  mon.hasHealth.hp = mon.hasHealth.maxHp = 1_000_000;
  const before = mon.hasHealth.hp;
  dying.hasHealth.hp = 0;
  updateSummonerArchetype(world, 100, 1_200);
  assert.ok(mon.hasHealth.hp < before, 'Mire Behemoth: a fallen summon leaves bile that hurts enemies');
}
{
  const { world, player } = setup(['conduit-plains-tank'], 'conduit-relic-mountain');
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const tank = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  const target = world.createMonster('node-5-5', 'bone-crawler', { x: 430, y: 400 })!;
  target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
  tank.hasHealth.hp = Math.round(tank.hasHealth.maxHp * 0.5);
  const before = tank.hasHealth.hp;
  runFormationAttack(world, player, tank, target, 3_000);
  assert.ok(tank.hasHealth.hp > before, 'Stoneplate: the tank taunt also shields it');
}

// CD.5: the weapon and the T1 lines.
{
  const { world, player } = setup(['conduit-plains-tank', 'conduit-forest-bruiser', 'conduit-swamp-spitter']);
  const base = classConfigContextOf(player)!.budget;
  player.holdsInventory.inventory.push('conduit-swarm-staff-t1');
  assert.ok(equipItem(world, player, 'conduit-swarm-staff-t1'), 'equip the Swarm Staff');
  assert.equal(classConfigContextOf(player)!.budget, base + 2, 'the Swarm Staff adds Command');
  assert.equal(player.usesSkills.passives['conduit.command'], 2);
  player.holdsInventory.equipment.weapon = null;
  player.usesSkills.passives['conduit.command'] = 0;

  // You Tank / weapon multipliers reach the slots.
  player.usesSkills.passives['conduit.damage-pct'] = 0.2;
  player.usesSkills.passives['conduit.hp-pct'] = -0.3;
  const slot = summonerProfileFor(player).slots[1]!;
  assert.ok(Math.abs(slot.damageMult! - 0.9 * 1.2) < 1e-9 && Math.abs(slot.hpMult! - 0.6 * 0.7) < 1e-9, 'damage and HP lines scale the piece');
  player.usesSkills.passives['conduit.damage-pct'] = 0;
  player.usesSkills.passives['conduit.hp-pct'] = 0;

  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const minions = player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
  const mon = world.createMonster('node-5-5', 'bone-crawler', { x: 440, y: 400 })!;
  mon.hasHealth.hp = mon.hasHealth.maxHp = 1_000_000;

  // Shared Plating.
  const plain = computeMinionMitigation(player, { plating: 0 } as never).plating;
  player.usesSkills.passives['conduit.plating-share'] = 0.5;
  assert.ok(computeMinionMitigation(player, { plating: 0 } as never).plating >= plain, 'Shared Plating raises the summons plating');
  player.mitigatesDamage.plating = 10;
  assert.equal(computeMinionMitigation(player, { plating: 0 } as never).plating, 15, 'a half-again plating copy');
  player.usesSkills.passives['conduit.plating-share'] = 0;

  // Bramble thorns and the unhit clock.
  player.usesSkills.passives['conduit.thorns'] = 7;
  const hpBefore = mon.hasHealth.hp;
  runMonsterAttackOnMinion(world, mon, minions[0]!, 5_000);
  assert.ok(hpBefore - mon.hasHealth.hp >= 7, 'Bramble hits back');
  assert.equal(getResource(minions[0]!.tracksCombat, 'minion.lastHitAt'), 5_000, 'the unhit clock is stamped');
  player.usesSkills.passives['conduit.thorns'] = 0;

  // Sapbark: unhit long enough, a hurt summon regenerates even mid-fight.
  player.usesSkills.passives['conduit.sapbark-ms'] = 1_000;
  minions[1]!.hasHealth.hp = Math.round(minions[1]!.hasHealth.maxHp * 0.5);
  const hurt = minions[1]!.hasHealth.hp;
  setAggroTarget(world, mon, { kind: 'player', id: player.isPlayer.id }, 0);
  updateSummonerArchetype(world, 1_000, 20_000);
  assert.ok(minions[1]!.hasHealth.hp > hurt, 'Sapbark regenerates');
  player.usesSkills.passives['conduit.sapbark-ms'] = 0;

  // Bloodtithe: a fallen summon returns part of the rebuild cost.
  player.usesSkills.passives['conduit.bloodtithe-pct'] = 1;
  player.hasHealth.hp = Math.round(player.hasHealth.maxHp * 0.5);
  const owned = player.hasHealth.hp;
  minions[2]!.hasHealth.hp = 0;
  updateSummonerArchetype(world, 100, 21_000);
  assert.ok(player.hasHealth.hp > owned, 'Bloodtithe heals the owner');
  player.usesSkills.passives['conduit.bloodtithe-pct'] = 0;
}
{
  const { world, player } = setup(['conduit-plains-tank', 'conduit-forest-bruiser']);
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const tank = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  const mon = world.createMonster('node-5-5', 'bone-crawler', { x: 440, y: 400 })!;
  const hit = (damage: number) => {
    const ctx = makeCombatContext(mon, 'monster', player, 'player');
    ctx.damage = damage;
    emitCombatEvent('onDamageTaken', ctx, world);
    return ctx.damage;
  };
  // No default redirection (§7.10).
  assert.equal(hit(10), 10, 'nothing is redirected by default');
  // Big-Hit Intercept.
  player.usesSkills.passives['conduit.intercept-pct'] = 0.3;
  const tankHp = tank.hasHealth.hp;
  const small = Math.round(player.hasHealth.maxHp * 0.1);
  assert.equal(hit(small), small, 'a small hit lands on you');
  assert.equal(hit(player.hasHealth.maxHp * 0.4), 0, 'a big hit goes to the tank');
  assert.ok(tank.hasHealth.hp < tankHp, 'the tank took it');
  player.usesSkills.passives['conduit.intercept-pct'] = 0;

  // Poison Shift.
  player.usesSkills.passives['conduit.poison-shift'] = 1;
  applyMonsterDotToPlayer(world, mon, player, { debuffId: 'poison', label: 'Poison', damagePerStack: 5, maxStacks: 3, tickIntervalMs: 1000, durationMs: 5000, element: 'poison' } as never);
  const summons = player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
  assert.ok(summons.some((m) => m.tracksCombat.statusEffects.some((e) => e.id.includes('poison'))), 'poison lands on a summon');
  assert.ok(!player.tracksCombat.statusEffects.some((e) => e.id.includes('poison')), 'and not on you');
}
{
  // Poison Staff: summon hits stack a poison of remaining ticks.
  const { world, player } = setup(['conduit-forest-bruiser']);
  player.usesSkills.passives['conduit.poison-stacks'] = 1;
  updateSummonerArchetype(world, 100, 1_000);
  updateSummonerArchetype(world, 100, 1_100);
  const bruiser = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  const mon = world.createMonster('node-5-5', 'bone-crawler', { x: 430, y: 400 })!;
  mon.hasHealth.hp = mon.hasHealth.maxHp = 1_000_000;
  runFormationAttack(world, player, bruiser, mon, 2_000);
  const first = getStatusEffect(mon.tracksCombat, 'conduit-poison')?.stacks ?? 0;
  runFormationAttack(world, player, bruiser, mon, 4_000);
  const second = getStatusEffect(mon.tracksCombat, 'conduit-poison')?.stacks ?? 0;
  assert.ok(first > 0 && second > first, `poison ticks stack: ${first} then ${second}`);
}

console.log('conduitFormation: ok');
