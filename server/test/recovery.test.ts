// Recovery is ONE rate with many switches: every in-combat regen effect activates
// a fraction of `hasHealth.recovery` instead of inventing its own %-maxHp heal.
// What is worth pinning is the wiring a mistake would silently break — that
// fractions from different sources ADD, that a source refreshes rather than
// stacks itself, that the payout is the rate (so it moves when Recovery moves),
// and that out of combat the player runs at a flat 100%.
//
// Numbers here are mechanic invariants, never balance values: every expectation
// is derived from whatever the config and skill tree actually say.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/recovery.test.ts

import {
  GAME_CONFIG,
  SKILL_TREE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getResource,
  setCooldown,
  tickCooldowns,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import {
  activateRecovery,
  activeRecoveryFraction,
  recoveryPerSecond,
  resetRecoverySources,
  runRecovery,
} from "../src/systems/defense/regen/recovery";
import type { PlayerEntity } from "../src/ecs/entity";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * Advance one player the way the real loop does: `updateCombatState` ticks
 * cooldowns before `updateDefensiveSystems` runs, and the Recovery pulse reads a
 * cooldown for its cadence. A test that only called runRecovery would wedge the
 * pulse permanently on its first interval.
 */
function advance(player: PlayerEntity, ms: number, inCombat: boolean): void {
  tickCooldowns(player.tracksCombat, ms);
  runRecovery(world, player, ms, inCombat);
}

/**
 * Advance in real 100 ms logic ticks. Cadence assertions have to run at the
 * server's actual tick size: a single dt as long as a source's whole window
 * would open and close it inside one call and hide the behaviour under test.
 */
function advanceTicks(player: PlayerEntity, ms: number, inCombat: boolean): void {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) advance(player, 100, inCombat);
}

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Recovery Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 500, maxHp: 1_000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
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
      equippedAbilities: { techniques: [], guards: [] },
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

initCombatSystems();

const world = new World();

// ── Out of combat is a flat 100%; in combat starts at zero ───────────────────

{
  const player = world.attachPlayerEntity(makePlayerSlices("ooc"), "ooc");
  assert(
    activeRecoveryFraction(player, false) === 1,
    "out of combat the player recovers at the full rate",
  );
  assert(
    activeRecoveryFraction(player, true) === 0,
    "with no sources, a naked player recovers nothing while fighting",
  );

  // A node hazard suppresses the OOC rate without touching in-combat access.
  assert(
    activeRecoveryFraction(player, false, true) === 0,
    "a node-feature hazard blocks out-of-combat Recovery",
  );

  const before = player.hasHealth.hp;
  advance(player, 1_000, false);
  const expected = player.hasHealth.maxHp * (GAME_CONFIG.PLAYER_RECOVERY / 100);
  assert(
    Math.abs(player.hasHealth.hp - (before + expected)) < 0.001,
    `one OOC second should restore ${expected} HP, got ${player.hasHealth.hp - before}`,
  );
}

// ── Fractions from different sources ADD, and are not capped at 100% ─────────

{
  const player = world.attachPlayerEntity(makePlayerSlices("stacking"), "stacking");
  const cs = player.tracksCombat;

  player.usesSkills.passives["defense.recovery-active-pct"] = 0.1;
  activateRecovery(cs, "kill", 0.3, 4_000);
  activateRecovery(cs, "skill", 0.5, 4_000);

  const fraction = activeRecoveryFraction(player, true);
  assert(
    Math.abs(fraction - 0.9) < 1e-9,
    `10% + 30% + 50% should add to 90%, got ${fraction * 100}%`,
  );

  // Deliberately uncapped — extreme stacking is a balance question, not a bug.
  activateRecovery(cs, "guard", 0.4, 4_000);
  assert(
    activeRecoveryFraction(player, true) > 1,
    "Recovery access above 100% is allowed rather than clamped",
  );

  resetRecoverySources(cs);
  player.usesSkills.passives["defense.recovery-active-pct"] = 0;
  assert(
    activeRecoveryFraction(player, true) === 0,
    "resetRecoverySources clears every timed source",
  );
}

// ── A source REFRESHES its own window instead of stacking a second copy ──────

{
  const player = world.attachPlayerEntity(makePlayerSlices("refresh"), "refresh");
  const cs = player.tracksCombat;

  activateRecovery(cs, "kill", 0.2, 4_000);
  advance(player, 2_000, true);
  assert(
    Math.abs(getResource(cs, "recovery.killMs") - 2_000) < 1e-9,
    "the on-kill window should tick down",
  );

  // A second kill mid-window: the timer goes back to full, the fraction does not
  // double. This is what keeps the Plains charm a chain-farm tool rather than a
  // stacking heal.
  activateRecovery(cs, "kill", 0.2, 4_000);
  assert(
    getResource(cs, "recovery.killMs") === 4_000,
    "a further kill should refresh the window",
  );
  assert(
    Math.abs(activeRecoveryFraction(player, true) - 0.2) < 1e-9,
    "a further kill must not stack a second copy of the fraction",
  );

  // Run the window out and confirm the access lapses.
  advance(player, 4_000, true);
  assert(
    activeRecoveryFraction(player, true) === 0,
    "the on-kill access should lapse when its window expires",
  );
  assert(getResource(cs, "recovery.killPct") === 0, "the lapsed fraction is cleared");
}

