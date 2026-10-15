/**
 * The Apprentice at runtime (bible §9.2–§9.4): hits lay sigils that tick linearly and come from
 * the weapon, never the hit; the Payoff rules spend them at moments; the trophy, weapon and gear
 * lines bend them. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  MONSTER_DATABASE,
  type PayoffsConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateApprentice, laySigils, payoffsOf } from '../src/systems/classes/archetypes/dot/sigils';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { recordMoment, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { playerDotsOnMonster } from '../src/systems/combat/damage/dotInventory';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-apprentice-dummy', { ...base, id: 'test-apprentice-dummy', evasion: 0 });
const SIGIL = 'dot';

let clock = 100_000;

function setup(opts: { relic?: string[]; bossesCleared?: string[]; edit?: (c: PayoffsConfig) => void; passives?: Record<string, number> } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'apprentice', name: 'Apprentice' },
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
      unlockedSkills: ['dot-root'], passives: {}, selectedClass: 'dot-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'dot',
    },
  } as PersistedPlayerSlices, 'apprentice');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'dot', biomeLevel: BIOMES, bossesCleared: opts.bossesCleared ?? [], disciplineId: null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'payoffs') opts.edit?.(config.system);
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  player.dealsDamage.attack = 100;
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-apprentice-dummy', { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn };
}

const sigils = (m: MonsterEntity): number => getStatusEffect(m.tracksCombat, SIGIL)?.stacks ?? 0;

function hit(world: World, player: PlayerEntity, target: MonsterEntity): number {
  clock += 1_000;
  setAttackTarget(world, player, target.isMonster.id);
  const before = target.hasHealth.hp;
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'apprentice', kind: 'player' } });
  return before - target.hasHealth.hp;
}

function step(world: World, player: PlayerEntity): void {
  clock += 100;
  world.tickCounter++;
  updatePlayerMoments(world, player, clock);
  updateApprentice(world, player, 100, clock);
}

// ── Hits lay sigils, to the cap; the hit keeps its damage ────────────────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  assert.equal(payoffsOf(world, player)!.cap, 6, 'Sigils 6 at Mastery 30');
  const first = hit(world, player, target);
  assert.equal(sigils(target), 1, 'a hit lays a sigil');
  assert.equal(first, player.dealsDamage.attack, 'the hit keeps its full unconverted damage');
  for (let i = 0; i < 10; i++) hit(world, player, target);
  assert.equal(sigils(target), 6, 'sigils stop at the cap');
  const effect = getStatusEffect(target.tracksCombat, SIGIL)!;
  assert.ok(effect.data['damagePerStack']! >= 1, 'its damage comes from the weapon');
}

// ── Payoffs at moments ───────────────────────────────────────────────────────
{
  // Detonate at full.
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  for (let i = 0; i < 8; i++) hit(world, player, target);
  const hp = target.hasHealth.hp;
  step(world, player);
  assert.equal(sigils(target), 0, 'Detonate spends every sigil');
  assert.ok(target.hasHealth.hp < hp, 'and pays what they had left in one blast');
}
{
  // Spread (full and two or more enemies near): a neighbour gets a sigil.
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  const neighbour = spawn(470, 410);
  const third = spawn(480, 380);
  for (const m of [target, neighbour, third]) setAggroTarget(world, m, { kind: 'player', id: player.isPlayer.id }, clock);
  for (let i = 0; i < 8; i++) hit(world, player, target);
  step(world, player);
  assert.ok(sigils(neighbour) + sigils(third) >= 1, 'Spread passes a sigil to a neighbour');
  assert.equal(sigils(target), 6, 'and keeps the target full (it does not Detonate here)');
}
{
  // Numb, Siphon, Seize, Converge on their moments.
  const { world, player, spawn } = setup({
    edit: (c) => {
      c.placements = [
        { moment: 'target-full', pieceId: 'apprentice-numb', conditions: [] },
        { moment: 'hp-low', pieceId: 'apprentice-siphon', conditions: [] },
        { moment: 'enemy-winds-up', pieceId: 'apprentice-seize', conditions: [] },
      ];
    },
  });
  const target = spawn(430, 400);
  for (let i = 0; i < 8; i++) hit(world, player, target);
  step(world, player);
  assert.equal(sigils(target), 0, 'Numb spends the sigils');
  assert.ok(getStatusEffect(target.tracksCombat, 'ability-slowed'), 'and slows the target');

  for (let i = 0; i < 4; i++) hit(world, player, target);
  player.hasHealth.hp = Math.round(player.hasHealth.maxHp * 0.1);
  const before = player.hasHealth.hp;
  step(world, player);
  assert.ok(player.hasHealth.hp > before && sigils(target) === 0, 'Siphon spends sigils to heal you');

  for (let i = 0; i < 4; i++) hit(world, player, target);
  recordMoment(world, player, 'enemy-winds-up');
  step(world, player);
  assert.equal(sigils(target), 0, 'Seize spends the sigils');
  assert.ok(target.tracksCombat.statusEffects.some((e) => e.id === 'stunned'), 'and holds the target');
}
{
  const { world, player, spawn } = setup({ edit: (c) => { c.placements = [{ moment: 'target-low', pieceId: 'apprentice-converge', conditions: [] }]; } });
  const target = spawn(430, 400);
  const other = spawn(460, 400);
  target.hasHealth.hp = 1000; // Low enough for Converge, but survives the full unconverted hit.
  laySigils(world, player, other, 4, 6);
  hit(world, player, target);
  step(world, player);
  assert.equal(sigils(other), 0, 'Converge pulls the sigils off the enemies near the target');
  assert.ok(sigils(target) >= 4, 'onto the target');
}

// ── Trophies and weapons ─────────────────────────────────────────────────────
{
  const { world, player, spawn } = setup({ relic: ['apprentice-relic-forest'], bossesCleared: ['forest:1'] });
  const target = spawn(430, 400);
  hit(world, player, target);
  assert.equal(sigils(target), 3, 'Firstbrand: the first hit on a clean enemy lays three');
}
{
  const { world, player, spawn } = setup({ passives: { 'apprentice.sigils-per-hit': 3, 'apprentice.cap-extra': 1 } });
  const target = spawn(430, 400);
  hit(world, player, target);
  assert.equal(sigils(target), 3, 'Runestone Staff: three sigils per hit');
  for (let i = 0; i < 5; i++) hit(world, player, target);
  assert.equal(sigils(target), 7, 'and the cap is one higher');
}
{
  const { world, player, spawn } = setup({ passives: { 'apprentice.branching': 1 } });
  const target = spawn(430, 400);
  const other = spawn(470, 400);
  hit(world, player, target);
  assert.equal(sigils(other), 1, 'Branching Wand: each hit also lays a sigil on the nearest other enemy');
}
{
  const { world, player, spawn } = setup({ relic: ['apprentice-relic-cave'], bossesCleared: ['cave:1'], edit: (c) => { c.placements = []; } });
  const target = spawn(430, 400);
  laySigils(world, player, target, 3, 6);
  for (let i = 0; i < 40; i++) step(world, player);
  assert.ok(sigils(target) > 3, 'Brood Sigils: an enemy carrying three or more grows another');
}

// ── Lines ────────────────────────────────────────────────────────────────────
{
  const { world, player, spawn } = setup({ passives: { 'apprentice.feeding': 0.15 } });
  const a = spawn(430, 400);
  const b = spawn(450, 410);
  laySigils(world, player, a, 1, 6);
  laySigils(world, player, b, 1, 6);
  step(world, player);
  assert.ok(getResource(player.tracksCombat, 'apprentice.recoveryX') > 1.2, 'Feeding Swarm: Recovery rises for each enemy carrying your sigils');
}


// Sigils are the only class DoT: below-cap ticks and owed damage are linear, without a flag.
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  laySigils(world, player, target, 2, payoffsOf(world, player)!.cap);
  const effect = getStatusEffect(target.tracksCombat, SIGIL)!;
  assert.equal(effect.data['sigil'], undefined, 'no legacy-vs-sigil sentinel');
  const rawTick = 2 * effect.data['damagePerStack']!;
  const owed = playerDotsOnMonster(world, player, target)[0]!;
  assert.equal(owed.remainingDamage, rawTick * 6, 'the inventory projects six linear ticks below cap');
  const before = target.hasHealth.hp;
  target.mitigatesDamage.plating = 1_000_000;
  updateDotArchetype(world, 1000, clock);
  assert.equal(before - target.hasHealth.hp, rawTick, 'sigils ignore plating and never front-load');

  const def = MONSTER_DATABASE.get(target.isMonster.monsterTypeId)!;
  MONSTER_DATABASE.set(def.id, { ...def, dotResistance: 0.25 });
  try {
    target.mitigatesDamage.damageReduction = 0.4;
    const hp = target.hasHealth.hp;
    effect.remainingMs = 0;
    updateDotArchetype(world, 1000, clock);
    assert.equal(hp - target.hasHealth.hp, Math.round(rawTick * 0.8 * 0.75), 'the expiry tick pays half DR and monster DoT resistance');
    assert.equal(getStatusEffect(target.tracksCombat, SIGIL), undefined, 'the expiry tick removes the sigils');
    assert.equal(target.hasDot, undefined, 'and the ticker detaches its marker');
  } finally {
    MONSTER_DATABASE.set(def.id, def);
  }
}

console.log('apprenticeSigils: ok');
