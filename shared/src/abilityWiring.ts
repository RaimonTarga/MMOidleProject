/**
 * Reference Rune wiring for every ability.
 *
 * Abilities carry no built-in trigger: they auto-fire only through a
 * `use-ability` rule. Each ability's `attunementCost` was lowered by exactly the
 * RP of the rule listed here, so "ability + reference rule" reserves what the
 * ability alone used to — the price of the old default did not change, it moved
 * into the Rune board where the player can see and replace it.
 *
 * This is the COST BASIS and a harness convenience (benches, bots and tests use
 * it to keep measuring the old timing). It is not a default the server applies.
 *
 * It is also the rule the ability panel's "Use default timing" button equips.
 * It is a sensible default, not always a copy of the old trigger: HP-threshold
 * Guards (Brace 50%, Second Wind 60%, Endure/Recuperate 70%) simply fire in
 * combat off cooldown. Charge maps to `Always`, which reproduces it exactly once
 * its gap gate applies (see `abilities.ts`).
 */
import { ABILITY_DATABASE, type AttunedAbilities } from "./abilities";
import type { EquippedRule, RuneConditionId } from "./runeDatabase";
import { attunedAbilityIds } from "./runicPoints";

const REFERENCE_CONDITION: Record<string, RuneConditionId> = {
  sweep: "in-combat",
  "power-strike": "in-combat",
  "expose-weakness": "in-combat",
  hamstring: "in-combat",
  contagion: "in-combat",
  slam: "in-combat",
  "binding-strike": "in-combat",
  frenzy: "in-combat",
  "quick-strike": "in-combat",
  detonate: "in-combat",
  snipe: "in-combat",
  "stunning-strike": "in-combat",
  "imbue-lightning": "in-combat",
  // Charge fired on a spatial trigger that never required combat (it can open a
  // fight). Its gap gate supplies "a target worth closing on", so Always
  // reproduces it: it charges the next enemy as soon as one is in charge range.
  charge: "always",
  disengage: "enemy-contact",
  // HP-threshold Guards default to firing off cooldown in combat — a simple
  // starting point, not a copy of their old 50-70% thresholds.
  "second-wind": "in-combat",
  brace: "in-combat",
  endure: "in-combat",
  recuperate: "in-combat",
  cleanse: "has-debuff",
  "bramble-guard": "n-aggro-3",
  "break-free": "controlled",
};

/** The Rune rule that reproduces this ability's retired default timing. */
export function referenceAbilityRule(abilityId: string): EquippedRule | undefined {
  const conditionId = REFERENCE_CONDITION[abilityId];
  return conditionId && ABILITY_DATABASE.has(abilityId)
    ? { conditionId, actionId: "use-ability", targetAbilityId: abilityId }
    : undefined;
}

/** Reference rules for an attuned loadout, in attunement order. */
export function referenceAbilityRules(abilities: AttunedAbilities): EquippedRule[] {
  return attunedAbilityIds(abilities).flatMap((id) => {
    const rule = referenceAbilityRule(id);
    return rule ? [rule] : [];
  });
}

/**
 * `rules` plus reference wiring for every attuned ability no rule already names,
 * appended after the explicit rules in attunement order — the arbitration order
 * the retired defaults had. For harnesses that measure the pre-wiring timing.
 */
export function withReferenceAbilityWiring(
  rules: readonly EquippedRule[],
  abilities: AttunedAbilities,
): EquippedRule[] {
  const wired = new Set(rules.flatMap((rule) =>
    rule.actionId === "use-ability" && rule.targetAbilityId ? [rule.targetAbilityId] : []));
  return [...rules, ...referenceAbilityRules(abilities).filter((rule) => !wired.has(rule.targetAbilityId!))];
}
