/**
 * The Striker's Tier 3 (class-first build plan T3-STRIKER; bible §12.6, §12.8, §12.16): the
 * nine specializations, the seven T3 techniques, the trophy ranks and the Tundra and Volcanic
 * trophies, and the Tundra and Volcanic gear jobs. Wiring only: attach, tick, assert observable
 * state; no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_SLOW_EFFECT_ID,
  ITEM_DATABASE,
  STRIKER_KIT,
  applyStatusEffect,
  emptyEquipment,
  getResource,
  getStatusEffect,
  MONSTER_DATABASE,
  playerIncomingDamageMult,
  trophyParamsAt,
  setCounter,
  type OrderConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { ATTACK_HASTE_PCT_KEY } from '../src/systems/combat/engine/attackCadence';
import { applyMonsterSlow } from '../src/systems/combat/status/monsterControl';
import { applyStun, isMonsterStunned } from '../src/systems/combat/status/stun';
import { updateStrikerLeaps } from '../src/systems/classes/archetypes/cadence/order';
import { strikerT2, updateStrikerT2 } from '../src/systems/classes/archetypes/cadence/strikerT2';
import { updateStrikerT3 } from '../src/systems/classes/archetypes/cadence/strikerT3';
import { updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const DUMMY = 'test-striker-t3-dummy';
const base = MONSTER_DATABASE.get('bone-crawler');
assert(base, 'the base monster exists');
MONSTER_DATABASE.set(DUMMY, { ...base, id: DUMMY, evasion: 0 });

let clock = 10_000;

function setup(opts: {
  beats: (string | null)[];
  relic?: string[];
  bossesCleared?: string[];
  disciplineId?: string;
  specializationId?: string;
  others?: number;
  passives?: Record<string, number>;
  onHitDamage?: number;
  holdFinisher?: OrderConfig['holdFinisher'];
}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'striker', name: 'Striker' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {},
      // Every T1, T2 and T3 lesson learned.
      biomeLevel: {
        plains: 60, forest: 60, swamp: 60, mountain: 60, cave: 60, jungle: 60, desert: 60, tundra: 60, volcanic: 60,
      },
      playerTier: 3, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cadence-root'], passives: { ...(opts.passives ?? {}) }, selectedClass: 'cadence-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cadence',
      disciplineId: opts.disciplineId ?? null,
      specializationId: opts.specializationId ?? null,
    },
  } as PersistedPlayerSlices, 'striker');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.usesSkills.passives = { ...(opts.passives ?? {}) };
  if (opts.onHitDamage !== undefined) player.dealsDamage.onHitDamage = opts.onHitDamage;
  attachComponent(world, player, 'configuresClass', {
    config: {
      mode: 'custom',
      relic: opts.relic ?? [],
      system: { kind: 'order', beats: opts.beats, holdFinisher: opts.holdFinisher ?? [] } satisfies OrderConfig,
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
  const others = Array.from({ length: opts.others ?? 0 }, (_, i) => spawn(440 + i * 10, 430));
  return { world, player, target, others, spawn };
}

function tick(world: World): void {
  clock += 1000;
  world.tickCounter += 1;
}

/** One swing at the target; how much HP it took. */
function swing(world: World, player: PlayerEntity, target: MonsterEntity): { outcome: string; damage: number } {
  tick(world);
  const before = target.hasHealth.hp;
  const outcome = runPlayerAttack(world, player, target, clock, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  return { outcome, damage: before - target.hasHealth.hp };
}

function finishCast(world: World): void {
  clock += 5000;
  world.tickCounter += 1;
  updateAbilityCasts(world, clock);
}

function swings(world: World, player: PlayerEntity, target: MonsterEntity, n: number): number[] {
  return Array.from({ length: n }, () => swing(world, player, target).damage);
}

const hurt = (m: MonsterEntity): number => m.hasHealth.maxHp - m.hasHealth.hp;
const PLAIN4: (string | null)[] = [null, null, null, null];
const PLAIN3: (string | null)[] = [null, null, null];
const PLAIN6: (string | null)[] = [null, null, null, null, null, null];

// ── The kit is data-complete and the runtime knows every T3 piece ───────────

{
  const t3Pieces = ['earthsplitter', 'upheaval', 'hemorrhage', 'triple-cut', 'shadowstep', 'icebreaker', 'overheat'];
  for (const name of t3Pieces) {
    const piece = STRIKER_KIT.pieces.find((p) => p.id === `striker-${name}`);
    assert(piece, `${name} is in the kit`);
    assert(Object.keys(piece.params).length > 0, `${name} carries its numbers`);
  }
  const effects = (id: string) => ITEM_DATABASE.get(id)?.mechanicEffects ?? {};
  const line = (id: string) => ITEM_DATABASE.get(id)?.classLines?.cadence?.effects ?? {};
  for (const tier of ['t3', 't4']) {
    assert(effects(`striker-rimeblade-${tier}`)['striker.cold-pct'], `Rimeblade ${tier} has its job`);
    assert(effects(`striker-bloodfire-axe-${tier}`)['striker.low-hp-pct'], `Bloodfire Axe ${tier} has its job`);
    assert(line(`tundra-vest-${tier}`)['striker.chill-build-cut-pct'], `Winter Coat ${tier} has its key`);
    assert(line(`tundra-charm-${tier}`)['striker.chilled-recovery-x'], `Frostbite Mend ${tier} has its key`);
    assert(line(`volcanic-vest-${tier}`)['striker.heat-ward'], `Cinderskin ${tier} has its key`);
    assert(line(`volcanic-charm-${tier}`)['striker.heat-recovery-pct'], `Fuel ${tier} has its key`);
  }
  assert(
    (effects('striker-rimeblade-t4')['striker.cold-pct'] ?? 0) > (effects('striker-rimeblade-t3')['striker.cold-pct'] ?? 0),
    'a job steps up a tier',
  );
}

// ── Techniques (§12.16) ──────────────────────────────────────────────────────

// 1. Earthsplitter: a wind-up that slams down a line through the target; off the line is spared.
{
  const r = setup({ beats: [null, null, null, 'striker-earthsplitter'], others: 2 });
  r.others[0].hasPosition.current = { x: 520, y: 400 }; // on the line, behind the target
  r.others[1].hasPosition.current = { x: 430, y: 700 }; // far off it
  swings(r.world, r.player, r.target, 3);
  assert.equal(swing(r.world, r.player, r.target).outcome, 'cancelled', 'the wind-up casts instead of swinging');
  assert.equal(r.player.isCastingAbility?.abilityId, 'striker-earthsplitter', 'it winds up');
  finishCast(r.world);
  assert(hurt(r.target) > 0 && hurt(r.others[0]) > 0, 'the slam hits the target and what stands behind it');
  assert.equal(hurt(r.others[1]), 0, 'and spares what is off the line');
  assert(isEmpoweredAttack(r.player), 'the cast counted as the wind-up beat: the finisher is armed');
}

// 2. Upheaval knocks the target and those touching it down (a stun); control-immune bosses refuse.
{
  const r = setup({ beats: ['striker-upheaval', null, null, null], others: 2 });
  r.others[0].hasPosition.current = { x: 450, y: 400 }; // touching
  r.others[1].hasPosition.current = { x: 430, y: 700 }; // far
  swing(r.world, r.player, r.target);
  assert(isMonsterStunned(r.world, r.target.isMonster.id), 'the target is knocked down');
  assert(isMonsterStunned(r.world, r.others[0].isMonster.id), 'and so is what touches it');
  assert(!isMonsterStunned(r.world, r.others[1].isMonster.id), 'but not what stands apart');
}

// 3. Hemorrhage: a deeper bleed than Rend (which is already at rank II here).
{
  const bleed = (id: string) => {
    const r = setup({ beats: [id, null, null, null] });
    swing(r.world, r.player, r.target);
    return getStatusEffect(r.target.tracksCombat, 'cadence-hemorrhage')?.stacks ?? 0;
  };
  assert(bleed('striker-hemorrhage') > bleed('striker-rend'), 'Hemorrhage outlasts Rend');
}

// 4. Triple Cut: two more cuts, and the beat pays its on-hit damage three times.
{
  const beat = (id: string | null, onHitDamage: number) => {
    const r = setup({ beats: [id, null, null, null], onHitDamage });
    return swing(r.world, r.player, r.target).damage;
  };
  const cutGain = beat('striker-triple-cut', 600) - beat('striker-triple-cut', 0);
  const plainGain = beat(null, 600) - beat(null, 0);
  assert(plainGain > 0, 'on-hit damage is observable');
  assert(beat('striker-triple-cut', 0) > beat(null, 0), 'three cuts out-damage one swing');
  assert(cutGain >= plainGain * 2.5, `the on-hit is paid three times (${cutGain} vs ${plainGain})`);
}

// 5. Shadowstep: the opener steps behind the target and arms the next beat's crit.
{
  const r = setup({ beats: ['striker-shadowstep', null, null, null] });
  assert.equal(swing(r.world, r.player, r.target).outcome, 'cancelled', 'the opener casts');
  finishCast(r.world);
  assert(r.player.hasPosition.current.x > r.target.hasPosition.current.x, 'the Striker is behind the target');
  assert(strikerT2(r.player).critMult > 0, 'the next beat is armed to crit');
  assert.equal(r.player.usesCadence!.count, 1, 'and the step counted as the opener');
  const crit = swing(r.world, r.player, r.target).damage;
  const plain = swing(r.world, r.player, r.target).damage;
  assert(crit > plain, `the beat after a Shadowstep crits (${crit} > ${plain})`);
}

// 6. Icebreaker: much harder against a shelled target.
{
  const beat = (shelled: boolean) => {
    const r = setup({ beats: ['striker-icebreaker', null, null, null] });
    if (shelled) setCounter(r.target.tracksCombat, 'shellUpEndsAt', clock + 60_000);
    return swing(r.world, r.player, r.target).damage;
  };
  assert(beat(true) > beat(false) * 1.5, 'a shelled target takes far more');
}

// 7. Overheat: the opener speeds the combo and raises the damage you take, until the finisher.
{
  const r = setup({ beats: ['striker-overheat', null, null, null] });
  assert.equal(swing(r.world, r.player, r.target).outcome, 'cancelled', 'the opener casts');
  finishCast(r.world);
  const heat = getStatusEffect(r.player.tracksCombat, 'striker-focus');
  assert(heat && (heat.data[ATTACK_HASTE_PCT_KEY] ?? 0) > 0.25, 'the combo is hasted harder than Focus');
  assert(playerIncomingDamageMult(r.player.tracksCombat) > 1, 'and you take more damage');
  swings(r.world, r.player, r.target, 3);
  swing(r.world, r.player, r.target); // the finisher
  assert.equal(playerIncomingDamageMult(r.player.tracksCombat), 1, 'the finisher ends it');
}

// ── Trophies ─────────────────────────────────────────────────────────────────

// 8. Pounce II: the landing also hits the enemies around the target.
{
  const landing = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-jungle'], bossesCleared: cleared, others: 1 });
    swings(r.world, r.player, r.target, 4);
    r.target.hasPosition.current = { x: 700, y: 400 };
    r.others[0].hasPosition.current = { x: 740, y: 400 };
    tick(r.world);
    updateStrikerLeaps(r.world, clock);
    return hurt(r.others[0]);
  };
  assert(landing(['jungle:3']) > landing(['jungle:2']), 'Pounce II hits what stands beside the landing');
}

