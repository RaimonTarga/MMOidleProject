/**
 * The Slinger's tier 3 (T3-SLINGER; bible §10.6, §10.16): the nine specializations, the T3 clips
 * and rank-ups, the T3 trophy ranks and the Tundra and Volcanic rounds, and the new gear jobs.
 * Wiring only: attach, shoot, tick, assert observable state. Every number is a placeholder, so
 * nothing here pins a balance value.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  MONSTER_DATABASE,
  SLINGER_KIT,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
  type LoadoutConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { SLINGER_GEAR } from '../../shared/src/data/classGear/slinger';
import { SLINGER_RECOVERY_X, updateSlinger } from '../src/systems/classes/archetypes/reload/slinger';
import { completeReload } from '../src/systems/classes/archetypes/reload/reloadLifecycle';
import { SLINGER_BURN_ID } from '../src/systems/classes/slinger/burn';
import { DEATHMARK_EFFECT_ID, shellBank } from '../src/systems/classes/slinger/shell';
import { entrenchFraction } from '../src/systems/classes/slinger/t3';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { isConcealedEntity } from '../src/systems/combat/invulnerability';
import { applyMonsterSlow, monsterHasLiveRoot, updateMonsterSlows } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
/** Every biome at the end of tier 3 (the Jungle, Desert, Tundra and Volcanic start later, so their level is lower). */
const T3_BIOMES = {
  plains: 18, forest: 18, swamp: 18, mountain: 18, cave: 18, jungle: 12, desert: 12, tundra: 12, volcanic: 12,
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
  rack?: string[];
  clipRules?: LoadoutConfig['clipRules'];
  passives?: Record<string, number>;
  ammo?: number;
}

function setup(opts: Opts = {}) {
  const world = new World();
  const biomes = opts.biomes ?? T3_BIOMES;
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'slinger', name: 'Slinger' },
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
      unlockedSkills: ['reload-root'], passives: {}, selectedClass: 'reload-root',
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
const refill = (player: PlayerEntity, ammo = 8): void => { player.usesReload!.ammo = ammo; player.usesReload!.reloadingMs = 0; };
const status = (m: MonsterEntity, id: string) => getStatusEffect(m.tracksCombat, id);

// ── Kit: the T3 numbers are in the kit and every T3 piece is reachable ────────
{
  const learned = new Set(SLINGER_KIT.lessons.filter((l) => (l.source.kind === 'zone' && l.source.tier === 3)).map((l) => l.pieceId));
  for (const id of ['slinger-stopping', 'slinger-seeker', 'slinger-acid', 'slinger-tracer', 'slinger-tether', 'slinger-frost', 'slinger-incendiary']) {
    assert.ok(learned.has(id), `${id} is a tier 3 lesson`);
  }
}

// ── Stopping II: a stopped charger is also staggered ─────────────────────────
{
  const stopped = (s: Setup) => {
    const target = s.spawn(430, 400);
    target.controlsMonster.chargeRemainingMs = 800;
    withClip(s.player, 'slinger-stopping');
    shoot(s.world, s.player, target);
    return target;
  };
  const two = stopped(setup());
  assert.equal(two.controlsMonster.chargeRemainingMs, 0, 'Stopping II: the charge is stopped');
  assert.ok(status(two, 'stunned'), 'Stopping II: a stopped charger is staggered');
  const one = stopped(setup({ biomes: { ...T3_BIOMES, mountain: 12 } }));
  assert.equal(status(one, 'stunned'), undefined, 'Stopping I does not stagger');
}

