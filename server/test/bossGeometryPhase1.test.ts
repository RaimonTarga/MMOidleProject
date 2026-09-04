// BOSS ENCOUNTER REDESIGN — Phase 0 (characterization) + Phase 1 (geometry and threats).
//
// Two jobs in one file, because they are two halves of the same claim:
//
//   PHASE 0 pins what the ground-zone primitive did BEFORE the shared geometry
//   landed — the committed circle, the Swamp pool, and every teardown path — so a
//   later phase that rebuilds this layer has something concrete to regress against.
//   These are parity assertions, not new behaviour.
//
//   PHASE 1 pins the shared geometry itself: one serialized shape drives rendering,
//   hit resolution, Step Back, avoidance and telemetry. The load-bearing claim is
//   that the region which damages you is BY CONSTRUCTION the region you were shown,
//   which is why the client-view/damage-geometry parity check below matters more
//   than any single containment case.
//
// Magnitudes are deliberately not pinned — balance owns those. Shapes, identity,
// and cleanup are what this file guards.

import {
  GAME_CONFIG,
  BOSS_RECOVERY_EFFECT,
  MONSTER_DATABASE,
  RUNE_TELEGRAPH_ESCAPE_CLEARANCE,
  STARTER_RUNE_IDS,
  circleGeometry,
  corridorGeometry,
  emptyEquipment,
  geometryBounds,
  geometryContains,
  geometryCoveringCircles,
  linkedCirclesGeometry,
  nearestGeometryExit,
} from '@mmo-idle/shared';
import type { MonsterAbility, Vec2 } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { endPattern, updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setRooted } from '../src/systems/world/rooted';
import { sourceBarrierRemaining } from '../src/systems/combat/engine/sourceBarriers';
import { applyEnemyShield } from '../src/systems/combat/engine/monsterMechanics';
import { attachComponent } from '../src/ecs/markerHelpers';
import { applyStun } from '../src/systems/combat/status/stun';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import {
  abilityIsGuardable,
  guardableThreatsAgainstPlayer,
  guardableThreatsFor,
} from '../src/systems/combat/ai/guardableThreats';
import {
  activeAttackTelegraphs,
  positionInsideTelegraph,
  findTelegraphEscapeDestination,
} from '../src/systems/combat/ai/telegraphEvasion';
import {
  buildGroundZoneViews,
  publishToxicPool,
  updateGroundZones,
  type RuntimeChargeCorridor,
} from '../src/systems/world/groundZones';
import { buildKillerFromMonster } from '../src/systems/world/deathCause';
import { freezeNode } from '../src/world/nodeLifecycle';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — the shared geometry, as pure maths.
// ─────────────────────────────────────────────────────────────────────────────

// A circle answers exactly as the hand-rolled radius comparison it replaces.
{
  const circle = circleGeometry({ x: 100, y: 100 }, 50);
  assert(geometryContains(circle, { x: 100, y: 100 }), 'the centre is inside');
  assert(geometryContains(circle, { x: 149, y: 100 }), 'just inside the rim is inside');
  assert(!geometryContains(circle, { x: 151, y: 100 }), 'just outside the rim is outside');
  assert(
    geometryContains(circle, { x: 155, y: 100 }, 10),
    'clearance grows the circle rather than moving it',
  );
}

// A corridor is a CAPSULE: on the line is lethal at any distance along it, and a
// step perpendicular clears it. This is the whole reason the union exists.
{
  const lane = corridorGeometry({ x: 0, y: 0 }, { x: 400, y: 0 }, 40);
  assert(geometryContains(lane, { x: 0, y: 0 }), 'the lane origin is on the lane');
  assert(geometryContains(lane, { x: 200, y: 0 }), 'the midpoint is on the lane');
  assert(geometryContains(lane, { x: 400, y: 0 }), 'the far endpoint is on the lane');
  assert(geometryContains(lane, { x: 200, y: 39 }), 'inside the half-width is on the lane');
  assert(!geometryContains(lane, { x: 200, y: 41 }), 'a step perpendicular clears the lane');
  // Rounded caps, not a bare rectangle: standing just past the end but within the
  // cap is still hit, and the client draws the same caps.
  assert(geometryContains(lane, { x: 430, y: 0 }), 'the end cap is part of the capsule');
  assert(!geometryContains(lane, { x: 460, y: 0 }), 'past the cap is safe');
  assert(!geometryContains(lane, { x: -60, y: 0 }), 'behind the start cap is safe');
}

// A degenerate (zero-length) lane must not divide by zero; it collapses to a disc.
{
  const point = corridorGeometry({ x: 10, y: 10 }, { x: 10, y: 10 }, 25);
  assert(geometryContains(point, { x: 10, y: 30 }), 'a zero-length lane is a disc');
  assert(!geometryContains(point, { x: 10, y: 40 }), 'and still has a boundary');
}

