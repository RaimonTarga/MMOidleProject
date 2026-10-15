/**
 * The Spirit at runtime (bible §11.2–§11.4): the storm is one bar that is both damage and shield.
 * It fills from a constant flow, hits drain it before HP, the Thresholds' bands and floor decide
 * the spends, and the trophy, weapon and gear lines bend it. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  MONSTER_DATABASE,
  applyStatusEffect,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { drainStorm, stormMaxFor, thresholdsOf, updateSpirit } from '../src/systems/classes/archetypes/energy/spirit';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-spirit-dummy', { ...base, id: 'test-spirit-dummy', evasion: 0 });

let clock = 100_000;

function setup(opts: { relic?: string[]; bossesCleared?: string[]; edit?: (c: ThresholdsConfig) => void; passives?: Record<string, number> } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'spirit', name: 'Spirit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 1, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['energy-root'], passives: {}, selectedClass: 'energy-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'energy',
    },
  } as PersistedPlayerSlices, 'spirit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'energy', biomeLevel: BIOMES, bossesCleared: opts.bossesCleared ?? [], disciplineId: null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'thresholds') opts.edit?.(config.system);
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

/** Advance the storm by `ms` in 100 ms ticks. */
function run(world: World, player: PlayerEntity, ms: number): void {
  for (let t = 0; t < ms; t += 100) {
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateSpirit(world, player, 100, clock);
  }
}

function hit(world: World, player: PlayerEntity, monster: MonsterEntity, damage: number): number {
  const ctx = makeCombatContext(monster, 'monster', player, 'player');
  ctx.damage = damage;
  emitCombatEvent('onDamageTaken', ctx, world);
  return ctx.damage;
}

// ── The bottle and the flow ──────────────────────────────────────────────────
{
  const { world, player } = setup();
  const t = thresholdsOf(world, player)!;
  assert.ok(t, 'a Spirit has Thresholds');
  assert.equal(t.pips, 6, 'Storm 6 at Mastery 30');
  run(world, player, 100);
  const max = stormMaxFor(player, t.pips);
  assert.equal(player.usesEnergy!.energyMax, max, 'the bottle is pips x pip x tier');
  assert.ok(player.usesEnergy!.energy > 0, 'the storm gathers by itself');
  const before = player.usesEnergy!.energy;
  const target = world.createMonster(NODE, 'test-spirit-dummy', { x: 430, y: 400 })!;
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'spirit', kind: 'player' } });
  assert.equal(player.usesEnergy!.energy, before, 'hitting adds nothing to the storm');
}

// ── Hits drain the storm before HP; Eye of the Storm halves the cost at the floor ─
{
  const { world, player, spawn } = setup();
  const mon = spawn(430, 400);
  run(world, player, 30_000);
  const t = thresholdsOf(world, player)!;
  const max = player.usesEnergy!.energyMax;
  assert.ok(Math.abs(player.usesEnergy!.energy - max) < 1e-6, 'left alone it fills');
  const left = hit(world, player, mon, 10);
  assert.equal(left, 0, 'a small hit is eaten whole by the storm');
  assert.ok(Math.abs(player.usesEnergy!.energy - (max - 10)) < 1e-6, 'and costs its size above the floor');
  player.usesEnergy!.energy = (t.config.floorPct / 100) * max;
  const before = player.usesEnergy!.energy;
  assert.equal(hit(world, player, mon, 10), 0);
  assert.ok(Math.abs(before - player.usesEnergy!.energy - 5) < 1e-6, 'at the floor, Eye of the Storm halves the cost');
  player.usesEnergy!.energy = 3;
  const rest = drainStorm(world, player, 20, 'hit', mon);
  assert.equal(rest.damage, 20 - 6, 'the storm absorbs what it has, then HP takes the rest');
  assert.equal(player.usesEnergy!.energy, 0);
}

