import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  RESOLVED_NODE_FEATURES,
  emptyEquipment,
  findPathForMover,
  formatDeathCauseLabel,
  getFlag,
  moverOverlapsBlockShapes,
  pointInNodeFeatureShape,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import {
  DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG,
  findPersistentHazardEscapeDestination,
} from '../src/systems/combat/ai/dynamicHazardAvoidance';
import { updateAutoTargets } from '../src/systems/combat/ai/autoTarget';
import { beginFlee, stepFlee } from '../src/systems/combat/ai/flee';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import {
  RUNE_EVADE_TELEGRAPH_FLAG,
  updateRuneDerivedConfig,
} from '../src/systems/combat/ai/runeConfig';
import {
  activeAttackTelegraphs,
  beginTelegraphResolutionTelemetry,
  finishTelegraphResolutionTelemetry,
} from '../src/systems/combat/ai/telegraphEvasion';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  activeAvoidablePersistentGroundZones,
  pointInsideGroundZone,
  publishGroundZone,
  publishToxicPool,
  updateGroundZones,
} from '../src/systems/world/groundZones';
import { activePlayerAvoidedFeatures, isPlayerInHazardousNodeFeature, updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { updateAutoIntent } from '../src/systems/world/autoIntent';
import { runRecovery } from '../src/systems/defense/regen/recovery';
import { updateMovement } from '../src/systems/world/movement';
import { takeWorldLogEvents } from '../src/world/worldLog';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const AVOID = { conditionId: 'always', actionId: 'avoid-hazards' };
const CHASE = { conditionId: 'in-combat', actionId: 'chase-enemy' };
const ORBIT = { conditionId: 'in-combat', actionId: 'orbit' };
const STEP_BACK = { conditionId: 'inside-telegraph', actionId: 'step-back' };

function playerSlices(
  id: string,
  pos = { x: 400, y: 400 },
  rules = [CHASE, AVOID],
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...pos }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 10_000, maxHp: 10_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS, 'avoid-hazards', 'step-back'],
      runeRecipesCrafted: ['rune-recipe-avoid-hazards', 'rune-recipe-step-back'],
      runesEquipped: rules,
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function attach(world: World, id: string, rules = [CHASE, AVOID]) {
  const player = world.attachPlayerEntity(playerSlices(id, { x: 400, y: 400 }, rules), id);
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  return player;
}

function pool(world: World, now: number, opts?: { friendly?: boolean; expiresAtMs?: number; nodeId?: string }) {
  return publishToxicPool(world, opts?.nodeId ?? NODE, {
    kind: 'toxic-pool',
    pos: { x: 450, y: 400 },
    radius: 100,
    startedAtMs: now,
    expiresAtMs: opts?.expiresAtMs ?? now + 10_000,
    damagePerTick: opts?.friendly ? 0 : 10,
    tickIntervalMs: 1_000,
    slowSpeedMult: opts?.friendly ? undefined : 0.65,
    sourceId: 'bile-pool',
    sourceLabel: 'Bile Pool',
    semantics: opts?.friendly
      ? { disposition: 'friendly-to-player', persistence: 'persistent', movementResponse: 'none' }
      : undefined,
    killer: {
      monsterTypeId: 'grave-toadeater', monsterName: 'Grave Toadeater',
      isBoss: true, nodeId: NODE,
    },
  });
}

initCombatSystems();

// Outside a live pool: no escape owner and no needless attempt.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'outside');
  player.hasPosition.current = { x: 250, y: 400 };
  pool(world, now);
  updateRuneDerivedConfig(world, now);
  updateAutoTargets(world, now);
  assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'safe player must not trigger hazard escape');
  assert(!takeWorldLogEvents(world, player.isPlayer.id).some((event) => event.kind === 'hazard-escape'), 'safe player must emit no escape attempt');
}

// Inside: choose a standable destination outside the pool and move normally.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'inside');
  const hazard = pool(world, now);
  const destination = findPersistentHazardEscapeDestination(world, player, now);
  assert(destination, 'inside player should find an escape destination');
  assert(!pointInsideGroundZone(hazard, destination), 'escape destination must be outside the pool');
  updateRuneDerivedConfig(world, now);
  updateAutoTargets(world, now);
  assert(getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'inside player should latch hazard ownership');
  assert(!!player.isMoving, 'hazard escape should use normal server movement');
}

