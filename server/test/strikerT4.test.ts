/**
 * The Striker's Tier 4 (class-first build plan T4-STRIKER; bible §12.7, §12.8, §12.16): the nine
 * leaves, the seven T4 techniques, the trophy ranks and the Wasteland and Trench trophies, and
 * the Wasteland and Trench gear jobs. Wiring only: attach, tick, assert observable state; no
 * balance numbers.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  STRIKER_KIT,
  applyStatusEffect,
  emptyEquipment,
  getResource,
  getStatusEffect,
  setCounter,
  trophyParamsAt,
  type OrderConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent, detachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { ATTACK_HASTE_PCT_KEY } from '../src/systems/combat/engine/attackCadence';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { applyStun, isMonsterStunned } from '../src/systems/combat/status/stun';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { strikerT2, updateStrikerT2 } from '../src/systems/classes/archetypes/cadence/strikerT2';
import { updateStrikerT4 } from '../src/systems/classes/archetypes/cadence/strikerT4';
import { strikerInvulnerableWindow } from '../src/systems/classes/archetypes/cadence/strikerLeaves';
import { updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { pushPlayer } from '../src/systems/combat/damage/forcedMovement';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const DUMMY = 'test-striker-t4-dummy';
const SLOWER = 'test-striker-t4-slower';
const base = MONSTER_DATABASE.get('bone-crawler');
assert(base, 'the base monster exists');
MONSTER_DATABASE.set(DUMMY, { ...base, id: DUMMY, evasion: 0 });
const DOT = { debuffId: 'test-t4-poison', label: 'Test Poison', damagePerStack: 400, maxStacks: 5, tickIntervalMs: 1000, durationMs: 6000 };
MONSTER_DATABASE.set(SLOWER, { ...base, id: SLOWER, evasion: 0, slowEffect: { speedMult: 0.5, durationMs: 4000 }, dotEffect: DOT });

let clock = 10_000;

function setup(opts: {
  beats?: (string | null)[];
  relic?: string[];
  bossesCleared?: string[];
  disciplineId?: string;
  specializationId?: string;
  leaf?: string;
  others?: number;
  passives?: Record<string, number>;
} = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'striker', name: 'Striker' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {},
      // Every T1 to T4 lesson learned.
      biomeLevel: {
        plains: 60, forest: 60, swamp: 60, mountain: 60, cave: 60, jungle: 60, desert: 60, tundra: 60,
        volcanic: 60, graveyard: 60, trench: 60,
      },
      playerTier: 4, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cadence-root', ...(opts.leaf ? [opts.leaf] : [])],
      passives: { ...(opts.passives ?? {}) }, selectedClass: 'cadence-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cadence',
      disciplineId: opts.disciplineId ?? null,
      specializationId: opts.specializationId ?? null,
    },
  } as PersistedPlayerSlices, 'striker');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.usesSkills.passives = { ...(opts.passives ?? {}) };
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0;
  attachComponent(world, player, 'configuresClass', {
    config: {
      mode: 'custom',
      relic: opts.relic ?? [],
      system: { kind: 'order', beats: opts.beats ?? PLAIN4, holdFinisher: [] } satisfies OrderConfig,
    },
  });
  const spawn = (x: number, y: number, type = DUMMY): MonsterEntity => {
    const m = world.createMonster(NODE, type, { x, y });
    assert(m, 'the dummy spawns');
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  const others = Array.from({ length: opts.others ?? 0 }, (_, i) => spawn(440 + i * 10, 430));
  return { world, player, target, others, spawn };
}

function tick(world: World): void {
  clock += 1000;
  world.tickCounter += 1;
}

function swing(world: World, player: PlayerEntity, target: MonsterEntity): { outcome: string; damage: number } {
  tick(world);
  const before = target.hasHealth.hp;
  const outcome = runPlayerAttack(world, player, target, clock, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  return { outcome, damage: before - target.hasHealth.hp };
}

function swings(world: World, player: PlayerEntity, target: MonsterEntity, n: number): number[] {
  return Array.from({ length: n }, () => swing(world, player, target).damage);
}

function finishCast(world: World): void {
  clock += 5000;
  world.tickCounter += 1;
  updateAbilityCasts(world, clock);
}

const hurt = (m: MonsterEntity): number => m.hasHealth.maxHp - m.hasHealth.hp;
const PLAIN4: (string | null)[] = [null, null, null, null];

/** A monster hits the player; how much HP it took. */
function hit(world: World, monster: MonsterEntity, player: PlayerEntity, ability?: string): { outcome: string; damage: number } {
  world.tickCounter += 1;
  const before = player.hasHealth.hp;
  const outcome = runMonsterAttack(world, monster, player, clock, 1, undefined, undefined, false, ability);
  return { outcome, damage: before - player.hasHealth.hp };
}

