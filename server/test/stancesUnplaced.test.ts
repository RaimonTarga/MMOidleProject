import { setStanceLoadout } from "../src/systems/player/economy/stanceCrafting";
import { resetPlayerClass } from "../src/admin/gameActions";
import { outgoingFinalDamage } from '../src/systems/combat/damage/finalDamage';
/**
 * The four postures added 2026-09-02: Time to Strike, Reaper, Warding, Powering Up.
 *
 * Two jobs. First, prove each one's mechanic actually does what its tooltip says —
 * these mechanics are easy to regress because their normal loadout paths are small.
 * Second, hold the placement invariant: all four are now taught by authored
 * T3/T4 recipes, so none may remain unplaced.
 */
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  GAME_CONFIG,
  POWERING_UP_MAX_CHARGE_MS,
  POWERING_UP_MIN_RELEASE_MS,
  POWERING_UP_RELEASE_ATTACK_PCT,
  REAPER_MOMENTUM_ATTACK_PCT,
  REAPER_MOMENTUM_MS,
  STANCE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  TIME_TO_STRIKE_EMPOWERED_ADD,
  TIME_TO_STRIKE_NORMAL_PENALTY,
  WARDING_DURATION_RESIST,
  WARDING_POTENCY_RESIST,
  emptyEquipment,
  getStatusEffect,
  NO_STANCE_ID,
  ITEM_DATABASE,
  upgradeStatBonusTotal,
  runeRuleCost,
  stanceDef,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import {
  STANCE_SWITCH_COOLDOWN_MS,
  initStanceCombatEffects,
  requestManualStance,
  updateStanceSwitch,
} from "../src/systems/player/stances/stanceSwitch";
import {
  POWERING_UP_ID,
  REAPER_MOMENTUM_EFFECT,
  POWER_RELEASE_EFFECT,
  poweringUpChargeMs,
  poweringUpFullyCharged,
  stanceAttackSpeedBonus,
} from "../src/systems/player/stances/stanceBehaviors";
import { emitCombatEvent, makeCombatContext } from "../src/systems/combat/engine/combatPipeline";
import { markEngaged } from "../src/systems/combat/ai/engagement";
import { applyMonsterDotToPlayer } from "../src/systems/combat/status/monsterDot";
import {
  harmfulStatusDurationMult,
  harmfulStatusPotencyMult,
} from "../src/systems/combat/status/harmfulStatus";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NEW_STANCES = [
  "time-to-strike-stance",
  "reaper-stance",
  "warding-stance",
  "powering-up-stance",
];
const UNPLACED_STANCES: string[] = [];

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "unplaced-player", name: "Unplaced Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 0, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [...NEW_STANCES],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
}

// ── Every implemented posture exists and is now placed ───────────────────────

for (const id of NEW_STANCES) {
  assert(!!stanceDef(id), `${id} should exist in the stance catalog`);
}
for (const id of NEW_STANCES) {
  const recipes = [...STANCE_RECIPE_DATABASE.values()].filter((recipe) => recipe.stanceId === id);
  assert(recipes.length === 1, `${id} should have exactly one authored stance recipe`);
}
const placed = [...STANCE_RECIPE_DATABASE.values()]
  .map((recipe) => recipe.stanceId)
  .filter((stanceId) => UNPLACED_STANCES.includes(stanceId));
assert(
  placed.length === 0,
  `these stances are deliberately unplaced; a recipe now teaches: ${placed.join(", ")}`,
);

// ── Rune vocabulary the new postures need ──────────────────────────────────────

const switchStance = ACTION_DATABASE.get("switch-stance")!;
assert(
  (switchStance.allowedConditionIds ?? []).includes("before-empowered"),
  "Empowered Ready must be a legal Switch Stance situation — it is Time to Strike's whole trigger",
);
assert(
  (switchStance.allowedConditionIds ?? []).includes("stance-charged"),
  "Stance Charged must be a legal Switch Stance situation — it is how Powering Up is left on purpose",
);
assert(
  (switchStance.allowedConditionIds ?? []).includes("while-traveling"),
  "While Traveling must be a legal Switch Stance situation — it is what makes Fleeting/Predator travel postures",
);
assert(!!CONDITION_DATABASE.get("stance-charged"), "Stance Charged must be an authored condition");
assert(
  runeRuleCost({ conditionId: "before-empowered", actionId: "switch-stance", targetStanceId: "time-to-strike-stance" }) ===
    CONDITION_DATABASE.get("before-empowered")!.cost,
  "stance rules pay only for timing",
);

