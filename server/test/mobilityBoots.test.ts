// Wiring smoke test for the four mechanics the T1 item rework added or changed.
// Every expectation is a MECHANIC INVARIANT derived from what the items actually
// author — never a balance number — so the balance pass can move every value in
// the recipe tables without touching this file.
//
//   1. `mobility.slow-resistance` softens a soft slow's MAGNITUDE, leaves a root
//      alone, and is read from a really-equipped boot (not a poked passive map).
//   2. `mobility.approach-speed-pct` pays out only while moving TOWARD the
//      current target and only while outside the minimum gap — no proc, no timer.
//   3. Weapon upgrade steps may carry an `attacksPerSecond` delta, and the stat
//      rebuild has to fold it in before attack-speed multipliers.
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

function assert(condition: boolean, message: string): void {
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

// ── 3. Upgrade steps can spend budget on cadence ─────────────────────────────

const RAPIER = "flash-rapier";
const rapier = ITEM_DATABASE.get(RAPIER);
assert(rapier !== undefined, `test needs '${RAPIER}' in the item database`);
const baseAps = rapier!.attacksPerSecond ?? 0;
assert(baseAps > 0, `'${RAPIER}' should author attacksPerSecond`);

const maxPlus = getMaxUpgrade(rapier!);
const topAps = effectiveAttacksPerSecond(rapier!, maxPlus) ?? 0;
assert(
  topAps > baseAps,
  `'${RAPIER}' spends upgrade budget on cadence, so +${maxPlus} APS (${topAps}) must exceed +0 (${baseAps})`,
);
assert(
  near(effectiveAttacksPerSecond(rapier!, 0) ?? 0, baseAps),
  "+0 must equal the authored base APS",
);

// And the stat rebuild has to honour it, not just the helper.
player.holdsInventory.equipment.weapon = RAPIER;
player.holdsInventory.itemUpgrades = {};
recalculatePlayerEntityStats(world, player);
const cdAtZero = player.performsAttack.attackCooldown;

player.holdsInventory.itemUpgrades = { [RAPIER]: maxPlus };
recalculatePlayerEntityStats(world, player);
const cdAtMax = player.performsAttack.attackCooldown;

assert(
  cdAtMax < cdAtZero,
  `an APS upgrade must shorten the attack cooldown (${cdAtZero}ms → ${cdAtMax}ms)`,
);
assert(
  cdAtMax === Math.round(1000 / topAps),
  `cooldown should be round(1000/${topAps}) = ${Math.round(1000 / topAps)}, got ${cdAtMax}`,
);

// A weapon that spends nothing on cadence must be completely unaffected.
const HAMMER = "heavy-hammer";
const hammer = ITEM_DATABASE.get(HAMMER);
assert(hammer !== undefined, `test needs '${HAMMER}' in the item database`);
assert(
  near(
    effectiveAttacksPerSecond(hammer!, getMaxUpgrade(hammer!)) ?? 0,
    hammer!.attacksPerSecond ?? 0,
  ),
  "a weapon with no authored APS deltas must keep its base cadence at every +N",
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
    catalysts: {},
    globalMastery: 9999,
  });
  assert(
    !check.ok,
    `tutorial item '${id}' must refuse an upgrade even with unlimited resources`,
  );
}

// Every non-tutorial T1-biome item, by contrast, still upgrades to +5.
for (const def of ITEM_DATABASE.values()) {
  if (def.tier !== 1) continue;
  if (def.slot === "core" || def.slot === "relic") continue;
  assert(
    getMaxUpgrade(def) === 5,
    `T1 item '${def.id}' should reach +5 (got max +${getMaxUpgrade(def)})`,
  );
}

console.log("mobilityBoots: ok");