// Linked circles hit their cracks and leave the wedges between them safe.
{
  const faults = linkedCirclesGeometry([{ x: 0, y: 0 }, { x: 100, y: 0 }], 20);
  assert(geometryContains(faults, { x: 100, y: 10 }), 'a crack is lethal');
  assert(!geometryContains(faults, { x: 50, y: 0 }), 'the gap between cracks is safe');
}

// The covering circles must never leave a HOLE: a player standing anywhere on the
// lane has to be found by the broad phase, or the corridor would silently miss.
// Sampled densely along and across a lane whose half-width does not divide evenly.
{
  const lane = corridorGeometry({ x: 30, y: 70 }, { x: 517, y: 233 }, 37);
  const circles = geometryCoveringCircles(lane);
  for (let t = 0; t <= 1.0001; t += 0.01) {
    for (const offset of [-0.99, -0.5, 0, 0.5, 0.99]) {
      const dx = 517 - 30;
      const dy = 233 - 70;
      const len = Math.hypot(dx, dy);
      const point: Vec2 = {
        x: 30 + dx * t + (-dy / len) * 37 * offset,
        y: 70 + dy * t + (dx / len) * 37 * offset,
      };
      if (!geometryContains(lane, point)) continue;
      const covered = circles.some(
        (c) => Math.hypot(point.x - c.pos.x, point.y - c.pos.y) <= c.radius + 1e-6,
      );
      assert(covered, `broad phase missed a point on the lane at t=${t.toFixed(2)}`);
    }
  }
  // Covering circles are a superset, so the bounds they produce contain the lane.
  const bounds = geometryBounds(lane);
  assert(bounds.minX <= 30 - 37 + 1e-6 && bounds.maxX >= 517 + 37 - 1e-6, 'bounds cover the lane');
}

