import { ABILITY_DATABASE, migrateAttunement, sanitizeRuneLoadout, STARTER_RUNE_IDS, composeRuneEdit, deriveAutoConfigFromRunes, retiredAbilityEntries, hasRetiredAbilityEntries, RETIRED_ABILITY_IDS } from "./index";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const abilities = { techniques: ["sweep", "slam", "imbue-lightning"], guards: ["cleanse", "break-free", "second-wind"] };
const rules = [
  { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "sweep" },
  { conditionId: "before-empowered", actionId: "use-ability", targetAbilityId: "sweep" },
];
const owned = new Set(STARTER_RUNE_IDS);
// A rule naming the retired Switch Stance action is unknown now and is dropped.
const retiredStanceRule = { conditionId: "in-combat", actionId: "switch-stance" };
const sanitized = sanitizeRuneLoadout([...rules, { conditionId: "always", actionId: "use-ability", targetAbilityId: "snipe" }, retiredStanceRule], owned, undefined, new Set(Object.values(abilities).flat()));
assert(sanitized.length === rules.length, "unattuned targets and retired actions must be removed");
const legacy = {
 knownAbilities: ["sweep", "slam", "brace", "cleanse"],
 equippedAbilities: { techniques: ["sweep", "slam"], guards: ["brace", "cleanse"] },
 runesEquipped: [ { conditionId: "before-empowered", actionId: "fire-technique-2" }, { conditionId: "has-debuff", actionId: "fire-guard-2" } ],
};
const migrated = migrateAttunement(legacy);
assert(migrated.runesEquipped[0].targetAbilityId === "slam" && migrated.runesEquipped[1].targetAbilityId === "cleanse", "legacy slot-target migration");
assert(migrated.knownAbilities.includes("slam"), "learning survives migration");
assert(JSON.stringify(migrateAttunement(JSON.parse(JSON.stringify(migrated)))) === JSON.stringify(migrated), "migration round trip is not idempotent");
const holes = migrateAttunement({ ...legacy, equippedAbilities: { techniques: ["stale", "sweep"], guards: [] }, runesEquipped: [{ conditionId: "always", actionId: "fire-technique" }, { conditionId: "in-combat", actionId: "fire-technique-2" }] });
assert(holes.runesEquipped.length === 1 && holes.runesEquipped[0].targetAbilityId === "sweep", "orphan must not steal the next slot's target");
const other = { ...rules[0], targetAbilityId: "imbue-lightning" };
assert(composeRuneEdit([rules[0]], other, null).length === 2, "different abilities must retain independent same-condition rules");
const derived = deriveAutoConfigFromRunes([other, rules[0]], { hpPct: 1, inCombat: true, inParty: false, aggroCount: 1 });
assert(derived.abilityTargets.join() === "imbue-lightning,sweep", "Rune order must reach runtime arbitration");

// ── The abilities the ability pass CUT (design §22.2) ────────────────────────
// A save that knows, attunes or wires (`use-ability` with `targetAbilityId`) a
// cut ability drops those entries silently, and
// `retiredAbilityEntries` reports them so the load path can log one line per
// character. A renamed id that resolves to a cut one (heavy-strike ->
// expose-weakness) is reported as written and dropped the same way. A re-homed
// ability keeps its id, so nothing else migrates.
{
  assert(RETIRED_ABILITY_IDS.length === 5 && RETIRED_ABILITY_IDS.every((id) => !ABILITY_DATABASE.has(id)), "the five cut ids are gone from the roster");
  const save = {
    knownAbilities: ["sweep", "expose-weakness", "hamstring", "heavy-strike", "brace", "slam"],
    attunedAbilities: { techniques: ["sweep", "power-strike", "slam"], guards: ["brace"] },
    runesEquipped: [
      { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "sweep" },
      { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "frenzy" },
      { conditionId: "always", actionId: "use-ability", targetAbilityId: "quick-strike" },
      { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "slam" },
    ],
  };
  const found = retiredAbilityEntries(save);
  assert(hasRetiredAbilityEntries(found), "a save holding cut abilities must report them");
  assert(found.known.join() === "expose-weakness,hamstring,heavy-strike", `known: ${found.known.join()}`);
  assert(found.attuned.join() === "power-strike", `attuned: ${found.attuned.join()}`);
  assert(found.wired.join() === "frenzy,quick-strike", `wired: ${found.wired.join()}`);

  const out = migrateAttunement(save);
  assert(out.knownAbilities.join() === "sweep,brace,slam", `known after migration: ${out.knownAbilities.join()}`);
  assert(out.attunedAbilities.techniques.join() === "sweep,slam" && out.attunedAbilities.guards.join() === "brace",
    "attunement drops the cut Technique and keeps the rest in order");
  assert(out.runesEquipped.map((r) => r.targetAbilityId).join() === "sweep,slam",
    "rules wiring a cut ability go with it; the others keep their order");
  assert(!hasRetiredAbilityEntries(retiredAbilityEntries(out)), "the migrated save holds nothing cut");
  assert(JSON.stringify(migrateAttunement(JSON.parse(JSON.stringify(out)))) === JSON.stringify(out), "the cut-ability migration is idempotent");
  // A clean save reports nothing (the load path logs only characters that had any).
  assert(!hasRetiredAbilityEntries(retiredAbilityEntries({ knownAbilities: ["sweep"], attunedAbilities: { techniques: ["sweep"], guards: [] } })),
    "a save with no cut ability reports nothing");
}
console.log("attunement: ok");