// 9. Verdict II: a higher threshold.
{
  const dies = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-desert'], bossesCleared: cleared });
    swings(r.world, r.player, r.target, 4);
    r.target.hasHealth.hp = Math.floor(r.target.hasHealth.maxHp * 0.2);
    swing(r.world, r.player, r.target);
    return r.target.hasHealth.hp <= 0;
  };
  assert(!dies(['desert:2']), 'Verdict I leaves a target at 20%');
  assert(dies(['desert:2', 'desert:3']), 'Verdict II executes it');
}

// 10. Hoarfrost (Tundra spark): every beat of the next combo slows the target a little more.
{
  const r = setup({ beats: PLAIN4, relic: ['striker-relic-tundra'], bossesCleared: ['tundra:3'] });
  swings(r.world, r.player, r.target, 5); // a combo and its finisher: the spark is armed
  assert.equal(getStatusEffect(r.target.tracksCombat, ABILITY_SLOW_EFFECT_ID), undefined, 'nothing slows in the first combo');
  swing(r.world, r.player, r.target);
  const one = getStatusEffect(r.target.tracksCombat, ABILITY_SLOW_EFFECT_ID)?.data['moveSlowPct'] ?? 0;
  swing(r.world, r.player, r.target);
  const two = getStatusEffect(r.target.tracksCombat, ABILITY_SLOW_EFFECT_ID)?.data['moveSlowPct'] ?? 0;
  assert(one > 0 && two > one, `each beat slows more (${one} -> ${two})`);
  // A boss that accepts no control ignores it.
  const boss = setup({ beats: PLAIN4, relic: ['striker-relic-tundra'], bossesCleared: ['tundra:3'] });
  const def = MONSTER_DATABASE.get(DUMMY)!;
  MONSTER_DATABASE.set(DUMMY, { ...def, controlImmune: true });
  swings(boss.world, boss.player, boss.target, 6);
  MONSTER_DATABASE.set(DUMMY, def);
  assert.equal(getStatusEffect(boss.target.tracksCombat, ABILITY_SLOW_EFFECT_ID), undefined, 'a control-immune boss ignores Hoarfrost');
}

