/**
 * The Slinger's tier 2 (class-first build plan T2-SLINGER; bible §10.5, §10.8, §10.16): the new
 * clips and rank-ups, the trophy rounds' T2 twists, the Jungle and Desert gear, and the three
 * disciplines (twin guns, the shell, the called shot). Wiring only: attach, shoot, tick, assert
 * observable state. Every number is a placeholder, so nothing here pins a balance value.
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  MONSTER_DATABASE,
  type LoadoutConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { loadoutOf, updateSlinger } from '../src/systems/classes/archetypes/reload/slinger';
import { resolveReloadTimeMs } from '../src/systems/classes/archetypes/reload/reloadLifecycle';
import { updateReloadArchetype } from '../src/systems/classes/archetypes/reload/reloadPrototype';
import { shellBank } from '../src/systems/classes/slinger/shell';
import { SLINGER_RECOVERY_X } from '../src/systems/classes/archetypes/reload/slinger';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { recordMoment } from '../src/systems/combat/moments/moments';
import { isConcealedEntity } from '../src/systems/combat/invulnerability';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BASE_BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-slinger-dummy', { ...base, id: 'test-slinger-dummy', evasion: 0 });

let clock = 200_000;

interface Opts {
  relic?: string[];
  bossesCleared?: string[];
  biomes?: Record<string, number>;
  discipline?: string;
  rack?: string[];
  clipRules?: LoadoutConfig['clipRules'];
  passives?: Record<string, number>;
  ammo?: number;
}

function setup(opts: Opts = {}) {
  const world = new World();
  const biomes = opts.biomes ?? BASE_BIOMES;
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'slinger', name: 'Slinger' },
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
      unlockedSkills: ['reload-root'], passives: {}, selectedClass: 'reload-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'reload',
      ...(opts.discipline ? { disciplineId: opts.discipline } : {}),
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

function shoot(world: World, player: PlayerEntity, target: MonsterEntity): number {
  clock += 1_000;
  const before = target.hasHealth.hp;
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'slinger', kind: 'player' } });
  return before - target.hasHealth.hp;
}

const withClip = (player: PlayerEntity, clip: string): void => { player.usesReload!.clipId = clip; };
const refill = (player: PlayerEntity, ammo = 8): void => { player.usesReload!.ammo = ammo; player.usesReload!.reloadingMs = 0; };

// ── Buckshot: a cone of pellets, harder up close, and a charger is stopped ───
{
  const { world, player, spawn } = setup();
  const target = spawn(420, 400);
  const inCone = spawn(470, 405);
  const outside = spawn(400, 560);
  const beforeCone = inCone.hasHealth.hp;
  const beforeOutside = outside.hasHealth.hp;
  target.controlsMonster.chargeRemainingMs = 800;
  withClip(player, 'slinger-buckshot');
  const close = shoot(world, player, target);
  assert.ok(inCone.hasHealth.hp < beforeCone, 'Buckshot: the pellets hit an enemy in the cone');
  assert.equal(outside.hasHealth.hp, beforeOutside, 'Buckshot: an enemy outside the cone is untouched');
  assert.equal(target.controlsMonster.chargeRemainingMs, 0, 'Buckshot: the pellets stop a charging enemy');
  const far = spawn(560, 400);
  refill(player);
  assert.ok(close > shoot(world, player, far), `Buckshot hits harder up close (${close})`);
}

// ── Shellbreaker doubles against a barrier ───────────────────────────────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  withClip(player, 'slinger-shellbreaker');
  const bare = shoot(world, player, target);
  target.hasStatus.enemyBarrier = { amount: 500, maxAmount: 500, remainingMs: 5000, totalMs: 5000 };
  refill(player);
  const shielded = shoot(world, player, target);
  assert.ok(shielded > bare * 1.5, `Shellbreaker: a barrier takes about twice as much (${shielded} vs ${bare})`);
}

// ── Hollow-point: harder below half health ───────────────────────────────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  withClip(player, 'slinger-hollow-point');
  const healthy = shoot(world, player, target);
  target.hasHealth.hp = Math.round(target.hasHealth.maxHp * 0.4);
  refill(player);
  const wounded = shoot(world, player, target);
  assert.ok(wounded > healthy, `Hollow-point hits a wounded target harder (${wounded} vs ${healthy})`);
}

// ── Tracer: a traced target that goes to ground stays a legal target ─────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  const untraced = spawn(450, 440);
  withClip(player, 'slinger-tracer');
  shoot(world, player, target);
  for (const monster of [target, untraced]) attachComponent(world, monster, 'isConcealed', { marker: 'stealth', endsAtMs: clock + 10_000 });
  assert.ok(isConcealedEntity(target), 'the target hides');
  updateSlinger(world, player, 100, clock);
  assert.ok(!isConcealedEntity(target), 'Tracer: the traced target cannot hide');
  assert.ok(isConcealedEntity(untraced), 'an untraced target still hides');
}

// ── Rank-ups: Snare II, Venom II, Breaching II ───────────────────────────────
{
  const ranked = { ...BASE_BIOMES, plains: 12, forest: 12, swamp: 12, mountain: 12, cave: 12 };
  const rank1 = setup();
  const rank2 = setup({ biomes: ranked });
  const slowAfter = (s: ReturnType<typeof setup>, rounds: number) => {
    const target = s.spawn(430, 400);
    withClip(s.player, 'slinger-snare');
    for (let i = 0; i < rounds; i++) shoot(s.world, s.player, target);
    return getStatusEffect(target.tracksCombat, 'ability-slowed')?.data ?? {};
  };
  const one = slowAfter(rank1, 2);
  const two = slowAfter(rank2, 2);
  assert.ok((two['moveSlowPct'] ?? 0) > (one['moveSlowPct'] ?? 0), 'Snare II builds faster');
  const capped = slowAfter(setup({ biomes: ranked }), 6);
  assert.ok((capped['attackSlowPct'] ?? 0) > 0, 'Snare II: at its cap the target also attacks slower');
  assert.equal(slowAfter(setup(), 6)['attackSlowPct'], undefined, 'Snare I does not');

  const venomStacks = (s: ReturnType<typeof setup>) => {
    const target = s.spawn(430, 400);
    withClip(s.player, 'slinger-venom');
    shoot(s.world, s.player, target);
    return getStatusEffect(target.tracksCombat, 'slinger-venom')?.stacks ?? 0;
  };
  assert.ok(venomStacks(setup({ biomes: ranked })) > venomStacks(setup()), 'Venom II puts on more poison per round');

  const breach = (s: ReturnType<typeof setup>) => {
    const target = s.spawn(430, 400);
    target.mitigatesDamage.plating = 30;
    withClip(s.player, 'slinger-breaching');
    return shoot(s.world, s.player, target);
  };
  assert.ok(breach(setup({ biomes: ranked })) > breach(setup()), 'Breaching II ignores all plating');
}

// ── Trophy rounds ranked up by the T2 bosses ─────────────────────────────────
{
  // Stampede Round II: the shove also knocks down.
  const s = setup({ relic: ['slinger-relic-plains'], bossesCleared: ['plains:1', 'plains:2'], ammo: 1 });
  const target = s.spawn(430, 400);
  shoot(s.world, s.player, target);
  assert.ok(getStatusEffect(target.tracksCombat, 'stunned'), 'Stampede Round II knocks the target down');
  const one = setup({ relic: ['slinger-relic-plains'], bossesCleared: ['plains:1'], ammo: 1 });
  const first = one.spawn(430, 400);
  shoot(one.world, one.player, first);
  assert.equal(getStatusEffect(first.tracksCombat, 'stunned'), undefined, 'Stampede Round I does not');
}
{
  // Twin Round II: both shots at full strength (the second shot equals the first).
  const dealt = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-forest'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    return shoot(s.world, s.player, target);
  };
  assert.ok(dealt(['forest:1', 'forest:2']) > dealt(['forest:1']), 'Twin Round II: the second shot hits harder');
}
{
  // Rot Round II: a bigger share rots.
  const rot = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-swamp'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    shoot(s.world, s.player, target);
    return getStatusEffect(target.tracksCombat, 'slinger-rot')?.data['damagePerTick'] ?? 0;
  };
  assert.ok(rot(['swamp:1', 'swamp:2']) > rot(['swamp:1']), 'Rot Round II rots for more');
}
{
  // Quake Round II: the wider blast also cracks plating.
  const s = setup({ relic: ['slinger-relic-mountain'], bossesCleared: ['mountain:1', 'mountain:2'], ammo: 1 });
  const target = s.spawn(430, 400);
  target.mitigatesDamage.plating = 40;
  const neighbour = s.spawn(520, 400);
  neighbour.mitigatesDamage.plating = 40;
  const before = neighbour.hasHealth.hp;
  shoot(s.world, s.player, target);
  assert.ok(neighbour.hasHealth.hp < before, 'Quake Round II: the wider blast reaches a farther neighbour');
  assert.ok(getStatusEffect(target.tracksCombat, 'plating-shred'), 'Quake Round II cracks plating');
}
{
  // Splinter Round II: four splinters instead of three.
  const struck = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-cave'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    const others = [1, 2, 3, 4].map((i) => s.spawn(430 + i * 20, 430));
    shoot(s.world, s.player, target);
    return others.filter((m) => m.hasHealth.hp < m.hasHealth.maxHp).length;
  };
  assert.equal(struck(['cave:1']), 3, 'Splinter Round: three splinters');
  assert.equal(struck(['cave:1', 'cave:2']), 4, 'Splinter Round II: four splinters');
}

// ── The new trophies: Hunter's Round and Bounty Round ────────────────────────
{
  const lastRound = (distance: number) => {
    const s = setup({ relic: ['slinger-relic-jungle'], bossesCleared: ['jungle:2'], ammo: 1 });
    const target = s.spawn(400 + distance, 400);
    return shoot(s.world, s.player, target);
  };
  assert.ok(lastRound(300) > lastRound(60), "Hunter's Round hits harder the farther it flies");
}
{
  const s = setup({ relic: ['slinger-relic-desert'], bossesCleared: ['desert:2'], ammo: 2 });
  const healthy = s.spawn(430, 400);
  const wounded = s.spawn(450, 400);
  wounded.hasHealth.hp = Math.round(wounded.hasHealth.maxHp * 0.1);
  shoot(s.world, s.player, healthy);
  shoot(s.world, s.player, wounded);
  assert.ok(!s.world.hasMonster(wounded.isMonster.id), 'Bounty Round finishes a wounded target');
  assert.ok(s.world.hasMonster(healthy.isMonster.id), 'a healthy target is not executed');
}

// ── Jungle and Desert gear ───────────────────────────────────────────────────
{
  // Hunting Rifle: harder at range.
  const dealt = (distance: number) => {
    const s = setup({ passives: { 'slinger.far-pct': 0.5 } });
    return shoot(s.world, s.player, s.spawn(400 + distance, 400));
  };
  assert.ok(dealt(300) > dealt(50), 'Hunting Rifle: rounds hit harder the farther the target is');
  // Glass Duster: hit harder, reload faster.
  const plain = setup();
  const duster = setup({ passives: { 'slinger.damage-pct': 0.15, 'slinger.reload-faster-pct': 0.2 } });
  assert.ok(shoot(duster.world, duster.player, duster.spawn(430, 400)) > shoot(plain.world, plain.player, plain.spawn(430, 400)), 'Glass Duster hits harder');
  assert.ok(resolveReloadTimeMs(duster.player) < resolveReloadTimeMs(plain.player), 'Glass Duster reloads faster');
}
{
  // Lookout: the ambusher that springs while you reload is slowed and revealed.
  const s = setup({ passives: { 'slinger.lookout': 0.4 } });
  const ambusher = s.spawn(450, 400);
  setAggroTarget(s.world, ambusher, { kind: 'player', id: s.player.isPlayer.id }, clock);
  s.player.usesReload!.ammo = 0;
  s.player.usesReload!.reloadingMs = 1_000;
  recordMoment(s.world, s.player, 'ambush');
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok((getStatusEffect(ambusher.tracksCombat, 'ability-slowed')?.data['moveSlowPct'] ?? 0) > 0, 'Lookout slows the ambusher');
  attachComponent(s.world, ambusher, 'isConcealed', { marker: 'stealth', endsAtMs: clock + 5_000 });
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(!isConcealedEntity(ambusher), 'Lookout reveals it');
}
{
  // Undergrowth: Recovery is multiplied while no enemy targets you.
  const s = setup({ passives: { 'slinger.undergrowth': 2 } });
  const monster = s.spawn(900, 900);
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 2, 'Undergrowth doubles Recovery while nothing targets you');
  setAggroTarget(s.world, monster, { kind: 'player', id: s.player.isPlayer.id }, clock);
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 1, 'and not while something does');
}
{
  // Shade: a mark on you ends.
  const s = setup({ passives: { 'slinger.shade': 5_000 } });
  s.player.tracksCombat.statusEffects.push({ id: 'sun-mark', stacks: 1, maxStacks: 1, remainingMs: 10_000, refreshable: false, instanced: false, sourceId: 'x', data: {} });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getStatusEffect(s.player.tracksCombat, 'sun-mark'), undefined, 'Shade ends a mark on you');
}

// ── Gunslinger: twin guns ────────────────────────────────────────────────────
{
  const s = setup({
    discipline: 'slinger-gunslinger', passives: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1600 },
    rack: ['slinger-snare', 'slinger-venom'], clipRules: [{ clip: 'slinger-snare', conditions: [] }],
  });
  assert.ok(loadoutOf(s.player), 'a Slinger with a discipline keeps its Loadout');
  updateReloadArchetype(s.world, 0);
  assert.equal(s.player.usesReload!.ammoMax, 6, 'Gunslinger: the smallest clip (a flat shift)');
  assert.ok(resolveReloadTimeMs(s.player) < 1600, 'Gunslinger: the quickest reload');
  s.player.usesReload!.ammo = s.player.usesReload!.ammoMax;
  updateSlinger(s.world, s.player, 100, clock);
  const target = s.spawn(430, 400);
  shoot(s.world, s.player, target);
  assert.ok(getStatusEffect(target.tracksCombat, 'ability-slowed'), 'the first gun fires Snare');
  assert.equal(getStatusEffect(target.tracksCombat, 'slinger-venom'), undefined, 'and not yet Venom');
  shoot(s.world, s.player, target);
  assert.ok((getStatusEffect(target.tracksCombat, 'slinger-venom')?.stacks ?? 0) > 0, 'the second gun fires Venom: two clip types act at once');
}

// ── Siege: the shell ─────────────────────────────────────────────────────────
{
  const siege = setup({ discipline: 'slinger-siege', passives: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1600 }, ammo: 3 });
  updateReloadArchetype(siege.world, 0);
  assert.equal(siege.player.usesReload!.ammoMax, 16, 'Siege: the biggest clip (a flat shift, +8)');
  assert.ok(resolveReloadTimeMs(siege.player) > 1600, 'Siege: the longest reload');
  siege.player.usesReload!.ammoMax = 3;
  siege.player.usesReload!.ammo = 3;
  const target = siege.spawn(430, 400);
  const neighbour = siege.spawn(480, 400);
  const before = neighbour.hasHealth.hp;
  shoot(siege.world, siege.player, target);
  assert.ok(shellBank(siege.player) > 0, 'every round charges the shell');
  assert.equal(neighbour.hasHealth.hp, before, 'the rounds hit only the target');
  shoot(siege.world, siege.player, target);
  shoot(siege.world, siege.player, target);
  assert.ok(siege.player.usesReload!.reloadingMs > 0, 'the clip is empty: the reload starts');
  assert.equal(shellBank(siege.player), 0, 'the reload fires the shell');
  assert.ok(neighbour.hasHealth.hp < before, 'the shell is an area blast');

  // The shell is made of what was fired: a Venom clip is a gas shell.
  const gas = setup({ discipline: 'slinger-siege', ammo: 2 });
  gas.player.usesReload!.ammoMax = 2;
  const gasTarget = gas.spawn(430, 400);
  const gasNeighbour = gas.spawn(480, 400);
  withClip(gas.player, 'slinger-venom');
  shoot(gas.world, gas.player, gasTarget);
  shoot(gas.world, gas.player, gasTarget);
  assert.ok((getStatusEffect(gasNeighbour.tracksCombat, 'slinger-venom')?.stacks ?? 0) > 0, 'a Venom shell poisons everything in the blast');
}

// ── Trickshot: the called shot ───────────────────────────────────────────────
{
  const s = setup({ discipline: 'slinger-trickshot', ammo: 2 });
  const first = s.spawn(430, 400);
  const elite = s.spawn(470, 420);
  elite.isMonster.isBoss = true;
  const normal = shoot(s.world, s.player, first);
  assert.equal(s.player.usesReload!.ammo, 1, 'the last round is next');
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(s.player.hasAttackTarget?.targetId, elite.isMonster.id, 'the rule picks the elite for the called shot');
  const called = shoot(s.world, s.player, elite);
  assert.ok(called > normal * 2, `the called shot hits much harder (${called} vs ${normal})`);
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(s.player.hasAttackTarget?.targetId, first.isMonster.id, 'the previous target comes back');
}

// ── The HUD's discipline facts ride the networked reload slice (T2-W2) ───────
{
  const twin = setup({
    discipline: 'slinger-gunslinger', rack: ['slinger-snare', 'slinger-venom'], clipRules: [{ clip: 'slinger-snare', conditions: [] }],
  });
  updateSlinger(twin.world, twin.player, 100, clock);
  assert.ok(twin.player.usesReload!.twinClipId, 'Gunslinger: the second gun reaches the networked slice');
  assert.equal(twin.player.usesReload!.shellBank, undefined, 'and no shell bank');

  const siege = setup({ discipline: 'slinger-siege' });
  const target = siege.spawn(430, 400);
  shoot(siege.world, siege.player, target);
  updateSlinger(siege.world, siege.player, 100, clock);
  assert.ok((siege.player.usesReload!.shellBank ?? 0) > 0, 'Siege: the banked shell reaches the networked slice');
  assert.equal(siege.player.usesReload!.twinClipId, undefined, 'and no second gun');

  const plain = setup();
  updateSlinger(plain.world, plain.player, 100, clock);
  assert.equal(plain.player.usesReload!.twinClipId, undefined, 'no discipline: neither field is present');
  assert.equal(plain.player.usesReload!.shellBank, undefined);
}

console.log('slingerT2: ok');