// Chase and Orbit both yield to the same active escape owner.
for (const [name, movementRule] of [['chase', CHASE], ['orbit', ORBIT]] as const) {
  const now = Date.now();
  const world = new World();
  const player = attach(world, name, [movementRule, AVOID]);
  const target = world.createMonster(NODE, 'plains-slime', { x: 700, y: 400 });
  assert(target, `${name} target should spawn`);
  pool(world, now);
  updateRuneDerivedConfig(world, now);
  updateAutoTargets(world, now);
  assert(
    !!player.isMoving && player.isMoving.motion.direction.x < 0,
    `${name} must not overwrite the leftward pool escape (${JSON.stringify(player.isMoving?.motion)}, active=${getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG)})`,
  );
}

// Higher-priority Flee can still make progress when it begins inside a pool.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'flee-owner');
  const fleeNode = 'node-clearing';
  player.hasPosition.nodeId = fleeNode;
  world.movePlayerNode(NODE, fleeNode, player.isPlayer.id);
  pool(world, now, { nodeId: fleeNode });
  beginFlee(world, player);
  stepFlee(world, player, now);
  assert(!!player.isMoving, 'Flee must remain authoritative and leave a runtime hazard blocker');
  assert(
    player.hasMovePath?.avoidHazards === false,
    'the first Flee leg from inside a runtime hazard must not be rejected by that blocker',
  );
}

// Once safe, ownership clears and ordinary target movement resumes without re-entry.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'resume');
  const hazard = pool(world, now);
  const target = world.createMonster(NODE, 'plains-slime', { x: 180, y: 400 });
  assert(target, 'resume target should spawn');
  setAttackTarget(world, player, target.isMonster.id);
  for (let i = 0; i < 40; i++) {
    const tickNow = now + i * 100;
    updateRuneDerivedConfig(world, tickNow);
    updateAutoTargets(world, tickNow);
    updateMovement(world, 100, tickNow);
    if (i > 0 && !getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG)) break;
  }
  updateRuneDerivedConfig(world, now + 4_100);
  updateAutoTargets(world, now + 4_100);
  assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'safe exit should release hazard ownership');
  assert(
    !!player.isMoving,
    `ordinary Chase should resume after the escape (pos=${JSON.stringify(player.hasPosition.current)}, target=${player.hasAttackTarget?.targetId}, path=${JSON.stringify(player.hasMovePath)})`,
  );
  for (let i = 0; i < 5; i++) updateMovement(world, 100, now + 4_200 + i * 100);
  assert(!pointInsideGroundZone(hazard, player.hasPosition.current), 'resumed path must not immediately re-enter the live pool');
}

// Expired and friendly zones are not dynamic blockers.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'classification');
  pool(world, now, { expiresAtMs: now - 1 });
  pool(world, now, { friendly: true });
  assert(activeAvoidablePersistentGroundZones(world, NODE, now).length === 0, 'expired/friendly zones must not be avoided');
  updateRuneDerivedConfig(world, now);
  updateAutoTargets(world, now);
  assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'classification exclusions must not claim movement');
}

// Step Back sees only telegraphs and wins deterministically when both are present.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'interaction', [STEP_BACK, CHASE, AVOID]);
  const owner = world.createMonster(NODE, 'plains-slime', { x: 700, y: 400 });
  assert(owner, 'telegraph owner should spawn');
  pool(world, now);
  const telegraph = publishGroundZone(world, NODE, {
    kind: 'slam-telegraph', pos: { x: 400, y: 400 }, radius: 45,
    startedAtMs: now, resolvesAtMs: now + 3_000, ownerId: owner.isMonster.id,
  });
  assert(activeAttackTelegraphs(world, NODE, now).length === 1, 'persistent pool must not be a Step Back telegraph');
  updateRuneDerivedConfig(world, now);
  assert(getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG), 'Step Back should be eligible');
  updateAutoTargets(world, now);
  assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'Step Back must win without starting a second movement owner');

  player.hasPosition.current = { x: 350, y: 400 }; // outside telegraph, still on pool edge
  updateRuneDerivedConfig(world, now + 100);
  updateAutoTargets(world, now + 100);
  assert(getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG), 'Step Back should retain ownership while safely waiting');
  assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'persistent escape must remain the next owner, not a concurrent owner');

  const capture = beginTelegraphResolutionTelemetry(world, NODE, telegraph, now + 3_000);
  finishTelegraphResolutionTelemetry(world, capture);
  updateRuneDerivedConfig(world, now + 3_001);
  updateAutoTargets(world, now + 3_001);
  assert(!getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG), 'Step Back should release when the telegraph resolves');
  assert(getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'persistent escape should take over immediately after resolution');
}