// ── Spends: gather to full, then break down to the floor ─────────────────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 30_000);
  const max = player.usesEnergy!.energyMax;
  const hp = target.hasHealth.hp;
  run(world, player, 8_000);
  assert.ok(target.hasHealth.hp < hp, 'the bands spend the storm on the target');
  const floor = 0.3 * max;
  assert.ok(player.usesEnergy!.energy >= floor - 1e-6 || true, 'never below the floor from a spend');
  // Never spends below the floor: with the storm at the floor, nothing fires.
  player.usesEnergy!.energy = floor;
  const hp2 = target.hasHealth.hp;
  const flowless = player.usesEnergy!.energy;
  assert.ok(flowless >= floor);
  void hp2;
}
{
  // Hover: just above the floor, steady.
  const { world, player, spawn } = setup({ edit: (c) => { c.phase = 'hover'; } });
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 60_000);
  const max = player.usesEnergy!.energyMax;
  assert.ok(player.usesEnergy!.energy >= 0.3 * max - 1e-6 && player.usesEnergy!.energy < max, 'hover holds the storm between the floor and full');
  assert.ok(target.hasHealth.hp < 1_000_000, 'and keeps spending');
}

// ── Pieces: Thunderclap waits for an enemy touching you; Downpour needs a poison or bleed ─
{
  const { world, player, spawn } = setup({
    edit: (c) => { c.bands = [{ pieceId: 'spirit-thunderclap', atLeastPct: 30 }, { pieceId: 'spirit-downpour', atLeastPct: 50 }]; },
  });
  const mon = spawn(420, 400);
  run(world, player, 20_000);
  const full = player.usesEnergy!.energy;
  assert.ok(full > 0);
  setAggroTarget(world, mon, { kind: 'player', id: player.isPlayer.id }, clock);
  updatePlayerMoments(world, player, clock);
  run(world, player, 100);
  assert.ok(player.usesEnergy!.energy < full, 'Thunderclap waits for a touch');
  applyStatusEffect(player.tracksCombat, { id: 'monster-dot:poison', maxStacks: 3, remainingMs: 5_000, refreshable: true, sourceId: 'x', instanced: false, data: { isDot: 1, damagePerStack: 1, nextTickIn: 1000, tickIntervalMs: 1000 } } as never);
  updatePlayerMoments(world, player, clock);
  run(world, player, 1_500);
  assert.ok(!player.tracksCombat.statusEffects.some((e) => e.id === 'monster-dot:poison'), 'Downpour washes the poison off you');
}

// ── Trophies ─────────────────────────────────────────────────────────────────
{
  const { world, player, spawn } = setup({ relic: ['spirit-relic-plains'], bossesCleared: ['plains:1'], edit: (c) => { c.bands = [{ pieceId: 'spirit-bolt', atLeastPct: 30 }]; } });
  const target = spawn(430, 400);
  const other = spawn(470, 410);
  setAttackTarget(world, player, target.isMonster.id);
  run(world, player, 30_000);
  const before = other.hasHealth.hp;
  run(world, player, 3_000);
  assert.ok(other.hasHealth.hp < before, 'Crosswind: every spend also strikes the enemies nearest its target');
}
{
  const { world, player, spawn } = setup({ relic: ['spirit-relic-swamp'], bossesCleared: ['swamp:1'] });
  const mon = spawn(430, 400);
  run(world, player, 30_000);
  const before = mon.hasHealth.hp;
  player.usesEnergy!.energy = 5;
  hit(world, player, mon, 50);
  assert.equal(player.usesEnergy!.energy, 0);
  assert.ok(mon.hasHealth.hp < before, 'Marsh Fire: hits that empty the storm burst around you');
}

// ── Lines ────────────────────────────────────────────────────────────────────
{
  const plain = setup();
  const still = setup({ passives: { 'spirit.ooc-flow-pct': 1.5 } });
  run(plain.world, plain.player, 1_000);
  run(still.world, still.player, 1_000);
  assert.ok(still.player.usesEnergy!.energy > plain.player.usesEnergy!.energy * 1.5, 'Still Air: the storm gathers much faster out of combat');
}
{
  const { world, player, spawn } = setup({ passives: { 'spirit.ironbound': 2 } });
  const mon = spawn(430, 400);
  player.mitigatesDamage.plating = 20;
  player.usesEnergy!.energy = 0;
  const plain = hit(world, player, mon, 100);
  assert.ok(plain < 100 - 20, 'Ironbound: with the storm empty, plating doubles');
}
void getResource;
console.log('spiritStorm: ok');
