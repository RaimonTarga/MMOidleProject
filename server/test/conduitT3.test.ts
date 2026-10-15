/**
 * The Conduit's tier 3 at runtime (T3-CONDUIT; bible §7.6, §7.8, §7.9, §7.16): the seven T3 summon
 * types, the nine specializations, the two new Souls and the Soul ranks, and the T3 gear lines.
 * Wiring only: attach, tick, assert observable state. No balance numbers.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  ABILITY_SLOW_EFFECT_ID,
  CONDUIT_SPECIALIZATION_TUNING as SPEC,
  CONDUIT_KIT,
  classConfigContextFromState,
  classLineFor,
  defaultClassConfig,
  disciplineCommandCost,
  emptyEquipment,
  getFlag,
  getResource,
  getStatusEffect,
  ITEM_DATABASE,
  rosterCommand,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import { soulPower, soulsOf } from '../src/systems/classes/archetypes/summoner/souls';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { HORN_EFFECT_ID, HIBERNATE_EFFECT_ID, SPORE_EFFECT_ID, BURN_BRIGHT_EFFECT_ID, INFESTED_FLAG, HUNT_EFFECT_ID } from '../src/systems/classes/archetypes/summoner/t3Shared';
import { runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { minionAttackCooldown } from '../src/systems/combat/status/minionAfflictions';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { World } from '../src/world/World';

initCombatSystems();
const BIOMES = { plains: 12, forest: 12, swamp: 18, mountain: 18, cave: 18, jungle: 12, desert: 12, tundra: 6, volcanic: 6 };

interface Opts { relic?: string; discipline?: string; specialization?: string; cleared?: string[]; passives?: Record<string, number> }

function setup(roster: string[], opts: Opts = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'conduit', name: 'Conduit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 3, currentSkillTier: 0, bossesCleared: opts.cleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
      disciplineId: opts.discipline ?? null, specializationId: opts.specialization ?? null,
    },
  } as unknown as PersistedPlayerSlices, 'conduit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  const ctx = classConfigContextFromState({
    combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: opts.cleared ?? [], disciplineId: opts.discipline ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  assert.equal(config.system.kind, 'formation');
  if (config.system.kind === 'formation') config.system.roster = roster;
  if (opts.relic) config.relic = [opts.relic];
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  return { world, player };
}

function field(roster: string[], opts: Opts = {}) {
  const made = setup(roster, opts);
  updateSummonerArchetype(made.world, 100, 1_000);
  updateSummonerArchetype(made.world, 100, 1_100);
  const minions = made.player.summonsMinions!.minionIds.map((id) => made.world.getMinionEntity(id)!);
  assert.ok(minions.every(Boolean), 'every slot is fielded');
  return { ...made, minions };
}

function monster(world: World, x: number, hp = 1_000_000, y = 400) {
  const m = world.createMonster('node-5-5', 'bone-crawler', { x, y })!;
  m.hasHealth.hp = m.hasHealth.maxHp = hp;
  m.mitigatesDamage.plating = 0;
  m.mitigatesDamage.damageReduction = 0;
  m.dealsDamage.attack = 5;
  return m;
}

type Made = ReturnType<typeof field>;
const hit = (made: Pick<Made, 'world' | 'player'>, minion: Made['minions'][number], target: ReturnType<typeof monster>, now: number) => {
  const before = target.hasHealth.hp;
  runFormationAttack(made.world, made.player, minion, target, now);
  return before - target.hasHealth.hp;
};

/** Put the formation in a fight against `target` and run one summoner pass. */
function fight(made: Pick<Made, 'world' | 'player'>, target: ReturnType<typeof monster>, now: number) {
  made.player.summonsMinions!.formationTargetId = target.isMonster.id;
  updateSummonerArchetype(made.world, 100, now);
}