// Damage/contact/escape telemetry is authoritative and damage is logged once.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'telemetry');
  const hazard = pool(world, now);
  updateGroundZones(world, now);
  updateGroundZones(world, now + 100);
  const first = takeWorldLogEvents(world, player.isPlayer.id);
  const damage = first.filter((event) => event.kind === 'damage');
  assert(damage.length === 1, `pool damage should be recorded once per tick interval, got ${damage.length}`);
  assert(damage[0].kind === 'damage' && damage[0].source.name.includes('Bile Pool'), 'pool damage needs distinct source attribution');
  assert(first.some((event) => event.kind === 'hazard-contact' && event.phase === 'enter'), 'pool entry should be recorded');

  updateRuneDerivedConfig(world, now + 200);
  updateAutoTargets(world, now + 200);
  for (let i = 0; i < 40; i++) {
    const tickNow = now + 300 + i * 100;
    updateRuneDerivedConfig(world, tickNow);
    updateAutoTargets(world, tickNow);
    updateMovement(world, 100, tickNow);
    if (!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG)) break;
  }
  updateRuneDerivedConfig(world, now + 4_400);
  updateAutoTargets(world, now + 4_400);
  updateGroundZones(world, now + 4_400);
  const after = takeWorldLogEvents(world, player.isPlayer.id);
  assert(after.some((event) => event.kind === 'hazard-escape' && event.phase === 'attempt'), 'escape attempt should reach artifacts');
  assert(after.some((event) => event.kind === 'hazard-escape' && event.phase === 'result' && event.outcome === 'success'), 'successful exit should reach artifacts');
  const leave = after.find((event) => event.kind === 'hazard-contact' && event.phase === 'leave');
  assert(leave?.kind === 'hazard-contact' && (leave.durationMs ?? 0) > 0, 'leave telemetry should carry coherent duration');
  assert(leave?.kind === 'hazard-contact' && leave.harmfulEffects?.includes('slow'), 'contact should report harmful slow application');
}

// Lethal pool damage keeps its mechanic in both damage and death attribution.
{
  const now = Date.now();
  const world = new World();
  const player = attach(world, 'hazard-death');
  player.hasHealth.hp = 1;
  pool(world, now);
  updateGroundZones(world, now);
  const events = takeWorldLogEvents(world, player.isPlayer.id);
  assert(events.some((event) => event.kind === 'damage' && event.source.name.includes('Bile Pool')), 'lethal hazard damage should be logged');
  const death = events.find((event) => event.kind === 'player-death');
  assert(
    death?.kind === 'player-death' &&
      death.cause.kind === 'dot' &&
      formatDeathCauseLabel(death.cause).includes('Bile Pool'),
    'hazard death should retain Bile Pool attribution',
  );
}

