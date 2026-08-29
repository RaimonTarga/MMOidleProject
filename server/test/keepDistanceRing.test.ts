/**
 * Regression: the Keep Distance ("orbit") rule must have an answer when the
 * straight-back bearing is unavailable, and must never park the player outside
 * its own attack range.
 *
 * Two failures used to live in the same block:
 *
 * 1. The standoff was solved as a single point on the target→player ray and then
 *    run through `clampToNode`. Backed against a node edge the clamped point
 *    collapsed onto roughly where the player already stood, which the nav layer
 *    reads as "already there" — so the player planted itself against the wall and
 *    took the fight standing still. Same shape of failure behind an obstacle or
 *    backing into a second mob.
 *
 * 2. When the mob out-reached the player, the rule clamped the standoff to 92% of
 *    the player's own attack range — a band narrower than the nav goal-arrival
 *    epsilon (48px), so the player settled just outside its own reach and
 *    oscillated there. Most visible against ranged and kiter mobs, which never
 *    close the gap for you.
 *
 * These assert the observable steering decision after one `steerTowardTarget`
 * call, not eventual arrival, so they keep testing the bug independent of how
 * many ticks the nav layer takes.
 */
import {
  aabbHalfExtents,
  emptyEquipment,
  hitboxGap,
  moverOverlapsBlockShapes,
  posHitboxFromEntity,
  setFlag,
  GAME_CONFIG,
  PATH_GOAL_EPSILON_SQ,
  type Vec2,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import type { MonsterEntity, PlayerEntity } from "../src/ecs/entity";
import { steerTowardTarget } from "../src/systems/combat/ai/autoTarget";
import { markEngaged } from "../src/systems/combat/ai/engagement";
import { navigationPadForEntity } from "../src/systems/world/movement";
import { NODE_REGISTRY } from "../src/world/nodeRegistry";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE_ID = "node-t1-plains-01";
const NOW = 1_000_000;
/** Same margin the steering keeps off a node edge. */
const NODE_MARGIN = 40;
const GOAL_EPSILON = Math.sqrt(PATH_GOAL_EPSILON_SQ);

function playerSlices(id: string, pos: Vec2): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: pos, nodeId: NODE_ID, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [], runeRecipesCrafted: [],
      runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: "cadence",
    },
  };
}

const world = new World();
const node = NODE_REGISTRY.get(NODE_ID);
assert(node !== undefined, `${NODE_ID} must exist in the node registry`);

function standable(point: Vec2, player: PlayerEntity): boolean {
  return !moverOverlapsBlockShapes(
    point,
    world.collision.blockShapes(NODE_ID, "player"),
    navigationPadForEntity(player),
  );
}

/**
 * The destination the steering actually committed to this tick: a pathed goal, or
 * the endpoint of a direct motion vector. Both are steering decisions; which one
 * is used depends only on how far the correction is.
 */
function committedDestination(player: PlayerEntity): Vec2 | null {
  const goal = player.hasMovePath?.goal;
  if (goal) return goal;
  const motion = player.isMoving?.motion;
  if (!motion) return null;
  return {
    x: player.hasPosition.current.x + motion.direction.x * motion.magnitude,
    y: player.hasPosition.current.y + motion.direction.y * motion.magnitude,
  };
}

function gapFrom(point: Vec2, player: PlayerEntity, monster: MonsterEntity): number {
  return hitboxGap(
    { pos: point, rects: posHitboxFromEntity(player).rects },
    posHitboxFromEntity(monster),
  );
}

