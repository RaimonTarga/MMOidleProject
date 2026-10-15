/**
 * The Apprentice at tier 4 (bible §9.7, §9.16): the nine leaves, the T4 lessons (Seize III,
 * Frostcrack, Spread II, Recoil II, Cinderfall II, Pyre, Transference), Siphon II, the trophy ranks
 * and the Wasteland and Trench trophies, and the new gear jobs. Wiring only: attach, tick, assert
 * observable state; no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  setCounter,
  type PayoffPlacement,
} from '@mmo-idle/shared';
import { CLASS_GEAR } from '../../shared/src/data/classGear';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent, detachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { APPRENTICE_RECOVERY_X, laySigils, payoffsOf, updateApprentice } from '../src/systems/classes/archetypes/dot/sigils';
import { trophyParam } from '../src/systems/classes/archetypes/dot/sigilsT2';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { isShelled } from '../src/systems/combat/ai/shellUp';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { syncEnemyBarrierState } from '../src/systems/combat/engine/enemyBarrierState';
import { recordMoment, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { publishFaultLineBurst } from '../src/systems/world/groundZones';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const POISON = 'apprentice-poison';
const FIRE = 'apprentice-fire';
const FROST = 'apprentice-frost';
const SIGIL = 'dot';

const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-apprentice-t4-dummy', { ...base, id: 'test-apprentice-t4-dummy', evasion: 0 });
MONSTER_DATABASE.set('test-apprentice-t4-immune', { ...base, id: 'test-apprentice-t4-immune', evasion: 0, controlImmune: true });
MONSTER_DATABASE.set('test-apprentice-t4-ambusher', { ...base, id: 'test-apprentice-t4-ambusher', evasion: 0, idleAnchor: 'jungle-bush' });

let clock = 100_000;

interface Options {
  discipline?: string;
  leaf?: string;
  relic?: string[];
  bossesCleared?: string[];
  placements?: PayoffPlacement[];
  passives?: Record<string, number>;
  /** 4 (default): every T4 lesson is learned; 3: the T3 state, to compare against the lower rank. */
  tier?: 3 | 4;
  /** Biome level overrides (a low Swamp keeps Siphon at rank 1). */
  levels?: Record<string, number>;
}

