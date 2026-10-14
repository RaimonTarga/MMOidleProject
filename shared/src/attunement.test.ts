import { ABILITY_DATABASE, migrateAttunement, sanitizeRuneLoadout, STARTER_RUNE_IDS, retiredAbilityEntries, hasRetiredAbilityEntries, RETIRED_ABILITY_IDS } from "./index";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const owned = new Set(STARTER_RUNE_IDS);
// Rules naming the retired Switch Stance and Use Ability actions are unknown now and are dropped.
const retiredStanceRule = { conditionId: "in-combat", actionId: "switch-stance" };
const retiredUseAbilityRule = { conditionId: "in-combat", actionId: "use-ability" };
const kept = { conditionId: "in-combat", actionId: "chase-enemy" };
const sanitized = sanitizeRuneLoadout([kept, retiredUseAbilityRule, retiredStanceRule], owned, undefined);
assert(sanitized.length === 1 && sanitized[0].actionId === "chase-enemy", "retired actions must be removed");
const legacy = {
 knownAbilities: ["sweep", "slam", "brace", "cleanse"],
 equippedAbilities: { techniques: ["sweep", "slam"], guards: ["brace", "cleanse"] },
};
const migrated = migrateAttunement(legacy);
assert(migrated.knownAbilities.includes("slam"), "learning survives migration");
assert(migrated.attunedAbilities.techniques.join() === "sweep,slam", "legacy equipped abilities migrate to attuned");
assert(JSON.stringify(migrateAttunement(JSON.parse(JSON.stringify(migrated)))) === JSON.stringify(migrated), "migration round trip is not idempotent");

// ── The abilities the ability pass CUT (design §22.2) ────────────────────────
// A save that knows or attunes a cut ability drops those entries silently, and
// `retiredAbilityEntries` reports them so the load path can log one line per
// character. A renamed id that resolves to a cut one (heavy-strike ->
// expose-weakness) is reported as written and dropped the same way. A re-homed
// ability keeps its id, so nothing else migrates.
{
  assert(RETIRED_ABILITY_IDS.length === 5 && RETIRED_ABILITY_IDS.every((id) => !ABILITY_DATABASE.has(id)), "the five cut ids are gone from the roster");
  const save = {
    knownAbilities: ["sweep", "expose-weakness", "hamstring", "heavy-strike", "brace", "slam"],
    attunedAbilities: { techniques: ["sweep", "power-strike", "slam"], guards: ["brace"] },
  };
  const found = retiredAbilityEntries(save);
  assert(hasRetiredAbilityEntries(found), "a save holding cut abilities must report them");
  assert(found.known.join() === "expose-weakness,hamstring,heavy-strike", `known: ${found.known.join()}`);
  assert(found.attuned.join() === "power-strike", `attuned: ${found.attuned.join()}`);

  const out = migrateAttunement(save);
  assert(out.knownAbilities.join() === "sweep,brace,slam", `known after migration: ${out.knownAbilities.join()}`);
  assert(out.attunedAbilities.techniques.join() === "sweep,slam" && out.attunedAbilities.guards.join() === "brace",
    "attunement drops the cut Technique and keeps the rest in order");
  assert(!hasRetiredAbilityEntries(retiredAbilityEntries(out)), "the migrated save holds nothing cut");
  assert(JSON.stringify(migrateAttunement(JSON.parse(JSON.stringify(out)))) === JSON.stringify(out), "the cut-ability migration is idempotent");
  // A clean save reports nothing (the load path logs only characters that had any).
  assert(!hasRetiredAbilityEntries(retiredAbilityEntries({ knownAbilities: ["sweep"], attunedAbilities: { techniques: ["sweep"], guards: [] } })),
    "a save with no cut ability reports nothing");
}
console.log("attunement: ok");
