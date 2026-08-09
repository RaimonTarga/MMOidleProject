import { GAME_CONFIG, NO_STANCE_ID, STARTER_RUNE_IDS, emptyEquipment, sanitizeRuneLoadout } from "@mmo-idle/shared";
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
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, hpRegen: GAME_CONFIG.PLAYER_HP_REGEN },
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
assert(player.dealsDamage.attack === GAME_CONFIG.PLAYER_ATTACK + 20, "offensive stats should be folded");

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
assert(player.dealsDamage.attack === GAME_CONFIG.PLAYER_ATTACK - 15, "destination should replace old stance stats");
assert(player.tracksCombat.cooldowns["ability.cd.test"] === 9_000, "unrelated cooldown should survive a stance recalc unchanged");
assert(player.tracksCombat.counters["test.combo"] === 4, "unrelated counters should survive stance recalc");
assert(Math.abs(player.hasHealth.hp / player.hasHealth.maxHp - hpPctBefore) < 0.001, "stance switches should preserve HP percentage");

// Max-HP semantics are observable by switching to Tanking as a new rule destination.
player.tracksProgression.runesEquipped[0].targetStanceId = "tanking-stance";
advance(STANCE_SWITCH_COOLDOWN_MS);
updateRuneDerivedConfig(world, now);
updateStanceSwitch(world, STANCE_SWITCH_COOLDOWN_MS, now);
assert(player.tracksProgression.activeStance === "tanking-stance", "a rule destination should be freely replaceable");
assert(Math.abs(player.hasHealth.hp / player.hasHealth.maxHp - hpPctBefore) < 0.001, "max-HP stance should preserve HP percentage");

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
assert(surrounded.damage < 100 && surrounded.damage >= 60, "Brawler should apply capped crowd-pressure mitigation");

player.tracksProgression.activeStance = "berserker-stance";
recalculatePlayerStanceStats(world, player);
markEngaged(world, player, now);
const berserkerHp = player.hasHealth.hp;
updateStanceSwitch(world, 1_000, now + 1_000);
assert(player.hasHealth.hp === berserkerHp - Math.round(player.hasHealth.maxHp * 0.02), "Berserker should deal deterministic self-damage");
player.hasHealth.hp = 1;
updateStanceSwitch(world, 1_000, now + 2_000);
assert(world.getPlayerEntity(player.isPlayer.id)?.isDead !== undefined, "Berserker self-damage should be lethal");

console.log("stances.test.ts: ok");