// ─── 1. Pinned against a node edge, in combat ────────────────────────────────
//
// The player hugs the west wall with the mob due east of it. Backing straight
// away means walking west, into the wall — the exact bearing the old solve was
// restricted to.
{
  const player = world.attachPlayerEntity(
    playerSlices("edge-probe", { x: NODE_MARGIN + 20, y: 2400 }),
    "edge-probe",
  );
  // Long enough reach that the wanted standoff (72% of range) is a large
  // correction, so the decision is a pathed goal rather than a sub-pixel nudge.
  player.performsAttack.attackRange = 500;

  const monster = world.createMonster(NODE_ID, "boar", { x: 0, y: 0 });
  assert(monster !== null, "failed to create the plains target");
  if (!monster) throw new Error("unreachable");

  // Find a stretch of that wall clear of the node's own blockers, so this tests
  // the edge case and not an incidental rock.
  let placed = false;
  for (let y = 600; y <= node!.height - 600; y += 200) {
    const playerPos: Vec2 = { x: NODE_MARGIN + 20, y };
    const monsterPos: Vec2 = { x: NODE_MARGIN + 20 + 150, y };
    if (!standable(playerPos, player)) continue;
    if (!standable({ x: monsterPos.x, y: y - 400 }, player)) continue;
    if (!standable({ x: monsterPos.x, y: y + 400 }, player)) continue;
    player.hasPosition.current = playerPos;
    monster.hasPosition.current = monsterPos;
    placed = true;
    break;
  }
  assert(placed, "expected a clear stretch of the west wall to test against");

  const monsterPad = aabbHalfExtents(posHitboxFromEntity(monster).rects);
  assert(monsterPad.x > 0, "target should have a real hitbox");

  // Reaches far enough that standing on top of it is genuinely out of position —
  // otherwise the player is already inside the hold band and correctly holds
  // still, which is not the case under test. Still short enough that it does NOT
  // out-range us, so this stays the kite path and not the out-ranged yield.
  monster.performsAttack.attackRange = 300;

  setFlag(player.tracksCombat, "rune.keepDistance", true);
  markEngaged(world, player, NOW);

  const startPos = { ...player.hasPosition.current };
  const startGap = gapFrom(startPos, player, monster);
  assert(
    startGap < 500 * 0.72,
    `setup: player should start well inside the wanted standoff, got ${startGap}`,
  );

  steerTowardTarget(world, player, monster, NOW);

  const dest = committedDestination(player);
  assert(
    dest !== null,
    "pinned against the wall the player must still commit to a destination, "
      + "not stand still",
  );
  if (!dest) throw new Error("unreachable");

  const travel = Math.hypot(dest.x - startPos.x, dest.y - startPos.y);
  assert(
    travel > 150,
    `the destination must be a real move, not a clamped no-op: travelled ${travel.toFixed(1)}px`,
  );

  const destGap = gapFrom(dest, player, monster);
  assert(
    destGap > startGap + 150,
    `the destination must actually open the gap: ${startGap.toFixed(1)} -> ${destGap.toFixed(1)}`,
  );
  assert(
    dest.x >= NODE_MARGIN && dest.x <= node!.width - NODE_MARGIN &&
      dest.y >= NODE_MARGIN && dest.y <= node!.height - NODE_MARGIN,
    `the destination must stay inside the node: ${JSON.stringify(dest)}`,
  );
  assert(
    standable(dest, player),
    `the destination must be somewhere the player can stand: ${JSON.stringify(dest)}`,
  );

  world.removeMonsterEntity(monster.isMonster.id);
  world.detachPlayerEntity("edge-probe");
}