// ── Lessons: every T3 piece is bound by its zone, and has a job to do ─────────
{
  const t3 = ['conduit-warhorn', 'conduit-burrower', 'conduit-sporecaller', 'conduit-prowler', 'conduit-carapace-guard', 'conduit-frostcaller', 'conduit-cinderling'];
  const ctx = classConfigContextFromState({ combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null })!;
  for (const id of t3) assert.ok(ctx.pieceRanks.has(id), `${id} is bound at T3`);
  for (const id of t3) {
    const params = CONDUIT_KIT.pieces.find((p) => p.id === id)!.params;
    assert.ok(Object.keys(params).length > 0, `${id} has a job`);
  }
  const { player } = field(t3.filter((id) => id !== 'conduit-warhorn'));
  assert.equal(summonerProfileFor(player).slots.length, t3.length - 1, 'the T3 roster can be fielded');
}

// ── Warhorn: its call hastens every summon around it ──────────────────────────
{
  const made = field(['conduit-warhorn', 'conduit-thrall']);
  const target = monster(made.world, 430);
  const before = minionAttackCooldown(made.minions[1]!);
  fight(made, target, 2_000);
  assert.ok(getStatusEffect(made.minions[1]!.tracksCombat, HORN_EFFECT_ID), 'a summon near the horn is hastened');
  assert.ok(minionAttackCooldown(made.minions[1]!) < before, 'and attacks faster');
}

// ── Burrower: it erupts under the enemy that fights from furthest back ────────
{
  const made = field(['conduit-burrower']);
  const front = monster(made.world, 430);
  const archer = monster(made.world, 520);
  archer.performsAttack.attackRange = 300;
  const melee = monster(made.world, 500);
  hit(made, made.minions[0]!, front, 2_000);
  assert.ok(archer.hasHealth.hp < archer.hasHealth.maxHp, 'the back-row shooter is reached');
  assert.equal(melee.hasHealth.hp, melee.hasHealth.maxHp, 'a melee enemy is not');
}

// ── Sporecaller: enemies around the target deal less ─────────────────────────
{
  const made = field(['conduit-sporecaller', 'conduit-thrall']);
  const target = monster(made.world, 430);
  const near = monster(made.world, 470);
  const far = monster(made.world, 900);
  hit(made, made.minions[0]!, target, 2_000);
  assert.ok(getStatusEffect(target.tracksCombat, SPORE_EFFECT_ID), 'the target is spored');
  assert.ok(getStatusEffect(near.tracksCombat, SPORE_EFFECT_ID), 'so are those around it');
  assert.ok(!getStatusEffect(far.tracksCombat, SPORE_EFFECT_ID), 'not a far enemy');
  const taken = (from: typeof target) => {
    const ctx = makeCombatContext(from, 'monster', made.player, 'player');
    ctx.damage = 100;
    emitCombatEvent('onDamageTaken', ctx, made.world);
    return ctx.damage;
  };
  assert.ok(taken(target) < taken(far), 'a spored enemy hits you softer');
  const thrall = made.minions[1]!;
  const lost = (from: typeof target) => { thrall.hasHealth.maxHp = thrall.hasHealth.hp = 10_000; from.dealsDamage.attack = 200; runMonsterAttackOnMinion(made.world, from, thrall, 9_000); return 10_000 - thrall.hasHealth.hp; };
  assert.ok(lost(near) < lost(far), 'and hits a summon softer');
}

// ── Prowler: strikes from hiding, and pounces on an enemy that has run ────────
{
  const made = field(['conduit-prowler']);
  const target = monster(made.world, 430);
  const ambush = hit(made, made.minions[0]!, target, 2_000);
  const plain = hit(made, made.minions[0]!, target, 3_000);
  assert.ok(ambush > plain * 1.5, `the first strike from hiding hits harder: ${ambush} then ${plain}`);
  target.hasPosition.current = { x: 560, y: 400 };
  const pounce = hit(made, made.minions[0]!, target, 4_000);
  assert.ok(pounce > plain * 1.3, `an enemy that has run is pounced on: ${pounce} vs ${plain}`);
  const after = hit(made, made.minions[0]!, target, 5_000);
  assert.ok(after < pounce, 'and the pounce is spent');
}

