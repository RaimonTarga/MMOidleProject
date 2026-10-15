/**
 * The Striker's Tier 2 (class-first build plan T2-STRIKER; bible §12.5, §12.8, §12.16): the
 * T2 techniques, the trophy ranks and the Jungle and Desert trophies, the three disciplines'
 * resources, and the Jungle and Desert gear jobs. Wiring only: attach, tick, assert
 * observable state; no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_ROOT_EFFECT_ID,
  ITEM_DATABASE,
  emptyEquipment,
  getResource,
  getStatusEffect,
  MONSTER_DATABASE,
  applyStatusEffect,
  type OrderConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { recordMoment } from '../src/systems/combat/moments/moments';
import { applyStun, isMonsterStunned, STUN_EFFECT, STUN_IMMUNE_EFFECT } from '../src/systems/combat/status/stun';
import { updateStrikerLeaps } from '../src/systems/classes/archetypes/cadence/order';
import { strikerT2, updateStrikerT2 } from '../src/systems/classes/archetypes/cadence/strikerT2';
import { setEntityMotion } from '../src/systems/world/movement';
import { updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const DUMMY = 'test-striker-t2-dummy';
const base = MONSTER_DATABASE.get('bone-crawler');
assert(base, 'the base monster exists');
MONSTER_DATABASE.set(DUMMY, { ...base, id: DUMMY, evasion: 0 });

let clock = 10_000;

function setup(opts: {
  beats: (string | null)[];
  relic?: string[];
  bossesCleared?: string[];
  disciplineId?: string;
  others?: number;
  passives?: Record<string, number>;
  /** Where the target stands (default: next to the player). */
  targetAt?: { x: number; y: number };
  plating?: number;
}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'striker', name: 'Striker' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {},
      // Every T1 and T2 lesson learned.
      biomeLevel: { plains: 20, forest: 20, swamp: 20, mountain: 20, cave: 20, jungle: 20, desert: 20 },
      playerTier: 2, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cadence-root'], passives: { ...(opts.passives ?? {}) }, selectedClass: 'cadence-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cadence',
      disciplineId: opts.disciplineId ?? null,
    },
  } as PersistedPlayerSlices, 'striker');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.usesSkills.passives = { ...(opts.passives ?? {}) };
  attachComponent(world, player, 'configuresClass', {
    config: {
      mode: 'custom',
      relic: opts.relic ?? [],
      system: { kind: 'order', beats: opts.beats, holdFinisher: [] } satisfies OrderConfig,
    },
  });
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, DUMMY, { x, y });
    assert(m, 'the dummy spawns');
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = opts.plating ?? 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  const at = opts.targetAt ?? { x: 430, y: 400 };
  const target = spawn(at.x, at.y);
  setAttackTarget(world, player, target.isMonster.id);
  const others = Array.from({ length: opts.others ?? 0 }, (_, i) => spawn(at.x - 10 + i * 10, at.y + 30));
  return { world, player, target, others };
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

const PLAIN4: (string | null)[] = [null, null, null, null];

// ── Techniques (§12.16) ──────────────────────────────────────────────────────

// 1. Whirlwind spins through everything around you three times; Sweep once.
{
  const sweep = setup({ beats: [null, null, null, 'striker-sweep'], others: 2 });
  swings(sweep.world, sweep.player, sweep.target, 4);
  const sweepHit = sweep.others[0].hasHealth.maxHp - sweep.others[0].hasHealth.hp;
  const whirl = setup({ beats: [null, null, null, 'striker-whirlwind'], others: 2 });
  swings(whirl.world, whirl.player, whirl.target, 4);
  const whirlHit = whirl.others[0].hasHealth.maxHp - whirl.others[0].hasHealth.hp;
  assert(sweepHit > 0 && whirlHit > sweepHit, `Whirlwind hits everything around more than once (${whirlHit} > ${sweepHit})`);
}

// 2. Feint deals no damage; the next beat is a critical hit; the arming is spent.
{
  const { world, player, target } = setup({ beats: ['striker-feint', null, null, null] });
  const feint = swing(world, player, target);
  assert.equal(feint.damage, 0, 'Feint deals no damage');
  assert(strikerT2(player).critMult > 0, 'and arms the next beat');
  const crit = swing(world, player, target).damage;
  const plain = swing(world, player, target).damage;
  assert(crit > plain, `the beat after a Feint crits (${crit} > ${plain})`);
  assert.equal(strikerT2(player).critMult, 0, 'the crit is spent');
}

// 3. Armor Break cracks the plating for a while: the next hit lands harder.
{
  const { world, player, target } = setup({ beats: ['striker-armor-break', null, null, null], plating: 20 });
  const before = swing(world, player, target);
  const shred = getStatusEffect(target.tracksCombat, 'plating-shred');
  assert(shred && shred.remainingMs > 0 && (shred.data['platingReduction'] ?? 0) > 0, 'Armor Break cracks the plating');
  const after = swing(world, player, target);
  assert(after.damage > before.damage, `a cracked target takes more (${after.damage} > ${before.damage})`);
}

