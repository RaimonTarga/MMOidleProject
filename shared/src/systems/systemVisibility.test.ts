import {
  resolveSystemVisibility,
  type SystemVisibilityInput,
} from "./systemVisibility";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const FRESH: SystemVisibilityInput = {
  playerTier: 0,
  globalMastery: 0,
  knownAbilities: [],
  equippedAbilities: { techniques: [], guards: [] },
  knownStances: [],
  equippedStances: { default: null },
  activeStance: null,
  knownRites: [],
  equippedRites: [],
  essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
  visitedNodes: [],
  // Fresh characters own starter rune fragments, so Loadout is intentionally
  // present from boot under the existing ownership rule.
  runesOwned: ["starter-condition", "starter-action"],
};

const fresh = resolveSystemVisibility(FRESH);
for (const system of ["progression", "party", "loadout"] as const) {
  assert(fresh[system], `a new character should see '${system}' immediately`);
}
for (const [system, visible] of Object.entries(fresh)) {
  if (system === "progression" || system === "party" || system === "loadout") continue;
  assert(!visible, `a new character should not see '${system}' yet`);
}

const afterFirstKill = resolveSystemVisibility({
  ...FRESH,
  biomeXP: { clearing: 43 },
  questProgress: { "tier-0": 1 },
  essences: { green: 1 },
});
assert(afterFirstKill.combatLog, "first blood should reveal the combat log");
assert(afterFirstKill.bestiary, "first blood should reveal the bestiary");
assert(afterFirstKill.materials, "the first essence should reveal materials");
assert(!afterFirstKill.crafting, "one essence should not reveal crafting");
assert(!afterFirstKill.map, "combat in the clearing should not reveal the map");

const almostCrafting = resolveSystemVisibility({ ...FRESH, essences: { green: 3 } });
assert(!almostCrafting.crafting, "three essence is below the crafting threshold");

const splitEssence = resolveSystemVisibility({
  ...FRESH,
  essences: { red: 1, blue: 1, green: 1, yellow: 1 },
});
assert(
  !splitEssence.crafting,
  "four split essence cannot pay a four-essence single-type recipe",
);

const enoughToCraft = resolveSystemVisibility({ ...FRESH, essences: { green: 4 } });
assert(enoughToCraft.crafting, "four same-type essence should reveal crafting");

const afterCraft = resolveSystemVisibility({
  ...FRESH,
  essences: { green: 0 },
  inventory: ["crude-dagger"],
});
assert(afterCraft.inventory, "the first crafted item should reveal inventory");
assert(afterCraft.crafting, "crafting should stay visible after spending the threshold");

const afterTravel = resolveSystemVisibility({
  ...FRESH,
  visitedNodes: ["node-5-4"],
});
assert(afterTravel.map, "entering another node should reveal the map");

const experienceWithoutTravel = resolveSystemVisibility({
  ...FRESH,
  playerTier: 2,
  biomeXP: { clearing: 430 },
  biomeLevel: { clearing: 4 },
});
assert(
  !experienceWithoutTravel.map,
  "XP, biome levels, and player tiers should not replace the travel milestone",
);

const masteryZero = resolveSystemVisibility({ ...FRESH, playerTier: 3 });
assert(!masteryZero.mastery, "player tier alone should not reveal mastery");
const masteryOne = resolveSystemVisibility({ ...FRESH, globalMastery: 1 });
assert(masteryOne.mastery, "global mastery 1 should reveal mastery");

const tierWithoutAbility = resolveSystemVisibility({ ...FRESH, playerTier: 3 });
assert(!tierWithoutAbility.abilities, "player tier alone should not reveal abilities");
assert(!tierWithoutAbility.abilityDock, "player tier alone should not reveal the ability dock");
const craftedAbility = resolveSystemVisibility({
  ...FRESH,
  knownAbilities: ["sweep"],
});
assert(craftedAbility.abilities, "crafting an ability should reveal abilities");
assert(craftedAbility.abilityDock, "crafting an ability should reveal the ability dock");

const tierOne = resolveSystemVisibility({ ...FRESH, playerTier: 1 });
for (const system of [
  "combatLog",
  "bestiary",
  "progression",
  "inventory",
  "loadout",
  "materials",
  "passiveTree",
  "party",
] as const) {
  assert(tierOne[system], `tier 1 should retain the existing '${system}' fallback`);
}
for (const system of ["crafting", "map", "mastery", "abilities", "abilityDock"] as const) {
  assert(!tierOne[system], `tier 1 should not bypass the '${system}' milestone`);
}

const tierTwo = resolveSystemVisibility({ ...FRESH, playerTier: 2 });
assert(tierTwo.stances, "stances should retain their tier 2 gate");
const tierThree = resolveSystemVisibility({ ...FRESH, playerTier: 3 });
assert(tierThree.rites, "rites should retain their tier 3 gate");

const ownershipCases: Array<
  [string, Partial<SystemVisibilityInput>, keyof typeof fresh]
> = [
  ["has an ability equipped", { equippedAbilities: { techniques: ["sweep"], guards: [] } }, "abilities"],
  ["knows a stance", { knownStances: ["offensive-stance"] }, "stances"],
  ["knows a rite", { knownRites: ["rite-a"] }, "rites"],
  ["has unlocked recipes", { unlockedRecipes: ["crude-dagger"] }, "materials"],
  ["has allocated passives", { passives: { "defense.evade": 1 } }, "passiveTree"],
  ["has an unspent skill point", { skillPoints: 1 }, "passiveTree"],
  ["has equipment on", { hasEquipment: true }, "inventory"],
  ["has global mastery", { globalMastery: 1 }, "mastery"],
  ["has crafted a rune", { runeRecipesCrafted: ["rune-recipe-a"] }, "crafting"],
];

for (const [description, signal, system] of ownershipCases) {
  const resolved = resolveSystemVisibility({ ...FRESH, ...signal });
  assert(
    resolved[system],
    `a character that ${description} must keep '${system}' visible`,
  );
}

console.log("systemVisibility: ok");