// ── Carapace Guard: shots at the summons behind it are blocked ────────────────
{
  const made = field(['conduit-carapace-guard', 'conduit-thrall']);
  const archer = monster(made.world, 460);
  archer.performsAttack.attackRange = 300;
  archer.dealsDamage.attack = 200;
  const melee = monster(made.world, 460);
  melee.performsAttack.attackRange = 20;
  melee.dealsDamage.attack = 200;
  const thrall = made.minions[1]!;
  const lost = (from: typeof archer) => { thrall.hasHealth.maxHp = thrall.hasHealth.hp = 10_000; runMonsterAttackOnMinion(made.world, from, thrall, 9_000); return 10_000 - thrall.hasHealth.hp; };
  assert.ok(lost(archer) < lost(melee), 'a shot aimed behind the guard is blocked in part');
  const guard = made.minions[0]!;
  const guardLost = (from: typeof archer) => { guard.hasHealth.maxHp = guard.hasHealth.hp = 10_000; runMonsterAttackOnMinion(made.world, from, guard, 9_100); return 10_000 - guard.hasHealth.hp; };
  assert.equal(guardLost(archer), guardLost(melee), 'the guard itself takes shots in full');
}

// ── Frostcaller: enemies around it attack and move slower ─────────────────────
{
  const made = field(['conduit-frostcaller']);
  const target = monster(made.world, 430);
  fight(made, target, 2_000);
  const slow = getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID);
  assert.ok(slow, 'an enemy near the Frostcaller is slowed');
  assert.ok((slow!.data['attackSlowPct'] ?? 0) > 0, 'and attacks slower');
}

// ── Cinderling: it burns everything around it, hotter as the fight goes ───────
{
  const made = field(['conduit-cinderling']);
  const target = monster(made.world, 420);
  const near = monster(made.world, 440);
  fight(made, target, 2_000);
  fight(made, target, 3_500);
  const early = near.hasHealth.maxHp - near.hasHealth.hp;
  assert.ok(early > 0, 'an enemy beside it burns');
  const burnAt = (now: number) => { const before = near.hasHealth.hp; fight(made, target, now); return before - near.hasHealth.hp; };
  const late = burnAt(40_000);
  assert.ok(late > 0, 'it keeps burning');
}

// ── Weapons: Icebound and Berserk ─────────────────────────────────────────────
{
  const made = field(['conduit-thrall'], { passives: { 'conduit.icebound-pct': 0.5 } });
  const a = monster(made.world, 430);
  const b = monster(made.world, 440);
  const plain = hit(made, made.minions[0]!, a, 2_000);
  applyStatusEffect(b.tracksCombat, { id: ABILITY_SLOW_EFFECT_ID, maxStacks: 1, remainingMs: 10_000, refreshable: true, sourceId: 'x', data: { moveSlowPct: 0.3, totalMs: 10_000 } });
  const slowed = hit(made, made.minions[0]!, b, 4_000);
  assert.ok(slowed > plain * 1.2, `Icebound: harder on a slowed enemy: ${plain} then ${slowed}`);
}
{
  const made = field(['conduit-thrall'], { passives: { 'conduit.berserk-pct': 0.5 } });
  const a = monster(made.world, 430);
  const whole = hit(made, made.minions[0]!, a, 2_000);
  made.minions[0]!.hasHealth.hp = Math.round(made.minions[0]!.hasHealth.maxHp * 0.2);
  const wounded = hit(made, made.minions[0]!, a, 4_000);
  assert.ok(wounded > whole * 1.2, `Berserk: a wounded summon hits harder: ${whole} then ${wounded}`);
}

