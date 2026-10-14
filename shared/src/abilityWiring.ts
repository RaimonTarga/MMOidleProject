/**
 * Reference Rune wiring for every ability.
 *
 * Abilities carry no built-in trigger: they auto-fire only through a
 * `use-ability` rule; the rule listed here reproduces the ability's old default
 * timing on the Rune board, where the player can see and replace it.
 *
 * This is a harness convenience (benches, bots and tests use it to keep
 * measuring the old timing). It is not a default the server applies.
 *
 * It is also the rule the ability panel's "Use default timing" button equips.
 * It is a sensible default, not always a copy of the old trigger: HP-threshold
 * Guards (Brace 50%, Second Wind 60%, Endure/Recuperate 70%) simply fire in
 * combat off cooldown. Charge maps to `Always`, which reproduces it exactly once
 * its gap gate applies (see `abilities.ts`).
 */
import { ABILITY_DATABASE, attunedAbilityIds, type AttunedAbilities } from "./abilities";
import type { EquippedRule, RuneConditionId } from "./runeDatabase";

const REFERENCE_CONDITION: Record<string, RuneConditionId> = {
  sweep: "in-combat",
  contagion: "in-combat",
  slam: "in-combat",
  "binding-strike": "in-combat",
  detonate: "in-combat",
  snipe: "in-combat",
  "stunning-strike": "in-combat",
  "imbue-lightning": "in-combat",
  // The ability pass's two additions (design §22.8), priced net of these rules
  // like every other ability.
  cull: "in-combat",
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
  // Sidestep's situational gate (nothing in reach, no fire) keeps In Combat from
  // spending it on an empty field.
  sidestep: "in-combat",
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
