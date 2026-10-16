/**
 * The Conduit's tier 2 at runtime (T2-CONDUIT; bible §7.5, §7.8, §7.9, §7.16): the seven T2
 * summon types, the three disciplines, the Soul ranks and the two new Souls, and the T2 gear
 * lines. Wiring only: attach, tick, assert observable state. No balance numbers.
 */
import assert from 'node:assert/strict';
import {
  CONDUIT_DISCIPLINE_TUNING,
  CONDUIT_KIT,
  classConfigContextFromState,
  classLineFor,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  ITEM_DATABASE,
  applyStatusEffect,
  rosterCommand,
  validateClassConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { computeMinionSpeed } from '../src/systems/classes/archetypes/summoner/spawn';
import { computeLeashRadius } from '../src/systems/classes/archetypes/summoner/ai';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { BARK_EFFECT_ID, firePackStrike, MARK_EFFECT_ID } from '../src/systems/classes/archetypes/summoner/summonPiecesT2';
import { soulPower } from '../src/systems/classes/archetypes/summoner/souls';
import { runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { isMonsterStunned, STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { World } from '../src/world/World';

initCombatSystems();
const BIOMES = { plains: 12, forest: 12, swamp: 12, mountain: 12, cave: 12, jungle: 6, desert: 6 };

function setup(roster: string[], opts: { relic?: string; discipline?: string; cleared?: string[] } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'conduit', name: 'Conduit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 2, currentSkillTier: 0, bossesCleared: opts.cleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
      disciplineId: opts.discipline ?? null,
    },
  } as unknown as PersistedPlayerSlices, 'conduit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
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

function field(roster: string[], opts: Parameters<typeof setup>[1] = {}) {
  const made = setup(roster, opts);
  updateSummonerArchetype(made.world, 100, 1_000);
  updateSummonerArchetype(made.world, 100, 1_100);
  const minions = made.player.summonsMinions!.minionIds.map((id) => made.world.getMinionEntity(id)!);
  assert.ok(minions.every(Boolean), 'every slot is fielded');
  return { ...made, minions };
}

function monster(world: World, x: number, hp = 1_000_000) {
  const m = world.createMonster('node-5-5', 'bone-crawler', { x, y: 400 })!;
  m.hasHealth.hp = m.hasHealth.maxHp = hp;
  m.mitigatesDamage.plating = 0;
  m.mitigatesDamage.damageReduction = 0;
  m.dealsDamage.attack = 5;
  return m;
}

const hit = (world: World, player: ReturnType<typeof setup>['player'], minion: Parameters<typeof runFormationAttack>[2], target: ReturnType<typeof monster>, now: number) => {
  const before = target.hasHealth.hp;
  runFormationAttack(world, player, minion, target, now);
  return before - target.hasHealth.hp;
};

// ── Lessons: every T2 piece is bound by its zone, and has a job to do ─────────
{
  const t2 = ['conduit-ironhorn', 'conduit-barkward', 'conduit-rockhurler', 'conduit-bog-leech', 'conduit-bonecrusher', 'conduit-bloomtender', 'conduit-executioner'];
  const ctx = classConfigContextFromState({ combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null })!;
  for (const id of t2) assert.ok(ctx.pieceRanks.has(id), `${id} is bound at T2`);
  // The whole T2 roster can be fielded: bodies follow the roster, one slot each.
  const { player } = field([...t2]);
  assert.equal(summonerProfileFor(player).slots.length, t2.length);
}

// ── Ironhorn: a charge that hits it stops dead and the charger is stunned ─────
{
  const { world, player, minions } = field(['conduit-ironhorn', 'conduit-thrall']);
  const charger = monster(world, 440);
  charger.controlsMonster.chargeRemainingMs = 800;
  runMonsterAttackOnMinion(world, charger, minions[0]!, 5_000);
  assert.equal(charger.controlsMonster.chargeRemainingMs, 0, 'the charge stops dead');
  assert.ok(isMonsterStunned(world, charger.isMonster.id), 'the charger is stunned');
  // A thrall takes the same charge without the stun.
  const other = monster(world, 440);
  other.controlsMonster.chargeRemainingMs = 800;
  runMonsterAttackOnMinion(world, other, minions[1]!, 5_000);
  assert.ok(!isMonsterStunned(world, other.isMonster.id), 'only Ironhorn braces');
  // And it taunts like a tank.
  const target = monster(world, 430);
  runFormationAttack(world, player, minions[0]!, target, 6_000);
  assert.ok(target.heldByTaunt, 'the tank holds the enemies around it');
}

// ── Barkward: the bark takes the next control off a summon ────────────────────
{
  const { world, player, minions } = field(['conduit-barkward', 'conduit-thrall']);
  updateSummonerArchetype(world, 100, 20_000);
  const coated = minions.find((m) => getStatusEffect(m.tracksCombat, BARK_EFFECT_ID));
  assert.ok(coated, 'a summon is coated in bark');
  applyStatusEffect(coated!.tracksCombat, { id: STUN_EFFECT, maxStacks: 1, remainingMs: 2_000, refreshable: true, sourceId: 'x', data: { totalMs: 2_000 } });
  updateSummonerArchetype(world, 100, 20_100);
  assert.ok(!getStatusEffect(coated!.tracksCombat, STUN_EFFECT), 'the stun is absorbed');
  assert.ok(!getStatusEffect(coated!.tracksCombat, BARK_EFFECT_ID), 'and the bark is spent');
  // While it holds, it takes part of a hit back.
  const mon = monster(world, 440);
  mon.dealsDamage.attack = 100;
  const again = minions.find((m) => m !== coated) ?? coated!;
  applyStatusEffect(again.tracksCombat, { id: BARK_EFFECT_ID, maxStacks: 1, remainingMs: 5_000, refreshable: true, sourceId: 'x', data: { absorbPct: 0.5 } });
  const full = again.hasHealth.maxHp = 10_000;
  again.hasHealth.hp = full;
  runMonsterAttackOnMinion(world, mon, again, 30_000);
  const withBark = full - again.hasHealth.hp;
  again.hasHealth.hp = full;
  removeBark(again);
  runMonsterAttackOnMinion(world, mon, again, 31_000);
  assert.ok(withBark < full - again.hasHealth.hp, 'bark softens the hit');
  void player;
}
function removeBark(minion: { tracksCombat: { statusEffects: { id: string }[] } }) {
  minion.tracksCombat.statusEffects = minion.tracksCombat.statusEffects.filter((e) => e.id !== BARK_EFFECT_ID);
}

// ── Rockhurler: the boulder hits an area ──────────────────────────────────────
{
  const { world, player, minions } = field(['conduit-rockhurler']);
  const target = monster(world, 430);
  const near = monster(world, 460);
  const far = monster(world, 700);
  const dealt = hit(world, player, minions[0]!, target, 2_000);
  assert.ok(dealt > 0);
  assert.ok(near.hasHealth.hp < near.hasHealth.maxHp, 'a neighbour is caught in the area');
  assert.equal(far.hasHealth.hp, far.hasHealth.maxHp, 'a far enemy is not');
}

// ── Bog Leech: what it drains goes to the most hurt summon ────────────────────
{
  const { world, player, minions } = field(['conduit-bog-leech', 'conduit-thrall']);
  const target = monster(world, 430);
  minions[1]!.hasHealth.hp = Math.round(minions[1]!.hasHealth.maxHp * 0.3);
  const before = minions[1]!.hasHealth.hp;
  hit(world, player, minions[0]!, target, 2_000);
  assert.ok(minions[1]!.hasHealth.hp > before, 'the drain mends the most hurt summon');
}

// ── Bonecrusher: its blows scale off its own max HP ───────────────────────────
{
  const { world, player, minions } = field(['conduit-bonecrusher']);
  const target = monster(world, 430);
  const low = hit(world, player, minions[0]!, target, 2_000);
  minions[0]!.hasHealth.maxHp *= 4;
  const high = hit(world, player, minions[0]!, target, 4_000);
  assert.ok(high > low, `more max HP, harder blows: ${low} then ${high}`);
}

// ── Bloomtender: heals the most hurt ally, the Conduit included; Bloomlink shares it ──
{
  const { world, player, minions } = field(['conduit-bloomtender', 'conduit-thrall']);
  const target = monster(world, 430);
  const low = Math.round(player.hasHealth.maxHp * 0.4);
  player.hasHealth.hp = low;
  hit(world, player, minions[0]!, target, 2_000);
  assert.ok(player.hasHealth.hp > low, 'the Conduit is the most hurt ally and is healed');
  minions[1]!.hasHealth.hp = Math.round(minions[1]!.hasHealth.maxHp * 0.1);
  player.hasHealth.hp = low;
  const hurt = minions[1]!.hasHealth.hp;
  hit(world, player, minions[0]!, target, 4_000);
  assert.ok(minions[1]!.hasHealth.hp > hurt, 'a summon that is more hurt is healed first');
  assert.equal(player.hasHealth.hp, low, 'without Bloomlink the Conduit gets nothing');
  player.usesSkills.passives['conduit.bloomlink-pct'] = 0.5;
  minions[1]!.hasHealth.hp = Math.round(minions[1]!.hasHealth.maxHp * 0.1);
  hit(world, player, minions[0]!, target, 6_000);
  assert.ok(player.hasHealth.hp > low, 'Bloomlink: the heal also heals you');
}

// ── Executioner: marks, then hits harder below the threshold ──────────────────
{
  const { world, player, minions } = field(['conduit-executioner']);
  const healthy = monster(world, 430);
  const wounded = monster(world, 460);
  wounded.hasHealth.hp = Math.round(wounded.hasHealth.maxHp * 0.2);
  hit(world, player, minions[0]!, healthy, 2_000);
  assert.ok(getStatusEffect(healthy.tracksCombat, MARK_EFFECT_ID), 'its hit marks the target');
  const normal = hit(world, player, minions[0]!, healthy, 4_000);
  hit(world, player, minions[0]!, wounded, 6_000);
  wounded.hasHealth.hp = Math.round(wounded.hasHealth.maxHp * 0.2);
  const execute = hit(world, player, minions[0]!, wounded, 8_000);
  assert.ok(execute > normal * 1.5, `a shot at a badly hurt marked enemy hits much harder: ${normal} then ${execute}`);
}

// ── Disciplines: Command, bulk, rebuilds, Pack Strike ────────────────────────
{
  const heavy = ['conduit-cave-heavy', 'conduit-cave-heavy'];
  const thralls = ['conduit-thrall', 'conduit-thrall'];
  assert.equal(rosterCommand(thralls), 2);
  assert.equal(rosterCommand(thralls, 'conduit-swarm'), 1, 'Swarm: 1-cost summons cost half');
  assert.equal(rosterCommand(heavy, 'conduit-swarm'), 4, 'Swarm leaves bigger summons alone');
  assert.equal(rosterCommand(heavy, 'conduit-pack'), 3, 'Pack: the first of a type costs 1 less');
  assert.equal(rosterCommand(['conduit-thrall'], 'conduit-pack'), 1, 'Pack never goes below 1');
  assert.equal(rosterCommand(thralls, 'conduit-elite'), 4, 'Elite: every summon costs 1 more');

  // The check uses the discipline: six Thralls fit a Command-6 formation, but not under Elite.
  const six = Array.from({ length: 6 }, () => 'conduit-thrall');
  const ctxFor = (disciplineId: string | null) => classConfigContextFromState({ combatArchetype: 'summoner', biomeLevel: { plains: 0 }, bossesCleared: [], disciplineId })!;
  const base = defaultClassConfig(ctxFor(null));
  const withRoster = (roster: string[]) => ({ ...base, system: { ...base.system, roster } });
  const ctx = ctxFor('conduit-elite');
  assert.ok(ctx.budget < 8);
  const swarmCtx = ctxFor('conduit-swarm');
  assert.equal(validateClassConfig(withRoster(six), swarmCtx).ok, true, 'Swarm fields them all');
  assert.equal(validateClassConfig(withRoster(six), ctx).ok, false, 'Elite does not');
  assert.ok(defaultClassConfig(swarmCtx).system.kind === 'formation');
  const swarmDefault = defaultClassConfig(swarmCtx).system;
  const eliteDefault = defaultClassConfig(ctx).system;
  if (swarmDefault.kind === 'formation' && eliteDefault.kind === 'formation') {
    assert.ok(swarmDefault.roster.length > eliteDefault.roster.length, 'the Swarm default fields more bodies');
    assert.ok(rosterCommand(swarmDefault.roster, 'conduit-swarm') <= swarmCtx.budget);
    assert.ok(rosterCommand(eliteDefault.roster, 'conduit-elite') <= ctx.budget);
  }
}
{
  // Elite: tougher, harder-hitting, and an area extra.
  const plain = field(['conduit-thrall', 'conduit-thrall']);
  const elite = field(['conduit-thrall', 'conduit-thrall'], { discipline: 'conduit-elite' });
  const a = summonerProfileFor(plain.player).slots[0]!;
  const b = summonerProfileFor(elite.player).slots[0]!;
  assert.equal(b.hpMult! / a.hpMult!, CONDUIT_DISCIPLINE_TUNING.eliteHpMult);
  assert.equal(b.damageMult! / a.damageMult!, CONDUIT_DISCIPLINE_TUNING.eliteDamageMult);
  const target = monster(elite.world, 430);
  const near = monster(elite.world, 470);
  hit(elite.world, elite.player, elite.minions[0]!, target, 2_000);
  assert.ok(near.hasHealth.hp < near.hasHealth.maxHp, 'Elite: a hit splashes');
  const target2 = monster(plain.world, 430);
  const near2 = monster(plain.world, 470);
  hit(plain.world, plain.player, plain.minions[0]!, target2, 2_000);
  assert.equal(near2.hasHealth.hp, near2.hasHealth.maxHp, 'no splash without Elite');
}
{
  // Swarm: a 1-cost summon rebuilds for free; a plain Conduit pays HP.
  const run = (discipline?: string) => {
    const { world, player, minions } = field(['conduit-thrall', 'conduit-thrall'], { discipline });
    minions[0]!.hasHealth.hp = 0;
    player.hasHealth.hp = 1000;
    updateSummonerArchetype(world, 100, 2_000);
    updateSummonerArchetype(world, 5_000, 8_000);
    updateSummonerArchetype(world, 100, 8_100);
    assert.ok(world.getMinionEntity(player.summonsMinions!.minionIds[0]!), 'the fallen summon is rebuilt');
    return player.hasHealth.hp;
  };
  assert.ok(run() < 1000, 'a rebuild costs the Conduit HP');
  assert.equal(run('conduit-swarm'), 1000, 'Swarm rebuilds for free');
}
{
  // Pack Strike: every different kind uses its ability together, on a timer.
  const { world, player, minions } = field(['conduit-plains-tank', 'conduit-forest-bruiser', 'conduit-forest-bruiser', 'conduit-swamp-spitter'], { discipline: 'conduit-pack' });
  const target = monster(world, 430);
  player.summonsMinions!.formationTargetId = target.isMonster.id;
  assert.equal(firePackStrike(world, player, 3_000), 3, 'one strike per kind, not per body');
  assert.ok(target.hasHealth.hp < target.hasHealth.maxHp);
  assert.ok(target.heldByTaunt, "the tank's ability fired");
  assert.ok(getStatusEffect(target.tracksCombat, 'plating-shred'), "the spitter's ability fired");
  // On the tick it fires again only when the timer is up.
  const nextAt = () => getResource(player.tracksCombat, 'pack.nextStrikeAt');
  assert.equal(nextAt(), 3_000 + CONDUIT_DISCIPLINE_TUNING.packStrikeEveryMs, 'the timer restarts');
  updateSummonerArchetype(world, 100, 3_100);
  assert.equal(nextAt(), 3_000 + CONDUIT_DISCIPLINE_TUNING.packStrikeEveryMs, 'not before the timer');
  const due = 3_100 + CONDUIT_DISCIPLINE_TUNING.packStrikeEveryMs;
  updateSummonerArchetype(world, 100, due);
  assert.equal(nextAt(), due + CONDUIT_DISCIPLINE_TUNING.packStrikeEveryMs, 'the timer fires it');
  void minions;
}

// ── Souls: ranks and the two new lineages ─────────────────────────────────────
{
  const rank1 = setup(['conduit-thrall'], { relic: 'conduit-relic-plains', cleared: ['plains:1'] });
  const rank2 = setup(['conduit-thrall'], { relic: 'conduit-relic-plains', cleared: ['plains:1', 'plains:2'] });
  assert.equal(soulPower(rank1.player), 1);
  assert.ok(soulPower(rank2.player) > 1, 'a ranked-up Soul is stronger');
  const soulSlot = (p: ReturnType<typeof setup>['player']) => summonerProfileFor(p).slots.find((s) => s.slotId.startsWith('conduit-relic-plains'))!;
  assert.ok(soulSlot(rank2.player).hpMult! > soulSlot(rank1.player).hpMult!, 'its body grows with the rank');
}
{
  // Dread-Gorger: the formation moves faster and its leash holds a fleeing target.
  const plain = setup(['conduit-thrall'], { relic: 'conduit-relic-plains', cleared: ['jungle:2'] });
  const gorger = setup(['conduit-thrall'], { relic: 'conduit-relic-jungle', cleared: ['jungle:2'] });
  assert.ok(computeMinionSpeed(gorger.player) > computeMinionSpeed(plain.player), 'faster');
  assert.ok(computeLeashRadius(gorger.player) > computeLeashRadius(plain.player), 'never loses a fleeing target');
}
{
  // Dune-Stalker: each different kind of summon that hits the marked enemy adds a stack.
  const { world, player, minions } = field(['conduit-executioner', 'conduit-thrall', 'conduit-plains-tank'], { relic: 'conduit-relic-desert', cleared: ['desert:2'] });
  const target = monster(world, 430);
  hit(world, player, minions[0]!, target, 2_000);
  assert.ok(getStatusEffect(target.tracksCombat, MARK_EFFECT_ID), 'marked');
  hit(world, player, minions[1]!, target, 3_000);
  hit(world, player, minions[2]!, target, 4_000);
  const mask = getStatusEffect(target.tracksCombat, MARK_EFFECT_ID)!.data['typeMask']!;
  assert.ok(mask > 0 && (mask & (mask - 1)) !== 0, 'several different kinds are recorded');
  // The same hit with no Soul lands softer.
  const bare = field(['conduit-executioner', 'conduit-thrall', 'conduit-plains-tank'], { relic: 'conduit-relic-plains', cleared: ['desert:2'] });
  const t2 = monster(bare.world, 430);
  hit(bare.world, bare.player, bare.minions[0]!, t2, 2_000);
  hit(bare.world, bare.player, bare.minions[1]!, t2, 3_000);
  hit(bare.world, bare.player, bare.minions[2]!, t2, 4_000);
  const late = hit(world, player, minions[1]!, target, 5_000);
  const lateBare = hit(bare.world, bare.player, bare.minions[1]!, t2, 5_000);
  assert.ok(late > lateBare, `stacks make the formation hit the marked enemy harder: ${lateBare} then ${late}`);
}

// ── Gear: the weapons and the lines ───────────────────────────────────────────
{
  assert.equal(ITEM_DATABASE.get('conduit-first-strike-t2')?.mechanicEffects?.['conduit.first-strike-pct'], 1);
  assert.equal(ITEM_DATABASE.get('conduit-longshot-t2')?.mechanicEffects?.['conduit.longshot-pct'], 0.25);

  // The T2 lines reach the passives through the ordinary class-line path.
  for (const [id, key] of [['jungle-vest-t2', 'conduit.sentinel'], ['jungle-charm-t2', 'conduit.bloomlink-pct'], ['desert-vest-t2', 'conduit.sandveil-pct'], ['desert-charm-t2', 'conduit.purge-ms']] as const) {
    const lined = classLineFor(ITEM_DATABASE.get(id), 'summoner');
    assert.ok((lined?.effects[key] ?? 0) > 0, `${id} carries ${key}`);
  }

  // First Strike: a summon's first hit on a new target hits much harder.
  const { world, player, minions } = field(['conduit-thrall']);
  player.holdsInventory.inventory.push('conduit-first-strike-t2');
  assert.ok(equipItem(world, player, 'conduit-first-strike-t2'), 'equip First Strike');
  assert.equal(player.usesSkills.passives['conduit.first-strike-pct'], 1);
  const a = monster(world, 430);
  const b = monster(world, 440);
  const first = hit(world, player, minions[0]!, a, 2_000);
  const second = hit(world, player, minions[0]!, a, 4_000);
  const fresh = hit(world, player, minions[0]!, b, 6_000);
  assert.ok(first > second * 1.5 && fresh > second * 1.5, `first hits are heavier: ${first}, ${second}, ${fresh}`);
}
{
  // Longshot: ranged summons reach further and hit harder; melee summons hit softer.
  const plain = field(['conduit-thrall', 'conduit-mountain-marksman']);
  const long = setup(['conduit-thrall', 'conduit-mountain-marksman']);
  long.player.usesSkills.passives['conduit.longshot-pct'] = 0.25;
  updateSummonerArchetype(long.world, 100, 1_000);
  updateSummonerArchetype(long.world, 100, 1_100);
  const slotsPlain = summonerProfileFor(plain.player).slots;
  const slotsLong = summonerProfileFor(long.player).slots;
  assert.ok(slotsLong[1]!.damageMult! > slotsPlain[1]!.damageMult!, 'ranged hits harder');
  assert.ok(slotsLong[0]!.damageMult! < slotsPlain[0]!.damageMult!, 'melee hits softer');
  const minions = long.player.summonsMinions!.minionIds.map((id) => long.world.getMinionEntity(id)!);
  const plainMinions = plain.minions;
  assert.ok(minions[1]!.performsAttack.attackRange > plainMinions[1]!.performsAttack.attackRange, 'ranged fires from further back');
  assert.equal(minions[0]!.performsAttack.attackRange, plainMinions[0]!.performsAttack.attackRange, 'melee reach is unchanged');
}
{
  // Sentinel: the first hit each enemy lands on you is taken by the nearest summon.
  const { world, player, minions } = field(['conduit-plains-tank', 'conduit-thrall']);
  const mon = monster(world, 460);
  const hitMe = (damage: number) => {
    const ctx = makeCombatContext(mon, 'monster', player, 'player');
    ctx.damage = damage;
    emitCombatEvent('onDamageTaken', ctx, world);
    return ctx.damage;
  };
  assert.equal(hitMe(10), 10, 'nothing happens without the vest');
  player.usesSkills.passives['conduit.sentinel'] = 1;
  const hpBefore = minions.map((m) => m.hasHealth.hp);
  assert.equal(hitMe(10), 0, 'the first hit is taken by a summon');
  assert.ok(minions.some((m, i) => m.hasHealth.hp < hpBefore[i]!), 'a summon paid for it');
  assert.equal(hitMe(10), 10, 'the second hit lands on you');
  const other = monster(world, 470);
  const ctx = makeCombatContext(other, 'monster', player, 'player');
  ctx.damage = 10;
  emitCombatEvent('onDamageTaken', ctx, world);
  assert.equal(ctx.damage, 0, 'each enemy gets its own first hit covered');
}
{
  // Sandveil: ranged hits deal less to you and your summons.
  const { world, player, minions } = field(['conduit-thrall']);
  const archer = monster(world, 460);
  archer.performsAttack.attackRange = 300;
  archer.dealsDamage.attack = 100;
  const melee = monster(world, 460);
  melee.performsAttack.attackRange = 20;
  const taken = (from: typeof archer) => {
    const ctx = makeCombatContext(from, 'monster', player, 'player');
    ctx.damage = 100;
    emitCombatEvent('onDamageTaken', ctx, world);
    return ctx.damage;
  };
  assert.equal(taken(archer), 100);
  player.usesSkills.passives['conduit.sandveil-pct'] = 0.3;
  assert.equal(taken(archer), 70, 'a ranged hit is softer');
  assert.equal(taken(melee), 100, 'a melee hit is not');
  // A summon is covered too.
  const m = minions[0]!;
  // A deep pool, so neither hit kills it (a one-body formation is small since OV-CONDUIT's Command scaling).
  const lost = (from: typeof archer) => { m.hasHealth.maxHp = 10_000; const full = m.hasHealth.maxHp; m.hasHealth.hp = full; runMonsterAttackOnMinion(world, from, m, 9_000); return full - m.hasHealth.hp; };
  const veiled = lost(archer);
  player.usesSkills.passives['conduit.sandveil-pct'] = 0;
  assert.ok(veiled < lost(archer), 'Sandveil softens a ranged hit on a summon');
}
{
  // Purge: every few seconds the most debuffed body loses one debuff.
  const { world, player, minions } = field(['conduit-thrall', 'conduit-thrall']);
  const poison = (cs: (typeof minions)[0]['tracksCombat']) => applyStatusEffect(cs, { id: 'slow', maxStacks: 1, remainingMs: 60_000, refreshable: true, sourceId: 'x', data: { speedMult: 0.5, totalMs: 60_000 } });
  poison(minions[0]!.tracksCombat);
  player.usesSkills.passives['conduit.purge-ms'] = 5_000;
  updateSummonerArchetype(world, 100, 2_000);
  assert.ok(!getStatusEffect(minions[0]!.tracksCombat, 'slow'), 'the debuffed summon is purged');
  poison(minions[1]!.tracksCombat);
  updateSummonerArchetype(world, 100, 2_100);
  assert.ok(getStatusEffect(minions[1]!.tracksCombat, 'slow'), 'not before the next beat');
  updateSummonerArchetype(world, 100, 7_200);
  assert.ok(!getStatusEffect(minions[1]!.tracksCombat, 'slow'), 'the next beat purges again');
}

void CONDUIT_KIT;
console.log('conduitT2: ok');