function aggro(world: World, player: PlayerEntity, monsters: MonsterEntity[]): void {
  for (const m of monsters) setAggroTarget(world, m, { id: player.isPlayer.id, kind: 'player' }, clock);
}

// ── The kit is data-complete and the runtime knows every T4 piece ───────────

{
  const t4Pieces = ['avalanche', 'frostbind', 'bloodrush', 'coup-de-grace', 'magma-breaker', 'reaping-arc', 'pressure-point'];
  for (const name of t4Pieces) {
    const piece = STRIKER_KIT.pieces.find((p) => p.id === `striker-${name}`);
    assert(piece, `${name} is in the kit`);
    assert(Object.keys(piece.params).length > 0, `${name} carries its numbers`);
  }
  for (const id of ['striker-relic-graveyard', 'striker-relic-trench']) {
    const trophy = STRIKER_KIT.trophies.find((t) => t.id === id);
    assert(trophy && Object.keys(trophy.params).length > 0, `${id} carries its numbers`);
  }
  const effects = (id: string) => ITEM_DATABASE.get(id)?.mechanicEffects ?? {};
  const line = (id: string) => ITEM_DATABASE.get(id)?.classLines?.cadence?.effects ?? {};
  assert(effects('striker-reapers-scythe-t4')['striker.splash-pct'], "Reaper's Scythe has its job");
  assert(effects('striker-exploit-t4')['striker.debuff-pct'], 'Exploit has its job');
  assert(line('graveyard-vest-t4')['striker.deathward-pct'], 'Deathward has its key');
  assert(line('graveyard-charm-t4')['striker.crowd-recovery-pct'], 'Requiem has its key');
  assert(line('trench-vest-t4')['striker.clear-mind'], 'Clear Mind has its key');
  assert(line('trench-charm-t4')['striker.debuff-recovery-pct'], 'Brine Mend has its key');
}

// ── Techniques (§12.16) ──────────────────────────────────────────────────────

// 1. Avalanche: a wind-up that charges through a line, knocking everything down; off the line is spared.
{
  const r = setup({ beats: [null, null, null, 'striker-avalanche'], others: 2 });
  r.others[0].hasPosition.current = { x: 520, y: 400 }; // on the line, behind the target
  r.others[1].hasPosition.current = { x: 430, y: 700 }; // far off it
  swings(r.world, r.player, r.target, 3);
  assert.equal(swing(r.world, r.player, r.target).outcome, 'cancelled', 'the wind-up casts instead of swinging');
  assert.equal(r.player.isCastingAbility?.abilityId, 'striker-avalanche', 'it winds up');
  const from = r.player.hasPosition.current.x;
  finishCast(r.world);
  assert(isMonsterStunned(r.world, r.target.isMonster.id), 'the target is knocked down');
  assert(isMonsterStunned(r.world, r.others[0].isMonster.id), 'and so is what stands on the line');
  assert(!isMonsterStunned(r.world, r.others[1].isMonster.id), 'but not what is off it');
  assert(r.player.hasPosition.current.x >= from, 'the Striker charged forward');
  assert(isEmpoweredAttack(r.player), 'the cast counted as the wind-up beat: the finisher is armed');
  // A boss that accepts no control refuses the knockdown.
  const boss = setup({ beats: [null, null, null, 'striker-avalanche'] });
  const def = MONSTER_DATABASE.get(DUMMY)!;
  MONSTER_DATABASE.set(DUMMY, { ...def, controlImmune: true });
  swings(boss.world, boss.player, boss.target, 3);
  swing(boss.world, boss.player, boss.target);
  finishCast(boss.world);
  MONSTER_DATABASE.set(DUMMY, def);
  assert(!isMonsterStunned(boss.world, boss.target.isMonster.id), 'a control-immune boss stays up');
}

