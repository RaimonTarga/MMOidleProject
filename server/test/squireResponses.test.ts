/**
 * The Squire at runtime (class-first build plan CQ.1–CQ.2; bible §8.2–§8.4): Resolve fills
 * from hits and the trickle, a full bar arms the slam (held by its rule), each T1 response
 * answers its moment and refunds when it lands, and the T1 trophies twist the slam or the
 * flow. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getStatusEffect,
  MONSTER_DATABASE,
  type ResponsesConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { addResolve, SQUIRE_GUARD_EFFECT_ID, squireDotTickFill, updateSquire } from '../src/systems/classes/archetypes/cooldown/squire';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { beginCharge, chargedCastEndsAt } from '../src/systems/combat/engine/monsterMechanics';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-squire-dummy', {
  ...base, id: 'test-squire-dummy', evasion: 0,
  dotEffect: { debuffId: 'test-squire-poison', label: 'Test Poison', damagePerStack: 5, maxStacks: 3, tickIntervalMs: 1000, durationMs: 6000 },
  chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 },
});

let clock = 100_000;
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };

function setup(opts: { relic?: string[]; bossesCleared?: string[]; edit?: (c: ResponsesConfig) => void } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'squire', name: 'Squire' },
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
      unlockedSkills: ['cooldown-root'], passives: {}, selectedClass: 'cooldown-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cooldown',
    },
  } as PersistedPlayerSlices, 'squire');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'cooldown', biomeLevel: BIOMES, bossesCleared: opts.bossesCleared ?? [], disciplineId: null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'responses') opts.edit?.(config.system);
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-squire-dummy', { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  step(world, player, 0);
  return { world, player, target, spawn };
}

/** One tick of what the Squire reads: the moments, then its runtime. */
function step(world: World, player: PlayerEntity, dt = 100): void {
  clock += dt;
  world.tickCounter += 1;
  updatePlayerMoments(world, player, clock);
  updateSquire(world, dt, clock);
}

function engage(world: World, player: PlayerEntity, monster: MonsterEntity): void {
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, clock);
}

// 1. The bar's size is the budget; hits and the trickle fill it.
{
  const { world, player, target } = setup();
  const cd = player.usesCooldown!;
  assert(cd.resolveMax >= 4, `the bar is the budget (${cd.resolveMax})`);
  target.dealsDamage.attack = 2500;
  runMonsterAttack(world, target, player, clock);
  assert(cd.resolve >= 0.9, `a quarter-of-HP raw hit fills about a pip (${cd.resolve})`);
  const before = cd.resolve;
  engage(world, player, target);
  for (let i = 0; i < 10; i++) step(world, player, 1000);
  assert(cd.resolve > before, 'an enemy engaged with you trickles Resolve in');
}

// 2. A full bar arms the slam; the slam hits everything around you and spends the bar.
{
  const { world, player, target, spawn } = setup({ edit: (c) => { c.rules = []; } });
  const other = spawn(380, 420);
  addResolve(world, player, 100);
  step(world, player);
  assert(isEmpoweredAttack(player), 'a full bar arms the slam');
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'squire', kind: 'player' } });
  assert(other.hasHealth.hp < other.hasHealth.maxHp, 'everything around you takes the slam');
  assert(player.usesCooldown!.resolve === 0, 'the slam spends the bar');
}

// 3. The slam rule holds it (never fires early).
{
  const { world, player } = setup({ edit: (c) => { c.rules = []; c.holdSlam = [{ id: 'target-low', param: 1.01 }]; } });
  addResolve(world, player, 100);
  step(world, player);
  assert(!isEmpoweredAttack(player), 'the slam is held while the rule holds');
}

// 4. Shove: three or more on you, pushed back; lands and refunds.
{
  const { world, player, target, spawn } = setup();
  const crowd = [target, spawn(370, 400), spawn(400, 370)];
  for (const m of crowd) engage(world, player, m);
  addResolve(world, player, 2);
  const before = player.usesCooldown!.resolve;
  step(world, player);
  assert(crowd.every((m) => m.hasKnockback !== undefined), 'the crowd is shoved back');
  assert(player.usesCooldown!.resolve > before, `a landed Shove refunds more than it cost (${player.usesCooldown!.resolve} > ${before})`);
}

