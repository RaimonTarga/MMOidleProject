// Evasion is deterministic: no RNG, a fractional accumulator that must step
// predictably and wrap exactly once per full point. This is the arbiter for the
// "dodges never seem to happen" report — it pins the mechanic AND the client
// event it produces, because those turn out to be two different questions.

import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { attachComponent, detachComponent } from "../src/ecs/markerHelpers";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { runMonsterAttack } from "../src/systems/combat/engine/combat";
import { resetEvadeAccumulator } from "../src/systems/defense/mitigation/evasion";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * The accumulator IS the networked slice field now, not a server-only counter
 * mirrored into one — so reading it here reads exactly what the client is sent.
 */
function charge(): number {
  return player.evadesHits?.charge ?? 0;
}

/** Floating-point accumulator, so compare with a tolerance rather than ===. */
function near(a: number, b: number, tolerance = 1e-9): boolean {
  return Math.abs(a - b) <= tolerance;
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "evade-player", name: "Evade Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: 100_000,
      maxHp: 100_000,
      hpRegen: 0,
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
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
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

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "evade-player");

// `evadesHits` is an optional component, attached only while the player actually
// has evasion — so the test attaches it the sanctioned way rather than poking a
// slice that may not exist. A clean quarter dodge rate puts the wrap on a
// countable hit instead of a rounding edge.
attachComponent(world, player, "evadesHits", { dodgeRate: 0.25, evadeMitigation: 0.5, charge: 0 });
// Isolate evasion from every other mitigation layer, so a damage change can only
// have come from the evade.
player.mitigatesDamage.plating = 0;
player.mitigatesDamage.damageReduction = 0;

const monster = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 });
assert(monster !== null, "test needs a monster; 'plains-slime' is not in the database");

let now = 1_000;
function hit(): { damage: number; hpBefore: number; hpAfter: number } {
  const hpBefore = player.hasHealth.hp;
  now += 1_000;
  runMonsterAttack(world, monster!, player, now);
  const hpAfter = player.hasHealth.hp;
  return { damage: hpBefore - hpAfter, hpBefore, hpAfter };
}

// ── The accumulator steps, then wraps ────────────────────────────────────────

resetEvadeAccumulator(world, player);
assert(
  near(charge(), GAME_CONFIG.EVADE_OOC_RESET),
  `out-of-combat reset should seed the accumulator to EVADE_OOC_RESET (got ${
    charge()
  })`,
);

const first = hit();
assert(
  near(charge(), 0.25),
  `hit 1 should step the accumulator to 0.25 (got ${charge()})`,
);
const second = hit();
assert(
  near(charge(), 0.5),
  `hit 2 should step the accumulator to 0.5 (got ${charge()})`,
);
const third = hit();
assert(
  near(charge(), 0.75),
  `hit 3 should step the accumulator to 0.75 (got ${charge()})`,
);

assert(
  first.damage > 0 && first.damage === second.damage && second.damage === third.damage,
  `hits 1-3 should all deal the same unmitigated damage (got ${first.damage}/${second.damage}/${third.damage})`,
);

const fourth = hit();
assert(
  near(charge(), 0),
  `hit 4 should consume a full point and wrap to 0 (got ${charge()})`,
);
// evadeMitigation 0.5 halves the hit; rounding means the halved value can be one
// off, so assert the relationship rather than an exact number.
assert(
  fourth.damage < third.damage,
  `hit 4 should be mitigated by the evade (got ${fourth.damage} vs ${third.damage} unevaded)`,
);
assert(
  Math.abs(fourth.damage - Math.round(third.damage * 0.5)) <= 1,
  `hit 4 should take roughly half damage at evadeMitigation 0.5 (got ${fourth.damage}, expected ~${
    Math.round(third.damage * 0.5)
  })`,
);

// The cycle repeats: three more steps, then another wrap.
hit(); hit(); hit();
const eighth = hit();
assert(
  near(charge(), 0),
  "the accumulator should wrap again on the eighth hit",
);
assert(
  eighth.damage < third.damage,
  "every fourth hit should be evaded at a 0.25 dodge rate",
);

// ── A zero dodge rate never evades ───────────────────────────────────────────

// No evasion at all means the component is absent, not present-and-zero: that
// is the invariant markerInvariants enforces, so detach rather than zero it.
detachComponent(world, player, "evadesHits");
resetEvadeAccumulator(world, player);
for (let i = 0; i < 8; i++) hit();
assert(
  near(charge(), GAME_CONFIG.EVADE_OOC_RESET),
  "a player with no evadesHits component must never touch the accumulator",
);

// ── The charge the client is sent is the charge the server decides on ────────
// Guards the V3 protocol change: the HUD's evasion instrument shows genuine
// anticipation only if this field is the accumulator itself.

attachComponent(world, player, "evadesHits", { dodgeRate: 0.5, evadeMitigation: 0.5, charge: 0 });
resetEvadeAccumulator(world, player);
hit();
assert(near(charge(), 0.5), `networked charge should track hits taken (got ${charge()})`);
assert(
  charge() + player.evadesHits!.dodgeRate >= 1,
  "at 0.5 dodge rate the second hit must be the guaranteed evade the HUD promises",
);
hit();
assert(near(charge(), 0), `the wrap must be visible in the networked charge (got ${charge()})`);

// ── What the player actually SEES ────────────────────────────────────────────
// This is the part that explained the bug report. At the base mitigation of 0.5
// an evade is PARTIAL: it produces a `monster-hit` carrying `evadedPartial`,
// rather than the `player-evade` that drives the big "DODGE" floater and its
// sound — that one needs evadeFull, i.e. evadeMitigation >= 1. Originally a
// partial evade was drawn as nothing but a faintly tinted damage number, so
// evasion looked like it never fired.
//
// `evadedPartial` is now also what raises the client's "GRAZE" floater
// (render/combatFx.ts), so these assertions guard a visible behaviour, not just
// an internal flag. Dropping the field would silently make dodges invisible again.

attachComponent(world, player, "evadesHits", {
  dodgeRate: 0.25,
  evadeMitigation: GAME_CONFIG.EVADE_MITIGATION_BASE,
  charge: 0,
});
resetEvadeAccumulator(world, player);
world.takeNodeEvents(player.hasPosition.nodeId);
hit(); hit(); hit(); hit();
const partialEvents = world.takeNodeEvents(player.hasPosition.nodeId);
assert(
  !partialEvents.some((e) => e.kind === "player-evade"),
  "a partial evade must NOT emit player-evade (no DODGE floater at base mitigation)",
);
assert(
  partialEvents.some((e) => e.kind === "monster-hit" && e.evadedPartial === true),
  "a partial evade should mark its monster-hit with evadedPartial",
);

// Full mitigation is the case that produces the visible dodge.
attachComponent(world, player, "evadesHits", { dodgeRate: 0.25, evadeMitigation: 1, charge: 0 });
resetEvadeAccumulator(world, player);
world.takeNodeEvents(player.hasPosition.nodeId);
hit(); hit(); hit();
const beforeFull = player.hasHealth.hp;
hit();
const fullEvents = world.takeNodeEvents(player.hasPosition.nodeId);
assert(
  fullEvents.some((e) => e.kind === "player-evade"),
  "a full evade should emit player-evade so the client shows DODGE",
);
assert(
  player.hasHealth.hp === beforeFull,
  "a full evade should cost no HP at all",
);

console.log("evasion: ok");
