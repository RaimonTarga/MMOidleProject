/**
 * OV-SQUIRE fixes to the default Response rules (bible §8.13), wiring only:
 * 1. Shove isn't thrown when a boss (which can't be moved) is one of the three enemies on you.
 * 2. Shield Bash answers an interruptible wind-up before Guard, and the Guard isn't raised (or
 *    paid for) against the blow the Bash stopped.
 * 3. Shield Bash leaves a control-immune enemy's wind-up to the Guard instead of wasting a pip.
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
import { addResolve, SQUIRE_GUARD_EFFECT_ID, updateSquire } from '../src/systems/classes/archetypes/cooldown/squire';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { beginCharge, chargedCastEndsAt } from '../src/systems/combat/engine/monsterMechanics';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-ov-squire-dummy', {
  ...base, id: 'test-ov-squire-dummy', evasion: 0,
  chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 },
});
MONSTER_DATABASE.set('test-ov-squire-immune', {
  ...base, id: 'test-ov-squire-immune', evasion: 0, controlImmune: true,
  chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 },
});

let clock = 100_000;
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };

function setup(rules: string[], targetType = 'test-ov-squire-dummy') {
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
  if (config.system.kind === 'responses') {
    const system: ResponsesConfig = config.system;
    system.rules = system.rules.filter((rule) => rules.includes(rule.pieceId));
  }
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  const spawn = (x: number, y: number, type = 'test-ov-squire-dummy'): MonsterEntity => {
    const m = world.createMonster(NODE, type, { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    return m;
  };
  const target = spawn(430, 400, targetType);
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

function engage(world: World, player: PlayerEntity, monster: MonsterEntity): void {
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, clock);
}

// 1. A boss and two adds on you: Shove isn't thrown (no pip spent); a third add makes it land.
{
  const { world, player, target, spawn } = setup(['squire-shove']);
  target.isMonster.isBoss = true;
  engage(world, player, target);
  engage(world, player, spawn(420, 430));
  engage(world, player, spawn(380, 420));
  addResolve(world, player, 3);
  const before = player.usesCooldown!.resolve;
  step(world, player);
  assert(player.usesCooldown!.resolve >= before, `no pip spent on a shove that can't land (${player.usesCooldown!.resolve} vs ${before})`);
  engage(world, player, spawn(370, 380));
  const third = player.usesCooldown!.resolve;
  step(world, player);
  assert(player.usesCooldown!.resolve > third, 'three movable enemies: the shove lands and refunds');
}

// 2. An interruptible wind-up at you: the Bash interrupts it and no Guard is raised for it.
{
  const { world, player, target } = setup(['squire-guard', 'squire-shield-bash']);
  engage(world, player, target);
  addResolve(world, player, 3);
  step(world, player);
  const before = player.usesCooldown!.resolve;
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(getStatusEffect(target.tracksCombat, STUN_EFFECT), 'the Bash stuns the caster');
  assert(chargedCastEndsAt(target) <= 0, 'and interrupts its wind-up');
  assert(!getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'no Guard is raised for the blow the Bash stopped');
  assert(player.usesCooldown!.resolve > before, `the Bash's refund is not eaten by a Guard (${player.usesCooldown!.resolve} vs ${before})`);
}

// 3. A control-immune enemy winds up at you: no Bash (it can't be interrupted); the Guard braces.
{
  const { world, player, target } = setup(['squire-guard', 'squire-shield-bash'], 'test-ov-squire-immune');
  engage(world, player, target);
  addResolve(world, player, 3);
  step(world, player);
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(!getStatusEffect(target.tracksCombat, STUN_EFFECT), 'no Bash thrown at a control-immune enemy');
  assert(chargedCastEndsAt(target) > clock, 'its wind-up goes on');
  assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'the Guard braces for it instead');
}

console.log('squireOvFixes: ok');
