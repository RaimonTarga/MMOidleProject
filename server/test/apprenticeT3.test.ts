/**
 * The Apprentice at tier 3 (bible §9.6, §9.16): the nine specializations, the T3 lessons
 * (Seize II, Seep II, Spore Burst, Snag II, Signal Fire, Melt, Cinderfall), the trophy ranks and
 * the Tundra and Volcanic trophies, and the new gear jobs. Wiring only: attach, tick, assert
 * observable state; no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getCounter,
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
import { ripestAge } from '../src/systems/classes/archetypes/dot/sigilsT3';
import { trophyParam } from '../src/systems/classes/archetypes/dot/sigilsT2';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { syncEnemyBarrierState } from '../src/systems/combat/engine/enemyBarrierState';
import { recordMoment, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { applyMonsterSlow, monsterHasLiveRoot } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const POISON = 'apprentice-poison';
const FIRE = 'apprentice-fire';
const FROST = 'apprentice-frost';
const SIGIL = 'dot';

const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-apprentice-t3-dummy', { ...base, id: 'test-apprentice-t3-dummy', evasion: 0 });
MONSTER_DATABASE.set('test-apprentice-t3-kiter', { ...base, id: 'test-apprentice-t3-kiter', evasion: 0, behavior: 'kiter' });
MONSTER_DATABASE.set('test-apprentice-t3-immune', { ...base, id: 'test-apprentice-t3-immune', evasion: 0, controlImmune: true });
MONSTER_DATABASE.set('test-apprentice-t3-fire', { ...base, id: 'test-apprentice-t3-fire', evasion: 0, attackStyle: 'fire' });

let clock = 100_000;

interface Options {
  discipline?: string;
  spec?: string;
  relic?: string[];
  bossesCleared?: string[];
  placements?: PayoffPlacement[];
  passives?: Record<string, number>;
  /** 3 (default): every T3 lesson is learned; 2: the T2 state, to compare against rank 1. */
  tier?: 2 | 3;
  /** Learn Signal Fire (the Desert's T3 lesson); it rides every detonation, so most tests leave it out. */
  signal?: boolean;
}

