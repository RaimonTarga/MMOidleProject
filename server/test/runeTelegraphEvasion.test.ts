import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  deriveAutoConfigFromRunes,
  distanceSq,
  emptyEquipment,
  getFlag,
  runeRuleCost,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  RUNE_EVADE_TELEGRAPH_FLAG,
  updateRuneDerivedConfig,
} from "../src/systems/combat/ai/runeConfig";
import {
  beginTelegraphResolutionTelemetry,
  findTelegraphEscapeDestination,
  finishTelegraphResolutionTelemetry,
  positionInsideTelegraph,
} from "../src/systems/combat/ai/telegraphEvasion";
import { updateAutoTargets } from "../src/systems/combat/ai/autoTarget";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateCombat } from "../src/systems/combat/engine/combat";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import {
  publishFaultLineBurst,
  publishGroundZone,
  clearGroundZonesByOwner,
} from "../src/systems/world/groundZones";
import { updateMovement } from "../src/systems/world/movement";
import { respawnPlayer } from "../src/systems/world/spawning";
import { takeWorldLogEvents } from "../src/world/worldLog";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = "node-5-5";
const EVADE_RULE = { conditionId: "inside-telegraph", actionId: "step-back" };

function playerSlices(
  id: string,
  pos = { x: 400, y: 400 },
  rules = [EVADE_RULE],
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...pos }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
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
      runesOwned: [...STARTER_RUNE_IDS, "step-back", "avoid-hazards"],
      runeRecipesCrafted: ["rune-recipe-step-back"],
      runesEquipped: rules,
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
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
      combatArchetype: null,
    },
  };
}

// Catalog/economy: the complete early-T1 pair costs 3 RP and Step Back comes from Cave.
assert(runeRuleCost(EVADE_RULE) === 3, "Inside Telegraph -> Step Back should cost 3 RP");
const actionRecipe = RUNE_RECIPE_DATABASE.get("rune-recipe-step-back");
assert(
  STARTER_RUNE_IDS.includes("inside-telegraph"),
  "Inside Telegraph should follow the live baseline-situation vocabulary rule",
);
assert(
  actionRecipe?.recipeGroup === "cave" &&
    actionRecipe.requiredBiomeLevel === 2 &&
    actionRecipe.cost.red === 35 &&
    actionRecipe.cost.blue === undefined,
  "Step Back should unlock at Cave mastery 2 for 35 red essence",
);

// Shared rule folding identifies the acquisition edge; the server lifecycle
// deliberately extends ownership beyond this per-tick geometric condition.
const orderedRules = [
  EVADE_RULE,
  { conditionId: "hp-below-25", actionId: "flee" },
  { conditionId: "in-combat", actionId: "orbit" },
  { conditionId: "always", actionId: "avoid-hazards" },
];
const insideFold = deriveAutoConfigFromRunes(orderedRules, {
  hpPct: 0.2,
  inCombat: true,
  inParty: false,
  aggroCount: 1,
  insideDangerousTelegraph: true,
});
assert(insideFold.evadeTelegraph, "Step Back should claim movement inside a telegraph");
assert(!insideFold.fleeRequested && !insideFold.orbit, "lower movement rules should yield");
assert(insideFold.avoidHazards, "persistent hazard pathing should remain independently active");

const safeFold = deriveAutoConfigFromRunes(orderedRules, {
  hpPct: 0.2,
  inCombat: true,
  inParty: false,
  aggroCount: 1,
  insideDangerousTelegraph: false,
});
assert(safeFold.fleeRequested, "normal ordered movement fallback should resume once safe");

initCombatSystems();

// Owning Step Back is not sufficient: its authored condition must be active at acquisition.
{
  const world = new World();
  const player = world.attachPlayerEntity(
    playerSlices("inactive-step-back", undefined, [
      { conditionId: "hp-below-25", actionId: "step-back" },
    ]),
    "inactive-step-back",
  );
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(NODE, "plains-slime", { x: 650, y: 400 });
  assert(monster, "inactive Step Back owner should spawn");
  publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: monster.isMonster.id,
  });
  updateRuneDerivedConfig(world, 1_000);
  assert(!player.evadesTelegraphs, "inactive Step Back condition must not broaden acquisition scope");
}