function setup(opts: Options = {}) {
  const t4 = (opts.tier ?? 4) === 4;
  const biomes: Record<string, number> = t4
    ? { plains: 30, forest: 30, swamp: 30, mountain: 30, cave: 30, jungle: 30, desert: 30, tundra: 30, volcanic: 30, graveyard: 30, trench: 30 }
    : { plains: 14, forest: 14, swamp: 14, mountain: 14, cave: 14, jungle: 8, desert: 8, tundra: 2, volcanic: 2 };
  Object.assign(biomes, opts.levels ?? {});
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'apprentice', name: 'Apprentice' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 4, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: opts.leaf ? ['dot-root', opts.leaf] : ['dot-root'], passives: {}, selectedClass: 'dot-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'dot',
      disciplineId: opts.discipline ?? null, specializationId: null,
    },
  } as PersistedPlayerSlices, 'apprentice');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'dot', biomeLevel: biomes, bossesCleared: opts.bossesCleared ?? [], disciplineId: opts.discipline ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'payoffs' && opts.placements) config.system.placements = opts.placements;
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  player.dealsDamage.attack = 100;
  const spawn = (x: number, y: number, type = 'test-apprentice-t4-dummy'): MonsterEntity => {
    const m = world.createMonster(NODE, type, { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn, cap: payoffsOf(world, player)!.cap };
}

const sigils = (m: MonsterEntity): number => getStatusEffect(m.tracksCombat, SIGIL)?.stacks ?? 0;
const has = (m: { tracksCombat: MonsterEntity['tracksCombat'] }, id: string): boolean => getStatusEffect(m.tracksCombat, id) !== undefined;
const place = (moment: PayoffPlacement['moment'], pieceId: string): PayoffPlacement => ({ moment, pieceId, conditions: [] });
const aggro = (world: World, m: MonsterEntity): void => setAggroTarget(world, m, { kind: 'player', id: 'apprentice' }, clock);

function step(world: World, player: PlayerEntity, target?: MonsterEntity, times = 1): void {
  for (let i = 0; i < times; i++) {
    if (target) setAttackTarget(world, player, target.isMonster.id);
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateApprentice(world, player, 100, clock);
  }
}

/** One swing of `monster` at the player; the HP it cost. */
function strike(world: World, monster: MonsterEntity, player: PlayerEntity): number {
  clock += 5_000;
  const before = player.hasHealth.hp;
  runMonsterAttack(world, monster, player, clock);
  return before - player.hasHealth.hp;
}

const frozen = (m: MonsterEntity): void => {
  applyStatusEffect(m.tracksCombat, { id: 'dot-frozen', maxStacks: 1, remainingMs: 8000, sourceId: 'apprentice', data: { totalMs: 8000 } });
};

const ambushMonster = 'test-apprentice-t4-ambusher';

// ── The leaf belongs to the discipline ───────────────────────────────────────
{
  const right = setup({ discipline: POISON, leaf: 'apprentice-thick-air' });
  assert.equal(payoffsOf(right.world, right.player)!.leaf, 'apprentice-thick-air');
  const wrong = setup({ discipline: FIRE, leaf: 'apprentice-thick-air' });
  assert.equal(payoffsOf(wrong.world, wrong.player)!.leaf, null, 'a leaf under another discipline reads as no pick');
  const none = setup({ discipline: POISON });
  assert.equal(payoffsOf(none.world, none.player)!.leaf, null);
}

// ── The charger column: Thick Air, Fire Ward, Frozen Step ────────────────────
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: POISON, leaf, placements: [] });
    const charger = s.spawn(700, 400);
    aggro(s.world, charger);
    charger.controlsMonster.chargeRemainingMs = 600;
    step(s.world, s.player, undefined, 2);
    return { charger, cap: s.cap };
  };
  const on = run('apprentice-thick-air');
  assert.equal(sigils(on.charger), on.cap, 'Thick Air: a charging enemy lands carrying a full bar');
  assert.ok(has(on.charger, 'ability-slowed'), 'slowed for a moment');
  assert.equal(sigils(run(undefined).charger), 0, 'no pick, nothing');
}
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: FIRE, leaf, placements: [] });
    const walker = s.spawn(900, 900);
    aggro(s.world, walker);
    laySigils(s.world, s.player, walker, 3, s.cap);
    step(s.world, s.player, undefined, 2);
    assert.equal(sigils(walker), 3, 'far away it still carries its sigils');
    walker.hasPosition.current = { x: 430, y: 400 };
    step(s.world, s.player, undefined, 2);
    return walker;
  };
  const warded = run('apprentice-fire-ward');
  assert.equal(sigils(warded), 0, 'Fire Ward: an enemy reaching melee range sets off its own sigils');
  assert.ok(warded.hasHealth.hp < warded.hasHealth.maxHp, 'and the blast hurts it');
  assert.equal(sigils(run(undefined)), 3, 'no pick, nothing');
}
{
  const run = (leaf: string | undefined, type?: string) => {
    const s = setup({ discipline: FROST, leaf, placements: [] });
    const charger = s.spawn(430, 400, type);
    aggro(s.world, charger);
    charger.controlsMonster.chargeRemainingMs = 600;
    step(s.world, s.player, undefined, 2);
    charger.controlsMonster.chargeRemainingMs = 0;
    step(s.world, s.player, undefined, 2);
    return charger;
  };
  assert.ok(has(run('apprentice-frozen-step'), 'dot-frozen'), 'Frozen Step: a charge that reaches you freezes the charger');
  assert.ok(has(run('apprentice-frozen-step', 'test-apprentice-t4-immune'), 'brittle'), 'and a charger that accepts no control turns brittle');
  assert.ok(!has(run(undefined), 'dot-frozen'), 'no pick, nothing');
}