// 2. Frostbind roots the target and everything around it; a control-immune boss ignores it.
{
  const r = setup({ beats: ['striker-frostbind', null, null, null], others: 2 });
  r.others[0].hasPosition.current = { x: 470, y: 400 }; // within the ice
  r.others[1].hasPosition.current = { x: 430, y: 700 }; // far
  swing(r.world, r.player, r.target);
  assert(getStatusEffect(r.target.tracksCombat, ABILITY_ROOT_EFFECT_ID), 'the target is rooted');
  assert(getStatusEffect(r.others[0].tracksCombat, ABILITY_ROOT_EFFECT_ID), 'so is what stands beside it');
  assert.equal(getStatusEffect(r.others[1].tracksCombat, ABILITY_ROOT_EFFECT_ID), undefined, 'but not what is far');
  const boss = setup({ beats: ['striker-frostbind', null, null, null] });
  const def = MONSTER_DATABASE.get(DUMMY)!;
  MONSTER_DATABASE.set(DUMMY, { ...def, controlImmune: true });
  swing(boss.world, boss.player, boss.target);
  MONSTER_DATABASE.set(DUMMY, def);
  assert.equal(getStatusEffect(boss.target.tracksCombat, ABILITY_ROOT_EFFECT_ID), undefined, 'a control-immune boss ignores it');
}

// 3. Bloodrush: Focus without the cast, for the rest of the combo.
{
  const r = setup({ beats: ['striker-bloodrush', null, null, null] });
  assert.notEqual(swing(r.world, r.player, r.target).outcome, 'cancelled', 'no cast: it swings');
  const haste = getStatusEffect(r.player.tracksCombat, 'striker-focus');
  assert(haste && (haste.data[ATTACK_HASTE_PCT_KEY] ?? 0) > 0, 'the combo is hasted');
  swings(r.world, r.player, r.target, 4); // the rest of the combo and the finisher
  assert.equal(getStatusEffect(r.player.tracksCombat, 'striker-focus'), undefined, 'the finisher ends it');
}

// 4. Coup de Grâce: much harder against a target below a third of its HP.
{
  const beat = (hpShare: number) => {
    const r = setup({ beats: ['striker-coup-de-grace', null, null, null] });
    r.target.hasHealth.hp = Math.floor(r.target.hasHealth.maxHp * hpShare);
    return swing(r.world, r.player, r.target).damage;
  };
  assert(beat(0.3) > beat(0.9) * 1.5, 'a target below a third takes far more');
}

// 5. Magma Breaker: a wind-up blow on the target and everything around it, harder against a shell.
{
  const blow = (shelledNeighbour: boolean) => {
    const r = setup({ beats: [null, null, null, 'striker-magma-breaker'], others: 1 });
    r.others[0].hasPosition.current = { x: 470, y: 400 };
    if (shelledNeighbour) setCounter(r.others[0].tracksCombat, 'shellUpEndsAt', clock + 600_000);
    swings(r.world, r.player, r.target, 3);
    assert.equal(swing(r.world, r.player, r.target).outcome, 'cancelled', 'the wind-up casts');
    finishCast(r.world);
    assert(hurt(r.target) > 0, 'the target takes the blow');
    return hurt(r.others[0]);
  };
  const open = blow(false);
  assert(open > 0, 'so does what stands around it');
  assert(blow(true) > open, 'a shelled one takes more');
}

