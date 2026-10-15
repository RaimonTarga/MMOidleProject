/**
 * The Striker's Order at runtime (class-first build plan CS.1–CS.2, bible §12.2–§12.4): the
 * beats run their techniques and pay the price, the casts wind up and count when they land
 * (a stun breaks them), the finisher is the trophy, sparks ride the next combo, and a held
 * finisher stays armed. Wiring only: no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_SLOW_EFFECT_ID,
  emptyEquipment,
  getStatusEffect,
  MONSTER_DATABASE,
  removeStatusEffect,
  type OrderConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { STRIKER_FOCUS_EFFECT_ID } from '../src/systems/classes/archetypes/cadence/order';
import { attackCadenceMult } from '../src/systems/combat/engine/attackCadence';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { applyStun, STUN_EFFECT, STUN_IMMUNE_EFFECT } from '../src/systems/combat/status/stun';
import { updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const DUMMY = 'test-striker-dummy';
const base = MONSTER_DATABASE.get('bone-crawler');
assert(base, 'the base monster exists');
MONSTER_DATABASE.set(DUMMY, { ...base, id: DUMMY, evasion: 0 });

let clock = 10_000;

function setup(opts: {
  beats: (string | null)[];
  relic?: string[];
  holdFinisher?: OrderConfig['holdFinisher'];
  bossesCleared?: string[];
  disciplineId?: string;
  others?: number;
}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'striker', name: 'Striker' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {},
      // Every T1 lesson learned.
      biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
      playerTier: 1, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cadence-root'], passives: {}, selectedClass: 'cadence-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cadence',
      disciplineId: opts.disciplineId ?? null,
    },
  } as PersistedPlayerSlices, 'striker');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  attachComponent(world, player, 'configuresClass', {
    config: {
      mode: 'custom',
      relic: opts.relic ?? [],
      system: { kind: 'order', beats: opts.beats, holdFinisher: opts.holdFinisher ?? [] },
    },
  });
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, DUMMY, { x, y });
    assert(m, 'the dummy spawns');
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  const others = Array.from({ length: opts.others ?? 0 }, (_, i) => spawn(380 + i * 10, 430));
  return { world, player, target, others };
}

/** One swing at the target; how much HP it took. */
function swing(world: World, player: PlayerEntity, target: MonsterEntity): { outcome: string; damage: number } {
  clock += 1000;
  world.tickCounter += 1;
  const before = target.hasHealth.hp;
  const outcome = runPlayerAttack(world, player, target, clock, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  return { outcome, damage: before - target.hasHealth.hp };
}

/** Let an in-flight cast finish. */
function finishCast(world: World): void {
  clock += 5000;
  world.tickCounter += 1;
  updateAbilityCasts(world, clock);
}

// 1. A plain combo: four plain beats, then the finisher.
{
  const { world, player, target } = setup({ beats: [null, null, null, null] });
  const plain = swing(world, player, target);
  assert.equal(plain.outcome, 'hit', 'a plain beat swings');
  for (let i = 0; i < 3; i++) swing(world, player, target);
  assert(isEmpoweredAttack(player), 'four beats arm the finisher');
  const finisher = swing(world, player, target);
  assert(finisher.damage > plain.damage, 'the finisher hits harder than a plain beat');
  assert(!isEmpoweredAttack(player) && player.usesCadence!.count === 0, 'and a new combo starts');
}

// 2. Sweep on beat 4 hits every enemy around you on that beat only, and pays the price.
{
  const { world, player, target, others } = setup({ beats: [null, null, null, 'striker-sweep'], others: 3 });
  const plain = swing(world, player, target);
  swing(world, player, target);
  swing(world, player, target);
  assert(others.every((m) => m.hasHealth.hp === m.hasHealth.maxHp), 'plain beats hit one enemy');
  const sweep = swing(world, player, target);
  assert(others.every((m) => m.hasHealth.hp < m.hasHealth.maxHp), 'the Sweep beat hits every enemy around');
  assert(sweep.damage < plain.damage, `the technique beat pays the price (${sweep.damage} < ${plain.damage})`);
}

// 3. A Focus opener casts instead of swinging; a stun breaks it; when it lands it counts.
{
  const { world, player, target } = setup({ beats: ['striker-focus', null, null, null] });
  const opener = swing(world, player, target);
  assert.equal(opener.outcome, 'cancelled', 'the opener does not swing');
  assert.equal(player.isCastingAbility?.abilityId, 'striker-focus', 'it winds up');
  applyStun(player.tracksCombat, 1000, 'test');
  finishCast(world);
  assert(!player.isCastingAbility && player.usesCadence!.count === 0, 'a stun breaks the cast: no beat counted');
  assert(!getStatusEffect(player.tracksCombat, STRIKER_FOCUS_EFFECT_ID), 'and no Focus');
  removeStatusEffect(player.tracksCombat, STUN_EFFECT);
  removeStatusEffect(player.tracksCombat, STUN_IMMUNE_EFFECT);
  swing(world, player, target);
  finishCast(world);
  assert.equal(player.usesCadence!.count, 1, 'the cast landed and counted its beat');
  assert(getStatusEffect(player.tracksCombat, STRIKER_FOCUS_EFFECT_ID), 'Focus is on');
  assert(attackCadenceMult(player.tracksCombat) < 1, 'and the combo swings faster');
  for (let i = 0; i < 3; i++) swing(world, player, target);
  assert(isEmpoweredAttack(player), 'the 5th beat is the finisher');
  swing(world, player, target);
  assert(!getStatusEffect(player.tracksCombat, STRIKER_FOCUS_EFFECT_ID), 'the finisher ends Focus');
}

// 4. Coil on the wind-up makes the finisher hit much harder.
{
  const plainRun = setup({ beats: [null, null, null, null] });
  for (let i = 0; i < 4; i++) swing(plainRun.world, plainRun.player, plainRun.target);
  const plainFinisher = swing(plainRun.world, plainRun.player, plainRun.target).damage;
  const { world, player, target } = setup({ beats: [null, null, null, 'striker-coil'] });
  for (let i = 0; i < 3; i++) swing(world, player, target);
  assert.equal(swing(world, player, target).outcome, 'cancelled', 'the wind-up casts');
  finishCast(world);
  assert(isEmpoweredAttack(player) && player.usesCadence!.coiled, 'Coil landed and armed the finisher');
  const coiled = swing(world, player, target).damage;
  assert(coiled > plainFinisher, `the coiled finisher hits harder (${coiled} > ${plainFinisher})`);
}

// 5. Hamstring slows the target's movement and attacks; Rend opens a bleed.
{
  const { world, player, target } = setup({ beats: ['striker-hamstring', 'striker-rend', null, null] });
  swing(world, player, target);
  const slow = getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID);
  assert(slow && (slow.data['moveSlowPct'] ?? 0) > 0 && (slow.data['attackSlowPct'] ?? 0) > 0, 'Hamstring slows both');
  swing(world, player, target);
  const bleed = getStatusEffect(target.tracksCombat, 'cadence-hemorrhage');
  assert(bleed && bleed.stacks > 0 && (bleed.data['damagePerTick'] ?? 0) > 0, 'Rend opens a bleed');
}