// `nearestGeometryExit` distinguishes "already safe" from "here is the way out",
// and for a corridor the way out is perpendicular rather than back down the lane.
{
  const lane = corridorGeometry({ x: 0, y: 0 }, { x: 400, y: 0 }, 40);
  assert(nearestGeometryExit(lane, { x: 200, y: 200 }) === null, 'outside means no exit needed');
  const exit = nearestGeometryExit(lane, { x: 200, y: 10 }, 5);
  assert(exit !== null, 'a point on the lane has an exit');
  assert(!geometryContains(lane, exit!), 'the exit is genuinely off the lane');
  assert(
    Math.abs(exit!.x - 200) < 1e-6,
    'the shortest way off a lane is sideways, not along it',
  );
  // Dead centre has no natural direction; it must still answer rather than divide by zero.
  const centred = nearestGeometryExit(circleGeometry({ x: 5, y: 5 }, 30), { x: 5, y: 5 });
  assert(centred !== null && Number.isFinite(centred.x), 'dead centre still yields an exit');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 0 — circle parity. The committed slam must be untouched by the migration.
// ─────────────────────────────────────────────────────────────────────────────

const SLAM = MONSTER_DATABASE.get('cave-brute')?.chargedAttack;
assert(!!SLAM?.aoe, 'cave-brute should still carry the ground-slam aoe rider');

function armedBrute(world: World, primaryId: string, at: Vec2) {
  const monster = world.createMonster(NODE, 'cave-brute', at);
  assert(monster !== null, 'test needs a cave-brute');
  const t0 = 1_000;
  setAggroTarget(world, monster, { id: primaryId, kind: 'player' }, t0);
  monster.hasAwareness.state = 'attacking';
  const armedAt = t0 + (SLAM!.initialCooldownMs ?? SLAM!.cooldownMs) + 1_000;
  monster.performsAttack.lastAttackAt = armedAt - monster.performsAttack.attackCooldown;
  return { monster, armedAt };
}

// The slam still plants ONE circle at the target's cast-start position, and the
// view now carries the same circle as authoritative geometry.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('slam-parity', 405, 400), 'slam-parity');
  const { armedAt } = armedBrute(world, 'slam-parity', { x: 400, y: 400 });
  updateCombat(world, 100, armedAt);

  const views = buildGroundZoneViews(world, NODE, armedAt) ?? [];
  assert(views.length === 1, 'the wind-up publishes exactly one telegraph');
  const view = views[0];
  assert(view.kind === 'slam-telegraph', 'it is still a slam telegraph');
  assert(view.x === 405 && view.y === 400, 'still planted on the target at cast start');
  assert(view.radius === SLAM!.aoe!.radius, 'radius still comes from the aoe rider');
  assert(view.geometry.kind === 'circle', 'a slam serializes as a circle');
  assert(
    view.geometry.kind === 'circle' &&
      view.geometry.center.x === view.x &&
      view.geometry.center.y === view.y &&
      view.geometry.radius === view.radius,
    'the serialized geometry and the legacy circle fields agree',
  );

  // CLIENT/SERVER PARITY: the shape the client is handed is the shape the server
  // tests containment against — same object, not a re-derivation.
  const runtime = (world.groundZones.get(NODE) ?? [])[0];
  assert(runtime.geometry === view.geometry, 'the view ships the runtime geometry itself');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 0 — Swamp pool parity and teardown.
// ─────────────────────────────────────────────────────────────────────────────

{
  const bile = MONSTER_DATABASE.get('grave-toadeater')?.chargedAttack?.pool;
  assert(!!bile, 'the Toadeater should still author a Bile Pool');
  assert(bile.durationMs === 600_000, 'the Bile Pool still lasts the whole fight');
  assert(bile.slowSpeedMult !== undefined, 'the Bile Pool still slows');
}

// A pool ticks inside its geometry and never outside it, and its avoidance
// semantics stay keyed to meaning rather than to any texture name.
{
  const world = new World();
  const inside = world.attachPlayerEntity(playerSlices('pool-in', 400, 400), 'pool-in');
  const outside = world.attachPlayerEntity(playerSlices('pool-out', 700, 400), 'pool-out');
  const boss = world.createMonster(NODE, 'grave-toadeater', { x: 100, y: 100 });
  assert(!!boss, 'T1 Swamp boss should spawn');

  const pool = publishToxicPool(world, NODE, {
    kind: 'toxic-pool', pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1_000, expiresAtMs: 60_000, damagePerTick: 5, tickIntervalMs: 1_000,
    slowSpeedMult: 0.65, ownerId: boss.isMonster.id, killer: buildKillerFromMonster(boss),
  });
  assert(pool.geometry.kind === 'circle', 'a pool serializes as a circle');
  assert(pool.semantics.movementResponse === 'avoid-hazards', 'pools stay avoid-hazards');
  assert(pool.semantics.persistence === 'persistent', 'pools stay persistent');

  const insideHp = inside.hasHealth.hp;
  const outsideHp = outside.hasHealth.hp;
  updateGroundZones(world, 2_000);
  assert(inside.hasHealth.hp < insideHp, 'a player in the pool takes rot damage');
  assert(outside.hasHealth.hp === outsideHp, 'a player outside the pool takes none');
}

// Teardown: freezing the node drops every runtime zone, telegraph and pool alike.
// Node freeze is what makes monsters ephemeral, so a surviving zone would leave a
// cleared arena lethal for the next visitor.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('teardown', 405, 400), 'teardown');
  const { armedAt } = armedBrute(world, 'teardown', { x: 400, y: 400 });
  updateCombat(world, 100, armedAt);
  assert((world.groundZones.get(NODE) ?? []).length > 0, 'a telegraph exists to tear down');
  freezeNode(world, NODE);
  assert((world.groundZones.get(NODE) ?? []).length === 0, 'node freeze clears every zone');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — the committed charge lane, as an ordered pattern (T1 Crag Behemoth).
// ─────────────────────────────────────────────────────────────────────────────

const CRAG = MONSTER_DATABASE.get('crag-behemoth');
assert(!!CRAG, 'the Crag Behemoth should exist');
const CRAG_PATTERN = CRAG.bossPattern;
assert(!!CRAG_PATTERN, 'the Behemoth should run an ordered pattern');
assert(
  CRAG.chargedAttack === undefined,
  'the circular Ground Slam and its Phase 1 lane rider must both be gone',
);
assert(
  CRAG.chargeOnAggro === undefined,
  'chargeOnAggro is removed — a speed burst on aggro is not a charge',
);

const CRAG_CAST = CRAG_PATTERN.steps[0];
assert(CRAG_CAST.kind === 'cast' && !!CRAG_CAST.lane, 'the pattern opens on a lane wind-up');
const CRAG_LANE = CRAG_CAST.lane!;
const CRAG_TRAVEL = CRAG_PATTERN.steps[1];
assert(CRAG_TRAVEL.kind === 'charge', 'and then actually travels it');

// DODGEABILITY, as a structural invariant rather than a balance pin.
//
// The player's guaranteed window is the committed part of the wind-up PLUS the
// travel time, because once the lane locks nothing about it changes. In that window
// they must be able to cross the half-width plus Step Back's clearance from dead on
// the centre line. This asserts the answer EXISTS, not that it is easy — but no
// amount of retuning may quietly remove it.
{
  const committedMs = CRAG_CAST.castMs * (1 - (CRAG_LANE.lockAtCastPct ?? 0.5));
  const travelMs = (CRAG_LANE.length / CRAG_TRAVEL.speed) * 1_000;
  const reachable = (GAME_CONFIG.PLAYER_SPEED * (committedMs + travelMs)) / 1_000;
  const needed = CRAG_LANE.halfWidth + RUNE_TELEGRAPH_ESCAPE_CLEARANCE;
  assert(
    reachable > needed,
    `the committed window must be dodgeable at base speed: ${reachable.toFixed(0)}px ` +
      `reachable vs ${needed}px needed`,
  );
}

function armedBehemoth(world: World, primaryId: string, at: Vec2) {
  const monster = world.createMonster(NODE, 'crag-behemoth', at);
  assert(monster !== null, 'test needs a crag-behemoth');
  const t0 = 1_000;
  setAggroTarget(world, monster, { id: primaryId, kind: 'player' }, t0);
  monster.hasAwareness.state = 'attacking';
  const armedAt = t0 + (CRAG_PATTERN!.initialCooldownMs ?? CRAG_PATTERN!.cooldownMs) + 1_000;
  monster.performsAttack.lastAttackAt = armedAt - monster.performsAttack.attackCooldown;
  return { monster, armedAt };
}

function lane(world: World): RuntimeChargeCorridor | undefined {
  return (world.groundZones.get(NODE) ?? []).find(
    (zone): zone is RuntimeChargeCorridor => zone.kind === 'charge-corridor',
  );
}

/** Arm the pattern and advance it one tick, so a lane is painted. */
function windUpBehemoth(world: World, primaryId: string, at: Vec2) {
  const { monster, armedAt } = armedBehemoth(world, primaryId, at);
  updateBossPatterns(world, 100, armedAt);
  assert(!!monster.runsBossPattern, 'the pattern should take ownership');
  updateBossPatterns(world, 100, armedAt + 100);
  return { monster, startedAt: armedAt + 100 };
}

// The pattern owns the boss the moment it starts: rooted, attacks suppressed.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('own-a', 420, 400), 'own-a');
  const { monster } = windUpBehemoth(world, 'own-a', { x: 400, y: 400 });
  assert(!!monster.isRooted, 'a running pattern roots its boss');
  assert(!!monster.cannotAttack, 'and suppresses its ordinary swings');
}

