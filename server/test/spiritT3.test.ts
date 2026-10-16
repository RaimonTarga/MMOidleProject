/**
 * The Spirit's Tier 3 wiring (bible §11.6, §11.9, §11.16): the nine specializations, the T3 lessons,
 * the trophy rank-ups and the Tundra and Volcanic trophies, and the T3 gear jobs. Wiring only: attach,
 * tick, assert observable state, never balance numbers.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_SLOW_EFFECT_ID,
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  hasStatusEffect,
  MONSTER_DATABASE,
  setCounter,
  setResource,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { drainStorm, thresholdsOf, updateSpirit } from '../src/systems/classes/archetypes/energy/spirit';
import { fireFoehn, fireTailwind, glazeCount } from '../src/systems/classes/archetypes/energy/spiritT3';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { recordMoment, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { isMonsterStunned } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { plains: 30, forest: 30, swamp: 30, mountain: 30, cave: 30, jungle: 30, desert: 30, tundra: 30, volcanic: 30 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-spirit-dummy', { ...base, id: 'test-spirit-dummy', evasion: 0 });
MONSTER_DATABASE.set('test-spirit-fire', { ...base, id: 'test-spirit-fire', evasion: 0, biome: 'volcanic' });

let clock = 100_000;
const FULL = 1_000_000;

interface Opts {
  discipline?: string;
  spec?: string;
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
      playerTier: 3, currentSkillTier: 0, bossesCleared, clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: opts.spec ? ['energy-root', opts.spec] : ['energy-root'], passives: {}, selectedClass: 'energy-root',
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
  const spawn = (x: number, y: number, type = 'test-spirit-dummy'): MonsterEntity => {
    const m = world.createMonster(NODE, type, { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = FULL;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn };
}

type Rig = ReturnType<typeof setup>;

function run(world: World, player: PlayerEntity, ms: number): void {
  for (let t = 0; t < ms; t += 100) {
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateSpirit(world, player, 100, clock);
  }
}

function strike(world: World, player: PlayerEntity, monster: MonsterEntity, damage: number): number {
  const ctx = makeCombatContext(monster, 'monster', player, 'player');
  ctx.damage = damage;
  emitCombatEvent('onDamageTaken', ctx, world);
  return ctx.damage;
}

const maxOf = (p: PlayerEntity): number => p.usesEnergy!.energyMax;
const lost = (m: MonsterEntity): number => FULL - m.hasHealth.hp;
const hover = (c: ThresholdsConfig): void => { c.phase = 'hover'; };
const noBands = (c: ThresholdsConfig): void => { c.bands = []; };
const addStatus = (p: PlayerEntity, id: string, stacks: number, data: Record<string, number> = {}): void => {
  applyStatusEffect(p.tracksCombat, { id, maxStacks: 20, remainingMs: -1, refreshable: false, sourceId: 'x', instanced: false, data } as never);
  getStatusEffect(p.tracksCombat, id)!.stacks = stacks;
};

// ── The kit is reached: T3 lessons, the specialization and the trophy ranks arrive ──
{
  const { world, player } = setup({ discipline: 'spirit-tide', spec: 'spirit-breakwater', relic: ['spirit-relic-swamp'], bossesCleared: ['swamp:1', 'swamp:2', 'swamp:3'] });
  const t = thresholdsOf(world, player)!;
  assert.equal(t.spec, 'spirit-breakwater', 'the specialization reaches the runtime');
  for (const id of ['spirit-downburst', 'spirit-tailwind', 'spirit-forked-bolt', 'spirit-foehn', 'spirit-ash-lightning']) assert.ok(t.owned.has(id), `${id} is learned`);
  assert.equal(t.ranks.get('spirit-updraft'), 2, 'Updraft II is learned');
  assert.equal(t.ranks.get('spirit-dust-devil'), 2, 'Dust Devil II is learned');
  assert.equal(t.trophyRank, 3, 'the T3 boss ranks the trophy up');
  const other = setup({ discipline: 'spirit-tide', spec: 'spirit-stormdancer' });
  assert.equal(thresholdsOf(other.world, other.player)!.spec, null, "another discipline's specialization is ignored");
}

// ── Overflow specializations ─────────────────────────────────────────────────
{
  // Stormdancer: while overflowing you blink between enemies; each landing lets loose a burst.
  const { world, player, spawn } = setup({ discipline: 'spirit-overflow', spec: 'spirit-stormdancer', edit: noBands });
  const mon = spawn(700, 400);
  run(world, player, 40_000);
  assert.ok(getResource(player.tracksCombat, 'spirit.blinkAt') > 0, 'the Stormdancer blinked');
  assert.ok(player.hasPosition.current.x > 500, 'and landed beside the enemy');
  assert.ok(mon.hasHealth.hp < FULL, 'the landing let loose a burst of the spill');
  const plain = setup({ discipline: 'spirit-overflow', edit: noBands });
  plain.spawn(700, 400);
  run(plain.world, plain.player, 40_000);
  assert.ok(plain.player.hasPosition.current.x < 450, 'without it you stay where you stand');
}
{
  // Spillway: a spend made while overflowing carries the spill to its target.
  const way = setup({ discipline: 'spirit-overflow', spec: 'spirit-spillway', bands: ['spirit-bolt'], edit: hover });
  const plain = setup({ discipline: 'spirit-overflow', bands: ['spirit-bolt'], edit: hover });
  for (const s of [way, plain]) {
    const target = s.spawn(500, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = 1.4 * maxOf(s.player);
    run(s.world, s.player, 100);
  }
  assert.ok(way.player.usesEnergy!.energy < plain.player.usesEnergy!.energy, 'Spillway: the spend carries part of the spill with it');
}
{
  // Lightning Rod: the spill stops arcing around; all of it strikes your target.
  const rig = (spec?: string): { nearer: MonsterEntity; target: MonsterEntity } => {
    const s = setup({ discipline: 'spirit-overflow', spec, edit: noBands });
    const nearer = s.spawn(440, 400);
    const target = s.spawn(520, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 40_000);
    return { nearer, target };
  };
  const rod = rig('spirit-lightning-rod');
  const plain = rig();
  assert.equal(lost(rod.nearer), 0, 'Lightning Rod: the nearer enemy is not arced');
  assert.ok(lost(rod.target) > 0, 'all of it strikes your target');
  assert.ok(lost(plain.nearer) > 0, 'without it the spill arcs to the nearest');
}

// ── Tide specializations ─────────────────────────────────────────────────────
{
  // Spring Tide: every third tide runs twice as high.
  const peaksOf = (spec?: string): number[] => {
    const s = setup({ discipline: 'spirit-tide', spec, edit: (c) => { c.bands = [{ pieceId: 'spirit-bolt', atLeastPct: 30 }]; } });
    const target = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    const seen: number[] = [];
    let high = 0;
    for (let i = 0; i < 2400; i++) {
      run(s.world, s.player, 100);
      high = Math.max(high, s.player.usesEnergy!.energy / maxOf(s.player));
      if (getResource(s.player.tracksCombat, 'spirit.tideCount') > seen.length) { seen.push(high); high = 0; }
    }
    return seen;
  };
  const spring = peaksOf('spirit-spring-tide');
  const plain = peaksOf();
  assert.ok(spring.length >= 3, 'the tide turns several times');
  assert.ok(spring.some((p) => p > 1.5), 'Spring Tide: some ebb fills the bottle to double');
  assert.ok(spring.some((p) => p <= 1.0001), 'but not every ebb');
  assert.ok(plain.every((p) => p <= 1.0001), 'a plain Tide never rises past the bottle');
}
{
  // Slack Water: during the ebb, hits drain the storm at half cost.
  const dropIn = (spec?: string, surge = 0): number => {
    const s = setup({ discipline: 'spirit-tide', spec });
    const mon = s.spawn(430, 400);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = 0.6 * maxOf(s.player);
    setResource(s.player.tracksCombat, 'spirit.tideSurge', surge);
    const before = s.player.usesEnergy!.energy;
    drainStorm(s.world, s.player, 10, 'hit', mon);
    return before - s.player.usesEnergy!.energy;
  };
  assert.ok(Math.abs(dropIn('spirit-slack-water') * 2 - dropIn()) < 1e-6, 'Slack Water: an ebb hit costs half');
  assert.ok(Math.abs(dropIn('spirit-slack-water', 1) - 10) < 1e-6, 'and a surge hit costs full');
}
{
  // Breakwater: each surge ends in a wave over everything in front, sized by what the surge spent.
  const frontOf = (spec?: string): MonsterEntity => {
    const s = setup({ discipline: 'spirit-tide', spec, edit: (c) => { c.bands = [{ pieceId: 'spirit-bolt', atLeastPct: 30 }]; } });
    const target = s.spawn(430, 400);
    const front = s.spawn(480, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    for (let i = 0; i < 400 && getResource(s.player.tracksCombat, 'spirit.tideCount') < 1; i++) run(s.world, s.player, 100);
    assert.ok(getResource(s.player.tracksCombat, 'spirit.tideCount') >= 1, 'a surge ended');
    return front;
  };
  assert.ok(lost(frontOf('spirit-breakwater')) > lost(frontOf()), 'Breakwater: the surge ends in a wave over the enemies in front');
}

// ── Reservoir specializations ────────────────────────────────────────────────
const burstOnly = (c: ThresholdsConfig): void => { c.bands = [{ pieceId: 'spirit-cloudburst', atLeastPct: 100 }]; };
/** A full bank released on a tank at 430 (and a neighbour at 500), `held` ms after it filled. */
function release(spec: string | undefined, heldMs = 0): { rig: Rig; tank: MonsterEntity; side: MonsterEntity } {
  const rig = setup({ discipline: 'spirit-reservoir', spec, edit: burstOnly });
  const tank = rig.spawn(430, 400);
  const side = rig.spawn(500, 400);
  setAttackTarget(rig.world, rig.player, tank.isMonster.id);
  run(rig.world, rig.player, 100);
  rig.player.usesEnergy!.energy = maxOf(rig.player);
  if (heldMs > 0) setResource(rig.player.tracksCombat, 'spirit.heldSince', clock - heldMs);
  run(rig.world, rig.player, 100);
  return { rig, tank, side };
}
{
  // Gathering Dark: the release grows each second the bank is held full, up to double.
  const plain = release(undefined);
  const dark = release('spirit-gathering-dark', 10_000);
  assert.ok(lost(plain.tank) > 0, 'a release landed');
  assert.ok(lost(dark.tank) > lost(plain.tank) * 1.5, 'Gathering Dark: a bank held for ten seconds hits about twice as hard');
}
{
  // Overcast: the release splits into one bolt per enemy around the target, the bank shared.
  const cast = release('spirit-overcast');
  const plain = release(undefined);
  assert.ok(lost(cast.side) > 0, 'Overcast: the enemy beside the target is struck too');
  assert.equal(lost(plain.side), 0, 'without it only the target is');
  assert.ok(lost(cast.tank) < lost(plain.tank), 'and the bank is shared, so each bolt is smaller');
}
{
  // Deep Well: each release keeps a third of the bank back as shield.
  const well = release('spirit-deep-well');
  const plain = release(undefined);
  const system = well.rig.player.configuresClass!.config.system;
  const floor = (system.kind === 'thresholds' ? system.floorPct / 100 : 0.3) * maxOf(well.rig.player);
  const bank = maxOf(well.rig.player) - floor;
  assert.ok(well.rig.player.usesEnergy!.energy > floor + bank * 0.3, 'Deep Well: about a third of the bank stays as shield');
  assert.ok(plain.rig.player.usesEnergy!.energy < floor + bank * 0.1, 'without it the release leaves you bare');
  assert.ok(lost(well.tank) < lost(plain.tank), 'and the bolt is smaller');
}