// ── Setup ─────────────────────────────────────────────────────────────────────

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "unplaced-player");
player.tracksProgression.attunedStances = [...player.tracksProgression.knownStances];
recalculatePlayerEntityStats(world, player);
initStanceCombatEffects();
let now = 1_000;
const advance = (ms: number): void => { now += ms; updateCombatState(world, ms); };
const target = world.createMonster("node-5-5", "plains-slime", { x: 450, y: 400 });
if (!target) throw new Error("setup: target monster missing");
// First tick bootstraps the switch system (it seeds the minimum-dwell cooldown), so
// get it out of the way before any test wants an actual switch to land.
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, 0, now);

/** Force a posture without waiting on rune reconciliation or the minimum dwell. */
function wear(stanceId: string | null): void {
  player.tracksProgression.activeStance = stanceId;
  recalculatePlayerEntityStats(world, player);
}

// ── Time to Strike ────────────────────────────────────────────────────────────
// The empowered half is a passive the empowered-attack engine already reads, so the
// stance never touches that code path; only the ordinary-hit penalty is a listener.

wear("time-to-strike-stance");
assert(
  player.usesSkills.passives["shared.empowered-mult-add"] === TIME_TO_STRIKE_EMPOWERED_ADD,
  "Time to Strike must feed the shared empowered bonus, not a stance-private one",
);
const ordinary = makeCombatContext(player, "player", target, "monster");
ordinary.damage = 100;
emitCombatEvent("onHit", ordinary, world);
assert(
  ordinary.damage === Math.round(100 * (1 - TIME_TO_STRIKE_NORMAL_PENALTY)),
  "Time to Strike must weaken ordinary hits",
);
const empowered = makeCombatContext(player, "player", target, "monster");
empowered.damage = 100;
empowered.metadata["empoweredAttack"] = true;
emitCombatEvent("onHit", empowered, world);
assert(empowered.damage === 100, "Time to Strike must NOT weaken the empowered hit it exists to enable");
assert(
  (stanceDef("time-to-strike-stance")?.modifiers?.attackSpeedPct ?? 0) === 0,
  "Time to Strike must not slow attack cadence",
);

// ── Reaper ────────────────────────────────────────────────────────────────────

wear("reaper-stance");
const notAKill = makeCombatContext(player, "player", target, "monster");
emitCombatEvent("onHit", notAKill, world);
assert(
  getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT) === undefined,
  "Reaper momentum must be armed by a KILL, not by any hit",
);
const kill = makeCombatContext(player, "player", target, "monster");
emitCombatEvent("onKill", kill, world);
assert(!getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT), "earning cannot activate momentum in Reaper");
assert(stanceAttackSpeedBonus(player.tracksCombat) === 0, "no haste while harvesting");
assert(outgoingFinalDamage(world, player.isPlayer.id, 100) === 85, "only the earning penalty applies");
emitCombatEvent("onKill", kill, world); // multiple kills bank only one charge
advance(STANCE_SWITCH_COOLDOWN_MS);
player.usesAutocombat.auto = false;
assert(requestManualStance(world, player, NO_STANCE_ID).success, "manual leave succeeds");
const momentum = getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT)!;
assert(momentum.remainingMs === 10000 && momentum.stacks === 1, "leaving starts one full 10-second window");
assert(outgoingFinalDamage(world, player.isPlayer.id, 100) === 135, "momentum pays outside Reaper");
assert(stanceAttackSpeedBonus(player.tracksCombat) === .25, "momentum supplies haste");
assert(!requestManualStance(world, player, "reaper-stance").success, "anti-thrash blocks immediate re-entry");
momentum.remainingMs = 500;
emitCombatEvent("onKill", kill, world);
assert(getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT)!.remainingMs === 500, "outside kills do not refresh");
advance(STANCE_SWITCH_COOLDOWN_MS);
assert(requestManualStance(world, player, "reaper-stance").success, "re-enter");
assert(!getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT), "re-entry discards active momentum");
advance(STANCE_SWITCH_COOLDOWN_MS);
assert(requestManualStance(world, player, NO_STANCE_ID).success, "leave without another kill");
assert(stanceAttackSpeedBonus(player.tracksCombat) === 0, "old momentum cannot be recycled");
advance(STANCE_SWITCH_COOLDOWN_MS);
requestManualStance(world, player, "reaper-stance");
emitCombatEvent("onKill", kill, world);
requestManualStance(world, player, null); // return selection to automation
player.usesAutocombat.auto = true;
player.tracksProgression.runesEquipped = [{ conditionId: "always", actionId: "switch-stance", targetStanceId: NO_STANCE_ID }];
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, 0, now);
assert(player.tracksProgression.activeStance === null, "Rune leaves Reaper");
assert(getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT)!.remainingMs === REAPER_MOMENTUM_MS, "Rune release matches manual release");
advance(REAPER_MOMENTUM_MS);
assert(stanceAttackSpeedBonus(player.tracksCombat) === 0, "window expires");
wear("reaper-stance");
emitCombatEvent("onKill", kill, world);
assert(setStanceLoadout(world, player, "default", null, []).success, "unattune Reaper");
assert(stanceAttackSpeedBonus(player.tracksCombat) === 0, "unattuning does not cash out");
player.tracksProgression.attunedStances = [...NEW_STANCES];
wear("reaper-stance");
advance(STANCE_SWITCH_COOLDOWN_MS);
requestManualStance(world, player, NO_STANCE_ID);
assert(!getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT), "unattuning cleared the stored charge");
wear("reaper-stance");
emitCombatEvent("onKill", kill, world);
resetPlayerClass(world, player, { requireAltar: false });
advance(STANCE_SWITCH_COOLDOWN_MS);
requestManualStance(world, player, NO_STANCE_ID);
assert(!getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT), "build reset clears stored charge");
player.tracksProgression.runesEquipped = [];