// ── The ambusher column: Taint, Tinderbox, Cold Shoulder ─────────────────────
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: POISON, leaf, placements: [] });
    const ambusher = s.spawn(430, 400, ambushMonster);
    aggro(s.world, ambusher);
    const lost = strike(s.world, ambusher, s.player);
    return { lost, ambusher, cap: s.cap };
  };
  const taint = run('apprentice-taint');
  const plain = run(undefined);
  assert.ok(taint.lost > 0 && taint.lost < plain.lost, 'Taint: the first hit an ambusher lands on you is weaker');
  assert.equal(sigils(taint.ambusher), taint.cap, 'and it arrives carrying a full bar');
  assert.equal(sigils(plain.ambusher), 0);
}
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: FROST, leaf, placements: [] });
    const ambusher = s.spawn(430, 400, ambushMonster);
    aggro(s.world, ambusher);
    const first = strike(s.world, ambusher, s.player);
    const second = strike(s.world, ambusher, s.player);
    return { first, second, ambusher };
  };
  const shoulder = run('apprentice-cold-shoulder');
  assert.ok(has(shoulder.ambusher, 'dot-frozen'), 'Cold Shoulder: the first hit freezes the ambusher');
  assert.ok(shoulder.first < shoulder.second, 'and is halved, the second is not');
  assert.ok(!has(run(undefined).ambusher, 'dot-frozen'), 'no pick, nothing');
}
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: FIRE, leaf, placements: [] });
    const a = s.spawn(430, 400);
    const b = s.spawn(500, 450);
    for (const m of [a, b]) laySigils(s.world, s.player, m, 2, s.cap);
    step(s.world, s.player, undefined, 1);
    recordMoment(s.world, s.player, 'ambush');
    step(s.world, s.player, undefined, 1);
    return { a: sigils(a), b: sigils(b) };
  };
  assert.deepEqual(run('apprentice-tinderbox'), { a: 0, b: 0 }, 'Tinderbox: an enemy appearing beside you sets off your sigils on the enemies around you');
  assert.deepEqual(run(undefined), { a: 2, b: 2 }, 'no pick, nothing');
}