// 5. Riposte: the third hit in a row from one enemy is struck back.
{
  const { world, player, target } = setup();
  engage(world, player, target);
  addResolve(world, player, 2);
  target.dealsDamage.attack = 10;
  for (let i = 0; i < 3; i++) runMonsterAttack(world, target, player, clock);
  const before = target.hasHealth.hp;
  step(world, player);
  assert(target.hasHealth.hp < before, 'the attacker is struck back');
}

// 6. Steel Will: a poison that lands is shaken off.
{
  const { world, player, target } = setup();
  addResolve(world, player, 2);
  applyMonsterDotToPlayer(world, target, player, MONSTER_DATABASE.get('test-squire-dummy')!.dotEffect!);
  step(world, player);
  assert(!player.tracksCombat.statusEffects.some((e) => e.id.startsWith('monster-dot')), 'the poison is shaken off');
}

// 7. Guard: a telegraphed blow aimed at you is braced for, caught, and refunds.
{
  const { world, player, target } = setup({ edit: (c) => { c.rules = c.rules.filter((r) => r.pieceId === 'squire-guard'); } });
  engage(world, player, target);
  addResolve(world, player, 2);
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'the Squire braces');
  const resolveBefore = player.usesCooldown!.resolve;
  target.dealsDamage.attack = 1000;
  const hpBefore = player.hasHealth.hp;
  runMonsterAttack(world, target, player, clock, 2);
  const caught = hpBefore - player.hasHealth.hp;
  assert(caught < 1000, `the caught blow deals much less (${caught})`);
  assert(!getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'the brace is spent');
  assert(player.usesCooldown!.resolve > resolveBefore, 'catching it refunds');
}

// 8. Shield Bash: the enemy's wind-up is bashed: stunned and interrupted.
{
  const { world, player, target } = setup({ edit: (c) => { c.rules = c.rules.filter((r) => r.pieceId === 'squire-shield-bash'); } });
  engage(world, player, target);
  addResolve(world, player, 2);
  step(world, player);
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(getStatusEffect(target.tracksCombat, STUN_EFFECT), 'the caster is stunned');
  assert(chargedCastEndsAt(target) <= 0, 'and its wind-up interrupted');
}

// 9. Trophies: Muster fills when enemies join; Relentless slams at a third; Rot-Eater fills
//    from DoT; Corrode strips plating.
{
  const { world, player, target } = setup({ relic: ['squire-relic-plains'], bossesCleared: ['plains:1'], edit: (c) => { c.rules = []; } });
  engage(world, player, target);
  step(world, player);
  assert(player.usesCooldown!.resolve > 0, 'Muster: an enemy joining fills Resolve');
}
{
  const { world, player } = setup({ relic: ['squire-relic-forest'], bossesCleared: ['forest:1'], edit: (c) => { c.rules = []; } });
  addResolve(world, player, player.usesCooldown!.resolveMax * 0.4);
  step(world, player);
  assert(isEmpoweredAttack(player), 'Relentless: the slam arms at a third of the bar');
}
{
  const { world, player } = setup({ relic: ['squire-relic-swamp'], bossesCleared: ['swamp:1'], edit: (c) => { c.rules = []; } });
  squireDotTickFill(world, player, 2500);
  assert(player.usesCooldown!.resolve > 0, 'Rot-Eater: a DoT tick fills Resolve');
}
{
  const { world, player, target } = setup({ relic: ['squire-relic-cave'], bossesCleared: ['cave:1'], edit: (c) => { c.rules = []; } });
  addResolve(world, player, 100);
  step(world, player);
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'squire', kind: 'player' } });
  assert(getStatusEffect(target.tracksCombat, 'plating-shred'), 'Corrode strips plating');
}

console.log('squireResponses.test.ts: ok');