// ── Charms and armor: Permafrost, Hibernate, Fireproof, Emberglow ─────────────
{
  const made = field(['conduit-plains-tank', 'conduit-thrall'], { passives: { 'conduit.permafrost': 1 } });
  const slow = (m: Made['minions'][number]) => applyStatusEffect(m.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 60_000, refreshable: true, sourceId: 'x', data: { speedMult: 0.5, totalMs: 60_000 } });
  slow(made.minions[0]!);
  slow(made.minions[1]!);
  updateSummonerArchetype(made.world, 100, 2_000);
  assert.ok(!getStatusEffect(made.minions[0]!.tracksCombat, 'slow'), 'a tank cannot be slowed');
  assert.ok(getStatusEffect(made.minions[1]!.tracksCombat, 'slow'), 'a thrall can');
}
{
  const made = field(['conduit-thrall'], { passives: { 'conduit.hibernate-ms': 3_000 } });
  const m = made.minions[0]!;
  m.hasHealth.hp = Math.round(m.hasHealth.maxHp * 0.2);
  const low = m.hasHealth.hp;
  updateSummonerArchetype(made.world, 100, 2_000);
  assert.ok(getStatusEffect(m.tracksCombat, HIBERNATE_EFFECT_ID), 'a badly hurt summon encases itself');
  const mon = monster(made.world, 440);
  mon.dealsDamage.attack = 5_000;
  runMonsterAttackOnMinion(made.world, mon, m, 2_100);
  assert.ok(m.hasHealth.hp >= low, 'a hit does nothing to it in the ice');
  updateSummonerArchetype(made.world, 1_000, 3_100);
  assert.ok(m.hasHealth.hp > low, 'and it regenerates');
  updateSummonerArchetype(made.world, 100, 5_500);
  const live = made.player.summonsMinions!.minionIds.map((id) => made.world.getMinionEntity(id)).find(Boolean);
  assert.ok(!live || !getStatusEffect(live.tracksCombat, HIBERNATE_EFFECT_ID), 'the ice wears off');
  // Each summon waits before it can do it again.
  const again = live ?? m;
  again.hasHealth.hp = Math.round(again.hasHealth.maxHp * 0.1);
  updateSummonerArchetype(made.world, 100, 6_000);
  assert.ok(!getStatusEffect(again.tracksCombat, HIBERNATE_EFFECT_ID), 'not again so soon');
}
{
  const dot = (cs: Made['player']['tracksCombat']) => applyStatusEffect(cs, { id: 'poison', maxStacks: 5, remainingMs: 10_000, refreshable: true, sourceId: 'x', data: { damagePerStack: 10, isDot: 1, nextTickIn: 1_000, tickIntervalMs: 1_000, totalMs: 10_000 } });
  const made = field(['conduit-thrall'], { passives: { 'conduit.fireproof-pct': 0.5 } });
  dot(made.player.tracksCombat);
  dot(made.minions[0]!.tracksCombat);
  updateSummonerArchetype(made.world, 100, 2_000);
  assert.equal(getStatusEffect(made.player.tracksCombat, 'poison')!.data['damagePerStack'], 5, 'damage over time on you is halved');
  assert.equal(getStatusEffect(made.minions[0]!.tracksCombat, 'poison')!.data['damagePerStack'], 5, 'and on a summon');
  dot(made.player.tracksCombat);
  updateSummonerArchetype(made.world, 100, 2_100);
  assert.equal(getStatusEffect(made.player.tracksCombat, 'poison')!.data['damagePerStack'], 5, 'a fresh dose is halved too');
}
{
  const made = field(['conduit-thrall'], { passives: { 'conduit.emberglow-pct': 0.5 } });
  made.player.hasHealth.recovery = 100;
  made.minions[0]!.hasHealth.hp = 1;
  updateSummonerArchetype(made.world, 1_000, 2_000);
  assert.ok(made.minions[0]!.hasHealth.hp > 1, 'your Recovery also heals the summons near you');
}

