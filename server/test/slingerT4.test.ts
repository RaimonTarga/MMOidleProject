/**
 * The Slinger's tier 4 (T4-SLINGER; bible §10.7, §10.16): the nine leaves, the T4 clips and rank-ups,
 * the T4 trophy ranks and the Wasteland and Trench rounds, and the new gear jobs.
 * Wiring only: attach, shoot, tick, assert observable state. Every number is a placeholder, so
 * nothing here pins a balance value.
 */
import assert from 'node:assert/strict';
import {
  ABILITY_UNYIELDING_EFFECT_ID,
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  MONSTER_DATABASE,
  SLINGER_KIT,
  type LoadoutConfig,
} from '@mmo-idle/shared';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { SLINGER_GEAR } from '../../shared/src/data/classGear/slinger';
import { SLINGER_RECOVERY_X, regroupSpeedMult, updateSlinger } from '../src/systems/classes/archetypes/reload/slinger';
import { completeReload } from '../src/systems/classes/archetypes/reload/reloadLifecycle';
import { SLINGER_BURN_ID } from '../src/systems/classes/slinger/burn';
import { isTethered } from '../src/systems/classes/slinger/t3';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { DEBUFF_IMMUNE_EFFECT } from '../src/systems/combat/status/debuffGuard';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
/** Every biome at the end of tier 4 (the Jungle and Desert start a tier later, the Tundra and Volcanic two, the Wasteland and Trench three). */
const T4_BIOMES = {
  plains: 18, forest: 18, swamp: 18, mountain: 24, cave: 18, jungle: 18, desert: 18, tundra: 12, volcanic: 12, graveyard: 6, trench: 6,
};
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-slinger-dummy', { ...base, id: 'test-slinger-dummy', evasion: 0 });

let clock = 500_000;

interface Opts {
  relic?: string[];
  bossesCleared?: string[];
  biomes?: Record<string, number>;
  discipline?: string;
  specialization?: string;
  leaves?: string[];
  rack?: string[];
  clipRules?: LoadoutConfig['clipRules'];
  passives?: Record<string, number>;
  ammo?: number;
}

function setup(opts: Opts = {}) {
  const world = new World();
  const biomes = opts.biomes ?? T4_BIOMES;
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'slinger', name: 'Slinger' },
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
      unlockedSkills: ['reload-root', ...(opts.leaves ?? [])], passives: {}, selectedClass: 'reload-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'reload',
      ...(opts.discipline ? { disciplineId: opts.discipline } : {}),
      ...(opts.specialization ? { specializationId: opts.specialization } : {}),
    },
  } as PersistedPlayerSlices, 'slinger');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'reload', biomeLevel: biomes, bossesCleared: opts.bossesCleared ?? [], disciplineId: opts.discipline ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'loadout') {
    if (opts.rack) config.system.rack = opts.rack;
    if (opts.clipRules) config.system.clipRules = opts.clipRules;
  }
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  player.usesReload!.ammoMax = opts.ammo ?? 8;
  player.usesReload!.ammo = opts.ammo ?? 8;
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-slinger-dummy', { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn };
}
type Setup = ReturnType<typeof setup>;

function shoot(world: World, player: PlayerEntity, target: MonsterEntity): number {
  clock += 1_000;
  const before = target.hasHealth.hp;
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'slinger', kind: 'player' } });
  return before - target.hasHealth.hp;
}
const withClip = (player: PlayerEntity, clip: string): void => { player.usesReload!.clipId = clip; };
const status = (m: MonsterEntity, id: string) => getStatusEffect(m.tracksCombat, id);
const reloading = (player: PlayerEntity): void => { player.usesReload!.ammo = 0; player.usesReload!.reloadingMs = 1_000; };
const GUNSLINGER = 'slinger-gunslinger';
const SIEGE = 'slinger-siege';
const TRICKSHOT = 'slinger-trickshot';

/** One hit on the player from a monster through the real onDamageTaken listeners. */
function hitOnPlayer(s: Setup, from: MonsterEntity, damage = 1_000, metadata: Record<string, unknown> = {}): number {
  const ctx = makeCombatContext(from, 'monster', s.player, 'player');
  ctx.damage = damage;
  Object.assign(ctx.metadata, metadata);
  emitCombatEvent('onDamageTaken', ctx, s.world);
  return ctx.damage;
}