// ── Seeker: a target in cover is found, lighter ──────────────────────────────
{
  const s = setup({ rack: ['slinger-seeker'], clipRules: [{ clip: 'slinger-seeker', conditions: [] }] });
  const hidden = s.spawn(430, 400);
  const visible = s.spawn(430, 440);
  updateSlinger(s.world, s.player, 100, clock);
  attachComponent(s.world, hidden, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 10_000 });
  assert.ok(isConcealedEntity(hidden), 'the target burrows');
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(!isConcealedEntity(hidden), 'Seeker: the burrowed target stays a legal target');
  const found = shoot(s.world, s.player, hidden);
  const open = shoot(s.world, s.player, visible);
  assert.ok(found > 0 && found < open, `Seeker: a found target takes lighter rounds (${found} vs ${open})`);
  const plain = setup();
  const other = plain.spawn(430, 400);
  attachComponent(plain.world, other, 'isConcealed', { marker: 'burrow', endsAtMs: clock + 10_000 });
  updateSlinger(plain.world, plain.player, 100, clock);
  assert.ok(isConcealedEntity(other), 'without Seeker the burrowed target stays hidden');
}

// ── Acid: each round eats plating, up to a cap ───────────────────────────────
{
  const s = setup();
  const target = s.spawn(430, 400);
  target.mitigatesDamage.plating = 100;
  withClip(s.player, 'slinger-acid');
  shoot(s.world, s.player, target);
  const first = status(target, 'plating-shred')?.data['platingReduction'] ?? 0;
  assert.ok(first > 0, 'Acid eats plating');
  for (let i = 0; i < 6; i++) shoot(s.world, s.player, target);
  const later = status(target, 'plating-shred')?.data['platingReduction'] ?? 0;
  assert.ok(later >= first, 'Acid keeps eating');
  assert.ok(later <= 100 * 0.6 + 1, 'but stops past a cap');
  assert.equal(status(target, 'slinger-venom'), undefined, 'Acid is not poison');
}

