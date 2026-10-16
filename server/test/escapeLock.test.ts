/**
 * Escape locks (OV-HOOKS item 1; bible §8.9 Undertow, §10.16 Tether and Harpoon Round): while a
 * player holds a boss against getting away, a pattern step that would dive, burrow, flee or dash
 * away is refused and the pattern stops where it stands; the three class pieces lay the hold.
 * Wiring only: synthetic patterns on a dummy body, placeholders, no balance.
 *
 * Run: node --conditions=development --import tsx test/escapeLock.test.ts
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  MONSTER_DATABASE,
  type BossPattern,
  type ResponsesConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { lockMonsterEscape, monsterEscapeLocked, updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { addResolve, updateSquire } from '../src/systems/classes/archetypes/cooldown/squire';
import { tetherFor, tetherHit } from '../src/systems/classes/slinger/t3';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;

const BURROW: BossPattern = {
  id: 'test-lock-burrow', name: 'Burrow', damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 0,
  steps: [
    { kind: 'cast', name: 'Dig', castMs: 300 },
    { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 2000, relocate: 'near-target', travelSpeed: 200 },
    { kind: 'impact', name: 'Erupt', anchor: 'self', radius: 100, telegraphMs: 500, damageMult: 1 },
    { kind: 'recovery', label: 'Spent', durationMs: 500 },
  ],
};
const BLINK: BossPattern = {
  id: 'test-lock-blink', name: 'Blink', damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 0,
  steps: [
    { kind: 'conceal', name: 'Blink', marker: 'stealth', durationMs: 1500, relocate: 'leash-edge' },
    { kind: 'recovery', label: 'Spent', durationMs: 500 },
  ],
};
const SAND_STEP: BossPattern = {
  id: 'test-lock-dash', name: 'Sand Step', damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 0,
  stoppedBy: { root: { staggerMs: 1500, label: 'Pinned' } },
  steps: [{ kind: 'dash', name: 'Sand Step', direction: 'away', speed: 600, distance: 460, maxTravelMs: 1000 }],
};
const FLEE: BossPattern = {
  id: 'test-lock-flee', name: 'Escape', damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 0,
  steps: [
    { kind: 'escape-guard', name: 'Flee', castMs: 3000, sourceId: 'test-lock-escape', shieldPct: 0.05,
      onBreak: { staggerMs: 1000, label: 'Caught' }, flee: { speed: 500, escapeDistance: 5000 } },
    { kind: 'recovery', label: 'Spent', durationMs: 500 },
  ],
};
const define = (id: string, pattern: BossPattern, extra: Record<string, unknown> = {}): void => {
  MONSTER_DATABASE.set(id, { ...base, id, evasion: 0, bossPattern: pattern, ...extra } as never);
};
define('test-lock-burrower', BURROW);
define('test-lock-blinker', BLINK);
define('test-lock-dasher', SAND_STEP);
define('test-lock-dasher-immune', SAND_STEP, { controlImmune: true });
define('test-lock-fleer', FLEE);

let clock = 100_000;

function playerSlices(id: string, archetype: string | null, biomes: Record<string, number> = {}, bossesCleared: string[] = []): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: biomes,
      playerTier: 4, currentSkillTier: 0, bossesCleared, clearedNodes: [], runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype ? [`${archetype}-root`] : [], passives: {}, selectedClass: archetype ? `${archetype}-root` : null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: archetype as never,
    },
  } as PersistedPlayerSlices;
}

function arena(typeId: string): { world: World; player: PlayerEntity; boss: MonsterEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('hunter', null), 'hunter');
  const boss = world.createMonster(NODE, typeId, { x: 600, y: 400 })!;
  boss.hasHealth.hp = boss.hasHealth.maxHp = 100_000;
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, clock);
  boss.hasAwareness.state = 'attacking';
  return { world, player, boss };
}

function tick(world: World, ticks = 1): void {
  for (let i = 0; i < ticks; i++) {
    clock += 100;
    updateBossPatterns(world, 100, clock);
  }
}

const stoppedEvents = (world: World): number =>
  world.takeNodeEvents(NODE).filter((event) => event.kind === 'boss-pattern-stopped').length;

// 1. Unheld, the burrower goes under; held against escape, the dive is refused and the pattern stops.
{
  const { world, boss } = arena('test-lock-burrower');
  tick(world, 1);
  assert.ok(boss.runsBossPattern, 'the burrow pattern arms');
  tick(world, 4);
  assert.ok(boss.isConcealed, 'unheld, it burrows');
}
{
  const { world, boss } = arena('test-lock-burrower');
  tick(world, 1);
  assert.ok(boss.runsBossPattern && !boss.isConcealed, 'winding up the dig');
  lockMonsterEscape(boss, 'escape', 3000, clock);
  world.takeNodeEvents(NODE);
  tick(world, 4);
  assert.equal(boss.isConcealed, undefined, 'held, it cannot burrow');
  assert.equal(boss.runsBossPattern, undefined, 'and the pattern stops');
  assert.equal(boss.recoversFromPattern, undefined, 'no stoppedBy.root and no lock stagger: no window');
  assert.equal(stoppedEvents(world), 1, 'the stop is announced');
}
{
  // The lock's own stagger is the window when the pattern authors no root answer (Undertow's).
  const { world, boss } = arena('test-lock-burrower');
  lockMonsterEscape(boss, 'escape', 3000, clock, 800);
  tick(world, 5);
  assert.equal(boss.isConcealed, undefined, 'a held boss never goes under');
  assert.equal(boss.recoversFromPattern?.label, 'Held', 'and staggers for the lock');
  assert.equal(boss.recoversFromPattern?.fromStagger, true, 'with the stopped tell');
}
{
  // The hold wears off: after it the boss burrows again on its next run.
  const { world, boss } = arena('test-lock-burrower');
  lockMonsterEscape(boss, 'escape', 200, clock);
  assert.ok(monsterEscapeLocked(boss, 'escape', clock), 'held');
  assert.ok(!monsterEscapeLocked(boss, 'escape', clock + 300), 'only for its duration');
  tick(world, 5);
  assert.ok(boss.isConcealed, 'a lock that lapsed before the dive does not stop it');
}

// 2. Tether's lock: a dash away is refused (with the pattern's root answer); a travelling burrow is not.
{
  const { world, boss } = arena('test-lock-dasher');
  lockMonsterEscape(boss, 'dash', 2000, clock);
  tick(world, 2);
  assert.equal(boss.runsBossPattern, undefined, 'a tethered boss cannot dash away');
  assert.equal(boss.recoversFromPattern?.label, 'Pinned', "the pattern's own root answer is the window");
}
{
  const { world, boss } = arena('test-lock-dasher');
  tick(world, 2);
  assert.ok(boss.runsBossPattern && boss.isMoving, 'untethered, it dashes away');
}
{
  const { world, boss } = arena('test-lock-dasher-immune');
  lockMonsterEscape(boss, 'dash', 2000, clock);
  tick(world, 2);
  assert.ok(boss.runsBossPattern, 'a boss that accepts no control shrugs Tether off');
}
{
  const { world, boss } = arena('test-lock-burrower');
  lockMonsterEscape(boss, 'dash', 3000, clock);
  tick(world, 5);
  assert.ok(boss.isConcealed, 'Tether does not stop a travelling burrow');
}
{
  const { world, boss } = arena('test-lock-blinker');
  lockMonsterEscape(boss, 'dash', 3000, clock);
  tick(world, 2);
  assert.equal(boss.isConcealed, undefined, 'Tether stops a teleport (a conceal that relocates without travelling)');
}

// 3. A lock landing on a flight already running cuts it short.
{
  const { world, boss } = arena('test-lock-fleer');
  tick(world, 2);
  assert.ok(boss.runsBossPattern && boss.isMoving, 'it flees behind its guard');
  lockMonsterEscape(boss, 'escape', 3000, clock);
  tick(world, 1);
  assert.equal(boss.runsBossPattern, undefined, 'held mid-flight, the escape ends');
  assert.equal(boss.isMoving, undefined, 'and it stops where it is');
}

// 4. The class pieces lay the hold.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('slinger', null), 'slinger');
  const target = world.createMonster(NODE, 'test-lock-dasher', { x: 600, y: 400 })!;
  tetherHit(player, target, 3, 2500, 2000, clock);
  tetherHit(player, target, 3, 2500, 2000, clock + 100);
  assert.ok(!monsterEscapeLocked(target, 'dash', clock + 100), 'two rounds do not tether');
  tetherHit(player, target, 3, 2500, 2000, clock + 200);
  assert.ok(monsterEscapeLocked(target, 'dash', clock + 200), 'Tether: three rounds in a row lock the dash-away');
  assert.ok(!monsterEscapeLocked(target, 'escape', clock + 200), 'but not a dive');
  tetherFor(player, target, 4000, clock + 300);
  assert.ok(monsterEscapeLocked(target, 'escape', clock + 300), 'Harpoon Round: it cannot dive, burrow or flee');
}
{
  // Undertow, through the real slam: the slammed burrower is held and its dive refused.
  const world = new World();
  const biomes = { plains: 8, forest: 8, swamp: 14, mountain: 20, cave: 14, jungle: 14, desert: 14, tundra: 8, volcanic: 8, graveyard: 2, trench: 2 };
  const player = world.attachPlayerEntity(playerSlices('squire', 'cooldown', biomes, ['trench:4']), 'squire');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp = 10_000;
  const ctx = classConfigContextFromState({ combatArchetype: 'cooldown', biomeLevel: biomes, bossesCleared: ['trench:4'], disciplineId: null })!;
  const config = defaultClassConfig(ctx);
  config.relic = ['squire-relic-trench'];
  if (config.system.kind === 'responses') (config.system as ResponsesConfig).rules = [];
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  const target = world.createMonster(NODE, 'test-lock-burrower', { x: 430, y: 400 })!;
  target.hasHealth.hp = target.hasHealth.maxHp = 100_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  setAttackTarget(world, player, target.isMonster.id);
  setAggroTarget(world, target, { id: player.isPlayer.id, kind: 'player' }, clock);
  target.hasAwareness.state = 'attacking';
  const squireStep = (): void => {
    clock += 100;
    world.tickCounter += 1;
    updatePlayerMoments(world, player, clock);
    updateSquire(world, 100, clock);
  };
  squireStep();
  addResolve(world, player, 100);
  squireStep();
  runPlayerAttack(world, player, target, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'squire', kind: 'player' } });
  assert.ok(monsterEscapeLocked(target, 'escape', clock), 'Undertow: the slammed target cannot dive, burrow or flee');
  tick(world, 5);
  assert.equal(target.isConcealed, undefined, 'and its burrow is refused');
  assert.equal(target.recoversFromPattern?.label, 'Held', "with Undertow's stagger as the window");
}

console.log('escapeLock: ok');
