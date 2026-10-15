/**
 * The Spirit's Tier 2 wiring (bible §11.5, §11.8, §11.16): the three disciplines (Overflow's brim,
 * Tide's ebb and surge, Reservoir's deep bank and release), the T2 pieces, the trophy rank-ups and
 * the Jungle and Desert trophies, and the T2 gear jobs. Wiring only: attach, tick, assert observable
 * state, never balance numbers.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  hasStatusEffect,
  MONSTER_DATABASE,
  ABILITY_SLOW_EFFECT_ID,
  getStatusEffect,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { drainStorm, thresholdsOf, updateSpirit } from '../src/systems/classes/archetypes/energy/spirit';
import { lingeringCount } from '../src/systems/classes/archetypes/energy/spiritT2';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { isMonsterKnockedBack, updateKnockback } from '../src/systems/combat/damage/knockback';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { recordMoment, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { isMonsterStunned } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { plains: 12, forest: 12, swamp: 12, mountain: 12, cave: 12, jungle: 12, desert: 12 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-spirit-dummy', { ...base, id: 'test-spirit-dummy', evasion: 0 });

let clock = 100_000;

interface Opts {
  discipline?: string;
  relic?: string[];
  bossesCleared?: string[];
  bands?: string[];
  edit?: (c: ThresholdsConfig) => void;
  passives?: Record<string, number>;
}

function setup(opts: Opts = {}) {
  const world = new World();
  const bossesCleared = opts.bossesCleared ?? [];
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'spirit', name: 'Spirit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 2, currentSkillTier: 0, bossesCleared, clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['energy-root'], passives: {}, selectedClass: 'energy-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'energy',
      disciplineId: opts.discipline ?? null,
    },
  } as PersistedPlayerSlices, 'spirit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'energy', biomeLevel: BIOMES, bossesCleared, disciplineId: opts.discipline ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'thresholds') {
    if (opts.bands) config.system.bands = opts.bands.map((pieceId) => ({ pieceId, atLeastPct: 30 }));
    opts.edit?.(config.system);
  }
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-spirit-dummy', { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn };
}

function run(world: World, player: PlayerEntity, ms: number): void {
  for (let t = 0; t < ms; t += 100) {
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateSpirit(world, player, 100, clock);
  }
}

function strike(world: World, player: PlayerEntity, monster: MonsterEntity, damage: number, kind: 'onDamageTaken' | 'afterHit' = 'onDamageTaken'): number {
  const ctx = makeCombatContext(monster, 'monster', player, 'player');
  ctx.damage = damage;
  emitCombatEvent(kind, ctx, world);
  return ctx.damage;
}

const maxOf = (p: PlayerEntity): number => p.usesEnergy!.energyMax;

// ── The kit is reached: T2 pieces, the discipline and the trophy ranks arrive ──
{
  const { world, player } = setup({ discipline: 'spirit-reservoir', relic: ['spirit-relic-swamp'], bossesCleared: ['swamp:1', 'swamp:2'] });
  const t = thresholdsOf(world, player)!;
  assert.equal(t.discipline, 'spirit-reservoir', 'the discipline reaches the runtime');
  for (const id of ['spirit-gale', 'spirit-hailstorm', 'spirit-flare', 'spirit-dust-devil', 'spirit-updraft', 'spirit-cloudburst']) {
    assert.ok(t.owned.has(id), `${id} is learned`);
  }
  assert.ok(!t.owned.has('spirit-ball-lightning'), 'only the picked discipline gives its piece');
  assert.equal(t.trophyRank, 2, 'the T2 boss ranks the trophy up');
  assert.equal(t.ranks.get('spirit-thunderclap'), 2, 'Thunderclap II is learned');
}

// ── Overflow: a brim, not a cap; the excess arcs off into enemies near you ───
{
  const { world, player, spawn } = setup({ discipline: 'spirit-overflow' });
  run(world, player, 40_000);
  assert.ok(player.usesEnergy!.energy > maxOf(player), 'the storm rises past the brim (and shields you)');
  assert.ok(player.usesEnergy!.energy <= maxOf(player) * 1.5 + 1e-6, 'but not without limit');
  const near = spawn(440, 400);
  const far = spawn(400, 900);
  const nearHp = near.hasHealth.hp;
  run(world, player, 2_000);
  assert.ok(near.hasHealth.hp < nearHp, 'the spill arcs off you into the nearby enemy');
  assert.equal(far.hasHealth.hp, 1_000_000, 'and reaches only enemies near you');
}

// ── Tide: no spends in the ebb, no gathering in the surge ────────────────────
{
  const { world, player, spawn } = setup({ discipline: 'spirit-tide', edit: (c) => { c.bands = [{ pieceId: 'spirit-bolt', atLeastPct: 30 }]; } });
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  player.usesEnergy!.energy = 0;
  run(world, player, 500);
  assert.equal(target.hasHealth.hp, 1_000_000, 'the ebb cannot spend');
  assert.equal(getResource(player.tracksCombat, 'spirit.tideSurge'), 0);
  run(world, player, 15_000);
  assert.ok(target.hasHealth.hp < 1_000_000, 'the surge spends');
  let surged = false;
  let ebbedAgain = false;
  for (let i = 0; i < 400; i++) {
    run(world, player, 100);
    if (getResource(player.tracksCombat, 'spirit.tideSurge') > 0) surged = true;
    else if (surged) ebbedAgain = true;
  }
  assert.ok(surged && ebbedAgain, 'the storm comes in waves: ebb, surge, ebb');
}
{
  // Storm Surge opens the surge with a wave through the enemies in front.
  const { world, player, spawn } = setup({ discipline: 'spirit-tide', edit: (c) => { c.bands = []; } });
  const front = spawn(480, 400);
  const behind = spawn(320, 400);
  setAttackTarget(world, player, front.isMonster.id);
  run(world, player, 100);
  player.usesEnergy!.energy = maxOf(player) - 1;
  run(world, player, 300);
  assert.ok(front.hasHealth.hp < 1_000_000, 'the surge opens with a wave in front of you');
  assert.equal(behind.hasHealth.hp, 1_000_000, 'and not behind you');
}

// ── Reservoir: a deeper bank, released the moment it is enough ───────────────
{
  const plain = setup();
  const deep = setup({ discipline: 'spirit-reservoir', edit: (c) => { c.bands = [{ pieceId: 'spirit-cloudburst', atLeastPct: 100 }]; } });
  run(plain.world, plain.player, 100);
  run(deep.world, deep.player, 100);
  assert.ok(maxOf(deep.player) > maxOf(plain.player) * 1.8, 'a much deeper bottle');
  const weak = deep.spawn(500, 400);
  weak.hasHealth.hp = weak.hasHealth.maxHp = 1;
  setAttackTarget(deep.world, deep.player, weak.isMonster.id);
  deep.player.usesEnergy!.energy = 0.5 * maxOf(deep.player);
  run(deep.world, deep.player, 300);
  assert.ok(weak.hasHealth.hp <= 0 || !deep.world.getMonsterEntity(weak.isMonster.id), 'the bank goes the moment it would kill the target, from afar');
  const floor = 0.3 * maxOf(deep.player);
  assert.ok(deep.player.usesEnergy!.energy < 0.5 * maxOf(deep.player) && deep.player.usesEnergy!.energy >= floor - 1, 'the release spends down to the floor and no further');
}
{
  // No kill in reach and the mark not reached: the bank is held.
  const { world, player, spawn } = setup({ discipline: 'spirit-reservoir', edit: (c) => { c.bands = [{ pieceId: 'spirit-cloudburst', atLeastPct: 100 }]; } });
  const tank = spawn(430, 400);
  setAttackTarget(world, player, tank.isMonster.id);
  run(world, player, 100);
  player.usesEnergy!.energy = 0.6 * maxOf(player);
  run(world, player, 200);
  assert.equal(tank.hasHealth.hp, 1_000_000, 'the dam holds until it is enough (or the mark)');
}

// ── Pieces ───────────────────────────────────────────────────────────────────
{
  // Gale: blows enemies in front back, and a charge caught in it stops dead.
  const { world, player, spawn } = setup({ bands: ['spirit-gale'] });
  const front = spawn(470, 400);
  const behind = spawn(330, 400);
  front.controlsMonster.chargeRemainingMs = 1_000;
  setAttackTarget(world, player, front.isMonster.id);
  run(world, player, 12_000);
  assert.ok(isMonsterKnockedBack(world, front.isMonster.id) || front.hasPosition.current.x > 470, 'Gale blows the enemy in front back');
  assert.equal(front.controlsMonster.chargeRemainingMs, 0, 'a charge caught in it stops dead');
  assert.ok(!isMonsterKnockedBack(world, behind.isMonster.id), 'not the one behind you');
}
{
  // Flare waits for an ambush and staggers around you.
  const { world, player, spawn } = setup({ bands: ['spirit-flare'] });
  const mon = spawn(450, 400);
  run(world, player, 12_000);
  assert.ok(!isMonsterStunned(world, mon.isMonster.id), 'Flare waits for an ambush');
  recordMoment(world, player, 'ambush');
  run(world, player, 100);
  assert.ok(isMonsterStunned(world, mon.isMonster.id), 'Flare staggers the ambusher');
}
{
  // Dust Devil waits for a ranged attacker and drags the farthest one in.
  const { world, player, spawn } = setup({ bands: ['spirit-dust-devil'] });
  const archer = spawn(700, 400);
  archer.performsAttack.attackRange = 300;
  setAggroTarget(world, archer, { kind: 'player', id: player.isPlayer.id }, clock);
  let nearest = 700;
  for (let i = 0; i < 150; i++) {
    run(world, player, 100);
    updateKnockback(world, 100);
    nearest = Math.min(nearest, archer.hasPosition.current.x);
  }
  assert.ok(nearest < 700, 'Dust Devil drags the ranged attacker toward you');
}
{
  // Hailstorm leaves hail on the ground; Ball Lightning leaves an orb in flight.
  const hail = setup({ bands: ['spirit-hailstorm'] });
  const target = hail.spawn(440, 400);
  setAttackTarget(hail.world, hail.player, target.isMonster.id);
  run(hail.world, hail.player, 12_000);
  assert.ok(target.hasHealth.hp < 1_000_000, 'Hailstorm pelts the target');
  const orb = setup({ discipline: 'spirit-overflow', bands: ['spirit-ball-lightning'] });
  const victim = orb.spawn(440, 400);
  setAttackTarget(orb.world, orb.player, victim.isMonster.id);
  let seen = 0;
  for (let i = 0; i < 160; i++) { run(orb.world, orb.player, 100); seen = Math.max(seen, lingeringCount(orb.player)); }
  assert.ok(seen > 0, 'Ball Lightning is an orb in flight');
}
{
  // Thunderclap II: the clap also slows attacks. Downpour II: it also washes Corrosion and slows.
  const { world, player, spawn } = setup({ bands: ['spirit-thunderclap'] });
  const mon = spawn(420, 400);
  setAggroTarget(world, mon, { kind: 'player', id: player.isPlayer.id }, clock);
  run(world, player, 12_000);
  assert.ok(isMonsterStunned(world, mon.isMonster.id) || getStatusEffect(mon.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'the clap staggered');
  assert.ok((getStatusEffect(mon.tracksCombat, ABILITY_SLOW_EFFECT_ID)?.data['attackSlowPct'] ?? 0) > 0, 'Thunderclap II: what it staggers also attacks slower');
}
{
  const { world, player } = setup({ bands: ['spirit-downpour'] });
  applyStatusEffect(player.tracksCombat, { id: 'monster-dot:poison', maxStacks: 3, remainingMs: 9_000, refreshable: true, sourceId: 'x', instanced: false, data: { isDot: 1, damagePerStack: 1, nextTickIn: 1000, tickIntervalMs: 1000 } } as never);
  applyStatusEffect(player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 9_000, refreshable: true, sourceId: 'x', data: {} } as never);
  run(world, player, 12_000);
  assert.ok(!hasStatusEffect(player.tracksCombat, 'monster-dot:poison'), 'Downpour washes the poison');
  assert.ok(!hasStatusEffect(player.tracksCombat, 'slow'), 'Downpour II washes the slow too');
}
{
  // Updraft waits for a ground telegraph under you; with none it does not fire (and does not throw).
  const { world, player } = setup({ bands: ['spirit-updraft'] });
  const before = { ...player.hasPosition.current };
  run(world, player, 12_000);
  assert.deepEqual(player.hasPosition.current, before, 'no telegraph, no gust');
}

// ── Trophy ranks and the Jungle and Desert trophies ──────────────────────────
{
  const { world, player, spawn } = setup({ relic: ['spirit-relic-plains'], bossesCleared: ['plains:1', 'plains:2'], bands: ['spirit-bolt'] });
  const target = spawn(430, 400);
  const others = [spawn(460, 400), spawn(480, 410), spawn(500, 420)];
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 15_000);
  assert.ok(others.every((m) => m.hasHealth.hp < 1_000_000), 'Crosswind II: every spend strikes three enemies');
}
{
  const { world, player, spawn } = setup({ relic: ['spirit-relic-swamp'], bossesCleared: ['swamp:1', 'swamp:2'] });
  const mon = spawn(430, 400);
  applyStatusEffect(player.tracksCombat, { id: 'monster-dot:poison', maxStacks: 3, remainingMs: 9_000, refreshable: true, sourceId: 'x', instanced: false, data: { isDot: 1, damagePerStack: 1, nextTickIn: 1000, tickIntervalMs: 1000 } } as never);
  run(world, player, 20_000);
  player.usesEnergy!.energy = 5;
  strike(world, player, mon, 50);
  assert.ok(!hasStatusEffect(player.tracksCombat, 'monster-dot:poison'), 'Marsh Fire II: the burst also washes a debuff off you');
}
{
  const { world, player, spawn } = setup({ relic: ['spirit-relic-forest'], bossesCleared: ['forest:1', 'forest:2'], bands: ['spirit-bolt'], edit: (c) => { c.phase = 'hover'; } });
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 8_000);
  assert.ok(getResource(player.tracksCombat, 'spirit.squallStreak') >= 2, 'Squall II counts the spends in a row, so the discount builds');
}
{
  // Running Storm: a spend follows a target that ran past normal reach.
  const withTrophy = setup({ relic: ['spirit-relic-jungle'], bossesCleared: ['jungle:2'], bands: ['spirit-bolt'] });
  const without = setup({ bands: ['spirit-bolt'] });
  for (const s of [withTrophy, without]) {
    const runner = s.spawn(750, 400); // 350 px: past the 260 reach, inside the follow
    setAttackTarget(s.world, s.player, runner.isMonster.id);
    run(s.world, s.player, 15_000);
    const hp = runner.hasHealth.hp;
    if (s === withTrophy) assert.ok(hp < 1_000_000, 'Running Storm: the spend follows the target that ran');
    else assert.equal(hp, 1_000_000, 'without it a target out of reach is left alone');
  }
}
{
  // Sandstorm: while above the floor, a ring of sand slows enemies inside it.
  const { world, player, spawn } = setup({ relic: ['spirit-relic-desert'], bossesCleared: ['desert:2'], edit: (c) => { c.bands = []; } });
  const inside = spawn(480, 400);
  const outside = spawn(400, 900);
  run(world, player, 15_000);
  assert.ok(getStatusEffect(inside.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'the ring slows the enemy inside it');
  assert.ok(!getStatusEffect(outside.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'and only inside it');
}

// ── T2 gear jobs ─────────────────────────────────────────────────────────────
{
  // Lurker's Rod: the first spend on each new target costs nothing.
  const hover = (c: ThresholdsConfig): void => { c.phase = 'hover'; };
  const free = setup({ bands: ['spirit-bolt'], edit: hover, passives: { 'spirit.first-free': 1 } });
  const paid = setup({ bands: ['spirit-bolt'], edit: hover });
  for (const s of [free, paid]) {
    const target = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = 0.5 * maxOf(s.player);
    run(s.world, s.player, 100);
  }
  assert.ok(free.player.usesEnergy!.energy > paid.player.usesEnergy!.energy, "Lurker's Rod: the first spend on a new target is free");
}
{
  // Sirocco Staff: your spends reach much farther.
  const near = setup({ bands: ['spirit-bolt'] });
  const far = setup({ bands: ['spirit-bolt'], passives: { 'spirit.reach-x': 1.6 } });
  for (const s of [near, far]) {
    const target = s.spawn(780, 400); // 380 px
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 15_000);
    if (s === far) assert.ok(target.hasHealth.hp < 1_000_000, 'Sirocco Staff: the spend reaches 380 px');
    else assert.equal(target.hasHealth.hp, 1_000_000, 'without it the same target is out of reach');
  }
}
{
  // Stormsense: an ambush cannot drain the storm below your floor.
  const { world, player, spawn } = setup({ passives: { 'spirit.stormsense': 1 } });
  const mon = spawn(430, 400);
  run(world, player, 30_000);
  const floor = 0.3 * maxOf(player);
  recordMoment(world, player, 'ambush');
  const left = strike(world, player, mon, maxOf(player) * 2);
  assert.ok(player.usesEnergy!.energy >= floor - 1e-6, 'the storm stays at the floor');
  assert.ok(left > 0, 'and the rest of the blow lands on you');
}
{
  // Sandshroud: ranged hits drain the storm at half cost.
  const { world, player, spawn } = setup({ passives: { 'spirit.ranged-cost': 0.5 } });
  const archer = spawn(430, 400);
  archer.performsAttack.attackRange = 300;
  run(world, player, 30_000);
  const before = player.usesEnergy!.energy;
  drainStorm(world, player, 10, 'hit', archer);
  assert.ok(Math.abs(before - player.usesEnergy!.energy - 5) < 1e-6, 'a ranged hit costs half');
}
{
  // Monsoon: after an ambush hits you, the storm gathers three times as fast for a few seconds.
  const { world, player, spawn } = setup({ passives: { 'spirit.monsoon-x': 3 }, edit: (c) => { c.bands = []; } });
  const mon = spawn(430, 400);
  setAggroTarget(world, mon, { kind: 'player', id: player.isPlayer.id }, clock);
  player.usesEnergy!.energy = 0;
  run(world, player, 100);
  const slow = player.usesEnergy!.energy;
  recordMoment(world, player, 'ambush');
  strike(world, player, mon, 1, 'afterHit');
  player.usesEnergy!.energy = 0;
  run(world, player, 100);
  assert.ok(player.usesEnergy!.energy > slow * 2, 'Monsoon: the storm gathers faster after an ambush');
}
{
  // Oasis: while you are slowed, the storm gathers faster.
  const plain = setup({ edit: (c) => { c.bands = []; } });
  const oasis = setup({ passives: { 'spirit.oasis-pct': 0.5 }, edit: (c) => { c.bands = []; } });
  applyStatusEffect(oasis.player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 9_000, refreshable: true, sourceId: 'x', data: {} } as never);
  plain.player.usesEnergy!.energy = 0;
  oasis.player.usesEnergy!.energy = 0;
  run(plain.world, plain.player, 100);
  run(oasis.world, oasis.player, 100);
  assert.ok(oasis.player.usesEnergy!.energy > plain.player.usesEnergy!.energy * 1.3, 'Oasis: slowed, the storm gathers faster');
}

console.log('spiritT2: ok');
