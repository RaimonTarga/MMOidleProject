/**
 * The Squire at tier 2 (T2-SQUIRE; bible §8.5, §8.8, §8.9, §8.16): the T2 lessons answer their
 * moments, the three disciplines tilt Resolve and the slam and bring their pieces, Last
 * Breath heals, the T2 trophies and their rank-ups twist the slam or the flow, and the Jungle
 * and Desert gear jobs do what their lines say. Wiring only: placeholders, no balance.
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
import { addResolve, SQUIRE_GUARD_EFFECT_ID, SQUIRE_PARRY_EFFECT_ID, updateSquire } from '../src/systems/classes/archetypes/cooldown/squire';
import { performAmbushLunge } from '../src/systems/combat/ai/ambushLunge';
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
MONSTER_DATABASE.set('test-squire-t2-dummy', {
  ...base, id: 'test-squire-t2-dummy', evasion: 0,
  chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 },
});

let clock = 100_000;
// Level 14 in a biome is its tier 3 segment's second level: every T2 and T3 lesson of it.
const T2 = { plains: 8, forest: 8, swamp: 8, mountain: 8, cave: 8, jungle: 8, desert: 8 };
const T3 = { ...T2, mountain: 14, cave: 14, desert: 14, swamp: 14 };

function setup(opts: {
  relic?: string[];
  bossesCleared?: string[];
  disciplineId?: string;
  biomes?: Record<string, number>;
  rules?: string[];
  passives?: Record<string, number>;
} = {}) {
  const world = new World();
  const biomes = opts.biomes ?? T2;
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'squire', name: 'Squire' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 2, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cooldown-root'], passives: {}, selectedClass: 'cooldown-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cooldown', disciplineId: opts.disciplineId ?? null,
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
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-squire-t2-dummy', { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    m.performsAttack.attackRange = 30;
    return m;
  };
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  step(world, player, 0);
  return { world, player, target, spawn };
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

// 1. Stand Fast: a charge at you stops dead and the charger staggers.
{
  const { world, player, target } = setup({ rules: ['squire-stand-fast'] });
  engage(world, player, target);
  addResolve(world, player, 2);
  target.controlsMonster.chargeRemainingMs = 500;
  const before = player.usesCooldown!.resolve;
  step(world, player);
  assert.equal(target.controlsMonster.chargeRemainingMs, 0, 'the charge stops dead');
  assert(getStatusEffect(target.tracksCombat, STUN_EFFECT), 'the charger staggers');
  assert(player.usesCooldown!.resolve > before, 'a landed Stand Fast refunds more than it cost');
}

// 2. Unshaken: a stun on you is broken.
{
  const { world, player } = setup({ rules: ['squire-unshaken'] });
  addResolve(world, player, 2);
  applyStun(player.tracksCombat, 3000, 'mob');
  step(world, player);
  assert(!getStatusEffect(player.tracksCombat, STUN_EFFECT), 'the stun is broken');
}

// 3. Splitting Blow: a raised barrier is hit double; rank 2 breaks it in one blow.
{
  const plain = setup({ rules: [] });
  const hp0 = plain.target.hasHealth.hp;
  swing(plain.world, plain.player, plain.target);
  const plainDamage = hp0 - plain.target.hasHealth.hp;
  assert(plainDamage > 0, 'a plain swing lands');

  const { world, player, target } = setup({ rules: ['squire-splitting-blow'] });
  engage(world, player, target);
  addResolve(world, player, 2);
  target.hasStatus.enemyBarrier = { amount: 50, maxAmount: 50, remainingMs: 5000, totalMs: 5000 };
  const hp = target.hasHealth.hp;
  step(world, player);
  const blow = hp - target.hasHealth.hp;
  assert(blow > plainDamage * 1.5, `the blow hits the barrier double (${blow} vs ${plainDamage})`);
  assert(!isEmpoweredAttack(player), 'it did not spend the slam');

  const second = setup({ rules: ['squire-splitting-blow'], biomes: { ...T2, tundra: 20 } });
  engage(second.world, second.player, second.target);
  addResolve(second.world, second.player, 2);
  second.target.hasStatus.enemyBarrier = { amount: 5000, maxAmount: 5000, remainingMs: 5000, totalMs: 5000 };
  const hp2 = second.target.hasHealth.hp;
  step(second.world, second.player);
  assert(hp2 - second.target.hasHealth.hp >= 5000, 'rank 2 deals enough to break the barrier in one blow');
}

// 4. Earthstamp: a burrower surfaces at your feet, staggered; rank 2 knocks down what is around.
{
  const { world, player, target, spawn } = setup({ rules: ['squire-earthstamp'], biomes: T3 });
  const bystander = spawn(450, 420);
  engage(world, player, target);
  attachComponent(world, target, 'isConcealed', { targetable: false } as never);
  attachComponent(world, target, 'isMoving', {} as never);
  target.hasPosition.current = { x: 700, y: 400 };
  addResolve(world, player, 2);
  step(world, player);
  assert(target.isConcealed === undefined, 'the burrower surfaces');
  assert(dist(target, player) < 120, `at your feet (${dist(target, player)})`);
  assert(getStatusEffect(target.tracksCombat, STUN_EFFECT), 'staggered');
  assert(getStatusEffect(bystander.tracksCombat, STUN_EFFECT), 'rank 2 knocks down what is around it');
}

// 5. Watchful: an ambusher's first hit is caught at no cost and fills Resolve; Unflinching
//    holds its stun off; Watchman's Ease heals the hit it stopped.
{
  const { world, player, target } = setup({
    rules: ['squire-watchful'],
    passives: { 'squire.ambush-steadfast': 1, 'squire.watchful-heal-pct': 1 },
  });
  engage(world, player, target);
  target.dealsDamage.attack = 1000;
  player.hasHealth.hp = 5000;
  const resolve = player.usesCooldown!.resolve;
  target.hasPosition.current = { x: 700, y: 400 };
  performAmbushLunge(world, target, player);
  runMonsterAttack(world, target, player, clock, 1, undefined, undefined, false, 'Pounce');
  const taken = 5000 - player.hasHealth.hp;
  assert(taken < 400, `the ambush is caught (${taken})`);
  assert(player.usesCooldown!.resolve > resolve, 'catching it fills Resolve');
  assert(getStatusEffect(player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID), 'Unflinching: the ambush cannot stun you');
}

// 6. Challenge: a shooter is pulled onto you; rank 2 roots it; Called Out heals.
{
  const { world, player, spawn } = setup({ rules: ['squire-challenge'], biomes: T3, passives: { 'squire.challenge-heal-pct': 0.01 } });
  const archer = spawn(750, 400);
  archer.performsAttack.attackRange = 300;
  engage(world, player, archer);
  setAttackTarget(world, player, archer.isMonster.id);
  addResolve(world, player, 2);
  player.hasHealth.hp = 5000;
  step(world, player);
  assert(dist(archer, player) < 120, `the shooter is pulled onto you (${dist(archer, player)})`);
  assert(archer.isRooted !== undefined, 'rank 2: it cannot move away');
  assert(player.hasHealth.hp > 5000, 'Called Out heals');
}

// 7. Parry (Avenger): a telegraphed melee blow is negated and countered at once.
{
  const { world, player, target } = setup({ disciplineId: 'squire-avenger', rules: ['squire-parry', 'squire-guard'] });
  assert(player.usesCooldown!.resolveMax > 0, 'the Avenger has a bar');
  engage(world, player, target);
  addResolve(world, player, 3);
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(getStatusEffect(player.tracksCombat, SQUIRE_PARRY_EFFECT_ID), 'the Squire parries');
  assert(!getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'and does not also brace');
  target.dealsDamage.attack = 1000;
  const hp = player.hasHealth.hp;
  const targetHp = target.hasHealth.hp;
  runMonsterAttack(world, target, player, clock, 2);
  assert.equal(player.hasHealth.hp, hp, 'the blow is negated');
  assert(target.hasHealth.hp < targetHp, 'and countered at once');
  assert(!getStatusEffect(player.tracksCombat, SQUIRE_PARRY_EFFECT_ID), 'the parry is spent');
}

// 8. Avenger tilts: a landed answer is followed by a counter paid from Resolve.
{
  const { world, player, target } = setup({ disciplineId: 'squire-avenger', rules: ['squire-shield-bash'] });
  engage(world, player, target);
  addResolve(world, player, 2);
  step(world, player);
  const targetHp = target.hasHealth.hp;
  beginCharge(target, clock, 3000);
  step(world, player);
  assert(getStatusEffect(target.tracksCombat, STUN_EFFECT), 'the bash lands');
  assert(target.hasHealth.hp < targetHp, 'the Avenger follows it with a counter');
}

// 9. Intercept (Bulwark): the enemies on a threatened ally turn on you and you brace.
{
  const { world, player, spawn } = setup({ disciplineId: 'squire-bulwark', rules: ['squire-intercept'] });
  const ally = world.attachPlayerEntity({
    isPlayer: { id: 'ally', name: 'ally' },
    hasPosition: { current: { x: 500, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 100, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 2, currentSkillTier: 0, bossesCleared: [], clearedNodes: [], runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  } as PersistedPlayerSlices, 'ally');
  const party = { leaderId: 'squire', members: [{ id: 'squire', name: 'Squire' }, { id: 'ally', name: 'ally' }] } as never;
  attachComponent(world, player, 'inParty', party);
  attachComponent(world, ally, 'inParty', party);
  const attacker = spawn(520, 400);
  setAggroTarget(world, attacker, { id: 'ally', kind: 'player' }, clock);
  addResolve(world, player, 3);
  step(world, player);
  assert.equal(attacker.hasAggroTarget?.targetId, 'squire', 'the enemy turns on you');
  assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'and you brace for it');
}

// 10. Unbowed (Juggernaut): a big untelegraphed blow is taken on the armor, plating twice.
{
  const hit = (disciplineId: string | undefined): number => {
    const { world, player, target } = setup({ disciplineId, rules: disciplineId ? ['squire-unbowed'] : [] });
    engage(world, player, target);
    player.mitigatesDamage.plating = 500;
    addResolve(world, player, 2);
    target.dealsDamage.attack = 5000;
    const hp = player.hasHealth.hp;
    runMonsterAttack(world, target, player, clock);
    return hp - player.hasHealth.hp;
  };
  const without = hit(undefined);
  const withUnbowed = hit('squire-juggernaut');
  assert(withUnbowed < without, `Unbowed takes it on the armor (${withUnbowed} < ${without})`);
}

// 11. Juggernaut: a steady fill from bulk with nothing hitting you; hits fill less.
{
  const { world, player } = setup({ disciplineId: 'squire-juggernaut', rules: [] });
  const before = player.usesCooldown!.resolve;
  step(world, player, 1000);
  assert(player.usesCooldown!.resolve > before, 'bulk fills Resolve, hit or not');
  const plain = setup({ rules: [] });
  step(plain.world, plain.player, 1000);
  assert.equal(plain.player.usesCooldown!.resolve, 0, 'a Squire without the pick has no steady fill');
}

// 12. Last Breath: at low HP the whole bar is spent to heal.
{
  const { world, player } = setup({ disciplineId: 'squire-bulwark', rules: ['squire-last-breath'] });
  player.hasHealth.hp = 1000;
  addResolve(world, player, 3);
  step(world, player);
  assert(player.hasHealth.hp > 2000, `healed (${player.hasHealth.hp})`);
  assert.equal(player.usesCooldown!.resolve, 0, 'the whole bar is spent');
}

// 13. Bulwark's slam holds: everything it hits turns on you.
{
  const { world, player, target, spawn } = setup({ disciplineId: 'squire-bulwark', rules: [] });
  const other = spawn(380, 420);
  const ally = spawn(900, 900);
  setAggroTarget(world, other, { id: 'ally', kind: 'player' }, clock);
  void ally;
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  assert.equal(other.hasAggroTarget?.targetId, 'squire', 'the slam turns what it hit onto you');
}

// 14. Trophies: Muster II, Rot-Eater II, Corrode II, Strangler Vine, Executioner's Oath.
{
  const muster = (cleared: string[]): number => {
    const { world, player, spawn } = setup({ relic: ['squire-relic-plains'], bossesCleared: cleared, rules: [] });
    for (let i = 0; i < 3; i++) engage(world, player, spawn(380 + i * 10, 420));
    step(world, player);
    return player.usesCooldown!.resolve;
  };
  const one = muster(['plains:1']);
  const two = muster(['plains:1', 'plains:2']);
  assert(two > one * 1.5, `Muster II: a wave fills double (${two} vs ${one})`);
}
{
  const rot = (cleared: string[]): number => {
    const { world, player } = setup({ relic: ['squire-relic-swamp'], bossesCleared: cleared, rules: [] });
    applyStatusEffect(player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 3000, refreshable: true, sourceId: 'mob', data: { totalMs: 3000 } });
    step(world, player);
    return player.usesCooldown!.resolve;
  };
  assert.equal(rot(['swamp:1']), 0, 'Rot-Eater I does not fill from a slow');
  assert(rot(['swamp:1', 'swamp:2']) > 0, 'Rot-Eater II: every debuff that lands also fills');
}
{
  const { world, player, target } = setup({ relic: ['squire-relic-cave'], bossesCleared: ['cave:1', 'cave:2'], rules: [] });
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  assert.equal(getStatusEffect(target.tracksCombat, 'plating-shred')?.maxStacks, 8, 'Corrode II: a higher stack cap');
}
{
  const { world, player, target, spawn } = setup({ relic: ['squire-relic-jungle'], bossesCleared: ['jungle:2'], rules: [] });
  const far = spawn(620, 400);
  engage(world, player, far);
  addResolve(world, player, 100);
  step(world, player);
  const hp = far.hasHealth.hp;
  swing(world, player, target);
  assert(dist(far, player) < 120, `Strangler Vine pulls the ring in (${dist(far, player)})`);
  assert(far.hasHealth.hp < hp, 'and the slam lands on what it pulled');
}
{
  const { world, player, target } = setup({ relic: ['squire-relic-desert'], bossesCleared: ['desert:2'], rules: [] });
  addResolve(world, player, 1);
  step(world, player);
  assert(!isEmpoweredAttack(player), 'a healthy target does not draw the Oath');
  target.hasHealth.hp = target.hasHealth.maxHp * 0.1;
  step(world, player);
  assert(isEmpoweredAttack(player), "Executioner's Oath: the slam fires early on a target low on HP");
}

// 15. Faultline II: the shockwave hits a raised barrier twice as hard.
{
  const slam = (cleared: string[]): number => {
    const { world, player, target } = setup({ relic: ['squire-relic-mountain'], bossesCleared: cleared, rules: [] });
    target.hasStatus.enemyBarrier = { amount: 50, maxAmount: 50, remainingMs: 5000, totalMs: 5000 };
    addResolve(world, player, 100);
    step(world, player);
    const hp = target.hasHealth.hp;
    swing(world, player, target);
    return hp - target.hasHealth.hp;
  };
  assert(slam(['mountain:1', 'mountain:2']) > slam(['mountain:1']) * 1.5, 'Faultline II doubles the blow on a barrier');
}

// 16. Gear: Hooked Glaive hooks a straggler into the slam; Throwing Shield throws at range;
//     Arrow Catcher doubles the fill from shooters.
{
  const { world, player, target, spawn } = setup({ rules: [], passives: { 'squire.slam-hook-px': 300 } });
  const runner = spawn(640, 400);
  engage(world, player, runner);
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  assert(dist(runner, player) < 120, `the slam hooks the straggler back (${dist(runner, player)})`);
}
{
  const { world, player, target } = setup({ rules: [], passives: { 'squire.throw-damage-pct': 0.5, 'squire.throw-range-px': 260 } });
  target.hasPosition.current = { x: 600, y: 400 };
  const hp = target.hasHealth.hp;
  step(world, player);
  assert(target.hasHealth.hp < hp, 'out of reach, the swing throws the shield');
}
{
  const fill = (passives: Record<string, number>): number => {
    const { world, player, target } = setup({ rules: [], passives });
    target.performsAttack.attackRange = 300;
    target.dealsDamage.attack = 2500;
    runMonsterAttack(world, target, player, clock);
    return player.usesCooldown!.resolve;
  };
  assert(fill({ 'squire.ranged-fill-x': 2 }) > fill({}) * 1.8, 'Arrow Catcher: ranged hits fill double');
}

console.log('squireT2.test.ts: ok');