function setup(opts: Options = {}) {
  // Biome levels run per biome: the Desert and Jungle start a tier later than the first five, the Tundra and Volcanic at T3.
  const t3 = (opts.tier ?? 3) === 3;
  const biomes: Record<string, number> = {
    plains: t3 ? 14 : 8, forest: t3 ? 14 : 8, swamp: t3 ? 14 : 8, mountain: t3 ? 14 : 8, cave: t3 ? 14 : 8,
    jungle: t3 ? 8 : 2, desert: t3 && opts.signal ? 8 : 2, tundra: t3 ? 2 : 0, volcanic: t3 ? 2 : 0,
  };
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'apprentice', name: 'Apprentice' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 3, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['dot-root'], passives: {}, selectedClass: 'dot-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'dot',
      disciplineId: opts.discipline ?? null, specializationId: opts.spec ?? null,
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
  const spawn = (x: number, y: number, type = 'test-apprentice-t3-dummy'): MonsterEntity => {
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

function step(world: World, player: PlayerEntity, target?: MonsterEntity, times = 1): void {
  for (let i = 0; i < times; i++) {
    if (target) setAttackTarget(world, player, target.isMonster.id);
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateApprentice(world, player, 100, clock);
  }
}

const frozen = (m: MonsterEntity): void => {
  applyStatusEffect(m.tracksCombat, { id: 'dot-frozen', maxStacks: 1, remainingMs: 8000, sourceId: 'apprentice', data: { totalMs: 8000 } });
};

// ── The pick belongs to the discipline ───────────────────────────────────────
{
  const right = setup({ discipline: POISON, spec: 'apprentice-carrier' });
  assert.equal(payoffsOf(right.world, right.player)!.specialization, 'apprentice-carrier');
  const wrong = setup({ discipline: FIRE, spec: 'apprentice-carrier' });
  assert.equal(payoffsOf(wrong.world, wrong.player)!.specialization, null, 'a specialization under another discipline reads as no pick');
  const none = setup({ discipline: POISON });
  assert.equal(payoffsOf(none.world, none.player)!.specialization, null);
}

// ── Poison: Carrier, Ripening, Wasting ───────────────────────────────────────
{
  const on = setup({ discipline: POISON, spec: 'apprentice-carrier', placements: [] });
  const near = on.spawn(450, 420);
  const far = on.spawn(900, 900);
  step(on.world, on.player, undefined, 2);
  assert.ok(sigils(near) >= 1, 'Carrier: an enemy near you catches a sigil');
  assert.equal(sigils(far), 0, 'and a far one does not');
  const off = setup({ discipline: POISON, placements: [] });
  const n2 = off.spawn(450, 420);
  step(off.world, off.player, undefined, 2);
  assert.equal(sigils(n2), 0, 'no pick, no Carrier');
}
{
  const { world, player, spawn, cap } = setup({ discipline: POISON, spec: 'apprentice-ripening', placements: [] });
  const carrier = spawn(430, 400);
  laySigils(world, player, carrier, cap, cap);
  const effect = getStatusEffect(carrier.tracksCombat, SIGIL)!;
  const baseDamage = effect.data['damagePerStack']!;
  step(world, player, carrier, 3);
  assert.equal(effect.data['damagePerStack'], baseDamage, 'young sigils tick at their base');
  step(world, player, carrier, 55);
  assert.ok(effect.data['damagePerStack']! > baseDamage, 'Ripening: sigils older than a few seconds tick harder');
  assert.ok(ripestAge(effect) >= 5000, 'the board keeps each sigil age');
  const heir = spawn(470, 410);
  step(world, player, carrier);
  assert.ok(sigils(heir) >= 1, 'the plague walks on');
  assert.ok(ripestAge(getStatusEffect(heir.tracksCombat, SIGIL)) >= 5000, 'and passes on its ripest sigil');
}
{
  const run = (spec: string | undefined) => {
    const s = setup({ discipline: POISON, spec, placements: [] });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return target;
  };
  assert.ok(has(run('apprentice-wasting'), 'apprentice-withered'), 'Wasting: a full bar keeps the enemy withered');
  assert.ok(!has(run(undefined), 'apprentice-withered'), 'and nothing else does');
}

// ── Fire: Afterburn, Long Fuse, Hair Trigger ─────────────────────────────────
{
  const run = (spec: string | undefined) => {
    const s = setup({ discipline: FIRE, spec, placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return target;
  };
  assert.ok(sigils(run('apprentice-afterburn')) > 0, 'Afterburn: a detonation leaves sigils burning on the target');
  assert.equal(sigils(run(undefined)), 0, 'without it the blast spends them all');
}
{
  const { world, player, spawn, cap } = setup({ discipline: FIRE, spec: 'apprentice-long-fuse', placements: [place('target-full', 'apprentice-detonate')] });
  const target = spawn(430, 400);
  laySigils(world, player, target, cap, cap);
  const hp = target.hasHealth.hp;
  step(world, player, target);
  assert.equal(sigils(target), cap, 'Long Fuse: the detonation waits');
  assert.equal(target.hasHealth.hp, hp, 'and nothing hurts yet');
  step(world, player, target, 30);
  assert.ok(target.hasHealth.hp < hp, 'then it goes off');
}
{
  const run = (spec: string | undefined) => {
    const s = setup({ discipline: FIRE, spec, placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    const lit = s.spawn(480, 400);
    laySigils(s.world, s.player, lit, 1, s.cap);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return lit;
  };
  assert.equal(sigils(run('apprentice-hair-trigger')), 0, 'Hair Trigger: the chain sets off an enemy that only carried sigils');
  assert.ok(sigils(run(undefined)) > 0, 'a plain chain leaves it alone unless it fills it');
}

// ── Frost: Ice Tomb, Creeping Frost, Shardstorm ──────────────────────────────
{
  const seize = (spec: string | undefined, type?: string) => {
    const s = setup({ discipline: FROST, spec, placements: [place('enemy-winds-up', 'apprentice-seize')] });
    const target = s.spawn(430, 400, type);
    laySigils(s.world, s.player, target, 3, s.cap);
    recordMoment(s.world, s.player, 'enemy-winds-up');
    step(s.world, s.player, target);
    return target;
  };
  assert.ok(getStatusEffect(seize(undefined).tracksCombat, 'dot-frozen')!.remainingMs < 3000, 'a plain Seize freezes for a moment');
  assert.equal(getStatusEffect(seize('apprentice-ice-tomb').tracksCombat, 'dot-frozen')!.remainingMs, 6000, 'Ice Tomb: the freeze holds until you shatter it');
  const boss = seize('apprentice-ice-tomb', 'test-apprentice-t3-immune');
  assert.equal(getStatusEffect(boss.tracksCombat, 'brittle')!.remainingMs, 6000, 'and a brittle boss stays brittle');
}
{
  const run = (spec: string | undefined) => {
    const s = setup({ discipline: FROST, spec, placements: [] });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return target;
  };
  const creeping = run('apprentice-creeping-frost');
  assert.ok(has(creeping, 'dot-frozen'), 'Creeping Frost: a target at the cap freezes on its own');
  assert.ok(sigils(creeping) > 0, 'and keeps its sigils');
  assert.ok(!has(run(undefined), 'dot-frozen'), 'no pick, no creeping freeze');
}
{
  const run = (spec: string | undefined) => {
    const s = setup({ discipline: FROST, spec, placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    const iced = s.spawn(470, 400);
    const plain = s.spawn(430, 450);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    frozen(target);
    frozen(iced);
    step(s.world, s.player, target);
    return { iced, plain, target };
  };
  const storm = run('apprentice-shardstorm');
  assert.equal(sigils(storm.target), 0, 'the shatter went off');
  assert.ok(!has(storm.iced, 'dot-frozen'), 'Shardstorm: a frozen enemy hit by a shard shatters too');
  assert.ok(sigils(storm.plain) >= 1, 'and a shard lays a frost sigil on the others');
  const plainRun = run(undefined);
  assert.ok(has(plainRun.iced, 'dot-frozen') && sigils(plainRun.plain) === 0, 'without it there are no shards');
}

// ── T3 lessons ───────────────────────────────────────────────────────────────
{
  // Seize II: a second wind-up within a few seconds is caught too.
  const run = (tier: 2 | 3) => {
    const s = setup({ tier, placements: [place('enemy-winds-up', 'apprentice-seize')] });
    const target = s.spawn(430, 400);
    laySigils(s.world, s.player, target, 4, s.cap);
    recordMoment(s.world, s.player, 'enemy-winds-up');
    step(s.world, s.player, target);
    assert.equal(sigils(target), 0, 'Seize spends the sigils');
    step(s.world, s.player, target, 4);
    setCounter(target.tracksCombat, 'chargeCastEndsAt', clock + 5_000);
    recordMoment(s.world, s.player, 'enemy-winds-up');
    step(s.world, s.player, target);
    return getCounter(target.tracksCombat, 'chargeCastEndsAt');
  };
  assert.equal(run(3), 0, 'Seize II: the second wind-up is broken, with no sigils spent');
  assert.ok(run(2) > 0, 'at rank 1 it is not');
}
{
  // Seep II: when the enemy surfaces, its sigils burst onto the enemies near the spot.
  const run = (tier: 2 | 3) => {
    const s = setup({ tier, placements: [place('target-out-of-reach', 'apprentice-seep')] });
    const hidden = s.spawn(430, 400);
    const near = s.spawn(470, 400);
    laySigils(s.world, s.player, hidden, 3, s.cap);
    attachComponent(s.world, hidden, 'isInvulnerable', {});
    step(s.world, s.player, undefined, 2);
    detachComponent(s.world, hidden, 'isInvulnerable');
    step(s.world, s.player, undefined, 2);
    return sigils(near);
  };
  assert.equal(run(3), 3, 'Seep II: the sigils burst onto its neighbours when it surfaces');
  assert.equal(run(2), 0, 'at rank 1 they do not');
}
{
  // Spore Burst: spend the target's sigils, half each onto everything around it.
  const { world, player, spawn, cap } = setup({ placements: [place('target-full', 'apprentice-spore-burst')] });
  const target = spawn(430, 400);
  const near = spawn(470, 400);
  const far = spawn(900, 900);
  laySigils(world, player, target, cap, cap);
  step(world, player, target);
  assert.equal(sigils(target), 0, 'Spore Burst spends the sigils');
  assert.equal(sigils(near), Math.floor(cap / 2), 'and each neighbour catches half');
  assert.equal(sigils(far), 0, 'an enemy out of reach catches none');
}
{
  // Snag II: the root also holds every enemy near the snagged one.
  const run = (tier: 2 | 3) => {
    const s = setup({ tier, placements: [place('target-flees', 'apprentice-snag')] });
    const kiter = s.spawn(430, 400, 'test-apprentice-t3-kiter');
    const near = s.spawn(470, 400);
    setAggroTarget(s.world, kiter, { kind: 'player', id: 'apprentice' }, clock);
    attachComponent(s.world, kiter, 'isMoving', { motion: { vx: 0, vy: 0 } } as never);
    laySigils(s.world, s.player, kiter, s.cap, s.cap);
    step(s.world, s.player, kiter);
    assert.ok(monsterHasLiveRoot(kiter), 'the kiter is rooted');
    return monsterHasLiveRoot(near);
  };
  assert.ok(run(3), 'Snag II: the root also holds its neighbour');
  assert.ok(!run(2), 'at rank 1 it does not');
}
{
  // Signal Fire: detonating the target sets off the furthest carrier too.
  const run = (signal: boolean) => {
    const s = setup({ signal, placements: [place('target-full', 'apprentice-detonate')] });
    const target = s.spawn(430, 400);
    const middle = s.spawn(600, 400);
    const furthest = s.spawn(900, 700);
    for (const m of [middle, furthest]) laySigils(s.world, s.player, m, 2, s.cap);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    step(s.world, s.player, target);
    return { middle: sigils(middle), furthest: sigils(furthest) };
  };
  assert.deepEqual(run(true), { middle: 2, furthest: 0 }, 'Signal Fire: the furthest carrier goes off, the others stay');
  assert.deepEqual(run(false), { middle: 2, furthest: 2 }, 'without it nothing else goes off');
}
{
  // Cinderfall: the blast hits everything around the target, each paying a share.
  const { world, player, spawn, cap } = setup({ placements: [place('target-full', 'apprentice-cinderfall')] });
  const target = spawn(430, 400);
  const near = spawn(480, 400);
  const far = spawn(900, 900);
  laySigils(world, player, target, cap, cap);
  step(world, player, target);
  assert.equal(sigils(target), 0, 'Cinderfall spends the sigils');
  assert.ok(near.hasHealth.hp < near.hasHealth.maxHp, 'and hurts what is around it');
  assert.equal(far.hasHealth.hp, far.hasHealth.maxHp, 'but not what is far');
}
{
  // Melt and Ice Veil: the Chill on you reaches its threshold.
  const chill = (player: PlayerEntity, stacks: number) => {
    const effect = applyStatusEffect(player.tracksCombat, { id: 'tundra-chill', maxStacks: 6, remainingMs: 60_000, sourceId: 'node', data: {} });
    effect.stacks = stacks;
  };
  const { world, player, spawn, cap } = setup({ placements: [place('chill-threshold', 'apprentice-melt')], passives: { 'apprentice.ice-veil': 1 } });
  const nearest = spawn(430, 400);
  const other = spawn(520, 400);
  laySigils(world, player, nearest, 3, cap);
  laySigils(world, player, other, 3, cap);
  step(world, player, undefined, 2);
  chill(player, 2);
  step(world, player);
  assert.equal(sigils(nearest), 3, 'below the threshold nothing happens');
  chill(player, 3);
  step(world, player);
  assert.equal(sigils(nearest), 0, 'Melt: the nearest enemy gives up its sigils');
  assert.equal(sigils(other), 3, 'and only that one');
  assert.ok(!has(player, 'tundra-chill'), 'to melt the Chill off you');
  assert.ok(has(other, 'ability-slowed') && has(nearest, 'ability-slowed'), 'Ice Veil: every carrier around you is numbed');
}

// ── Trophies ─────────────────────────────────────────────────────────────────
{
  // Frostheart: every Seize also leaves its target brittle after the hold.
  const { world, player, spawn } = setup({ relic: ['apprentice-relic-tundra'], bossesCleared: ['tundra:3'], placements: [place('enemy-winds-up', 'apprentice-seize')] });
  const target = spawn(430, 400);
  laySigils(world, player, target, 3, 6);
  recordMoment(world, player, 'enemy-winds-up');
  step(world, player, target);
  assert.ok(!has(target, 'brittle'), 'Frostheart: not brittle while it is held');
  step(world, player, target, 30);
  const brittle = getStatusEffect(target.tracksCombat, 'brittle');
  assert.ok(brittle && brittle.data['apprenticeBrittle'] === 1, 'brittle once the hold ends');
}
{
  // Magma Core: sigils on a shelled enemy keep ticking at full through the shell.
  const lost = (relic: string[]) => {
    const { world, player, spawn } = setup({ relic, bossesCleared: ['volcanic:3'], placements: [] });
    const target = spawn(430, 400);
    target.mitigatesDamage.damageReduction = 0.6;
    applyStatusEffect(target.tracksCombat, {
      id: 'barrier:test', maxStacks: 1, remainingMs: 20_000, sourceId: target.isMonster.id,
      data: { monsterWard: 1, wardAmount: 1_000_000, wardMaxAmount: 1_000_000, totalMs: 20_000 },
    });
    syncEnemyBarrierState(world, clock);
    laySigils(world, player, target, 3, 6);
    step(world, player, target);
    getStatusEffect(target.tracksCombat, SIGIL)!.data['nextTickIn'] = 0;
    const hp = target.hasHealth.hp;
    updateDotArchetype(world, 100, clock);
    return hp - target.hasHealth.hp;
  };
  assert.ok(lost(['apprentice-relic-volcanic']) > lost([]), 'Magma Core: a shelled enemy takes the full tick');
}
{
  const param = (relic: string, cleared: string[], key: string, fallback: number): number => {
    const { world, player } = setup({ relic: [relic], bossesCleared: cleared });
    return trophyParam(payoffsOf(world, player)!, key, fallback);
  };
  assert.equal(param('apprentice-relic-swamp', ['swamp:1', 'swamp:2', 'swamp:3'], 'radius', 0), 480, 'Glut III reaches further');
  assert.equal(param('apprentice-relic-mountain', ['mountain:1', 'mountain:2', 'mountain:3'], 'holdMult', 0), 2, 'Petrify III holds longer');
  assert.equal(param('apprentice-relic-cave', ['cave:1', 'cave:2', 'cave:3'], 'everyMs', 0), 1000, 'Brood Sigils III, the last rank');
  assert.equal(param('apprentice-relic-jungle', ['jungle:2', 'jungle:3'], 'tickMult', 0), 2, 'Scent II ticks faster still');
  assert.equal(param('apprentice-relic-desert', ['desert:2', 'desert:3'], 'extraNeighbours', 0), 1, 'Dune Wind II');
}
{
  // Dune Wind II: a Spread passes to one more enemy.
  const spreadTo = (cleared: string[]): number => {
    const { world, player, spawn, cap } = setup({ relic: ['apprentice-relic-desert'], bossesCleared: cleared });
    const target = spawn(430, 400);
    const others = [spawn(460, 410), spawn(470, 380), spawn(480, 400), spawn(450, 430)];
    for (const m of [target, ...others]) setAggroTarget(world, m, { kind: 'player', id: 'apprentice' }, clock);
    laySigils(world, player, target, cap, cap);
    step(world, player, target);
    return others.reduce((n, m) => n + sigils(m), 0);
  };
  assert.equal(spreadTo(['desert:2', 'desert:3']), spreadTo(['desert:2']) + 1, 'Dune Wind II: a Spread reaches one more enemy');
}

// ── Gear jobs ────────────────────────────────────────────────────────────────
{
  for (const id of ['apprentice-glacial-wand-t3', 'apprentice-glacial-wand-t4', 'apprentice-magma-censer-t3', 'apprentice-magma-censer-t4']) {
    assert.ok(Object.keys(ITEM_DATABASE.get(id)!.mechanicEffects ?? {}).length > 0, `${id} does something`);
  }
  for (const tier of ['t3', 't4']) {
    for (const slot of ['tundra-vest', 'tundra-charm', 'volcanic-vest', 'volcanic-charm']) {
      const line = CLASS_GEAR.dot.lines[`${slot}-${tier}`];
      assert.ok(line && Object.keys(line.effects).length > 0, `${slot}-${tier} does something`);
    }
  }
}
{
  // Glacial Wand: sigils on a chilled or slowed enemy last twice as long.
  const life = (wand: boolean, slow: boolean): number => {
    const { world, player, spawn, cap } = setup({ placements: [], passives: wand ? { 'apprentice.chill-linger': 2 } : {} });
    const target = spawn(430, 400);
    if (slow) applyMonsterSlow(world, target, 0.3, 5000, 'apprentice');
    laySigils(world, player, target, 1, cap);
    return getStatusEffect(target.tracksCombat, SIGIL)!.remainingMs;
  };
  assert.equal(life(true, true), life(false, true) * 2, 'Glacial Wand: a slowed enemy keeps its sigils twice as long');
  assert.equal(life(true, false), life(false, false), 'and an unslowed one does not');
}
{
  // Magma Censer: sigils tick harder for each step of the Heat.
  const damage = (wand: boolean): number => {
    const { world, player, spawn, cap } = setup({ placements: [], passives: wand ? { 'apprentice.heat-tick': 0.02 } : {} });
    const heat = applyStatusEffect(player.tracksCombat, { id: 'volcanic-heat', maxStacks: 0, remainingMs: 60_000, sourceId: 'node', data: {} });
    heat.stacks = 10;
    const target = spawn(430, 400);
    laySigils(world, player, target, 1, cap);
    return getStatusEffect(target.tracksCombat, SIGIL)!.data['damagePerStack']!;
  };
  assert.ok(damage(true) > damage(false), 'Magma Censer: Heat makes the sigils tick harder');
}
{
  // Cold Comfort and Banked Coals: Recovery.
  const { world, player, spawn, cap } = setup({ placements: [], passives: { 'apprentice.cold-comfort': 2, 'apprentice.banked-coals': 0.02 } });
  const a = spawn(430, 400);
  laySigils(world, player, a, 1, cap);
  step(world, player, a);
  assert.equal(getResource(player.tracksCombat, APPRENTICE_RECOVERY_X), 1, 'nothing frozen, no Heat: no change');
  frozen(a);
  step(world, player, a);
  assert.equal(getResource(player.tracksCombat, APPRENTICE_RECOVERY_X), 2, 'Cold Comfort: Recovery doubles while a carrier is frozen');
  a.tracksCombat.statusEffects = a.tracksCombat.statusEffects.filter((e) => e.id !== 'dot-frozen');
  const b = spawn(450, 400);
  const c = spawn(470, 400);
  for (const m of [b, c]) laySigils(world, player, m, 1, cap);
  const heat = applyStatusEffect(player.tracksCombat, { id: 'volcanic-heat', maxStacks: 0, remainingMs: 60_000, sourceId: 'node', data: {} });
  heat.stacks = 10;
  step(world, player, a);
  assert.ok(getResource(player.tracksCombat, APPRENTICE_RECOVERY_X) > 1, 'Banked Coals: Recovery rises with the Heat while three carry sigils');
}
{
  // Ashguard: a burning hit on you lays a sigil on its shooter.
  const run = (ashguard: boolean): number => {
    const { world, player, spawn } = setup({ placements: [], passives: ashguard ? { 'apprentice.ashguard': 1 } : {} });
    const shooter = spawn(430, 400, 'test-apprentice-t3-fire');
    setAggroTarget(world, shooter, { kind: 'player', id: 'apprentice' }, clock);
    clock += 5_000;
    runMonsterAttack(world, shooter, player, clock);
    return sigils(shooter);
  };
  assert.ok(run(true) >= 1, 'Ashguard: the shooter of a burning hit catches a sigil');
  assert.equal(run(false), 0, 'and not without it');
}

console.log('apprenticeT3: ok');
