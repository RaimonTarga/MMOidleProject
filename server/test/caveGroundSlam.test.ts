// The Cave ground slam — the first consumer of the ground-zone primitive (P1)
// and the `chargedAttack.aoe` rider (P2).
//
// The contract under test is the COMMITTED slam: the circle is planted where the
// target stood when the wind-up began, it lands there regardless of where anyone
// walked, and every body inside it is hit. That makes three things load-bearing,
// and all three are pinned below:
//   1. a wind-up publishes exactly one telegraph zone, at the planted point;
//   2. an interrupt (knockback / stun) aborts the cast, tells the client the
//      shot did NOT fire, and retires the circle — a telegraph must never
//      outlive the cast that drew it;
//   3. a completed cast damages EVERY player inside the radius, and nobody
//      outside it.

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCombat } from "../src/systems/combat/engine/combat";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { applyKnockback } from "../src/systems/combat/damage/knockback";
import { applyStun } from "../src/systems/combat/status/stun";
import { buildGroundZoneViews } from "../src/systems/world/groundZones";
import { freezeNode } from "../src/world/nodeLifecycle";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = "node-5-5";
const SLAM = MONSTER_DATABASE.get("cave-brute")?.chargedAttack;
assert(!!SLAM, "cave-brute should define a chargedAttack");
assert(!!SLAM!.aoe, "the cave-brute charge should carry the ground-slam aoe rider");
const RADIUS = SLAM!.aoe!.radius;

function makePlayerSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, hpRegen: 0 },
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
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
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

initCombatSystems();

/**
 * Stand a brute next to a primary target and drive it to the exact tick its
 * charge is armed. `chargeReady` keys the first cooldown off the aggro session
 * timestamp, so the clock has to run past `sinceMs + initialCooldownMs` before
 * the mob will wind up at its next attack opportunity.
 */
function armedBrute(world: World, primaryId: string, at: { x: number; y: number }) {
  const monster = world.createMonster(NODE, "cave-brute", at);
  assert(monster !== null, "test needs a cave-brute; it is not in the database");
  const t0 = 1_000;
  setAggroTarget(world, monster!, { id: primaryId, kind: "player" }, t0);
  monster!.hasAwareness.state = "attacking";
  const armedAt = t0 + (SLAM!.initialCooldownMs ?? SLAM!.cooldownMs) + 1_000;
  monster!.performsAttack.lastAttackAt = armedAt - monster!.performsAttack.attackCooldown;
  return { monster: monster!, armedAt };
}

function zones(world: World, now: number) {
  return buildGroundZoneViews(world, NODE, now) ?? [];
}

function castEvents(world: World) {
  return world
    .takeNodeEvents(NODE)
    .filter((e) => e.kind === "monster-cast-start" || e.kind === "monster-cast-end");
}

// ── 1. A wind-up plants exactly one telegraph, at the target's position ───────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("slam-a", 405, 400), "slam-a");
  const { monster, armedAt } = armedBrute(world, "slam-a", { x: 400, y: 400 });

  assert(zones(world, armedAt).length === 0, "no telegraph should exist before the wind-up");
  updateCombat(world, 100, armedAt);

  const published = zones(world, armedAt);
  assert(
    published.length === 1,
    "the wind-up should publish exactly one telegraph (got " + published.length + ")",
  );
  assert(
    published[0].x === 405 && published[0].y === 400,
    "the telegraph should be planted on the target's position at cast start",
  );
  assert(published[0].radius === RADIUS, "the telegraph radius should come from the aoe rider");
  assert(
    published[0].durationMs === SLAM!.castMs,
    "the telegraph should fill over the cast (expected " +
      SLAM!.castMs +
      ", got " +
      published[0].durationMs +
      ")",
  );

  const events = castEvents(world);
  assert(
    events.length === 1 && events[0].kind === "monster-cast-start",
    "beginning the wind-up should emit exactly one monster-cast-start",
  );

  // The circle is COMMITTED: it does not follow the target who fled it.
  // `updateMonsters` runs too, because that is where the chase decision lives —
  // without the mid-slam hold the fleeing target flips the brute to "chasing"
  // and the combat loop then aborts the very cast it was meant to be dodging.
  player.hasPosition.current = { x: 400 + RADIUS * 3, y: 400 };
  updateMonsters(world, 100, armedAt + 100);
  updateCombat(world, 100, armedAt + 100);
  const stillThere = zones(world, armedAt + 100);
  assert(stillThere.length === 1, "fleeing the circle must not cancel the committed slam");
  assert(
    stillThere[0].x === 405 && stillThere[0].y === 400,
    "the planted circle must not track the target",
  );
  assert(
    monster.hasAwareness.state === "attacking",
    "the brute should hold its swing rather than break off after the fleeing target",
  );
}

