import { GAME_CONFIG, emptyEquipment, moverOverlapsBlockShapes, navigationBodyHalfExtents, type NodeFeatureShape } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { applyManualMoveIntent } from '../src/systems/world/manualMove';
import { stopEntity, updateMovement } from '../src/systems/world/movement';
import { setMovePath } from '../src/systems/world/pathMotion';
import { attachComponent } from '../src/ecs/markerHelpers';
import { World } from '../src/world/World';
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function playerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: "cadence",
    },
  };
}

const nodeId = 'node-t1-mountain-01';
const world = new World();
const player = world.attachPlayerEntity(playerSlices('manual-test', nodeId), 'manual-test');
player.hasPosition.current = { x: 2520, y: 1600 };
const pad = navigationBodyHalfExtents('player');
const shapes = world.collision.blockShapes(nodeId, 'player');
const click = applyManualMoveIntent(world, player, { x: 1040, y: 440 }, { mode: 'path' });
assert(click.accepted, 'mountain click accepted');
let ticks = 0;
for (; ticks < 1500 && player.isMoving; ticks++) {
  updateMovement(world, 100, ticks * 100);
  assert(!moverOverlapsBlockShapes(player.hasPosition.current, shapes, pad), 'mountain route stays outside terrain');
}
assert(!player.isMoving && !player.hasMovePath && !player.hasManualMoveIntent, 'single click finishes and releases all motion');
assert(Math.hypot(player.hasPosition.current.x - click.goal.x, player.hasPosition.current.y - click.goal.y) < 0.02, 'single click reaches resolved endpoint');
console.log(`mountain route completed in ${ticks} ticks`);

// Use a real mountain wall as an unreachable original destination. The planner
// may choose a substitute endpoint, which must be the actual stopping point.
const ledge = shapes.find(shape => shape.kind === 'rect' && shape.halfW > 100);
assert(ledge, 'mountain has a long ledge');
const blockedClick = applyManualMoveIntent(world, player, { x: ledge.x, y: ledge.y }, { mode: 'path' });
assert(blockedClick.accepted, 'click inside ledge resolves to reachable ground');
for (let i = 0; i < 1500 && player.isMoving; i++) updateMovement(world, 100, 200000 + i * 100);
assert(!moverOverlapsBlockShapes(player.hasPosition.current, shapes, pad), 'blocked click finishes outside ledge');
assert(Math.hypot(player.hasPosition.current.x - blockedClick.goal.x, player.hasPosition.current.y - blockedClick.goal.y) < 0.02, 'blocked click stops at acknowledged substitute');

// Deterministic runtime blocker: planner knows static terrain but a collision
// that persists at execution must not require repeated user/AI requests to stop.
const isolated = new World();
const p = isolated.attachPlayerEntity(playerSlices('manual-test', 'node-t1-plains-01'), 'manual-test');
p.hasPosition.current = { x: 400, y: 400 };
const wall: NodeFeatureShape = { kind: 'rect', x: 500, y: 400, halfW: 20, halfH: 200 };
isolated.collision.blockShapes = () => [wall];
let result = applyManualMoveIntent(isolated, p, { x: 1000, y: 1000 }, { mode: 'direct', direction: { x: 50, y: 0 } });
assert(result.accepted && result.goal.y === 400, 'server normalizes direction from authoritative origin');
for (let i = 0; i < 60; i++) {
  if (i % 3 === 0) applyManualMoveIntent(isolated, p, { x: 1000, y: 1000 }, { mode: 'direct', direction: { x: 1, y: 0 } });
  updateMovement(isolated, 100, i * 100);
  assert(Math.abs(p.hasPosition.current.y - 400) < 1e-6, 'wall hold never invents lateral movement');
  assert(p.hasPosition.current.x < 458, 'wall hold never crosses or teleports');
}
const atWall = { ...p.hasPosition.current };
stopEntity(isolated, p);
setMovePath(isolated, p, { x: 650, y: 400 }, [{ x: 650, y: 400 }], 'player');
attachComponent(isolated, p, 'hasManualMoveIntent', {});
for (let i = 0; i < 25; i++) updateMovement(isolated, 100, 10000 + i * 100);
assert(!p.isMoving && !p.hasMovePath && !p.hasManualMoveIntent, 'blocked click watchdog ends without repeated input');
assert(Math.hypot(p.hasPosition.current.x - atWall.x, p.hasPosition.current.y - atWall.y) < 0.02, 'blocked click does not teleport');

result = applyManualMoveIntent(isolated, p, { x: 350, y: 400 }, { mode: 'direct' });
assert(result.accepted, 'moving away after recovery works');
updateMovement(isolated, 100, 15000);
assert(p.hasPosition.current.x < atWall.x, 'moving away makes immediate progress');
stopEntity(isolated, p);
const stopped = { ...p.hasPosition.current };
updateMovement(isolated, 100, 16000);
assert(p.hasPosition.current.x === stopped.x, 'stop clears movement');
assert(!applyManualMoveIntent(isolated, p, { x: NaN, y: 0 }).accepted, 'invalid coordinates rejected');
assert(!applyManualMoveIntent(isolated, p, { x: 350, y: 400 }, { mode: 'direct', direction: { x: Infinity, y: 0 } }).accepted, 'invalid direction rejected');
attachComponent(isolated, p, 'isRooted', {});
assert(!applyManualMoveIntent(isolated, p, { x: 350, y: 400 }).accepted, 'rooted move rejected');
assert(!applyManualMoveIntent(isolated, undefined, { x: 0, y: 0 }).accepted, 'missing player rejected');
console.log('manualPlayerMovement: ok');