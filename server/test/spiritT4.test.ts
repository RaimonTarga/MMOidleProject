/**
 * The Spirit's Tier 4 wiring (bible §11.7, §11.9, §11.16): the nine leaves, the T4 lessons, the trophy
 * ranks and the Wasteland and Trench trophies, and the T4 gear jobs. Wiring only: attach, tick, assert
 * observable state, never balance numbers.
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
  setResource,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent, detachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { drainStorm, thresholdsOf, updateSpirit } from '../src/systems/classes/archetypes/energy/spirit';
import { fireDownburst } from '../src/systems/classes/archetypes/energy/spiritT3';
import { groundChargeActive } from '../src/systems/classes/archetypes/energy/spiritT4';
import { isMonsterKnockedBack } from '../src/systems/combat/damage/knockback';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { isMonsterStunned } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = {
  plains: 80, forest: 80, swamp: 80, mountain: 80, cave: 80, jungle: 80, desert: 80, tundra: 80, volcanic: 80, graveyard: 80, trench: 80,
};
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-spirit-dummy', { ...base, id: 'test-spirit-dummy', evasion: 0 });

let clock = 100_000;
const FULL = 1_000_000;

interface Opts {
  discipline?: string;
  /** Passive Tree nodes picked below the discipline: specializations and leaves. */
  picks?: string[];
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
      playerTier: 4, currentSkillTier: 0, bossesCleared, clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['energy-root', ...(opts.picks ?? [])], passives: {}, selectedClass: 'energy-root',
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

function run(world: World, player: PlayerEntity, ms: number): void {
  for (let t = 0; t < ms; t += 100) {
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateSpirit(world, player, 100, clock);
  }
}

const maxOf = (p: PlayerEntity): number => p.usesEnergy!.energyMax;
const lost = (m: MonsterEntity): number => FULL - m.hasHealth.hp;
const hover = (c: ThresholdsConfig): void => { c.phase = 'hover'; };
const noBands = (c: ThresholdsConfig): void => { c.bands = []; };
const hoverNoBands = (c: ThresholdsConfig): void => { c.phase = 'hover'; c.bands = []; };
const debuff = (p: PlayerEntity, id: string, remainingMs = -1, data: Record<string, number> = {}): void => {
  applyStatusEffect(p.tracksCombat, { id, maxStacks: 3, remainingMs, refreshable: false, sourceId: 'x', instanced: false, data } as never);
};
const aggro = (w: World, p: PlayerEntity, m: MonsterEntity): void => setAggroTarget(w, m, { kind: 'player', id: p.isPlayer.id }, clock);

// ── The kit is reached: leaves, T4 lessons, trophy ranks ─────────────────────
{
  const { world, player } = setup({
    discipline: 'spirit-tide', picks: ['spirit-breakwater', 'spirit-wading', 'spirit-dam'], relic: ['spirit-relic-mountain'],
    bossesCleared: ['mountain:1', 'mountain:2', 'mountain:3', 'mountain:4'],
  });
  const t = thresholdsOf(world, player)!;
  assert.ok(t.leaves.has('spirit-wading'), 'a leaf of the picked discipline reaches the runtime');
  assert.ok(!t.leaves.has('spirit-dam'), "another discipline's leaf is ignored");
  assert.equal(t.spec, 'spirit-breakwater', 'the specialization still reads');
  for (const id of ['spirit-sleet', 'spirit-ground-charge', 'spirit-dust-wall', 'spirit-thunderstorm', 'spirit-maelstrom']) assert.ok(t.owned.has(id), `${id} is learned`);
  assert.equal(t.ranks.get('spirit-downburst'), 2, 'Downburst II is learned');
  assert.equal(t.ranks.get('spirit-ash-lightning'), 2, 'Ash Lightning II is learned');
  assert.equal(t.trophyRank, 4, 'the T4 boss ranks Thunderhead up to IV');
}