// Acquire -> move outside -> hold owner while safe -> resolve -> release.
{
  const world = new World();
  const chase = { conditionId: "in-combat", actionId: "chase-enemy" };
  const player = world.attachPlayerEntity(playerSlices("evader", undefined, [EVADE_RULE, chase]), "evader");
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(NODE, "plains-slime", { x: 650, y: 400 });
  assert(monster, "test telegraph owner should spawn");
  const zone = publishGroundZone(world, NODE, {
    kind: "slam-telegraph",
    pos: { x: 400, y: 400 },
    radius: 90,
    startedAtMs: 1_000,
    resolvesAtMs: 3_000,
    ownerId: monster.isMonster.id,
  });

  const telemetry: Array<{ kind: string; value?: number }> = [];
  world.analyticsRuneTelegraph = (_playerId, _nodeId, kind, value) => {
    telemetry.push({ kind, value });
  };

  world.tick(100, 1_000);
  assert(getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG), "inside telegraph should activate Step Back");
  assert(telemetry.filter((event) => event.kind === "rune-activation").length === 1, "activation should edge-trigger once");
  assert(telemetry.filter((event) => event.kind === "telegraph-dodge-attempt").length === 1, "one telegraph should create one attempt");

  assert(player.isMoving, "Step Back should request server-authoritative movement");
  for (let i = 0; i < 10 && positionInsideTelegraph(zone, player.hasPosition.current); i++) {
    updateMovement(world, 100, 1_100 + i * 100);
  }
  assert(!positionInsideTelegraph(zone, player.hasPosition.current), "player should move beyond the damage circle");
  updateRuneDerivedConfig(world, 2_000);
  assert(getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG), "crossing the boundary must not release Step Back");
  assert(!!player.evadesTelegraphs, "component presence should retain movement ownership");
  updateAutoTargets(world, 2_000);
  assert(!player.isMoving, "once safe, Step Back should hold ownership without running farther");

  setAttackTarget(world, player, monster.isMonster.id);
  updateAutoTargets(world, 2_050);
  assert(!player.isMoving, "Chase must not reacquire while the telegraph is unresolved");

  const capture = beginTelegraphResolutionTelemetry(world, NODE, zone, 3_000);
  clearGroundZonesByOwner(world, NODE, monster.isMonster.id);
  finishTelegraphResolutionTelemetry(world, capture);
  assert(!player.evadesTelegraphs, "authoritative resolution should immediately release ownership");
  updateRuneDerivedConfig(world, 3_001);
  updateAutoTargets(world, 3_001);
  assert(!!player.isMoving, "Chase should resume immediately after Step Back ends");

  player.hasPosition.current = { x: 650, y: 400 };
  updateRuneDerivedConfig(world, 3_100);
  assert(!getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG), "an enemy cast must not trigger when the player is already safe");

  const events = takeWorldLogEvents(world, player.isPlayer.id).filter(
    (event) => event.kind === "telegraph-dodge",
  );
  const attempt = events.find((event) => event.kind === "telegraph-dodge" && event.phase === "attempt");
  const safe = events.find((event) => event.kind === "telegraph-dodge" && event.phase === "safe");
  const release = events.find((event) => event.kind === "telegraph-dodge" && event.phase === "release");
  assert(
    attempt?.kind === "telegraph-dodge" &&
      attempt.telegraphId === zone.id &&
      !!attempt.startingPosition &&
      !!attempt.escapePoint &&
      (attempt.telegraphGeometry?.length ?? 0) > 0,
    "attempt artifacts should identify the telegraph, start geometry, and escape point",
  );
  assert(safe?.kind === "telegraph-dodge" && safe.firstSafeAtMs === 2_000, "safe transition should be timestamped");
  assert(
    release?.kind === "telegraph-dodge" &&
      release.releaseReason === "resolved" &&
      release.releasedAtMs === 3_000,
    "release artifact should identify authoritative resolution and timestamp",
  );
}