// Static terrain must release Recover First only after an authoritative safe exit.
for (const nodeId of ['node-t2-swamp-01', 'node-t3-volcanic-01']) {
  for (const avoid of [true, false]) {
    const now = Date.now();
    const world = new World();
    const feature = RESOLVED_NODE_FEATURES[nodeId]?.find(f => f.damage?.targets.includes('player') && !f.blocksMovement?.includes('player'));
    assert(feature, `${nodeId}: requires a walkable damage feature`);
    const rules = [{ conditionId: 'always', actionId: 'wait-for-regen' }, ...(avoid ? [AVOID] : [])];
    const slices = playerSlices(`static-${nodeId}-${avoid}`, { x: feature.shape.x, y: feature.shape.y }, rules);
    slices.hasPosition.nodeId = nodeId;
    const player = world.attachPlayerEntity(slices, slices.isPlayer.id);
    Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
    player.hasHealth.maxHp = 10000;
    player.hasHealth.hp = 5000;
    player.hasHealth.recovery = 10;
    assert(isPlayerInHazardousNodeFeature(world, player), `${nodeId}: starts inside damage terrain`);
    updateRuneDerivedConfig(world, now);
    updateAutoTargets(world, now);
    assert(!!player.isMoving === avoid, `${nodeId}: only Avoid Hazards overrides recovery`);
    if (!avoid) continue;
    updateAutoIntent(world);
    assert(player.hasAutoIntent?.activeRune?.actionId === 'avoid-hazards', `${nodeId}: behavior display must show hazard escape over recovery`);
    for (let i = 0; i < 300; i++) {
      const tickNow = now + i * 100;
      updateNodeFeatures(world, 100);
      updateRuneDerivedConfig(world, tickNow);
      updateAutoTargets(world, tickNow);
      updateMovement(world, 100, tickNow);
      if (!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG)) break;
    }
    assert(!isPlayerInHazardousNodeFeature(world, player), `${nodeId}: must leave static terrain`);
    assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), `${nodeId}: must release escape ownership`);
    assert(!player.isMoving, `${nodeId}: Recover First resumes on safe ground`);
    const before = player.hasHealth.hp;
    runRecovery(world, player, 1000, false, isPlayerInHazardousNodeFeature(world, player));
    assert(player.hasHealth.hp > before, `${nodeId}: can recover after escaping`);
  }
}

// --- Durability31: status-only node features are escapable hazards too. ---
// A player stopped inside a player-targeted `statusWhileInside` bush had every
// hazard-aware path rejected at the first padded segment while auto-target
// rescanned that rejection across the roster, burning the observation's wall
// budget with 94-99.6% null paths. The escape owner now covers those features.

const JUNGLE = 'node-t4-jungle-03';
const JUNGLE_PAD = { x: 22, y: 22 };

function jungleBush(id: string) {
  const bush = RESOLVED_NODE_FEATURES[JUNGLE]?.find((f) => f.id === id);
  assert(!!bush, `${JUNGLE}: ${id} must exist`);
  assert(!bush.damage, `${id} must stay status-only for this regression`);
  assert(!!bush.statusWhileInside?.targets.includes('player'), `${id} must slow players`);
  assert(!bush.blocksMovement?.includes('player'), `${id} must not physically block players`);
  return bush;
}

function junglePlayer(world: World, name: string, pos: { x: number; y: number }, rules = [CHASE, AVOID]) {
  const slices = playerSlices(name, pos, rules);
  slices.hasPosition.nodeId = JUNGLE;
  const player = world.attachPlayerEntity(slices, name);
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  return player;
}

// The classifier sees status-only features without touching absent damage metadata.
{
  const world = new World();
  const avoided = activePlayerAvoidedFeatures(world, JUNGLE);
  assert(avoided.length === 5, `expected the five Jungle bushes, got ${avoided.length}`);
  assert(avoided.every((entry) => entry.damageActive === false), 'status-only bushes are not damage-active');
  assert(
    new Set(avoided.map((entry) => entry.feature.id)).size === avoided.length,
    'each feature must yield exactly one escape identity',
  );
  // Swamp rot pools both damage and slow: one identity, still damage-active.
  const swamp = activePlayerAvoidedFeatures(world, 'node-t2-swamp-01');
  assert(
    new Set(swamp.map((entry) => entry.feature.id)).size === swamp.length,
    'a feature that both damages and slows must not produce two hazards',
  );
  assert(swamp.some((entry) => entry.damageActive), 'damaging swamp terrain must stay damage-active');
}

