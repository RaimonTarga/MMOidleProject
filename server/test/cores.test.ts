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
      // `selectedRange` holds the FULL tier-2 skill id, not a bare `far` — see
      // progression/skills.ts where it is assigned. This fixture used to say
      // "far", which made the (then strict-equality) range gate look correct
      // against state the real game never produces, and hid the fact that no
      // restricted core ever activated in play. Keep these realistic.
      selectedRange: "reload-range-far",
      combatArchetype: null,
    },
  };
}

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "core-player");
const baseAttack = GAME_CONFIG.PLAYER_ATTACK;

// A restricted core (`ranged`) whose category admits the player's selectedRange
// applies its full mechanicEffects — the core-slot equip/recalc wiring.
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === 0.25,
  "eligible core should fold its core.attack-mult passive",
);
assert(
  player.usesSkills.passives["core.maxhp-mult"] === -0.15,
  "eligible core should fold its core.maxhp-mult passive",
);

// `ranged` is ONE pool spanning mid AND far, so the same core stays live on a mid
// build. Under the old close/mid/far axis this exact swap DEACTIVATED the core;
// this assertion is the behaviour change, not a restatement of the one above.
player.usesSkills.selectedRange = "dot-range-mid";
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === 0.25,
  "a ranged core must stay active across both mid and far builds",
);

// Eligibility is BINARY: an ineligible core contributes nothing — and that means
// its TRADEOFFS vanish too, not just its upsides. The -0.15 maxhp must not linger.
player.usesSkills.selectedRange = "reload-range-close";
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === undefined,
  "a ranged core should be inactive for a close build",
);
assert(
  player.usesSkills.passives["core.maxhp-mult"] === undefined,
  "an inactive core's tradeoffs must not linger after a range change",
);
assert(
  player.dealsDamage.attack === baseAttack,
  "an inactive restricted core should not apply any attack delta",
);

// An unrestricted core applies regardless of selectedRange.
player.holdsInventory.equipment.core = "forest-core-universal";
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["core.attack-mult"] === 0.08,
  "an unrestricted core should apply while the build is close-range",
);
assert(
  player.usesSkills.passives["core.maxhp-mult"] === 0.08,
  "an unrestricted core's maxhp-mult passive should also apply regardless of range",
);

console.log("cores.test.ts: ok");