// 4. Concuss stuns; Pin roots.
{
  const { world, player, target } = setup({ beats: ['striker-concuss', null, null, null] });
  swing(world, player, target);
  assert(isMonsterStunned(world, target.isMonster.id), 'Concuss stuns the target');
}
{
  const { world, player, target } = setup({ beats: ['striker-pin', null, null, null] });
  swing(world, player, target);
  assert(getStatusEffect(target.tracksCombat, ABILITY_ROOT_EFFECT_ID), 'Pin roots the target');
}

// 5. Charge: the opener casts at a target out of reach, dashes to it and strikes; the strike is beat one.
{
  const { world, player, target } = setup({ beats: ['striker-charge', null, null, null], targetAt: { x: 700, y: 400 } });
  tick(world);
  updateStrikerLeaps(world, clock);
  assert.equal(player.isCastingAbility?.abilityId, 'striker-charge', 'Charge winds up against a target out of reach');
  const from = player.hasPosition.current.x;
  finishCast(world);
  assert(player.hasPosition.current.x > from + 100, 'the dash closes the gap');
  assert(target.hasHealth.hp < target.hasHealth.maxHp, 'and strikes');
  assert.equal(player.usesCadence!.count, 1, 'the strike counted as the opener beat');
}
{
  // In reach, the ordinary swing casts it.
  const { world, player, target } = setup({ beats: ['striker-charge', null, null, null] });
  assert.equal(swing(world, player, target).outcome, 'cancelled', 'in reach the opener casts instead of swinging');
  finishCast(world);
  assert.equal(player.usesCadence!.count, 1, 'and the strike counts');
}

// 6. Rend II (the Swamp's second lesson): the bleed lasts longer.
{
  const stacksAt = (swampLevel: number) => {
    const r = setup({ beats: ['striker-rend', null, null, null] });
    r.player.tracksProgression.biomeLevel['swamp'] = swampLevel;
    attachComponent(r.world, r.player, 'configuresClass', { config: r.player.configuresClass!.config });
    swing(r.world, r.player, r.target);
    return getStatusEffect(r.target.tracksCombat, 'cadence-hemorrhage')?.stacks ?? 0;
  };
  assert(stacksAt(20) > stacksAt(2), 'Rend II bleeds longer than Rend');
}

// ── Trophies ─────────────────────────────────────────────────────────────────

// 7. Rank-ups: Wide Arc II strikes two extra enemies; Sunder II also cracks plating;
//    Skyfall II ignores part of the plating.
{
  const arcDamage = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-plains'], bossesCleared: cleared, others: 3 });
    swings(r.world, r.player, r.target, 5);
    swing(r.world, r.player, r.target);
    return r.others.filter((m) => m.hasHealth.hp < m.hasHealth.maxHp).length;
  };
  assert(arcDamage(['plains:1', 'plains:2']) > arcDamage(['plains:1']), 'Wide Arc II strikes more enemies beside the target');
}
{
  const r = setup({ beats: PLAIN4, relic: ['striker-relic-cave'], bossesCleared: ['cave:1', 'cave:2'], plating: 30 });
  swings(r.world, r.player, r.target, 5);
  assert(getStatusEffect(r.target.tracksCombat, 'plating-shred'), 'Sunder II cracks the exposed target\'s plating');
}
{
  const blow = (cleared: string[]) => {
    const r = setup({ beats: PLAIN4, relic: ['striker-relic-mountain'], bossesCleared: cleared, plating: 3 });
    swings(r.world, r.player, r.target, 4);
    swing(r.world, r.player, r.target);
    const before = r.target.hasHealth.hp;
    finishCast(r.world);
    return before - r.target.hasHealth.hp;
  };
  assert(blow(['mountain:1', 'mountain:2']) > blow(['mountain:1']), 'Skyfall II ignores part of the plating');
}

// 8. Pounce (Jungle): the armed finisher leaps to a target that ran, harder for the distance.
{
  const plain = setup({ beats: PLAIN4 });
  swings(plain.world, plain.player, plain.target, 4);
  const plainFinisher = swing(plain.world, plain.player, plain.target).damage;
  const { world, player, target } = setup({ beats: PLAIN4, relic: ['striker-relic-jungle'], bossesCleared: ['jungle:2'] });
  swings(world, player, target, 4);
  assert(isEmpoweredAttack(player), 'the finisher is armed');
  target.hasPosition.current = { x: 700, y: 400 };
  tick(world);
  const before = target.hasHealth.hp;
  updateStrikerLeaps(world, clock);
  assert(!isEmpoweredAttack(player), 'Pounce leapt and spent the finisher');
  assert(player.hasPosition.current.x > 450, 'the leap closed the gap');
  assert(before - target.hasHealth.hp > plainFinisher, 'and a long leap hits harder');
}