// The wind-up paints one lane, from the boss along the bearing to its target.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('lane-a', 420, 400), 'lane-a');
  const { monster, startedAt } = windUpBehemoth(world, 'lane-a', { x: 400, y: 400 });

  const painted = lane(world);
  assert(!!painted, 'the wind-up paints a committed lane');
  assert(
    painted.start.x === monster.hasPosition.current.x &&
      painted.start.y === monster.hasPosition.current.y,
    'the lane starts where the boss stands',
  );
  assert(
    Math.abs(
      Math.hypot(painted.end.x - painted.start.x, painted.end.y - painted.start.y) -
        CRAG_LANE.length,
    ) < 1,
    'the lane runs the authored length past the target, it does not stop at them',
  );
  assert(painted.geometry.kind === 'corridor', 'the lane serializes as a corridor');
  assert(painted.lockedAtMs < painted.resolvesAtMs, 'it commits before the charge begins');

  const views = buildGroundZoneViews(world, NODE, startedAt) ?? [];
  assert(views.length === 1, 'one lane means one view — no per-segment explosion');
  assert(views[0].geometry === painted.geometry, 'the client is handed the damage geometry');
  assert(views[0].lockedInMs !== undefined, 'the view carries the aiming countdown');
}

// It TRACKS before the lock and is FROZEN after it. That distinction is the
// mechanic: without it, sidestepping would be a guess about where the boss goes.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('lane-lock', 420, 400), 'lane-lock');
  const { startedAt } = windUpBehemoth(world, 'lane-lock', { x: 400, y: 400 });

  const painted = lane(world)!;
  const laneId = painted.id;
  const firstEnd = { ...painted.end };

  // Still aiming: move the target and the lane follows.
  player.hasPosition.current = { x: 400, y: 800 };
  updateBossPatterns(world, 100, startedAt + 100);
  const tracked = lane(world)!;
  assert(tracked.id === laneId, 're-aiming keeps the zone id, so Step Back keeps tracking it');
  assert(
    Math.abs(tracked.end.x - firstEnd.x) > 1 || Math.abs(tracked.end.y - firstEnd.y) > 1,
    'the lane tracks the target while aiming',
  );

  // Past the lock: move again, and the lane must not budge.
  const lockedAt = tracked.lockedAtMs;
  updateBossPatterns(world, 100, lockedAt + 1);
  const committed = { ...lane(world)!.end };
  player.hasPosition.current = { x: 900, y: 100 };
  updateBossPatterns(world, 100, lockedAt + 100);
  const after = lane(world)!.end;
  assert(
    after.x === committed.x && after.y === committed.y,
    'once locked the boss never re-aims — the lane is committed',
  );
}

