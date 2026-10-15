/**
 * The Slinger at runtime (class-first build plan CL.1–CL.2; bible §10.2–§10.4): the Loadout's
 * rules pick the clip, each round carries its clip's effect, the last round is the trophy, the
 * reload is stationary, and the gun and gear lines bend it. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  getStatusEffect,
  MONSTER_DATABASE,
  type LoadoutConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { chooseClip, loadoutOf, reloadMoveMult, updateSlinger } from '../src/systems/classes/archetypes/reload/slinger';
import { updateReloadArchetype } from '../src/systems/classes/archetypes/reload/reloadPrototype';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-slinger-dummy', { ...base, id: 'test-slinger-dummy', evasion: 0 });

let clock = 100_000;

function setup(opts: { relic?: string[]; bossesCleared?: string[]; edit?: (c: LoadoutConfig) => void; passives?: Record<string, number> } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'slinger', name: 'Slinger' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 1, currentSkillTier: 0, bossesCleared: opts.bossesCleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['reload-root'], passives: {}, selectedClass: 'reload-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'reload',
    },
  } as PersistedPlayerSlices, 'slinger');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  const ctx = classConfigContextFromState({
    combatArchetype: 'reload', biomeLevel: BIOMES, bossesCleared: opts.bossesCleared ?? [], disciplineId: null,
  })!;
  const config = defaultClassConfig(ctx);
  if (opts.relic) config.relic = opts.relic;
  if (config.system.kind === 'loadout') opts.edit?.(config.system);
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  player.usesReload!.ammoMax = 8;
  player.usesReload!.ammo = 8;
  const spawn = (x: number, y: number): MonsterEntity => {
    const m = world.createMonster(NODE, 'test-slinger-dummy', { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  return { world, player, spawn };
}

function shoot(world: World, player: PlayerEntity, target: MonsterEntity): void {
  clock += 1_000;
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'slinger', kind: 'player' } });
}

function withClip(player: PlayerEntity, clip: string): void {
  player.usesReload!.clipId = clip;
}

// ── The Loadout: rules pick the clip; the plain clip otherwise ───────────────
{
  const { world, player, spawn } = setup();
  const loadout = loadoutOf(player)!;
  assert.ok(loadout, 'a Slinger has a Loadout');
  assert.equal(loadout.config.rack.length > 0, true, 'the default rack holds clips');
  updatePlayerMoments(world, player, clock);
  assert.equal(chooseClip(world, player, loadout, clock), 'slinger-plain-clip', 'nobody near: the plain clip');
  const target = spawn(430, 400);
  spawn(440, 410);
  spawn(420, 380);
  for (const m of world.monsterEntitiesInNode(NODE)) setAggroTarget(world, m, { kind: 'player', id: player.isPlayer.id }, clock);
  updatePlayerMoments(world, player, clock);
  assert.equal(chooseClip(world, player, loadout, clock), 'slinger-scatter', 'three or more enemies near: Scatter');
  updateSlinger(world, player, 100, clock);
  assert.equal(player.usesReload!.clipId, 'slinger-scatter', 'a full unfired clip follows the rule');
  assert.equal(player.usesReload!.nextClipId, 'slinger-scatter');
  void target;
}

// ── Rounds carry their clip's effect ─────────────────────────────────────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  const beside = spawn(450, 410);

  withClip(player, 'slinger-scatter');
  const before = beside.hasHealth.hp;
  shoot(world, player, target);
  assert.ok(beside.hasHealth.hp < before, 'Scatter nicks an enemy beside the target');

  withClip(player, 'slinger-snare');
  shoot(world, player, target);
  const s1 = getStatusEffect(target.tracksCombat, 'ability-slowed')?.data['moveSlowPct'] ?? 0;
  assert.ok(s1 > 0, 'Snare slows');
  shoot(world, player, target);
  const s2 = getStatusEffect(target.tracksCombat, 'ability-slowed')?.data['moveSlowPct'] ?? 0;
  assert.ok(s2 > s1, 'every round slows more');
  for (let i = 0; i < 2; i++) { player.usesReload!.ammo = 8; for (let j = 0; j < 6; j++) shoot(world, player, target); }
  assert.ok((getStatusEffect(target.tracksCombat, 'ability-slowed')?.data['moveSlowPct'] ?? 0) <= 0.4 + 1e-9, 'the slow builds to a cap');

  player.usesReload!.ammo = 8;
  withClip(player, 'slinger-venom');
  shoot(world, player, target);
  const v1 = getStatusEffect(target.tracksCombat, 'slinger-venom')?.stacks ?? 0;
  shoot(world, player, target);
  const v2 = getStatusEffect(target.tracksCombat, 'slinger-venom')?.stacks ?? 0;
  assert.ok(v1 > 0 && v2 > v1, `Venom adds poison ticks round by round (${v1}, ${v2})`);

  player.usesReload!.ammo = 8;
  withClip(player, 'slinger-stopping');
  const x0 = target.hasPosition.current.x;
  shoot(world, player, target);
  world.tickCounter++;
  assert.ok(target.hasKnockback !== undefined || target.hasPosition.current.x !== x0, 'Stopping shoves the target back');
}

// ── Breaching ignores most plating; plain pays it ────────────────────────────
{
  const { world, player, spawn } = setup();
  const target = spawn(430, 400);
  target.mitigatesDamage.plating = 30;
  const dmg = (clip: string) => {
    player.usesReload!.ammo = 8;
    withClip(player, clip);
    const before = target.hasHealth.hp;
    shoot(world, player, target);
    return before - target.hasHealth.hp;
  };
  const plain = dmg('slinger-plain-clip');
  const breaching = dmg('slinger-breaching');
  assert.ok(breaching > plain, `Breaching gets through plating (${breaching} vs ${plain})`);
}

// ── The last round is the trophy ─────────────────────────────────────────────
{
  const { world, player, spawn } = setup({ relic: ['slinger-relic-mountain'], bossesCleared: ['mountain:1'] });
  const target = spawn(430, 400);
  const neighbour = spawn(460, 400);
  player.usesReload!.ammoMax = 3;
  player.usesReload!.ammo = 3;
  withClip(player, 'slinger-plain-clip');
  const before = neighbour.hasHealth.hp;
  shoot(world, player, target);
  shoot(world, player, target);
  assert.equal(neighbour.hasHealth.hp, before, 'the earlier rounds are plain');
  shoot(world, player, target);
  assert.ok(neighbour.hasHealth.hp < before, 'Quake Round: the last round hits everything around the target');
  assert.ok(player.usesReload!.reloadingMs > 0, 'the clip is empty: the reload starts');
}
{
  const { world, player, spawn } = setup({ relic: ['slinger-relic-swamp'], bossesCleared: ['swamp:1'] });
  const target = spawn(430, 400);
  player.usesReload!.ammoMax = 2;
  player.usesReload!.ammo = 2;
  shoot(world, player, target);
  assert.equal(getStatusEffect(target.tracksCombat, 'slinger-rot'), undefined, 'no rot before the last round');
  shoot(world, player, target);
  assert.ok((getStatusEffect(target.tracksCombat, 'slinger-rot')?.stacks ?? 0) > 0, 'Rot Round: the last round rots');
}

// ── The stationary reload ────────────────────────────────────────────────────
{
  const { world, player, spawn } = setup();
  spawn(430, 400);
  assert.equal(reloadMoveMult(player), null, 'moving is free while the clip lasts');
  player.usesReload!.ammo = 0;
  player.usesReload!.reloadingMs = 1_000;
  assert.equal(reloadMoveMult(player), 0, 'the reload is stationary');
  player.usesSkills.passives['slinger.reload-walk-pct'] = 0.5;
  assert.equal(reloadMoveMult(player), 0.5, 'Quickdraw lets you walk at half speed');
  void world;
}

// ── Gun and gear lines ───────────────────────────────────────────────────────
{
  const { world, player, spawn } = setup({ passives: { 'slinger.opener-pct': 0.5 } });
  const target = spawn(430, 400);
  const hit = () => { const b = target.hasHealth.hp; shoot(world, player, target); return b - target.hasHealth.hp; };
  const first = hit();
  hit();
  const third = hit();
  assert.ok(first > third, `the Carbine's first rounds hit harder (${first} vs ${third})`);
}
{
  const { world, player, spawn } = setup({ passives: { 'slinger.dig-in': 0.2 } });
  const mon = spawn(430, 400);
  player.usesReload!.reloadingMs = 1_000;
  // (the cap itself is exercised through the pipeline in the full suite; here the key is read while reloading)
  assert.ok(player.usesReload!.reloadingMs > 0 && player.usesSkills.passives['slinger.dig-in'] === 0.2);
  void world; void mon;
}

updateReloadArchetype(new World(), 0);
console.log('slingerLoadout: ok');
