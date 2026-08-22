/**
 * Wiring smoke test for the reposition Technique shape (abilities evolution §5.3),
 * worked by Charge.
 *
 * Asserts:
 *   1. Firing closes distance to the current target.
 *   2. It also arms, so the gap-close converts into an empowered strike.
 *   3. With no target there is nothing to close on — it declines to fire and
 *      keeps its cooldown, rather than dashing into empty space.
 *
 * Behaviour, not balance: dash distance and strike multiplier are not asserted.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  distanceSq,
  emptyEquipment,
  getCooldown,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Charger" },
    hasPosition: {
      current: { x: 200, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
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
      playerTier: 2,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["charge"],
      equippedAbilities: { techniques: ["charge"], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
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

// ── 1 & 2. Closes distance, then arms the strike rider ───────────────────────
const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices("charge-player"), "charge-player");
// Inside Charge's ENGAGEMENT range (attack range + its 220px dash) but well
// outside the player's own reach — the case the gap-closer exists for.
const target = world.createMonster("node-5-5", "plains-slime", { x: 360, y: 400 });
if (!target) throw new Error("failed to create target");
setAttackTarget(world, player, target.isMonster.id);

const distBefore = distanceSq(player.hasPosition.current, target.hasPosition.current);
updateAbilityFiring(world, Date.now());
const distAfter = distanceSq(player.hasPosition.current, target.hasPosition.current);

assert(
  distAfter < distBefore,
  "Charge should close distance to the current attack target",
);
assert(
  player.hasArmedAbility?.abilityId === "charge",
  "a reposition carrying a strike rider should also arm the next attack",
);
assert(
  getCooldown(player.tracksCombat, abilityCooldownKey("charge")) > 0,
  "a reposition that actually moved should start its cooldown",
);

// ── 3. No target: decline to fire, keep the cooldown ─────────────────────────
const world2 = new World();
const player2 = world2.attachPlayerEntity(
  makePlayerSlices("charge-player-2"),
  "charge-player-2",
);
// A monster far outside even the ability's extended reach: nothing to anchor the
// dash to, so the trigger never goes valid.
const bystander = world2.createMonster("node-5-5", "plains-slime", { x: 1400, y: 400 });
if (!bystander) throw new Error("failed to create bystander");

const posBefore = { ...player2.hasPosition.current };
updateAbilityFiring(world2, Date.now());

assert(
  player2.hasPosition.current.x === posBefore.x &&
    player2.hasPosition.current.y === posBefore.y,
  "with nothing inside its engagement range, Charge must not move the player",
);
assert(
  getCooldown(player2.tracksCombat, abilityCooldownKey("charge")) === 0,
  "a reposition that could not resolve must not waste its cooldown",
);


// ── 4. Already in contact: the gap-closer holds its cooldown ─────────────────
// The whole point of the `target-beyond-reach` trigger. Firing a dash at
// something already at arm's length spends a 9s cooldown to travel nowhere,
// which is exactly what made Charge feel pointless before.
const world3 = new World();
const player3 = world3.attachPlayerEntity(
  makePlayerSlices("charge-player-3"),
  "charge-player-3",
);
const adjacent = world3.createMonster("node-5-5", "plains-slime", { x: 215, y: 400 });
if (!adjacent) throw new Error("failed to create adjacent monster");
setAttackTarget(world3, player3, adjacent.isMonster.id);

updateAbilityFiring(world3, Date.now());
assert(
  getCooldown(player3.tracksCombat, abilityCooldownKey("charge")) === 0,
  "Charge must not fire at a target that is already in contact",
);

console.log("abilityCharge.test.ts: ok");