// 6. Reaping Arc: a wide cut through every enemy around you, wider than Sweep.
{
  const reach = (id: string) => {
    const r = setup({ beats: [id, null, null, null], others: 1 });
    r.others[0].hasPosition.current = { x: 540, y: 400 }; // 140 px from the Striker
    swing(r.world, r.player, r.target);
    return hurt(r.others[0]);
  };
  assert.equal(reach('striker-sweep'), 0, 'Sweep does not reach that far');
  assert(reach('striker-reaping-arc') > 0, 'Reaping Arc does');
}

// 7. Pressure Point: the next finisher on this target hits much harder.
{
  const finisher = (id: string | null, swapTarget = false) => {
    const r = setup({ beats: [id, null, null, null], others: 1 });
    swings(r.world, r.player, r.target, 4);
    if (swapTarget) {
      setAttackTarget(r.world, r.player, r.others[0].isMonster.id);
      r.others[0].hasPosition.current = { x: 430, y: 410 };
      return swing(r.world, r.player, r.others[0]).damage;
    }
    return swing(r.world, r.player, r.target).damage;
  };
  const plain = finisher(null);
  assert(finisher('striker-pressure-point') > plain * 1.4, 'the pressured target takes the finisher harder');
  assert(finisher('striker-pressure-point', true) < plain * 1.2, 'but not another target');
}

// ── Trophies ─────────────────────────────────────────────────────────────────

// 8. Grave Toll (Wasteland spark): the next combo's beats hit harder for every enemy in the fight.
{
  const beatAfterFinisher = (enemies: number) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-graveyard'], bossesCleared: ['graveyard:4'], others: 3 });
    aggro(r.world, r.player, [r.target, ...r.others].slice(0, enemies));
    swings(r.world, r.player, r.target, 5); // a combo and its finisher: the spark is armed
    return swing(r.world, r.player, r.target).damage;
  };
  assert(beatAfterFinisher(4) > beatAfterFinisher(1), 'more enemies in the fight, harder beats');
}

// 9. Deep Pressure (Trench weight): the finisher deals more the more HP the target has left.
{
  const finisher = (hpShare: number) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-trench'], bossesCleared: ['trench:4'] });
    swings(r.world, r.player, r.target, 4);
    r.target.hasHealth.hp = Math.floor(r.target.hasHealth.maxHp * hpShare);
    return swing(r.world, r.player, r.target).damage;
  };
  assert(finisher(1) > finisher(0.2) * 1.5, 'a full-HP target takes far more');
}

// 10. The T4 ranks: Skyfall IV, Hoarfrost II, Eruption II, Pounce III and Verdict III grow stronger.
{
  const params = (id: string, rank: number) => trophyParamsAt(STRIKER_KIT.trophies.find((t) => t.id === id)!, rank);
  assert((params('striker-relic-mountain', 4).blowMult ?? 0) > (params('striker-relic-mountain', 3).blowMult ?? 0), 'Skyfall IV hits harder');
  assert((params('striker-relic-tundra', 2).stepPct ?? 0) > (params('striker-relic-tundra', 1).stepPct ?? 0), 'Hoarfrost II slows faster');
  assert((params('striker-relic-volcanic', 2).splashPct ?? 0) > (params('striker-relic-volcanic', 1).splashPct ?? 0), 'Eruption II blasts fuller');
  assert((params('striker-relic-jungle', 3).bonusPct ?? 0) > (params('striker-relic-jungle', 2).bonusPct ?? 0), 'Pounce III leaps harder');
  assert((params('striker-relic-desert', 3).thresholdPct ?? 0) > (params('striker-relic-desert', 2).thresholdPct ?? 0), 'Verdict III executes higher');
  const dies = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-desert'], bossesCleared: cleared });
    swings(r.world, r.player, r.target, 4);
    r.target.hasHealth.hp = Math.floor(r.target.hasHealth.maxHp * 0.3);
    swing(r.world, r.player, r.target);
    return r.target.hasHealth.hp <= 0;
  };
  assert(!dies(['desert:2', 'desert:3']), 'Verdict II leaves a target at 30%');
  assert(dies(['desert:2', 'desert:3', 'desert:4']), 'Verdict III executes it');
  // Hoarfrost II: one beat slows by a bigger step.
  const slow = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-tundra'], bossesCleared: cleared });
    swings(r.world, r.player, r.target, 6);
    return getStatusEffect(r.target.tracksCombat, ABILITY_SLOW_EFFECT_ID)?.data['moveSlowPct'] ?? 0;
  };
  assert(slow(['tundra:3', 'tundra:4']) > slow(['tundra:3']), 'the deeper Hoarfrost slows more');
}

