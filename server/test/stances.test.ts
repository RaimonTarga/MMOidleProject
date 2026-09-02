import {
  ACTION_DATABASE,
  BRAWLER_MAX_REDUCTION,
  BERSERKER_SELF_DAMAGE_PCT,
  GAME_CONFIG,
  PERFECTION_HP_THRESHOLD,
  NO_STANCE_ID,
  STANCE_DATABASE,
  STARTER_RUNE_IDS,
  activeStanceModifiers,
  brawlerDamageReduction,
  emptyEquipment,
  runeRuleCost,
  sanitizeRuneLoadout,
  stanceDef,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { STANCE_SWITCH_COOLDOWN_MS, initStanceCombatEffects, updateStanceSwitch } from "../src/systems/player/stances/stanceSwitch";
import { World } from "../src/world/World";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { recalculatePlayerStanceStats } from "../src/ecs/playerEntityFormulas";
import { markEngaged } from "../src/systems/combat/ai/engagement";
import { emitCombatEvent, makeCombatContext } from "../src/systems/combat/engine/combatPipeline";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "stance-player", name: "Stance Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 0, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [],
      runesEquipped: [{ conditionId: "hp-below-25", actionId: "switch-stance", targetStanceId: "defensive-stance" }],
      knownAbilities: [], equippedAbilities: { techniques: [], guards: [] },
      knownStances: ["offensive-stance", "defensive-stance", "tanking-stance", "berserker-stance"],
      equippedStances: { default: "offensive-stance" }, activeStance: "offensive-stance",
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
}

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "stance-player");
recalculatePlayerEntityStats(world, player);
const neutralRule = sanitizeRuneLoadout(
  [{ conditionId: "hp-below-25", actionId: "switch-stance", targetStanceId: NO_STANCE_ID }],
  new Set(STARTER_RUNE_IDS),
  Number.POSITIVE_INFINITY,
  null,
  new Set(),
);
assert(neutralRule.length === 1, "no stance should validate without being in the learned stance catalog");
let now = 1_000;
const advance = (ms: number): void => { now += ms; updateCombatState(world, ms); };

updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, 0, now);
assert(player.tracksProgression.activeStance === "offensive-stance", "default stance should initialize active");
// Percentage posture, not a flat grant: the promise is a multiple of the stat line
// underneath, which is what makes a stance read the same at T1 and at T5.
assert(
  player.dealsDamage.attack === Math.round(GAME_CONFIG.PLAYER_ATTACK * 1.15),
  "offensive stance should multiply attack by its authored percentage",
);

player.hasHealth.hp = player.hasHealth.maxHp * 0.2;
advance(200);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, 200, now);
assert(player.tracksProgression.activeStance === "offensive-stance", "minimum dwell should prevent an early switch");

advance(STANCE_SWITCH_COOLDOWN_MS);
const hpPctBefore = player.hasHealth.hp / player.hasHealth.maxHp;
player.tracksCombat.cooldowns["ability.cd.test"] = 9_000;
player.tracksCombat.counters["test.combo"] = 4;
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === "defensive-stance", "rule should switch to its own destination");
assert(
  player.dealsDamage.attack === Math.round(GAME_CONFIG.PLAYER_ATTACK * 0.85),
  "destination should replace, not compound with, the old stance's posture",
);
assert(player.tracksCombat.cooldowns["ability.cd.test"] === 9_000, "unrelated cooldown should survive a stance recalc unchanged");
assert(player.tracksCombat.counters["test.combo"] === 4, "unrelated counters should survive stance recalc");
assert(Math.abs(player.hasHealth.hp / player.hasHealth.maxHp - hpPctBefore) < 0.001, "stance switches should preserve HP percentage");