// ── Overflow leaves ──────────────────────────────────────────────────────────
{
  // Shunt: a hit worth over a quarter of the storm goes into the spill: free, and it arcs out at enemies. Not twice in a row.
  const rig = (leaf: boolean) => {
    const s = setup({ discipline: 'spirit-overflow', picks: leaf ? ['spirit-shunt'] : [], edit: noBands });
    const mon = s.spawn(440, 400);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * 0.8;
    return { ...s, mon };
  };
  const shunt = rig(true);
  const before = shunt.player.usesEnergy!.energy;
  const out = drainStorm(shunt.world, shunt.player, before * 0.5, 'hit', shunt.mon);
  assert.equal(out.damage, 0, 'Shunt: the hit is gone');
  assert.equal(shunt.player.usesEnergy!.energy, before, 'it cost nothing');
  assert.ok(lost(shunt.mon) > 0, 'and arced back out at the enemy');
  drainStorm(shunt.world, shunt.player, before * 0.5, 'hit', shunt.mon);
  assert.ok(shunt.player.usesEnergy!.energy < before, 'a second big hit at once is paid for');
  const plain = rig(false);
  drainStorm(plain.world, plain.player, plain.player.usesEnergy!.energy * 0.5, 'hit', plain.mon);
  assert.ok(plain.player.usesEnergy!.energy < before, 'without it the hit drains the storm');
  assert.equal(lost(plain.mon), 0);
}
{
  // Static Field: hits from enemies caught in the spill drain the storm less.
  const dropOf = (leaf: boolean, x: number): number => {
    const s = setup({ discipline: 'spirit-overflow', picks: leaf ? ['spirit-static-field'] : [], edit: noBands });
    const mon = s.spawn(x, 400);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * 1.2;
    const before = s.player.usesEnergy!.energy;
    drainStorm(s.world, s.player, 10, 'hit', mon);
    return before - s.player.usesEnergy!.energy;
  };
  assert.ok(dropOf(true, 440) < dropOf(false, 440) * 0.7, 'Static Field: an enemy in the spill drains a third less');
  assert.equal(dropOf(true, 900), dropOf(false, 900), 'but one outside the spill does not');
}
{
  // Burn Off: while you overflow, poisons and bleeds on you end faster.
  const leftOf = (leaf: boolean, over: boolean): number => {
    const s = setup({ discipline: 'spirit-overflow', picks: leaf ? ['spirit-burn-off'] : [], edit: noBands });
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * (over ? 1.3 : 0.5);
    debuff(s.player, 'monster-dot:poison', 10_000, { isDot: 1, damagePerStack: 1, nextTickIn: 1000, tickIntervalMs: 1000 });
    run(s.world, s.player, 1_000);
    return getStatusEffect(s.player.tracksCombat, 'monster-dot:poison')!.remainingMs;
  };
  assert.ok(leftOf(true, true) < leftOf(false, true), 'Burn Off: the poison runs out faster while you overflow');
  assert.equal(leftOf(true, false), leftOf(false, false), 'and only while you overflow');
}

