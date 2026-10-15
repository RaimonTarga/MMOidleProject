// S7: the Mountain / Tundra charm ward (timed, replaces the barrier).
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/charmWards.test.ts

import {
  FROZEN_STATUS_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCharmFreezeWard } from "../src/systems/defense/barrier/charmWards";
import { World } from "../src/world/World";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

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

{
  const player = world.attachPlayerEntity(makePlayerSlices("freeze"), "freeze");
  player.usesSkills.passives["defense.ward-freeze-pct"] = 0.2;
  updateCharmFreezeWard(world, player);
  assert(!player.holdsWards, "no ward before the freeze");
  applyStatusEffect(player.tracksCombat, {
    id: FROZEN_STATUS_ID, maxStacks: 1, remainingMs: 2000, refreshable: true, sourceId: "boss", data: { totalMs: 2000 },
  });
  updateCharmFreezeWard(world, player);
  const ward = player.holdsWards?.wards[0];
  assert(ward && ward.amount === Math.round(player.hasHealth.maxHp * 0.2), "the freeze raises a ward of the charm's share");
  assert(ward!.remainingMs === GAME_CONFIG.CHARM_WARD_MS, "the ward is timed");
  updateCharmFreezeWard(world, player);
  assert(player.holdsWards!.wards.length === 1, "staying frozen raises no second ward");
}

console.log("charmWards: ok");