// ── T3 lessons ───────────────────────────────────────────────────────────────
{
  // Downburst waits for a charge at you, stops it dead and pins the charger.
  const { world, player, spawn } = setup({ bands: ['spirit-downburst'] });
  const mon = spawn(520, 400);
  setAggroTarget(world, mon, { kind: 'player', id: player.isPlayer.id }, clock);
  run(world, player, 12_000);
  assert.ok(!isMonsterStunned(world, mon.isMonster.id), 'Downburst waits for a charge');
  mon.controlsMonster.chargeRemainingMs = 1_000;
  run(world, player, 100);
  assert.equal(mon.controlsMonster.chargeRemainingMs, 0, 'the charge stops dead');
  assert.ok(isMonsterStunned(world, mon.isMonster.id), 'and the charger is pinned');
}
{
  // Tailwind: a gust carries you back (its moment, drag-or-push, is the conductor's: the effect is tested directly).
  const { world, player, spawn } = setup({});
  assert.equal(fireTailwind(world, player, {}), false, 'nothing to be carried from');
  spawn(440, 400);
  assert.equal(fireTailwind(world, player, { distance: 200 }), true);
  assert.ok(player.hasPosition.current.x < 300, 'Tailwind carries you back, away from the enemy');
}
{
  // Foehn: a warm wind melts the Chill back down (its moment, chill-threshold, is the conductor's).
  const { player } = setup({});
  assert.equal(fireFoehn(player, {}), false, 'no Chill, no wind');
  addStatus(player, 'tundra-chill', 5);
  assert.equal(fireFoehn(player, { melt: 3 }), true);
  assert.equal(getStatusEffect(player.tracksCombat, 'tundra-chill')!.stacks, 2, 'the Chill melts back down');
  fireFoehn(player, { melt: 3 });
  assert.ok(!hasStatusEffect(player.tracksCombat, 'tundra-chill'), 'and is gone at zero');
}
{
  // Forked Bolt: splits toward the enemies farthest from you.
  const { world, player, spawn } = setup({ bands: ['spirit-forked-bolt'] });
  const target = spawn(430, 400);
  const near = [spawn(445, 400), spawn(455, 400)];
  const far = [spawn(560, 400), spawn(600, 400)];
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 15_000);
  assert.ok(lost(target) > 0, 'Forked Bolt hits the target');
  assert.ok(far.every((m) => lost(m) > 0), 'and forks to the two enemies farthest from you');
  assert.ok(near.every((m) => lost(m) === 0), 'not the near ones');
}
{
  // Ash Lightning hits harder for each step of the Heat.
  const dealt = (heat: number): number => {
    const s = setup({ bands: ['spirit-ash-lightning'] });
    if (heat > 0) addStatus(s.player, 'volcanic-heat', heat);
    const target = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 15_000);
    return lost(target);
  };
  const cold = dealt(0);
  assert.ok(cold > 0 && dealt(10) > cold, 'Ash Lightning: the Heat makes it hit harder');
}

