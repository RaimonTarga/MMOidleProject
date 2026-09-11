import { currentAbilityId, normalizeAttunedAbilities, validAbilityIds } from "./abilities";
import { NO_STANCE_ID, validStanceIds } from "./stances";
import { isRuneRuleCompatible, normalizeRuneLoadout, type EquippedRule } from "./runeDatabase";

/** The only reader of retired ability slot addressing. Never used by live combat. */
export function migrateAttunement(raw: {
  attunedAbilities?: unknown; equippedAbilities?: unknown;
  knownAbilities?: string[]; knownStances?: string[]; attunedStances?: string[];
  equippedStances?: { default?: string | null; reactive?: string | null };
  runesEquipped?: EquippedRule[];
}) {
  const knownAbilities = validAbilityIds(raw.knownAbilities ?? []);
  const knownStances = validStanceIds(raw.knownStances ?? []);
  const abilities = normalizeAttunedAbilities(raw.attunedAbilities ?? raw.equippedAbilities);
  const attunedAbilities = {
    techniques: abilities.techniques.filter(id => knownAbilities.includes(id)),
    guards: abilities.guards.filter(id => knownAbilities.includes(id)),
  };
  const legacy = raw.attunedStances === undefined;
  const defaults = raw.equippedStances?.default;
  const source = (raw.attunedAbilities ?? raw.equippedAbilities ?? {}) as { techniques?: unknown[]; guards?: unknown[]; technique?: unknown; guard?: unknown };
  const targetAt = (family: "technique" | "guard", index: number) => {
    const list = family === "technique" ? source.techniques : source.guards;
    const id = Array.isArray(list) ? list[index] : index === 0 ? source[family] : undefined;
    if (typeof id !== "string") return undefined;
    const current = currentAbilityId(id);
    return (family === "technique" ? attunedAbilities.techniques : attunedAbilities.guards).includes(current) ? current : undefined;
  };
  const bindings: Record<string, string | undefined> = {
    "fire-technique": targetAt("technique", 0), "fire-technique-2": targetAt("technique", 1),
    "fire-guard": targetAt("guard", 0), "fire-guard-2": targetAt("guard", 1),
  };
  const rules = (Array.isArray(raw.runesEquipped) ? raw.runesEquipped : []).flatMap(rule => {
    if (!rule || typeof rule.actionId !== "string") return [];
    if (Object.prototype.hasOwnProperty.call(bindings, rule.actionId)) {
      const targetAbilityId = bindings[rule.actionId];
      return targetAbilityId ? [{ conditionId: rule.conditionId, actionId: "use-ability", targetAbilityId }] : [];
    }
    if (rule.actionId === "use-ability" && typeof rule.targetAbilityId === "string") return [{ ...rule, targetAbilityId: currentAbilityId(rule.targetAbilityId) }];
    if (rule.actionId === "switch-stance" && !rule.targetStanceId && raw.equippedStances?.reactive) return [{ ...rule, targetStanceId: raw.equippedStances.reactive }];
    return [rule];
  });
  const attunedStances = validStanceIds(legacy ? [defaults, ...rules.filter(r => r.actionId === "switch-stance" && isRuneRuleCompatible(r)).map(r => r.targetStanceId)].filter((id): id is string => !!id && id !== NO_STANCE_ID) : raw.attunedStances ?? []).filter(id => knownStances.includes(id));
  const defaultStance = defaults && attunedStances.includes(defaults) ? defaults : null;
  return { knownAbilities, knownStances, attunedAbilities, attunedStances, equippedStances: { default: defaultStance }, activeStance: defaultStance, runesEquipped: normalizeRuneLoadout(rules) };
}
