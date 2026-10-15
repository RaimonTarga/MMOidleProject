/**
 * The Squire at tier 4 (T4-SQUIRE; bible §8.7, §8.9, §8.16): the T4 lessons answer their moments,
 * Guard III staggers, the last trophy ranks and the Wasteland and Trench trophies do their twists,
 * the nine leaves act on the empty bar, the wasted answer and the quiet, and the Wasteland and
 * Trench gear jobs do what their lines say. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getCounter,
  getStatusEffect,
  MONSTER_DATABASE,
  monsterDotStatusEffectId,
  PLATING_SHRED_EFFECT_ID,
  SQUIRE_KIT,
  trophyParamsAt,
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
  SQUIRE_GUARD_EFFECT_ID,
  SQUIRE_PARRY_EFFECT_ID,
  updateSquire,
} from '../src/systems/classes/archetypes/cooldown/squire';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { beginCharge } from '../src/systems/combat/engine/monsterMechanics';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
const dummy = (id: string, extra: Record<string, unknown> = {}) => {
  MONSTER_DATABASE.set(id, { ...base, id, evasion: 0, ...extra } as never);
};
dummy('test-squire-t4-dummy', { chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 } });
dummy('test-squire-t4-immune', { controlImmune: true, chargedAttack: { name: 'Test Slam', castMs: 3000, cooldownMs: 60_000, multiplier: 2 } });

let clock = 100_000;
// Level 20 of the Mountain is its tier 4 segment's second level, and so on: every T2, T3 and T4 lesson.
const T4 = {
  plains: 8, forest: 8, swamp: 14, mountain: 20, cave: 14, jungle: 14, desert: 14, tundra: 8, volcanic: 8, graveyard: 2, trench: 2,
};
const ALL_BOSSES = [
  ...['mountain', 'tundra', 'jungle', 'desert', 'volcanic', 'swamp', 'cave'].flatMap((biome) => [1, 2, 3, 4].map((tier) => `${biome}:${tier}`)),
  'graveyard:4', 'trench:4',
];

function setup(opts: {
  relic?: string[];
  bossesCleared?: string[];
  disciplineId?: string;
  specializationId?: string;
  leaves?: string[];
  biomes?: Record<string, number>;
  rules?: string[];
  passives?: Record<string, number>;
} = {}) {
  const world = new World();
  const biomes = { ...T4, ...(opts.biomes ?? {}) };
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'squire', name: 'Squire' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 4, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cooldown-root', ...(opts.leaves ?? [])], passives: {}, selectedClass: 'cooldown-root',
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
  const spawn = (x: number, y: number) => spawnType('test-squire-t4-dummy', x, y);
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

function swing(world: World, player: PlayerEntity, target: MonsterEntity): void {
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'squire', kind: 'player' } });
}

/** The damage the target takes from one swing (a slam, if the bar is full and armed). */
function swingDamage(world: World, player: PlayerEntity, target: MonsterEntity): number {
  const hp = target.hasHealth.hp;
  swing(world, player, target);
  return hp - target.hasHealth.hp;
}

const resolveOf = (player: PlayerEntity): number => player.usesCooldown!.resolve;