// COMMITTED TRAVEL: the boss actually runs the lane, hits each body AT MOST ONCE,
// and ends in a visible recovery. This is the beat Phase 1 could not express — it
// resolved the whole lane as one instant hit while the boss stood still.
{
  const world = new World();
  const onLane = world.attachPlayerEntity(playerSlices('travel-hit', 420, 400), 'travel-hit');
  const beside = world.attachPlayerEntity(playerSlices('travel-safe', 420, 400), 'travel-safe');
  const { monster, startedAt } = windUpBehemoth(world, 'travel-hit', { x: 400, y: 400 });

  const painted = lane(world)!;
  const dx = painted.end.x - painted.start.x;
  const dy = painted.end.y - painted.start.y;
  const len = Math.hypot(dx, dy);
  const mid = { x: painted.start.x + dx * 0.6, y: painted.start.y + dy * 0.6 };
  onLane.hasPosition.current = mid;
  beside.hasPosition.current = {
    x: mid.x + (-dy / len) * (painted.halfWidth * 3),
    y: mid.y + (dx / len) * (painted.halfWidth * 3),
  };
  const origin = { ...monster.hasPosition.current };
  const onHp = onLane.hasHealth.hp;
  const besideHp = beside.hasHealth.hp;

  // Run the sequence out. The boss travels during the charge step.
  let now = startedAt;
  for (let i = 0; i < 120 && !monster.recoversFromPattern; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }

  assert(
    Math.hypot(monster.hasPosition.current.x - origin.x, monster.hasPosition.current.y - origin.y) >
      painted.halfWidth,
    'the boss should have actually MOVED down its lane, not stood still',
  );
  assert(onLane.hasHealth.hp < onHp, 'standing on the lane is run over');
  assert(beside.hasHealth.hp === besideHp, 'a step off the lane is safe');

  // ONE hit, not one per tick of travel. The sweep tests the same body every tick
  // it overlaps, so de-duplication is load-bearing; a regression here would read in
  // play as a boss that simply deletes anyone it touches.
  const taken = onHp - onLane.hasHealth.hp;
  const oneHit = Math.round(Math.max(0, CRAG.stats.attack * CRAG_PATTERN.damageMultiplier));
  assert(
    taken <= oneHit * 1.5,
    `a charge should run a body over once (took ${taken} vs ~${oneHit} for one hit)`,
  );

  // And it ends in the authored, punishable recovery.
  assert(!!monster.recoversFromPattern, 'the sequence should end in a recovery');
  assert(!monster.runsBossPattern, 'the pattern cursor is released when recovery opens');
  assert(!!monster.isRooted && !!monster.cannotAttack, 'a recovering boss is open to punishment');
  assert(
    (monster.hasStatus.bossEffects ?? []).includes(BOSS_RECOVERY_EFFECT),
    'the recovery is visible to the client, not an invisible cooldown',
  );
  assert(lane(world) === undefined, 'the lane is retired once the charge is done');

  // The window is finite and releases both locks.
  updateBossPatterns(world, 100, monster.recoversFromPattern!.endsAtMs + 1);
  assert(!monster.recoversFromPattern, 'recovery ends on its own');
  assert(!monster.isRooted && !monster.cannotAttack, 'and hands the boss back its actions');
  assert(
    !(monster.hasStatus.bossEffects ?? []).includes(BOSS_RECOVERY_EFFECT),
    'and clears the client-facing marker',
  );
}

// THE CHARGE PUBLISHES ITS REAL SPEED.
//
// Regression, found in manual playtest 2026-09-04: the boss appeared to stop halfway
// down its lane and never connect. Server-side the travel was correct all along —
// position is written directly — but `hasPosition.speed` is ALSO what the client
// interpolates toward the broadcast target with, and it still read the boss's WALKING
// speed. The client crawled at 22 px/s after a body the server had already moved
// 600px at 470, so the charge visually stalled and the hit landed from nowhere.
//
// The speed slice has to tell the truth about how fast the thing is actually moving.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('charge-speed', 420, 400), 'charge-speed');
  const { monster, startedAt } = windUpBehemoth(world, 'charge-speed', { x: 400, y: 400 });
  const walking = monster.hasPosition.speed;
  assert(walking > 0, 'setup: the boss has a walking speed');

  // Run to the travel step.
  let now = startedAt;
  for (let i = 0; i < 120 && monster.runsBossPattern?.savedSpeed === undefined; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(
    monster.runsBossPattern?.savedSpeed === walking,
    'the travel should save the authored walking speed',
  );
  assert(
    monster.hasPosition.speed === CRAG_TRAVEL.speed,
    `the broadcast speed must be the CHARGE speed while charging ` +
      `(got ${monster.hasPosition.speed}, expected ${CRAG_TRAVEL.speed})`,
  );

  // And it must be handed back when the sequence ends.
  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(
    monster.hasPosition.speed === walking,
    'the boss must not keep charge speed after the charge',
  );
}

// An INTERRUPT mid-travel also hands the speed back — otherwise a cancelled charge
// leaves the boss sprinting for the rest of the fight.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('charge-speed-int', 420, 400), 'charge-speed-int');
  const { monster, startedAt } = windUpBehemoth(world, 'charge-speed-int', { x: 400, y: 400 });
  const walking = monster.hasPosition.speed;

  let now = startedAt;
  for (let i = 0; i < 120 && monster.runsBossPattern?.savedSpeed === undefined; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(monster.hasPosition.speed === CRAG_TRAVEL.speed, 'setup: charging');

  endPattern(world, monster, 'reset', now);
  assert(
    monster.hasPosition.speed === walking,
    'an interrupted charge must restore the walking speed',
  );
}