// ── The payout is the RATE: raise Recovery, the same fraction heals more ─────

{
  const player = world.attachPlayerEntity(makePlayerSlices("scaling"), "scaling");
  const cs = player.tracksCombat;
  activateRecovery(cs, "skill", 0.5, 60_000);

  const atBase = recoveryPerSecond(player, activeRecoveryFraction(player, true));
  player.hasHealth.recovery = (player.hasHealth.recovery ?? 0) * 2;
  const atDouble = recoveryPerSecond(player, activeRecoveryFraction(player, true));
  assert(
    Math.abs(atDouble - atBase * 2) < 1e-9,
    `doubling Recovery should double the payout, got ${atBase} → ${atDouble}`,
  );

  // And that payout actually reaches HP through the heal funnel.
  player.hasHealth.hp = 100;
  advance(player, 1_000, true);
  assert(
    Math.abs(player.hasHealth.hp - (100 + atDouble)) < 0.001,
    `runRecovery should apply ${atDouble} HP, got ${player.hasHealth.hp - 100}`,
  );
}

// ── The periodic pulse fires on its interval and refreshes, not stacks ───────

{
  const player = world.attachPlayerEntity(makePlayerSlices("pulse"), "pulse");
  const cs = player.tracksCombat;
  player.usesSkills.passives["defense.recovery-pulse-pct"] = 0.2;
  player.usesSkills.passives["defense.recovery-pulse-interval-ms"] = 8_000;
  player.usesSkills.passives["defense.recovery-pulse-duration-ms"] = 4_000;

  advance(player, 100, true);
  assert(
    Math.abs(activeRecoveryFraction(player, true) - 0.2) < 1e-9,
    "the pulse should switch on immediately on the first in-combat tick",
  );

  // Past the 4s window but short of the 8s interval: the pulse has lapsed and
  // has not come back — the gap between pulses is real, not a rounding artifact.
  advanceTicks(player, 4_000, true);
  assert(
    activeRecoveryFraction(player, true) === 0,
    "between pulses the player has no Recovery access",
  );

  // Past the interval: it fires again.
  advanceTicks(player, 4_000, true);
  assert(
    Math.abs(activeRecoveryFraction(player, true) - 0.2) < 1e-9,
    "the pulse should fire again once its interval elapses",
  );

  // Out of combat the pulse must not re-arm.
  resetRecoverySources(cs);
  setCooldown(cs, "recoveryPulse", 0);
  advanceTicks(player, 10_000, false);
  assert(
    getResource(cs, "recovery.pulseMs") === 0,
    "the pulse should not arm out of combat",
  );
}

// ── The class roots author real Recovery access, resolved through recalc ─────
//
// Read through the skill tree rather than poking passives in directly: recalc
// REBUILDS `usesSkills.passives` from scratch, so a test that wrote the key in
// would prove nothing about the wiring.

{
  const squireRoot = SKILL_TREE.get("cooldown-root");
  assert(squireRoot !== undefined, "test needs the Squire root in the skill tree");
  const authored = squireRoot!.mechanicEffects?.["defense.recovery-active-pct"] ?? 0;
  assert(authored > 0, "the Squire root should author permanent Recovery access");

  const player = world.attachPlayerEntity(makePlayerSlices("squire"), "squire");
  player.usesSkills.unlockedSkills = ["cooldown-root"];
  recalculatePlayerEntityStats(world, player);

  assert(
    player.usesSkills.passives["defense.recovery-active-pct"] === authored,
    "recalc should carry the root's Recovery access onto the passive map",
  );
  assert(
    Math.abs(activeRecoveryFraction(player, true) - authored) < 1e-9,
    "a Squire keeps part of its Recovery running through a whole fight",
  );
}

{
  // The Striker root's pulse survives the frequency-weighted merge with a real
  // duration attached — the accumulator has to carry all three keys or the pulse
  // silently falls back to the engine default.
  const strikerRoot = SKILL_TREE.get("cadence-root");
  assert(strikerRoot !== undefined, "test needs the Striker root in the skill tree");
  const fx = strikerRoot!.mechanicEffects ?? {};
  assert(
    (fx["defense.recovery-pulse-pct"] ?? 0) > 0 && (fx["defense.recovery-pulse-interval-ms"] ?? 0) > 0,
    "the Striker root should author a Recovery pulse",
  );

  const player = world.attachPlayerEntity(makePlayerSlices("striker"), "striker");
  player.usesSkills.unlockedSkills = ["cadence-root"];
  recalculatePlayerEntityStats(world, player);

  const p = player.usesSkills.passives;
  assert(
    (p["defense.recovery-pulse-pct"] ?? 0) > 0,
    "recalc should resolve a pulse fraction for the Striker",
  );
  assert(
    (p["defense.recovery-pulse-duration-ms"] ?? 0) > 0,
    "the resolved pulse must carry a duration, not fall through to zero",
  );

  advance(player, 100, true);
  assert(
    activeRecoveryFraction(player, true) > 0,
    "the Striker's pulse should switch Recovery on in combat",
  );
}

console.log("recovery.test.ts: ok");