// Tanking is the heaviest posture in the cast and is the max-HP canary: stances are
// temporary modes that switch on their own, so none of them may resize the HP pool.
const tankingMaxHp = player.hasHealth.maxHp;
player.tracksProgression.runesEquipped[0].targetStanceId = "tanking-stance";
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === "tanking-stance", "a rule destination should be freely replaceable");
assert(player.hasHealth.maxHp === tankingMaxHp, "no stance may change max HP");
assert(Math.abs(player.hasHealth.hp / player.hasHealth.maxHp - hpPctBefore) < 0.001, "a stance switch should preserve HP percentage");

for (const stance of STANCE_DATABASE.values()) {
  for (const mods of [stance.modifiers ?? {}, stance.gatedModifiers?.modifiers ?? {}]) {
    assert(
      !("maxHp" in mods) && !("maxHpPct" in mods),
      `${stance.id} must not carry a max-HP modifier`,
    );
  }
  // A gate is a payoff switch, never a drawback switch: whatever the posture costs has
  // to be paid on both sides of the threshold, or falling out of it is free.
  const gated = stance.gatedModifiers?.modifiers;
  if (gated) {
    for (const [key, value] of Object.entries(gated)) {
      const isDrawback = key === "damageTakenPct" ? value > 0 : value < 0;
      assert(!isDrawback, `${stance.id} put a drawback (${key}) behind its HP gate`);
    }
  }
}

// The neutral posture is a real, zero-cost Rune destination despite not being a learned stance.
player.tracksProgression.runesEquipped[0].targetStanceId = NO_STANCE_ID;
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === null, "a rule should be able to switch explicitly to no stance");
assert(player.dealsDamage.attack === GAME_CONFIG.PLAYER_ATTACK, "no stance should have no bonuses or penalties");

initStanceCombatEffects();
const target = world.createMonster("node-5-5", "plains-slime", { x: 450, y: 400 });
if (!target) throw new Error("setup: target monster missing");

player.tracksProgression.activeStance = "predator-stance";
updateStanceSwitch(world, 0, now);
const opener = makeCombatContext(player, "player", target, "monster");
opener.damage = 100;
emitCombatEvent("onHit", opener, world);
assert(opener.damage === 175, "Predator should amplify exactly one armed opening hit");
const followup = makeCombatContext(player, "player", target, "monster");
followup.damage = 100;
emitCombatEvent("onHit", followup, world);
assert(followup.damage === 100, "Predator opener should be consumed after one hit");

player.tracksProgression.activeStance = "execute-stance";
target.hasHealth.hp = target.hasHealth.maxHp * 0.2;
const execution = makeCombatContext(player, "player", target, "monster");
execution.damage = 100;
emitCombatEvent("onHit", execution, world);
assert(execution.damage === 175, "Execute should amplify hits against wounded targets");

player.tracksProgression.activeStance = "brawler-stance";
for (let i = 0; i < 3; i++) {
  const aggressor = i === 0 ? target : world.createMonster("node-5-5", "plains-slime", { x: 470 + i * 20, y: 400 });
  if (!aggressor) throw new Error("setup: aggressor missing");
  setAggroTarget(world, aggressor, { id: player.isPlayer.id, kind: "player" }, now);
}
const surrounded = makeCombatContext(target, "monster", player, "player");
surrounded.damage = 100;
emitCombatEvent("onDamageTaken", surrounded, world);
assert(
  surrounded.damage === Math.round(100 * (1 - brawlerDamageReduction(3))),
  "Brawler should read the authoritative aggressor count",
);
assert(brawlerDamageReduction(99) === BRAWLER_MAX_REDUCTION, "Brawler mitigation should be capped");
assert(brawlerDamageReduction(0) === 0, "Brawler should do nothing with nobody engaging");