// ── Tracer II: a traced target that flees moves slower ───────────────────────
{
  const slowed = (s: Setup) => {
    const target = s.spawn(430, 400);
    withClip(s.player, 'slinger-tracer');
    shoot(s.world, s.player, target);
    attachComponent(s.world, target, 'isMoving', { motion: { direction: { x: 1, y: 0 }, magnitude: 100 } });
    updateSlinger(s.world, s.player, 100, clock);
    return status(target, 'ability-slowed');
  };
  assert.ok(slowed(setup()), 'Tracer II: the fleeing traced target is slowed');
  assert.equal(slowed(setup({ biomes: { ...T3_BIOMES, jungle: 5 } })), undefined, 'Tracer I does not');
  const s = setup();
  const target = s.spawn(430, 400);
  withClip(s.player, 'slinger-tracer');
  shoot(s.world, s.player, target);
  attachComponent(s.world, target, 'isMoving', { motion: { direction: { x: -1, y: 0 }, magnitude: 100 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(status(target, 'ability-slowed'), undefined, 'a traced target coming at you is not slowed');
}

// ── Tether: rounds in a row hold a target that tries to get away ─────────────
{
  const s = setup();
  const target = s.spawn(430, 400);
  withClip(s.player, 'slinger-tether');
  attachComponent(s.world, target, 'isMoving', { motion: { direction: { x: 1, y: 0 }, magnitude: 100 } });
  shoot(s.world, s.player, target);
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(!monsterHasLiveRoot(target), 'one round does not tether');
  shoot(s.world, s.player, target);
  shoot(s.world, s.player, target);
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(monsterHasLiveRoot(target), 'Tether: a target hit by several rounds in a row cannot get away');
}

// ── Frost: chill builds to a cap and never freezes ───────────────────────────
{
  const s = setup();
  const target = s.spawn(430, 400);
  withClip(s.player, 'slinger-frost');
  for (let i = 0; i < 3; i++) shoot(s.world, s.player, target);
  assert.equal(status(target, 'dot-chill')?.stacks, 3, 'Frost: each round chills');
  assert.ok(target.hasChill !== undefined, 'the chill marker is on');
  updateMonsterSlows(s.world);
  assert.ok((target.hasStatus.monsterMoveSpeedMult ?? 1) < 1, 'Frost: the chill slows movement');
  assert.ok((target.hasStatus.monsterAttackCooldownMult ?? 1) > 1, 'and attacks');
  for (let i = 0; i < 10; i++) shoot(s.world, s.player, target);
  assert.ok((status(target, 'dot-chill')?.stacks ?? 0) <= 5, 'the chill stops growing');
  assert.equal(status(target, 'dot-frozen'), undefined, 'Frost never freezes');
  target.tracksCombat.statusEffects = target.tracksCombat.statusEffects.filter((e) => e.id !== 'dot-chill');
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(target.hasChill, undefined, 'the marker leaves with the chill');
}

// ── Incendiary: a burn that builds to a cap and ticks ────────────────────────
{
  const s = setup();
  const target = s.spawn(430, 400);
  withClip(s.player, 'slinger-incendiary');
  for (let i = 0; i < 2; i++) shoot(s.world, s.player, target);
  assert.equal(status(target, SLINGER_BURN_ID)?.stacks, 2, 'Incendiary: each round adds burn');
  const before = target.hasHealth.hp;
  updateSlinger(s.world, s.player, 1_100, clock);
  assert.ok(target.hasHealth.hp < before, 'the burn ticks');
  for (let i = 0; i < 12; i++) shoot(s.world, s.player, target);
  assert.ok((status(target, SLINGER_BURN_ID)?.stacks ?? 0) <= 5, 'the burn stops growing');
}

// ── Trophy ranks ─────────────────────────────────────────────────────────────
{
  // Quake Round III: it knocks down.
  const quake = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-mountain'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    const neighbour = s.spawn(480, 400);
    shoot(s.world, s.player, target);
    return { target, neighbour };
  };
  const three = quake(['mountain:1', 'mountain:2', 'mountain:3']);
  assert.ok(status(three.target, 'stunned') && status(three.neighbour, 'stunned'), 'Quake Round III knocks the blast down');
  assert.equal(status(quake(['mountain:1', 'mountain:2']).target, 'stunned'), undefined, 'Quake Round II does not');
}
{
  // Splinter Round III: each splinter splits once more.
  const struck = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-cave'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    const ring = [1, 2, 3, 4, 5, 6].map((i) => s.spawn(430 + i * 25, 430));
    shoot(s.world, s.player, target);
    return ring.filter((m) => m.hasHealth.hp < m.hasHealth.maxHp).length;
  };
  assert.ok(struck(['cave:1', 'cave:2', 'cave:3']) > struck(['cave:1', 'cave:2']), 'Splinter Round III: the splinters split once more');
}
{
  // Rot Round III: a bigger share still.
  const rot = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-swamp'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    shoot(s.world, s.player, target);
    return status(target, 'slinger-rot')?.data['damagePerTick'] ?? 0;
  };
  assert.ok(rot(['swamp:1', 'swamp:2', 'swamp:3']) > rot(['swamp:1', 'swamp:2']), 'Rot Round III rots for more');
}
{
  // Hunter's Round II hits harder at range than Hunter's Round.
  const dealt = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-jungle'], bossesCleared: cleared, ammo: 1 });
    return shoot(s.world, s.player, s.spawn(700, 400));
  };
  assert.ok(dealt(['jungle:2', 'jungle:3']) > dealt(['jungle:2']), "Hunter's Round II hits harder the farther it flies");
}
{
  // Bounty Round II: a higher threshold.
  const executed = (cleared: string[]) => {
    const s = setup({ relic: ['slinger-relic-desert'], bossesCleared: cleared, ammo: 1 });
    const target = s.spawn(430, 400);
    target.hasHealth.hp = Math.round(target.hasHealth.maxHp * 0.2);
    shoot(s.world, s.player, target);
    return !s.world.hasMonster(target.isMonster.id);
  };
  assert.ok(executed(['desert:2', 'desert:3']), 'Bounty Round II executes at a higher threshold');
  assert.ok(!executed(['desert:2']), 'Bounty Round I does not at that health');
}
{
  // Rime Round (Tundra): frozen ground that slows enemies on it.
  const s = setup({ relic: ['slinger-relic-tundra'], bossesCleared: ['tundra:3'], ammo: 1 });
  const target = s.spawn(430, 400);
  const near = s.spawn(480, 400);
  const far = s.spawn(430, 900);
  shoot(s.world, s.player, target);
  updateSlinger(s.world, s.player, 100, clock);
  assert.ok(status(near, 'ability-slowed'), 'Rime Round: an enemy on the frozen ground is slowed');
  assert.equal(status(far, 'ability-slowed'), undefined, 'one far from it is not');
}
{
  // Cinder Round (Volcanic): everything around the target burns.
  const s = setup({ relic: ['slinger-relic-volcanic'], bossesCleared: ['volcanic:3'], ammo: 1 });
  const target = s.spawn(430, 400);
  const near = s.spawn(480, 400);
  const far = s.spawn(430, 900);
  shoot(s.world, s.player, target);
  assert.ok(status(target, SLINGER_BURN_ID) && status(near, SLINGER_BURN_ID), 'Cinder Round sets the target and its neighbours burning');
  assert.equal(status(far, SLINGER_BURN_ID), undefined, 'but not the far enemy');
}

