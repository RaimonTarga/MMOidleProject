import { ABILITY_DATABASE, STANCE_DATABASE, NO_STANCE_ID, migrateAttunement, runeBudgetForGlobalMastery, runeRuleCost, runicPointLoadoutCost, runicPointBreakdown, runicPointEditAllowed, sanitizeRuneLoadout, STARTER_RUNE_IDS, composeRuneEdit, deriveAutoConfigFromRunes } from "./index";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const abilities = { techniques: ["sweep", "power-strike", "frenzy"], guards: ["cleanse", "break-free", "second-wind"] };
const stances = ["offensive-stance", "tanking-stance"];
const rules = [
  { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "sweep" },
  { conditionId: "before-empowered", actionId: "use-ability", targetAbilityId: "sweep" },
  { conditionId: "hp-below-25", actionId: "switch-stance", targetStanceId: stances[1] },
  { conditionId: "in-combat", actionId: "switch-stance", targetStanceId: stances[0] },
];
const loadout = { abilities, stances, rules, rites: [] };
const parts = runicPointBreakdown(loadout);
assert(parts.total === parts.abilities + parts.stances + parts.logic + parts.rites, "combined cost disagrees with breakdown");
assert(parts.abilities === Object.values(abilities).flat().reduce((n,id) => n + ABILITY_DATABASE.get(id)!.attunementCost, 0), "ability reservation missing");
assert(parts.stances === stances.reduce((n,id) => n + STANCE_DATABASE.get(id)!.runeCost, 0), "stance reservation missing");
assert(runicPointLoadoutCost({ ...loadout, abilities: { techniques: [...abilities.techniques, "sweep"], guards: abilities.guards }, stances: [...stances, stances[0]] }) === parts.total, "duplicates double-charge");
assert(runeRuleCost(rules[2]) === runeRuleCost({ ...rules[2], targetStanceId: NO_STANCE_ID }), "stance destination recharged by rule");
assert(runeBudgetForGlobalMastery(0) === 16 && runeBudgetForGlobalMastery(4) === 16 && runeBudgetForGlobalMastery(5) === 17, "GM progression seed");
assert(ABILITY_DATABASE.get("cleanse")!.attunementCost < ABILITY_DATABASE.get("second-wind")!.attunementCost, "conditional tool price");
const owned = new Set(STARTER_RUNE_IDS);
const sanitized = sanitizeRuneLoadout([...rules, { conditionId: "always", actionId: "use-ability", targetAbilityId: "snipe" }, { conditionId: "always", actionId: "switch-stance", targetStanceId: "perfection-stance" }], owned, Infinity, undefined, new Set(stances), new Set(Object.values(abilities).flat()));
assert(sanitized.length === rules.length, "unattuned targets must be removed");
const legacy = {
 knownAbilities: ["sweep", "heavy-strike", "brace", "cleanse"], knownStances: stances,
 equippedAbilities: { techniques: ["sweep", "heavy-strike"], guards: ["brace", "cleanse"] },
 equippedStances: { default: stances[0] },
 runesEquipped: [ { conditionId: "before-empowered", actionId: "fire-technique-2" }, { conditionId: "has-debuff", actionId: "fire-guard-2" }, rules[2] ],
};
const migrated = migrateAttunement(legacy);
assert(migrated.runesEquipped[0].targetAbilityId === "expose-weakness" && migrated.runesEquipped[1].targetAbilityId === "cleanse", "legacy target/rename migration");
assert(migrated.attunedStances.length === 2 && migrated.equippedStances.default === stances[0], "default and automated stances migrate");
assert(migrated.knownAbilities.includes("expose-weakness"), "learning survives rename");
assert(JSON.stringify(migrateAttunement(JSON.parse(JSON.stringify(migrated)))) === JSON.stringify(migrated), "migration round trip is not idempotent");
const holes = migrateAttunement({ ...legacy, equippedAbilities: { techniques: ["stale", "sweep"], guards: [] }, runesEquipped: [{ conditionId: "always", actionId: "fire-technique" }, { conditionId: "in-combat", actionId: "fire-technique-2" }] });
assert(holes.runesEquipped.length === 1 && holes.runesEquipped[0].targetAbilityId === "sweep", "orphan must not steal the next slot's target");
const noAttunement = migrateAttunement({ ...migrated, attunedStances: [], equippedStances: { default: stances[0] } });
assert(noAttunement.equippedStances.default === null, "default requires attunement");
assert(runicPointEditAllowed(loadout, { ...loadout, rules: rules.slice(1) }, 1), "over-budget saves must permit incremental repair");
assert(!runicPointEditAllowed(loadout, { ...loadout, rules: [...rules, rules[0]] }, 1), "over-budget edit added cost");
const other = { ...rules[0], targetAbilityId: "frenzy" };
assert(composeRuneEdit([rules[0]], other, null).length === 2, "different abilities must retain independent same-condition rules");
const derived = deriveAutoConfigFromRunes([other, rules[0]], { hpPct: 1, inCombat: true, inParty: false, aggroCount: 1 });
assert(derived.abilityTargets.join() === "frenzy,sweep", "Rune order must reach runtime arbitration");
console.log("attunement: ok");