// ── Specializations ───────────────────────────────────────────────────────────
{
  // Burn Bright: a fresh summon attacks faster for a while.
  const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', specialization: 'conduit-burn-bright' });
  updateSummonerArchetype(made.world, 100, 2_000);
  assert.ok(getStatusEffect(made.minions[0]!.tracksCombat, BURN_BRIGHT_EFFECT_ID), 'a new summon burns bright');
  const plain = field(['conduit-thrall'], { discipline: 'conduit-swarm' });
  assert.ok(minionAttackCooldown(made.minions[0]!) < minionAttackCooldown(plain.minions[0]!), 'and attacks faster');
}
{
  // Legion: more copies of one summon make them all stronger, at steps.
  const slotsFor = (copies: number) => {
    const { player } = setup(Array.from({ length: copies }, () => 'conduit-thrall'), { discipline: 'conduit-swarm', specialization: 'conduit-legion' });
    return summonerProfileFor(player).slots[0]!;
  };
  const three = slotsFor(3), four = slotsFor(4), eight = slotsFor(8);
  assert.equal(three.damageMult, slotsFor(2).damageMult, 'below the first step nothing changes');
  assert.ok(four.damageMult! > three.damageMult!, 'at four copies they hit harder');
  assert.ok(eight.damageMult! > four.damageMult!, 'at eight, harder still');
  assert.equal(slotsFor(5).damageMult, four.damageMult, 'between steps nothing changes: never a percentage per copy');
}
{
  // Infestation: hits infest, and an infested enemy that dies bursts.
  const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', specialization: 'conduit-infestation' });
  const target = monster(made.world, 430, 100_000);
  const near = monster(made.world, 470);
  hit(made, made.minions[0]!, target, 2_000);
  assert.ok(getStatusEffect(target.tracksCombat, 'conduit-poison') ?? target.tracksCombat.statusEffects.some((e) => e.id.includes('poison')), 'the hit infests');
  assert.ok(getFlag(target.tracksCombat, INFESTED_FLAG), 'it is marked infested');
  const wounded = near.hasHealth.hp;
  target.hasHealth.hp = 1;
  hit(made, made.minions[0]!, target, 4_000);
  assert.ok(target.hasHealth.hp <= 0, 'it dies');
  assert.ok(near.hasHealth.hp < wounded, 'and bursts on the enemies beside it');
}
{
  // Shield Wall: damage to a tank is split across your tanks.
  const solo = field(['conduit-plains-tank', 'conduit-thrall'], { discipline: 'conduit-pack', specialization: 'conduit-shield-wall' });
  const wall = field(['conduit-plains-tank', 'conduit-ironhorn', 'conduit-thrall'], { discipline: 'conduit-pack', specialization: 'conduit-shield-wall' });
  const strike = (made: Made, which: number) => {
    const mon = monster(made.world, 440);
    mon.dealsDamage.attack = 400;
    const tank = made.minions[which]!;
    tank.hasHealth.maxHp = 100_000;
    tank.hasHealth.hp = 100_000;
    const others = made.minions.filter((_, i) => i !== which).map((m) => m.hasHealth.hp);
    runMonsterAttackOnMinion(made.world, mon, tank, 9_000);
    return { tank: 100_000 - tank.hasHealth.hp, others: made.minions.filter((_, i) => i !== which).map((m, i) => others[i]! - m.hasHealth.hp) };
  };
  const alone = strike(solo, 0);
  const shared = strike(wall, 0);
  assert.ok(shared.tank < alone.tank, 'the struck tank carries less');
  assert.ok(shared.others[0]! > 0, 'the other tank pays its share');
  assert.equal(shared.others[1], 0, 'a thrall is not part of the wall');
}
{
  // The Hunt: each different damage summon that hit the enemy lately raises everyone's damage.
  const made = field(['conduit-forest-bruiser', 'conduit-mountain-marksman', 'conduit-thrall'], { discipline: 'conduit-pack', specialization: 'conduit-the-hunt' });
  const target = monster(made.world, 430);
  const alone = hit(made, made.minions[2]!, target, 2_000);
  hit(made, made.minions[0]!, target, 3_000);
  hit(made, made.minions[1]!, target, 3_500);
  assert.ok(getStatusEffect(target.tracksCombat, HUNT_EFFECT_ID), 'the hunt is on the enemy');
  const hunted = hit(made, made.minions[2]!, target, 4_000);
  assert.ok(hunted > alone * 1.1, `several kinds in the hunt raise everyone: ${alone} then ${hunted}`);
  const later = hit(made, made.minions[2]!, target, 20_000);
  assert.ok(later < hunted, 'and it fades');
}
{
  // Choir: a support's ability echoes through the other support types.
  const made = field(['conduit-sporecaller', 'conduit-bloomtender', 'conduit-thrall'], { discipline: 'conduit-pack', specialization: 'conduit-choir' });
  const plain = field(['conduit-sporecaller', 'conduit-bloomtender', 'conduit-thrall'], { discipline: 'conduit-pack' });
  const heal = (m: Made) => { m.player.hasHealth.hp = Math.round(m.player.hasHealth.maxHp * 0.4); const t = monster(m.world, 430); hit(m, m.minions[0]!, t, 2_000); return m.player.hasHealth.hp; };
  assert.ok(heal(made) > heal(plain), 'the Sporecaller\'s spores echo as the Bloomtender\'s heal');
}
{
  // Colossus: the double-down, in stats and in a shared shake.
  const base = field(['conduit-thrall', 'conduit-thrall'], { discipline: 'conduit-elite' });
  const big = field(['conduit-thrall', 'conduit-thrall'], { discipline: 'conduit-elite', specialization: 'conduit-colossus' });
  const a = summonerProfileFor(base.player).slots[0]!;
  const b = summonerProfileFor(big.player).slots[0]!;
  assert.ok(b.hpMult! > a.hpMult! && b.damageMult! > a.damageMult!, 'Colossus summons are bigger and hit harder');
  const target = monster(big.world, 430);
  const near = monster(big.world, 470);
  hit(big, big.minions[0]!, target, 2_000);
  assert.ok(near.hasHealth.hp < near.hasHealth.maxHp, 'their hits shake the ground');
  // The Command cost is one more than Elite's (the shared config check reads it with the specialization).
  assert.equal(disciplineCommandCost(1, 'conduit-elite', true), 2);
  assert.equal(disciplineCommandCost(1, 'conduit-elite', true, 'conduit-colossus'), 3);
  assert.equal(rosterCommand(['conduit-thrall', 'conduit-thrall'], 'conduit-elite', 'conduit-colossus'), 6);
}
{
  // Ascendant: the longer the fight, the harder they hit.
  const made = field(['conduit-thrall'], { discipline: 'conduit-elite', specialization: 'conduit-ascendant' });
  const target = monster(made.world, 430);
  fight(made, target, 2_000);
  const early = hit(made, made.minions[0]!, target, 2_500);
  fight(made, target, 40_000);
  const late = hit(made, made.minions[0]!, target, 41_000);
  assert.ok(late > early * 1.1, `a long fight hits harder: ${early} then ${late}`);
}