// Incoming-damage postures must survive a bare stat line. The old model pushed them
// into the additive DR pool, which clamps at 0 — so with no gear DR the drawback was
// silently free and the whole trade evaporated.
player.tracksProgression.activeStance = "offensive-stance";
recalculatePlayerStanceStats(world, player);
assert(player.mitigatesDamage.damageReduction === 0, "setup: the bare test character has no gear DR");
const punished = makeCombatContext(target, "monster", player, "player");
punished.damage = 100;
emitCombatEvent("onDamageTaken", punished, world);
const offensiveTaken = stanceDef("offensive-stance")?.modifiers?.damageTakenPct ?? 0;
assert(offensiveTaken > 0, "setup: Offensive should carry a damage-taken drawback");
assert(
  punished.damage === Math.round(100 * (1 + offensiveTaken)),
  "an offensive posture's damage-taken drawback must apply with zero gear DR",
);

player.tracksProgression.activeStance = "tanking-stance";
recalculatePlayerStanceStats(world, player);
const braced = makeCombatContext(target, "monster", player, "player");
braced.damage = 100;
emitCombatEvent("onDamageTaken", braced, world);
assert(braced.damage < 100, "a defensive posture should reduce incoming damage multiplicatively");

// ── Perfection: the one HP-gated posture ──────────────────────────────────────
// Runes own conditions, but a Rune can only decide when you ENTER a stance; it cannot
// switch the bonuses off underneath you once you are in one. Perfection's whole identity
// is "keep your HP topped up", so the gate lives on the stance and is checked every tick.
const perfection = stanceDef("perfection-stance");
assert(!!perfection?.gatedModifiers, "Perfection must carry an HP gate, not flat bonuses");
assert(
  perfection!.gatedModifiers!.minHpPct === PERFECTION_HP_THRESHOLD,
  "Perfection's gate must be the published threshold",
);
assert(
  (perfection!.modifiers?.platingPct ?? 0) < 0,
  "Perfection's Plating drawback must live in the UNGATED half",
);
assert(
  (activeStanceModifiers("perfection-stance", 1)?.attackPct ?? 0) > 0
    && (activeStanceModifiers("perfection-stance", 0.5)?.attackPct ?? 0) === 0,
  "the resolver must be the only thing that knows about the gate",
);

player.tracksProgression.knownStances.push("perfection-stance");
player.tracksProgression.equippedStances.default = "perfection-stance";
player.tracksProgression.runesEquipped.length = 0;
player.hasHealth.hp = player.hasHealth.maxHp;
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === "perfection-stance", "setup: Perfection should be active");

const perfectAttack = Math.round(GAME_CONFIG.PLAYER_ATTACK * 1.12);
const perfectSpeed = Math.round(GAME_CONFIG.PLAYER_SPEED * 1.12);
const perfectPlating = Math.round(GAME_CONFIG.PLAYER_PLATING * 0.8);
const gatedCooldown = player.performsAttack.attackCooldown;
assert(player.dealsDamage.attack === perfectAttack, "Perfection should grant Attack at full HP");
assert(player.hasPosition.speed === perfectSpeed, "Perfection should grant Move Speed at full HP");
assert(gatedCooldown < GAME_CONFIG.PLAYER_ATTACK_COOLDOWN, "Perfection should grant Attack Speed at full HP");
assert(player.mitigatesDamage.plating === perfectPlating, "Perfection's Plating drawback should apply at full HP");

// One tick below the line: the payoff goes, the price stays. That asymmetry is the
// reason to leave the posture rather than ride it down.
player.tracksCombat.cooldowns["ability.cd.test"] = 4_000;
player.hasHealth.hp = player.hasHealth.maxHp * (PERFECTION_HP_THRESHOLD - 0.01);
updateStanceSwitch(world, 100, now);
assert(player.dealsDamage.attack === GAME_CONFIG.PLAYER_ATTACK, "Perfection's Attack must switch off below the gate");
assert(player.hasPosition.speed === GAME_CONFIG.PLAYER_SPEED, "Perfection's Move Speed must switch off below the gate");
assert(
  player.performsAttack.attackCooldown === GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
  "Perfection's Attack Speed must switch off below the gate",
);
assert(
  player.mitigatesDamage.plating === perfectPlating,
  "Perfection's Plating drawback must persist below the gate",
);
assert(
  player.tracksProgression.activeStance === "perfection-stance",
  "the gate must not switch stances — only a Rune rule does that",
);
assert(
  player.tracksCombat.cooldowns["ability.cd.test"] === 4_000,
  "a gate crossing must not corrupt unrelated combat state",
);
assert(
  Math.abs(player.hasHealth.hp / player.hasHealth.maxHp - (PERFECTION_HP_THRESHOLD - 0.01)) < 0.001,
  "a gate crossing must preserve HP percentage",
);

