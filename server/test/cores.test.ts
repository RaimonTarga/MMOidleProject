import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "core-player", name: "Core Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
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
      equipment: { ...emptyEquipment(), core: "forest-core-sniper" },
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: "far",
      combatArchetype: null,
    },
  };
}

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "core-player");
const baseAttack = GAME_CONFIG.PLAYER_ATTACK;

// A directional core (rangeTag "far") whose tag matches the player's selectedRange
// applies its full mechanicEffects — the core-slot equip/recalc wiring.
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === 0.25,
  "matching-range core should fold its core.attack-mult passive",
);
assert(
  player.usesSkills.passives["core.maxhp-mult"] === -0.15,
  "matching-range core should fold its core.maxhp-mult passive",
);

// The one genuinely new mechanic (per docs/cores-current-state.md): a directional
// core contributes NOTHING once selectedRange no longer matches its rangeTag.
player.usesSkills.selectedRange = "close";
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === undefined,
  "a directional core should be inactive once selectedRange no longer matches its rangeTag",
);
assert(
  player.usesSkills.passives["core.maxhp-mult"] === undefined,
  "an inactive core's stat-mult passives should not linger after a range change",
);
assert(
  player.dealsDamage.attack === baseAttack,
  "an inactive directional core should not apply any attack delta",
);

// A universal core applies regardless of selectedRange.
player.holdsInventory.equipment.core = "forest-core-universal";
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === 0.08,
  "a universal core should apply while selectedRange is 'close'",
);
assert(
  player.usesSkills.passives["core.maxhp-mult"] === 0.08,
  "a universal core's maxhp-mult passive should also apply regardless of range",
);

console.log("cores.test.ts: ok");