// 11. Eruption (Volcanic weight): the finisher hits everything around the target, harder against a shell.
{
  const finisher = (shelled: boolean) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-volcanic'], bossesCleared: ['volcanic:3'], others: 1 });
    swings(r.world, r.player, r.target, 4);
    if (shelled) setCounter(r.target.tracksCombat, 'shellUpEndsAt', clock + 60_000);
    const dealt = swing(r.world, r.player, r.target).damage;
    return { dealt, splash: hurt(r.others[0]) };
  };
  const open = finisher(false);
  assert(open.splash > 0, 'the finisher hits the enemy beside the target');
  const shell = finisher(true);
  assert(shell.dealt > open.dealt, 'and harder against a shell');
}

// 12. The rank-ups the kit already carried: Skyfall III's shorter wind-up, Sunder III's longer exposure.
{
  const sky = STRIKER_KIT.trophies.find((t) => t.id === 'striker-relic-mountain')!;
  assert((trophyParamsAt(sky, 3).castMs ?? 0) < (trophyParamsAt(sky, 2).castMs ?? 0), 'Skyfall III winds up faster');
  const exposure = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-cave'], bossesCleared: cleared });
    swings(r.world, r.player, r.target, 5);
    return getStatusEffect(r.target.tracksCombat, 'vulnerability')?.remainingMs ?? 0;
  };
  assert(exposure(['cave:1', 'cave:2', 'cave:3']) > exposure(['cave:1', 'cave:2']), 'Sunder III exposes for longer');
  const festering = STRIKER_KIT.trophies.find((t) => t.id === 'striker-relic-swamp')!;
  assert((trophyParamsAt(festering, 3).sharePct ?? 0) > (trophyParamsAt(festering, 2).sharePct ?? 0), 'Festering Cut III rots deeper');
}