// ── The shooter column: Windborne, Smokescreen, Frost Mirror ─────────────────
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: POISON, leaf, placements: [] });
    const carrier = s.spawn(430, 400);
    laySigils(s.world, s.player, carrier, 2, s.cap);
    const shooter = s.spawn(1000, 400);
    shooter.performsAttack.attackRange = 600;
    aggro(s.world, shooter);
    strike(s.world, shooter, s.player);
    return shooter;
  };
  assert.ok(sigils(run('apprentice-windborne')) >= 1, 'Windborne: the plague walks to whoever hits you from range, however far');
  assert.equal(sigils(run(undefined)), 0, 'no pick, nothing');
}
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: FROST, leaf, placements: [] });
    const shooter = s.spawn(1000, 400);
    shooter.performsAttack.attackRange = 600;
    aggro(s.world, shooter);
    laySigils(s.world, s.player, shooter, s.cap - 1, s.cap);
    strike(s.world, shooter, s.player);
    return shooter;
  };
  const mirrored = run('apprentice-frost-mirror');
  assert.equal(sigils(mirrored), getStatusEffect(mirrored.tracksCombat, SIGIL)!.maxStacks, 'Frost Mirror: a ranged hit lays a sigil on the shooter');
  assert.ok(has(mirrored, 'dot-frozen'), 'and a full shooter freezes');
  assert.ok(!has(run(undefined), 'dot-frozen'), 'no pick, nothing');
}
{
  const run = (leaf: string | undefined) => {
    const s = setup({ discipline: FIRE, leaf, placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    target.performsAttack.attackRange = 600;
    aggro(s.world, target);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    assert.equal(sigils(target), 0, 'the detonation went off');
    return strike(s.world, target, s.player);
  };
  const smoked = run('apprentice-smokescreen');
  const plain = run(undefined);
  assert.ok(smoked > 0 && smoked < plain, 'Smokescreen: after a detonation the enemies it hit deal less with ranged hits');
}

// ── T4 lessons ───────────────────────────────────────────────────────────────
{
  // Seize III: the delayed attacks (fault lines) are cancelled too.
  const run = (tier: 3 | 4) => {
    const s = setup({ tier, placements: [place('enemy-winds-up', 'apprentice-seize')] });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, 4, s.cap);
    publishFaultLineBurst(s.world, NODE, {
      kind: 'fault-line-telegraph', ownerId: target.isMonster.id, resolvesAtMs: clock + 3000, startedAtMs: clock,
      points: [{ x: 700, y: 700 }], radius: 40, pos: { x: 700, y: 700 }, damageMultiplier: 1,
    });
    recordMoment(s.world, s.player, 'enemy-winds-up');
    step(s.world, s.player, target);
    assert.equal(sigils(target), 0, 'Seize spends the sigils');
    return (s.world.groundZones.get(NODE) ?? []).length;
  };
  assert.equal(run(4), 0, 'Seize III: the seized enemy\'s fault lines are gone');
  assert.equal(run(3), 1, 'at rank 2 they stay');
}
{
  // Frostcrack: a Seize on a shielded enemy cracks the barrier at once.
  const ward = (m: MonsterEntity): void => {
    applyStatusEffect(m.tracksCombat, {
      id: 'barrier:test', maxStacks: 1, remainingMs: 20_000, sourceId: m.isMonster.id,
      data: { monsterWard: 1, wardAmount: 1_000_000, wardMaxAmount: 1_000_000, totalMs: 20_000 },
    });
  };
  const s = setup({ placements: [place('target-shielded', 'apprentice-frostcrack')] });
  const target = s.spawn(430, 400);
  ward(target);
  syncEnemyBarrierState(s.world, clock);
  assert.ok((target.hasStatus.enemyBarrier?.amount ?? 0) > 0, 'the barrier is up');
  laySigils(s.world, s.player, target, 3, s.cap);
  step(s.world, s.player, target);
  syncEnemyBarrierState(s.world, clock);
  assert.equal(sigils(target), 0, 'Frostcrack spends the sigils');
  assert.equal(target.hasStatus.enemyBarrier?.amount ?? 0, 0, 'and the barrier is cracked open at once');

  // A shelled enemy too.
  const shell = setup({ placements: [place('target-shielded', 'apprentice-frostcrack')] });
  const shelled = shell.spawn(430, 400);
  setCounter(shelled.tracksCombat, 'shellUpEndsAt', clock + 20_000);
  applyStatusEffect(shelled.tracksCombat, { id: 'shelled', maxStacks: 1, remainingMs: 20_000, sourceId: shelled.isMonster.id, data: { directDamageMult: 0.1, totalMs: 20_000 } });
  assert.ok(isShelled(shelled, clock), 'the shell is closed');
  laySigils(shell.world, shell.player, shelled, 3, shell.cap);
  step(shell.world, shell.player, shelled);
  assert.ok(!isShelled(shelled, clock), 'Frostcrack: the shell is cracked open');
  assert.equal(sigils(shelled), 0);

  // Nothing shielded, nothing to crack.
  const open = setup({ placements: [place('target-shielded', 'apprentice-frostcrack')] });
  const plain = open.spawn(430, 400);
  laySigils(open.world, open.player, plain, 3, open.cap);
  step(open.world, open.player, plain);
  assert.equal(sigils(plain), 3, 'an unshielded enemy keeps its sigils');
}
{
  // Spread II: the Spread also reaches a hiding enemy within your reach.
  const run = (tier: 3 | 4) => {
    const s = setup({ tier });
    const target = s.spawn(430, 400);
    const hidden = s.spawn(450, 410);
    attachComponent(s.world, hidden, 'isInvulnerable', {});
    aggro(s.world, target);
    aggro(s.world, hidden);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return sigils(hidden);
  };
  assert.ok(run(4) >= 1, 'Spread II: a sigil reaches the hiding enemy');
  assert.equal(run(3), 0, 'at rank 1 it does not');
}
{
  // Spread II under the plague.
  const run = (tier: 3 | 4) => {
    const s = setup({ tier, discipline: POISON, placements: [] });
    const target = s.spawn(430, 400);
    const hidden = s.spawn(450, 410);
    attachComponent(s.world, hidden, 'isInvulnerable', {});
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target, 2);
    return sigils(hidden);
  };
  assert.ok(run(4) >= 1, 'Spread II: the plague reaches the hiding enemy');
  assert.equal(run(3), 0, 'at rank 1 it does not');
}
{
  // Recoil II: the caster also suffers its own slow.
  const run = (tier: 3 | 4) => {
    const s = setup({ tier, placements: [place('debuff-landed', 'apprentice-recoil')] });
    const caster = s.spawn(430, 400);
    aggro(s.world, caster);
    applyStatusEffect(s.player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 3000, sourceId: caster.isMonster.id, data: { totalMs: 3000, speedMult: 0.5 } });
    step(s.world, s.player, caster, 2);
    assert.equal(sigils(caster), s.cap, 'the caster catches a full bar');
    return has(caster, 'ability-slowed');
  };
  assert.ok(run(4), 'Recoil II: the caster is slowed too');
  assert.ok(!run(3), 'at rank 1 it is not');
}
{
  // Cinderfall II: each step of the Heat widens the blast.
  const run = (tier: 3 | 4, heat: number) => {
    const s = setup({ tier, placements: [place('target-full', 'apprentice-cinderfall')] });
    const target = s.spawn(430, 400);
    const edge = s.spawn(650, 400);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    if (heat > 0) applyStatusEffect(s.player.tracksCombat, { id: 'volcanic-heat', maxStacks: 0, remainingMs: 60_000, sourceId: 'node', data: {} }).stacks = heat;
    step(s.world, s.player, target);
    assert.equal(sigils(target), 0, 'the blast went off');
    return edge.hasHealth.hp < edge.hasHealth.maxHp;
  };
  assert.ok(run(4, 10), 'Cinderfall II: with Heat the blast reaches further');
  assert.ok(!run(4, 0), 'without Heat it does not');
  assert.ok(!run(3, 10), 'and at rank 1 the Heat changes nothing');
}
{
  // Pyre: a fallen carrier cannot rise, and its leftovers pass on.
  const run = (placed: boolean) => {
    const s = setup({ discipline: FIRE, placements: placed ? [place('risen', 'apprentice-pyre')] : [] });
    const doomed = s.spawn(430, 400);
    const heir = s.spawn(470, 410);
    laySigils(s.world, s.player, doomed, 3, s.cap);
    step(s.world, s.player, undefined, 1);
    s.world.corpses.set(NODE, [{ id: 'corpse-test', monsterTypeId: doomed.isMonster.monsterTypeId, pos: { ...doomed.hasPosition.current }, diedAtMs: clock }]);
    doomed.hasHealth.hp = 0;
    step(s.world, s.player, undefined, 2);
    return { corpses: (s.world.corpses.get(NODE) ?? []).length, heir: sigils(heir) };
  };
  assert.deepEqual(run(true), { corpses: 0, heir: 3 }, 'Pyre: the body is burned off and its sigils pass on');
  assert.deepEqual(run(false), { corpses: 1, heir: 0 }, 'without it the body stays');
}
{
  // Transference: spend the target's sigils to move a debuff of yours onto it. Tidal Draw heals.
  const run = (tidal: boolean) => {
    const s = setup({ placements: [place('target-full', 'apprentice-transference')], passives: tidal ? { 'apprentice.tidal-draw': 0.03 } : {} });
    const target = s.spawn(430, 400);
    applyStatusEffect(s.player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 3000, sourceId: 'x', data: { totalMs: 3000, speedMult: 0.5 } });
    laySigils(s.world, s.player, target, s.cap, s.cap);
    s.player.hasHealth.hp = 5000;
    step(s.world, s.player, target);
    assert.equal(sigils(target), 0, 'Transference spends the sigils');
    assert.ok(!has(s.player, 'slow'), 'the debuff leaves you');
    assert.ok(has(target, 'ability-slowed'), 'and lands on the enemy');
    return s.player.hasHealth.hp;
  };
  assert.ok(run(true) > run(false), 'Tidal Draw: moving a debuff heals you');
  const idle = setup({ placements: [place('target-full', 'apprentice-transference')] });
  const target = idle.spawn(430, 400);
  laySigils(idle.world, idle.player, target, idle.cap, idle.cap);
  step(idle.world, idle.player, target);
  assert.equal(sigils(target), idle.cap, 'with no debuff on you Transference does nothing');
}
{
  // Siphon II: it also washes a poison off you (rank 1 does not); Tidal Draw heals.
  const run = (tier: 3 | 4) => {
    const s = setup({ tier, levels: tier === 3 ? { swamp: 3 } : {}, placements: [place('target-full', 'apprentice-siphon')], passives: { 'apprentice.tidal-draw': 0.03 } });
    const target = s.spawn(430, 400);
    applyStatusEffect(s.player.tracksCombat, { id: 'monster-dot:poison', maxStacks: 5, remainingMs: 8000, sourceId: 'x', data: { totalMs: 8000 } });
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    assert.equal(sigils(target), 0, 'Siphon spends the sigils');
    return has(s.player, 'monster-dot:poison');
  };
  assert.ok(!run(4), 'Siphon II: the poison is washed off you');
  assert.ok(run(3), 'at rank 1 it stays');
}