// ── 2a. Knockback mid-cast aborts, reports fired:false, retires the circle ────
{
  const world = new World();
  world.attachPlayerEntity(makePlayerSlices("slam-b", 405, 400), "slam-b");
  const { monster, armedAt } = armedBrute(world, "slam-b", { x: 400, y: 400 });

  updateCombat(world, 100, armedAt);
  assert(zones(world, armedAt).length === 1, "precondition: the wind-up published a telegraph");
  castEvents(world); // drain the cast-start

  applyKnockback(world, monster.isMonster.id, { x: 405, y: 400 }, 200);
  assert(
    monster.hasAwareness.state === "knocked-back",
    "precondition: knockback should put the monster in the knocked-back state",
  );
  updateCombat(world, 100, armedAt + 100);

  const end = castEvents(world).find((e) => e.kind === "monster-cast-end");
  assert(!!end, "a knockback mid-cast should emit monster-cast-end");
  assert(
    end!.kind === "monster-cast-end" && end!.fired === false,
    "the interrupted cast must report fired:false — the shot never landed",
  );
  assert(
    zones(world, armedAt + 100).length === 0,
    "aborting the cast must retire the telegraph; a circle promising an impact that is not coming is a lie",
  );
}

// ── 2b. Stun mid-cast does the same ──────────────────────────────────────────
{
  const world = new World();
  world.attachPlayerEntity(makePlayerSlices("slam-c", 405, 400), "slam-c");
  const { monster, armedAt } = armedBrute(world, "slam-c", { x: 400, y: 400 });

  updateCombat(world, 100, armedAt);
  assert(zones(world, armedAt).length === 1, "precondition: the wind-up published a telegraph");
  castEvents(world);

  applyStun(monster.tracksCombat, 2_000, "slam-c");
  updateCombat(world, 100, armedAt + 100);

  const end = castEvents(world).find((e) => e.kind === "monster-cast-end");
  assert(!!end, "a stun mid-cast should emit monster-cast-end");
  assert(
    end!.kind === "monster-cast-end" && end!.fired === false,
    "a stunned cast must report fired:false",
  );
  assert(zones(world, armedAt + 100).length === 0, "a stunned cast must retire the telegraph");
}

// ── 3. A completed cast damages EVERY player in radius, and nobody outside ───
{
  const world = new World();
  // Primary target, a bystander well inside the circle, and one clear of it.
  const primary = world.attachPlayerEntity(
    makePlayerSlices("slam-primary", 405, 400),
    "slam-primary",
  );
  const inside = world.attachPlayerEntity(
    makePlayerSlices("slam-inside", 405 + Math.floor(RADIUS * 0.5), 400),
    "slam-inside",
  );
  const outside = world.attachPlayerEntity(
    makePlayerSlices("slam-outside", 405 + RADIUS * 3, 400),
    "slam-outside",
  );
  const { armedAt } = armedBrute(world, "slam-primary", { x: 400, y: 400 });

  updateCombat(world, 100, armedAt);
  assert(zones(world, armedAt).length === 1, "precondition: the wind-up published a telegraph");
  castEvents(world);

  const hpBefore = {
    primary: primary.hasHealth.hp,
    inside: inside.hasHealth.hp,
    outside: outside.hasHealth.hp,
  };

  // Run the wind-up out. Nothing is nudged; the only thing that changes is the clock.
  updateCombat(world, 100, armedAt + SLAM!.castMs + 100);

  assert(
    primary.hasHealth.hp < hpBefore.primary,
    "the primary target inside the circle should be hit",
  );
  assert(
    inside.hasHealth.hp < hpBefore.inside,
    "a bystander inside the circle should be hit too",
  );
  assert(
    outside.hasHealth.hp === hpBefore.outside,
    "a player clear of the circle must take nothing — walking out IS the counterplay",
  );

  const end = castEvents(world).find((e) => e.kind === "monster-cast-end");
  assert(!!end, "a completed slam should emit monster-cast-end");
  assert(
    end!.kind === "monster-cast-end" && end!.fired === true,
    "a completed slam must report fired:true",
  );
  assert(
    zones(world, armedAt + SLAM!.castMs + 100).length === 0,
    "the telegraph should be retired once the slam resolves",
  );

  // Ground zones are runtime-only: a frozen node keeps none.
  const relit = armedBrute(world, "slam-primary", { x: 400, y: 400 });
  updateCombat(world, 100, relit.armedAt);
  assert(
    zones(world, relit.armedAt).length >= 1,
    "precondition: a second brute published a telegraph",
  );
  freezeNode(world, NODE);
  assert(
    zones(world, relit.armedAt).length === 0,
    "freezing a node must drop its ground zones — they are runtime-only and never persisted",
  );
}

console.log("caveGroundSlam: ok");