// ── Specializations (§12.6) ──────────────────────────────────────────────────

const LIGHT = 'striker-light';
const BALANCED = 'striker-balanced';
const HEAVY = 'striker-heavy';

// 13. A specialization of another discipline does nothing (the tree gates the pick; the runtime agrees).
{
  const r = setup({ beats: PLAIN3, disciplineId: HEAVY, specializationId: 'striker-thousand-cuts' });
  swings(r.world, r.player, r.target, 3);
  assert.equal(strikerT2(r.player).held.length, 0, 'a foreign specialization is ignored');
}

// 14. Thousand Cuts: lit beats set off their hit effects twice.
{
  const beat = (specializationId: string | undefined) => {
    const r = setup({ beats: PLAIN6, disciplineId: LIGHT, specializationId, onHitDamage: 600 });
    strikerT2(r.player).lit = true;
    return swing(r.world, r.player, r.target).damage;
  };
  assert(beat('striker-thousand-cuts') > beat(undefined), 'a lit beat pays its on-hit twice');
}

// 15. Afterimage: beats hold part of their damage back; the finisher replays every slash.
{
  const run = (specializationId: string | undefined) => {
    const r = setup({ beats: PLAIN6, disciplineId: LIGHT, specializationId });
    const first = swing(r.world, r.player, r.target).damage;
    swings(r.world, r.player, r.target, 5);
    const held = strikerT2(r.player).held.length;
    return { first, held, finisher: swing(r.world, r.player, r.target).damage, left: strikerT2(r.player).held.length };
  };
  const plain = run(undefined);
  const image = run('striker-afterimage');
  assert(image.first < plain.first, 'a beat holds part of its damage back');
  assert.equal(image.held, 6, 'one slash held per beat');
  assert(image.finisher > plain.finisher, `the finisher replays them (${image.finisher} > ${plain.finisher})`);
  assert.equal(image.left, 0, 'and the replay empties the pool');
}