// ── Gear jobs ────────────────────────────────────────────────────────────────

// 11. Reaper's Scythe: every beat splashes part of its damage to the enemies around the target.
{
  const r = setup({ passives: { 'striker.splash-pct': 0.4 }, others: 1 });
  r.others[0].hasPosition.current = { x: 470, y: 400 };
  swing(r.world, r.player, r.target);
  assert(hurt(r.others[0]) > 0, 'the enemy beside the target takes a share');
}

// 12. Exploit: beats hit harder for each different debuff on the target.
{
  const beat = (debuffs: number) => {
    const r = setup({ passives: { 'striker.debuff-pct': 0.2 } });
    const ids = [ABILITY_SLOW_EFFECT_ID, 'vulnerability', 'plating-shred'].slice(0, debuffs);
    for (const id of ids) {
      applyStatusEffect(r.target.tracksCombat, {
        id, maxStacks: 1, remainingMs: 60_000, refreshable: true, sourceId: 'striker', data: { totalMs: 60_000 },
      });
    }
    return swing(r.world, r.player, r.target).damage;
  };
  const none = beat(0);
  const one = beat(1);
  const two = beat(2);
  assert(one > none && two > one, `each debuff adds (${none} < ${one} < ${two})`);
}

// 13. Deathward: below a quarter of your HP, you take less damage.
{
  const taken = (hpShare: number) => {
    const r = setup({ passives: { 'striker.deathward-pct': 0.333 } });
    r.target.dealsDamage.attack = 100;
    r.player.hasHealth.hp = Math.floor(r.player.hasHealth.maxHp * hpShare);
    return hit(r.world, r.target, r.player).damage;
  };
  assert(taken(0.2) < taken(0.9), 'the ward takes damage off below a quarter');
}

// 14. Requiem and Brine Mend: Recovery rises with the enemies on you and with the debuffs on you.
{
  const r = setup({ passives: { 'striker.crowd-recovery-pct': 0.1 }, others: 2 });
  tick(r.world);
  updateStrikerT4(r.world, 100, clock);
  assert.equal(getResource(r.player.tracksCombat, 'recovery.boostMs'), 0, 'no enemies on you, no boost');
  aggro(r.world, r.player, [r.target, ...r.others]);
  tick(r.world);
  updateStrikerT4(r.world, 100, clock);
  assert(Math.abs(getResource(r.player.tracksCombat, 'recovery.boostX') - 1.3) < 1e-9, 'three enemies on you: Recovery x1.3');
  const b = setup({ passives: { 'striker.debuff-recovery-pct': 0.1 } });
  for (const id of ['slow', 'antiheal']) {
    applyStatusEffect(b.player.tracksCombat, { id, maxStacks: 1, remainingMs: 5000, refreshable: true, sourceId: 'x', data: { totalMs: 5000 } });
  }
  tick(b.world);
  updateStrikerT4(b.world, 100, clock);
  assert(Math.abs(getResource(b.player.tracksCombat, 'recovery.boostX') - 1.2) < 1e-9, 'two debuffs on you: Recovery x1.2');
}