// ── Tide leaves ──────────────────────────────────────────────────────────────
{
  // Turn of the Tide: a big hit during a surge turns the tide at once.
  const rig = (leaf: boolean) => {
    const s = setup({ discipline: 'spirit-tide', picks: leaf ? ['spirit-turn-of-the-tide'] : [], edit: noBands });
    const mon = s.spawn(440, 400);
    run(s.world, s.player, 100);
    setResource(s.player.tracksCombat, 'spirit.tideSurge', 1);
    const ctx = makeCombatContext(mon, 'monster', s.player, 'player');
    ctx.damage = 3_000;
    emitCombatEvent('afterHit', ctx, s.world);
    return s;
  };
  const turned = rig(true);
  assert.equal(getResource(turned.player.tracksCombat, 'spirit.tideSurge'), 0, 'Turn of the Tide: the surge is over');
  assert.equal(getResource(turned.player.tracksCombat, 'spirit.tideCount'), 1, 'it counts as a turn');
  assert.ok(getResource(turned.player.tracksCombat, 'spirit.turnUntil') > 0, 'and the storm gathers fast');
  assert.equal(getResource(rig(false).player.tracksCombat, 'spirit.tideSurge'), 1, 'without it the surge goes on');
}
{
  // Wading: enemies that follow you through the ebb are slowed.
  const s = setup({ discipline: 'spirit-tide', picks: ['spirit-wading'], edit: noBands });
  const near = s.spawn(480, 400);
  const far = s.spawn(400, 900);
  s.player.usesEnergy!.energy = 0;
  run(s.world, s.player, 500);
  assert.ok(getStatusEffect(near.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'Wading: the enemy beside you is slowed in the ebb');
  assert.ok(!getStatusEffect(far.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'one far off is not');
}
{
  // Cleansing Tide: every turn of the tide washes a debuff off you.
  const rig = (leaf: boolean): PlayerEntity => {
    const s = setup({ discipline: 'spirit-tide', picks: leaf ? ['spirit-cleansing-tide'] : [], edit: noBands });
    run(s.world, s.player, 100);
    debuff(s.player, 'monster-dot:poison', 9_000, { isDot: 1, damagePerStack: 1, nextTickIn: 1000, tickIntervalMs: 1000 });
    s.player.usesEnergy!.energy = maxOf(s.player);
    run(s.world, s.player, 200);
    return s.player;
  };
  assert.ok(!hasStatusEffect(rig(true).tracksCombat, 'monster-dot:poison'), 'Cleansing Tide: the turn washed the poison off');
  assert.ok(hasStatusEffect(rig(false).tracksCombat, 'monster-dot:poison'), 'without it the poison stays');
}

// ── Reservoir leaves ─────────────────────────────────────────────────────────
{
  // Dam: while the bank is above the floor, no single hit drains more than a quarter of the bottle; the rest is lost.
  const rig = (leaf: boolean) => {
    const s = setup({ discipline: 'spirit-reservoir', picks: leaf ? ['spirit-dam'] : [], edit: noBands });
    const mon = s.spawn(440, 400);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player);
    const out = drainStorm(s.world, s.player, maxOf(s.player) * 1.5, 'hit', mon);
    return { left: s.player.usesEnergy!.energy, out, max: maxOf(s.player) };
  };
  const dam = rig(true);
  assert.ok(Math.abs(dam.left - dam.max * 0.75) < 1e-6, 'Dam: one hit drains only a quarter of the bottle');
  assert.equal(dam.out.damage, 0, 'and the rest of that hit is lost');
  assert.equal(rig(false).left, 0, 'without it the same hit empties the bank');
}
{
  // Levee: while three or more enemies are on you, hits drain the storm less.
  const dropOf = (leaf: boolean, crowd: number): number => {
    const s = setup({ discipline: 'spirit-reservoir', picks: leaf ? ['spirit-levee'] : [], edit: noBands });
    const mons = Array.from({ length: crowd }, (_, i) => s.spawn(440 + i * 5, 400));
    for (const m of mons) aggro(s.world, s.player, m);
    run(s.world, s.player, 200);
    s.player.usesEnergy!.energy = maxOf(s.player) * 0.8;
    const before = s.player.usesEnergy!.energy;
    drainStorm(s.world, s.player, 10, 'hit', mons[0]);
    return before - s.player.usesEnergy!.energy;
  };
  assert.ok(dropOf(true, 3) < dropOf(false, 3) * 0.9, 'Levee: a crowd of three drains the storm a fifth less');
  assert.equal(dropOf(true, 1), dropOf(false, 1), 'but one enemy does not');
}
{
  // Calm Depths: while the bank is full, debuffs on you last half as long.
  const leftOf = (leaf: boolean, full: boolean): number => {
    const s = setup({ discipline: 'spirit-reservoir', picks: leaf ? ['spirit-calm-depths'] : [], edit: noBands });
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * (full ? 1 : 0.5);
    debuff(s.player, 'slow', 10_000, { totalMs: 10_000 });
    run(s.world, s.player, 1_000);
    return getStatusEffect(s.player.tracksCombat, 'slow')!.remainingMs;
  };
  assert.ok(leftOf(true, true) < leftOf(false, true), 'Calm Depths: the slow runs out faster while the bank is full');
}

// ── Trophy ranks ─────────────────────────────────────────────────────────────
{
  // Thunderhead IV: the full-storm spend also staggers.
  const stunned = (cleared: string[]): boolean => {
    const s = setup({ relic: ['spirit-relic-mountain'], bossesCleared: cleared, bands: ['spirit-bolt'], edit: hover });
    const mon = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, mon.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player);
    run(s.world, s.player, 100);
    return isMonsterStunned(s.world, mon.isMonster.id);
  };
  assert.ok(stunned(['mountain:1', 'mountain:2', 'mountain:3', 'mountain:4']), 'Thunderhead IV: the spend staggers');
  assert.ok(!stunned(['mountain:1', 'mountain:2', 'mountain:3']), 'rank III does not');
}
{
  // Ice Storm II, Sandstorm III: the slow grows. Pyrocumulus II: the burst grows.
  const slowOf = (relic: string, cleared: string[], pick: (s: ReturnType<typeof setup>) => MonsterEntity): number => {
    const s = setup({ relic: [relic], bossesCleared: cleared, bands: ['spirit-bolt'], edit: hover });
    const mon = pick(s);
    setAttackTarget(s.world, s.player, mon.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player);
    run(s.world, s.player, 1_000);
    return getStatusEffect(mon.tracksCombat, ABILITY_SLOW_EFFECT_ID)?.data['moveSlowPct'] ?? 0;
  };
  const near = (s: ReturnType<typeof setup>): MonsterEntity => s.spawn(430, 400);
  const ice1 = slowOf('spirit-relic-tundra', ['tundra:3'], near);
  const ice2 = slowOf('spirit-relic-tundra', ['tundra:3', 'tundra:4'], near);
  assert.ok(ice1 > 0 && ice2 > ice1, 'Ice Storm II: the glaze slows harder');
  const sand2 = slowOf('spirit-relic-desert', ['desert:2', 'desert:3'], near);
  const sand3 = slowOf('spirit-relic-desert', ['desert:2', 'desert:3', 'desert:4'], near);
  assert.ok(sand2 > 0 && sand3 > sand2, 'Sandstorm III: the sand slows harder');
  const burst = (cleared: string[]): number => {
    const s = setup({ relic: ['spirit-relic-volcanic'], bossesCleared: cleared, edit: noBands });
    const mon = s.spawn(460, 400);
    run(s.world, s.player, 6_000);
    return lost(mon);
  };
  assert.ok(burst(['volcanic:3', 'volcanic:4']) > burst(['volcanic:3']), 'Pyrocumulus II: the burst is bigger');
}
{
  // Stray Bolts (Wasteland): every spend also strikes a random enemy elsewhere in the fight.
  const { world, player, spawn } = setup({ relic: ['spirit-relic-graveyard'], bossesCleared: ['graveyard:4'], bands: ['spirit-bolt'], edit: hover });
  const target = spawn(430, 400);
  const elsewhere = spawn(400, 800);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 100);
  player.usesEnergy!.energy = maxOf(player);
  run(world, player, 100);
  assert.ok(lost(target) > 0, 'the spend hit its target');
  assert.ok(lost(elsewhere) > 0, 'Stray Bolts: and a bolt found the other enemy');
}
{
  // Depth Charge (Trench): while the target is out of reach the storm gathers double; resurfacing arms the first spend.
  const rig = (relic: boolean) => {
    const s = setup({ relic: relic ? ['spirit-relic-trench'] : undefined, bossesCleared: relic ? ['trench:4'] : [], edit: hoverNoBands });
    const mon = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, mon.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * 0.3;
    attachComponent(s.world, mon, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 5_000 });
    return { ...s, mon };
  };
  const gain = (relic: boolean): number => {
    const s = rig(relic);
    const before = s.player.usesEnergy!.energy;
    run(s.world, s.player, 1_000);
    return s.player.usesEnergy!.energy - before;
  };
  assert.ok(gain(true) > gain(false) * 1.8, 'Depth Charge: the storm gathers twice as fast while the target is out of reach');
  const s = rig(true);
  run(s.world, s.player, 200);
  assert.equal(getResource(s.player.tracksCombat, 'spirit.depthArmed'), 0, 'not armed while it is under');
  detachComponent(s.world, s.mon, 'isConcealed');
  run(s.world, s.player, 300);
  assert.equal(getResource(s.player.tracksCombat, 'spirit.depthArmed'), 1, 'resurfacing arms the first spend');
}