// 16. Afterglow: the shine also lights the finisher and outlasts a break by one combo.
{
  const finisher = (specializationId: string | undefined) => {
    const r = setup({ beats: PLAIN6, disciplineId: LIGHT, specializationId });
    strikerT2(r.player).lit = true;
    swings(r.world, r.player, r.target, 6);
    return swing(r.world, r.player, r.target).damage;
  };
  assert(finisher('striker-afterglow') > finisher(undefined), 'the lit finisher hits harder');
  const stunBreak = (specializationId: string | undefined) => {
    const r = setup({ beats: PLAIN6, disciplineId: LIGHT, specializationId });
    strikerT2(r.player).lit = true;
    applyStun(r.player.tracksCombat, 1000, 'test');
    tick(r.world);
    r.player.performsAttack.lastAttackAt = clock;
    updateStrikerT2(r.world, 100, clock);
    return r;
  };
  assert(!strikerT2(stunBreak(undefined).player).lit, 'a stun puts the shine out');
  const glow = stunBreak('striker-afterglow');
  assert(strikerT2(glow.player).lit, 'with Afterglow the shine survives the stun');
  swings(glow.world, glow.player, glow.target, 7); // the rest of the combo and its finisher
  assert(!strikerT2(glow.player).lit, 'and goes out at the next finisher');
}

// 17. Iaido: a cast sharpens the edge further; a cast damage technique cuts with double the edge.
{
  const edgeAfterCast = (specializationId: string | undefined) => {
    const r = setup({ beats: ['striker-focus', null, null, null], disciplineId: BALANCED, specializationId });
    swing(r.world, r.player, r.target);
    finishCast(r.world);
    return strikerT2(r.player).edge;
  };
  assert(edgeAfterCast('striker-iaido') > edgeAfterCast(undefined), 'a cast sharpens the edge extra steps');
  const slam = (specializationId: string | undefined) => {
    const r = setup({ beats: [null, null, null, 'striker-earthsplitter'], disciplineId: BALANCED, specializationId });
    swings(r.world, r.player, r.target, 3);
    swing(r.world, r.player, r.target);
    const before = r.target.hasHealth.hp;
    finishCast(r.world);
    return before - r.target.hasHealth.hp;
  };
  assert(slam('striker-iaido') > slam(undefined), 'a cast damage technique cuts with the doubled edge');
}

// 18. Tempered: the edge falls to half its peak at the finisher instead of resetting; a stun still resets it.
{
  const edgeAfterFinisher = (specializationId: string | undefined) => {
    const r = setup({ beats: PLAIN4, disciplineId: BALANCED, specializationId });
    swings(r.world, r.player, r.target, 5);
    return strikerT2(r.player).edge;
  };
  assert.equal(edgeAfterFinisher(undefined), 0, 'the edge resets');
  assert.equal(edgeAfterFinisher('striker-tempered'), 2, 'Tempered keeps half the peak');
  const r = setup({ beats: PLAIN4, disciplineId: BALANCED, specializationId: 'striker-tempered' });
  swings(r.world, r.player, r.target, 5);
  applyStun(r.player.tracksCombat, 1000, 'test');
  tick(r.world);
  r.player.performsAttack.lastAttackAt = clock;
  updateStrikerT2(r.world, 100, clock);
  assert.equal(strikerT2(r.player).edge, 0, 'a stun still resets it');
}

