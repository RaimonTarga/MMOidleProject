/**
 * The Conduit's tier 4 at runtime (T4-CONDUIT; bible §7.7, §7.8, §7.16): the seven T4 summon types,
 * the nine leaves, the two new Souls and the last ranks, and the T4 gear lines.
 * Wiring only: attach, tick, assert observable state. No balance numbers.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  ABILITY_SLOW_EFFECT_ID,
  CONDUIT_KIT,
  classConfigContextFromState,
  classLineFor,
  defaultClassConfig,
  emptyEquipment,
  getStatusEffect,
  ITEM_DATABASE,
  STUN_STATUS_ID,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { fallBackSpot } from '../src/systems/classes/archetypes/summoner/leavesT4';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { soulPower } from '../src/systems/classes/archetypes/summoner/souls';
import { firePackStrike } from '../src/systems/classes/archetypes/summoner/summonPiecesT2';
import { huskCount } from '../src/systems/classes/archetypes/summoner/husks';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { FALL_BACK_EFFECT_ID, ICE_SHELL_EFFECT_ID, LAST_STAND_EFFECT_ID, SEAL_EFFECT_ID, WITHDRAW_EFFECT_ID } from '../src/systems/classes/archetypes/summoner/t4Shared';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const BIOMES = { plains: 12, forest: 12, swamp: 18, mountain: 24, cave: 18, jungle: 18, desert: 18, tundra: 12, volcanic: 12, graveyard: 6, trench: 6 };

interface Opts { relic?: string; discipline?: string; specialization?: string; leaves?: string[]; cleared?: string[]; passives?: Record<string, number> }

function setup(roster: string[], opts: Opts = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'conduit', name: 'Conduit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 4, currentSkillTier: 0, bossesCleared: opts.cleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root', ...(opts.leaves ?? [])], passives: {}, selectedClass: 'summoner-root',
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
type Mon = ReturnType<typeof monster>;
const hit = (made: Pick<Made, 'world' | 'player'>, minion: Made['minions'][number], target: Mon, now: number) => {
  const before = target.hasHealth.hp;
  runFormationAttack(made.world, made.player, minion, target, now);
  return before - target.hasHealth.hp;
};
function fight(made: Pick<Made, 'world' | 'player'>, target: Mon, now: number) {
  made.player.summonsMinions!.formationTargetId = target.isMonster.id;
  updateSummonerArchetype(made.world, 100, now);
}
const dot = (cs: TracksCombat, id = 'poison') => applyStatusEffect(cs, { id, maxStacks: 5, remainingMs: 60_000, refreshable: true, sourceId: 'x', data: { damagePerStack: 10, isDot: 1, nextTickIn: 1_000, tickIntervalMs: 1_000, totalMs: 60_000 } });
const at = (minion: Made['minions'][number], dx: number, dy = 0) => ({ x: Math.round(minion.hasPosition.current.x + dx), y: Math.round(minion.hasPosition.current.y + dy) });
const monsterAt = (made: Pick<Made, 'world'>, minion: Made['minions'][number], dx: number, dy = 0, hp = 1_000_000) => {
  const p = at(minion, dx, dy);
  return monster(made.world, p.x, hp, p.y);
};
const lostBy = (made: Pick<Made, 'world'>, minion: Made['minions'][number], attack: number, now: number) => {
  const mon = monster(made.world, 440);
  mon.dealsDamage.attack = attack;
  minion.hasHealth.maxHp = minion.hasHealth.hp = 10_000;
  runMonsterAttackOnMinion(made.world, mon, minion, now);
  return 10_000 - minion.hasHealth.hp;
};

// ── Lessons: every T4 piece is bound by its zone, and has a job to do ─────────
const T4 = ['conduit-avalanche', 'conduit-icewarden', 'conduit-dartcaller', 'conduit-mirage', 'conduit-obsidian-tortoise', 'conduit-gravecaller', 'conduit-abyssal-warden'];
{
  const ctx = classConfigContextFromState({ combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null })!;
  for (const id of T4) assert.ok(ctx.pieceRanks.has(id), `${id} is bound at T4`);
  for (const id of T4) assert.ok(Object.keys(CONDUIT_KIT.pieces.find((p) => p.id === id)!.params).length > 0, `${id} has a job`);
  const { player } = field(T4.filter((id) => id !== 'conduit-avalanche'));
  assert.equal(player.summonsMinions!.minionIds.filter(Boolean).length, T4.length - 1, 'the T4 roster can be fielded');
}

// ── Avalanche: it charges through a line of enemies and knocks them down ─────
{
  const made = field(['conduit-avalanche']);
  const me = made.minions[0]!;
  const target = monsterAt(made, me, 30);
  const inLine = monsterAt(made, me, 150);
  const aside = monsterAt(made, me, 40, 200);
  hit(made, me, target, 2_000);
  assert.ok(inLine.hasHealth.hp < inLine.hasHealth.maxHp, 'an enemy further down the line is struck');
  assert.ok(getStatusEffect(inLine.tracksCombat, STUN_STATUS_ID), 'and knocked down');
  assert.equal(aside.hasHealth.hp, aside.hasHealth.maxHp, 'one beside the line is not');
}

// ── Icewarden: an ice shell on the most hurt summon absorbs damage ───────────
{
  const made = field(['conduit-icewarden', 'conduit-thrall']);
  const thrall = made.minions[1]!;
  thrall.hasHealth.hp = Math.round(thrall.hasHealth.maxHp * 0.5);
  fight(made, monster(made.world, 430), 2_000);
  assert.ok(getStatusEffect(thrall.tracksCombat, ICE_SHELL_EFFECT_ID), 'the most hurt summon is shelled');
  const shelled = lostBy(made, thrall, 200, 2_100);
  thrall.tracksCombat.statusEffects = thrall.tracksCombat.statusEffects.filter((e) => e.id !== ICE_SHELL_EFFECT_ID);
  const bare = lostBy(made, thrall, 200, 2_200);
  assert.ok(shelled < bare, `the shell soaks the hit: ${shelled} vs ${bare}`);
}

// ── Dartcaller: poison darts that ricochet to a second enemy ─────────────────
{
  const made = field(['conduit-dartcaller']);
  const me = made.minions[0]!;
  const a = monsterAt(made, me, 30);
  const b = monsterAt(made, me, 110);
  hit(made, me, a, 2_000);
  assert.ok(a.tracksCombat.statusEffects.some((e) => e.id.includes('poison')), 'the dart poisons its target');
  assert.ok(b.hasHealth.hp < b.hasHealth.maxHp, 'and ricochets to a second enemy');
  assert.ok(b.tracksCombat.statusEffects.some((e) => e.id.includes('poison')), 'poisoning it too');
}

// ── Mirage: bosses that go for you chase the copy ─────────────────────────────
{
  const made = field(['conduit-mirage', 'conduit-thrall']);
  const boss = monster(made.world, 430);
  setAggroTarget(made.world, boss, { id: made.player.isPlayer.id, kind: 'player' }, 1_500);
  fight(made, boss, 2_000);
  assert.equal(boss.hasAggroTarget?.targetId, made.minions[0]!.isMinion.id, 'the enemy that was after you chases the Mirage');
}

// ── Obsidian Tortoise: it withdraws into its shell ────────────────────────────
{
  const made = field(['conduit-obsidian-tortoise']);
  fight(made, monster(made.world, 430), 2_000);
  const tortoise = made.minions[0]!;
  assert.ok(getStatusEffect(tortoise.tracksCombat, WITHDRAW_EFFECT_ID), 'it withdraws');
  const shut = lostBy(made, tortoise, 300, 2_100);
  tortoise.tracksCombat.statusEffects = tortoise.tracksCombat.statusEffects.filter((e) => e.id !== WITHDRAW_EFFECT_ID);
  const open = lostBy(made, tortoise, 300, 2_200);
  assert.ok(shut < open * 0.3, `almost no damage while withdrawn: ${shut} vs ${open}`);
}

// ── Gravecaller: a fallen summon rises once as a husk ────────────────────────
{
  const made = field(['conduit-gravecaller', 'conduit-thrall']);
  const target = monster(made.world, 430);
  made.player.summonsMinions!.formationTargetId = target.isMonster.id;
  made.minions[1]!.hasHealth.hp = 0;
  updateSummonerArchetype(made.world, 100, 2_000);
  assert.equal(huskCount(made.player), 1, 'the fallen summon rises as a husk');
  const before = target.hasHealth.hp;
  updateSummonerArchetype(made.world, 100, 3_500);
  assert.ok(target.hasHealth.hp < before, 'and strikes while it lasts');
  updateSummonerArchetype(made.world, 100, 12_000);
  assert.equal(huskCount(made.player), 0, 'then fades');
  const bare = field(['conduit-thrall', 'conduit-thrall']);
  bare.minions[1]!.hasHealth.hp = 0;
  updateSummonerArchetype(bare.world, 100, 2_000);
  assert.equal(huskCount(bare.player), 0, 'only with a Gravecaller');
}

// ── Abyssal Warden: a debuff on a summon or on you moves onto it ─────────────
{
  const made = field(['conduit-abyssal-warden', 'conduit-thrall']);
  dot(made.player.tracksCombat);
  dot(made.minions[1]!.tracksCombat, 'bleed');
  updateSummonerArchetype(made.world, 100, 6_000);
  const onWarden = made.minions[0]!.tracksCombat.statusEffects.filter((e) => e.id === 'poison' || e.id === 'bleed');
  assert.equal(onWarden.length, 1, 'one debuff is pulled onto the warden');
  const left = [getStatusEffect(made.player.tracksCombat, 'poison'), getStatusEffect(made.minions[1]!.tracksCombat, 'bleed')].filter(Boolean);
  assert.equal(left.length, 1, 'and it is gone from where it was');
}

// ── T3 leftover: Infestation's burst now rises as short-lived husks ─────────
{
  const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', specialization: 'conduit-infestation' });
  const target = monster(made.world, 430, 100_000);
  hit(made, made.minions[0]!, target, 2_000);
  target.hasHealth.hp = 1;
  hit(made, made.minions[0]!, target, 4_000);
  assert.ok(target.hasHealth.hp <= 0, 'the infested enemy dies');
  assert.ok(huskCount(made.player) >= 3, 'and its infestation rises as husks');
}

// ── Leaves ────────────────────────────────────────────────────────────────────
{
  // Burst: a dying summon explodes.
  const blast = (leaf: boolean) => {
    const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', leaves: leaf ? ['conduit-burst'] : [] });
    const enemy = monsterAt(made, made.minions[0]!, 40);
    made.minions[0]!.hasHealth.hp = 0;
    updateSummonerArchetype(made.world, 100, 2_000);
    return enemy.hasHealth.maxHp - enemy.hasHealth.hp;
  };
  assert.ok(blast(true) > blast(false), 'a dying summon explodes');
  // With Burn Bright: a wave rebuilt in a fight blows up as it burns out.
  const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', specialization: 'conduit-burn-bright', leaves: ['conduit-burst'] });
  const enemy = monsterAt(made, made.minions[0]!, 40);
  fight(made, enemy, 2_000);
  made.minions[0]!.tracksCombat.resources['minion.bornAt'] = 2_000;
  assert.ok(made.minions[0]!.hasHealth.hp > 0);
  fight(made, enemy, 9_000);
  assert.equal(made.minions[0]!.hasHealth.hp, 0, 'the wave burns out');
  assert.ok(enemy.hasHealth.hp < enemy.hasHealth.maxHp, 'and blows up');
}
{
  // Grand Entrance: a rebuilt summon stuns the enemies around it as it lands.
  const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', leaves: ['conduit-grand-entrance'] });
  const enemy = monster(made.world, 430);
  made.minions[0]!.hasHealth.hp = 0;
  for (let now = 2_000; now < 60_000; now += 1_000) {
    updateSummonerArchetype(made.world, 1_000, now);
    if (getStatusEffect(enemy.tracksCombat, STUN_STATUS_ID)) break;
  }
  assert.ok(getStatusEffect(enemy.tracksCombat, STUN_STATUS_ID), 'the rebuilt summon stuns what is around it');
}
{
  // Devour: a summon that has lived a while steals health back.
  const heal = (leaf: boolean) => {
    const made = field(['conduit-thrall'], { discipline: 'conduit-swarm', leaves: leaf ? ['conduit-devour'] : [] });
    const target = monster(made.world, 430);
    const m = made.minions[0]!;
    m.hasHealth.hp = Math.round(m.hasHealth.maxHp * 0.5);
    const before = m.hasHealth.hp;
    hit(made, m, target, 30_000);
    return m.hasHealth.hp - before;
  };
  assert.ok(heal(true) > heal(false), 'a veteran summon heals from its hits');
  const young = field(['conduit-thrall'], { discipline: 'conduit-swarm', leaves: ['conduit-devour'] });
  young.minions[0]!.hasHealth.hp = 1;
  hit(young, young.minions[0]!, monster(young.world, 430), 2_000);
  assert.equal(young.minions[0]!.hasHealth.hp, 1, 'a new one does not');
}
{
  // Avenge: when a summon dies, the rest strike its killer.
  const struck = (leaf: boolean) => {
    const made = field(['conduit-thrall', 'conduit-thrall'], { discipline: 'conduit-pack', leaves: leaf ? ['conduit-avenge'] : [] });
    const killer = monster(made.world, 430);
    setAggroTarget(made.world, killer, { id: made.minions[0]!.isMinion.id, kind: 'minion' }, 1_500);
    made.minions[0]!.hasHealth.hp = 0;
    updateSummonerArchetype(made.world, 100, 2_000);
    return killer.hasHealth.maxHp - killer.hasHealth.hp;
  };
  assert.ok(struck(true) > struck(false), 'the rest strike the killer');
}
{
  // Fall Back: a hurt summon retreats, mends, and rejoins.
  const made = field(['conduit-plains-tank', 'conduit-thrall'], { discipline: 'conduit-pack', leaves: ['conduit-fall-back'] });
  const target = monster(made.world, 430);
  const hurt = made.minions[1]!;
  hurt.hasHealth.hp = Math.round(hurt.hasHealth.maxHp * 0.2);
  fight(made, target, 2_000);
  assert.ok(getStatusEffect(hurt.tracksCombat, FALL_BACK_EFFECT_ID), 'a hurt summon falls back');
  assert.ok(fallBackSpot(made.world, made.player, hurt), 'to a spot behind the tank');
  const low = hurt.hasHealth.hp;
  for (let now = 3_000; now < 12_000; now += 1_000) updateSummonerArchetype(made.world, 1_000, now);
  assert.ok(hurt.hasHealth.hp > low, 'it recovers');
  assert.ok(!getStatusEffect(hurt.tracksCombat, FALL_BACK_EFFECT_ID), 'and rejoins the fight');
  assert.equal(fallBackSpot(made.world, made.player, hurt), null);
}
{
  // Rally: the Pack Strike mends the whole formation.
  const mend = (leaf: boolean) => {
    const made = field(['conduit-thrall', 'conduit-forest-bruiser'], { discipline: 'conduit-pack', leaves: leaf ? ['conduit-rally'] : [] });
    const target = monster(made.world, 430);
    made.player.summonsMinions!.formationTargetId = target.isMonster.id;
    made.minions[0]!.hasHealth.hp = 1;
    assert.ok(firePackStrike(made.world, made.player, 2_000) > 0);
    return made.minions[0]!.hasHealth.hp;
  };
  assert.ok(mend(true) > mend(false), 'the strike patches the formation up');
}
{
  // Final Command: a dying elite uses its extra once more, doubled.
  const splash = (leaf: boolean) => {
    const made = field(['conduit-thrall'], { discipline: 'conduit-elite', leaves: leaf ? ['conduit-final-command'] : [] });
    const target = monster(made.world, 430);
    const aside = monster(made.world, 480);
    made.player.summonsMinions!.formationTargetId = target.isMonster.id;
    made.minions[0]!.hasHealth.hp = 0;
    updateSummonerArchetype(made.world, 100, 2_000);
    return (target.hasHealth.maxHp - target.hasHealth.hp) + (aside.hasHealth.maxHp - aside.hasHealth.hp);
  };
  assert.ok(splash(true) > splash(false), 'a dying elite strikes one last time');
  const heal = (leaf: boolean) => {
    const made = field(['conduit-bloomtender', 'conduit-thrall'], { discipline: 'conduit-elite', leaves: leaf ? ['conduit-final-command'] : [] });
    made.player.summonsMinions!.formationTargetId = monster(made.world, 430).isMonster.id;
    made.player.hasHealth.hp = Math.round(made.player.hasHealth.maxHp * 0.4);
    made.minions[0]!.hasHealth.hp = 0;
    updateSummonerArchetype(made.world, 100, 2_000);
    return made.player.hasHealth.hp;
  };
  assert.ok(heal(true) > heal(false), 'a dying support uses its job at double strength');
}
{
  // Last Stand: once a fight, an elite that would die holds at 1 HP.
  const made = field(['conduit-thrall'], { discipline: 'conduit-elite', leaves: ['conduit-last-stand'] });
  const m = made.minions[0]!;
  const mon = monster(made.world, 440);
  mon.dealsDamage.attack = 1_000_000;
  fight(made, mon, 1_900);
  runMonsterAttackOnMinion(made.world, mon, m, 2_000);
  assert.equal(m.hasHealth.hp, 1, 'it holds on with a scrap of health');
  assert.ok(getStatusEffect(m.tracksCombat, LAST_STAND_EFFECT_ID));
  runMonsterAttackOnMinion(made.world, mon, m, 2_500);
  assert.equal(m.hasHealth.hp, 1, 'and nothing takes the last point while it holds');
  updateSummonerArchetype(made.world, 100, 9_000);
  assert.ok(!getStatusEffect(m.tracksCombat, LAST_STAND_EFFECT_ID), 'the hold ends');
  runMonsterAttackOnMinion(made.world, mon, m, 9_500);
  assert.equal(m.hasHealth.hp, 0, 'and it does not come twice in one fight');
}
{
  // Shared Burden: part of what an elite takes is paid from your HP.
  const run = (leaf: boolean) => {
    const made = field(['conduit-thrall'], { discipline: 'conduit-elite', leaves: leaf ? ['conduit-shared-burden'] : [] });
    const before = made.player.hasHealth.hp;
    const lost = lostBy(made, made.minions[0]!, 300, 2_000);
    return { lost, you: before - made.player.hasHealth.hp };
  };
  const burden = run(true), plain = run(false);
  assert.ok(burden.lost < plain.lost, 'the elite takes less');
  assert.ok(burden.you > 0 && plain.you === 0, 'you pay the difference');
}

// ── Souls: the last ranks and the two new lineages ────────────────────────────
{
  const rank = (relic: string, cleared: string[]) => soulPower(setup(['conduit-thrall'], { relic, cleared }).player);
  assert.ok(rank('conduit-relic-mountain', ['mountain:1', 'mountain:2', 'mountain:3', 'mountain:4']) > rank('conduit-relic-mountain', ['mountain:1', 'mountain:2', 'mountain:3']), 'the Mountain Soul reaches its last rank');
  for (const lineage of ['jungle', 'desert']) {
    assert.ok(rank(`conduit-relic-${lineage}`, [`${lineage}:2`, `${lineage}:3`, `${lineage}:4`]) > rank(`conduit-relic-${lineage}`, [`${lineage}:2`, `${lineage}:3`]), `the ${lineage} Soul ranks up at T4`);
  }
  for (const lineage of ['tundra', 'volcanic']) {
    assert.ok(rank(`conduit-relic-${lineage}`, [`${lineage}:3`, `${lineage}:4`]) > rank(`conduit-relic-${lineage}`, [`${lineage}:3`]), `the ${lineage} Soul ranks up at T4`);
  }
}
{
  // Charnel-Crown (Graveyard): enemies the formation kills rise as thralls.
  const made = field(['conduit-thrall'], { relic: 'conduit-relic-graveyard', cleared: ['graveyard:4'] });
  const prey = monster(made.world, 430, 1);
  hit(made, made.minions[0]!, prey, 2_000);
  assert.ok(prey.hasHealth.hp <= 0, 'the enemy dies');
  assert.equal(huskCount(made.player), 1, 'and rises as a thrall');
  const bare = field(['conduit-thrall'], { relic: 'conduit-relic-plains', cleared: ['graveyard:4'] });
  hit(bare, bare.minions[0]!, monster(bare.world, 430, 1), 2_000);
  assert.equal(huskCount(bare.player), 0, 'not without the Soul');
}
{
  // Elder Serpent (Trench): the longer the fight, the tougher the summons.
  const run = (relic: string) => {
    const made = field(['conduit-thrall'], { relic, cleared: ['trench:4'] });
    const target = monster(made.world, 430);
    fight(made, target, 2_000);
    const early = lostBy(made, made.minions[0]!, 300, 2_100);
    fight(made, target, 62_000);
    return { early, late: lostBy(made, made.minions[0]!, 300, 62_100) };
  };
  const serpent = run('conduit-relic-trench'), plain = run('conduit-relic-plains');
  assert.ok(serpent.late < serpent.early, `a long fight toughens the summons: ${serpent.early} then ${serpent.late}`);
  assert.equal(plain.late, plain.early, 'not without the Soul');
}

// ── Gear: Cleave, Exploit, Grave Pact, Requiem, Pressure Seal, Tidewater ─────
{
  const splash = (passives: Record<string, number>) => {
    const made = field(['conduit-thrall'], { passives });
    const target = monster(made.world, 430);
    const aside = monster(made.world, 470);
    hit(made, made.minions[0]!, target, 2_000);
    return aside.hasHealth.maxHp - aside.hasHealth.hp;
  };
  assert.ok(splash({ 'conduit.cleave-pct': 0.4 }) > splash({}), 'Cleave splashes the hit');
}
{
  const dmg = (debuffs: number) => {
    const made = field(['conduit-thrall'], { passives: { 'conduit.exploit-pct': 0.15 } });
    const target = monster(made.world, 430);
    if (debuffs > 0) applyStatusEffect(target.tracksCombat, { id: ABILITY_SLOW_EFFECT_ID, maxStacks: 1, remainingMs: 10_000, refreshable: true, sourceId: 'x', data: { moveSlowPct: 0.3, totalMs: 10_000 } });
    if (debuffs > 1) dot(target.tracksCombat);
    return hit(made, made.minions[0]!, target, 2_000);
  };
  assert.ok(dmg(1) > dmg(0), 'Exploit: a debuff raises the hit');
  assert.ok(dmg(2) > dmg(1), 'and each different one raises it more');
}
{
  const made = field(['conduit-thrall', 'conduit-thrall'], { passives: { 'conduit.grave-pact-ms': 60_000 } });
  const take = (damage: number) => {
    const ctx = makeCombatContext(monster(made.world, 440), 'monster', made.player, 'player');
    ctx.damage = damage;
    emitCombatEvent('onDamageTaken', ctx, made.world);
    return ctx.damage;
  };
  assert.equal(take(100), 100, 'a hit that does not kill you is taken');
  assert.equal(take(5_000), 0, 'a hit that would kill you is paid by a summon');
  assert.equal(made.minions.filter((m) => m.hasHealth.hp <= 0).length, 1, 'one summon dies in your place');
  assert.equal(take(5_000), 5_000, 'and the pact waits before it does it again');
}
{
  const heal = (passives: Record<string, number>) => {
    const made = field(['conduit-thrall', 'conduit-thrall'], { passives });
    made.minions[1]!.hasHealth.hp = 1;
    made.minions[0]!.hasHealth.hp = 0;
    updateSummonerArchetype(made.world, 100, 2_000);
    return made.minions[1]!.hasHealth.hp;
  };
  assert.ok(heal({ 'conduit.requiem-pct': 0.25 }) > heal({}), 'Requiem: the others heal when a summon dies');
}
{
  const made = field(['conduit-thrall'], { passives: { 'conduit.pressure-seal-ms': 8_000 } });
  updateSummonerArchetype(made.world, 100, 2_000);
  assert.ok(getStatusEffect(made.player.tracksCombat, SEAL_EFFECT_ID), 'you are sealed');
  assert.ok(getStatusEffect(made.minions[0]!.tracksCombat, SEAL_EFFECT_ID), 'and so is each summon');
  dot(made.player.tracksCombat);
  updateSummonerArchetype(made.world, 100, 2_100);
  assert.ok(!getStatusEffect(made.player.tracksCombat, 'poison'), 'the next debuff is ignored');
  assert.ok(!getStatusEffect(made.player.tracksCombat, SEAL_EFFECT_ID), 'and the seal is spent');
  dot(made.player.tracksCombat);
  updateSummonerArchetype(made.world, 100, 2_200);
  assert.ok(getStatusEffect(made.player.tracksCombat, 'poison'), 'the next one lands until the seal returns');
}
{
  const gain = (debuffs: number) => {
    const made = field(['conduit-thrall'], { passives: { 'conduit.tidewater-pct': 1 } });
    made.player.hasHealth.recovery = 100;
    const start = Math.round(made.player.hasHealth.maxHp * 0.2);
    made.player.hasHealth.hp = start;
    for (const id of ['poison', 'bleed', 'burn'].slice(0, debuffs)) dot(made.player.tracksCombat, id);
    updateSummonerArchetype(made.world, 1_000, 2_000);
    return made.player.hasHealth.hp - start;
  };
  assert.ok(gain(3) > gain(2), 'Tidewater: three debuffs double your Recovery');
}
{
  for (const [id, key] of [['conduit-cleave-t4', 'conduit.cleave-pct'], ['conduit-exploit-t4', 'conduit.exploit-pct']] as const) {
    assert.ok((ITEM_DATABASE.get(id)?.mechanicEffects?.[key] ?? 0) > 0, `${id} carries ${key}`);
  }
  for (const [id, key] of [
    ['graveyard-vest-t4', 'conduit.grave-pact-ms'], ['graveyard-charm-t4', 'conduit.requiem-pct'],
    ['trench-vest-t4', 'conduit.pressure-seal-ms'], ['trench-charm-t4', 'conduit.tidewater-pct'],
    ['mountain-vest-t4', 'conduit.intercept-pct'], ['tundra-vest-t4', 'conduit.permafrost'], ['volcanic-charm-t4', 'conduit.emberglow-pct'],
  ] as const) {
    assert.ok((classLineFor(ITEM_DATABASE.get(id), 'summoner')?.effects[key] ?? 0) > 0, `${id} carries ${key}`);
  }
  // The moved lines (Swamp to Graveyard, Cave to Trench) ride the second bases.
  for (const [id, key] of [
    ['graveyard-vest-t4-b', 'conduit.poison-shift'], ['graveyard-charm-t4-b', 'conduit.bloodtithe-pct'],
    ['trench-vest-t4-b', 'conduit.hp-pct'], ['trench-charm-t4-b', 'conduit.rebuild-speed-pct'],
  ] as const) {
    assert.ok(classLineFor(ITEM_DATABASE.get(id), 'summoner')?.effects[key] !== undefined, `${id} carries ${key}`);
  }
}

console.log('conduitT4: ok');