// Orbit, like Chase, yields to a safe-but-unresolved Step Back owner.
{
  const orbit = { conditionId: "in-combat", actionId: "orbit" };
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices("orbiter", { x: 400, y: 400 }, [EVADE_RULE, orbit]), "orbiter");
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(NODE, "plains-slime", { x: 650, y: 400 });
  assert(monster, "orbit target should spawn");
  const zone = publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: monster.isMonster.id,
  });
  setAttackTarget(world, player, monster.isMonster.id);
  updateRuneDerivedConfig(world, 1_000);
  player.hasPosition.current = { x: 520, y: 400 };
  updateRuneDerivedConfig(world, 1_500);
  updateAutoTargets(world, 1_500);
  assert(!player.isMoving && !!player.evadesTelegraphs, "Orbit must not reacquire before resolution");
  const capture = beginTelegraphResolutionTelemetry(world, NODE, zone, 3_000);
  finishTelegraphResolutionTelemetry(world, capture);
  assert(!player.evadesTelegraphs, "Orbit fixture should release at resolution");
}

// Overlapping telegraphs: choose a nearby standable point outside the full union.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices("overlap", { x: 440, y: 400 }), "overlap");
  const left = world.createMonster(NODE, "plains-slime", { x: 250, y: 400 });
  const right = world.createMonster(NODE, "plains-slime", { x: 650, y: 400 });
  assert(left && right, "overlap owners should spawn");
  const zoneA = publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: left.isMonster.id,
  });
  const zoneB = publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 470, y: 400 }, radius: 90,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: right.isMonster.id,
  });
  const destination = findTelegraphEscapeDestination(world, player, 1_000);
  assert(destination, "overlapping circles should have a nearby escape candidate");
  assert(!positionInsideTelegraph(zoneA, destination), "destination should clear the first telegraph");
  assert(!positionInsideTelegraph(zoneB, destination), "destination should clear the overlapping telegraph");
  assert(distanceSq(player.hasPosition.current, destination) < 160 * 160, "escape should stay local rather than run arbitrarily far");
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  updateRuneDerivedConfig(world, 1_000);
  assert(
    JSON.stringify(Object.keys(player.evadesTelegraphs?.threats ?? {})) === JSON.stringify([zoneA.id, zoneB.id].sort()),
    "overlapping threats should be tracked deterministically by runtime id",
  );
  const first = beginTelegraphResolutionTelemetry(world, NODE, zoneA, 2_000);
  finishTelegraphResolutionTelemetry(world, first);
  assert(!!player.evadesTelegraphs, "resolving one overlap must retain ownership for the other");
  const second = beginTelegraphResolutionTelemetry(world, NODE, zoneB, 3_000);
  finishTelegraphResolutionTelemetry(world, second);
  assert(!player.evadesTelegraphs, "ownership should end after the final tracked overlap resolves");
}

