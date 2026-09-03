/**
 * Wiring smoke test for Charge's cast-then-rush Technique lifecycle.
 *
 * Asserts:
 *   1. Firing starts a brief cast without moving or spending the cooldown.
 *   2. The completed cast becomes a fast, target-bound charge rather than an
 *      instant teleport, and preserves Charge's existing reposition cue.
 *   3. Contact arms the stronger landing strike.
 *   4. With no target there is nothing to close on — it declines to fire and
 *      keeps its cooldown.
 *
 * Behaviour, not balance: dash distance and strike multiplier are not asserted.
 */
import {
  GAME_CONFIG,
  ABILITY_DATABASE,
  STARTER_RUNE_IDS,
  distanceSq,
  emptyEquipment,
  getCooldown,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { updateAbilityCasts, updateAbilityCharges } from "../src/systems/player/abilities/abilityCasting";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { updateMovement } from "../src/systems/world/movement";
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

const CHARGE = ABILITY_DATABASE.get("charge");
if (!CHARGE) throw new Error("charge ability missing");
const CAST_MS = CHARGE.ranks[0].castMs ?? 0;
assert(CAST_MS > 0, "Charge should now declare a short wind-up");

// ── 1–3. Cast, rush, then arm the landing strike ─────────────────────────────
const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices("charge-player"), "charge-player");
// Inside Charge's increased engagement range but well outside the player's own
// reach — the exact gap-closing case this Technique exists for.
const target = world.createMonster("node-5-5", "plains-slime", { x: 360, y: 400 });
if (!target) throw new Error("failed to create target");
setAttackTarget(world, player, target.isMonster.id);

const distBefore = distanceSq(player.hasPosition.current, target.hasPosition.current);
const t0 = 1_000_000;
updateAbilityFiring(world, t0);

assert(
  player.isCastingAbility?.abilityId === "charge",
  "Charge should begin with a cast instead of moving instantly",
);
assert(
  distanceSq(player.hasPosition.current, target.hasPosition.current) === distBefore,
  "Charge must hold its position during the wind-up",
);
assert(
  getCooldown(player.tracksCombat, abilityCooldownKey("charge")) === 0,
  "an interruptible Charge wind-up must not spend its cooldown",
);

updateAbilityCasts(world, t0 + CAST_MS);
assert(
  player.isChargingAbility?.abilityId === "charge",
  "a completed Charge cast should enter its high-speed approach",
);
assert(
  getCooldown(player.tracksCombat, abilityCooldownKey("charge")) > 0,
  "committing to the rush should start Charge's cooldown",
);
assert(
  world.takeNodeEvents("node-5-5").some((event) => event.kind === "player-reposition" && event.ability === "charge"),
  "the rush should retain Charge's established dash animation cue",
);

updateAbilityCharges(world, t0 + CAST_MS);
updateMovement(world, 100, t0 + CAST_MS);
assert(
  distanceSq(player.hasPosition.current, target.hasPosition.current) < distBefore,
  "Charge should close the gap through fast movement rather than teleporting",
);

for (let now = t0 + CAST_MS + 100; now <= t0 + CAST_MS + 1_500; now += 100) {
  updateAbilityCharges(world, now);
  updateMovement(world, 100, now);
  if (!player.isChargingAbility) break;
}
assert(
  player.hasArmedAbility?.abilityId === "charge",
  "contact at the end of Charge should arm its empowered landing strike",
);

// ── 4. World tick wiring starts the cast and hands it into movement ───────────
const wiredWorld = new World();
const wiredPlayer = wiredWorld.attachPlayerEntity(
  makePlayerSlices("charge-wired-player"),
  "charge-wired-player",
);
const wiredTarget = wiredWorld.createMonster("node-5-5", "plains-slime", { x: 360, y: 400 });
if (!wiredTarget) throw new Error("failed to create wired Charge target");
setAttackTarget(wiredWorld, wiredPlayer, wiredTarget.isMonster.id);

wiredWorld.tick(0, t0);
assert(
  wiredPlayer.isCastingAbility?.abilityId === "charge",
  "World.tick should start Charge's cast lifecycle",
);
wiredWorld.tick(0, t0 + CAST_MS);
assert(
  wiredPlayer.isChargingAbility?.abilityId === "charge" && !!wiredPlayer.isMoving,
  "World.tick should hand a resolved Charge cast into movement ownership",
);

// ── 5. No target: decline to fire, keep the cooldown ─────────────────────────
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


// ── 6. Already in contact: the gap-closer holds its cooldown ─────────────────
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