// 15. Clear Mind: a stun breaks neither your resource nor your cast.
{
  const keepsEdge = (passives: Record<string, number>) => {
    const r = setup({ passives });
    strikerT2(r.player).edge = 3;
    applyStun(r.player.tracksCombat, 1000, 'x');
    tick(r.world);
    r.player.performsAttack.lastAttackAt = clock;
    updateStrikerT2(r.world, 100, clock);
    return strikerT2(r.player).edge;
  };
  assert.equal(keepsEdge({}), 0, 'a stun breaks the edge');
  assert.equal(keepsEdge({ 'striker.clear-mind': 1 }), 3, 'Clear Mind keeps it');
  const castSurvives = (passives: Record<string, number>) => {
    const r = setup({ beats: [null, null, null, 'striker-coil'], passives });
    swings(r.world, r.player, r.target, 3);
    swing(r.world, r.player, r.target);
    assert(r.player.isCastingAbility, 'the wind-up is casting');
    applyStun(r.player.tracksCombat, 1000, 'x');
    finishCast(r.world);
    return r.player.usesCadence!.coiled === true;
  };
  assert(!castSurvives({}), 'a stun breaks the wind-up');
  assert(castSurvives({ 'striker.clear-mind': 1 }), 'Clear Mind lets it land');
}

// ── Leaves (§12.7) ───────────────────────────────────────────────────────────

const LIGHT = 'striker-light';
const BALANCED = 'striker-balanced';
const HEAVY = 'striker-heavy';

// 16. Ghoststep: once every few seconds, a hit bigger than a quarter of your HP misses.
{
  const r = setup({ disciplineId: LIGHT, leaf: 'striker-ghoststep' });
  r.target.dealsDamage.attack = 4000;
  const first = hit(r.world, r.target, r.player);
  assert.equal(first.damage, 0, 'the big hit misses');
  const second = hit(r.world, r.target, r.player);
  assert(second.damage > 0, 'the next one inside the cooldown lands');
  const small = setup({ disciplineId: LIGHT, leaf: 'striker-ghoststep' });
  small.target.dealsDamage.attack = 500;
  const smallHit = hit(small.world, small.target, small.player);
  assert(smallHit.damage > 0, `a small hit is never missed (${JSON.stringify(smallHit)})`);
  const none = setup({ disciplineId: LIGHT });
  none.target.dealsDamage.attack = 4000;
  assert(hit(none.world, none.target, none.player).damage > 0, 'without the leaf, it lands');
  // Another discipline's leaf does nothing.
  const foreign = setup({ disciplineId: HEAVY, leaf: 'striker-ghoststep' });
  foreign.target.dealsDamage.attack = 4000;
  assert(hit(foreign.world, foreign.target, foreign.player).damage > 0, "a leaf of another discipline doesn't count");
}

// 17. Slip Through: the more enemies on you, the more of their hits miss (and carry no ailment).
{
  const misses = (leaf: string | undefined, enemies: number) => {
    const r = setup({ disciplineId: LIGHT, leaf, others: 3 });
    r.target.dealsDamage.attack = 50;
    aggro(r.world, r.player, [r.target, ...r.others].slice(0, enemies));
    let count = 0;
    for (let i = 0; i < 12; i++) if (hit(r.world, r.target, r.player).damage === 0) count++;
    return count;
  };
  assert.equal(misses(undefined, 4), 0, 'no leaf, no misses');
  const few = misses('striker-slip-through', 1);
  const many = misses('striker-slip-through', 4);
  assert(many > few, `more enemies, more misses (${few} < ${many})`);
  assert(many <= 5, `up to one in three (${many} of 12)`);
  // A missed hit carries no ailment.
  const r = setup({ disciplineId: LIGHT, leaf: 'striker-slip-through', others: 3 });
  const slower = r.spawn(420, 420, SLOWER);
  slower.dealsDamage.attack = 50;
  aggro(r.world, r.player, [r.target, ...r.others, slower]);
  let slowedOnMiss = false;
  for (let i = 0; i < 12; i++) {
    const before = getStatusEffect(r.player.tracksCombat, 'slow');
    if (before) { r.player.tracksCombat.statusEffects = r.player.tracksCombat.statusEffects.filter((e) => e.id !== 'slow'); }
    const result = hit(r.world, slower, r.player);
    if (result.damage === 0 && getStatusEffect(r.player.tracksCombat, 'slow')) slowedOnMiss = true;
  }
  assert(!slowedOnMiss, 'a hit that slips through carries no slow');
}