// ── T4 lessons ───────────────────────────────────────────────────────────────
{
  // Downburst II pins every enemy in a line, not only the charger; the one off the line is spared.
  const rig = (rank: number) => {
    const s = setup({});
    const charger = s.spawn(520, 400);
    const inLine = s.spawn(640, 410);
    const off = s.spawn(520, 640);
    charger.controlsMonster.chargeRemainingMs = 1_000;
    aggro(s.world, s.player, charger);
    assert.equal(fireDownburst(s.world, s.player, { pinMs: 1200, lineLength: 420, lineWidth: 70 }, rank), true);
    return { charger, inLine, off, world: s.world };
  };
  const two = rig(2);
  assert.ok(isMonsterStunned(two.world, two.inLine.isMonster.id), 'Downburst II: the enemy in the line is pinned too');
  assert.ok(!isMonsterStunned(two.world, two.off.isMonster.id), 'the one off the line is not');
  const one = rig(1);
  assert.ok(isMonsterStunned(one.world, one.charger.isMonster.id) && !isMonsterStunned(one.world, one.inLine.isMonster.id), 'rank I pins only the charger');
}
{
  // Ash Lightning II also strikes the enemies around the target.
  const splash = (): number => {
    const s = setup({ bands: ['spirit-ash-lightning'] });
    const target = s.spawn(430, 400);
    const beside = s.spawn(480, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 15_000);
    assert.ok(lost(target) > 0);
    return lost(beside);
  };
  assert.ok(splash() > 0, 'Ash Lightning II: the enemy beside the target is struck too');
}
{
  // Sleet: a narrow sheet on one target.
  const { world, player, spawn } = setup({ bands: ['spirit-sleet'] });
  const target = spawn(430, 400);
  const beside = spawn(560, 400);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 15_000);
  assert.ok(lost(target) > 0, 'Sleet hits the target');
  assert.equal(lost(beside), 0, 'and is too narrow to reach an enemy off to the side');
}
{
  // Ground Charge: the first enemy to charge you across the patch is thrown back and stunned.
  const { world, player, spawn } = setup({ bands: ['spirit-ground-charge'], edit: hover });
  const leaper = spawn(480, 400);
  setAttackTarget(world, player, leaper.isMonster.id);
  for (let i = 0; i < 150 && !groundChargeActive(player, clock); i++) run(world, player, 100);
  assert.ok(groundChargeActive(player, clock), 'Ground Charge lays a patch under you');
  assert.ok(!isMonsterStunned(world, leaper.isMonster.id), 'which waits for a leap');
  leaper.controlsMonster.chargeRemainingMs = 800;
  run(world, player, 200);
  assert.ok(isMonsterStunned(world, leaper.isMonster.id), 'the leaper is stunned');
  assert.equal(leaper.controlsMonster.chargeRemainingMs, 0, 'and its charge is broken');
  assert.ok(!groundChargeActive(player, clock), 'and the patch is spent');
}
{
  // Dust Wall rolls out in every direction: it pushes the enemy behind you, which Gale (in front only) does not.
  const pushed = (piece: string): boolean => {
    const s = setup({ bands: [piece] });
    const front = s.spawn(500, 400);
    const behind = s.spawn(330, 400);
    setAttackTarget(s.world, s.player, front.isMonster.id);
    run(s.world, s.player, 15_000);
    return isMonsterKnockedBack(s.world, behind.isMonster.id);
  };
  assert.ok(pushed('spirit-dust-wall'), 'Dust Wall pushes the enemy behind you back');
  assert.ok(!pushed('spirit-gale'), 'Gale leaves it');
}
{
  // Thunderstorm: for a few seconds, lightning strikes at random among the enemies around you.
  const { world, player, spawn } = setup({ bands: ['spirit-thunderstorm'] });
  const a = spawn(450, 400);
  const b = spawn(350, 400);
  setAttackTarget(world, player, a.isMonster.id);
  run(world, player, 20_000);
  assert.ok(lost(a) + lost(b) > 0, 'Thunderstorm strikes the enemies around you');
}
{
  // Maelstrom: when the enemy you fight dives out of reach, a whirlpool drags it back to the surface.
  const { world, player, spawn } = setup({ bands: ['spirit-maelstrom'] });
  const diver = spawn(700, 400);
  setAttackTarget(world, player, diver.isMonster.id);
  run(world, player, 12_000);
  assert.ok(diver.hasPosition.current.x > 650, 'Maelstrom waits for a dive');
  attachComponent(world, diver, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 60_000 });
  run(world, player, 300);
  assert.equal(diver.isConcealed, undefined, 'the whirlpool surfaced it');
  assert.ok(diver.hasPosition.current.x < 600, 'and set it down beside you');
}