// ── Kit: every T4 lesson is taught and has runtime numbers ───────────────────
{
  const learned = new Set(SLINGER_KIT.lessons.filter((l) => l.source.kind === 'zone' && l.source.tier === 4).map((l) => `${l.pieceId}:${l.rank}`));
  for (const id of ['slinger-shellbreaker:2', 'slinger-frost:2', 'slinger-tracer:3', 'slinger-hollow-point:2', 'slinger-thermite:1', 'slinger-hallowed:1', 'slinger-exploit:1']) {
    assert.ok(learned.has(id), `${id} is a tier 4 lesson`);
  }
  for (const id of ['slinger-thermite', 'slinger-hallowed', 'slinger-exploit']) {
    assert.ok(Object.keys(SLINGER_KIT.pieces.find((piece) => piece.id === id)!.params).length > 0, `${id} carries its numbers`);
  }
}

// ── Shellbreaker II: a barrier breaks in a few rounds ────────────────────────
{
  const rounds = (biomes: Record<string, number>) => {
    const s = setup({ biomes, rack: ['slinger-shellbreaker'], clipRules: [{ clip: 'slinger-shellbreaker', conditions: [] }], ammo: 12 });
    s.player.usesReload!.ammoMax = 12;
    const target = s.spawn(430, 400);
    target.hasStatus.enemyBarrier = { amount: 5_000_000, maxAmount: 5_000_000, remainingMs: 10_000, totalMs: 10_000 };
    updateSlinger(s.world, s.player, 100, clock);
    const barrier = target.hasStatus.enemyBarrier.amount;
    const dealt: number[] = [];
    for (let i = 0; i < 4; i++) dealt.push(shoot(s.world, s.player, target));
    return { dealt, barrier };
  };
  const two = rounds(T4_BIOMES);
  assert.ok(two.dealt[2]! > two.dealt[0]! * 100, `Shellbreaker II: the third round breaks the barrier (${two.dealt.join(', ')})`);
  const one = rounds({ ...T4_BIOMES, mountain: 14 });
  assert.ok(one.dealt[2]! < one.dealt[0]! * 10, 'Shellbreaker I does not');
}

// ── Frost II: builds twice as fast; Ice Armor takes it double ────────────────
{
  const stacks = (biomes: Record<string, number>, iceArmor: boolean) => {
    const s = setup({ biomes });
    const target = s.spawn(430, 400);
    if (iceArmor) {
      applyStatusEffect(target.tracksCombat, {
        id: 'test-ice-armor', maxStacks: 1, remainingMs: 60_000, sourceId: target.isMonster.id,
        data: { monsterWard: 1, wardAmount: 5, wardMaxAmount: 5, monsterWardShatter: 1, totalMs: 60_000 },
      });
    }
    withClip(s.player, 'slinger-frost');
    shoot(s.world, s.player, target);
    return status(target, 'dot-chill')?.stacks ?? 0;
  };
  const one = stacks({ ...T4_BIOMES, tundra: 5 }, false);
  assert.equal(one, 1, 'Frost I: one chill per round');
  assert.equal(stacks(T4_BIOMES, false), 2, 'Frost II: it builds twice as fast');
  assert.ok(stacks(T4_BIOMES, true) > stacks(T4_BIOMES, false), 'and Ice Armor takes more of it');
}

// ── Tracer III: rounds on a traced target hit harder while it flees ──────────
{
  const dealt = (biomes: Record<string, number>, fleeing: boolean) => {
    const s = setup({ biomes });
    const target = s.spawn(430, 400);
    withClip(s.player, 'slinger-tracer');
    shoot(s.world, s.player, target); // traces it
    if (fleeing) attachComponent(s.world, target, 'isMoving', { motion: { direction: { x: 1, y: 0 }, magnitude: 100 } });
    return shoot(s.world, s.player, target);
  };
  assert.ok(dealt(T4_BIOMES, true) > dealt(T4_BIOMES, false), 'Tracer III: a fleeing traced target takes more');
  assert.equal(dealt({ ...T4_BIOMES, jungle: 8 }, true), dealt({ ...T4_BIOMES, jungle: 8 }, false), 'Tracer II does not');
}