// Hard control during the wind-up interrupts the whole sequence, and teardown
// releases the lane and the movement lock together.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('lane-interrupt', 420, 400), 'lane-interrupt');
  const { monster, startedAt } = windUpBehemoth(world, 'lane-interrupt', { x: 400, y: 400 });
  assert(!!lane(world), 'setup: a lane is painted');

  applyStun(monster.tracksCombat, 1_000, 'test', 1);
  updateBossPatterns(world, 100, startedAt + 100);

  assert(!monster.runsBossPattern, 'a stun during the wind-up cancels the pattern');
  assert(!monster.recoversFromPattern, 'an interrupt is not a reward — no recovery is granted');
  assert(lane(world) === undefined, 'teardown retires the lane');
  assert(!monster.isRooted, 'teardown releases the movement lock');
  assert(!monster.cannotAttack, 'and the attack suppression');
}

// LOCK OWNERSHIP. A boss can be rooted by something else — a scripted cast, a Cave
// lockdown, a player control effect — at the same time as a pattern runs. Teardown
// must release only the locks the PATTERN took, or ending a sequence would hand the
// boss its movement back in the middle of someone else's root.
//
// No shipped boss combines the two yet, so this is set up directly. It is guarding a
// latent trap that the next lineage conversion would otherwise walk into.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('lock-owner', 420, 400), 'lock-owner');
  const { monster, armedAt } = armedBehemoth(world, 'lock-owner', { x: 400, y: 400 });

  // Something else owns the root and the attack lock BEFORE the pattern starts.
  setRooted(world, monster, true);
  attachComponent(world, monster, 'cannotAttack', {});

  updateBossPatterns(world, 100, armedAt);
  assert(!!monster.runsBossPattern, 'the pattern should still start');
  assert(
    monster.runsBossPattern!.ownsRoot === false &&
      monster.runsBossPattern!.ownsCannotAttack === false,
    'the pattern should record that it did NOT take the locks',
  );

  endPattern(world, monster, 'reset', armedAt + 100);
  assert(!monster.runsBossPattern, 'teardown releases the pattern');
  assert(!!monster.isRooted, 'but must NOT release a root it never took');
  assert(!!monster.cannotAttack, 'nor an attack lock it never took');
}

// Death mid-pattern must not strand the lane or leave state behind.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('lane-death', 420, 400), 'lane-death');
  const { monster } = windUpBehemoth(world, 'lane-death', { x: 400, y: 400 });
  assert(!!lane(world), 'setup: a lane is painted');
  world.removeMonsterEntity(monster.isMonster.id);
  assert(lane(world) === undefined, 'removing the boss retires its lane');
}

// Step Back reads the lane as an ordinary telegraph and exits it SIDEWAYS.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('lane-dodge', 420, 400), 'lane-dodge');
  const { startedAt } = windUpBehemoth(world, 'lane-dodge', { x: 400, y: 400 });

  const painted = lane(world)!;
  const dx = painted.end.x - painted.start.x;
  const dy = painted.end.y - painted.start.y;
  const len = Math.hypot(dx, dy);
  player.hasPosition.current = {
    x: painted.start.x + dx * 0.5,
    y: painted.start.y + dy * 0.5,
  };

  const telegraphs = activeAttackTelegraphs(world, NODE, startedAt);
  assert(telegraphs.length === 1, 'a charge lane is a Step Back telegraph');
  assert(
    positionInsideTelegraph(telegraphs[0], player.hasPosition.current),
    'the player is inside it',
  );

  const escape = findTelegraphEscapeDestination(world, player, startedAt);
  assert(escape !== null, 'Step Back finds a way off the lane');
  assert(
    !geometryContains(painted.geometry, escape),
    'and the destination is genuinely off the lane',
  );
  // Off the LINE, not merely further down it: the along-lane displacement must be
  // small relative to the sideways one, or the "escape" would still be in the path.
  const along = ((escape.x - player.hasPosition.current.x) * dx +
    (escape.y - player.hasPosition.current.y) * dy) / len;
  const across = Math.abs(
    ((escape.x - player.hasPosition.current.x) * -dy +
      (escape.y - player.hasPosition.current.y) * dx) / len,
  );
  assert(across > Math.abs(along), 'the exit is perpendicular, not along the lane');
}

