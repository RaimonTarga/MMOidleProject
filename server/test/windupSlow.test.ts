/**
 * The wind-up slow (OV-HOOKS item 2; bible §9.16 Numb II, "a numbed enemy's wind-ups also take
 * longer"): while a live status on a monster carries `windupSlowPct`, every wind-up it is in
 * the middle of runs slow, an ordinary cast's and a boss pattern step's alike, and the
 * telegraphs it painted move with the clock. Numb II writes the key. Wiring only: placeholders.
 *
 * Run: node --conditions=development --import tsx test/windupSlow.test.ts
 */
import assert from 'node:assert/strict';
import {
  ABILITY_SLOW_EFFECT_ID,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getStatusEffect,
  MONSTER_DATABASE,
  type BossPattern,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateApprentice } from '../src/systems/classes/archetypes/dot/sigils';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import {
  beginCharge,
  chargedCastEndsAt,
  monsterWindupSlowPct,
  WINDUP_SLOW_PCT_KEY,
} from '../src/systems/combat/engine/monsterMechanics';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { applyMonsterSlow } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { publishGroundZone } from '../src/systems/world/groundZones';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-windup-dummy', { ...base, id: 'test-windup-dummy', evasion: 0 });
const SLAM: BossPattern = {
  id: 'test-windup-slam', name: 'Slam', damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 0,
  steps: [
    { kind: 'cast', name: 'Wind-up', castMs: 1000 },
    { kind: 'impact', name: 'Slam', anchor: 'self', radius: 100, telegraphMs: 1000, damageMult: 1 },
    { kind: 'recovery', label: 'Spent', durationMs: 500 },
  ],
};
MONSTER_DATABASE.set('test-windup-boss', { ...base, id: 'test-windup-boss', evasion: 0, bossPattern: SLAM } as never);

let clock = 100_000;

function playerSlices(id: string, archetype: string | null, biomes: Record<string, number> = {}): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 2, currentSkillTier: 0, bossesCleared: [], clearedNodes: [], runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype ? [`${archetype}-root`] : [], passives: {}, selectedClass: archetype ? `${archetype}-root` : null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: archetype as never,
    },
  } as PersistedPlayerSlices;
}

function arena(typeId: string): { world: World; player: PlayerEntity; monster: MonsterEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('target', null), 'target');
  const monster = world.createMonster(NODE, typeId, { x: 440, y: 400 })!;
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, clock);
  monster.hasAwareness.state = 'attacking';
  return { world, player, monster };
}

function tick(world: World, ticks = 1): void {
  for (let i = 0; i < ticks; i++) {
    clock += 100;
    updateBossPatterns(world, 100, clock);
  }
}

/** Slow the monster's wind-ups by `pct` (the key on its slow, as Numb II writes it). */
function numb(world: World, monster: MonsterEntity, pct: number, ms = 10_000): void {
  applyMonsterSlow(world, monster, 0.3, ms, 'test');
  getStatusEffect(monster.tracksCombat, ABILITY_SLOW_EFFECT_ID)!.data[WINDUP_SLOW_PCT_KEY] = pct;
}

const slamZone = (world: World, ownerId: string) =>
  (world.groundZones.get(NODE) ?? []).find((zone) => zone.kind === 'slam-telegraph' && zone.ownerId === ownerId) as
    { resolvesAtMs: number } | undefined;