// ── Hollow-point II: the bonus doubles below a third ─────────────────────────
{
  const dealt = (biomes: Record<string, number>, hpShare: number) => {
    const s = setup({ biomes });
    const target = s.spawn(430, 400);
    target.hasHealth.hp = Math.round(target.hasHealth.maxHp * hpShare);
    withClip(s.player, 'slinger-hollow-point');
    return shoot(s.world, s.player, target);
  };
  const two = dealt(T4_BIOMES, 0.2) / dealt(T4_BIOMES, 0.4);
  const one = dealt({ ...T4_BIOMES, desert: 8 }, 0.2) / dealt({ ...T4_BIOMES, desert: 8 }, 0.4);
  assert.ok(two > one * 1.1, `Hollow-point II: the bonus doubles below a third (${two.toFixed(2)} vs ${one.toFixed(2)})`);
}

// ── Thermite: the burn eats shells, ice and obsidian double ──────────────────
{
  const run = (kind: 'plain' | 'obsidian') => {
    const s = setup();
    const target = s.spawn(430, 400);
    withClip(s.player, 'slinger-thermite');
    shoot(s.world, s.player, target);
    assert.ok(status(target, SLINGER_BURN_ID), 'Thermite sets the target burning');
    // The shell goes up after the burn is on (a round soaked whole by a barrier lands no effect, as for every clip).
    applyStatusEffect(target.tracksCombat, {
      id: kind === 'obsidian' ? 'magma-obsidian-shell' : 'test-ward', maxStacks: 1, remainingMs: 60_000, sourceId: target.isMonster.id,
      data: { monsterWard: 1, wardAmount: 1_000_000, wardMaxAmount: 1_000_000, totalMs: 60_000 },
    });
    const before = getStatusEffect(target.tracksCombat, kind === 'obsidian' ? 'magma-obsidian-shell' : 'test-ward')!.data['wardAmount']!;
    clock += 1_500;
    updateSlinger(s.world, s.player, 1_100, clock);
    return before - (getStatusEffect(target.tracksCombat, kind === 'obsidian' ? 'magma-obsidian-shell' : 'test-ward')?.data['wardAmount'] ?? 0);
  };
  const plain = run('plain');
  assert.ok(plain > 0, 'Thermite: a burn tick eats the shell');
  assert.ok(run('obsidian') > plain * 1.5, 'and an obsidian shell loses it double');
  // Incendiary leaves shells alone.
  const s = setup();
  const target = s.spawn(430, 400);
  withClip(s.player, 'slinger-incendiary');
  shoot(s.world, s.player, target);
  applyStatusEffect(target.tracksCombat, { id: 'test-ward', maxStacks: 1, remainingMs: 60_000, sourceId: 'm', data: { monsterWard: 1, wardAmount: 1_000_000, wardMaxAmount: 1_000_000, totalMs: 60_000 } });
  clock += 1_500;
  updateSlinger(s.world, s.player, 1_100, clock);
  assert.equal(getStatusEffect(target.tracksCombat, 'test-ward')!.data['wardAmount'], 1_000_000, 'Incendiary does not');
}

// ── Hallowed: risen enemies take double and are weakened ─────────────────────
{
  const hit = (risen: boolean) => {
    const s = setup();
    const target = s.spawn(430, 400);
    if (risen) attachComponent(s.world, target, 'isRaised', { raiserId: 'necro' });
    const attack = target.dealsDamage.attack;
    withClip(s.player, 'slinger-hallowed');
    const dealt = shoot(s.world, s.player, target);
    return { dealt, weakened: target.dealsDamage.attack < attack };
  };
  const risen = hit(true);
  const living = hit(false);
  assert.ok(risen.dealt > living.dealt * 1.5, 'Hallowed: a risen enemy takes double');
  assert.ok(risen.weakened && !living.weakened, 'and a risen enemy it strikes is weakened');
}