// Earthsunder owns the largest raw hit at every matching upgrade level.
const earth = ITEM_DATABASE.get('mountain-earthsunder-maul')!;
assert(earth.attacksPerSecond === .4, "Earthsunder retains slow cadence");
for (let plus = 0; plus <= 5; plus++) {
  const attack = earth.statModifiers.attack + (upgradeStatBonusTotal(earth, plus).attack ?? 0);
  for (const item of ITEM_DATABASE.values()) {
    if (item.slot !== 'weapon' || item.id === earth.id) continue;
    const other = item.statModifiers.attack + (upgradeStatBonusTotal(item, plus).attack ?? 0);
    assert(attack > other, earth.id + ' should lead raw hit budget at +' + plus + ': ' + item.id);
  }
}

requestManualStance(world, player, null);

// ── Warding ───────────────────────────────────────────────────────────────────

wear(null);
assert(
  Math.abs(harmfulStatusDurationMult(player) - 1) < 0.0001 &&
    Math.abs(harmfulStatusPotencyMult(player) - 1) < 0.0001,
  "setup: a player with no resistance sources takes harmful statuses at full strength",
);
wear("warding-stance");
assert(
  Math.abs(harmfulStatusDurationMult(player) - (1 - WARDING_DURATION_RESIST)) < 0.0001,
  "Warding must shorten incoming harmful statuses through the shared seam",
);
assert(
  Math.abs(harmfulStatusPotencyMult(player) - (1 - WARDING_POTENCY_RESIST)) < 0.0001,
  "Warding must soften incoming damage-over-time through the shared seam",
);
// End to end, at the one place a monster DoT enters a player.
const dotEffect = { damagePerStack: 100, tickIntervalMs: 1_000, durationMs: 10_000, maxStacks: 3 };
applyMonsterDotToPlayer(world, target, player, dotEffect);
const dot = player.tracksCombat.statusEffects.find((fx) => fx.data["isDot"] === 1);
assert(!!dot, "setup: the monster DoT should have landed");
assert(
  dot!.data["damagePerStack"] === Math.round(100 * (1 - WARDING_POTENCY_RESIST)),
  "Warding must reduce the DoT's per-stack damage at application time",
);
assert(
  dot!.remainingMs === Math.round(10_000 * (1 - WARDING_DURATION_RESIST)),
  "Warding must reduce the DoT's duration at application time",
);
// Endure, never immunity — the effect still landed.
assert(dot!.remainingMs > 0 && dot!.data["damagePerStack"] > 0, "Warding must shorten and soften, never nullify");
player.tracksCombat.statusEffects = [];