// 9. Verdict (Desert): the finisher kills a target below the threshold outright.
{
  const { world, player, target } = setup({ beats: PLAIN4, relic: ['striker-relic-desert'], bossesCleared: ['desert:2'] });
  swings(world, player, target, 4);
  target.hasHealth.hp = Math.floor(target.hasHealth.maxHp * 0.1);
  swing(world, player, target);
  assert(target.hasHealth.hp <= 0, 'Verdict executes a target at 10% HP');
}
{
  const { world, player, target } = setup({ beats: PLAIN4, relic: ['striker-relic-desert'], bossesCleared: ['desert:2'] });
  swings(world, player, target, 5);
  assert(target.hasHealth.hp > 0, 'and leaves a healthy target alive');
}

// ── Disciplines (§12.5) ──────────────────────────────────────────────────────

// 10. Light: the finisher lights the next combo, whose beats hit harder; a break puts the shine out.
{
  const { world, player, target } = setup({ beats: [null, null, null, null, null, null], disciplineId: 'striker-light' });
  const first = swing(world, player, target).damage;
  swings(world, player, target, 5);
  swing(world, player, target); // the finisher
  assert(strikerT2(player).lit, 'the finisher lights the next combo');
  const lit = swing(world, player, target).damage;
  assert(lit > first, `a lit beat hits harder (${lit} > ${first})`);
  applyStun(player.tracksCombat, 1000, 'test');
  tick(world);
  updateStrikerT2(world, 100, clock);
  assert(!strikerT2(player).lit, 'a stun puts the shine out');
}

// 11. Balanced: the edge rises with every beat; the finisher cuts with it; the finisher resets it.
{
  const base5 = setup({ beats: PLAIN4 });
  swings(base5.world, base5.player, base5.target, 4);
  const plainFinisher = swing(base5.world, base5.player, base5.target).damage;
  const { world, player, target } = setup({ beats: PLAIN4, disciplineId: 'striker-balanced' });
  swings(world, player, target, 4);
  assert.equal(strikerT2(player).edge, 4, 'the edge rose a step per beat');
  const finisher = swing(world, player, target).damage;
  assert(finisher > plainFinisher, `the finisher cuts with the edge (${finisher} > ${plainFinisher})`);
  assert.equal(strikerT2(player).edge, 0, 'and resets');
}

// 12. Heavy: soft beats build Momentum, a setup multiplies it, the finisher spends it all.
{
  const base4 = setup({ beats: [null, null, null] });
  swings(base4.world, base4.player, base4.target, 3);
  const plainFinisher = swing(base4.world, base4.player, base4.target).damage;
  const { world, player, target } = setup({ beats: [null, null, 'striker-focus'], disciplineId: 'striker-heavy' });
  swing(world, player, target);
  swing(world, player, target);
  const built = strikerT2(player).momentum;
  assert(built > 0, 'soft beats build Momentum');
  swing(world, player, target);
  finishCast(world); // Focus, a setup, multiplies it
  assert(strikerT2(player).momentum > built, 'a setup multiplies Momentum');
  const finisher = swing(world, player, target).damage;
  assert(finisher > plainFinisher, `the finisher spends it (${finisher} > ${plainFinisher})`);
  assert.equal(strikerT2(player).momentum, 0, 'all of it');
}

// 13. A break costs the resource: a stun drains Momentum; Unbroken says the stun doesn't count.
{
  const run = (passives: Record<string, number>) => {
    const r = setup({ beats: [null, null, null], disciplineId: 'striker-heavy', passives });
    swings(r.world, r.player, r.target, 2);
    assert(strikerT2(r.player).momentum > 0, 'Momentum is up');
    applyStun(r.player.tracksCombat, 1000, 'test');
    tick(r.world);
    r.player.performsAttack.lastAttackAt = clock;
    updateStrikerT2(r.world, 100, clock);
    return strikerT2(r.player).momentum;
  };
  assert.equal(run({}), 0, 'a stun drains Momentum');
  assert(run({ 'defense.control-duration-cut-pct': 0.25 }) > 0, 'Unbroken keeps it');
}
{
  const r = setup({ beats: [null, null, null], disciplineId: 'striker-balanced' });
  swing(r.world, r.player, r.target);
  tick(r.world);
  updateStrikerT2(r.world, 100, clock + 10_000);
  assert.equal(strikerT2(r.player).edge, 0, 'a few seconds with no target reset the edge');
}

// ── Gear (§12.16) ────────────────────────────────────────────────────────────