// 1. The T4 lessons and ranks.
{
  const { ctx } = setup({ rules: [], bossesCleared: ALL_BOSSES });
  for (const id of ['squire-disarm', 'squire-lay-to-rest', 'squire-lie-in-wait']) assert.equal(ctx.pieceRanks.get(id), 1, `${id} is learned at T4`);
  assert.equal(ctx.pieceRanks.get('squire-guard'), 3, 'Guard III at T4');
  assert.equal(ctx.pieceRanks.get('squire-splitting-blow'), 2, 'Splitting Blow II at T4');
  assert.equal(ctx.pieceRanks.get('squire-watchful'), 2, 'Watchful II at T4');
  assert.equal(ctx.pieceRanks.get('squire-anchor'), 2, 'Anchor II at T4');
  const rank = (id: string): number => ctx.trophyRanks.get(id) ?? 0;
  assert.equal(rank('squire-relic-mountain'), 4, 'Faultline IV');
  assert.equal(rank('squire-relic-tundra'), 2, 'Deep Winter II');
  assert.equal(rank('squire-relic-jungle'), 3, 'Strangler Vine III');
  assert.equal(rank('squire-relic-desert'), 3, "Executioner's Oath III");
  assert.equal(rank('squire-relic-volcanic'), 2, 'Kindling II');
  assert.equal(rank('squire-relic-graveyard'), 1, 'Charnel Ring is held');
  assert.equal(rank('squire-relic-trench'), 1, 'Undertow is held');
  const trophy = (id: string) => SQUIRE_KIT.trophies.find((t) => t.id === id)!;
  assert.equal(trophyParamsAt(trophy('squire-relic-tundra'), 2).capMult, 3, 'Deep Winter II fills to triple');
  assert.equal(trophyParamsAt(trophy('squire-relic-jungle'), 3).ringRadius, 440, 'Strangler Vine III: the widest ring');
  assert.equal(trophyParamsAt(trophy('squire-relic-desert'), 3).hpShare, 0.55, "Executioner's Oath III: more HP");
  assert.equal(trophyParamsAt(trophy('squire-relic-volcanic'), 2).perStep, 0.15, 'Kindling II');
  assert(trophyParamsAt(trophy('squire-relic-mountain'), 4).aftershocks > 0, 'Faultline IV carries aftershocks');
  const piece = (id: string) => SQUIRE_KIT.pieces.find((p) => p.id === id)!;
  assert.equal(piece('squire-splitting-blow').ranks![0].params!['breakBarrier'], 1, 'Splitting Blow II breaks Ice Armor in one blow');
  assert.equal(piece('squire-watchful').ranks![0].params!['staggerMs'], 1000, 'Watchful II staggers');
}

// 2. Guard III: a caught blow staggers its attacker.
{
  const caught = (mountain: number): boolean => {
    const { world, player, target } = setup({ rules: ['squire-guard'], biomes: { mountain } });
    engage(world, player, target);
    addResolve(world, player, 3);
    beginCharge(target, clock, 3000);
    step(world, player);
    assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'the Squire braces');
    target.dealsDamage.attack = 1000;
    runMonsterAttack(world, target, player, clock, 2);
    return (getStatusEffect(target.tracksCombat, STUN_EFFECT)?.remainingMs ?? 0) !== 0;
  };
  assert(!caught(14), 'Guard II does not stagger');
  assert(caught(20), 'Guard III staggers the attacker');
}

// 3. Disarm: the big attack it was raised against lands at half, even on a boss that accepts no control.
{
  const hit = (rules: string[], typeId: string): { damage: number; resolve: number } => {
    const { world, player, spawnType } = setup({ rules, bossesCleared: ALL_BOSSES });
    const foe = spawnType(typeId, 450, 400);
    foe.dealsDamage.attack = 1000;
    setAttackTarget(world, player, foe.isMonster.id);
    engage(world, player, foe);
    addResolve(world, player, 3);
    beginCharge(foe, clock, 3000);
    step(world, player);
    const before = resolveOf(player);
    const hp = player.hasHealth.hp;
    runMonsterAttack(world, foe, player, clock, 2);
    return { damage: hp - player.hasHealth.hp, resolve: resolveOf(player) - before };
  };
  const none = hit([], 'test-squire-t4-dummy');
  const disarmed = hit(['squire-disarm'], 'test-squire-t4-dummy');
  const immune = hit(['squire-disarm'], 'test-squire-t4-immune');
  assert(disarmed.damage <= none.damage * 0.55, `the blow lands at half (${disarmed.damage} vs ${none.damage})`);
  assert(immune.damage <= none.damage * 0.55, `also on an enemy that ignores control (${immune.damage})`);
  assert(disarmed.resolve > none.resolve, 'catching it refunds Resolve');
}

