/**
 * Focused authority tests for live manual combat controls (the Slinger's manual
 * reload), and for firing one ability on the current target through the kept
 * engine API (`fireTechnique`), which must enter the existing ability/cast
 * systems rather than becoming a second execution path.
 */
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityCastMs,
  applyStatusEffect,
  composePlayerView,
  emptyEquipment,
  getCooldown,
  initUsesReload,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import {
  holdsPositionWhileCasting,
  updateAbilityCasts,
} from "../src/systems/player/abilities/abilityCasting";
import { fireTechnique } from "../src/systems/player/abilities/abilityFiring";
import { fireAbilities, wireReferenceAbilities } from "./fixtures/abilityWiring";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { attachComponent } from "../src/ecs/markerHelpers";
import { World } from "../src/world/World";
import {
  DEFAULT_BINDINGS,
  matchesKey,
} from "../../client/src/settings/keybinds";
import {
  completeReload,
  requestManualReload,
} from "../src/systems/classes/archetypes/reload/reloadLifecycle";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Manual Controller" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 4,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [],
      knownAbilities: ["binding-strike", "slam", "snipe", "imbue-lightning", "brace"],
      attunedAbilities: {
        techniques: ["binding-strike", "slam", "snipe", "imbue-lightning"],
        guards: ["brace"],
      },
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

// Manual reload has a default key.
{
  assert(
    matchesKey({ code: "KeyR" }, "class.reload", DEFAULT_BINDINGS),
    "R should be the default manual reload binding",
  );
}

// Manual reload is an authoritative Slinger-only request. A partial magazine
// enters the normal lifecycle; full, active, and Laser reloads are harmless.
{
  const world = new World();
  const otherClass = world.attachPlayerEntity(makePlayerSlices("manual-reload-other"), "manual-reload-other");
  assert(
    !requestManualReload(world, otherClass).success,
    "non-Slingers must not be able to invoke manual reload",
  );

  const slinger = world.attachPlayerEntity(makePlayerSlices("manual-reload-slinger"), "manual-reload-slinger");
  slinger.usesSkills.combatArchetype = "reload";
  slinger.usesReload = initUsesReload({ ammoMax: 10 });
  assert(
    requestManualReload(world, slinger).success && slinger.usesReload.reloadingMs === 0,
    "a full Slinger magazine should be a successful no-op",
  );

  slinger.usesReload.ammo = 4;
  const started = requestManualReload(world, slinger);
  assert(started.success && started.state === "activated", "a partial Slinger magazine should start reloading");
  assert(slinger.usesReload.ammo === 0, "manual reload should discard the partial magazine through the normal lifecycle");
  assert(slinger.usesReload.reloadingMs > 0, "manual reload should use the authoritative reload timer");
  const activeReloadMs = slinger.usesReload.reloadingMs;
  assert(
    slinger.usesReload.reloadDurationMs === activeReloadMs,
    "reload start should retain the full duration for presentation progress",
  );
  const reloadView = composePlayerView(slinger);
  assert(
    reloadView?.reloadRemainingMs === activeReloadMs &&
      reloadView.reloadDurationMs === activeReloadMs,
    "the player view should expose authoritative reload progress timing",
  );
  const reloadStartEvent = world
    .takeNodeEvents(slinger.hasPosition.nodeId)
    .find((event) => event.kind === 'player-reload-start');
  assert(
    reloadStartEvent?.kind === 'player-reload-start' &&
      reloadStartEvent.playerId === slinger.isPlayer.id &&
      reloadStartEvent.reloadMs === activeReloadMs,
    "reload start should emit the node-wide presentation event used by ability callouts",
  );
  assert(
    requestManualReload(world, slinger).success && slinger.usesReload.reloadingMs === activeReloadMs,
    "pressing reload again during an active reload should not restart its timer",
  );

  completeReload(world, slinger);
  assert(
    slinger.usesReload.reloadingMs === 0 && slinger.usesReload.reloadDurationMs === 0,
    "reload completion should clear presentation timing",
  );
  slinger.usesReload.ammo = 3;
  slinger.usesSkills.passives["reload.laser"] = 1;
  assert(requestManualReload(world, slinger).success, "Laser Slinger reload input should be a harmless no-op");
  assert(slinger.usesReload.ammo === 3 && slinger.usesReload.reloadingMs === 0, "Laser heat must not enter the magazine reload lifecycle");
}

