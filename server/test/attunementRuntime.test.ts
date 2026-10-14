import { baseRecoveryForTier } from "@mmo-idle/shared";
import { saveCharacter, loadCharacter } from "../src/db/playerRepo";
import type { DB } from "../src/db/playerRepo";
import { ABILITY_DATABASE, GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, getCooldown, getStatusEffect } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAbilityLoadout } from "../src/systems/player/economy/abilityCrafting";
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
      // T4: both second slots unlocked.
      playerTier: 4,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [],
      knownAbilities: ["sweep", "binding-strike", "brace", "cleanse", "endure"],
      attunedAbilities: {
        techniques: ["sweep", "binding-strike"],
        guards: ["brace", "endure"],
      },
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
const player = world.attachPlayerEntity(slices, "attunement-test");
player.usesAutocombat.auto = true;
const many = { techniques: ["sweep", "slam", "imbue-lightning", "snipe"], guards: ["brace", "endure", "cleanse", "break-free"] };
assert(setAbilityLoadout(world, player, many).success, "T1 must allow an arbitrary ability count");
assert(player.tracksProgression.attunedAbilities.techniques.length === 4, "hidden family cap");
const enemy = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
assert(enemy, "monster fixture");
setAttackTarget(world, player, enemy.isMonster.id);
player.tracksProgression.runesEquipped = [{ conditionId: "before-empowered", actionId: "use-ability", targetAbilityId: "sweep" }];
updateRuneDerivedConfig(world, 1000);
fireWithReferenceWiring(world, 1000);
assert(player.isCastingAbility?.abilityId === "slam", "an ability with its own rule must not also get reference wiring, while a later wired Technique runs");
assert(getStatusEffect(player.tracksCombat, "ability-imbue"), "instant Technique (Imbue Lightning) must fire behind a claimed offensive opportunity");
world.ecs.removeComponent(player, "isCastingAbility");
player.tracksProgression.runesEquipped = [
 { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "slam" },
 { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "sweep" },
];
updateRuneDerivedConfig(world, 1100);
fireWithReferenceWiring(world, 1100);
assert(player.isCastingAbility?.abilityId === "slam", "Rune order decides arbitration, not attunement order");
// Drop the reference wiring the helper added; keep only the two explicit rules.
player.tracksProgression.runesEquipped = player.tracksProgression.runesEquipped.slice(0, 2);
assert(setAbilityLoadout(world, player, { ...many, techniques: ["sweep"] }).success, "unattune failed");
assert(player.tracksProgression.runesEquipped.length === 1 && player.tracksProgression.runesEquipped[0].targetAbilityId === "sweep", "unattuning must clear only dependent rules");
player.tracksProgression.biomeLevel = {};
assert(setAbilityLoadout(world, player, many).success, "attuning costs nothing, at any mastery");
const over = makePlayerSlices();
over.tracksProgression.knownAbilities = [...ABILITY_DATABASE.keys()];
over.tracksProgression.attunedAbilities = many;
over.tracksProgression.runesEquipped = [];
const preserved = world.attachPlayerEntity(over, "over-budget");
assert(preserved.tracksProgression.attunedAbilities.techniques.length === 4 && preserved.tracksProgression.runesEquipped.length === 0, "login must not trim attunement or restore deleted rules");
async function persistenceRoundTrip() {
  let row: Record<string, unknown> = { id: "saved", accountId: "test", deletedAt: null };
  const db = { update: () => ({ set: (values: Record<string, unknown>) => { row = { ...row, ...values }; return { where: () => ({ returning: async () => [row] }) }; } }) } as unknown as DB;
  await saveCharacter(db, "saved", preserved);
  const restored = await loadCharacter(db, "test", "saved");
  assert(restored, "save/load lost character");
  assert(restored.tracksProgression.attunedAbilities.techniques.length === 4, "save/load trimmed attunement");
  assert(JSON.stringify(restored.tracksProgression.knownAbilities) === JSON.stringify(preserved.tracksProgression.knownAbilities), "save/load lost learning");
  assert(!("equippedAbilities" in restored.tracksProgression), "retired state survived hydration");
  console.log("attunementRuntime: ok");
}
persistenceRoundTrip().catch(error => { console.error(error); process.exitCode = 1; });