// 4. Lay to Rest: a fallen enemy rising near you is struck down; Rest Eternal heals; once per riser.
{
  const { world, player, spawn } = setup({ rules: ['squire-lay-to-rest'], bossesCleared: ALL_BOSSES, passives: { 'squire.lay-to-rest-heal-pct': 0.0125 } });
  addResolve(world, player, 3);
  step(world, player);
  const risen = spawn(520, 400);
  attachComponent(world, risen, 'isRaised', { raiserId: 'necromancer' } as never);
  engage(world, player, risen);
  player.hasHealth.hp = 5000;
  const hp = risen.hasHealth.hp;
  const resolve = resolveOf(player);
  step(world, player);
  assert(risen.hasHealth.hp < hp, 'the risen enemy is struck before it stands');
  assert((getStatusEffect(risen.tracksCombat, STUN_EFFECT)?.remainingMs ?? 0) !== 0, 'and staggered');
  assert(player.hasHealth.hp > 5000, 'Rest Eternal heals');
  assert(resolveOf(player) !== resolve, 'the answer cost and refunded Resolve');
  const after = risen.hasHealth.hp;
  step(world, player);
  step(world, player);
  assert.equal(risen.hasHealth.hp, after, 'the same riser is not struck twice');

  const plain = setup({ rules: ['squire-lay-to-rest'], bossesCleared: ALL_BOSSES });
  addResolve(plain.world, plain.player, 3);
  const rat = plain.spawn(520, 400);
  engage(plain.world, plain.player, rat);
  const ratHp = rat.hasHealth.hp;
  step(plain.world, plain.player);
  assert.equal(rat.hasHealth.hp, ratHp, 'an enemy that never fell is not a riser');
}

// 5. Lie in Wait: the slam held while the target is out of reach lands double when it comes back.
{
  const slam = (rules: string[]): { damage: number; held: boolean } => {
    const { world, player, target } = setup({ rules, bossesCleared: ALL_BOSSES });
    engage(world, player, target);
    addResolve(world, player, 100);
    step(world, player);
    assert(isEmpoweredAttack(player), 'the slam is armed');
    attachComponent(world, target, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 60_000 } as never);
    step(world, player);
    step(world, player);
    const held = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID) === undefined;
    detachComponent(world, target, 'isConcealed');
    return { damage: swingDamage(world, player, target), held };
  };
  const plain = slam([]);
  const waited = slam(['squire-lie-in-wait']);
  assert(waited.damage > plain.damage * 1.8, `the held slam lands double (${waited.damage} vs ${plain.damage})`);
  assert(waited.held, 'holding is not a brace');
}

// 6. Faultline IV: aftershocks follow along the line; III has none.
{
  const run = (cleared: string[]): { far: number; later: number } => {
    const { world, player, target, spawn } = setup({ relic: ['squire-relic-mountain'], bossesCleared: cleared, rules: [] });
    // Off the line (the line is 70 px wide) but inside an aftershock's circle.
    const off = spawn(680, 480);
    off.mitigatesDamage.plating = 0;
    engage(world, player, off);
    addResolve(world, player, 100);
    step(world, player);
    const hp = off.hasHealth.hp;
    swing(world, player, target);
    const far = hp - off.hasHealth.hp;
    for (let i = 0; i < 14; i++) step(world, player);
    return { far, later: hp - off.hasHealth.hp };
  };
  const three = run(['mountain:1', 'mountain:2', 'mountain:3']);
  const four = run(['mountain:1', 'mountain:2', 'mountain:3', 'mountain:4']);
  assert.equal(three.later, 0, 'Faultline III leaves nothing behind');
  assert.equal(four.far, 0, 'the first blow does not reach it');
  assert(four.later > 0, 'the aftershocks do');
}

// 7. Charnel Ring: the circle widens with every enemy in the fight.
{
  const reach = (relic: string[] | undefined, extra: number): boolean => {
    const { world, player, target, spawn } = setup({ relic, bossesCleared: ALL_BOSSES, rules: [] });
    for (let i = 0; i < extra; i++) engage(world, player, spawn(700 + i * 5, 700));
    engage(world, player, target);
    const victim = spawn(400 + 150, 400);
    addResolve(world, player, 100);
    step(world, player);
    const hp = victim.hasHealth.hp;
    swing(world, player, target);
    return victim.hasHealth.hp < hp;
  };
  assert(!reach(undefined, 4), 'a plain slam does not reach 150 px');
  assert(!reach(['squire-relic-graveyard'], 0), 'alone the ring is not wider');
  assert(reach(['squire-relic-graveyard'], 4), 'with the fight around you the ring reaches it');
}