// ── Powering Up ───────────────────────────────────────────────────────────────

player.tracksProgression.equippedStances.default = POWERING_UP_ID;
player.tracksProgression.runesEquipped.length = 0;
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === POWERING_UP_ID, "setup: Powering Up should be active");

// Out of combat it must not charge at all — free pre-pull preparation is the exact
// failure mode this posture is designed around.
updateStanceSwitch(world, 2_000, now);
assert(poweringUpChargeMs(player.tracksCombat) === 0, "Powering Up must not charge out of combat");

markEngaged(world, player, now);
updateStanceSwitch(world, 2_000, now);
assert(poweringUpChargeMs(player.tracksCombat) === 2_000, "Powering Up must charge while fighting");
markEngaged(world, player, now);
updateStanceSwitch(world, POWERING_UP_MAX_CHARGE_MS, now);
assert(
  poweringUpChargeMs(player.tracksCombat) === POWERING_UP_MAX_CHARGE_MS,
  "Powering Up's charge must cap",
);
assert(poweringUpFullyCharged(player.tracksCombat), "a full charge must report as charged");

// The Rune situation that lets a rule leave at full charge.
updateRuneDerivedConfig(world, now);
assert(
  CONDITION_DATABASE.get("stance-charged")!.kind === "state",
  "Stance Charged is a state situation like every other",
);

// Leaving spends it, for a window as long as the charge.
player.tracksProgression.equippedStances.default = null;
advance(STANCE_SWITCH_COOLDOWN_MS);
markEngaged(world, player, now);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === null, "setup: the stance should have been left");
const release = getStatusEffect(player.tracksCombat, POWER_RELEASE_EFFECT);
assert(!!release, "leaving Powering Up must spend the charge");
assert(
  release!.remainingMs === POWERING_UP_MAX_CHARGE_MS,
  "the release window must last exactly as long as the charge did",
);
assert(poweringUpChargeMs(player.tracksCombat) === 0, "the charge must be consumed, not kept");
const burst = makeCombatContext(player, "player", target, "monster");
burst.damage = 100;
emitCombatEvent("onHit", burst, world);
assert(
  outgoingFinalDamage(world, player.isPlayer.id, burst.damage) === Math.round(100 * (1 + POWERING_UP_RELEASE_ATTACK_PCT)),
  "the release window must amplify damage",
);
assert(stanceAttackSpeedBonus(player.tracksCombat) > 0, "the release window must feed the cadence gate");
player.tracksCombat.statusEffects = [];

// Combat ending discards the charge, so a finished fight cannot load the next one.
player.tracksProgression.equippedStances.default = POWERING_UP_ID;
advance(STANCE_SWITCH_COOLDOWN_MS);
markEngaged(world, player, now);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === POWERING_UP_ID, "setup: back in Powering Up");
markEngaged(world, player, now);
updateStanceSwitch(world, 3_000, now);
assert(poweringUpChargeMs(player.tracksCombat) > 0, "setup: charge banked mid-fight");
advance(60_000); // long enough that the engagement window has lapsed
updateStanceSwitch(world, 100, now);
assert(
  poweringUpChargeMs(player.tracksCombat) === 0,
  "leaving combat must discard the charge, not bank it for the next pull",
);
assert(
  getStatusEffect(player.tracksCombat, POWER_RELEASE_EFFECT) === undefined,
  "a charge lost to combat ending must not pay out — only LEAVING the stance spends it",
);
assert(
  POWERING_UP_MIN_RELEASE_MS > 0,
  "a minimum release exists so tapping in and out of the stance is worthless",
);

// Death clears both earned and released state through the real lifecycle.
wear("reaper-stance");
emitCombatEvent("onKill", makeCombatContext(player, "player", target, "monster"), world);
world.killPlayer(player.isPlayer.id, { kind: "stance", stanceName: "test", damage: player.hasHealth.hp });
world.respawnPlayer(player.isPlayer.id);
advance(STANCE_SWITCH_COOLDOWN_MS);
requestManualStance(world, player, NO_STANCE_ID);
assert(!getStatusEffect(player.tracksCombat, REAPER_MOMENTUM_EFFECT), "death cannot leave an earned charge to release");
assert(stanceAttackSpeedBonus(player.tracksCombat) === 0, "death clears stance haste");
console.log("stancesUnplaced.test.ts: ok");
