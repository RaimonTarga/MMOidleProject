/**
 * Focused authority tests for live manual ability and stance controls.
 * Manual requests must enter the existing ability/cast/stance systems rather
 * than becoming a second execution path.
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  NO_STANCE_ID,
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
import { requestManualAbilityUse } from "../src/systems/player/abilities/abilityFiring";
import { fireAbilities, wireReferenceAbilities } from "./fixtures/abilityWiring";
import {
  STANCE_SWITCH_COOLDOWN_MS,
  requestManualStance,
  updateStanceSwitch,
} from "../src/systems/player/stances/stanceSwitch";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { attachComponent } from "../src/ecs/markerHelpers";
import { World } from "../src/world/World";
import {
  ABILITY_HOTKEY_ACTIONS,
  DEFAULT_BINDINGS,
  STANCE_HOTKEY_ACTIONS,
  abilitySlotForKey,
  abilitySlotForPad,
  bindingToLabel,
  matchesKey,
  stanceSlotForKey,
} from "../../client/src/settings/keybinds";
import {
  completeReload,
  requestManualReload,
} from "../src/systems/classes/archetypes/reload/reloadLifecycle";

function assert(condition: boolean, message: string): void {
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
      playerTier: 4,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["hamstring", "power-strike", "snipe", "frenzy", "brace"],
      attunedAbilities: {
        techniques: ["hamstring", "power-strike", "snipe", "frenzy"],
        guards: ["brace"],
      },
      knownStances: ["offensive-stance", "defensive-stance", "tanking-stance"],
      attunedStances: ["offensive-stance", "defensive-stance"],
      equippedStances: { default: "offensive-stance" },
      activeStance: "offensive-stance",
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

// The shared input binding table assigns numeric keys in visible hotbar order,
// while remaining fully rebindable for keyboard and gamepad input.
{
  assert(ABILITY_HOTKEY_ACTIONS.length === 9, "manual hotbar should expose nine configurable slots");
  for (let slot = 0; slot < ABILITY_HOTKEY_ACTIONS.length; slot++) {
    assert(
      abilitySlotForKey(`Digit${slot + 1}`, DEFAULT_BINDINGS) === slot,
      `Digit${slot + 1} should map to hotbar slot ${slot + 1}`,
    );
  }
  assert(abilitySlotForKey("KeyX", DEFAULT_BINDINGS) === null, "unbound keys must not activate a hotbar slot");
  assert(
    matchesKey({ code: "Digit1", shiftKey: true }, "stance.neutral", DEFAULT_BINDINGS),
    "Shift+1 should select Neutral",
  );
  assert(
    stanceSlotForKey({ code: "Digit2", shiftKey: true }, DEFAULT_BINDINGS) === 0,
    "Shift+2 should select the first displayed attuned stance",
  );
  assert(
    abilitySlotForKey({ code: "Digit2", shiftKey: true }, DEFAULT_BINDINGS) === null,
    "a shifted stance chord must not also fire the matching numbered ability",
  );
  assert(
    STANCE_HOTKEY_ACTIONS.length === 8,
    "Neutral should own Shift+1 and the displayed stance rail should expose Shift+2 through Shift+9",
  );
  assert(
    bindingToLabel(DEFAULT_BINDINGS["stance.neutral"]) === "Shift+1",
    "modifier bindings should have a readable settings label",
  );
  assert(
    matchesKey({ code: "KeyR" }, "class.reload", DEFAULT_BINDINGS),
    "R should be the default manual reload binding",
  );
  const rebound = structuredClone(DEFAULT_BINDINGS);
  rebound["ability.slot3"].pad = 4;
  assert(abilitySlotForPad(4, rebound) === 2, "gamepad rebinding should map through the same hotbar order");
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
  player.tracksProgression.attunedAbilities = { techniques: ["frenzy"], guards: [] };
  wireReferenceAbilities(player);
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("auto ownership target setup failed");
  setAttackTarget(world, player, target.isMonster.id);

  fireAbilities(world, 900);
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("frenzy")) === 0,
    "Auto-off must suppress automatic ability activation",
  );

  player.fightsWhileTraveling = { startedAtMs: 901 };
  fireAbilities(world, 901);
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("frenzy")) > 0,
    "Fight Back must grant automatic ability authority while travel combat is active",
  );
}

// A valid activation fires immediately. A press during cooldown queues exactly
// one follow-up; pressing again cancels it, and a successful queued activation
// consumes the request instead of re-queueing itself.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("manual-instant"), "manual-instant");
  assert(requestManualAbilityUse(world, player, "frenzy", 1_000).success, "valid attuned manual ability should fire");
  const cooldown = getCooldown(player.tracksCombat, abilityCooldownKey("frenzy"));
  assert(cooldown > 0, "manual activation should use the normal per-ability cooldown");
  const queued = requestManualAbilityUse(world, player, "frenzy", 1_001);
  assert(queued.success && queued.state === "queued", "a cooldown-blocked press should queue");
  assert(player.queuesAbilities?.abilityIds.includes("frenzy"), "queued state should be authoritative runtime data");
  assert(composePlayerView(player)?.queuedAbilityIds.includes("frenzy"), "queued state should reach the player's network view");
  assert(getCooldown(player.tracksCombat, abilityCooldownKey("frenzy")) === cooldown, "queueing must not rewrite cooldown");
  const cancelled = requestManualAbilityUse(world, player, "frenzy", 1_002);
  assert(cancelled.success && cancelled.state === "cancelled", "pressing a queued ability should cancel it");
  assert(!player.queuesAbilities, "cancelled ability should leave no queued runtime state");

  assert(requestManualAbilityUse(world, player, "frenzy", 1_003).state === "queued", "ability should be queueable again");
  updateCombatState(world, cooldown);
  fireAbilities(world, 1_003 + cooldown);
  assert(!player.queuesAbilities, "successful queued activation must consume the queue entry");
  fireAbilities(world, 1_004 + cooldown);
  assert(!player.queuesAbilities, "activation must not automatically re-queue the ability");

  assert(!requestManualAbilityUse(world, player, "not-real", 1_002).success, "unknown ability must be rejected");
  attachComponent(world, player, "queuesAbilities", { abilityIds: ["brace"] });
  player.tracksProgression.attunedAbilities.guards = [];
  assert(!requestManualAbilityUse(world, player, "brace", 1_003).success, "unattuned ability must be rejected even if stale queue state exists");
  assert(!player.queuesAbilities, "rejecting a stale queued ability should remove its runtime state");
}

// Enemy-facing use requires the player's current combat target. Nearby fallback
// targeting remains an automation behavior, not a manual targeting system.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("manual-target"), "manual-target");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("target setup failed");
  const waiting = requestManualAbilityUse(world, player, "hamstring", 2_000);
  assert(waiting.success && waiting.state === "queued", "targetless manual ability should wait rather than acquire a fallback");
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 2_001);
  assert(player.hasArmedAbility?.abilityId === "hamstring", "manual Technique should use the normal armed channel");
  assert(!player.queuesAbilities, "queued target-dependent ability should clear after activation");
  const blocked = requestManualAbilityUse(world, player, "power-strike", 2_002);
  assert(blocked.success && blocked.state === "queued", "shared Technique arbitration should leave the later request queued");
  assert(requestManualAbilityUse(world, player, "power-strike", 2_003).state === "cancelled", "queued arbitration wait should be cancellable");
}

// Manual casts retain their authored wind-up, current-target lock, lost-target
// abort and hard-control interruption. Snipe also keeps its normal auto-position hold.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("manual-cast"), "manual-cast");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("cast target setup failed");
  setAttackTarget(world, player, target.isMonster.id);
  const ability = ABILITY_DATABASE.get("power-strike")!;
  const castMs = abilityCastMs(ability, player.tracksProgression.playerTier);
  const hpBefore = target.hasHealth.hp;
  assert(requestManualAbilityUse(world, player, ability.id, 3_000).success, "manual cast should start");
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
  assert(requestManualAbilityUse(world, player, "snipe", 4_000).success, "manual ranged cast should start on its current target");
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
  const controlled = requestManualAbilityUse(world, player, "snipe", 4_002);
  assert(controlled.success && controlled.state === "queued", "hard control should queue a valid manual Technique until it is legal");
  world.killPlayer(player.isPlayer.id, {
    kind: "stance",
    stanceName: "Test",
    damage: player.hasHealth.maxHp,
  });
  assert(!player.queuesAbilities, "death should clear queued manual ability intents");
}

// Manual stance ownership accepts only attuned stances, survives Rune/default
// evaluation, and the neutral choice is a deliberate, persistent manual posture.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("manual-stance"), "manual-stance");
  updateStanceSwitch(world, 0, 5_000);
  updateCombatState(world, STANCE_SWITCH_COOLDOWN_MS);

  assert(!requestManualStance(world, player, "not-real").success, "unknown manual stance must be rejected");
  assert(!requestManualStance(world, player, "tanking-stance").success, "unattuned manual stance must be rejected");
  assert(requestManualStance(world, player, "defensive-stance").success, "attuned manual stance should switch");
  assert(player.overridesStance?.stanceId === "defensive-stance", "manual selection should attach runtime ownership");
  assert(player.tracksProgression.activeStance === "defensive-stance", "manual stance should use the normal authoritative switch");
  assert(player.tracksProgression.equippedStances.default === "offensive-stance", "manual stance must not overwrite saved default");

  player.tracksProgression.runesEquipped = [{
    conditionId: "always",
    actionId: "switch-stance",
    targetStanceId: "offensive-stance",
  }];
  updateCombatState(world, STANCE_SWITCH_COOLDOWN_MS);
  updateRuneDerivedConfig(world, 7_000);
  updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, 7_000);
  assert(player.tracksProgression.activeStance === "defensive-stance", "Rune automation must yield to manual stance ownership");

  player.usesAutocombat.auto = true;
  updateStanceSwitch(world, 0, 7_001);
  assert(!player.overridesStance, "Auto Combat must release a stale manual stance override");
  assert(player.tracksProgression.activeStance === "offensive-stance", "Auto Combat must restore Rune/default stance ownership");

  player.usesAutocombat.auto = false;
  updateCombatState(world, STANCE_SWITCH_COOLDOWN_MS);
  assert(requestManualStance(world, player, NO_STANCE_ID).success, "neutral stance should be manually selectable");
  assert(player.overridesStance?.stanceId === NO_STANCE_ID, "neutral should retain manual stance ownership");
  assert(player.tracksProgression.activeStance === null, "neutral should clear the active stance");
  assert(player.tracksProgression.equippedStances.default === "offensive-stance", "neutral must not mutate the saved default");

  updateCombatState(world, STANCE_SWITCH_COOLDOWN_MS);
  updateRuneDerivedConfig(world, 7_002);
  updateStanceSwitch(world, 0, 7_002);
  assert(player.tracksProgression.activeStance === null, "Rune automation must not undo manual neutral stance");

  player.fightsWhileTraveling = { startedAtMs: 7_003 };
  updateStanceSwitch(world, 0, 7_003);
  assert(!player.overridesStance, "Fight Back must release manual stance ownership like Auto Combat");
  assert(player.tracksProgression.activeStance === "offensive-stance", "Fight Back must restore Rune/default stance control");

  player.fightsWhileTraveling = undefined;
  updateCombatState(world, STANCE_SWITCH_COOLDOWN_MS);
  assert(requestManualStance(world, player, "defensive-stance").success, "manual stance should be selectable again");
  world.killPlayer(player.isPlayer.id, {
    kind: "stance",
    stanceName: "Test",
    damage: player.hasHealth.maxHp,
  });
  assert(!player.overridesStance, "death should clear manual stance ownership");
}

console.log("manualCombatControls: ok");
