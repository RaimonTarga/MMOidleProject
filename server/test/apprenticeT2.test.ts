/**
 * The Apprentice at tier 2 (bible §9.5, §9.8, §9.16): the three disciplines (Poison's plague,
 * Fire's chain, Frost's freeze) and their pieces, the T2 lessons (Blast Back, Sear, Seep, Snag,
 * Recoil), the T2 trophy ranks, and the Jungle and Desert gear jobs. Wiring only: attach, tick,
 * assert observable state; no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  type PayoffPlacement,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { laySigils, payoffsOf, updateApprentice } from '../src/systems/classes/archetypes/dot/sigils';
import { trophyParam } from '../src/systems/classes/archetypes/dot/sigilsT2';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { syncEnemyBarrierState } from '../src/systems/combat/engine/enemyBarrierState';
import { recordMoment, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { monsterHasLiveRoot } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const T2_LEVEL = 8;
const BIOMES = { plains: T2_LEVEL, forest: T2_LEVEL, swamp: T2_LEVEL, mountain: T2_LEVEL, cave: T2_LEVEL, jungle: T2_LEVEL, desert: T2_LEVEL };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-apprentice-t2-dummy', { ...base, id: 'test-apprentice-t2-dummy', evasion: 0 });
MONSTER_DATABASE.set('test-apprentice-t2-kiter', { ...base, id: 'test-apprentice-t2-kiter', evasion: 0, behavior: 'kiter' });
MONSTER_DATABASE.set('test-apprentice-t2-immune', { ...base, id: 'test-apprentice-t2-immune', evasion: 0, controlImmune: true });
const SIGIL = 'dot';

let clock = 100_000;

interface Options {
  discipline?: string;
  relic?: string[];
  bossesCleared?: string[];
  placements?: PayoffPlacement[];
  passives?: Record<string, number>;
}

function setup(opts: Options = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'apprentice', name: 'Apprentice' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 2, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['dot-root'], passives: {}, selectedClass: 'dot-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'dot', disciplineId: opts.discipline ?? null,
    },
  } as PersistedPlayerSlices, 'apprentice');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'dot', biomeLevel: BIOMES, bossesCleared: opts.bossesCleared ?? [], disciplineId: opts.discipline ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'payoffs' && opts.placements) config.system.placements = opts.placements;
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  player.dealsDamage.attack = 100;
  const spawn = (x: number, y: number, type = 'test-apprentice-t2-dummy'): MonsterEntity => {
    const m = world.createMonster(NODE, type, { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn, cap: payoffsOf(world, player)!.cap };
}

const sigils = (m: MonsterEntity): number => getStatusEffect(m.tracksCombat, SIGIL)?.stacks ?? 0;
const has = (m: { tracksCombat: MonsterEntity['tracksCombat'] }, id: string): boolean => getStatusEffect(m.tracksCombat, id) !== undefined;
const place = (moment: PayoffPlacement['moment'], pieceId: string): PayoffPlacement => ({ moment, pieceId, conditions: [] });

function hit(world: World, player: PlayerEntity, target: MonsterEntity): number {
  clock += 1_000;
  setAttackTarget(world, player, target.isMonster.id);
  const before = target.hasHealth.hp;
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'apprentice', kind: 'player' } });
  return before - target.hasHealth.hp;
}

function step(world: World, player: PlayerEntity, target?: MonsterEntity): void {
  if (target) setAttackTarget(world, player, target.isMonster.id);
  clock += 100;
  world.tickCounter++;
  updatePlayerMoments(world, player, clock);
  updateApprentice(world, player, 100, clock);
}


// ── Poison: small and many, the walking plague, Wither ───────────────────────
{
  const plain = setup();
  const poison = setup({ discipline: 'apprentice-poison', placements: [] });
  assert.equal(poison.cap, plain.cap + 2, 'Poison: the cap holds 2 more');

  const { world, player, spawn, cap } = poison;
  const carrier = spawn(430, 400);
  const neighbour = spawn(470, 410);
  laySigils(world, player, carrier, cap, cap);
  step(world, player, carrier);
  assert.ok(sigils(neighbour) >= 1, 'the walking plague passes a sigil with no Spread rule placed');
  assert.equal(sigils(carrier), cap, 'and the carrier keeps its bar');

  // A dying carrier passes on what it still carried.
  const dying = spawn(430, 440);
  laySigils(world, player, dying, 3, cap);
  const heir = spawn(450, 460);
  step(world, player, dying);
  dying.hasHealth.hp = 0;
  const before = sigils(heir);
  step(world, player, carrier);
  assert.ok(sigils(heir) > before, 'a dying carrier passes on its sigils');
}
{
  const { world, player, spawn, cap } = setup({ discipline: 'apprentice-poison', placements: [place('target-full', 'apprentice-wither')] });
  assert.ok(payoffsOf(world, player)!.owned.has('apprentice-wither'), 'the Poison pick teaches Wither');
  const target = spawn(430, 400);
  laySigils(world, player, target, cap, cap);
  step(world, player, target);
  assert.equal(sigils(target), 0, 'Wither spends the sigils');
  assert.ok(has(target, 'apprentice-withered'), 'and the enemy deals less damage for a few seconds');
}

// ── Fire: the chain, Fuse, the burn ──────────────────────────────────────────
{
  const { world, player, spawn, cap } = setup({ discipline: 'apprentice-fire', placements: [place('target-full', 'apprentice-detonate')] });
  const target = spawn(430, 400);
  const primed = spawn(480, 400);
  const far = spawn(900, 900);
  laySigils(world, player, primed, cap - 2, cap);
  laySigils(world, player, target, cap, cap);
  step(world, player, target);
  assert.equal(sigils(target), 0, 'Chain Detonate: the first blast goes off');
  assert.equal(sigils(primed), 0, 'the burn it threw filled the neighbour, and it went off too');
  assert.equal(sigils(far), 0, 'an enemy out of the blast is untouched');
  assert.ok(primed.hasHealth.hp < primed.hasHealth.maxHp, 'the chained blast hurt');
}
{
  const { world, player, spawn, cap } = setup({ discipline: 'apprentice-fire', placements: [place('target-full', 'apprentice-fuse')] });
  assert.ok(payoffsOf(world, player)!.owned.has('apprentice-fuse'), 'the Fire pick teaches Fuse');
  const target = spawn(430, 400);
  laySigils(world, player, target, cap, cap);
  step(world, player, target);
  assert.equal(sigils(target), cap, 'Fuse leaves the sigils on while the fuse burns');
  assert.ok(getResource(target.tracksCombat, 'apprentice.fuseAt') > 0, 'and lights the fuse');
  const hp = target.hasHealth.hp;
  for (let i = 0; i < 40; i++) step(world, player, target);
  assert.equal(sigils(target), 0, 'the sigils blow when the fuse runs out');
  assert.ok(target.hasHealth.hp < hp, 'for a blast');
}
{
  const fire = setup({ discipline: 'apprentice-fire' });
  const plain = setup();
  const a = fire.spawn(430, 400);
  const b = plain.spawn(430, 400);
  laySigils(fire.world, fire.player, a, fire.cap, fire.cap);
  laySigils(plain.world, plain.player, b, plain.cap, plain.cap);
  assert.ok(hit(fire.world, fire.player, a) > hit(plain.world, plain.player, b), 'Fire: hits into a full-burn target strike harder');
}

// ── Frost: few and heavy, the freeze, the shatter, Cold Snap ─────────────────
{
  const plain = setup();
  const { world, player, spawn, cap } = setup({ discipline: 'apprentice-frost', placements: [place('enemy-winds-up', 'apprentice-seize')] });
  assert.equal(cap, plain.cap - 1, 'Frost: the cap holds 1 fewer');
  const target = spawn(430, 400);
  laySigils(world, player, target, 3, cap);
  step(world, player, target);
  assert.ok(has(target, 'ability-slowed'), 'each sigil slows its carrier a little');

  recordMoment(world, player, 'enemy-winds-up');
  step(world, player, target);
  assert.equal(sigils(target), 0, 'Seize spends the sigils');
  assert.ok(has(target, 'dot-frozen') && target.hasFrozen !== undefined, 'and now freezes the target');
  assert.ok(!has(target, 'stunned'), 'in place of the stun');
}
{
  const { world, player, spawn, cap } = setup({ discipline: 'apprentice-frost', placements: [place('enemy-winds-up', 'apprentice-seize')] });
  const boss = spawn(430, 400, 'test-apprentice-t2-immune');
  laySigils(world, player, boss, 3, cap);
  recordMoment(world, player, 'enemy-winds-up');
  step(world, player, boss);
  assert.ok(!has(boss, 'dot-frozen'), 'a boss that accepts no control is not frozen');
  const brittle = getStatusEffect(boss.tracksCombat, 'brittle');
  assert.ok(brittle && brittle.data['apprenticeBrittle'] === 1, 'it turns brittle instead');
  assert.ok(hit(world, player, boss) > player.dealsDamage.attack, 'and takes more damage');
}
{
  // The shatter: a Detonate on a frozen target is heavier and chills its neighbours.
  const frozen = setup({ discipline: 'apprentice-frost', placements: [place('target-full', 'apprentice-detonate')] });
  const thawed = setup({ discipline: 'apprentice-frost', placements: [place('target-full', 'apprentice-detonate')] });
  const run = (s: typeof frozen, freeze: boolean) => {
    const target = s.spawn(430, 400);
    const neighbour = s.spawn(480, 400);
    laySigils(s.world, s.player, target, s.cap, s.cap);
    if (freeze) {
      applyStatusEffect(target.tracksCombat, { id: 'dot-frozen', maxStacks: 1, remainingMs: 3000, sourceId: 'apprentice', data: { totalMs: 3000 } });
    }
    const hp = target.hasHealth.hp;
    step(s.world, s.player, target);
    return { lost: hp - target.hasHealth.hp, target, neighbour };
  };
  const a = run(frozen, true);
  const b = run(thawed, false);
  assert.ok(a.lost > b.lost, 'a Detonate on a frozen target Shatters: a heavier hit');
  assert.ok(!has(a.target, 'dot-frozen'), 'the shatter ends the freeze');
  assert.ok(has(a.neighbour, 'ability-slowed') && !has(b.neighbour, 'ability-slowed'), "and its cold chills the neighbour");
}
{
  const { world, player, spawn, cap } = setup({ discipline: 'apprentice-frost', placements: [place('target-full', 'apprentice-cold-snap')] });
  assert.ok(payoffsOf(world, player)!.owned.has('apprentice-cold-snap'), 'the Frost pick teaches Cold Snap');
  const target = spawn(430, 400);
  const neighbour = spawn(480, 400);
  laySigils(world, player, target, cap, cap);
  step(world, player, target);
  assert.equal(sigils(target), 0, 'Cold Snap spends the sigils');
  assert.ok(has(neighbour, 'ability-slowed'), 'and chills every enemy around it');
  assert.ok((getStatusEffect(neighbour.tracksCombat, 'ability-slowed')?.data['attackSlowPct'] ?? 0) > 0, 'the chill slows its attacks too');
}

// ── T2 lessons ───────────────────────────────────────────────────────────────
{
  // Blast Back: a detonation on a charging enemy stops its charge and knocks it back.
  const { world, player, spawn } = setup({ placements: [place('charging-at-me', 'apprentice-blast-back')] });
  const charger = spawn(430, 400);
  setAggroTarget(world, charger, { kind: 'player', id: 'apprentice' }, clock);
  laySigils(world, player, charger, 4, 6);
  charger.controlsMonster.chargeRemainingMs = 800;
  const hp = charger.hasHealth.hp;
  step(world, player, charger);
  assert.equal(sigils(charger), 0, 'Blast Back sets off the sigils');
  assert.equal(charger.controlsMonster.chargeRemainingMs, 0, 'and stops the charge');
  assert.ok(charger.hasHealth.hp < hp, 'with a blast');
}
{
  // Sear: burns a barrier at double; lands if it breaks.
  const run = (barrier: number) => {
    const { world, player, spawn } = setup({ placements: [place('target-shielded', 'apprentice-sear')] });
    const target = spawn(430, 400);
    applyStatusEffect(target.tracksCombat, {
      id: 'barrier:test', maxStacks: 1, remainingMs: 20_000, sourceId: target.isMonster.id,
      data: { monsterWard: 1, wardAmount: barrier, wardMaxAmount: barrier, totalMs: 20_000 },
    });
    syncEnemyBarrierState(world, clock);
    laySigils(world, player, target, 4, 6);
    const hp = target.hasHealth.hp;
    step(world, player, target);
    return { target, lost: hp - target.hasHealth.hp, ward: getStatusEffect(target.tracksCombat, 'barrier:test')?.data['wardAmount'] ?? 0 };
  };
  const thick = run(1_000_000);
  assert.equal(sigils(thick.target), 0, 'Sear spends the sigils');
  assert.ok(thick.ward < 1_000_000 && thick.lost === 0, "a barrier that holds eats the burn and nothing lands");
  const thin = run(30);
  assert.ok(thin.ward === 0 && thin.lost > 0, 'a barrier that breaks lets the Sear land');
}
{
  // Seep: out of reach, the sigils keep ticking, doubled.
  const { world, player, spawn } = setup({ placements: [place('target-out-of-reach', 'apprentice-seep')] });
  const hidden = spawn(430, 400);
  const open = spawn(470, 400);
  for (const m of [hidden, open]) {
    laySigils(world, player, m, 3, 6);
    getStatusEffect(m.tracksCombat, SIGIL)!.data['nextTickIn'] = 0;
  }
  attachComponent(world, hidden, 'isInvulnerable', {});
  step(world, player);
  updateDotArchetype(world, 100, clock);
  const lostHidden = hidden.hasHealth.maxHp - hidden.hasHealth.hp;
  const lostOpen = open.hasHealth.maxHp - open.hasHealth.hp;
  assert.ok(lostOpen > 0, 'the open enemy ticked');
  assert.equal(lostHidden, lostOpen * 2, 'Seep: the enemy out of reach ticks at double');
}
{
  // Snag: a fleeing or kiting enemy with a full bar is rooted.
  const { world, player, spawn, cap } = setup({ placements: [place('target-flees', 'apprentice-snag')] });
  const kiter = spawn(430, 400, 'test-apprentice-t2-kiter');
  setAggroTarget(world, kiter, { kind: 'player', id: 'apprentice' }, clock);
  attachComponent(world, kiter, 'isMoving', { motion: { vx: 0, vy: 0 } } as never);
  laySigils(world, player, kiter, cap - 1, cap);
  step(world, player, kiter);
  assert.ok(!monsterHasLiveRoot(kiter), 'short of a full bar there is no Snag');
  laySigils(world, player, kiter, 1, cap);
  step(world, player, kiter);
  assert.ok(monsterHasLiveRoot(kiter), 'a kiter with a full bar is rooted');
}
{
  // Recoil: when a slow lands on you, its caster catches a full bar.
  const { world, player, spawn, cap } = setup({ placements: [place('debuff-landed', 'apprentice-recoil')] });
  const caster = spawn(430, 400);
  setAggroTarget(world, caster, { kind: 'player', id: 'apprentice' }, clock);
  applyStatusEffect(player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 3000, sourceId: caster.isMonster.id, data: { totalMs: 3000 } });
  step(world, player, caster);
  step(world, player, caster);
  assert.equal(sigils(caster), cap, 'Recoil: the caster of a slow on you catches a full bar');
}

// ── T2 trophy ranks ──────────────────────────────────────────────────────────
{
  const spreadTo = (cleared: string[]): number => {
    const { world, player, spawn, cap } = setup({ relic: ['apprentice-relic-plains'], bossesCleared: cleared });
    const target = spawn(430, 400);
    const others = [spawn(460, 410), spawn(470, 380), spawn(480, 400), spawn(450, 430)];
    for (const m of [target, ...others]) setAggroTarget(world, m, { kind: 'player', id: 'apprentice' }, clock);
    laySigils(world, player, target, cap, cap);
    step(world, player, target);
    return others.reduce((n, m) => n + sigils(m), 0);
  };
  assert.equal(spreadTo(['plains:1']), 2, 'Outbreak: a Spread passes to two neighbours');
  assert.equal(spreadTo(['plains:1', 'plains:2']), 3, 'Outbreak II: to three');
}
{
  const { world, player, spawn, cap } = setup({ relic: ['apprentice-relic-forest'], bossesCleared: ['forest:1', 'forest:2'] });
  const target = spawn(430, 400);
  hit(world, player, target);
  assert.equal(sigils(target), Math.ceil(cap / 2), 'Firstbrand II: the first hit lays half a bar');
}
{
  const drained = (cleared: string[]): number => {
    const { world, player, spawn } = setup({ relic: ['apprentice-relic-swamp'], bossesCleared: cleared, placements: [place('hp-low', 'apprentice-siphon')] });
    const target = spawn(430, 400);
    const far = spawn(680, 400);
    laySigils(world, player, target, 3, 6);
    laySigils(world, player, far, 3, 6);
    player.hasHealth.hp = 1000;
    step(world, player, target);
    return 3 - sigils(far);
  };
  assert.equal(drained(['swamp:1']), 0, 'Glut: the drain reaches only near the target');
  assert.equal(drained(['swamp:1', 'swamp:2']), 3, 'Glut II: twice the reach');
}
{
  const { world, player } = setup({ relic: ['apprentice-relic-cave'], bossesCleared: ['cave:1', 'cave:2'] });
  assert.equal(trophyParam(payoffsOf(world, player)!, 'everyMs', 0), 1500, 'Brood Sigils II: one every 1.5 s');
}
{
  const tickLoss = (cleared: string[]): number => {
    const { world, player, spawn } = setup({ relic: ['apprentice-relic-mountain'], bossesCleared: cleared, placements: [place('target-full', 'apprentice-seize')] });
    const target = spawn(430, 400);
    const cap = payoffsOf(world, player)!.cap;
    laySigils(world, player, target, cap, cap);
    step(world, player, target);
    laySigils(world, player, target, 2, cap);
    getStatusEffect(target.tracksCombat, SIGIL)!.data['nextTickIn'] = 0;
    const hp = target.hasHealth.hp;
    updateDotArchetype(world, 100, clock);
    return hp - target.hasHealth.hp;
  };
  assert.ok(tickLoss(['mountain:1', 'mountain:2']) > tickLoss(['mountain:1']), 'Petrify II: the held enemy also takes more from your ticks');
}
{
  // Scent: sigils on a fleeing or kiting enemy never fall off and tick faster.
  const { world, player, spawn, cap } = setup({ relic: ['apprentice-relic-jungle'], bossesCleared: ['jungle:2'], placements: [] });
  const kiter = spawn(430, 400, 'test-apprentice-t2-kiter');
  setAggroTarget(world, kiter, { kind: 'player', id: 'apprentice' }, clock);
  attachComponent(world, kiter, 'isMoving', { motion: { vx: 0, vy: 0 } } as never);
  laySigils(world, player, kiter, 3, cap);
  const effect = getStatusEffect(kiter.tracksCombat, SIGIL)!;
  effect.remainingMs = 500;
  step(world, player, kiter);
  assert.ok(effect.remainingMs >= 3000, 'Scent: the sigils do not fall off while it runs');
  assert.ok(effect.data['tickIntervalMs']! < effect.data['baseTickMs']!, 'and tick faster');
}
{
  // Dune Wind: a Spread leaps any distance to an enemy carrying your sigils.
  const spreadFar = (relic: string[], cleared: string[]): number => {
    const { world, player, spawn, cap } = setup({ relic, bossesCleared: cleared });
    const target = spawn(430, 400);
    const near = spawn(460, 410);
    const far = spawn(900, 900);
    for (const m of [target, near, far]) setAggroTarget(world, m, { kind: 'player', id: 'apprentice' }, clock);
    laySigils(world, player, far, 1, cap);
    laySigils(world, player, target, cap, cap);
    // Fill the near neighbour, so only a far enemy can still take one.
    laySigils(world, player, near, cap, cap);
    step(world, player, target);
    return sigils(far);
  };
  assert.equal(spreadFar([], []), 1, 'without Dune Wind a Spread stays near');
  assert.equal(spreadFar(['apprentice-relic-desert'], ['desert:2']), 2, 'Dune Wind: the Spread leaps to a far carrier');
}

// ── Jungle and Desert gear ───────────────────────────────────────────────────
{
  const rod = ITEM_DATABASE.get('apprentice-stalkers-rod-t2')!;
  assert.equal(rod.mechanicEffects?.['apprentice.flee-tick'], 2, "Stalker's Rod carries its key");
  const staff = ITEM_DATABASE.get('apprentice-dune-staff-t2')!;
  assert.ok((staff.statModifiers.attackRange ?? 0) > 0 && (staff.mechanicEffects?.['apprentice.far-linger'] ?? 0) > 0, 'Dune Staff: longer reach and linger on far enemies');
  for (const base of ['jungle-vest-t2', 'jungle-charm-t2', 'desert-vest-t2', 'desert-charm-t2']) {
    const line = ITEM_DATABASE.get(base)?.classLines?.dot;
    assert.ok(line && Object.keys(line.effects).length > 0, `${base}: the Apprentice line has an effect`);
  }

  // Stalker's Rod: sigils on a kiting enemy tick double.
  const { world, player, spawn, cap } = setup({ passives: { 'apprentice.flee-tick': 2 }, placements: [] });
  const kiter = spawn(430, 400, 'test-apprentice-t2-kiter');
  setAggroTarget(world, kiter, { kind: 'player', id: 'apprentice' }, clock);
  attachComponent(world, kiter, 'isMoving', { motion: { vx: 0, vy: 0 } } as never);
  laySigils(world, player, kiter, 2, cap);
  step(world, player, kiter);
  const effect = getStatusEffect(kiter.tracksCombat, SIGIL)!;
  assert.equal(effect.data['tickIntervalMs'], effect.data['baseTickMs']! / 2, 'Stalker\'s Rod: double tick on a running enemy');

  // Dune Staff: sigils last longer on far enemies.
  const near = spawn(430, 430);
  const far = spawn(900, 900);
  player.usesSkills.passives['apprentice.far-linger'] = 0.5;
  laySigils(world, player, near, 1, cap);
  laySigils(world, player, far, 1, cap);
  assert.ok(getStatusEffect(far.tracksCombat, SIGIL)!.remainingMs > getStatusEffect(near.tracksCombat, SIGIL)!.remainingMs, 'sigils last longer on a far enemy');
}
{
  // Patient Hunter: Recovery doubles while every enemy within your reach carries your sigils.
  const { world, player, spawn, cap } = setup({ passives: { 'apprentice.patient-hunter': 2 }, placements: [] });
  const a = spawn(430, 400);
  const b = spawn(420, 410);
  laySigils(world, player, a, 1, cap);
  step(world, player);
  assert.equal(getResource(player.tracksCombat, 'apprentice.recoveryX'), 1, 'one enemy in reach carries none: no bonus');
  laySigils(world, player, b, 1, cap);
  step(world, player);
  assert.equal(getResource(player.tracksCombat, 'apprentice.recoveryX'), 2, 'every enemy in reach carries sigils: Recovery doubles');
}
{
  // Second Skin: the first hit each ambusher lands on you is a third weaker.
  const hitBy = (skin: number): number[] => {
    const { world, player, spawn } = setup({ passives: skin > 0 ? { 'apprentice.second-skin': skin } : {} });
    const def = MONSTER_DATABASE.get('test-apprentice-t2-dummy')!;
    MONSTER_DATABASE.set('test-apprentice-t2-ambusher', { ...def, id: 'test-apprentice-t2-ambusher', idleAnchor: 'jungle-bush' });
    const snake = spawn(430, 400, 'test-apprentice-t2-ambusher');
    const out: number[] = [];
    for (let i = 0; i < 2; i++) {
      const hp = player.hasHealth.hp;
      clock += 5_000;
      runMonsterAttack(world, snake, player, clock);
      out.push(hp - player.hasHealth.hp);
    }
    return out;
  };
  const plain = hitBy(0);
  const skinned = hitBy(0.33);
  assert.ok(skinned[0]! < plain[0]!, 'Second Skin: the first ambush hit is weaker');
  assert.equal(skinned[1], plain[1], 'and only the first');
}
{
  // Sun-Ward and Cool Draught: the Desert's debuffs.
  const { world, player, spawn, cap } = setup({ passives: { 'apprentice.sun-ward': 0.1, 'apprentice.cool-draught': 0.03 }, placements: [] });
  const caster = spawn(430, 400);
  for (const m of [caster, spawn(450, 400)]) laySigils(world, player, m, 1, cap);
  applyStatusEffect(player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 3000, sourceId: caster.isMonster.id, data: { totalMs: 3000 } });
  step(world, player);
  const slow = getStatusEffect(player.tracksCombat, 'slow')!;
  assert.ok(slow.remainingMs < 3000, 'Sun-Ward: a slow landing on you is shorter for each enemy carrying your sigils');
  player.hasHealth.hp = 5000;
  slow.remainingMs = 0;
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter((e) => e.id !== 'slow');
  step(world, player);
  assert.ok(player.hasHealth.hp > 5000, 'Cool Draught: a slow ending on you heals you');
}

console.log('apprenticeT2: ok');