// Auto-off suppresses default/Rune ability activation. Fight Back is temporary
// Auto authority during travel, so it deliberately retains automatic abilities.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("ability-auto-ownership"), "ability-auto-ownership");
  player.tracksProgression.attunedAbilities = { techniques: ["imbue-lightning"], guards: [] };
  wireReferenceAbilities(player);
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("auto ownership target setup failed");
  setAttackTarget(world, player, target.isMonster.id);

  fireAbilities(world, 900);
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("imbue-lightning")) === 0,
    "Auto-off must suppress automatic ability activation",
  );

  player.fightsWhileTraveling = { startedAtMs: 901 };
  fireAbilities(world, 901);
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("imbue-lightning")) > 0,
    "Fight Back must grant automatic ability authority while travel combat is active",
  );
}

// `currentTargetOnly` acts on the player's current combat target and nothing
// else: no nearest-in-reach fallback.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("manual-target"), "manual-target");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("target setup failed");
  const waiting = fireTechnique(world, player, "slam", 2_000, { currentTargetOnly: true });
  assert(!waiting.activated && !player.isCastingAbility, "a current-target cast with no target should not acquire a fallback");
  setAttackTarget(world, player, target.isMonster.id);
  const armed = fireTechnique(world, player, "binding-strike", 2_001, { currentTargetOnly: true });
  assert(armed.activated && player.hasArmedAbility?.abilityId === "binding-strike", "a Technique should use the normal armed channel");
  const blocked = fireTechnique(world, player, "slam", 2_002, { currentTargetOnly: true });
  assert(!blocked.activated && blocked.claimed, "shared Technique arbitration should refuse a second Technique while one is armed");
}

// Casts fired on the current target retain their authored wind-up, current-target
// lock, lost-target abort and hard-control interruption. Snipe also keeps its
// normal auto-position hold.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("manual-cast"), "manual-cast");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("cast target setup failed");
  setAttackTarget(world, player, target.isMonster.id);
  const ability = ABILITY_DATABASE.get("slam")!;
  const castMs = abilityCastMs(ability, player.tracksProgression.playerTier);
  const hpBefore = target.hasHealth.hp;
  assert(fireTechnique(world, player, ability.id, 3_000, { currentTargetOnly: true }).activated, "the cast should start");
  assert(player.isCastingAbility?.targetId === target.isMonster.id, "manual cast should lock the current target through the normal cast state");
  updateAbilityCasts(world, 3_000 + castMs - 1);
  assert(target.hasHealth.hp === hpBefore && !!player.isCastingAbility, "manual input must not bypass cast time");
  world.removeMonsterEntity(target.isMonster.id);
  updateAbilityCasts(world, 3_000 + castMs);
  assert(!player.isCastingAbility, "lost manual cast target should abort normally");
  assert(getCooldown(player.tracksCombat, abilityCooldownKey(ability.id)) === 0, "aborted manual cast should keep normal no-cooldown semantics");

  const distant = world.createMonster("node-5-5", "plains-slime", { x: 650, y: 400 });
  if (!distant) throw new Error("snipe target setup failed");
  setAttackTarget(world, player, distant.isMonster.id);
  assert(fireTechnique(world, player, "snipe", 4_000, { currentTargetOnly: true }).activated, "a ranged cast should start on its current target");
  assert(holdsPositionWhileCasting(player), "manual Snipe should retain the normal cast movement hold semantics");
  applyStatusEffect(player.tracksCombat, {
    id: STUN_EFFECT,
    maxStacks: 1,
    remainingMs: 1_000,
    refreshable: true,
    sourceId: distant.isMonster.id,
    data: { totalMs: 1_000 },
  });
  updateAbilityCasts(world, 4_001);
  assert(!player.isCastingAbility, "hard control should interrupt a manually-started cast normally");
  const controlled = fireTechnique(world, player, "snipe", 4_002, { currentTargetOnly: true });
  assert(!controlled.activated && !player.isCastingAbility, "hard control should refuse a Technique until it is legal");
}

console.log("manualCombatControls: ok");
