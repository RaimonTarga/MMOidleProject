import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import {
  STANCE_SWITCH_COOLDOWN_MS,
  updateStanceSwitch,
} from "../src/systems/player/stances/stanceSwitch";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "stance-player", name: "Stance Tester" },
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
      runesEquipped: [{ conditionId: "hp-below-25", actionId: "switch-stance" }],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: ["offensive-stance", "defensive-stance"],
      equippedStances: { default: "offensive-stance", reactive: "defensive-stance" },
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

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "stance-player");
const baseAttack = GAME_CONFIG.PLAYER_ATTACK;

// Cooldowns are stored as a remaining-duration counter decremented by
// `updateCombatState`'s dt each tick (not compared against a wall-clock `now`),
// so advancing time means ticking combat state, not just bumping `now`.
let now = 1_000;
function advance(ms: number): void {
  now += ms;
  updateCombatState(world, ms);
}

// Full HP, no reactive condition active: the default posture (Offensive) should
// activate immediately since no stance is active yet.
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world);
assert(
  player.tracksProgression.activeStance === "offensive-stance",
  "default stance should activate on first switch check",
);
assert(
  player.dealsDamage.attack === baseAttack + 25,
  `offensive stance should fold its +25 attack delta (got ${player.dealsDamage.attack})`,
);

// Drop HP below 25% to satisfy the reactive condition, but the anti-thrash
// cooldown (1.5s) has not elapsed yet — the switch must not fire early.
player.hasHealth.hp = player.hasHealth.maxHp * 0.2;
advance(200);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world);
assert(
  player.tracksProgression.activeStance === "offensive-stance",
  "stance switch should respect its anti-thrash cooldown",
);

// After the cooldown elapses, the reactive stance (Defensive) should take over
// and its stat deltas should replace the offensive ones cleanly.
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world);
assert(
  player.tracksProgression.activeStance === "defensive-stance",
  "reactive stance should activate once hp-below-25 holds and the cooldown clears",
);
assert(
  player.dealsDamage.attack === baseAttack - 15,
  `defensive stance should fold its -15 attack delta (got ${player.dealsDamage.attack})`,
);
assert(
  player.mitigatesDamage.damageReduction === 0.15,
  "defensive stance should fold its +15% damage reduction",
);

// Recovering above the threshold (and past the cooldown) should revert to the
// default posture, cleanly removing the reactive stance's deltas.
player.hasHealth.hp = player.hasHealth.maxHp;
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world);
assert(
  player.tracksProgression.activeStance === "offensive-stance",
  "recovering above the hp threshold should revert to the default stance",
);
assert(
  player.dealsDamage.attack === baseAttack + 25,
  "reverting to the default stance should remove the reactive stance's deltas",
);
assert(
  player.mitigatesDamage.damageReduction === 0,
  "defensive stance's damage-reduction delta should not linger after switching away",
);

console.log("stances.test.ts: ok");
