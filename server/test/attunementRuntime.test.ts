import { saveCharacter, loadCharacter } from "../src/db/playerRepo";
import type { DB } from "../src/db/playerRepo";
import { ABILITY_DATABASE, GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, getCooldown, getStatusEffect, runicPointLoadoutCost, runicLoadoutFromProgression, composePlayerView } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAbilityLoadout } from "../src/systems/player/economy/abilityCrafting";
import { setStanceLoadout } from "../src/systems/player/economy/stanceCrafting";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { fireWithReferenceWiring } from "./fixtures/abilityWiring";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "multislot-player", name: "Multislot" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      // Below Brace's hp-below 0.5 trigger so both Guards want to fire.
      hp: Math.round(GAME_CONFIG.PLAYER_MAX_HP * 0.4),
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
      // T4: both second slots unlocked.
      playerTier: 4,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["sweep", "expose-weakness", "brace", "cleanse", "endure"],
      attunedAbilities: {
        techniques: ["sweep", "expose-weakness"],
        guards: ["brace", "endure"],
      },
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

// ── 1. Slot counts are tier-gated ────────────────────────────────────────────
initCombatSystems();
const world = new World();
const slices = makePlayerSlices();
slices.tracksProgression.playerTier = 1;
slices.tracksProgression.knownAbilities = [...ABILITY_DATABASE.keys()];
slices.tracksProgression.biomeLevel = { plains: 1000 };
slices.tracksProgression.knownStances = ["offensive-stance", "tanking-stance"];
const player = world.attachPlayerEntity(slices, "attunement-test");
player.usesAutocombat.auto = true;
const many = { techniques: ["sweep", "power-strike", "frenzy", "snipe"], guards: ["brace", "endure", "cleanse", "break-free"] };
assert(setAbilityLoadout(world, player, many).success, "T1 must allow arbitrary ability count within RP");
assert(player.tracksProgression.attunedAbilities.techniques.length === 4, "hidden family cap");
assert(!setStanceLoadout(world, player, "default", "offensive-stance").success, "unattuned default accepted");
assert(setStanceLoadout(world, player, "default", "offensive-stance", ["offensive-stance", "tanking-stance"]).success, "stance attunement failed");
const total = runicPointLoadoutCost(runicLoadoutFromProgression(player.tracksProgression));
assert(total > 0, "authoritative cost missing");
const view = composePlayerView(player);
assert(view && runicPointLoadoutCost(runicLoadoutFromProgression(view)) === total, "client/server cost projection disagrees");
const enemy = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
assert(enemy, "monster fixture");
setAttackTarget(world, player, enemy.isMonster.id);
player.tracksProgression.runesEquipped = [{ conditionId: "before-empowered", actionId: "use-ability", targetAbilityId: "sweep" }];
updateRuneDerivedConfig(world, 1000);
fireWithReferenceWiring(world, 1000);
assert(player.isCastingAbility?.abilityId === "power-strike", "an ability with its own rule must not also get reference wiring, while a later wired Technique runs");
assert(getStatusEffect(player.tracksCombat, "ability-frenzy"), "instant Technique must fire behind a claimed offensive opportunity");
world.ecs.removeComponent(player, "isCastingAbility");
player.tracksProgression.runesEquipped = [
 { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "power-strike" },
 { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "sweep" },
];
updateRuneDerivedConfig(world, 1100);
fireWithReferenceWiring(world, 1100);
assert(player.isCastingAbility?.abilityId === "power-strike", "Rune order decides arbitration, not attunement order");
// Drop the reference wiring the helper added; keep only the two explicit rules.
player.tracksProgression.runesEquipped = player.tracksProgression.runesEquipped.slice(0, 2);
assert(setAbilityLoadout(world, player, { ...many, techniques: ["sweep"] }).success, "unattune failed");
assert(player.tracksProgression.runesEquipped.length === 1 && player.tracksProgression.runesEquipped[0].targetAbilityId === "sweep", "unattuning must clear only dependent rules");
player.tracksProgression.biomeLevel = {};
assert(!setAbilityLoadout(world, player, many).success, "over-budget expansion accepted");
assert(setAbilityLoadout(world, player, { techniques: ["sweep"], guards: ["brace"] }).success, "cost-reducing repair rejected");
const over = makePlayerSlices();
over.tracksProgression.knownAbilities = [...ABILITY_DATABASE.keys()];
over.tracksProgression.attunedAbilities = many;
over.tracksProgression.runesEquipped = [];
const preserved = world.attachPlayerEntity(over, "over-budget");
assert(preserved.tracksProgression.attunedAbilities.techniques.length === 4 && preserved.tracksProgression.runesEquipped.length === 0, "login must not trim over-budget choices or restore deleted rules");
async function persistenceRoundTrip() {
  let row: Record<string, unknown> = { id: "saved", accountId: "test", deletedAt: null };
  const db = { update: () => ({ set: (values: Record<string, unknown>) => { row = { ...row, ...values }; return { where: () => ({ returning: async () => [row] }) }; } }) } as unknown as DB;
  await saveCharacter(db, "saved", preserved);
  const restored = await loadCharacter(db, "test", "saved");
  assert(restored, "save/load lost character");
  assert(restored.tracksProgression.attunedAbilities.techniques.length === 4, "save/load trimmed over-budget attunement");
  assert(JSON.stringify(restored.tracksProgression.knownAbilities) === JSON.stringify(preserved.tracksProgression.knownAbilities), "save/load lost learning");
  assert(!("equippedAbilities" in restored.tracksProgression), "retired state survived hydration");
  console.log("attunementRuntime: ok");
}
persistenceRoundTrip().catch(error => { console.error(error); process.exitCode = 1; });