// ── Gunslinger specializations ───────────────────────────────────────────────
const GUNSLINGER = 'slinger-gunslinger';
const SIEGE = 'slinger-siege';
const TRICKSHOT = 'slinger-trickshot';
const TWIN = { rack: ['slinger-snare', 'slinger-venom'], clipRules: [{ clip: 'slinger-snare', conditions: [] }] };
{
  // Fan the Hammer: after a reload the first rounds fire at triple rate, then it ends.
  const s = setup({ discipline: GUNSLINGER, specialization: 'slinger-fan-the-hammer', ...TWIN });
  const target = s.spawn(430, 400);
  s.player.usesReload!.ammo = 0;
  completeReload(s.world, s.player);
  const fan = getStatusEffect(s.player.tracksCombat, 'slinger-fan-the-hammer');
  assert.ok(fan && (fan.data['attackHastePct'] ?? 0) >= 2, 'Fan the Hammer: after the reload spin the cadence is hasted');
  for (let i = 0; i < 6; i++) shoot(s.world, s.player, target);
  assert.equal(getStatusEffect(s.player.tracksCombat, 'slinger-fan-the-hammer'), undefined, 'and it ends after the first rounds');
  const plain = setup({ discipline: GUNSLINGER, ...TWIN });
  plain.player.usesReload!.ammo = 0;
  completeReload(plain.world, plain.player);
  assert.equal(getStatusEffect(plain.player.tracksCombat, 'slinger-fan-the-hammer'), undefined, 'without the specialization there is no burst');
}
{
  // Crossfire: two guns back to back on one target take both effects harder.
  const venomTick = (spec: string | undefined) => {
    const s = setup({ discipline: GUNSLINGER, ...(spec ? { specialization: spec } : {}), ...TWIN });
    updateSlinger(s.world, s.player, 100, clock);
    const target = s.spawn(430, 400);
    shoot(s.world, s.player, target); // gun A: Snare
    shoot(s.world, s.player, target); // gun B: Venom, straight after
    return status(target, 'slinger-venom')?.data['damagePerTick'] ?? 0;
  };
  assert.ok(venomTick('slinger-crossfire') > venomTick(undefined), 'Crossfire: the pair lands harder');
}
{
  // Gun Kata: up close, much harder, and both guns at once.
  const dealt = (spec: string | undefined) => {
    const s = setup({ discipline: GUNSLINGER, ...(spec ? { specialization: spec } : {}), ...TWIN });
    updateSlinger(s.world, s.player, 100, clock);
    const target = s.spawn(430, 400);
    shoot(s.world, s.player, target);
    return { hurt: 1_000_000 - target.hasHealth.hp, target };
  };
  const kata = dealt('slinger-gun-kata');
  assert.ok(kata.hurt > dealt(undefined).hurt * 1.5, 'Gun Kata: rounds hit much harder up close');
  assert.ok(status(kata.target, 'slinger-venom') && status(kata.target, 'ability-slowed'), 'Gun Kata: both guns fire at an enemy in melee');
}

