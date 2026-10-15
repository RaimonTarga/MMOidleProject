/**
 * The Squire's T1 gear at runtime (class-first build plan CQ.4; bible §8.4): each weapon job
 * and line does its one thing, and equipping the gear turns it on. Wiring only.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_UNYIELDING_EFFECT_ID,
  applyStatusEffect,
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
import { addResolve, updateSquire } from '../src/systems/classes/archetypes/cooldown/squire';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { beginCharge } from '../src/systems/combat/engine/monsterMechanics';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { applyStun } from '../src/systems/combat/status/stun';
import { equipItem } from '../src/systems/player/economy/inventory';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-sqgear-dummy', {
  ...base, id: 'test-sqgear-dummy', evasion: 0,
  dotEffect: { debuffId: 'test-sqgear-poison', label: 'Test Poison', damagePerStack: 20, maxStacks: 3, tickIntervalMs: 1000, durationMs: 6000 },
  chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 },
});
let clock = 200_000;
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };

function setup(only?: string[]) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'squire', name: 'Squire' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
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
  const ctx = classConfigContextFromState({ combatArchetype: 'cooldown', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null })!;
  const config = defaultClassConfig(ctx);
  if (config.system.kind === 'responses' && only) {
    (config.system as ResponsesConfig).rules = config.system.rules.filter((r) => only.includes(r.pieceId));
  }
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-sqgear-dummy', { x, y })!;
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

function step(world: World, player: PlayerEntity, dt = 100): void {
  clock += dt;
  world.tickCounter += 1;
  updatePlayerMoments(world, player, clock);
  updateSquire(world, dt, clock);
}

function slam(world: World, player: PlayerEntity, target: MonsterEntity): void {
  addResolve(world, player, 100);
  step(world, player);
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'squire', kind: 'player' } });
}

function engage(world: World, player: PlayerEntity, m: MonsterEntity): void {
  setAggroTarget(world, m, { id: player.isPlayer.id, kind: 'player' }, clock);
}

// 1. Equipping turns the keys on.
{
  const { world, player } = setup([]);
  player.holdsInventory.inventory.push('squire-flanged-mace-t1', 'cave-charm-t1');
  assert(equipItem(world, player, 'squire-flanged-mace-t1'), 'the Squire wields the Flanged Mace');
  assert((player.usesSkills.passives['squire.slam-radius-pct'] ?? 0) > 0, 'its wider slam is on');
  assert(equipItem(world, player, 'cave-charm-t1'), 'the Squire wears the Cave charm');
  assert((player.usesSkills.passives['defense.recovery-active-pct'] ?? 0) > 0, 'Old Guard keeps Recovery on in combat');
}

// 2. Flanged Mace: a wider slam reaches further.
{
  const reach = (pct: number): boolean => {
    const { world, player, target, spawn } = setup([]);
    player.usesSkills.passives['squire.slam-radius-pct'] = pct;
    const far = spawn(400, 530); // 130 px away: outside the base circle
    slam(world, player, target);
    return far.hasHealth.hp < far.hasHealth.maxHp;
  };
  assert(!reach(0) && reach(0.3), 'the wider slam reaches an enemy the plain one misses');
}

// 3. Spiked Flail: the slam leaves a bleed.
{
  const { world, player, target } = setup([]);
  player.usesSkills.passives['squire.slam-bleed-pct'] = 0.3;
  slam(world, player, target);
  assert(getStatusEffect(target.tracksCombat, 'cadence-hemorrhage'), 'the slammed enemy bleeds');
}

// 4. Warhammer: a slam soon after a caught telegraph hits much harder.
{
  const slamDamage = (afterCatch: boolean): number => {
    const { world, player, target } = setup(['squire-guard']);
    player.usesSkills.passives['squire.slam-after-guard-pct'] = 1;
    player.usesSkills.passives['squire.slam-after-guard-ms'] = 4000;
    if (afterCatch) {
      engage(world, player, target);
      addResolve(world, player, 2);
      beginCharge(target, clock, 3000);
      step(world, player);
      target.dealsDamage.attack = 100;
      runMonsterAttack(world, target, player, clock, 2);
    }
    const before = target.hasHealth.hp;
    slam(world, player, target);
    return before - target.hasHealth.hp;
  };
  const plain = slamDamage(false);
  assert(slamDamage(true) > plain, 'the slam after a catch is bigger');
}

// 5. Tower Shield: Shield Bash costs less and stuns longer.
{
  const bash = (cut: number): { spent: number; stunMs: number } => {
    const { world, player, target } = setup(['squire-shield-bash']);
    player.usesSkills.passives['squire.bash-cost-cut-pct'] = cut;
    player.usesSkills.passives['squire.bash-stun-pct'] = cut;
    engage(world, player, target);
    addResolve(world, player, 3);
    step(world, player);
    const before = player.usesCooldown!.resolve;
    beginCharge(target, clock, 3000);
    step(world, player);
    const refund = 2;
    return { spent: before + refund - player.usesCooldown!.resolve, stunMs: getStatusEffect(target.tracksCombat, 'stunned')?.remainingMs ?? 0 };
  };
  const plain = bash(0);
  const tower = bash(0.5);
  assert(tower.spent < plain.spent && tower.stunMs > plain.stunMs, 'cheaper and longer');
}

// 6. Rampart and Breather: a shoved enemy deals less; a landed Shove heals.
{
  const { world, player, target, spawn } = setup(['squire-shove']);
  player.usesSkills.passives['squire.shove-weaken-pct'] = 0.5;
  player.usesSkills.passives['squire.shove-weaken-ms'] = 4000;
  player.usesSkills.passives['squire.shove-heal-pct'] = 0.01;
  const crowd = [target, spawn(370, 400), spawn(400, 370)];
  for (const m of crowd) engage(world, player, m);
  player.hasHealth.hp = 5000;
  addResolve(world, player, 3);
  step(world, player);
  assert(player.hasHealth.hp > 5000, 'Breather heals');
  target.dealsDamage.attack = 200;
  const before = player.hasHealth.hp;
  runMonsterAttack(world, target, player, clock);
  const weakened = before - player.hasHealth.hp;
  const fresh = setup([]);
  fresh.target.dealsDamage.attack = 200;
  const freshBefore = fresh.player.hasHealth.hp;
  runMonsterAttack(fresh.world, fresh.target, fresh.player, clock);
  assert(weakened < freshBefore - fresh.player.hasHealth.hp, 'Rampart: the shoved enemy hits softer');
}

// 7. Iron Gut and Purifying Breath: Steel Will costs less and heals.
{
  const { world, player, target } = setup(['squire-steel-will']);
  player.usesSkills.passives['squire.steel-will-cost-cut-pct'] = 0.5;
  player.usesSkills.passives['squire.cleanse-heal-pct'] = 0.5;
  addResolve(world, player, 3);
  step(world, player);
  player.hasHealth.hp = 5000;
  applyMonsterDotToPlayer(world, target, player, MONSTER_DATABASE.get('test-sqgear-dummy')!.dotEffect!);
  const before = player.usesCooldown!.resolve;
  step(world, player);
  assert(player.hasHealth.hp > 5000, 'Purifying Breath heals part of what the poison had left');
  assert(before + 1.5 - player.usesCooldown!.resolve < 1, 'Iron Gut: it cost less than a full pip');
}

// 8. Planted: while braced, stuns don't land.
{
  const { world, player, target } = setup(['squire-guard']);
  player.usesSkills.passives['squire.guard-steadfast'] = 1;
  engage(world, player, target);
  addResolve(world, player, 2);
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(getStatusEffect(player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID), 'the brace is unshakable');
  assert(!applyStun(player.tracksCombat, 2000, 'test'), 'a stun does not land');
}

// 9. Reforged: corrosion stripped from you fills Resolve and comes back off.
{
  const { world, player } = setup([]);
  player.usesSkills.passives['squire.shred-fill-pips'] = 0.5;
  player.usesSkills.passives['squire.shred-regrow-ms'] = 1000;
  applyStatusEffect(player.tracksCombat, { id: 'plating-shred', maxStacks: 5, remainingMs: -1, refreshable: false, sourceId: 'm', data: { platingPerStack: 1 } });
  applyStatusEffect(player.tracksCombat, { id: 'plating-shred', maxStacks: 5, remainingMs: -1, refreshable: false, sourceId: 'm', data: { platingPerStack: 1 } });
  step(world, player, 100);
  assert(player.usesCooldown!.resolve >= 1, `each stack stripped fills Resolve (${player.usesCooldown!.resolve})`);
  step(world, player, 1000);
  assert((getStatusEffect(player.tracksCombat, 'plating-shred')?.stacks ?? 0) < 2, 'a stack comes back off');
}

console.log('squireGear.test.ts: ok');