// ─── 2. Out-ranged by the target ─────────────────────────────────────────────
//
// The mob reaches further than the player does, so there is no gap that is both
// outside its reach and inside the player's. Keep Distance must yield the
// movement channel rather than hold at a standoff narrower than the nav layer can
// resolve — the goal has to sit far enough inside the player's own range that the
// goal-arrival epsilon cannot strand it outside.
{
  const player = world.attachPlayerEntity(
    playerSlices("outranged-probe", { x: 2400, y: 2400 }),
    "outranged-probe",
  );
  // Short reach deliberately: the narrower our own range, the larger a share of
  // it the 48px goal epsilon is, which is exactly why this failure showed up on
  // real builds rather than in theory.
  const attackRange = 140;
  player.performsAttack.attackRange = attackRange;

  const monster = world.createMonster(NODE_ID, "boar", { x: 2400, y: 2400 });
  assert(monster !== null, "failed to create the out-ranging target");
  if (!monster) throw new Error("unreachable");

  let placed = false;
  for (let x = 1200; x <= node!.width - 1200; x += 200) {
    const playerPos: Vec2 = { x, y: 2400 };
    const monsterPos: Vec2 = { x: x + 340, y: 2400 };
    if (!standable(playerPos, player)) continue;
    if (!standable(monsterPos, player)) continue;
    if (!standable({ x: x + 170, y: 2400 }, player)) continue;
    player.hasPosition.current = playerPos;
    monster.hasPosition.current = monsterPos;
    placed = true;
    break;
  }
  assert(placed, "expected a clear stretch of open ground to test against");

  // Out-reaches the player by a wide margin.
  monster.performsAttack.attackRange = 600;

  setFlag(player.tracksCombat, "rune.keepDistance", true);
  markEngaged(world, player, NOW);

  const startGap = gapFrom(player.hasPosition.current, player, monster);
  assert(
    startGap > attackRange,
    `setup: player should start outside its own reach, got ${startGap}`,
  );

  steerTowardTarget(world, player, monster, NOW);

  const dest = committedDestination(player);
  assert(
    dest !== null,
    "out-ranged, the player must close on the target rather than hold position",
  );
  if (!dest) throw new Error("unreachable");

  const destGap = gapFrom(dest, player, monster);
  assert(
    destGap < startGap,
    `the destination must close the gap: ${startGap.toFixed(1)} -> ${destGap.toFixed(1)}`,
  );
  // The heart of the bug: a goal within the goal-arrival epsilon of the edge of
  // our own range lets the nav layer stop us just outside it, whereupon nothing
  // in the fight closes the gap for us and the player idles under fire.
  assert(
    destGap <= attackRange - GOAL_EPSILON,
    `the goal must sit at least the nav goal epsilon (${GOAL_EPSILON}px) inside our own `
      + `attack range (${attackRange}px), so arriving cannot leave us out of reach; `
      + `got a gap of ${destGap.toFixed(1)}`,
  );

  world.removeMonsterEntity(monster.isMonster.id);
  world.detachPlayerEntity("outranged-probe");
}

// ─── 3. Pinned against a node edge, out of combat (Skittish) ─────────────────
//
// The idle retreat-only rule had the identical clamp: backed against the wall it
// stopped giving ground. It must slide along the edge instead, and must still
// never advance on the threat.
{
  const player = world.attachPlayerEntity(
    playerSlices("skittish-probe", { x: NODE_MARGIN + 20, y: 2400 }),
    "skittish-probe",
  );
  player.performsAttack.attackRange = 120;

  const monster = world.createMonster(NODE_ID, "boar", { x: 0, y: 0 });
  assert(monster !== null, "failed to create the plains threat");
  if (!monster) throw new Error("unreachable");

  let placed = false;
  for (let y = 600; y <= node!.height - 600; y += 200) {
    const playerPos: Vec2 = { x: NODE_MARGIN + 20, y };
    const monsterPos: Vec2 = { x: NODE_MARGIN + 20 + 120, y };
    if (!standable(playerPos, player)) continue;
    if (!standable({ x: monsterPos.x, y: y - 300 }, player)) continue;
    if (!standable({ x: monsterPos.x, y: y + 300 }, player)) continue;
    player.hasPosition.current = playerPos;
    monster.hasPosition.current = monsterPos;
    placed = true;
    break;
  }
  assert(placed, "expected a clear stretch of the west wall for the idle case");

  setFlag(player.tracksCombat, "rune.keepDistance", true);
  // Deliberately NOT engaged: this exercises the out-of-combat branch.
  assert(
    player.tracksEngagement === undefined && player.hasAttackTarget === undefined,
    "setup: the idle case must not be in combat",
  );

  const startPos = { ...player.hasPosition.current };
  const startGap = gapFrom(startPos, player, monster);
  assert(startGap <= 220, `setup: threat must be inside personal space, got ${startGap}`);

  steerTowardTarget(world, player, monster, NOW);

  const dest = committedDestination(player);
  assert(
    dest !== null,
    "pinned against the wall the idle rule must still give ground, not plant",
  );
  if (!dest) throw new Error("unreachable");

  const travel = Math.hypot(dest.x - startPos.x, dest.y - startPos.y);
  assert(
    travel > 100,
    `idle retreat must be a real move, not a clamped no-op: travelled ${travel.toFixed(1)}px`,
  );
  const destGap = gapFrom(dest, player, monster);
  assert(
    destGap >= startGap,
    `the idle rule must never advance on the threat: ${startGap.toFixed(1)} -> ${destGap.toFixed(1)}`,
  );

  world.removeMonsterEntity(monster.isMonster.id);
  world.detachPlayerEntity("skittish-probe");
}

console.log("keepDistanceRing.test.ts: ok");
