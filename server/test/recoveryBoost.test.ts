// S4: the always-on in-combat Recovery share and its multiplier lines.
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/recoveryBoost.test.ts

import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  baseRecoveryForTier,
  emptyEquipment,
  getResource,
  setResource,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { COMBAT_ELAPSED_KEY } from "../src/systems/defense/core/pools";
import { activateRecoveryBoost, activeRecoveryFraction, runRecovery } from "../src/systems/defense/regen/recovery";
import { World } from "../src/world/World";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Recovery Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 500, maxHp: 1_000, recovery: baseRecoveryForTier(0) },
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
      runesEquipped: [],
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
const base = GAME_CONFIG.RECOVERY_COMBAT_BASE_SHARE;

{
  const player = world.attachPlayerEntity(makePlayerSlices("boost"), "boost");
  assert(near(activeRecoveryFraction(player, true), base), "every class has the always-on share in combat");
  assert(activeRecoveryFraction(player, false) === 0, "no share out of combat");

  player.usesSkills.passives["defense.recovery-active-pct"] = 0.1;
  assert(near(activeRecoveryFraction(player, true), base + 0.1), "Old Guard-style lines add to the share");

  activateRecoveryBoost(player.tracksCombat, 3);
  assert(near(activeRecoveryFraction(player, true), (base + 0.1) * 3), "a boost multiplies the share");
  activateRecoveryBoost(player.tracksCombat, 2);
  assert(near(activeRecoveryFraction(player, true), (base + 0.1) * 3), "a weaker boost never downgrades a live one");

  player.hasHealth.hp = 500;
  for (let t = 0; t < GAME_CONFIG.RECOVERY_BOOST_MS / 100 + 2; t++) runRecovery(world, player, 100, true);
  assert(getResource(player.tracksCombat, "recovery.boostMs") === 0, "the boost window ends");
  assert(near(activeRecoveryFraction(player, true), base + 0.1), "the share returns to normal");
  assert(player.hasHealth.hp > 500, "the share heals in combat");
}

{
  const player = world.attachPlayerEntity(makePlayerSlices("rhythm"), "rhythm");
  player.usesSkills.passives["defense.recovery-rhythm-max"] = 2;
  player.usesSkills.passives["defense.recovery-rhythm-ms"] = 20000;
  setResource(player.tracksCombat, COMBAT_ELAPSED_KEY, 0);
  assert(near(activeRecoveryFraction(player, true), base), "Rhythm starts at 1x");
  setResource(player.tracksCombat, COMBAT_ELAPSED_KEY, 10000);
  assert(near(activeRecoveryFraction(player, true), base * 1.5), "Rhythm is halfway after half the build-up");
  setResource(player.tracksCombat, COMBAT_ELAPSED_KEY, 99999);
  assert(near(activeRecoveryFraction(player, true), base * 2), "Rhythm tops out at double");
}

console.log("recoveryBoost: ok");