// 18. Shake It Off: debuffs on you wear off twice as fast.
{
  const left = (leaf: string | undefined) => {
    const r = setup({ disciplineId: LIGHT, leaf });
    applyStatusEffect(r.player.tracksCombat, {
      id: 'slow', maxStacks: 1, remainingMs: 5000, refreshable: true, sourceId: 'x', data: { speedMult: 0.5, totalMs: 5000 },
    });
    tick(r.world);
    updateStrikerT4(r.world, 1000, clock);
    return getStatusEffect(r.player.tracksCombat, 'slow')!.remainingMs;
  };
  assert.equal(left(undefined), 5000, 'the upkeep alone leaves the clock to the game');
  assert.equal(left('striker-shake-it-off'), 4000, 'the leaf takes a second more off every second');
}

// 19. Read the Blow: telegraphed attacks aimed at you deal half damage.
{
  const taken = (leaf: string | undefined, ability?: string) => {
    const r = setup({ disciplineId: BALANCED, leaf });
    r.target.dealsDamage.attack = 100;
    return hit(r.world, r.target, r.player, ability).damage;
  };
  const plain = taken(undefined, 'Big Slam');
  assert(taken('striker-read-the-blow', 'Big Slam') <= Math.ceil(plain / 2) + 1, 'a telegraphed blow is halved');
  assert.equal(taken('striker-read-the-blow'), taken(undefined), 'an ordinary hit is not');
}

// 20. Centered: while three or more enemies attack you, you take a fifth less.
{
  const taken = (leaf: string | undefined, enemies: number) => {
    const r = setup({ disciplineId: BALANCED, leaf, others: 3 });
    r.target.dealsDamage.attack = 100;
    aggro(r.world, r.player, [r.target, ...r.others].slice(0, enemies));
    return hit(r.world, r.target, r.player).damage;
  };
  assert(taken('striker-centered', 3) < taken(undefined, 3), 'three enemies: a fifth less');
  assert.equal(taken('striker-centered', 2), taken(undefined, 2), 'two enemies: nothing');
}

// 21. Poise: below half HP, your Recovery doubles.
{
  const boost = (hpShare: number) => {
    const r = setup({ disciplineId: BALANCED, leaf: 'striker-poise' });
    r.player.hasHealth.hp = Math.floor(r.player.hasHealth.maxHp * hpShare);
    tick(r.world);
    updateStrikerT4(r.world, 100, clock);
    return getResource(r.player.tracksCombat, 'recovery.boostX');
  };
  assert.equal(boost(0.4), 2, 'low on HP: Recovery doubles');
  assert.equal(boost(0.8), 0, 'healthy: nothing');
}

// 22. Unbreakable: once per fight, a killing hit leaves you at 1 HP and nothing hurts you for 2 s.
{
  const r = setup({ disciplineId: HEAVY, leaf: 'striker-unbreakable' });
  r.target.dealsDamage.attack = 5000;
  r.player.hasHealth.hp = 100;
  const killing = hit(r.world, r.target, r.player);
  assert.notEqual(killing.outcome, 'killed', 'the blow does not kill');
  assert.equal(r.player.hasHealth.hp, 1, 'you stand on your last sliver');
  assert(strikerInvulnerableWindow(r.player), 'and the window is up');
  const next = hit(r.world, r.target, r.player);
  assert.equal(next.outcome, 'cancelled', 'nothing hurts you in the window');
  assert.equal(r.player.hasHealth.hp, 1, 'HP is untouched');
  // A damage-over-time tick pays nothing either.
  const poisoner = r.spawn(420, 420, SLOWER);
  applyMonsterDotToPlayer(r.world, poisoner, r.player, DOT);
  updateDotArchetype(r.world, 1000, clock + 100);
  updateDotArchetype(r.world, 1000, clock + 1200);
  assert.equal(r.player.hasHealth.hp, 1, 'DoT ticks are refused in the window');
  // Spent: once the window runs out the leaf is gone for this fight, back after it.
  r.player.tracksCombat.cooldowns['striker.unbreakable.window'] = 0;
  r.player.hasHealth.hp = 100;
  r.target.dealsDamage.attack = 5000;
  const again = hit(r.world, r.target, r.player);
  assert.equal(again.outcome, 'killed', 'a second killing blow in the same fight kills');
  const fresh = setup({ disciplineId: HEAVY, leaf: 'striker-unbreakable' });
  fresh.target.dealsDamage.attack = 5000;
  fresh.player.hasHealth.hp = 100;
  hit(fresh.world, fresh.target, fresh.player);
  fresh.player.tracksCombat.cooldowns['striker.unbreakable.window'] = 0;
  setAggroTarget(fresh.world, fresh.target, null, clock);
  if (fresh.player.hasAttackTarget) detachComponent(fresh.world, fresh.player, 'hasAttackTarget');
  clock += 600_000;
  fresh.world.tickCounter += 1;
  updateStrikerT4(fresh.world, 100, clock);
  fresh.player.hasHealth.hp = 100;
  assert.notEqual(hit(fresh.world, fresh.target, fresh.player).outcome, 'killed', 'out of the fight, it is back');
}