// ── Exploit: harder for each different debuff on the target ──────────────────
{
  const dealt = (debuffs: number) => {
    const s = setup();
    const target = s.spawn(430, 400);
    for (let i = 0; i < debuffs; i++) applyStatusEffect(target.tracksCombat, { id: `test-debuff-${i}`, maxStacks: 1, remainingMs: 60_000, sourceId: 'x', data: {} });
    withClip(s.player, 'slinger-exploit');
    return shoot(s.world, s.player, target);
  };
  const [none, two, four] = [dealt(0), dealt(2), dealt(4)];
  assert.ok(two > none && four > two, `Exploit: each different debuff adds (${none}, ${two}, ${four})`);
}

// ── Trophy ranks and rounds ──────────────────────────────────────────────────
{
  // Quake Round IV: the blast leaves aftershocks.
  const run = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-mountain'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    shoot(s.world, s.player, target);
    const afterBlast = target.hasHealth.hp;
    for (let i = 0; i < 4; i++) { clock += 800; updateSlinger(s.world, s.player, 100, clock); }
    return afterBlast - target.hasHealth.hp;
  };
  assert.ok(run(['mountain:1', 'mountain:2', 'mountain:3', 'mountain:4']) > 0, 'Quake Round IV: aftershocks hit the same ground again');
  assert.equal(run(['mountain:1', 'mountain:2', 'mountain:3']), 0, 'Quake Round III leaves none');
}
{
  // Rime II / Cinder II / Hunter's III / Bounty III: stronger by rank (placeholder numbers).
  const rime = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-tundra'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    const edge = s.spawn(430 + 140, 400);
    shoot(s.world, s.player, target);
    updateSlinger(s.world, s.player, 100, clock);
    return status(edge, 'ability-slowed') !== undefined;
  };
  assert.ok(rime(['tundra:3', 'tundra:4']) && !rime(['tundra:3']), 'Rime Round II: wider frozen ground');
  const cinder = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-volcanic'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    const edge = s.spawn(430 + 160, 400);
    shoot(s.world, s.player, target);
    return status(edge, SLINGER_BURN_ID) !== undefined;
  };
  assert.ok(cinder(['volcanic:3', 'volcanic:4']) && !cinder(['volcanic:3']), 'Cinder Round II: a wider burn');
  const farShot = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-jungle'], bossesCleared: cleared, ammo: 1 });
    return shoot(s.world, s.player, s.spawn(700, 400));
  };
  assert.ok(farShot(['jungle:2', 'jungle:3', 'jungle:4']) > farShot(['jungle:2', 'jungle:3']), "Hunter's Round III hits harder still");
  const bounty = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-desert'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    target.hasHealth.hp = Math.round(target.hasHealth.maxHp * 0.3);
    shoot(s.world, s.player, target);
    return !s.world.hasMonster(target.isMonster.id);
  };
  assert.ok(bounty(['desert:2', 'desert:3', 'desert:4']) && !bounty(['desert:2', 'desert:3']), 'Bounty Round III: the threshold rises again');
}
{
  // Toll Round (Wasteland): the last round hits harder for every enemy in the fight.
  const dealt = (others: number) => {
    const s = setup({ relic: ['slinger-relic-graveyard'], bossesCleared: ['graveyard:4'], ammo: 1 });
    const target = s.spawn(430, 400);
    const fighters = [target];
    for (let i = 0; i < others; i++) fighters.push(s.spawn(600 + i * 10, 600));
    for (const monster of fighters) {
      attachComponent(s.world, monster, 'hasAggroTarget', { targetId: 'slinger', targetKind: 'player', lastAggroAt: clock } as never);
    }
    return shoot(s.world, s.player, target);
  };
  assert.ok(dealt(4) > dealt(0), 'Toll Round: more enemies in the fight, a harder last round');
}
{
  // Harpoon Round (Trench): the target cannot get away, flee, or hide for a few seconds.
  const s = setup({ relic: ['slinger-relic-trench'], bossesCleared: ['trench:4'], ammo: 1 });
  const target = s.spawn(430, 400);
  shoot(s.world, s.player, target);
  assert.ok(isTethered(s.player, target, clock), 'Harpoon Round holds the target');
  attachComponent(s.world, target, 'isMoving', { motion: { direction: { x: 1, y: 0 }, magnitude: 100 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(status(target, 'ability-slowed') || target.isRooted || getStatusEffect(target.tracksCombat, 'root'), 'and a harpooned target that flees is held');
  clock += 20_000;
  assert.ok(!isTethered(s.player, target, clock), 'only for a few seconds');
}

// ── Leaves ───────────────────────────────────────────────────────────────────
{
  // Light Hands: while you reload, the first hit every few seconds deals half.
  const s = setup({ discipline: GUNSLINGER, leaves: ['slinger-light-hands'] });
  const monster = s.spawn(450, 400);
  reloading(s.player);
  const first = hitOnPlayer(s, monster);
  const second = hitOnPlayer(s, monster);
  assert.ok(first < second, `Light Hands: the first hit is halved (${first} vs ${second})`);
  const idle = setup({ discipline: GUNSLINGER, leaves: ['slinger-light-hands'] });
  assert.equal(hitOnPlayer(idle, idle.spawn(450, 400)), 1_000, 'and only while reloading');
}
{
  // Slip Away: with an enemy in melee, you move faster.
  const s = setup({ discipline: GUNSLINGER, leaves: ['slinger-slip-away'] });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(regroupSpeedMult(s.player, clock), 1, 'alone: no change');
  s.spawn(420, 400);
  const monster = [...s.world.monsterEntitiesInNode(NODE)][0]!;
  attachComponent(s.world, monster, 'hasAggroTarget', { targetId: 'slinger', targetKind: 'player', lastAggroAt: clock } as never);
  s.world.tickCounter += 1; // the fight snapshot is read once per tick
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(regroupSpeedMult(s.player, clock) > 1, 'Slip Away: an enemy in melee, a quarter faster');
}
{
  // Quick Swap: a switch reload hands back the rounds you had left.
  const swap = (leaf: boolean) => {
    const s = setup({
      discipline: GUNSLINGER, ...(leaf ? { leaves: ['slinger-quick-swap'] } : {}),
      rack: ['slinger-snare', 'slinger-venom'],
      clipRules: [{ clip: 'slinger-venom', conditions: [], switchEarly: true }],
    });
    const target = s.spawn(430, 400);
    updateSlinger(s.world, s.player, 100, clock);
    shoot(s.world, s.player, target);
    const left = s.player.usesReload!.ammo;
    withClip(s.player, 'slinger-snare'); // a started clip the rules now want to swap for Venom
    clock += 100;
    updateSlinger(s.world, s.player, 100, clock);
    assert.ok(s.player.usesReload!.reloadingMs > 0, 'the switch started a reload');
    completeReload(s.world, s.player);
    return { left, ammo: s.player.usesReload!.ammo, max: s.player.usesReload!.ammoMax };
  };
  const quick = swap(true);
  assert.equal(quick.ammo, quick.max + quick.left, 'Quick Swap: the rounds you had left come back in the next clip');
  const none = swap(false);
  assert.equal(none.ammo, none.max, 'without it they are lost');
}
{
  // Bunker: a quarter less damage while you reload.
  const s = setup({ discipline: SIEGE, leaves: ['slinger-bunker'] });
  const monster = s.spawn(450, 400);
  assert.equal(hitOnPlayer(s, monster), 1_000, 'not reloading: full damage');
  reloading(s.player);
  assert.equal(hitOnPlayer(s, monster), 750, 'Bunker: a quarter less while reloading');
}
{
  // Stakes: a charger that reaches your feet is stopped dead.
  const run = (leaf: boolean) => {
    const s = setup({ discipline: SIEGE, ...(leaf ? { leaves: ['slinger-stakes'] } : {}) });
    const charger = s.spawn(440, 400);
    attachComponent(s.world, charger, 'hasAggroTarget', { targetId: 'slinger', targetKind: 'player', lastAggroAt: clock } as never);
    charger.controlsMonster.chargeRemainingMs = 900;
    updateSlinger(s.world, s.player, 100, clock);
    return charger;
  };
  const stopped = run(true);
  assert.equal(stopped.controlsMonster.chargeRemainingMs, 0, 'Stakes: the charge ends at your feet');
  assert.ok(status(stopped, 'stunned'), 'and it is held a moment');
  assert.ok((run(false).controlsMonster.chargeRemainingMs ?? 0) > 0, 'without the leaf it keeps charging');
}
{
  // Fresh Powder: the shell takes the clip you are loading, not the one you fired.
  const burst = (leaf: boolean) => {
    const s = setup({
      discipline: SIEGE, ...(leaf ? { leaves: ['slinger-fresh-powder'] } : {}), ammo: 1,
      rack: ['slinger-snare', 'slinger-stopping'],
      clipRules: [{ clip: 'slinger-snare', conditions: [] }],
    });
    s.player.usesReload!.ammoMax = 1;
    const target = s.spawn(430, 400);
    withClip(s.player, 'slinger-stopping');
    s.player.usesReload!.nextClipId = 'slinger-snare';
    shoot(s.world, s.player, target);
    return target;
  };
  assert.ok(status(burst(true), 'ability-slowed'), 'Fresh Powder: the shell is the clip being loaded (Snare)');
  assert.equal(status(burst(false), 'ability-slowed'), undefined, 'without it the shell is the fired clip (Stopping)');
}
{
  // Cool Reload: a telegraphed attack aimed at you while reloading deals half.
  const s = setup({ discipline: TRICKSHOT, leaves: ['slinger-cool-reload'] });
  const monster = s.spawn(450, 400);
  reloading(s.player);
  assert.equal(hitOnPlayer(s, monster, 1_000, { empoweredAttack: true }), 500, 'Cool Reload: the telegraphed blow is halved');
  assert.equal(hitOnPlayer(s, monster), 1_000, 'chip damage is not');
  s.player.usesReload!.reloadingMs = 0;
  s.player.usesReload!.ammo = 8;
  assert.equal(hitOnPlayer(s, monster, 1_000, { empoweredAttack: true }), 1_000, 'and not when you are not reloading');
}
{
  // Steady Nerve: with an enemy in melee, a stun is refused.
  const s = setup({ discipline: TRICKSHOT, leaves: ['slinger-steady-nerve'] });
  const monster = s.spawn(420, 400);
  attachComponent(s.world, monster, 'hasAggroTarget', { targetId: 'slinger', targetKind: 'player', lastAggroAt: clock } as never);
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(getStatusEffect(s.player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID), 'Steady Nerve: the stun guard is up while an enemy is in melee');
  const alone = setup({ discipline: TRICKSHOT, leaves: ['slinger-steady-nerve'] });
  updateSlinger(alone.world, alone.player, 100, clock);
  assert.equal(getStatusEffect(alone.player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID), undefined, 'and not when none is');
}
{
  // Improvise: control on a boss that accepts none makes the called shot hit a third harder.
  const immune = { ...base, id: 'test-slinger-immune', evasion: 0, controlImmune: true };
  MONSTER_DATABASE.set('test-slinger-immune', immune);
  const dealt = (leaf: boolean, typeId: string) => {
    const s = setup({
      discipline: TRICKSHOT, ...(leaf ? { leaves: ['slinger-improvise'] } : {}), ammo: 1,
      rack: ['slinger-snare'], clipRules: [{ clip: 'slinger-snare', conditions: [] }],
    });
    s.player.usesReload!.ammoMax = 1;
    const target = s.world.createMonster(NODE, typeId, { x: 430, y: 400 })!;
    target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
    target.mitigatesDamage.plating = 0;
    target.mitigatesDamage.damageReduction = 0;
    withClip(s.player, 'slinger-snare');
    return shoot(s.world, s.player, target);
  };
  assert.ok(dealt(true, 'test-slinger-immune') > dealt(false, 'test-slinger-immune') * 1.2, 'Improvise: the wasted clip makes the called shot harder');
  assert.ok(dealt(true, 'test-slinger-dummy') <= dealt(false, 'test-slinger-dummy') * 1.01, 'and only when it is wasted');
}

// ── Gear: Wasteland and Trench jobs ──────────────────────────────────────────
{
  const weapon = (id: string) => SLINGER_GEAR.weapons.find((entry) => entry.id === id)!;
  assert.ok(weapon('slinger-reapers-repeater-t4').mechanicEffects?.['slinger.splash-pct'], "Reaper's Repeater has its effect");
  assert.ok(weapon('slinger-pressure-rifle-t4').mechanicEffects?.['slinger.pressure-pct'], 'Pressure Rifle has its effect');
  const dead: string[] = [];
  for (const entry of SLINGER_GEAR.weapons) if (Object.keys(entry.mechanicEffects ?? {}).length === 0) dead.push(entry.id);
  for (const [id, line] of Object.entries(SLINGER_GEAR.lines)) if (Object.keys(line.effects).length === 0) dead.push(id);
  assert.deepEqual(dead, [], 'no gear job is empty through tier 4');

  // Reaper's Repeater: each round splashes to the enemies around the target.
  const splash = (passives: Record<string, number>) => {
    const s = setup({ passives });
    const target = s.spawn(430, 400);
    const beside = s.spawn(480, 400);
    shoot(s.world, s.player, target);
    return beside.hasHealth.maxHp - beside.hasHealth.hp;
  };
  assert.ok(splash({ 'slinger.splash-pct': 0.3 }) > splash({}), "Reaper's Repeater: the enemy beside the target takes a share");
  // Pressure Rifle: harder the more HP the target has left.
  const rifle = (hp: number) => {
    const s = setup({ passives: { 'slinger.pressure-pct': 0.5 } });
    const target = s.spawn(430, 400);
    target.hasHealth.hp = Math.round(target.hasHealth.maxHp * hp);
    return shoot(s.world, s.player, target);
  };
  assert.ok(rifle(1) > rifle(0.3), 'Pressure Rifle: rounds hit harder at full health');
}
{
  // Hallowed Ground: risen enemies deal half to you while you reload.
  const s = setup({ passives: { 'slinger.hallowed-ground': 0.5 } });
  const risen = s.spawn(450, 400);
  attachComponent(s.world, risen, 'isRaised', { raiserId: 'necro' });
  const living = s.spawn(450, 440);
  reloading(s.player);
  assert.equal(hitOnPlayer(s, risen), 500, 'Hallowed Ground: a risen enemy deals half while you reload');
  assert.equal(hitOnPlayer(s, living), 1_000, 'a living one does not');
  s.player.usesReload!.reloadingMs = 0;
  assert.equal(hitOnPlayer(s, risen), 1_000, 'and not when you are not reloading');
}
{
  // Vigil: Recovery rises with the number of enemies in the fight while none is near.
  const s = setup({ passives: { 'slinger.vigil': 0.1 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 1, 'no fight: no change');
  for (let i = 0; i < 3; i++) {
    const far = s.spawn(1_200 + i * 30, 1_200);
    attachComponent(s.world, far, 'hasAggroTarget', { targetId: 'slinger', targetKind: 'player', lastAggroAt: clock } as never);
  }
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X) > 1, 'Vigil: enemies in the fight, none near, Recovery rises');
  s.spawn(430, 400);
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 1, 'and not with one near');
}
{
  // Ballast: Recovery rises for each different debuff on you.
  const s = setup({ passives: { 'slinger.ballast': 0.1 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 1, 'no debuff: no change');
  applyStatusEffect(s.player.tracksCombat, { id: 'slow', maxStacks: 1, remainingMs: 10_000, sourceId: 'm', data: {} });
  applyStatusEffect(s.player.tracksCombat, { id: 'sundered', maxStacks: 3, remainingMs: 10_000, sourceId: 'm', data: {} });
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X) > 1.15, 'Ballast: two different debuffs raise Recovery');
}
{
  // Pressure Suit: no debuff lands while you reload.
  const s = setup({ passives: { 'slinger.pressure-suit': 1 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getStatusEffect(s.player.tracksCombat, DEBUFF_IMMUNE_EFFECT), undefined, 'not reloading: debuffs can land');
  reloading(s.player);
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(getStatusEffect(s.player.tracksCombat, DEBUFF_IMMUNE_EFFECT), 'Pressure Suit: while reloading, debuffs cannot land');
  // T4-W2: the immunity wears a buff-bar tile.
  syncPlayerBuffs(s.world, Date.now());
  assert.ok(s.player.hasStatus.activeBuffs?.some((buff) => buff.id === DEBUFF_IMMUNE_EFFECT), 'Pressure Suit shows its tile');
}

console.log('slingerT4: ok');