// ── Trophy ranks and the Tundra and Volcanic trophies ────────────────────────
{
  // Marsh Fire III: a bigger burst.
  const burst = (cleared: string[]): number => {
    const { world, player, spawn } = setup({ relic: ['spirit-relic-swamp'], bossesCleared: cleared });
    const mon = spawn(430, 400);
    run(world, player, 20_000);
    player.usesEnergy!.energy = 5;
    strike(world, player, mon, 50);
    return lost(mon);
  };
  const two = burst(['swamp:1', 'swamp:2']);
  assert.ok(two > 0 && burst(['swamp:1', 'swamp:2', 'swamp:3']) > two, 'Marsh Fire III: the burst is bigger');
}
{
  // Static Web III: a charged enemy passes its charge to one enemy touching it.
  const web = setup({ relic: ['spirit-relic-cave'], bossesCleared: ['cave:1', 'cave:2', 'cave:3'], bands: ['spirit-bolt'] });
  const target = web.spawn(430, 400);
  const touching = web.spawn(470, 400);
  const apart = web.spawn(430, 700);
  setAttackTarget(web.world, web.player, target.isMonster.id);
  run(web.world, web.player, 15_000);
  assert.ok(getResource(target.tracksCombat, 'spirit.webUntil') > 0, 'the target is charged');
  assert.ok(getResource(touching.tracksCombat, 'spirit.webUntil') > 0, 'Static Web III: the charge passes to the enemy touching it');
  assert.equal(getResource(apart.tracksCombat, 'spirit.webUntil'), 0, 'and not to one far away');
}
{
  // Running Storm II grows stronger.
  const dealt = (cleared: string[]): number => {
    const s = setup({ relic: ['spirit-relic-jungle'], bossesCleared: cleared, bands: ['spirit-bolt'] });
    const runner = s.spawn(750, 400);
    setAttackTarget(s.world, s.player, runner.isMonster.id);
    run(s.world, s.player, 15_000);
    return lost(runner);
  };
  const one = dealt(['jungle:2']);
  assert.ok(one > 0 && dealt(['jungle:2', 'jungle:3']) > one, 'Running Storm II: it lands harder than rank I');
}
{
  // Ice Storm: every spend glazes the ground under its target; enemies on it are slowed.
  const { world, player, spawn } = setup({ relic: ['spirit-relic-tundra'], bossesCleared: ['tundra:3'], bands: ['spirit-bolt'] });
  const target = spawn(430, 400);
  const away = spawn(430, 800);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 15_000);
  assert.ok(glazeCount(player) > 0, 'the spend glazed the ground');
  assert.ok(getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'the enemy on it is slowed');
  assert.ok(!getStatusEffect(away.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'one off it is not');
}
{
  // Pyrocumulus: a full storm boils over, and a burst strikes around you every few seconds.
  const { world, player, spawn } = setup({ relic: ['spirit-relic-volcanic'], bossesCleared: ['volcanic:3'], edit: noBands });
  const near = spawn(460, 400);
  const far = spawn(400, 900);
  run(world, player, 30_000);
  assert.ok(lost(near) > 0, 'Pyrocumulus: the enemy near you is struck');
  assert.equal(lost(far), 0, 'and only the ones around you');
  assert.ok(getResource(player.tracksCombat, 'spirit.pyroAt') > 0);
}