// 14. Gear data carries the keys.
{
  const effects = (id: string) => ITEM_DATABASE.get(id)?.mechanicEffects ?? {};
  const line = (id: string) => ITEM_DATABASE.get(id)?.classLines?.cadence?.effects ?? {};
  assert(effects('striker-hunters-blade-t2')['striker.first-strike-pct'], "Hunter's Blade has its job");
  assert(effects('striker-executioners-blade-t2')['striker.execute-pct'], "Executioner's Blade has its job");
  assert(line('jungle-vest-t2')['striker.ambush-proof'], 'Watchful has its key');
  assert(line('jungle-charm-t2')['striker.closing-recovery-x'], 'Chase has its key');
  assert(line('desert-vest-t2')['striker.close-in-speed-pct'], 'Close In has its key');
  assert(line('desert-charm-t2')['striker.shake-off-interval-ms'], 'Shake Off has its key');
}

// 15. Hunter's Blade: the first beat on a new target hits much harder.
{
  const { world, player, target } = setup({ beats: PLAIN4, passives: { 'striker.first-strike-pct': 0.5 } });
  const [first, second] = swings(world, player, target, 2);
  assert(first > second, `the first beat on a new target hits harder (${first} > ${second})`);
}

// 16. Executioner's Blade: damage techniques and the finisher hit harder below half HP.
{
  const finisherAt = (hpShare: number, passives: Record<string, number>) => {
    const r = setup({ beats: PLAIN4, passives });
    swings(r.world, r.player, r.target, 4);
    r.target.hasHealth.hp = Math.floor(r.target.hasHealth.maxHp * hpShare);
    return swing(r.world, r.player, r.target).damage;
  };
  const job = { 'striker.execute-pct': 0.4 };
  assert(finisherAt(0.4, job) > finisherAt(0.8, job), 'it bites below half HP');
  assert.equal(finisherAt(0.4, {}), finisherAt(0.8, {}), 'and not without the job');
}

// 17. Watchful: an ambush can't interrupt a cast.
{
  const { world, player, target } = setup({ beats: ['striker-focus', null, null, null], passives: { 'striker.ambush-proof': 1 } });
  assert.equal(swing(world, player, target).outcome, 'cancelled', 'the opener casts');
  applyStun(player.tracksCombat, 1000, 'ambusher');
  tick(world);
  recordMoment(world, player, 'ambush');
  updateStrikerT2(world, 100, clock);
  assert(strikerT2(player).ambushGuard, 'an ambush raises the guard');
  finishCast(world);
  assert.equal(player.usesCadence!.count, 1, 'and the cast lands through the stun');
}
{
  const { world, player, target } = setup({ beats: ['striker-focus', null, null, null] });
  swing(world, player, target);
  applyStun(player.tracksCombat, 1000, 'ambusher');
  tick(world);
  recordMoment(world, player, 'ambush');
  updateStrikerT2(world, 100, clock);
  finishCast(world);
  assert.equal(player.usesCadence!.count, 0, 'without Watchful the same stun breaks it');
}

// 18. Chase: Recovery boosts while closing on a target.
{
  const { world, player, target } = setup({ beats: PLAIN4, passives: { 'striker.closing-recovery-x': 2 }, targetAt: { x: 800, y: 400 } });
  setEntityMotion(world, player, target.hasPosition.current);
  tick(world);
  updateStrikerT2(world, 100, clock);
  assert(getResource(player.tracksCombat, 'recovery.boostMs') > 0, 'closing on a target switches the boost on');
}

// 19. Close In: faster toward a ranged attacker that hits you.
{
  const { world, player, target } = setup({ beats: PLAIN4, passives: { 'striker.close-in-speed-pct': 0.3 }, targetAt: { x: 800, y: 400 } });
  target.performsAttack.attackRange = 400;
  setAggroTarget(world, target, { id: player.isPlayer.id, kind: 'player' }, clock);
  setEntityMotion(world, player, target.hasPosition.current);
  tick(world);
  updateStrikerT2(world, 100, clock);
  const boost = getStatusEffect(player.tracksCombat, 'ability-sidestep');
  assert((boost?.data['moveSpeedPct'] ?? 0) > 0 && !(boost?.data['evasionPct']), 'a ranged attacker speeds the approach');
}

// 20. Shake Off: every interval a mark or slow on you ends.
{
  const { world, player } = setup({ beats: PLAIN4, passives: { 'striker.shake-off-interval-ms': 1000 } });
  applyStatusEffect(player.tracksCombat, { id: 'sun-mark', maxStacks: 1, remainingMs: 8000, refreshable: true, sourceId: 'x', data: { totalMs: 8000 } });
  tick(world);
  updateStrikerT2(world, 1500, clock);
  assert(!getStatusEffect(player.tracksCombat, 'sun-mark'), 'the mark ended');
}

void STUN_EFFECT;
void STUN_IMMUNE_EFFECT;
console.log('strikerT2.test.ts: ok');