// 6. The finisher is the trophy: Sunder exposes the target; Festering Cut rots it.
{
  const { world, player, target } = setup({ beats: [null, null, null, null], relic: ['striker-relic-cave'], bossesCleared: ['cave:1'] });
  for (let i = 0; i < 5; i++) swing(world, player, target);
  assert((getStatusEffect(target.tracksCombat, 'vulnerability')?.data['damageMultiplier'] ?? 1) > 1, 'Sunder exposes the target');
}
{
  const { world, player, target } = setup({ beats: [null, null, null, null], relic: ['striker-relic-swamp'], bossesCleared: ['swamp:1'] });
  for (let i = 0; i < 5; i++) swing(world, player, target);
  assert(getStatusEffect(target.tracksCombat, 'striker-rot'), 'Festering Cut rots the wound');
}

// 7. Skyfall: the finisher is a cast, and its blow is bigger.
{
  const plainRun = setup({ beats: [null, null, null, null] });
  for (let i = 0; i < 4; i++) swing(plainRun.world, plainRun.player, plainRun.target);
  const plainFinisher = swing(plainRun.world, plainRun.player, plainRun.target).damage;
  const { world, player, target } = setup({ beats: [null, null, null, null], relic: ['striker-relic-mountain'], bossesCleared: ['mountain:1'] });
  for (let i = 0; i < 4; i++) swing(world, player, target);
  assert.equal(swing(world, player, target).outcome, 'cancelled', 'the finisher winds up');
  const before = target.hasHealth.hp;
  finishCast(world);
  const blow = before - target.hasHealth.hp;
  assert(blow > plainFinisher, `the Skyfall blow is bigger (${blow} > ${plainFinisher})`);
  assert(!isEmpoweredAttack(player), 'and it spent the finisher');
}

// 8. A spark trophy arms the next combo: Double Slash strikes twice.
{
  const { world, player, target } = setup({ beats: [null, null, null, null], relic: ['striker-relic-forest'], bossesCleared: ['forest:1'] });
  const first = swing(world, player, target).damage;
  for (let i = 0; i < 4; i++) swing(world, player, target);
  assert.equal(player.usesCadence!.sparkTrophyId, 'striker-relic-forest', 'the finisher arms the spark');
  const sparked = swing(world, player, target).damage;
  assert(sparked > first, `a sparked beat strikes twice, each a bit over half (${sparked} > ${first})`);
}

// 9. A held finisher stays armed (the rule "not on a nearly dead target").
{
  const { world, player, target } = setup({ beats: [null, null, null, null], holdFinisher: [{ id: 'target-low', param: 1.01 }] });
  for (let i = 0; i < 4; i++) swing(world, player, target);
  swing(world, player, target);
  assert(isEmpoweredAttack(player), 'the finisher is held while the rule holds');
  assert.equal(player.usesCadence!.count, 0, 'and the held swing is not a beat');
}

// 10. The combo is the discipline's: a Light Striker swings 7 beats.
{
  const { world, player, target } = setup({ beats: [null, null, null, null, null, null], disciplineId: 'striker-light' });
  swing(world, player, target);
  assert.equal(player.usesCadence!.threshold, 7, 'a Light combo is 7 beats');
}

console.log('strikerOrder.test.ts: ok');