// ── T4 gear jobs ─────────────────────────────────────────────────────────────
{
  // Tempest Staff: area spends hit harder for each enemy they hit.
  const hit = (pct: number): number => {
    const s = setup({ bands: ['spirit-chain-lightning'], passives: { 'spirit.area-count-pct': pct } });
    const target = s.spawn(430, 400);
    for (let i = 0; i < 4; i++) s.spawn(450 + i * 10, 430);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 15_000);
    return lost(target);
  };
  assert.ok(hit(0.1) > hit(0) * 1.2, 'Tempest Staff: a crowd makes the spend hit harder');
}
{
  // Abyssal Lantern: spends hit harder for each different debuff on you. Abyssal Calm: the storm gathers faster. Deep Seal: hits drain less.
  const hit = (pct: number, debuffs: number): number => {
    const s = setup({ bands: ['spirit-bolt'], passives: { 'spirit.debuff-pct': pct }, edit: hover });
    for (const id of ['slow', 'antiheal', 'swamp-rot'].slice(0, debuffs)) debuff(s.player, id);
    const target = s.spawn(430, 400);
    setAttackTarget(s.world, s.player, target.isMonster.id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player);
    run(s.world, s.player, 100);
    return lost(target);
  };
  assert.ok(hit(0.1, 3) > hit(0, 3) * 1.2, 'Abyssal Lantern: debuffs on you make the spend hit harder');
  assert.equal(hit(0.1, 0), hit(0, 0), 'and with none it does nothing');
  const gain = (pct: number): number => {
    const s = setup({ edit: hoverNoBands, passives: { 'spirit.debuff-flow-pct': pct } });
    for (const id of ['slow', 'antiheal', 'swamp-rot']) debuff(s.player, id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * 0.3;
    const before = s.player.usesEnergy!.energy;
    run(s.world, s.player, 1_000);
    return s.player.usesEnergy!.energy - before;
  };
  assert.ok(gain(0.1) > gain(0) * 1.2, 'Abyssal Calm: each debuff speeds the storm');
  const drop = (cost: number, debuffs: number): number => {
    const s = setup({ edit: hoverNoBands, passives: { 'spirit.debuff-cost': cost } });
    const mon = s.spawn(440, 400);
    for (const id of ['slow', 'antiheal', 'swamp-rot'].slice(0, debuffs)) debuff(s.player, id);
    run(s.world, s.player, 100);
    s.player.usesEnergy!.energy = maxOf(s.player) * 0.8;
    const before = s.player.usesEnergy!.energy;
    drainStorm(s.world, s.player, 10, 'hit', mon);
    return before - s.player.usesEnergy!.energy;
  };
  assert.ok(Math.abs(drop(0.667, 3) - 10 * 0.667) < 1e-6, 'Deep Seal: three debuffs, a third less');
  assert.equal(drop(0.667, 2), 10, 'two are not enough');
}
{
  // Gravecloth: risen enemies' hits drain the storm at half cost. Wake: each enemy that rises near you adds a burst.
  const s = setup({ edit: hoverNoBands, passives: { 'spirit.risen-cost': 0.5, 'spirit.risen-burst': 0.05 } });
  const risen = s.spawn(440, 400);
  const living = s.spawn(450, 400);
  attachComponent(s.world, risen, 'isRaised', { raiserId: 'test-raiser' });
  run(s.world, s.player, 100);
  s.player.usesEnergy!.energy = maxOf(s.player) * 0.5;
  const at = s.player.usesEnergy!.energy;
  drainStorm(s.world, s.player, 10, 'hit', risen);
  assert.ok(Math.abs(at - s.player.usesEnergy!.energy - 5) < 1e-6, 'Gravecloth: a risen hit costs half');
  const mid = s.player.usesEnergy!.energy;
  drainStorm(s.world, s.player, 10, 'hit', living);
  assert.ok(Math.abs(mid - s.player.usesEnergy!.energy - 10) < 1e-6, 'a living enemy costs full');

  const w = setup({ edit: hoverNoBands, passives: { 'spirit.risen-burst': 0.05 } });
  run(w.world, w.player, 100);
  w.player.usesEnergy!.energy = maxOf(w.player) * 0.2;
  run(w.world, w.player, 100);
  const quiet = w.player.usesEnergy!.energy;
  const rose = w.spawn(450, 400);
  attachComponent(w.world, rose, 'isRaised', { raiserId: 'test-raiser' });
  run(w.world, w.player, 100);
  assert.ok(w.player.usesEnergy!.energy - quiet > maxOf(w.player) * 0.04, 'Wake: an enemy rising near you bursts the storm up');
  const after = w.player.usesEnergy!.energy;
  run(w.world, w.player, 100);
  assert.ok(w.player.usesEnergy!.energy - after < maxOf(w.player) * 0.04, 'once per enemy');
}

console.log('spiritT4: ok');