// 23. Immovable: ordinary mobs can't slow or stun you; a boss still can.
{
  const slowedBy = (leaf: string | undefined, boss: boolean) => {
    const r = setup({ disciplineId: HEAVY, leaf });
    const slower = r.spawn(420, 420, SLOWER);
    slower.isMonster.isBoss = boss;
    slower.dealsDamage.attack = 10;
    aggro(r.world, r.player, [slower]);
    hit(r.world, slower, r.player);
    return getStatusEffect(r.player.tracksCombat, 'slow') !== undefined;
  };
  assert(slowedBy(undefined, false), 'an ordinary mob slows you without the leaf');
  assert(!slowedBy('striker-immovable', false), 'not with it');
  assert(slowedBy('striker-immovable', true), 'a boss still does');
  const stunned = (boss: boolean) => {
    const r = setup({ disciplineId: HEAVY, leaf: 'striker-immovable' });
    const mob = r.spawn(420, 420);
    mob.isMonster.isBoss = boss;
    applyStun(r.player.tracksCombat, 1000, mob.isMonster.id);
    tick(r.world);
    updateStrikerT4(r.world, 100, clock);
    return getStatusEffect(r.player.tracksCombat, 'stunned') !== undefined;
  };
  assert(!stunned(false), "an ordinary mob's stun comes off");
  assert(stunned(true), "a boss's stun stays");
}

// 24. Thick Blood: damage over time on you is halved.
{
  const hpAfterDot = (leaf: string | undefined) => {
    const r = setup({ disciplineId: HEAVY, leaf });
    const poisoner = r.spawn(420, 420, SLOWER);
    applyMonsterDotToPlayer(r.world, poisoner, r.player, DOT);
    updateDotArchetype(r.world, 1000, clock + 100);
    updateDotArchetype(r.world, 1000, clock + 1200);
    return r.player.hasHealth.maxHp - r.player.hasHealth.hp;
  };
  const full = hpAfterDot(undefined);
  assert(full > 0, 'the DoT hurts');
  const half = hpAfterDot('striker-thick-blood');
  assert(half > 0 && half < full, `Thick Blood takes some off (${half} < ${full})`);
}

// 25. Immovable also refuses an ordinary mob's knockback; a boss's push still lands.
{
  const pushedBy = (leaf: string | undefined, boss: boolean) => {
    const r = setup({ disciplineId: HEAVY, leaf });
    const mob = r.spawn(500, 400);
    mob.isMonster.isBoss = boss;
    return pushPlayer(r.world, r.player, mob.hasPosition.current, 120, mob) !== null;
  };
  assert(pushedBy(undefined, false), 'an ordinary mob knocks you back without the leaf');
  assert(!pushedBy('striker-immovable', false), 'not with Immovable');
  assert(pushedBy('striker-immovable', true), 'a boss still can');
}

console.log('strikerT4.test.ts: ok');
