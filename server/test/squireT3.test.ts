/**
 * The Squire at tier 3 (T3-SQUIRE; bible §8.6, §8.9, §8.16): the T3 lessons answer their
 * moments, Guard II keeps its brace for a second blow, the nine specializations bend Resolve and
 * the slam, Deep Winter and Kindling and the later rank-ups do their twists, and the Tundra and
 * Volcanic gear jobs do what their lines say. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getStatusEffect,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  SQUIRE_KIT,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
  type ResponsesConfig,
} from '@mmo-idle/shared';
import { SQUIRE_GEAR } from '../../shared/src/data/classGear/squire';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent, detachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import {
  addResolve,
  SQUIRE_FROSTWARD_EFFECT_ID,
  SQUIRE_GUARD_EFFECT_ID,
  SQUIRE_RAMPAGE_EFFECT_ID,
  updateSquire,
} from '../src/systems/classes/archetypes/cooldown/squire';
import { pullPlayer, pushPlayer } from '../src/systems/combat/damage/forcedMovement';
import { attackHastePct } from '../src/systems/combat/engine/attackCadence';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { beginCharge } from '../src/systems/combat/engine/monsterMechanics';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { STUN_EFFECT, applyStun } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
const dummy = (id: string, extra: Record<string, unknown> = {}) => {
  MONSTER_DATABASE.set(id, { ...base, id, evasion: 0, ...extra } as never);
};
dummy('test-squire-t3-dummy', { chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 } });
dummy('test-squire-t3-pusher', { chargedAttack: { name: 'Test Ram', castMs: 3000, cooldownMs: 60_000, multiplier: 2, knockback: { distance: 180 } } });
dummy('test-squire-t3-kiter', { behavior: 'kiter' });
dummy('test-squire-t3-fire', { attackStyle: 'fire-spit', behavior: 'ranged' });

let clock = 100_000;
// Level 14 in a biome is its tier 3 segment's second level: every T2 and T3 lesson of it.
const T3 = {
  plains: 8, forest: 8, swamp: 14, mountain: 14, cave: 14, jungle: 14, desert: 14, tundra: 4, volcanic: 4,
};

function setup(opts: {
  relic?: string[];
  bossesCleared?: string[];
  disciplineId?: string;
  specializationId?: string;
  biomes?: Record<string, number>;
  rules?: string[];
  passives?: Record<string, number>;
} = {}) {
  const world = new World();
  const biomes = opts.biomes ?? T3;
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'squire', name: 'Squire' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 3, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cooldown-root'], passives: {}, selectedClass: 'cooldown-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cooldown',
      disciplineId: opts.disciplineId ?? null, specializationId: opts.specializationId ?? null,
    },
  } as PersistedPlayerSlices, 'squire');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  const ctx = classConfigContextFromState({
    combatArchetype: 'cooldown', biomeLevel: biomes, bossesCleared: opts.bossesCleared ?? [], disciplineId: opts.disciplineId ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'responses' && opts.rules) {
    const only = new Set(opts.rules);
    (config.system as ResponsesConfig).rules = config.system.rules.filter((rule) => only.has(rule.pieceId));
  }
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  const spawnType = (typeId: string, x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, typeId, { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    m.performsAttack.attackRange = 30;
    return m;
  };
  const spawn = (x: number, y: number) => spawnType('test-squire-t3-dummy', x, y);
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  step(world, player, 0);
  return { world, player, target, spawn, spawnType, ctx };
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

const dist = (a: { hasPosition: { current: { x: number; y: number } } }, b: { hasPosition: { current: { x: number; y: number } } }) =>
  Math.hypot(a.hasPosition.current.x - b.hasPosition.current.x, a.hasPosition.current.y - b.hasPosition.current.y);

function swing(world: World, player: PlayerEntity, target: MonsterEntity): void {
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'squire', kind: 'player' } });
}

// 1. The T3 lessons: Anchor, Chain Hook, Frostward and Backdraft arrive, Guard and Challenge rank up.
{
  const { ctx } = setup({ rules: [] });
  for (const id of ['squire-anchor', 'squire-chain-hook', 'squire-frostward', 'squire-backdraft']) {
    assert.equal(ctx.pieceRanks.get(id), 1, `${id} is learned at T3`);
  }
  assert.equal(ctx.pieceRanks.get('squire-guard'), 2, 'Guard II at T3');
  assert.equal(ctx.pieceRanks.get('squire-challenge'), 2, 'Challenge II at T3');
  assert.equal(ctx.pieceRanks.get('squire-earthstamp'), 2, 'Earthstamp II at T3');
}

// 2. Guard II: after a catch the brace stays up for a second telegraphed blow.
{
  const caught = (biomes: Record<string, number>): { left: number; second: number } => {
    const { world, player, target } = setup({ rules: ['squire-guard'], biomes });
    engage(world, player, target);
    addResolve(world, player, 3);
    beginCharge(target, clock, 3000);
    step(world, player);
    assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'the Squire braces');
    target.dealsDamage.attack = 1000;
    runMonsterAttack(world, target, player, clock, 2);
    const left = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID)?.remainingMs ?? 0;
    const hp = player.hasHealth.hp;
    beginCharge(target, clock, 3000);
    runMonsterAttack(world, target, player, clock, 2);
    return { left, second: hp - player.hasHealth.hp };
  };
  const one = caught({ ...T3, mountain: 8 });
  const two = caught(T3);
  assert.equal(one.left, 0, 'Guard I is spent by the first blow');
  assert(two.left > 0, 'Guard II stays up for a second blow');
  assert(two.second < one.second * 0.6, `and catches it (${two.second} vs ${one.second})`);
}

// 3. Anchor: a push or a drag aimed at you plants your feet; the move does nothing.
{
  const { world, player, spawnType } = setup({ rules: ['squire-anchor'] });
  const ram = spawnType('test-squire-t3-pusher', 470, 400);
  engage(world, player, ram);
  addResolve(world, player, 2);
  beginCharge(ram, clock, 3000);
  step(world, player);
  const brace = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
  assert(brace && brace.data['knockbackResistPct'] === 1, 'Anchor plants the Squire against the ram');
  const at = { ...player.hasPosition.current };
  pushPlayer(world, player, ram.hasPosition.current, 180);
  assert.deepEqual(player.hasPosition.current, at, 'the push does not move you');
  assert.equal(pullPlayer(world, player, { x: 900, y: 400 }, 200), null, 'nor does a drag');
  assert(player.usesCooldown!.resolve < 2, 'Anchor spent Resolve');

  // The ram lands: the brace holds one moment after the blow, so the push that follows is resisted.
  ram.dealsDamage.attack = 1000;
  runMonsterAttack(world, ram, player, clock, 2);
  const filled = player.usesCooldown!.resolve;
  assert(filled > 1, `catching the blow refunds Resolve (${filled})`);
  pushPlayer(world, player, ram.hasPosition.current, 180);
  assert.deepEqual(player.hasPosition.current, at, 'the push that goes with the blow is resisted too');

  const free = setup({ rules: [] });
  const freeRam = free.spawnType('test-squire-t3-pusher', 470, 400);
  const home = { ...free.player.hasPosition.current };
  pushPlayer(free.world, free.player, freeRam.hasPosition.current, 180);
  assert(free.player.hasPosition.current.x < home.x, 'without Anchor the same push moves you');
}
{
  // A boss pattern's pull step (Mire Lash) is read before it lands.
  const { world, player, spawnType } = setup({ rules: ['squire-anchor'] });
  const boss = spawnType('mire-gorged-behemoth', 600, 400);
  engage(world, player, boss);
  attachComponent(world, boss, 'runsBossPattern', {
    patternId: 'mire-lash', stepIndex: 2, stepEndsAtMs: clock + 1200, stepStarted: true, targetId: 'squire', skippedStepIndexes: [],
  } as never);
  addResolve(world, player, 2);
  step(world, player);
  assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'Anchor answers the Mire Lash drag');
  const at = { ...player.hasPosition.current };
  pullPlayer(world, player, boss.hasPosition.current, 200);
  assert.deepEqual(player.hasPosition.current, at, 'and you are not dragged');
}

// 4. Chain Hook: a fleeing or kiting target is hooked and dragged back.
{
  const { world, player, spawnType } = setup({ rules: ['squire-chain-hook'] });
  const kiter = spawnType('test-squire-t3-kiter', 640, 400);
  engage(world, player, kiter);
  attachComponent(world, kiter, 'isMoving', {} as never);
  setAttackTarget(world, player, kiter.isMonster.id);
  addResolve(world, player, 2);
  step(world, player);
  assert(dist(kiter, player) < 120, `the kiter is hooked back (${dist(kiter, player)})`);
}

// 5. Frostward: the Chill is held under the Deep Freeze gate; Hearth heals while it holds.
{
  const { world, player } = setup({ rules: ['squire-frostward'], passives: { 'squire.frostward-heal-pct': 0.01 } });
  const chill = applyStatusEffect(player.tracksCombat, { id: TUNDRA_CHILL_EFFECT_ID, maxStacks: 6, remainingMs: -1, refreshable: true, sourceId: 'room', data: {} });
  chill.stacks = 3;
  addResolve(world, player, 2);
  player.hasHealth.hp = 5000;
  step(world, player);
  assert(getStatusEffect(player.tracksCombat, SQUIRE_FROSTWARD_EFFECT_ID), 'Frostward holds');
  chill.stacks = 5;
  step(world, player);
  assert.equal(chill.stacks, 3, 'the Chill cannot climb past the hold');
  assert(player.hasHealth.hp > 5000, 'Hearth heals while Frostward holds');
}

// 6. Backdraft: a fire attack is thrown back at its source; Cooling Breath heals.
{
  const { world, player, spawnType } = setup({ rules: ['squire-backdraft'], passives: { 'squire.backdraft-heal-pct': 0.01 } });
  const imp = spawnType('test-squire-t3-fire', 600, 400);
  imp.dealsDamage.attack = 100;
  engage(world, player, imp);
  step(world, player); // the real `fire-attack` moment reads this tick's fight snapshot
  addResolve(world, player, 2);
  player.hasHealth.hp = 5000;
  const hp = imp.hasHealth.hp;
  runMonsterAttack(world, imp, player, clock);
  assert(imp.hasHealth.hp < hp, 'the heat is thrown back at its source');
  assert(player.hasHealth.hp > 5000 - 100, 'Cooling Breath heals');
  const cool = player.hasHealth.hp;
  runMonsterAttack(world, imp, player, clock);
  assert(imp.hasHealth.hp < hp && player.hasHealth.hp <= cool, 'a second shot inside the cooldown is not answered again');

  const plain = setup({ rules: ['squire-backdraft'] });
  const rat = plain.spawn(430, 420);
  engage(plain.world, plain.player, rat);
  step(plain.world, plain.player);
  addResolve(plain.world, plain.player, 2);
  const ratHp = rat.hasHealth.hp;
  runMonsterAttack(plain.world, rat, plain.player, clock);
  assert.equal(rat.hasHealth.hp, ratHp, 'a plain attack is not a fire attack');
}

// 7. Rank-ups: Rot-Eater III, Faultline III, Corrode III.
{
  const rank = (id: string, cleared: string[]): number => setup({ relic: [id], bossesCleared: cleared, rules: [] }).ctx.trophyRanks.get(id) ?? 0;
  assert.equal(rank('squire-relic-swamp', ['swamp:1', 'swamp:2', 'swamp:3']), 3, 'Rot-Eater III');
  assert.equal(rank('squire-relic-mountain', ['mountain:1', 'mountain:2', 'mountain:3']), 3, 'Faultline III');
  assert.equal(rank('squire-relic-cave', ['cave:1', 'cave:2', 'cave:3']), 3, 'Corrode III');
  assert.equal(rank('squire-relic-jungle', ['jungle:2', 'jungle:3']), 2, 'Strangler Vine II');
  assert.equal(rank('squire-relic-desert', ['desert:2', 'desert:3']), 2, "Executioner's Oath II");
}
{
  // Faultline III: the line runs longer (380 px reaches a second target the II line misses).
  const reach = (cleared: string[]): boolean => {
    const { world, player, target, spawn } = setup({ relic: ['squire-relic-mountain'], bossesCleared: cleared, rules: [] });
    const far = spawn(800, 400);
    engage(world, player, far);
    addResolve(world, player, 100);
    step(world, player);
    const hp = far.hasHealth.hp;
    swing(world, player, target);
    return far.hasHealth.hp < hp;
  };
  assert(!reach(['mountain:1', 'mountain:2']), 'the II line stops short');
  assert(reach(['mountain:1', 'mountain:2', 'mountain:3']), 'the III line reaches it');
}
{
  const { world, player, target } = setup({ relic: ['squire-relic-cave'], bossesCleared: ['cave:1', 'cave:2', 'cave:3'], rules: [] });
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  assert.equal(getStatusEffect(target.tracksCombat, 'plating-shred')?.maxStacks, 10, 'Corrode III: a higher stack cap');
}

// 8. Deep Winter: the bar fills past full, and an overfull slam hits as hard as two.
{
  const slam = (relic: string[] | undefined, cleared: string[], fill: number): { max: number; damage: number } => {
    const { world, player, target } = setup({ relic, bossesCleared: cleared, rules: [] });
    const max = player.usesCooldown!.resolveMax;
    step(world, player);
    addResolve(world, player, fill);
    step(world, player);
    const hp = target.hasHealth.hp;
    swing(world, player, target);
    return { max, damage: hp - target.hasHealth.hp };
  };
  const plain = slam(undefined, [], 100);
  const winter = slam(['squire-relic-tundra'], ['tundra:3'], 100);
  const winter2 = slam(['squire-relic-tundra'], ['tundra:3', 'tundra:4'], 100);
  assert(winter.max >= plain.max * 2 - 1e-9, `the bar holds double (${winter.max} vs ${plain.max})`);
  assert(winter2.max >= plain.max * 3 - 1e-9, 'rank 2 holds triple');
  assert(winter.damage > plain.damage * 1.7, `an overfull slam hits as hard as two (${winter.damage} vs ${plain.damage})`);
}

// 9. Kindling: gains fill more the longer the fight has lasted.
{
  const gain = (ticks: number, cleared: string[]): number => {
    const { world, player, target } = setup({ relic: ['squire-relic-volcanic'], bossesCleared: cleared, rules: [] });
    engage(world, player, target);
    for (let i = 0; i < ticks; i++) step(world, player);
    const before = player.usesCooldown!.resolve;
    addResolve(world, player, 0.5);
    return player.usesCooldown!.resolve - before;
  };
  const early = gain(2, ['volcanic:3']);
  const late = gain(150, ['volcanic:3']);
  assert(late > early * 1.05, `a long fight fills more (${late} vs ${early})`);
  assert(gain(150, ['volcanic:3', 'volcanic:4']) > late, 'Kindling II grows faster');
}

// 10. Reverb (Bulwark): the slam rings out again, at half strength, a few seconds later.
{
  const { world, player, target } = setup({ disciplineId: 'squire-bulwark', specializationId: 'squire-reverb', rules: [] });
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  const after = target.hasHealth.hp;
  step(world, player, 1000);
  assert.equal(target.hasHealth.hp, after, 'nothing yet');
  step(world, player, 3000);
  assert(target.hasHealth.hp < after, 'the echo lands later');
}

// 11. Bastion (Bulwark): each enemy on you widens the bar, up to double; a boss counts as several.
{
  const { world, player, spawn } = setup({ disciplineId: 'squire-bulwark', specializationId: 'squire-bastion', rules: [] });
  const budget = player.usesCooldown!.resolveMax;
  for (let i = 0; i < 3; i++) engage(world, player, spawn(380 + i * 10, 420));
  step(world, player);
  assert.equal(player.usesCooldown!.resolveMax, budget + 3, 'three enemies, three pips');
  for (let i = 0; i < 10; i++) engage(world, player, spawn(380 + i * 10, 440));
  step(world, player);
  assert(player.usesCooldown!.resolveMax <= budget * 2 + 1e-9, 'never more than double');
  assert.equal(player.usesCooldown!.resolveMax, budget * 2, 'and it reaches double');
}

// 12. Consecrate (Bulwark): the slam goes on as a channel; nothing can move you.
{
  const { world, player, target } = setup({ disciplineId: 'squire-bulwark', specializationId: 'squire-consecrate', rules: [] });
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  const after = target.hasHealth.hp;
  step(world, player, 600);
  assert(target.hasHealth.hp < after, 'the circle is struck again');
  const at = { ...player.hasPosition.current };
  pushPlayer(world, player, target.hasPosition.current, 180);
  assert.deepEqual(player.hasPosition.current, at, 'nothing moves you while it lasts');
  const mid = target.hasHealth.hp;
  step(world, player, 600);
  assert(target.hasHealth.hp < mid, 'again and again');
  step(world, player, 5000);
  const done = target.hasHealth.hp;
  step(world, player, 1000);
  assert.equal(target.hasHealth.hp, done, 'then the channel ends');
}

// 13. Measure for Measure (Avenger): a counter returns a capped share of what its answer stopped.
{
  const counter = (spec: string | undefined, blow: number): number => {
    const { world, player, target } = setup({ disciplineId: 'squire-avenger', specializationId: spec, rules: ['squire-guard'] });
    engage(world, player, target);
    addResolve(world, player, 3);
    beginCharge(target, clock, 3000);
    step(world, player);
    target.dealsDamage.attack = blow;
    const hp = target.hasHealth.hp;
    runMonsterAttack(world, target, player, clock, 2);
    return hp - target.hasHealth.hp;
  };
  const plain = counter(undefined, 20);
  const small = counter('squire-measure-for-measure', 20);
  const big = counter('squire-measure-for-measure', 40);
  assert(plain > 0, 'the Avenger counters a caught blow');
  assert(small > plain, `the counter returns part of the blow (${small} vs ${plain})`);
  assert(big > small, 'the bigger the blow, the harder it hits back');
  const capped = counter('squire-measure-for-measure', 500_000);
  assert.equal(counter('squire-measure-for-measure', 1_000_000), capped, 'past the cap, a bigger blow adds nothing');
  assert(capped < 500_000 * 0.5, 'but it is capped');
}

// 14. Second Nature (Avenger): after a counter lands, answers cost nothing for a few seconds.
{
  const second = (spec: string | undefined): number => {
    const { world, player, target } = setup({ disciplineId: 'squire-avenger', specializationId: spec, rules: ['squire-shield-bash', 'squire-unshaken'] });
    engage(world, player, target);
    addResolve(world, player, 3);
    step(world, player);
    // One tick: the bash lands (a counter), and the stun on you is broken by the next answer in the list.
    applyStun(player.tracksCombat, 3000, 'mob');
    beginCharge(target, clock, 3000);
    const before = player.usesCooldown!.resolve;
    step(world, player);
    assert(getStatusEffect(target.tracksCombat, STUN_EFFECT), 'the bash lands');
    assert(!getStatusEffect(player.tracksCombat, STUN_EFFECT), 'and the stun on you is broken');
    return player.usesCooldown!.resolve - before;
  };
  assert(second('squire-second-nature') > second(undefined) + 0.4, 'the answer inside the window costs nothing');
}

// 15. Sunderer (Avenger): counters ignore plating and hit a raised barrier harder.
{
  const counter = (spec: string | undefined): number => {
    const { world, player, target } = setup({ disciplineId: 'squire-avenger', specializationId: spec, rules: ['squire-guard'] });
    target.mitigatesDamage.plating = 40;
    target.dealsDamage.attack = 1000;
    engage(world, player, target);
    addResolve(world, player, 3);
    beginCharge(target, clock, 3000);
    step(world, player);
    const hp = target.hasHealth.hp;
    runMonsterAttack(world, target, player, clock, 2);
    assert.equal(target.mitigatesDamage.plating, 40, 'the plating is back after the blow');
    return hp - target.hasHealth.hp;
  };
  assert(counter('squire-sunderer') > counter(undefined), 'a Sunderer counter ignores plating');
}

// 16. Destroyer (Juggernaut): the armed slam crashes into a target out of reach.
{
  const { world, player, target } = setup({ disciplineId: 'squire-juggernaut', specializationId: 'squire-destroyer', rules: [] });
  target.hasPosition.current = { x: 700, y: 400 };
  addResolve(world, player, 100);
  step(world, player);
  assert(isEmpoweredAttack(player), 'the slam is armed');
  assert(dist(target, player) < 300, `you crash in (${dist(target, player)})`);
  const far = setup({ disciplineId: 'squire-juggernaut', rules: [] });
  far.target.hasPosition.current = { x: 700, y: 400 };
  addResolve(far.world, far.player, 100);
  step(far.world, far.player);
  assert(dist(far.target, far.player) >= 300, 'without Destroyer you stay put');
}

// 17. Inexorable (Juggernaut): the bulk fills the bar while you walk and between fights.
{
  const fill = (spec: string | undefined): number => {
    const { world, player } = setup({ disciplineId: 'squire-juggernaut', specializationId: spec, rules: [] });
    detachComponent(world, player, 'hasAttackTarget');
    player.mitigatesDamage.plating = 100;
    const before = player.usesCooldown!.resolve;
    step(world, player, 1000);
    return player.usesCooldown!.resolve - before;
  };
  assert(fill('squire-inexorable') > fill(undefined) * 2, 'out of combat the bar fills much faster');
}

// 18. Rampage (Juggernaut): each slam starts a burst of faster swings.
{
  const { world, player, target } = setup({ disciplineId: 'squire-juggernaut', specializationId: 'squire-rampage', rules: [] });
  addResolve(world, player, 100);
  step(world, player);
  assert.equal(attackHastePct(player.tracksCombat), 0, 'no haste before the slam');
  swing(world, player, target);
  assert(getStatusEffect(player.tracksCombat, SQUIRE_RAMPAGE_EFFECT_ID), 'the slam starts the burst');
  assert(attackHastePct(player.tracksCombat) > 0, 'your swings are faster');
}

// 19. The Tundra and Volcanic gear: Glacier Mace, Forge Hammer, Frozen Resolve, Stoked.
{
  const { world, player, target } = setup({ rules: [], passives: { 'squire.slam-frost-px': 200, 'squire.slam-frost-slow-pct': 0.4, 'squire.slam-frost-ms': 3000 } });
  const bystander = world.createMonster(NODE, 'test-squire-t3-dummy', { x: 380, y: 440 })!;
  bystander.hasHealth.hp = bystander.hasHealth.maxHp = 100_000;
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  step(world, player);
  assert(getStatusEffect(bystander.tracksCombat, 'ability-slowed'), 'the frozen ground slows what stands on it');
  bystander.hasPosition.current = { x: 1500, y: 1500 };
  step(world, player, 4000);
}
{
  const hit = (passives: Record<string, number>, heat: number): number => {
    const { world, player, target } = setup({ rules: [], passives });
    if (heat > 0) {
      const effect = applyStatusEffect(player.tracksCombat, { id: VOLCANIC_HEAT_EFFECT_ID, maxStacks: 0, remainingMs: -1, refreshable: true, sourceId: 'room', data: {} });
      effect.stacks = heat;
    }
    addResolve(world, player, 100);
    step(world, player);
    const hp = target.hasHealth.hp;
    swing(world, player, target);
    return hp - target.hasHealth.hp;
  };
  assert(hit({ 'squire.slam-heat-pct': 0.05 }, 10) > hit({ 'squire.slam-heat-pct': 0.05 }, 0) * 1.3, 'Forge Hammer: Heat makes the slam bigger');
}
{
  const { world, player } = setup({ rules: [], passives: { 'squire.chill-fill-pips': 0.5 } });
  const chill = applyStatusEffect(player.tracksCombat, { id: TUNDRA_CHILL_EFFECT_ID, maxStacks: 6, remainingMs: -1, refreshable: true, sourceId: 'room', data: {} });
  step(world, player);
  const before = player.usesCooldown!.resolve;
  chill.stacks = 3;
  step(world, player);
  assert(player.usesCooldown!.resolve > before, 'Frozen Resolve: the Chill building on you fills Resolve');
}
{
  const fill = (passives: Record<string, number>): number => {
    const { world, player, target } = setup({ rules: [], passives });
    const heat = applyStatusEffect(player.tracksCombat, {
      id: VOLCANIC_HEAT_EFFECT_ID, maxStacks: 0, remainingMs: -1, refreshable: true, sourceId: 'room', data: { damageTakenPct: 0.05 },
    });
    heat.stacks = 10;
    target.dealsDamage.attack = 2500;
    runMonsterAttack(world, target, player, clock);
    return player.usesCooldown!.resolve;
  };
  assert(fill({ 'squire.heat-fill-x': 3 }) > fill({}) * 1.1, "Stoked: the Heat's extra damage fills extra Resolve");
}

// 20. Every Tundra and Volcanic gear job is wired (no empty effects), and the moved jobs recur.
{
  for (const weapon of SQUIRE_GEAR.weapons) {
    if (!['tundra', 'volcanic'].includes(weapon.recipeGroup) || weapon.tier < 3) continue;
    assert(Object.keys(weapon.mechanicEffects ?? {}).length > 0, `${weapon.id} has a job`);
  }
  for (const [key, line] of Object.entries(SQUIRE_GEAR.lines)) {
    if (!/^(tundra|volcanic)-(vest|charm)-t[34]$/.test(key)) continue;
    assert(Object.keys(line.effects).length > 0, `${key} (${line.name}) has an effect`);
  }
  for (const [key, line] of Object.entries(SQUIRE_GEAR.movedLines ?? {})) {
    if (/^(jungle|volcanic)-/.test(key)) assert(Object.keys(line.effects).length > 0, `moved ${key} has an effect`);
  }
  for (const id of ['squire-arming-sword-t3', 'squire-flanged-mace-t3', 'squire-glacier-mace-t3', 'squire-forge-hammer-t3']) {
    assert(ITEM_DATABASE.get(id) || SQUIRE_GEAR.weapons.some((weapon) => weapon.id === id), `${id} exists`);
  }
  // Every specialization has its numbers.
  for (const entry of SQUIRE_KIT.specializations) assert(Object.keys(entry.params).length > 0, `${entry.id} has params`);
}

console.log('squireT3.test.ts: ok');