// 1. An ordinary charged wind-up and its circle run slow together.
{
  const { world, monster } = arena('test-windup-dummy');
  beginCharge(monster, clock, 2000);
  publishGroundZone(world, NODE, {
    kind: 'slam-telegraph', pos: { x: 400, y: 400 }, radius: 80, startedAtMs: clock, resolvesAtMs: clock + 2000, ownerId: monster.isMonster.id,
  });
  const endsAt = chargedCastEndsAt(monster);
  tick(world, 10);
  assert.equal(chargedCastEndsAt(monster), endsAt, 'unslowed, the wind-up keeps its clock');
  numb(world, monster, 0.5);
  assert.equal(monsterWindupSlowPct(monster), 0.5, 'the strongest carrier is read');
  tick(world, 10);
  assert.equal(chargedCastEndsAt(monster), endsAt + 500, 'a second under a 0.5 wind-up slow pushes the blow half a second later');
  assert.equal(slamZone(world, monster.isMonster.id)?.resolvesAtMs, endsAt + 500, 'and its circle fills with it');
  assert.equal(monster.hasStatus.windupSlowPct, 0.5, 'the slow is published for the cast bar on the client');
  getStatusEffect(monster.tracksCombat, ABILITY_SLOW_EFFECT_ID)!.remainingMs = 0;
  tick(world, 1);
  assert.equal(monster.hasStatus.windupSlowPct, undefined, 'and cleared when it ends');
}

// 2. A boss pattern's cast step runs slow, and so does the telegraph after it.
{
  const plain = arena('test-windup-boss');
  tick(plain.world, 1);
  assert.ok(plain.monster.runsBossPattern, 'the pattern arms');
  tick(plain.world, 11);
  assert.equal(plain.monster.runsBossPattern?.stepIndex, 1, 'unslowed, the 1 s cast is done in 1 s');

  const { world, monster } = arena('test-windup-boss');
  numb(world, monster, 0.5);
  tick(world, 1);
  tick(world, 11);
  assert.equal(monster.runsBossPattern?.stepIndex, 0, 'numbed, the cast is still winding up after 1 s');
  tick(world, 12);
  assert.equal(monster.runsBossPattern?.stepIndex, 1, 'and done about a second later');
  const zone = slamZone(world, monster.isMonster.id);
  assert.ok(zone, 'the slam telegraph is down');
  assert.equal(zone.resolvesAtMs, monster.runsBossPattern!.stepEndsAtMs, 'and its circle runs on the same clock as the step');
  tick(world, 5);
  assert.equal(zone.resolvesAtMs, monster.runsBossPattern!.stepEndsAtMs, 'held back together');
}

// 3. Numb II writes the key; Numb I does not.
{
  const T2 = 8;
  const biomesWith = (forest: number) => ({ plains: T2, forest, swamp: T2, mountain: T2, cave: T2, jungle: T2, desert: T2 });
  const numbedTarget = (forest: number): MonsterEntity => {
    const biomes = biomesWith(forest);
    const world = new World();
    const player = world.attachPlayerEntity(playerSlices('apprentice', 'dot', biomes), 'apprentice');
    syncArchetypeSlices(world, player);
    recalculatePlayerEntityStats(world, player);
    player.hasHealth.hp = player.hasHealth.maxHp = 10_000;
    const ctx = classConfigContextFromState({ combatArchetype: 'dot', biomeLevel: biomes, bossesCleared: [], disciplineId: null })!;
    const config = defaultClassConfig(ctx);
    if (config.system.kind === 'payoffs') config.system.placements = [{ moment: 'target-full', pieceId: 'apprentice-numb', conditions: [] }];
    attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
    player.dealsDamage.attack = 100;
    const target = world.createMonster(NODE, 'test-windup-dummy', { x: 430, y: 400 })!;
    target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
    target.mitigatesDamage.plating = 0;
    target.mitigatesDamage.damageReduction = 0;
    setAttackTarget(world, player, target.isMonster.id);
    for (let i = 0; i < 10; i++) {
      clock += 1_000;
      runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'apprentice', kind: 'player' } });
    }
    clock += 100;
    world.tickCounter++;
    updatePlayerMoments(world, player, clock);
    updateApprentice(world, player, 100, clock);
    assert.ok(getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID), 'Numb fired and slowed the target');
    return target;
  };
  assert.ok(monsterWindupSlowPct(numbedTarget(T2)) > 0, 'Numb II: the numbed target winds up slower');
  assert.equal(monsterWindupSlowPct(numbedTarget(6)), 0, 'Numb I slows only its attacks and movement');
}

console.log('windupSlow: ok');
