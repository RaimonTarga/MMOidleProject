import { ABILITY_DATABASE, STARTER_RUNE_IDS, isRuneRuleCompatible, referenceAbilityRule, runeRuleCost } from "./index";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

// Prices from before abilities lost their built-in triggers. Each ability's new
// price plus its reference wiring must equal what the ability alone used to cost.
const PRE_WIRING_COST: Record<string, number> = {
  sweep: 6, "second-wind": 6, cleanse: 3, brace: 5, "power-strike": 6, "expose-weakness": 7,
  hamstring: 4, "bramble-guard": 5, charge: 4, endure: 6, contagion: 7, slam: 6,
  "binding-strike": 4, "break-free": 3, frenzy: 6, "quick-strike": 5, detonate: 6,
  disengage: 3, recuperate: 6, snipe: 5, "stunning-strike": 6, "imbue-lightning": 6,
};

const starter = new Set(STARTER_RUNE_IDS);
for (const ability of ABILITY_DATABASE.values()) {
  const rule = referenceAbilityRule(ability.id);
  assert(rule, `${ability.id} needs reference wiring`);
  assert(isRuneRuleCompatible(rule), `${ability.id} reference wiring must be a legal rule`);
  assert(starter.has(rule.conditionId) && starter.has(rule.actionId), `${ability.id} reference wiring must use starter vocabulary`);
  const before = PRE_WIRING_COST[ability.id];
  assert(before !== undefined, `${ability.id} has no recorded pre-wiring price`);
  assert(ability.attunementCost + runeRuleCost(rule) === before,
    `${ability.id}: ${ability.attunementCost} RP + ${runeRuleCost(rule)} RP wiring must equal ${before} RP`);
  assert(ability.attunementCost >= 1, `${ability.id} must still reserve RP`);
  assert(!("trigger" in ability), `${ability.id} must not author a built-in trigger`);
}
console.log("abilityWiring: ok");