// 8. Undertow: the slam holds its target; a dive or flight it starts is cut short.
{
  const { world, player, target } = setup({ relic: ['squire-relic-trench'], bossesCleared: ALL_BOSSES, rules: [] });
  engage(world, player, target);
  addResolve(world, player, 100);
  step(world, player);
  swing(world, player, target);
  assert(target.isRooted !== undefined, 'the target is held where it stands');
  attachComponent(world, target, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 60_000 } as never);
  step(world, player);
  assert.equal(target.isConcealed, undefined, 'a dive is cut short');
  for (let i = 0; i < 40; i++) step(world, player);
  attachComponent(world, target, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 60_000 } as never);
  step(world, player);
  assert(target.isConcealed !== undefined, 'after the hold it can dive again');
}

// 9. Last Word and Last Rampart: an empty bar still fires Parry (Unbowed) free, every so often.
{
  const { world, player, target } = setup({ rules: ['squire-parry'], bossesCleared: ALL_BOSSES, disciplineId: 'squire-avenger', leaves: ['squire-last-word'] });
  engage(world, player, target);
  beginCharge(target, clock, 3000);
  assert(resolveOf(player) < 1, 'the bar is empty');
  step(world, player);
  assert(getStatusEffect(player.tracksCombat, SQUIRE_PARRY_EFFECT_ID), 'Parry fires on an empty bar, at no cost');
  const without = setup({ rules: ['squire-parry'], bossesCleared: ALL_BOSSES, disciplineId: 'squire-avenger' });
  engage(without.world, without.player, without.target);
  beginCharge(without.target, clock, 3000);
  step(without.world, without.player);
  assert.equal(getStatusEffect(without.player.tracksCombat, SQUIRE_PARRY_EFFECT_ID), undefined, 'without the leaf it does not');
}
{
  const hit = (leaves: string[]): number => {
    const { world, player, target } = setup({ rules: ['squire-unbowed'], bossesCleared: ALL_BOSSES, disciplineId: 'squire-juggernaut', leaves });
    target.dealsDamage.attack = 6000;
    engage(world, player, target);
    step(world, player);
    runMonsterAttack(world, target, player, clock);
    return resolveOf(player);
  };
  assert(hit(['squire-last-rampart']) > hit([]) + 1, 'Unbowed answers a big hit on an empty bar and refunds');
}

// 10. Read Again and No Wasted Effort: a wasted answer (a Shove that moves nobody) is not lost.
{
  const wasted = (leaves: string[], disciplineId: string): { resolve: number; after: number; slam: number } => {
    const { world, player, target, spawn } = setup({ rules: ['squire-shove'], bossesCleared: ALL_BOSSES, disciplineId, leaves });
    // Three enemies on you, all out of the shove's reach: it moves nobody.
    for (const y of [700, 720, 740]) engage(world, player, spawn(900, y));
    engage(world, player, target);
    addResolve(world, player, 3);
    const before = resolveOf(player);
    step(world, player);
    const resolve = resolveOf(player) - before;
    // The next slam.
    for (const m of world.aggroedMonsters) if (m !== target) world.removeMonsterEntity(m.isMonster.id);
    player.usesCooldown!.resolve = 0;
    addResolve(world, player, 100);
    step(world, player);
    return { resolve, after: getCounter(player.tracksCombat, 'squire.readAgain.hold'), slam: swingDamage(world, player, target) };
  };
  const none = wasted([], 'squire-avenger');
  const again = wasted(['squire-read-again'], 'squire-avenger');
  assert(again.resolve > none.resolve + 0.3, `half the cost comes back (${again.resolve} vs ${none.resolve})`);
  assert(again.after > 0 && none.after === 0, 'and the next hold costs less');
  const noneB = wasted([], 'squire-bulwark');
  const banked = wasted(['squire-no-wasted-effort'], 'squire-bulwark');
  assert(banked.slam > noneB.slam * 1.15, `the lost Resolve rides in the next slam (${banked.slam} vs ${noneB.slam})`);
}
{
  // A Guard raised against a blow that never comes is wasted too, once its brace runs out.
  const { world, player, target } = setup({ rules: ['squire-guard'], bossesCleared: ALL_BOSSES, disciplineId: 'squire-avenger', leaves: ['squire-read-again'] });
  engage(world, player, target);
  addResolve(world, player, 3);
  beginCharge(target, clock, 3000);
  step(world, player);
  const braced = resolveOf(player);
  step(world, player, 6000);
  assert(resolveOf(player) > braced + 0.3, 'the unspent brace gives half its cost back');
}