// The trap is real: hazard-aware planning refuses to leave the bush, and the
// same start/goal succeeds once hazard geometry is dropped.
{
  const bush = jungleBush('jungle_bush_3');
  const trapped = { x: bush.shape.x, y: bush.shape.y };
  const goal = { x: 3909, y: 3211 };
  assert(
    findPathForMover(JUNGLE, 'player', JUNGLE_PAD, trapped, goal, new Set(), true) === null,
    'the diagnosed trap requires hazard-aware planning to fail from inside the bush',
  );
  assert(
    findPathForMover(JUNGLE, 'player', JUNGLE_PAD, trapped, goal, new Set(), false) !== null,
    'the bush is not a physical blocker; only hazard geometry rejects the path',
  );
}

// Invariant 5: escape the bush envelope, then acquire and approach a target.
{
  const now = Date.now();
  const world = new World();
  const bush = jungleBush('jungle_bush_3');
  const player = junglePlayer(world, 'jungle-slow-escape', { x: bush.shape.x, y: bush.shape.y });
  const inBush = (pos: { x: number; y: number }) => pointInNodeFeatureShape(pos, bush.shape);
  assert(inBush(player.hasPosition.current), 'regression must start inside the slow bush');

  updateRuneDerivedConfig(world, now);
  updateAutoTargets(world, now);
  assert(getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'a status-only bush must claim escape ownership');
  assert(player.hasMovePath?.avoidHazards === false || !!player.isMoving, 'the escape leg must plan against real collision only');

  for (let i = 0; i < 400; i++) {
    const tickNow = now + i * 100;
    updateNodeFeatures(world, 100);
    updateRuneDerivedConfig(world, tickNow);
    updateAutoTargets(world, tickNow);
    updateMovement(world, 100, tickNow);
    if (i > 0 && !getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG)) break;
  }
  assert(!getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG), 'escape must release once clear');
  assert(!inBush(player.hasPosition.current), 'the player must end outside the slow bush');
  assert(
    !activePlayerAvoidedFeatures(world, JUNGLE)
      .some((entry) => pointInNodeFeatureShape(player.hasPosition.current, entry.feature.shape)),
    'the exit must not land inside another avoided feature',
  );
  assert(
    !moverOverlapsBlockShapes(player.hasPosition.current, world.collision.blockShapes(JUNGLE, 'player'), JUNGLE_PAD),
    'the exit must be physically standable',
  );

  // Ordinary hazard-aware target acquisition works again from the safe position.
  const target = world.createMonster(JUNGLE, 'plains-slime', {
    x: player.hasPosition.current.x + 420,
    y: player.hasPosition.current.y,
  });
  assert(!!target, 'regression target should spawn');
  setAttackTarget(world, player, target.isMonster.id);
  const before = Math.hypot(
    player.hasPosition.current.x - target.hasPosition.current.x,
    player.hasPosition.current.y - target.hasPosition.current.y,
  );
  for (let i = 0; i < 20; i++) {
    const tickNow = now + 40_100 + i * 100;
    updateRuneDerivedConfig(world, tickNow);
    updateAutoTargets(world, tickNow);
    updateMovement(world, 100, tickNow);
  }
  const after = Math.hypot(
    player.hasPosition.current.x - target.hasPosition.current.x,
    player.hasPosition.current.y - target.hasPosition.current.y,
  );
  assert(after < before, `approach must resume after the escape (${before} -> ${after})`);
}

// Invariant 1: a feature that does not apply to the player claims nothing.
{
  const now = Date.now();
  const world = new World();
  const bush = jungleBush('jungle_bush_3');
  const status = bush.statusWhileInside!;
  const original = status.targets;
  (status as { targets: string[] }).targets = ['monster'];
  try {
    assert(
      activePlayerAvoidedFeatures(world, JUNGLE).length === 4,
      'a monster-only status feature must drop out of the player escape set',
    );
    const player = junglePlayer(world, 'jungle-monster-only', { x: bush.shape.x, y: bush.shape.y });
    updateRuneDerivedConfig(world, now);
    updateAutoTargets(world, now);
    assert(
      !getFlag(player.tracksCombat, DYNAMIC_HAZARD_ESCAPE_ACTIVE_FLAG),
      'a feature that cannot affect the player must not claim movement',
    );
  } finally {
    (status as { targets: string[] }).targets = original as string[];
  }
  assert(activePlayerAvoidedFeatures(world, JUNGLE).length === 5, 'targets must be restored');
}

console.log('runeDynamicHazardAvoidance.test.ts: ok');