// Back over the line, same tick cadence. The crossing is edge-triggered off a stored
// flag, so it has to rearm in both directions rather than latching once.
player.hasHealth.hp = player.hasHealth.maxHp * 0.95;
updateStanceSwitch(world, 100, now);
assert(player.dealsDamage.attack === perfectAttack, "Perfection must reactivate on the way back up");
assert(player.performsAttack.attackCooldown === gatedCooldown, "Perfection's cadence must reactivate too");

// Leave the gate closed so the Berserker section below starts from a settled flag.
player.hasHealth.hp = player.hasHealth.maxHp * 0.5;
updateStanceSwitch(world, 100, now);
assert(player.dealsDamage.attack === GAME_CONFIG.PLAYER_ATTACK, "setup: gate closed before the Berserker section");

// ── Runic cost of a stance rule ───────────────────────────────────────────────
// `Switch Stance` is a verb with no power of its own; the destination carries the
// whole charge. Taxing the verb too priced the cheapest tactical transition like a
// premium Rite and pushed Stance micro out of reach of ordinary budgets.
assert(ACTION_DATABASE.get("switch-stance")!.cost === 0, "Switch Stance itself must contribute 0 RP");
assert(
  runeRuleCost({ conditionId: "in-combat", actionId: "switch-stance", targetStanceId: "offensive-stance" }) === 2,
  "a stance rule must cost exactly condition + destination",
);
assert(
  runeRuleCost({ conditionId: "hp-above-90", actionId: "switch-stance", targetStanceId: "perfection-stance" }) === 3,
  "Perfection's destination surcharge must still be authoritative",
);
assert(
  runeRuleCost({ conditionId: "in-combat", actionId: "switch-stance", targetStanceId: NO_STANCE_ID }) ===
    runeRuleCost({ conditionId: "in-combat", actionId: "switch-stance" }),
  "the neutral destination must stay free",
);

player.tracksProgression.activeStance = "berserker-stance";
recalculatePlayerStanceStats(world, player);
markEngaged(world, player, now);
const berserkerHp = player.hasHealth.hp;
updateStanceSwitch(world, 1_000, now + 1_000);
assert(
  player.hasHealth.hp === berserkerHp - Math.round(player.hasHealth.maxHp * BERSERKER_SELF_DAMAGE_PCT),
  "Berserker should deal deterministic self-damage",
);
player.hasHealth.hp = 1;
updateStanceSwitch(world, 1_000, now + 2_000);
assert(world.getPlayerEntity(player.isPlayer.id)?.isDead !== undefined, "Berserker self-damage should be lethal");

// Every server-runtime effect must be written down for the player. A stance whose
// behavior lives in a combat listener cannot describe itself, so an unlisted one is
// invisible — which is the exact failure this pass existed to fix.
const BEHAVIORAL_STANCES = [
  "berserker-stance",
  "predator-stance",
  "brawler-stance",
  "execute-stance",
];
for (const id of BEHAVIORAL_STANCES) {
  const stance = stanceDef(id);
  assert(!!stance, `${id} should exist`);
  assert(
    (stance!.behaviors?.length ?? 0) > 0 || !!stance!.mechanicEffects,
    `${id} has server-side behavior and must describe it to the player`,
  );
}
assert(
  !!stanceDef("recuperating-stance")?.mechanicEffects?.["defense.recovery-active-pct"],
  "Recuperating's identity is in-combat Recovery access, not a flat Recovery grant",
);

console.log("stances.test.ts: ok");