// 11. Second Line, Goad: the Bulwark's empty-bar and quiet leaves.
{
  const { world, player, target, spawn } = setup({ rules: [], bossesCleared: ALL_BOSSES, disciplineId: 'squire-bulwark', leaves: ['squire-second-line'] });
  for (const y of [500, 520]) engage(world, player, spawn(450, y));
  engage(world, player, target);
  step(world, player);
  assert(resolveOf(player) >= 2.5, `an empty bar refills a pip per enemy on you (${resolveOf(player)})`);
  player.usesCooldown!.resolve = 0;
  step(world, player);
  assert(resolveOf(player) < 1, 'and not again at once');
}
{
  const { world, player, spawn } = setup({ rules: [], bossesCleared: ALL_BOSSES, disciplineId: 'squire-bulwark', leaves: ['squire-goad'] });
  const far = spawn(620, 400);
  const dist = (): number => Math.hypot(far.hasPosition.current.x - 400, far.hasPosition.current.y - 400);
  assert(dist() > 180, 'the enemy starts far');
  step(world, player, 11_000); // past the pull setup made on the lone target
  assert(dist() < 120, `a free Challenge pulls it onto you (${dist()})`);
  assert.equal(far.hasAggroTarget?.targetId, 'squire', 'and it turns on you');
}

// 12. Seize the Opening and Siege Engine: the Avenger's and the Juggernaut's quiet leaves.
{
  const seize = (leaves: string[]): { first: number; second: number } => {
    const { world, player, target } = setup({ rules: [], bossesCleared: ALL_BOSSES, disciplineId: 'squire-avenger', leaves });
    step(world, player);
    return { first: swingDamage(world, player, target), second: swingDamage(world, player, target) };
  };
  const plain = seize([]);
  const opened = seize(['squire-seize-the-opening']);
  assert(opened.first > plain.first * 1.3, `the first swing on a quiet enemy is followed by a counter (${opened.first} vs ${plain.first})`);
  assert(opened.second < opened.first * 0.8, 'the opening is spent');
}
{
  const siege = (leaves: string[], hurt: boolean): number => {
    const { world, player, target } = setup({ rules: [], bossesCleared: ALL_BOSSES, disciplineId: 'squire-juggernaut', leaves });
    step(world, player);
    if (hurt) runMonsterAttack(world, target, player, clock);
    return swingDamage(world, player, target);
  };
  const plain = siege([], false);
  assert(siege(['squire-siege-engine'], false) > plain * 1.4, 'swings hit harder while nothing has hit you');
  assert(siege(['squire-siege-engine'], true) < plain * 1.1, 'and not once something has');
}

// 13. Focused Weight: a slam that hits one enemy gives a quarter of the bar back.
{
  const refund = (leaves: string[], extra: boolean): number => {
    const { world, player, target, spawn } = setup({ rules: [], bossesCleared: ALL_BOSSES, disciplineId: 'squire-juggernaut', leaves });
    if (extra) spawn(450, 400);
    addResolve(world, player, 100);
    step(world, player);
    swing(world, player, target);
    return resolveOf(player);
  };
  assert(refund(['squire-focused-weight'], false) > refund([], false) + player0Budget() * 0.2, 'a lone target gives the bar back');
  assert(refund(['squire-focused-weight'], true) < refund(['squire-focused-weight'], false), 'two targets do not');
}
function player0Budget(): number {
  return setup({ rules: [] }).ctx.budget;
}

