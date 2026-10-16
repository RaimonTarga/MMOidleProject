/**
 * The Slinger's free rule "never start a reload inside a telegraph" (bible §10.3, OV-SLINGER):
 * the round that empties the clip fires as the last round, but the stationary reload waits while
 * the Slinger stands in a ground telegraph, starts once it is out, and never waits past its cap.
 * With the rule off, the reload starts at once. Wiring only: no balance numbers.
 */
import assert from 'node:assert/strict';
import {
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  MONSTER_DATABASE,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { reloadHeld } from '../src/systems/classes/archetypes/reload/slinger';
import { updateReloadArchetype } from '../src/systems/classes/archetypes/reload/reloadPrototype';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { publishFaultLineBurst } from '../src/systems/world/groundZones';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { plains: 6 };
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-slinger-telegraph-dummy', { ...base, id: 'test-slinger-telegraph-dummy', evasion: 0 });

let clock = 100_000;

function setup(neverReloadInTelegraph: boolean) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'slinger', name: 'Slinger' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
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
  const ctx = classConfigContextFromState({ combatArchetype: 'reload', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null })!;
  const config = defaultClassConfig(ctx);
  if (config.system.kind === 'loadout') config.system.neverReloadInTelegraph = neverReloadInTelegraph;
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  player.usesReload!.ammoMax = 8;
  player.usesReload!.ammo = 1;
  const monster = world.createMonster(NODE, 'test-slinger-telegraph-dummy', { x: 430, y: 400 })!;
  monster.hasHealth.hp = monster.hasHealth.maxHp = 1_000_000;
  // A ground telegraph under the Slinger, owned by the monster, resolving well after the test.
  publishFaultLineBurst(world, NODE, {
    kind: 'fault-line-telegraph', ownerId: monster.isMonster.id, resolvesAtMs: clock + 60_000, startedAtMs: clock,
    points: [{ x: 400, y: 400 }], radius: 60, pos: { x: 400, y: 400 }, damageMultiplier: 1,
  });
  return { world, player, monster };
}

/** The next tick's facts: a fresh fight snapshot, then the reload update. */
function tick(world: World, player: PlayerEntity, dtMs: number): void {
  clock += dtMs;
  world.tickCounter += 1;
  updatePlayerMoments(world, player, clock);
  updateReloadArchetype(world, dtMs, clock);
}

function fireLastRound(world: World, player: PlayerEntity, monster: MonsterEntity): void {
  clock += 1_000;
  world.tickCounter += 1;
  updatePlayerMoments(world, player, clock);
  setAttackTarget(world, player, monster.isMonster.id);
  runPlayerAttack(world, player, monster, clock, { attackOrigin: player.hasPosition.current, aggroSource: { id: 'slinger', kind: 'player' } });
}

// ── Inside a telegraph the empty clip waits; out of it the reload starts ─────
{
  const { world, player, monster } = setup(true);
  const before = monster.hasHealth.hp;
  fireLastRound(world, player, monster);
  assert.ok(monster.hasHealth.hp < before, 'the last round still fires');
  assert.equal(player.usesReload!.ammo, 0, 'the clip is empty');
  assert.equal(player.usesReload!.reloadingMs, 0, 'inside the telegraph, the reload has not started');
  assert.ok(reloadHeld(player), 'the empty clip waits on the telegraph');
  tick(world, player, 100);
  assert.equal(player.usesReload!.reloadingMs, 0, 'still inside: still waiting');
  assert.equal(player.usesReload!.ammo, 0, 'and the clip is not refilled for free');

  player.hasPosition.current = { x: 900, y: 900 };
  tick(world, player, 100);
  assert.ok(player.usesReload!.reloadingMs > 0, 'out of the telegraph, the stationary reload starts');
  assert.ok(!reloadHeld(player), 'the wait is over');
  for (let i = 0; i < 40 && player.usesReload!.reloadingMs > 0; i++) tick(world, player, 100);
  assert.equal(player.usesReload!.ammo, player.usesReload!.ammoMax, 'the reload completes as usual');
}

// ── The wait has a cap ───────────────────────────────────────────────────────
{
  const { world, player, monster } = setup(true);
  fireLastRound(world, player, monster);
  assert.ok(reloadHeld(player));
  for (let i = 0; i < 40 && player.usesReload!.reloadingMs <= 0; i++) tick(world, player, 100);
  assert.ok(player.usesReload!.reloadingMs > 0, 'a few seconds in the telegraph, the reload starts anyway');
}

// ── With the rule off, the reload starts at once ─────────────────────────────
{
  const { world, player, monster } = setup(false);
  fireLastRound(world, player, monster);
  assert.ok(player.usesReload!.reloadingMs > 0, 'rule off: the reload starts inside the telegraph');
  assert.ok(!reloadHeld(player));
}

console.log('slingerTelegraphReload: ok');