// 19. Cascade: each damage technique raises the edge an extra step.
{
  const edge = (specializationId: string | undefined) => {
    const r = setup({ beats: ['striker-sweep', null, null, null], disciplineId: BALANCED, specializationId });
    swing(r.world, r.player, r.target);
    return strikerT2(r.player).edge;
  };
  assert.equal(edge(undefined), 1, 'one step per beat');
  assert.equal(edge('striker-cascade'), 2, 'a damage technique adds a step');
}

// 20. Subjugator: control techniques build more Momentum; the finisher hits a controlled enemy much harder.
{
  const momentum = (specializationId: string | undefined) => {
    const r = setup({ beats: ['striker-hamstring', null, null], disciplineId: HEAVY, specializationId });
    swing(r.world, r.player, r.target);
    return strikerT2(r.player).momentum;
  };
  assert(momentum('striker-subjugator') > momentum(undefined), 'a control technique builds more Momentum');
  const finisher = (specializationId: string | undefined, stun: boolean) => {
    const r = setup({ beats: PLAIN3, disciplineId: HEAVY, specializationId });
    swings(r.world, r.player, r.target, 3);
    if (stun) applyStun(r.target.tracksCombat, 5000, 'test');
    return swing(r.world, r.player, r.target).damage;
  };
  assert(finisher('striker-subjugator', true) > finisher('striker-subjugator', false) * 1.5, 'a controlled enemy takes far more');
  assert.equal(finisher(undefined, true), finisher(undefined, false), 'and not without Subjugator');
}

// 21. Frenzy: as the fight goes on, a second, lighter finisher joins the combo.
{
  const run = (specializationId: string | undefined) => {
    const r = setup({ beats: PLAIN3, disciplineId: HEAVY, specializationId });
    swings(r.world, r.player, r.target, 4); // combo one and its finisher
    swings(r.world, r.player, r.target, 3);
    const armedBefore = isEmpoweredAttack(r.player);
    const finisher = swing(r.world, r.player, r.target).damage; // combo two's finisher
    const second = isEmpoweredAttack(r.player);
    const light = swing(r.world, r.player, r.target).damage; // the second finisher, if any
    return { armedBefore, second, finisher, light, after: isEmpoweredAttack(r.player), count: r.player.usesCadence!.count };
  };
  const plain = run(undefined);
  assert(!plain.second, 'no second finisher without Frenzy');
  const frenzy = run('striker-frenzy');
  assert(frenzy.armedBefore && frenzy.second, 'by the second finisher a lighter one follows');
  assert(frenzy.light > plain.light, `it hits like a finisher (${frenzy.light} > ${plain.light})`);
  assert(frenzy.light < frenzy.finisher, 'but lighter than the real one');
  assert(!frenzy.after, 'only one extra finisher joins');
}

// 22. Crescendo: Momentum stops capping and builds while the finisher waits for its release.
{
  const waiting = (specializationId: string | undefined) => {
    const r = setup({
      beats: PLAIN3, disciplineId: HEAVY, specializationId,
      holdFinisher: [{ id: 'target-low', not: true }], // wait until the target is low
    });
    swings(r.world, r.player, r.target, 3);
    assert(isEmpoweredAttack(r.player), 'the finisher is armed');
    const before = strikerT2(r.player).momentum;
    swings(r.world, r.player, r.target, 12); // twelve swings waiting for the release
    assert(isEmpoweredAttack(r.player), 'and held');
    const waited = strikerT2(r.player).momentum;
    r.target.hasHealth.hp = Math.floor(r.target.hasHealth.maxHp * 0.1);
    const finisher = swing(r.world, r.player, r.target).damage;
    return { before, waited, finisher, spent: strikerT2(r.player).momentum };
  };
  const held = waiting(undefined);
  const cres = waiting('striker-crescendo');
  assert.equal(held.waited, held.before, 'without Crescendo the wait builds nothing');
  assert(cres.waited > 2, `with it Momentum passes the old cap (${cres.waited})`);
  assert(cres.finisher > held.finisher, 'and the release spends it all in one blow');
  assert.equal(cres.spent, 0, 'all of it');
}