// ── Trophies ─────────────────────────────────────────────────────────────────
{
  const param = (relic: string, cleared: string[], key: string, fallback: number): number => {
    const { world, player } = setup({ relic: [relic], bossesCleared: cleared });
    return trophyParam(payoffsOf(world, player)!, key, fallback);
  };
  assert.equal(param('apprentice-relic-mountain', ['mountain:1', 'mountain:2', 'mountain:3', 'mountain:4'], 'holdMult', 0), 2.4, 'Petrify IV, the last rank');
  assert.equal(param('apprentice-relic-tundra', ['tundra:3', 'tundra:4'], 'brittleMs', 0), 5000, 'Frostheart II');
  assert.equal(param('apprentice-relic-jungle', ['jungle:2', 'jungle:3', 'jungle:4'], 'tickMult', 0), 2.5, 'Scent III');
  assert.equal(param('apprentice-relic-desert', ['desert:2', 'desert:3', 'desert:4'], 'extraNeighbours', 0), 2, 'Dune Wind III');
  assert.equal(param('apprentice-relic-volcanic', ['volcanic:3', 'volcanic:4'], 'shellTickMult', 0), 1.25, 'Magma Core II');
}
{
  // Dirge: a Detonate also sets off your sigils on every risen enemy.
  const run = (relic: string[]) => {
    // A low Desert leaves Signal Fire out, so only Dirge reaches past the target.
    const s = setup({ relic, levels: { desert: 3 }, bossesCleared: ['graveyard:4'], placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    const risen = s.spawn(900, 900);
    const living = s.spawn(950, 900);
    attachComponent(s.world, risen, 'isRaised', { raiserId: 'necro' });
    for (const m of [risen, living]) laySigils(s.world, s.player, m, 2, s.cap);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return { target: sigils(target), risen: sigils(risen), living: sigils(living) };
  };
  assert.deepEqual(run(['apprentice-relic-graveyard']), { target: 0, risen: 0, living: 2 }, 'Dirge: the risen go off with the Detonate, the living do not');
  assert.deepEqual(run([]), { target: 0, risen: 2, living: 2 }, 'without it nothing else goes off');
}
{
  // Pressure Fuse: a Detonate on an enemy out of reach waits, and goes off doubled when it resurfaces.
  const run = (relic: string[], hide: boolean) => {
    const s = setup({ relic, bossesCleared: ['trench:4'], placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    if (hide) attachComponent(s.world, target, 'isInvulnerable', {});
    const hp = target.hasHealth.hp;
    step(s.world, s.player, target);
    const held = { sigils: sigils(target), hp: target.hasHealth.hp };
    if (hide) {
      detachComponent(s.world, target, 'isInvulnerable');
      step(s.world, s.player, target, 2);
    }
    return { held, lost: hp - target.hasHealth.hp, cap: s.cap };
  };
  const pressure = run(['apprentice-relic-trench'], true);
  assert.equal(pressure.held.sigils, pressure.cap, 'Pressure Fuse: the blast is held back, the sigils stay');
  assert.equal(pressure.held.hp, 1_000_000, 'and nothing hurts yet');
  const plain = run([], false);
  assert.ok(pressure.lost > plain.lost * 1.5, 'then it goes off doubled when the enemy resurfaces');
}

// ── Gear jobs ────────────────────────────────────────────────────────────────
{
  for (const id of ['apprentice-charnel-rod-t4', 'apprentice-abyssal-censer-t4']) {
    assert.ok(Object.keys(ITEM_DATABASE.get(id)!.mechanicEffects ?? {}).length > 0, `${id} does something`);
  }
  for (const slot of ['graveyard-vest', 'graveyard-charm', 'trench-vest', 'trench-charm']) {
    const line = CLASS_GEAR.dot.lines[`${slot}-t4`];
    assert.ok(line && Object.keys(line.effects).length > 0, `${slot}-t4 does something`);
  }
}
{
  // Charnel Rod: your hits also lay a sigil on the nearest risen enemy.
  const run = (rod: boolean): number => {
    const s = setup({ placements: [], passives: rod ? { 'apprentice.charnel': 1 } : {} });
    const target = s.spawn(430, 400);
    const risen = s.spawn(700, 700);
    attachComponent(s.world, risen, 'isRaised', { raiserId: 'necro' });
    clock += 1_000;
    setAttackTarget(s.world, s.player, target.isMonster.id);
    runPlayerAttack(s.world, s.player, target, clock, { attackOrigin: s.player.hasPosition.current, aggroSource: { id: 'apprentice', kind: 'player' } });
    return sigils(risen);
  };
  assert.ok(run(true) >= 1, 'Charnel Rod: a hit lays a sigil on the risen enemy');
  assert.equal(run(false), 0, 'and not without it');
}
{
  // Gravewrap: a risen enemy carrying your sigils can't hit you for its first seconds.
  const run = (wrap: boolean, ticks: number): number => {
    const s = setup({ placements: [], passives: wrap ? { 'apprentice.gravewrap': 3 } : {} });
    const risen = s.spawn(430, 400);
    attachComponent(s.world, risen, 'isRaised', { raiserId: 'necro' });
    aggro(s.world, risen);
    laySigils(s.world, s.player, risen, 2, s.cap);
    step(s.world, s.player, undefined, ticks);
    return strike(s.world, risen, s.player);
  };
  assert.equal(run(true, 2), 0, 'Gravewrap: a fresh risen enemy cannot hit you');
  assert.ok(run(true, 40) > 0, 'but it can once the seconds have passed');
  assert.ok(run(false, 2) > 0, 'and not without it');
}
{
  // Last Rites: Recovery rises for each risen enemy carrying your sigils.
  const factor = (rites: boolean): number => {
    const s = setup({ placements: [], passives: rites ? { 'apprentice.last-rites': 0.15 } : {} });
    for (const x of [430, 470]) {
      const m = s.spawn(x, 400);
      attachComponent(s.world, m, 'isRaised', { raiserId: 'necro' });
      laySigils(s.world, s.player, m, 1, s.cap);
    }
    step(s.world, s.player, undefined, 1);
    return getResource(s.player.tracksCombat, APPRENTICE_RECOVERY_X);
  };
  assert.equal(factor(false), 1);
  assert.ok(factor(true) > 1, 'Last Rites: Recovery rises with the risen carrying sigils');
}
{
  // Abyssal Censer: sigils tick harder for each different debuff on their carrier.
  const lost = (censer: boolean, debuffs: boolean): number => {
    const s = setup({ placements: [], passives: censer ? { 'apprentice.abyssal': 0.1 } : {} });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, 3, s.cap);
    if (debuffs) {
      frozen(target);
      applyStatusEffect(target.tracksCombat, { id: 'vulnerability', maxStacks: 1, remainingMs: 8000, sourceId: 'apprentice', data: { damageMultiplier: 1 } });
      applyStatusEffect(target.tracksCombat, { id: 'ability-slowed', maxStacks: 1, remainingMs: 8000, sourceId: 'apprentice', data: { moveSlowPct: 0.2, totalMs: 8000 } });
    }
    step(s.world, s.player, target);
    getStatusEffect(target.tracksCombat, SIGIL)!.data['nextTickIn'] = 0;
    const hp = target.hasHealth.hp;
    updateDotArchetype(s.world, 100, clock);
    return hp - target.hasHealth.hp;
  };
  assert.ok(lost(true, true) > lost(false, true), 'Abyssal Censer: debuffs on the carrier make the sigils tick harder');
  assert.equal(lost(true, false), lost(false, false), 'and nothing changes without them');
}
{
  // Deep Ward: while you carry three or more debuffs, a full-bar enemy deals less.
  const hurt = (ward: boolean, debuffs: number): number => {
    const s = setup({ placements: [], passives: ward ? { 'apprentice.deep-ward': 0.2 } : {} });
    const foe = s.spawn(430, 400);
    aggro(s.world, foe);
    laySigils(s.world, s.player, foe, s.cap, s.cap);
    ['slow', 'sun-mark', 'antiheal'].slice(0, debuffs).forEach((id) => {
      applyStatusEffect(s.player.tracksCombat, { id, maxStacks: 1, remainingMs: 60_000, sourceId: 'x', data: { totalMs: 60_000 } });
    });
    return strike(s.world, foe, s.player);
  };
  assert.ok(hurt(true, 3) < hurt(false, 3), 'Deep Ward: three debuffs and a full bar, the enemy hits softer');
  assert.equal(hurt(true, 2), hurt(false, 2), 'with only two debuffs it does nothing');
}

console.log('apprenticeT4: ok');
