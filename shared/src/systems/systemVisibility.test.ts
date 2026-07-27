// The §16 staged unlock arc, as assertions rather than a manual playthrough.
//
// Two properties matter more than any individual gate:
//   1. A fresh character sees almost nothing, so the arc actually stages.
//   2. No gate can ever take a destination away from a character that has used
//      it — the stranding risk the plan calls out as mandatory to prevent.
//
// Pure: no World, no DOM, no atoms.

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
  equippedStances: { default: null, reactive: null },
  activeStance: null,
  knownRites: [],
  equippedRites: [],
};

// ── A fresh character boots to a nearly bare HUD ─────────────────────────────

const fresh = resolveSystemVisibility(FRESH);
for (const [system, visible] of Object.entries(fresh)) {
  assert(!visible, `a brand new character should not see '${system}' yet`);
}

// ── Each trigger reveals its own element, and only forward ───────────────────

const afterFirstKill = resolveSystemVisibility({ ...FRESH, biomeXP: { plains: 4 } });
assert(afterFirstKill.combatLog, "first blood should reveal the combat log");
assert(afterFirstKill.bestiary, "first blood should reveal the bestiary");
assert(afterFirstKill.progression, "first blood should reveal the progression panel");
assert(!afterFirstKill.inventory, "a kill alone should not reveal the inventory");
assert(!afterFirstKill.crafting, "a kill alone should not reveal crafting");

const afterFirstItem = resolveSystemVisibility({ ...FRESH, inventory: ["iron-broadsword"] });
assert(afterFirstItem.inventory, "owning an item should reveal the inventory");
assert(!afterFirstItem.combatLog, "owning an item says nothing about having fought");

const afterFirstEssence = resolveSystemVisibility({ ...FRESH, essences: { red: 2 } });
assert(afterFirstEssence.materials, "the first essence should reveal materials");
assert(
  afterFirstEssence.crafting,
  "crafting reuses the materials gate rather than inventing a second policy",
);

const afterFirstBiomeLevel = resolveSystemVisibility({ ...FRESH, biomeLevel: { forest: 1 } });
assert(afterFirstBiomeLevel.map, "the first biome level should reveal the map");

const afterFirstRune = resolveSystemVisibility({ ...FRESH, runesOwned: ["rune-a"] });
assert(afterFirstRune.loadout, "owning a rune should reveal the loadout");

const grouped = resolveSystemVisibility({ ...FRESH, hasCompany: true });
assert(grouped.party, "company should reveal the party panel");

// ── Tier 1 is the master override: the core interface exists by then ─────────

const tierOne = resolveSystemVisibility({ ...FRESH, playerTier: 1 });
for (const system of [
  "combatLog", "bestiary", "progression", "inventory",
  "crafting", "map", "loadout", "materials", "passiveTree",
  "mastery", "abilities", "abilityDock",
] as const) {
  assert(tierOne[system], `tier 1 should have revealed '${system}' whatever the playstyle`);
}

// ── Nothing a character has used can be taken away ───────────────────────────
// The stranding guard: for each ownership signal, the matching destination must
// stay visible even with every other signal at zero.

const ownershipCases: Array<[string, Partial<SystemVisibilityInput>, keyof typeof fresh]> = [
  ["knows an ability", { knownAbilities: ["sweep"] }, "abilities"],
  ["has an ability equipped", { equippedAbilities: { techniques: ["sweep"], guards: [] } }, "abilities"],
  ["knows a stance", { knownStances: ["offensive-stance"] }, "stances"],
  ["knows a rite", { knownRites: ["rite-a"] }, "rites"],
  ["has unlocked recipes", { unlockedRecipes: ["iron-broadsword"] }, "materials"],
  ["has allocated passives", { passives: { "defense.evade": 1 } }, "passiveTree"],
  ["has an unspent skill point", { skillPoints: 1 }, "passiveTree"],
  ["has equipment on", { hasEquipment: true }, "inventory"],
  ["has quest progress", { questProgress: { "tier-0": 3 } }, "progression"],
  ["has global mastery", { globalMastery: 5 }, "mastery"],
];

for (const [description, signal, system] of ownershipCases) {
  const resolved = resolveSystemVisibility({ ...FRESH, ...signal });
  assert(
    resolved[system],
    `a character that ${description} must keep '${system}' visible (stranding guard)`,
  );
}

// An empty wallet must not hide materials from someone who has clearly used it.
const spentEverything = resolveSystemVisibility({
  ...FRESH,
  essences: { red: 0 },
  catalysts: {},
  unlockedRecipes: ["iron-broadsword"],
});
assert(
  spentEverything.materials,
  "spending every last essence must not hide the materials panel",
);

console.log("systemVisibility: ok");