// ── Gear (§12.16) ────────────────────────────────────────────────────────────

// 23. Rimeblade: beats hit harder against slowed, rooted or chilled enemies.
{
  const beat = (slowed: boolean) => {
    const r = setup({ beats: PLAIN4, passives: { 'striker.cold-pct': 0.25 } });
    if (slowed) applyMonsterSlow(r.world, r.target, 0.3, 5000, 'test');
    return swing(r.world, r.player, r.target).damage;
  };
  assert(beat(true) > beat(false), 'a slowed target takes more');
}

// 24. Bloodfire Axe: the lower your HP, the harder your beats hit.
{
  const beat = (hpShare: number) => {
    const r = setup({ beats: PLAIN4, passives: { 'striker.low-hp-pct': 0.5 } });
    r.player.hasHealth.hp = Math.floor(r.player.hasHealth.maxHp * hpShare);
    return swing(r.world, r.player, r.target).damage;
  };
  assert(beat(0.2) > beat(1), 'a bloodied Striker hits harder');
}

// 25. Winter Coat: the Chill builds slower while you keep attacking.
{
  const { world, player } = setup({ beats: PLAIN4, passives: { 'striker.chill-build-cut-pct': 0.5 } });
  const chill = applyStatusEffect(player.tracksCombat, {
    id: 'tundra-chill', maxStacks: 6, remainingMs: -1, refreshable: true, sourceId: 'node', data: { rampAccum: 1000, rampMs: 4000 },
  });
  chill.data['rampAccum'] = 1000;
  tick(world);
  player.performsAttack.lastAttackAt = clock;
  updateStrikerT3(world, 400, clock);
  assert.equal(chill.data['rampAccum'], 800, 'the build clock lost half of the tick');
  player.performsAttack.lastAttackAt = clock - 60_000;
  updateStrikerT3(world, 400, clock);
  assert.equal(chill.data['rampAccum'], 800, 'but only while you keep attacking');
}

// 26. Frostbite Mend: Recovery boosts while chilled or slowed.
{
  const { world, player } = setup({ beats: PLAIN4, passives: { 'striker.chilled-recovery-x': 2 } });
  tick(world);
  updateStrikerT3(world, 100, clock);
  assert.equal(getResource(player.tracksCombat, 'recovery.boostMs'), 0, 'nothing without the Chill');
  const chill = applyStatusEffect(player.tracksCombat, {
    id: 'tundra-chill', maxStacks: 6, remainingMs: -1, refreshable: true, sourceId: 'node', data: {},
  });
  chill.stacks = 2;
  updateStrikerT3(world, 100, clock);
  assert(getResource(player.tracksCombat, 'recovery.boostMs') > 0, 'chilled switches the boost on');
  assert.equal(getResource(player.tracksCombat, 'recovery.boostX'), 2, 'doubling Recovery');
}

// 27. Cinderskin and Fuel: the Heat's extra damage is off while you keep attacking; Recovery rises with it.
{
  const { world, player } = setup({ beats: PLAIN4, passives: { 'striker.heat-ward': 1, 'striker.heat-recovery-pct': 0.1 } });
  const heat = applyStatusEffect(player.tracksCombat, {
    id: 'volcanic-heat', maxStacks: 15, remainingMs: -1, refreshable: true, sourceId: 'node', data: { damageTakenPct: 0.02 },
  });
  heat.stacks = 5;
  assert(playerIncomingDamageMult(player.tracksCombat) > 1, 'the Heat makes you take more');
  tick(world);
  player.performsAttack.lastAttackAt = clock;
  updateStrikerT3(world, 100, clock);
  assert.equal(playerIncomingDamageMult(player.tracksCombat), 1, 'Cinderskin turns it off while you attack');
  assert(Math.abs(getResource(player.tracksCombat, 'recovery.boostX') - 1.5) < 1e-9, 'Fuel: Recovery rises with the stacks');
  player.performsAttack.lastAttackAt = clock - 60_000;
  updateStrikerT3(world, 100, clock);
  assert(playerIncomingDamageMult(player.tracksCombat) > 1, 'and gives it back when you stop');
}

console.log('strikerT3.test.ts: ok');
