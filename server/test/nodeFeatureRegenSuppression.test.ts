// Regression: a jungle thicket must not block out-of-combat Recovery.
//
// `runRecovery`'s `oocSuppressed` exists so "standing in lava does not heal you"
// (a real hazard). It used to be driven by the generic `hasNodeFeatureEffect`
// marker, which is also set by purely cosmetic terrain contact — a jungle bush
// carries no `damage` field (it only slows the player and doubles detection),
// yet standing in one set the same marker and silenced Recovery just the same.
//
// Combined with the "Recover First" rune (`RUNE_WAIT_FOR_REGEN_FLAG`), which
// holds auto-combat still and refuses to seek a new target until HP is back to
// max, that was a genuine softlock: a player who stopped inside a bush below
// full HP could never heal (no OOC regen) and therefore could never move again
// (the rune never releases). Reproduced live via `node-t2-jungle-04` farm runs
// — see docs/briefs/t2-jungle-04-node-investigation-2026-09-10.md.
//
// `isPlayerInHazardousNodeFeature` is the fix: it only reports true for a
// feature that actually deals damage, so `runRecovery` treats a thicket the
// same as open ground while still suppressing regen inside a real hazard
// (a swamp rot pool), which this test also pins so the fix cannot regress the
// original "standing in lava" intent.

import {
  GAME_CONFIG,
  NODE_FEATURES,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { runRecovery } from "../src/systems/defense/regen/recovery";
import {
  isPlayerInHazardousNodeFeature,
  updateNodeFeatures,
} from "../src/systems/world/nodeFeatures";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const JUNGLE_NODE = "node-t2-jungle-01";
const SWAMP_NODE = "node-t2-swamp-01";

function makePlayerSlices(id: string, nodeId: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
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
      combatArchetype: null,
    },
  };
}

function centreOf(nodeId: string, idIncludes: string): { x: number; y: number } {
  const feature = (NODE_FEATURES[nodeId] ?? []).find((f) => f.id.includes(idIncludes));
  if (!feature) throw new Error(`${nodeId} has no ${idIncludes} feature`);
  return { x: feature.x, y: feature.y };
}

initCombatSystems();

// ── 1. A jungle thicket is not a hazard: isPlayerInHazardousNodeFeature is false ──
{
  const bush = centreOf(JUNGLE_NODE, "bush");
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("thicket", JUNGLE_NODE, bush.x, bush.y),
    "thicket",
  );

  // Confirm we are actually standing in the terrain-effect contact the old code
  // used to gate on, so this test would have failed before the fix.
  updateNodeFeatures(world, 100);
  assert(
    player.hasNodeFeatureEffect !== undefined,
    "test setup: standing in a thicket should still set the generic contact marker",
  );

  assert(
    !isPlayerInHazardousNodeFeature(world, player),
    "a jungle thicket carries no damage field and must not count as a hazard",
  );
}

// ── 2. Recovery actually heals a player resting in a thicket, out of combat ──
{
  const bush = centreOf(JUNGLE_NODE, "bush");
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("healing", JUNGLE_NODE, bush.x, bush.y),
    "healing",
  );

  const before = player.hasHealth.hp;
  for (let elapsed = 0; elapsed < 1_000; elapsed += 100) {
    updateNodeFeatures(world, 100);
    runRecovery(world, player, 100, false, isPlayerInHazardousNodeFeature(world, player));
  }
  assert(
    player.hasHealth.hp > before,
    `a player resting in a jungle thicket should regen out of combat (before=${before}, after=${player.hasHealth.hp})`,
  );
}

// ── 3. A real hazard (a swamp rot pool) still suppresses OOC Recovery ────────
{
  const pool = centreOf(SWAMP_NODE, "rot_pool");
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("hazard", SWAMP_NODE, pool.x, pool.y),
    "hazard",
  );

  updateNodeFeatures(world, 100);
  assert(
    isPlayerInHazardousNodeFeature(world, player),
    "a swamp rot pool deals damage and must still count as a hazard",
  );

  const before = player.hasHealth.hp;
  for (let elapsed = 0; elapsed < 1_000; elapsed += 100) {
    updateNodeFeatures(world, 100);
    runRecovery(world, player, 100, false, isPlayerInHazardousNodeFeature(world, player));
  }
  // The pool also damages, so just assert Recovery did not overcome it: HP must
  // not have net-healed past where it would sit from OOC access alone.
  assert(
    player.hasHealth.hp <= before,
    `standing in a real hazard must not out-heal its own damage via OOC Recovery (before=${before}, after=${player.hasHealth.hp})`,
  );
}

console.log("nodeFeatureRegenSuppression: ok");