// A BARRIER DOES NOT BLOCK THE SEQUENCE.
//
// Regression, found in manual playtest 2026-09-04: the Stoneplate Juggernaut raised
// its plate and then just stood there holding it. The barrier step was WAITING for
// the barrier to empty before advancing, so an unbroken plate stalled the pattern
// forever and the charge never happened.
//
// The barrier goes up and the sequence CONTINUES behind it; breaking the plate is
// meant to interrupt the preparation, which is why the break is watched across the
// following steps rather than inside the step that raised it.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('barrier-flow', 420, 400), 'barrier-flow');
  const monster = world.createMonster(NODE, 'stoneplate-juggernaut', { x: 400, y: 400 })!;
  const pattern = MONSTER_DATABASE.get('stoneplate-juggernaut')!.bossPattern!;
  setAggroTarget(world, monster, { id: 'barrier-flow', kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;

  updateBossPatterns(world, 100, armedAt);
  let now = armedAt;
  let sawBarrier = false;
  let reachedCharge = false;
  for (let i = 0; i < 200 && !reachedCharge; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
    const state = monster.runsBossPattern;
    if (!state) break;
    if (state.watchedBarrier) sawBarrier = true;
    if (pattern.steps[state.stepIndex]?.kind === 'charge') reachedCharge = true;
  }

  assert(sawBarrier, 'the sequence should raise a watched barrier');
  assert(
    reachedCharge,
    'and then CONTINUE to the charge — an unbroken plate must not stall the pattern',
  );
}

// Breaking the plate mid-preparation still cancels the charge into a stagger.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('barrier-break', 420, 400), 'barrier-break');
  const monster = world.createMonster(NODE, 'stoneplate-juggernaut', { x: 400, y: 400 })!;
  const pattern = MONSTER_DATABASE.get('stoneplate-juggernaut')!.bossPattern!;
  const barrierStep = pattern.steps.find(
    (step): step is Extract<typeof step, { kind: 'barrier' }> => step.kind === 'barrier',
  )!;
  setAggroTarget(world, monster, { id: 'barrier-break', kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;

  updateBossPatterns(world, 100, armedAt);
  let now = armedAt;
  for (let i = 0; i < 200 && !monster.runsBossPattern?.watchedBarrier; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(!!monster.runsBossPattern?.watchedBarrier, 'setup: the plate is up and watched');

  // Break it through the shared absorb path, mid-preparation.
  const remaining = sourceBarrierRemaining(monster, barrierStep.sourceId);
  assert(remaining > 0, 'setup: the barrier has absorb left');
  applyEnemyShield(monster, MONSTER_DATABASE.get('stoneplate-juggernaut'), remaining, now);

  now += 100;
  updateBossPatterns(world, 100, now);
  assert(!monster.runsBossPattern, 'breaking the plate cancels the rest of the sequence');
  assert(!!monster.recoversFromPattern, 'and staggers the boss');
  assert(monster.recoversFromPattern!.fromStagger, 'attributed to the break');
}

// Completing the charge ends in an ordinary recovery, NOT a stagger — the two are
// distinguished by `fromStagger`, and only the break earns the early one.
//
// NOTE what this does NOT prove: `drop-barrier` also clears the break watch, but in
// the Juggernaut's shape that step is immediately followed by `recovery`, which
// detaches the pattern in the same pass — so the watch is never consulted again and
// the clear is unreachable here. It is kept as a DEFENSIVE guard for any future
// pattern that puts steps between dropping a plate and ending, and is deliberately
// left untested rather than covered by a test that would pass either way.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('barrier-drop', 420, 400), 'barrier-drop');
  const monster = world.createMonster(NODE, 'stoneplate-juggernaut', { x: 400, y: 400 })!;
  const pattern = MONSTER_DATABASE.get('stoneplate-juggernaut')!.bossPattern!;
  setAggroTarget(world, monster, { id: 'barrier-drop', kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;

  updateBossPatterns(world, 100, armedAt);
  let now = armedAt;
  for (let i = 0; i < 300 && !monster.recoversFromPattern; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(!!monster.recoversFromPattern, 'the sequence should reach its recovery');
  assert(
    !monster.recoversFromPattern!.fromStagger,
    'completing the charge should not read as a stagger',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1/2 — the guardable-threat query.
// ─────────────────────────────────────────────────────────────────────────────

// A pattern's lane wind-up is guardable, and offers Step Back because the danger is
// painted on the ground.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('threat-a', 420, 400), 'threat-a');
  const { monster, armedAt } = armedBehemoth(world, 'threat-a', { x: 400, y: 400 });

  assert(
    guardableThreatsFor(world, monster, armedAt).length === 0,
    'an idle boss is not a threat',
  );
  updateBossPatterns(world, 100, armedAt);
  updateBossPatterns(world, 100, armedAt + 100);

  const threats = guardableThreatsFor(world, monster, armedAt + 150);
  assert(threats.length === 1, 'the wind-up is exactly one guardable threat');
  assert(threats[0].castName === CRAG_CAST.name, 'it is named as the cast bar names it');
  assert(threats[0].source === 'boss-pattern', 'attributed to the pattern layer');
  assert(threats[0].zoneId === lane(world)!.id, 'it joins the threat to its zone');
  assert(threats[0].responses.includes('step-back'), 'a painted lane can be stepped out of');
  assert(threats[0].responses.includes('guard'), 'and guarded');
}

// A pattern's UTILITY cast is NOT guardable. T2 Mountain plates up before it
// charges; spending a Guard charge on that beat would waste the answer to the
// charge that follows.
{
  const juggernaut = MONSTER_DATABASE.get('stoneplate-juggernaut');
  assert(!!juggernaut?.bossPattern, 'T2 Mountain should run a pattern');
  const plateUp = juggernaut.bossPattern.steps[0];
  assert(plateUp.kind === 'cast', 'its first step should be a cast');
  assert(plateUp.guardable === false, 'and that cast should opt out of Guard');

  const world = new World();
  world.attachPlayerEntity(playerSlices('threat-utility', 420, 400), 'threat-utility');
  const monster = world.createMonster(NODE, 'stoneplate-juggernaut', { x: 400, y: 400 })!;
  const t0 = 1_000;
  setAggroTarget(world, monster, { id: 'threat-utility', kind: 'player' }, t0);
  monster.hasAwareness.state = 'attacking';
  const pattern = juggernaut.bossPattern;
  const armedAt = t0 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
  updateBossPatterns(world, 100, armedAt);
  updateBossPatterns(world, 100, armedAt + 100);
  assert(
    monster.runsBossPattern?.stepIndex === 0,
    'setup: the boss should be on its plate-up cast',
  );
  assert(
    guardableThreatsFor(world, monster, armedAt + 150).length === 0,
    'a utility cast must not read as a guardable threat',
  );
}

// The gap this query exists to close: a generic ability area-hit counts, and a
// self-buff does NOT — spending Guard on a boss buffing itself is worse than
// not reacting at all.
{
  const damaging: MonsterAbility = {
    id: 'test-slam', name: 'Test Slam', castMs: 1_000, cooldownMs: 5_000,
    target: 'player', actions: [{ type: 'area-hit', radius: 100, multiplier: 1.5 }],
  };
  const direct: MonsterAbility = {
    id: 'test-jab', name: 'Test Jab', castMs: 800, cooldownMs: 4_000,
    target: 'player', actions: [{ type: 'hit', multiplier: 1.2 }],
  };
  const utility: MonsterAbility = {
    id: 'test-haste', name: 'Test Haste', castMs: 900, cooldownMs: 6_000,
    target: 'self',
    actions: [{
      type: 'attack-speed-buff', effectId: 'test-haste',
      attackSpeedPct: 0.2, durationMs: 4_000,
    }],
  };
  const ward: MonsterAbility = {
    id: 'test-ward', name: 'Test Ward', castMs: 900, cooldownMs: 6_000,
    target: 'self',
    actions: [{ type: 'shield', effectId: 'test-ward', shieldPct: 0.2, durationMs: 4_000 }],
  };

  assert(abilityIsGuardable(damaging), 'an area-hit is guardable');
  assert(abilityIsGuardable(direct), 'a direct hit is guardable');
  assert(!abilityIsGuardable(utility), 'a self haste buff is NOT guardable');
  assert(!abilityIsGuardable(ward), 'a self shield is NOT guardable');
  assert(
    !abilityIsGuardable({ ...damaging, actions: [] }),
    'an ability with no actions is not a threat',
  );
}

// END-TO-END: the exact case the widening exists for. The Rime-Tusk Mastodon's
// only dangerous cast is a generic `MonsterAbility` — it has NO chargedAttack — so
// under the old `isMonsterCharging` check `Enemy Charging` was blind to it and a
// Guard rule built to answer big casts silently never fired on this monster.
{
  const MASTODON = MONSTER_DATABASE.get('rime-tusk-mastodon');
  assert(!!MASTODON, 'the Rime-Tusk Mastodon should exist');
  // MUTATION GUARD: if this monster ever gains a chargedAttack the test stops
  // proving anything, because the OLD code path would have caught it too.
  assert(
    MASTODON.chargedAttack === undefined,
    'this test only proves the widening while the Mastodon has no chargedAttack',
  );
  const ability = MASTODON.monsterAbilities?.[0];
  assert(!!ability, 'the Mastodon should cast Frost-Tusk Impact');

  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('ability-threat', 415, 400), 'ability-threat');
  const monster = world.createMonster(NODE, 'rime-tusk-mastodon', { x: 400, y: 400 });
  assert(!!monster, 'the Mastodon should spawn');

  const t0 = 1_000;
  setAggroTarget(world, monster, { id: 'ability-threat', kind: 'player' }, t0);
  monster.hasAwareness.state = 'attacking';
  const armedAt = t0 + (ability.initialCooldownMs ?? ability.cooldownMs) + 1_000;
  monster.performsAttack.lastAttackAt = armedAt - monster.performsAttack.attackCooldown;

  assert(guardableThreatsFor(world, monster, armedAt).length === 0, 'idle is not a threat');
  updateCombat(world, 100, armedAt);

  const threats = guardableThreatsAgainstPlayer(world, player.isPlayer.id, armedAt + 10);
  assert(threats.length === 1, 'the ability wind-up is visible as a guardable threat');
  assert(threats[0].source === 'monster-ability', 'attributed to the generic ability machine');
  assert(threats[0].castName === ability.name, 'named as the cast bar names it');
  assert(
    !threats[0].responses.includes('step-back'),
    'a target-following hit cannot be stepped out of, so Step Back is not offered',
  );

  // And it stops being a threat the moment the cast resolves.
  updateCombat(world, 100, armedAt + ability.castMs);
  assert(
    guardableThreatsAgainstPlayer(world, player.isPlayer.id, armedAt + ability.castMs).length === 0,
    'a resolved cast is no longer a pending threat',
  );
}

console.log('bossGeometryPhase1: ok');
