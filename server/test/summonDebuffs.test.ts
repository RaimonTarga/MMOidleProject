/**
 * Monster debuffs land on summons (class-first build plan S1, bible §7.10): a monster's hit
 * on a summon carries the same riders it carries onto a player, the summon's statuses tick,
 * its DoTs hurt it, and what it carries slows, stops or weakens it. Wiring only: no numbers.
 */
import assert from 'node:assert/strict';
import {
  emptyEquipment,
  FROST_RAMP_EFFECT_ID,
  getStatusEffect,
  isMonsterDotStatusEffectId,
  MONSTER_DATABASE,
  SUN_MARK_EFFECT_ID,
  SUNDERED_EFFECT_ID,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MinionEntity } from '../src/ecs/entity';
import { assertMarkerInvariants } from '../src/ecs/markerInvariants';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { runMonsterAttack, runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import {
  minionAttackCooldown,
  minionCanSwing,
  minionMoveSpeedMult,
  updateMinionAfflictions,
} from '../src/systems/combat/status/minionAfflictions';
import { applyStun } from '../src/systems/combat/status/stun';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';

// A test monster carrying every on-hit rider at once.
const base = MONSTER_DATABASE.get('bone-crawler');
assert(base, 'the base monster exists');
const RIDER_MOB = 'test-summon-rider-mob';
MONSTER_DATABASE.set(RIDER_MOB, {
  ...base,
  id: RIDER_MOB,
  dotEffect: { debuffId: 'test-summon-poison', label: 'Test Poison', damagePerStack: 5, maxStacks: 3, tickIntervalMs: 1000, durationMs: 3000 },
  slowEffect: { speedMult: 0.5, durationMs: 4000 },
  appliesAntiheal: { reductionPerStack: 0.2, maxStacks: 2, durationMs: 4000 },
  appliesVulnerability: { damageTakenPct: 0.2, maxStacks: 1, durationMs: 4000 },
  rampDebuff: { moveSlowPerHit: 0.1, moveSlowMaxPct: 0.3, atkSlowPerHit: 0.1, atkSlowMaxPct: 0.3, stackDurationMs: 4000 },
  appliesMark: { durationMs: 4000 },
  markedStrike: { multiplier: 2 },
});

function setup() {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'p', name: 'P' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [], knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
    },
  } as PersistedPlayerSlices, 'p');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  updateSummonerArchetype(world, 0, 1000);
  const monster = world.createMonster(NODE, RIDER_MOB, { x: 405, y: 400 });
  assert(monster, 'the rider monster spawns');
  return { world, player, monster };
}

function firstMinion(world: World, ids: readonly (string | null)[]): MinionEntity {
  const id = ids.find((m): m is string => !!m);
  const minion = id ? world.getMinionEntity(id) : undefined;
  assert(minion, 'the Conduit fields a summon');
  minion.hasHealth.hp = minion.hasHealth.maxHp = 100_000;
  minion.mitigatesDamage.plating = 0;
  minion.mitigatesDamage.damageReduction = 0;
  return minion;
}

// 1. A hit on a summon carries every rider, and its DoT.
{
  const { world, player, monster } = setup();
  const minion = firstMinion(world, player.summonsMinions!.minionIds);
  const cs = minion.tracksCombat;
  const baseSpeed = minionMoveSpeedMult(minion);
  const baseCooldown = minionAttackCooldown(minion);

  runMonsterAttackOnMinion(world, monster, minion, 1000);
  for (const id of ['slow', 'antiheal', SUNDERED_EFFECT_ID, FROST_RAMP_EFFECT_ID, SUN_MARK_EFFECT_ID]) {
    assert(getStatusEffect(cs, id), `the summon carries ${id}`);
  }
  assert(cs.statusEffects.some((e) => isMonsterDotStatusEffectId(e.id)), 'the summon carries the monster DoT');
  assert(minion.hasDot, 'the DoT marker is on the summon');
  assert(minionMoveSpeedMult(minion) < baseSpeed, 'the slow and the frost ramp slow the summon');
  assert(minionAttackCooldown(minion) > baseCooldown, 'the frost ramp slows its swings');

  // 2. The finisher cashes the mark on a summon, and doesn't repaint on that hit.
  monster.dealsDamage.attack = 100;
  const beforeCash = minion.hasHealth.hp;
  runMonsterAttackOnMinion(world, monster, minion, 2000);
  const cashed = beforeCash - minion.hasHealth.hp;
  assert(!getStatusEffect(cs, SUN_MARK_EFFECT_ID), 'the cashed mark is spent');
  const beforePlain = minion.hasHealth.hp;
  runMonsterAttackOnMinion(world, monster, minion, 3000);
  const plain = beforePlain - minion.hasHealth.hp;
  assert(cashed > plain, `the marked hit lands harder (${cashed} vs ${plain})`);
  assert(getStatusEffect(cs, SUN_MARK_EFFECT_ID), 'the next hit paints it again');
  assert(plain > 100, `sundering raises the damage the summon takes (${plain})`);

  // 3. Its DoT ticks, and its statuses run out.
  const beforeTick = minion.hasHealth.hp;
  updateMinionAfflictions(world, 1000);
  assert(minion.hasHealth.hp < beforeTick, 'the DoT hurts the summon');
  for (let t = 0; t < 12; t++) {
    updateCombatState(world, 500);
    updateMinionAfflictions(world, 500);
  }
  assert(!cs.statusEffects.some((e) => isMonsterDotStatusEffectId(e.id)), 'the DoT runs out');
  assert(!minion.hasDot, 'and the marker comes off');
  assert(!getStatusEffect(cs, 'slow') && !getStatusEffect(cs, SUNDERED_EFFECT_ID), 'the debuffs run out');
  assert.equal(minionMoveSpeedMult(minion), baseSpeed, 'its speed comes back');
  assert.deepEqual(assertMarkerInvariants(world), [], 'markers match statuses');
}

// 4. A stunned summon stands still and doesn't swing.
{
  const { world, player } = setup();
  const minion = firstMinion(world, player.summonsMinions!.minionIds);
  assert(minionCanSwing(minion), 'a free summon swings');
  applyStun(minion.tracksCombat, 2000, 'test');
  assert(!minionCanSwing(minion), 'a stunned summon does not');
  assert.equal(minionMoveSpeedMult(minion), 0, 'nor moves');
}

// 5. A summon a DoT kills is rebuilt like any death.
{
  const { world, player, monster } = setup();
  const minion = firstMinion(world, player.summonsMinions!.minionIds);
  const id = minion.isMinion.id;
  runMonsterAttackOnMinion(world, monster, minion, 1000);
  minion.hasHealth.hp = 1;
  updateMinionAfflictions(world, 1000);
  assert.equal(minion.hasHealth.hp, 0, 'the DoT kills the summon');
  updateSummonerArchetype(world, 100, 2000);
  assert(!world.getMinionEntity(id), 'the summoner tick takes the dead summon off the field');
}

// 6. Players still take the same riders through the same table.
{
  const { world, player, monster } = setup();
  runMonsterAttack(world, monster, player, 1000);
  for (const id of ['slow', SUNDERED_EFFECT_ID, FROST_RAMP_EFFECT_ID, SUN_MARK_EFFECT_ID]) {
    assert(getStatusEffect(player.tracksCombat, id), `the player carries ${id}`);
  }
}

console.log('summonDebuffs.test.ts: ok');