// ── Souls: the ranks, the two new lineages, Two Souls ─────────────────────────
{
  const rank = (cleared: string[]) => soulPower(setup(['conduit-thrall'], { relic: 'conduit-relic-mountain', cleared }).player);
  assert.ok(rank(['mountain:1', 'mountain:2', 'mountain:3']) > rank(['mountain:1', 'mountain:2']), 'the Mountain Soul ranks up at T3');
  const swamp = (cleared: string[]) => soulPower(setup(['conduit-thrall'], { relic: 'conduit-relic-swamp', cleared }).player);
  assert.ok(swamp(['swamp:1', 'swamp:2', 'swamp:3']) > swamp(['swamp:1', 'swamp:2']), 'the Swamp Soul reaches its last rank');
  const cave = (cleared: string[]) => soulPower(setup(['conduit-thrall'], { relic: 'conduit-relic-cave', cleared }).player);
  assert.ok(cave(['cave:1', 'cave:2', 'cave:3']) > cave(['cave:1', 'cave:2']), 'the Cave Soul reaches its last rank');
  for (const lineage of ['jungle', 'desert']) {
    const r = (cleared: string[]) => soulPower(setup(['conduit-thrall'], { relic: `conduit-relic-${lineage}`, cleared }).player);
    assert.ok(r([`${lineage}:2`, `${lineage}:3`]) > r([`${lineage}:2`]), `the ${lineage} Soul ranks up at T3`);
  }
}
{
  // Rime-Mammoth (Tundra): enemies near the Soul are chilled.
  const made = field(['conduit-thrall'], { relic: 'conduit-relic-tundra', cleared: ['tundra:3'] });
  const target = monster(made.world, 430);
  fight(made, target, 2_000);
  assert.ok(getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'enemies near the Tundra Soul are chilled');
  const bare = field(['conduit-thrall'], { relic: 'conduit-relic-plains', cleared: ['tundra:3'] });
  const t2 = monster(bare.world, 430);
  fight(bare, t2, 2_000);
  assert.ok(!getStatusEffect(t2.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'not without it');
}
{
  // Magma Salamander (Volcanic): the formation heats up over a fight.
  const made = field(['conduit-thrall'], { relic: 'conduit-relic-volcanic', cleared: ['volcanic:3'] });
  const plain = field(['conduit-thrall'], { relic: 'conduit-relic-plains', cleared: ['volcanic:3'] });
  const run = (m: Made) => {
    const target = monster(m.world, 430);
    fight(m, target, 2_000);
    const early = hit(m, m.minions[0]!, target, 2_500);
    fight(m, target, 32_000);
    return { early, late: hit(m, m.minions[0]!, target, 32_500) };
  };
  const hot = run(made);
  const cold = run(plain);
  assert.ok(hot.late / hot.early > cold.late / cold.early * 1.1, 'the Volcanic Soul heats the formation up over a fight');
}
{
  // Two Souls: a second Soul joins and the two strengthen each other.
  const cleared = ['plains:1', 'swamp:1'];
  const one = setup(['conduit-thrall'], { relic: 'conduit-relic-swamp', cleared });
  const two = setup(['conduit-thrall'], { relic: 'conduit-relic-swamp', cleared, discipline: 'conduit-elite', specialization: 'conduit-two-souls' });
  assert.equal(soulsOf(one.player).length, 1);
  assert.equal(soulsOf(two.player).length, 2, 'a second Soul is fielded');
  assert.ok(soulPower(two.player) > soulPower(one.player), 'and each is stronger beside the other');
  assert.equal(summonerProfileFor(two.player).slots.length, 3, 'the Soul slots join the roster');
}

// ── Gear: no T3 or T4 copy of a built job is dead ─────────────────────────────
{
  for (const id of ['conduit-first-strike-t3', 'conduit-first-strike-t4', 'conduit-longshot-t3', 'conduit-longshot-t4', 'conduit-icebound-t3', 'conduit-icebound-t4', 'conduit-berserk-t3', 'conduit-berserk-t4', 'conduit-swift-staff-t3', 'conduit-swarm-staff-t3', 'conduit-swarm-staff-t4']) {
    const effects = ITEM_DATABASE.get(id)?.mechanicEffects ?? {};
    assert.ok(Object.keys(effects).length > 0, `${id} does something`);
  }
  assert.equal(ITEM_DATABASE.get('conduit-icebound-t3')?.mechanicEffects?.['conduit.icebound-pct'], 0.5);
  assert.equal(ITEM_DATABASE.get('conduit-berserk-t3')?.mechanicEffects?.['conduit.berserk-pct'], 0.5);
  for (const [id, key] of [
    ['jungle-vest-t3', 'conduit.sentinel'], ['jungle-charm-t4', 'conduit.bloomlink-pct'], ['desert-vest-t3', 'conduit.sandveil-pct'], ['desert-charm-t4', 'conduit.purge-ms'],
    ['tundra-vest-t3', 'conduit.permafrost'], ['tundra-charm-t3', 'conduit.hibernate-ms'], ['volcanic-vest-t3', 'conduit.fireproof-pct'], ['volcanic-charm-t4', 'conduit.emberglow-pct'],
  ] as const) {
    const lined = classLineFor(ITEM_DATABASE.get(id), 'summoner');
    assert.ok((lined?.effects[key] ?? 0) > 0, `${id} carries ${key}`);
  }
  // The jobs that moved when the Plains and Forest retired ride the receiving biome's second base.
  for (const [id, key] of [
    ['jungle-vest-t3-b', 'conduit.thorns'], ['jungle-charm-t3-b', 'conduit.sapbark-ms'], ['volcanic-vest-t3-b', 'conduit.plating-share'], ['volcanic-charm-t4-b', 'conduit.herd-pct'],
  ] as const) {
    const lined = classLineFor(ITEM_DATABASE.get(id), 'summoner');
    assert.ok((lined?.effects[key] ?? 0) > 0, `${id} carries ${key}`);
  }
  // An equipped T3 weapon reaches the passives through the ordinary path.
  const { world, player } = field(['conduit-thrall']);
  player.holdsInventory.inventory.push('conduit-icebound-t3');
  assert.ok(equipItem(world, player, 'conduit-icebound-t3'), 'equip Icebound');
  assert.equal(player.usesSkills.passives['conduit.icebound-pct'], 0.5);
}

void SPEC;
void getResource;
console.log('conduitT3: ok');