// ── T3 gear jobs ─────────────────────────────────────────────────────────────
{
  // Rime Staff: spends hit shelled targets harder.
  const dealt = (passives: Record<string, number>): number => {
    const s = setup({ bands: ['spirit-bolt'], edit: hover, passives });
    const target = s.spawn(430, 400);
    setCounter(target.tracksCombat, 'shellUpEndsAt', clock + 1e9); // retracted into its shell
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = 0.6 * maxOf(s.player);
    run(s.world, s.player, 100);
    return lost(target);
  };
  const plain = dealt({});
  assert.ok(plain > 0 && dealt({ 'spirit.shell-pct': 0.5 }) > plain * 1.3, 'Rime Staff: a shelled target takes more');
}
{
  // Ember Rod: the emptier the storm, the harder the spend.
  const dealt = (level: number): number => {
    const s = setup({ bands: ['spirit-bolt'], edit: hover, passives: { 'spirit.empty-pct': 0.6 } });
    const target = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = level * maxOf(s.player);
    run(s.world, s.player, 100);
    return lost(target);
  };
  const fuller = dealt(0.95);
  assert.ok(fuller > 0 && dealt(0.45) > fuller, 'Ember Rod: the emptier storm hits harder');
}
{
  // Insulated: the Chill builds slower while the storm is above the floor.
  const clockAfter = (passives: Record<string, number>): number => {
    const s = setup({ passives, edit: noBands });
    addStatus(s.player, 'tundra-chill', 1, { rampAccum: 0 });
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player);
    const chill = getStatusEffect(s.player.tracksCombat, 'tundra-chill')!;
    for (let i = 0; i < 10; i++) {
      chill.data['rampAccum'] = (chill.data['rampAccum'] ?? 0) + 100; // the room's clock
      run(s.world, s.player, 100);
      s.player.usesEnergy!.energy = maxOf(s.player);
    }
    return chill.data['rampAccum'] ?? 0;
  };
  const plain = clockAfter({});
  assert.ok(plain >= 1000 - 1e-6 && clockAfter({ 'spirit.chill-build': 0.4 }) < plain * 0.8, 'Insulated: the Chill clock gains less');
}
{
  // Aurora: while chilled, the storm gathers faster. Thermal: each step of the Heat adds a little.
  const gain = (passives: Record<string, number>, status?: [string, number]): number => {
    const s = setup({ passives, edit: noBands });
    if (status) addStatus(s.player, status[0], status[1]);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = 0;
    run(s.world, s.player, 100);
    return s.player.usesEnergy!.energy;
  };
  const plain = gain({});
  assert.ok(gain({ 'spirit.chill-flow-pct': 0.5 }, ['tundra-chill', 2]) > plain * 1.3, 'Aurora: chilled, the storm gathers faster');
  assert.ok(Math.abs(gain({ 'spirit.chill-flow-pct': 0.5 }) - plain) < 1e-6, 'and not when you are not chilled');
  assert.ok(gain({ 'spirit.heat-flow-pct': 0.05 }, ['volcanic-heat', 10]) > plain * 1.3, 'Thermal: the Heat makes the storm gather faster');
}
{
  // Flash Steam: fire damage drains the storm at half cost.
  const { world, player, spawn } = setup({ passives: { 'spirit.fire-cost': 0.5 } });
  const fire = spawn(430, 400, 'test-spirit-fire');
  const cold = spawn(460, 400);
  run(world, player, 30_000);
  const drop = (source: MonsterEntity): number => {
    player.usesEnergy!.energy = 0.8 * maxOf(player);
    const before = player.usesEnergy!.energy;
    drainStorm(world, player, 10, 'hit', source);
    return before - player.usesEnergy!.energy;
  };
  assert.ok(Math.abs(drop(fire) * 2 - drop(cold)) < 1e-6, 'Flash Steam: a fire hit costs half');
}

{
  // The T3 moments are live (T3-W2): Tailwind waits for drag-or-push, Foehn for chill-threshold, through the band.
  const { world, player, spawn } = setup({ bands: ['spirit-tailwind'] });
  spawn(440, 400);
  run(world, player, 12_000);
  assert.ok(player.hasPosition.current.x > 350, 'Tailwind sleeps until something drags or shoves you');
  recordMoment(world, player, 'drag-or-push');
  run(world, player, 100);
  assert.ok(player.hasPosition.current.x < 300, 'drag-or-push fires Tailwind live');
}
{
  const { world, player } = setup({ bands: ['spirit-foehn'] });
  run(world, player, 12_000);
  addStatus(player, 'tundra-chill', 5);
  const before = getStatusEffect(player.tracksCombat, 'tundra-chill')?.stacks ?? 0;
  run(world, player, 300);
  assert.ok((getStatusEffect(player.tracksCombat, 'tundra-chill')?.stacks ?? 0) < before, 'chill-threshold fires Foehn live and melts the Chill');
}

console.log('spiritT3: ok');