// 14. The Wasteland and Trench gear jobs.
{
  const bigger = (passives: Record<string, number>, setupFoes: (s: ReturnType<typeof setup>) => void): number => {
    const s = setup({ rules: [], bossesCleared: ALL_BOSSES, passives });
    setupFoes(s);
    addResolve(s.world, s.player, 100);
    step(s.world, s.player);
    return swingDamage(s.world, s.player, s.target);
  };
  const crowd = (s: ReturnType<typeof setup>): void => { for (const y of [440, 460, 480]) s.spawn(430, y); };
  assert(bigger({ 'squire.slam-circle-pct': 0.1 }, crowd) > bigger({}, crowd) * 1.3, 'Bone Maul: bigger for every enemy in the circle');
  const debuffed = (s: ReturnType<typeof setup>): void => {
    for (const id of ['slow', PLATING_SHRED_EFFECT_ID, VOLCANIC_HEAT_EFFECT_ID]) {
      applyStatusEffect(s.player.tracksCombat, { id, maxStacks: 1, remainingMs: -1, refreshable: true, sourceId: 'room', data: {} });
    }
  };
  assert(bigger({ 'squire.slam-debuff-pct': 0.1 }, debuffed) > bigger({}, debuffed) * 1.2, 'Pressure Hammer: bigger for each different debuff on you');
}
{
  const fill = (raised: boolean, passives: Record<string, number>): number => {
    const { world, player, target } = setup({ rules: [], bossesCleared: ALL_BOSSES, passives });
    if (raised) attachComponent(world, target, 'isRaised', { raiserId: 'necromancer' } as never);
    target.dealsDamage.attack = 600;
    engage(world, player, target);
    runMonsterAttack(world, target, player, clock);
    return resolveOf(player);
  };
  const plain = fill(false, { 'squire.risen-fill-x': 2 });
  assert(fill(true, { 'squire.risen-fill-x': 2 }) > plain * 1.8, 'Grave Plate: a risen enemy fills double');
  assert(fill(true, {}) < plain * 1.1, 'and only a risen one');
}
{
  const guardCost = (passives: Record<string, number>, debuffs: number): number => {
    const { world, player, target } = setup({ rules: ['squire-guard'], bossesCleared: ALL_BOSSES, passives });
    ['slow', PLATING_SHRED_EFFECT_ID, VOLCANIC_HEAT_EFFECT_ID].slice(0, debuffs).forEach((id) => {
      applyStatusEffect(player.tracksCombat, { id, maxStacks: 1, remainingMs: -1, refreshable: true, sourceId: 'room', data: {} }).stacks = 1;
    });
    engage(world, player, target);
    addResolve(world, player, 3);
    beginCharge(target, clock, 3000);
    const before = resolveOf(player);
    step(world, player);
    assert(getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID), 'the Guard is up');
    return before - resolveOf(player);
  };
  assert(guardCost({ 'squire.guards-free-debuffs': 3 }, 3) < 0.3, 'Abyssal Plate: with three debuffs on you a guard is free');
  assert(guardCost({ 'squire.guards-free-debuffs': 3 }, 2) > 0.7, 'with two it is not');
}
{
  const { world, player } = setup({ rules: ['squire-steel-will'], bossesCleared: ALL_BOSSES, passives: { 'squire.brine-recovery-x': 0.25, 'squire.brine-recovery-ms': 4000 } });
  assert.equal(getCounter(player.tracksCombat, 'squire.brine.stacks'), 0, 'no stacks yet');
  applyStatusEffect(player.tracksCombat, { id: monsterDotStatusEffectId('poison'), maxStacks: 5, remainingMs: 5000, refreshable: true, sourceId: 'room', data: { damagePerStack: 5, tickIntervalMs: 1000 } }).stacks = 1;
  addResolve(world, player, 3);
  step(world, player);
  assert.equal(getStatusEffect(player.tracksCombat, monsterDotStatusEffectId('poison')), undefined, 'Steel Will shakes the bleed off');
  assert.equal(getCounter(player.tracksCombat, 'squire.brine.stacks'), 1, 'Brine Will: the shaken debuff raises Recovery (one stack)');
}
{
  // The gear file: every Wasteland and Trench job carries its key.
  const weapon = (id: string) => SQUIRE_GEAR.weapons.find((w) => w.id === id)!;
  assert(Object.keys(weapon('squire-bone-maul-t4').mechanicEffects ?? {}).length > 0, 'Bone Maul does something');
  assert(Object.keys(weapon('squire-pressure-hammer-t4').mechanicEffects ?? {}).length > 0, 'Pressure Hammer does something');
  for (const key of ['graveyard-vest-t4', 'graveyard-charm-t4', 'trench-vest-t4', 'trench-charm-t4']) {
    assert(Object.keys(SQUIRE_GEAR.lines[key].effects).length > 0, `${key} does something`);
  }
}

console.log('squireT4: ok');