// ── Siege specializations ────────────────────────────────────────────────────
{
  // Deathmark: rounds mark; the shell bursts on every marked enemy.
  const run = (spec: string | undefined) => {
    const s = setup({ discipline: SIEGE, ...(spec ? { specialization: spec } : {}), ammo: 2 });
    s.player.usesReload!.ammoMax = 2;
    const a = s.spawn(430, 400);
    const b = s.spawn(400, 640);
    shoot(s.world, s.player, b);
    shoot(s.world, s.player, a);
    return { a, b, s };
  };
  const mark = run('slinger-deathmark');
  assert.equal(shellBank(mark.s.player), 0, 'Deathmark: the reload fires the shell');
  assert.equal(status(mark.b, DEATHMARK_EFFECT_ID), undefined, 'the marks are spent');
  const marked = 1_000_000 - mark.b.hasHealth.hp;
  const unmarked = 1_000_000 - run(undefined).b.hasHealth.hp;
  assert.ok(marked > unmarked, `Deathmark: the shell reaches a marked enemy far from the last round (${marked} vs ${unmarked})`);
  // One mark per enemy: a second round renews, never stacks.
  const s2 = setup({ discipline: SIEGE, specialization: 'slinger-deathmark' });
  const t = s2.spawn(430, 400);
  shoot(s2.world, s2.player, t);
  shoot(s2.world, s2.player, t);
  assert.equal(status(t, DEATHMARK_EFFECT_ID)?.stacks, 1, 'one mark per enemy');
}
{
  // Entrenched: standing ramps fire rate and the shell; moving resets it.
  const s = setup({ discipline: SIEGE, specialization: 'slinger-entrenched' });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(entrenchFraction(s.player), 0, 'just arrived: no ramp');
  clock += 4_000;
  updateSlinger(s.world, s.player, 100, clock);
  const half = entrenchFraction(s.player);
  assert.ok(half > 0 && half < 1, 'standing ramps it');
  assert.ok((getStatusEffect(s.player.tracksCombat, 'slinger-entrenched')?.data['attackHastePct'] ?? 0) > 0, 'Entrenched: fires faster the longer you stand');
  clock += 10_000;
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(entrenchFraction(s.player), 1, 'to a cap');
  attachComponent(s.world, s.player, 'isMoving', { motion: { direction: { x: 1, y: 0 }, magnitude: 10 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(entrenchFraction(s.player), 0, 'moving resets it');
  assert.equal(getStatusEffect(s.player.tracksCombat, 'slinger-entrenched'), undefined, 'and the haste with it');
}
{
  // Rolling Fire: a small shell every few rounds; the reload carries none.
  const s = setup({ discipline: SIEGE, specialization: 'slinger-rolling-fire', ammo: 8 });
  const target = s.spawn(430, 400);
  const neighbour = s.spawn(480, 400);
  const before = neighbour.hasHealth.hp;
  shoot(s.world, s.player, target);
  shoot(s.world, s.player, target);
  assert.ok(shellBank(s.player) > 0 && neighbour.hasHealth.hp === before, 'two rounds: the shell is still charging');
  shoot(s.world, s.player, target);
  assert.equal(shellBank(s.player), 0, 'Rolling Fire: a small shell goes off every few rounds');
  assert.ok(neighbour.hasHealth.hp < before, 'and it is an area blast');
  assert.equal(s.player.usesReload!.reloadingMs, 0, 'the clip is not empty yet');
  s.player.usesReload!.ammo = 1;
  shoot(s.world, s.player, target);
  assert.equal(shellBank(s.player), 0, 'the reload carries none');
}

// ── Trickshot specializations ────────────────────────────────────────────────
{
  // Ricochet: the called shot bounces on to two more enemies.
  const s = setup({ discipline: TRICKSHOT, specialization: 'slinger-ricochet', ammo: 1 });
  const elite = s.spawn(430, 400);
  elite.isMonster.isBoss = true;
  const others = [s.spawn(470, 430), s.spawn(480, 380), s.spawn(500, 400)];
  shoot(s.world, s.player, elite);
  const hit = others.filter((m) => m.hasHealth.hp < m.hasHealth.maxHp).length;
  assert.equal(hit, 2, 'Ricochet: the called shot bounces on to two more enemies');
}
{
  // Pierce: everything between you and the target takes the shot in full.
  const s = setup({ discipline: TRICKSHOT, specialization: 'slinger-pierce', ammo: 1 });
  const target = s.spawn(520, 400);
  target.isMonster.isBoss = true;
  const between = s.spawn(460, 405);
  const aside = s.spawn(460, 520);
  const dealt = shoot(s.world, s.player, target);
  assert.equal(1_000_000 - between.hasHealth.hp, dealt, 'Pierce: an enemy in the way takes the shot in full');
  assert.equal(aside.hasHealth.hp, aside.hasHealth.maxHp, 'one off the line does not');
}
{
  // Deadeye: the last round waits for the moment (or a few seconds), then hits much harder.
  const s = setup({ discipline: TRICKSHOT, specialization: 'slinger-deadeye', ammo: 1 });
  const target = s.spawn(430, 400);
  assert.equal(shoot(s.world, s.player, target), 0, 'Deadeye: with no moment the last round waits');
  assert.equal(s.player.usesReload!.ammo, 1, 'the clip is paused, the round is still chambered');
  const elite = s.spawn(450, 440);
  elite.isMonster.isBoss = true;
  const held = shoot(s.world, s.player, elite);
  assert.ok(held > 0, 'an elite appears: the round flies');
  const plain = setup({ discipline: TRICKSHOT, ammo: 1 });
  const e2 = plain.spawn(450, 440);
  e2.isMonster.isBoss = true;
  const unheld = shoot(plain.world, plain.player, e2);
  assert.ok(held > unheld * 1.3, `a held round hits much harder (${held} vs ${unheld})`);
  // A few seconds and it goes anyway.
  const slow = setup({ discipline: TRICKSHOT, specialization: 'slinger-deadeye', ammo: 1 });
  const lone = slow.spawn(430, 400);
  assert.equal(shoot(slow.world, slow.player, lone), 0, 'waiting');
  clock += 6_000;
  assert.ok(shoot(slow.world, slow.player, lone) > 0, 'Deadeye: after a few seconds the round goes');
}

// ── Tundra and Volcanic gear ─────────────────────────────────────────────────
{
  // Frostlock Rifle: harder against chilled, slowed or rooted enemies.
  const s = setup({ passives: { 'slinger.cold-pct': 0.4 } });
  const cold = s.spawn(430, 400);
  const warm = s.spawn(430, 440);
  applyMonsterSlow(s.world, cold, 0.3, 5_000, 'x');
  assert.ok(shoot(s.world, s.player, cold) > shoot(s.world, s.player, warm), 'Frostlock Rifle: a slowed enemy takes more');
}
{
  // Firebrand Pistol: each step of the Heat makes rounds hit harder.
  const s = setup({ passives: { 'slinger.heat-pct': 0.03 } });
  const target = s.spawn(430, 400);
  const cool = shoot(s.world, s.player, target);
  const heat = applyStatusEffect(s.player.tracksCombat, { id: VOLCANIC_HEAT_EFFECT_ID, maxStacks: 0, remainingMs: -1, sourceId: 'node', data: {} });
  heat.stacks = 10;
  assert.ok(shoot(s.world, s.player, target) > cool, 'Firebrand Pistol: Heat adds damage');
}
{
  // Warm Hands: the Chill does not build while you reload.
  const chilled = (passive: boolean) => {
    const s = setup({ passives: passive ? { 'slinger.warm-hands': 1 } : {} });
    const chill = applyStatusEffect(s.player.tracksCombat, { id: TUNDRA_CHILL_EFFECT_ID, maxStacks: 6, remainingMs: -1, sourceId: 'node', data: {} });
    chill.stacks = 2;
    updateSlinger(s.world, s.player, 100, clock);
    s.player.usesReload!.ammo = 0;
    s.player.usesReload!.reloadingMs = 1_000;
    chill.stacks = 5;
    updateSlinger(s.world, s.player, 100, clock);
    return chill.stacks;
  };
  assert.equal(chilled(true), 2, 'Warm Hands: the Chill held at what it was');
  assert.equal(chilled(false), 5, 'without it the Chill builds');
}
{
  // Thaw: Recovery doubles while chilled; Heatsink: it rises with the Heat while nothing is near.
  const s = setup({ passives: { 'slinger.thaw': 2 } });
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 1, 'not chilled: no change');
  const chill = applyStatusEffect(s.player.tracksCombat, { id: TUNDRA_CHILL_EFFECT_ID, maxStacks: 6, remainingMs: -1, sourceId: 'node', data: {} });
  chill.stacks = 2;
  updateSlinger(s.world, s.player, 100, clock);
  assert.equal(getResource(s.player.tracksCombat, SLINGER_RECOVERY_X), 2, 'Thaw: chilled, Recovery doubles');

  const h = setup({ passives: { 'slinger.heatsink': 0.1 } });
  const heat = applyStatusEffect(h.player.tracksCombat, { id: VOLCANIC_HEAT_EFFECT_ID, maxStacks: 0, remainingMs: -1, sourceId: 'node', data: {} });
  heat.stacks = 5;
  updateSlinger(h.world, h.player, 100, clock);
  assert.ok(getResource(h.player.tracksCombat, SLINGER_RECOVERY_X) > 1, 'Heatsink: Recovery rises with the Heat while nothing is near');
  const monster = h.spawn(450, 400);
  void monster;
  updateSlinger(h.world, h.player, 100, clock);
  assert.equal(getResource(h.player.tracksCombat, SLINGER_RECOVERY_X), 1, 'and not with an enemy near');
}
{
  // Asbestos Coat: the Heat's extra damage does not apply while you reload.
  const taken = (passive: boolean, reloading: boolean) => {
    const s = setup({ passives: passive ? { 'slinger.asbestos': 1 } : {} });
    const heat = applyStatusEffect(s.player.tracksCombat, {
      id: VOLCANIC_HEAT_EFFECT_ID, maxStacks: 0, remainingMs: -1, sourceId: 'node', data: { damageTakenPct: 0.02 },
    });
    heat.stacks = 10;
    if (reloading) { s.player.usesReload!.ammo = 0; s.player.usesReload!.reloadingMs = 1_000; }
    const monster = s.spawn(450, 400);
    const ctx = makeCombatContext(monster, 'monster', s.player, 'player');
    ctx.damage = 1_000;
    emitCombatEvent('onDamageTaken', ctx, s.world);
    return ctx.damage;
  };
  const without = taken(false, true);
  const coat = taken(true, true);
  assert.ok(coat < without, `Asbestos Coat: the Heat's share is gone while reloading (${coat} vs ${without})`);
  assert.equal(taken(true, false), without, 'and it applies when you are not reloading');
}

// ── Gear: no T3 job is left dead ─────────────────────────────────────────────
{
  const dead: string[] = [];
  for (const weapon of SLINGER_GEAR.weapons) {
    if (weapon.tier <= 3 && Object.keys(weapon.mechanicEffects ?? {}).length === 0) dead.push(weapon.id);
  }
  for (const [id, line] of Object.entries(SLINGER_GEAR.lines)) {
    if (/-t[23]$/.test(id) && Object.keys(line.effects).length === 0) dead.push(id);
  }
  assert.deepEqual(dead, [], 'no tier 2 or 3 gear job is empty');
}

console.log('slingerT3: ok');