// Resolution telemetry: exits count as successes; remaining inside records damage/failure.
{
  const world = new World();
  const successful = world.attachPlayerEntity(playerSlices("success"), "success");
  const failed = world.attachPlayerEntity(playerSlices("failure"), "failure");
  Object.assign(successful.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  Object.assign(failed.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(NODE, "plains-slime", { x: 700, y: 400 });
  assert(monster, "fault-line owner should spawn");
  monster.performsAttack.lastAttackAt = 2_000;
  publishFaultLineBurst(world, NODE, {
    kind: "fault-line-telegraph",
    pos: { x: 400, y: 400 },
    radius: 60,
    startedAtMs: 1_000,
    resolvesAtMs: 2_000,
    ownerId: monster.isMonster.id,
    points: [{ x: 400, y: 400 }],
    damageMultiplier: 1,
  });
  const telemetry: Array<{ playerId: string; kind: string; value?: number }> = [];
  world.analyticsRuneTelegraph = (playerId, _nodeId, kind, value) => {
    telemetry.push({ playerId, kind, value });
  };

  updateRuneDerivedConfig(world, 1_000);
  successful.hasPosition.current = { x: 520, y: 400 };
  updateRuneDerivedConfig(world, 1_500);
  const failedHp = failed.hasHealth.hp;
  updateCombat(world, 100, 2_000);

  assert(telemetry.some((event) => event.playerId === "success" && event.kind === "telegraph-dodge-success"), "safe exit should be measured at resolution");
  const failure = telemetry.find((event) => event.playerId === "failure" && event.kind === "telegraph-dodge-failure");
  assert(failure, "remaining in the telegraph should be a failed dodge");
  assert(failed.hasHealth.hp < failedHp && (failure.value ?? 0) > 0, "failed dodge should include actual received damage");
  const successArtifact = takeWorldLogEvents(world, successful.isPlayer.id).find(
    (event) => event.kind === "telegraph-dodge" && event.outcome === "success",
  );
  const failureArtifact = takeWorldLogEvents(world, failed.isPlayer.id).find(
    (event) => event.kind === "telegraph-dodge" && event.outcome === "failure",
  );
  assert(!!successArtifact, "successful Step Back result should reach bot-visible world events");
  assert(
    failureArtifact?.kind === "telegraph-dodge" && (failureArtifact.damageReceived ?? 0) > 0,
    "failed Step Back result should expose authoritative damage to bot artifacts",
  );
}

// Interrupted/aborted telegraphs are discarded, never mislabeled as successes.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices("discarded"), "discarded");
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(NODE, "plains-slime", { x: 650, y: 400 });
  assert(monster, "discard owner should spawn");
  publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: monster.isMonster.id,
  });
  updateRuneDerivedConfig(world, 1_000);
  clearGroundZonesByOwner(world, NODE, monster.isMonster.id);
  updateRuneDerivedConfig(world, 1_100);
  const discarded = takeWorldLogEvents(world, player.isPlayer.id).find(
    (event) => event.kind === "telegraph-dodge" && event.outcome === "discarded",
  );
  assert(!!discarded, "interrupted telegraph attempts should expose discard semantics");
  assert(!player.evadesTelegraphs, "discarded telegraph must not strand movement ownership");
}

// Caster death and impossible geometry cannot strand ownership indefinitely.
{
  const world = new World();
  const blockedNode = "node-clearing";
  const slices = playerSlices("caster-death");
  slices.hasPosition.nodeId = blockedNode;
  const player = world.attachPlayerEntity(slices, "caster-death");
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(blockedNode, "plains-slime", { x: 650, y: 400 });
  assert(monster, "caster-death owner should spawn");
  publishGroundZone(world, blockedNode, {
    kind: "slam-telegraph", pos: { x: 2_400, y: 2_400 }, radius: 5_000,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: monster.isMonster.id,
  });
  updateRuneDerivedConfig(world, 1_000);
  updateAutoTargets(world, 1_000);
  assert(
    !!player.evadesTelegraphs && !player.isMoving,
    `impossible escape should safely hold still while the threat exists (owner=${!!player.evadesTelegraphs}, escape=${JSON.stringify(player.evadesTelegraphs?.escapePoint)}, motion=${JSON.stringify(player.isMoving)})`,
  );
  world.removeMonsterEntity(monster.isMonster.id);
  updateRuneDerivedConfig(world, 1_100);
  assert(!player.evadesTelegraphs, "caster death must release an otherwise blocked response");
  const release = takeWorldLogEvents(world, player.isPlayer.id).find(
    (event) => event.kind === "telegraph-dodge" && event.phase === "release",
  );
  assert(release?.kind === "telegraph-dodge" && release.releaseReason === "caster-gone", "caster-loss release reason should be explicit");
}

// Respawn is an authoritative interruption and must produce a visible release.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices("respawn-release"), "respawn-release");
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
  const monster = world.createMonster(NODE, "plains-slime", { x: 650, y: 400 });
  assert(monster, "respawn-release owner should spawn");
  publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1_000, resolvesAtMs: 3_000, ownerId: monster.isMonster.id,
  });
  updateRuneDerivedConfig(world, 1_000);
  respawnPlayer(world, player.isPlayer.id);
  assert(!player.evadesTelegraphs, "respawn must release Step Back ownership");
  const release = takeWorldLogEvents(world, player.isPlayer.id).find(
    (event) => event.kind === "telegraph-dodge" && event.phase === "release",
  );
  assert(
    release?.kind === "telegraph-dodge" && release.releaseReason === "player-respawned",
    "respawn release reason should be explicit",
  );
}

console.log("runeTelegraphEvasion.test.ts: ok");
