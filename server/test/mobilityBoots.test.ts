// Wiring smoke test for the four mechanics the T1 item rework added or changed.
// Every expectation is a MECHANIC INVARIANT derived from what the items actually
// author — never a balance number — so the balance pass can move every value in
// the recipe tables without touching this file.
//
//   1. `mobility.slow-resistance` softens a soft slow's MAGNITUDE, leaves a root
//      alone, and is read from a really-equipped boot (not a poked passive map).
//   2. `mobility.approach-speed-pct` pays out only while moving TOWARD the
//      current target and only while outside the minimum gap — no proc, no timer.
//   3. Weapons are off the +N ladder entirely (Phase 2b: a weapon's power track
//      is its lineage tree, not this ladder) — `effectiveAttacksPerSecond` must
//      report the same cadence at every plus, and the stat rebuild must agree.
//   4. Clearing gear is fixed-power: `getMaxUpgrade` is 0 and `checkUpgrade` says no.

import {
  GAME_CONFIG,
  ITEM_DATABASE,
  STARTER_RUNE_IDS,
  checkUpgrade,
  effectiveAttacksPerSecond,
  emptyEquipment,
  getMaxUpgrade,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import {
  bootSpeedMultiplier,
  slowResistedMult,
} from "../src/systems/world/mobility/mobilityBoots";
import { attachComponent } from "../src/ecs/markerHelpers";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function near(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

/**
 * Point the player's motion at a unit direction. Written straight onto the
 * component rather than through `setEntityMotion`, which runs pathfinding — the
 * thing under test is `bootSpeedMultiplier`'s reading of the direction, not nav.
 */
function faceMotion(world: World, dx: number, dy: number): void {
  attachComponent(world, player, "isMoving", {
    motion: { direction: { x: dx, y: dy }, magnitude: player.hasPosition.speed },
  });
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "boots-player", name: "Boots Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
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
      attunedAbilities: { techniques: [], guards: [] },
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

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "boots-player");

// ── 1. Slow resistance scales magnitude, and never touches a root ────────────
//
// Equipped for real: recalc REBUILDS `usesSkills.passives` from scratch, so a
// test that wrote the key straight into the map would prove nothing about the
// item wiring.

const MARSH = "swamp-boots-t1";
const marsh = ITEM_DATABASE.get(MARSH);
assert(marsh !== undefined, `test needs '${MARSH}' in the item database`);
const resist = marsh!.mechanicEffects?.["mobility.slow-resistance"] ?? 0;
assert(resist > 0, `'${MARSH}' should author mobility.slow-resistance (got ${resist})`);

assert(
  near(slowResistedMult(player, 0.5), 0.5),
  "barefoot, a 50% slow must arrive at full strength",
);

player.holdsInventory.equipment.mobility = MARSH;
recalculatePlayerEntityStats(world, player);

// A 50% slow (mult 0.5) softened by `resist` is 1 - 0.5 * (1 - resist).
const expected = 1 - 0.5 * (1 - resist);
assert(
  near(slowResistedMult(player, 0.5), expected),
  `slow resistance should soften mult 0.5 to ${expected}, got ${slowResistedMult(player, 0.5)}`,
);
assert(
  slowResistedMult(player, 0.5) > 0.5,
  "a resisted slow must leave the player FASTER than an unresisted one",
);
assert(
  slowResistedMult(player, 0) === 0,
  "a root is hard control: slow resistance must not let a rooted player move",
);
assert(
  slowResistedMult(player, 1) === 1,
  "a non-slow multiplier must pass through untouched",
);

// ── 2. Gap closing is conditional, continuous, and has no proc state ─────────

const TREADS = "mountain-boots-t1";
const treads = ITEM_DATABASE.get(TREADS);
assert(treads !== undefined, `test needs '${TREADS}' in the item database`);
const approach = treads!.mechanicEffects?.["mobility.approach-speed-pct"] ?? 0;
assert(approach > 0, `'${TREADS}' should author mobility.approach-speed-pct (got ${approach})`);

player.holdsInventory.equipment.mobility = TREADS;
recalculatePlayerEntityStats(world, player);

const target = world.createMonster("node-5-5", "plains-slime", { x: 1200, y: 400 });
assert(target !== undefined && target !== null, "failed to create the test target");
setAttackTarget(world, player, target!.isMonster.id);

const now = 0;

// Standing still with a target: no bonus. The mechanic is about CLOSING, and a
// stationary player is not closing anything.
assert(
  near(bootSpeedMultiplier(world, player, now), 1),
  "gap closing must not pay out while standing still",
);

// Moving toward a distant target: full bonus.
faceMotion(world, 1, 0);
assert(
  near(bootSpeedMultiplier(world, player, now), 1 + approach),
  `closing on a distant target should give 1 + ${approach}, got ${bootSpeedMultiplier(world, player, now)}`,
);

// Moving AWAY from the same target: nothing. These boots never help you retreat.
faceMotion(world, -1, 0);
assert(
  near(bootSpeedMultiplier(world, player, now), 1),
  "gap closing must not pay out while retreating",
);

// Already in contact: nothing, even though the player is moving toward it. This
// is the guard that stops the boots becoming unconditional combat move speed.
target!.hasPosition.current = { x: 410, y: 400 };
faceMotion(world, 1, 0);
assert(
  near(bootSpeedMultiplier(world, player, now), 1),
  "gap closing must switch off once inside the minimum gap",
);

// ── 3. Weapons are off the +N ladder: cadence cannot be upgraded ────────────
// Phase 2b removed the weapon upgrade ladder (a weapon's power track is its
// lineage tree instead). `getMaxUpgrade` must say 0, and `effectiveAttacksPerSecond`
// must therefore report the same base cadence at the only legal plus.

const RAPIER = "flash-rapier";
const rapier = ITEM_DATABASE.get(RAPIER);
assert(rapier !== undefined, `test needs '${RAPIER}' in the item database`);
const baseAps = rapier!.attacksPerSecond ?? 0;
assert(baseAps > 0, `'${RAPIER}' should author attacksPerSecond`);

const maxPlus = getMaxUpgrade(rapier!);
assert(maxPlus === 0, `'${RAPIER}' must be off the +N ladder (got max +${maxPlus})`);
assert(
  near(effectiveAttacksPerSecond(rapier!, maxPlus) ?? 0, baseAps),
  "a weapon's cadence cannot change at its only legal plus (+0)",
);

// And the stat rebuild has to agree, not just the helper.
player.holdsInventory.equipment.weapon = RAPIER;
player.holdsInventory.itemUpgrades = {};
recalculatePlayerEntityStats(world, player);
const cdAtZero = player.performsAttack.attackCooldown;

player.holdsInventory.itemUpgrades = { [RAPIER]: maxPlus };
recalculatePlayerEntityStats(world, player);
const cdAtMax = player.performsAttack.attackCooldown;

assert(
  cdAtMax === cdAtZero,
  `a weapon's attack cooldown must not change off the +N ladder (${cdAtZero}ms vs ${cdAtMax}ms)`,
);
assert(
  cdAtZero === Math.round(1000 / baseAps),
  `cooldown should be round(1000/${baseAps}) = ${Math.round(1000 / baseAps)}, got ${cdAtZero}`,
);

// ── 4. Clearing gear is fixed-power ──────────────────────────────────────────

const CLEARING_IDS = [
  "primordial-club",
  "clearing-vest-t1",
  "clearing-charm-t1",
  "clearing-boots-t1",
];

for (const id of CLEARING_IDS) {
  const def = ITEM_DATABASE.get(id);
  assert(def !== undefined, `test needs '${id}' in the item database`);
  assert(
    getMaxUpgrade(def!) === 0,
    `tutorial item '${id}' must be off the +N track (got max +${getMaxUpgrade(def!)})`,
  );
  const check = checkUpgrade({
    item: def!,
    currentPlus: 0,
    biomeLevel: 99,
    essences: { red: 9999, blue: 9999, green: 9999, yellow: 9999, purple: 9999 },
    globalMastery: 9999,
  });
  assert(
    !check.ok,
    `tutorial item '${id}' must refuse an upgrade even with unlimited resources`,
  );
}

// No T1-biome item rides the +N ladder any more: weapons left it in Phase 2b,
// armour/charm/boots in design §24.5 (crafted at full power).
for (const def of ITEM_DATABASE.values()) {
  if (def.tier !== 1) continue;
  assert(
    getMaxUpgrade(def) === 0,
    `T1 item '${def.id}' must be off the +N ladder (got max +${getMaxUpgrade(def)})`,
  );
}

console.log("mobilityBoots: ok");
