import { currentAbilityId, isRetiredAbilityId, normalizeAttunedAbilities, validAbilityIds } from "./abilities";
import { NO_STANCE_ID, validStanceIds } from "./stances";
import { isRuneRuleCompatible, normalizeRuneLoadout, type EquippedRule } from "./runeDatabase";

/**
 * What a save still holds for the abilities the ability pass CUT (design §22.2,
 * `RETIRED_ABILITY_IDS`): learned, attuned, or wired by a `use-ability` Rune
 * rule. `migrateAttunement` drops all of it silently; the load
 * path reads this first so it can log one line per character that had any.
 * Ids are reported as the save spelled them (a renamed id that resolves to a cut
 * one, `heavy-strike`, is reported as written).
 */
export interface RetiredAbilityEntries {
  known: string[];
  attuned: string[];
  wired: string[];
}

export function retiredAbilityEntries(raw: {
  attunedAbilities?: unknown; equippedAbilities?: unknown;
  knownAbilities?: string[];
  runesEquipped?: EquippedRule[];
}): RetiredAbilityEntries {
  const retired = (id: unknown): id is string => typeof id === "string" && isRetiredAbilityId(id);
  const source = (raw.attunedAbilities ?? raw.equippedAbilities ?? {}) as {
    techniques?: unknown[]; guards?: unknown[]; technique?: unknown; guard?: unknown;
  };
  const attunedRaw = [
    ...(Array.isArray(source.techniques) ? source.techniques : [source.technique]),
    ...(Array.isArray(source.guards) ? source.guards : [source.guard]),
  ];
  const rules = Array.isArray(raw.runesEquipped) ? raw.runesEquipped : [];
  return {
    known: [...new Set((raw.knownAbilities ?? []).filter(retired))],
    attuned: [...new Set(attunedRaw.filter(retired))],
    wired: [...new Set(rules.flatMap((rule) =>
      rule?.actionId === "use-ability" && retired(rule.targetAbilityId) ? [rule.targetAbilityId] : []))],
  };
}

/** True when {@link retiredAbilityEntries} found anything to drop. */
export function hasRetiredAbilityEntries(entries: RetiredAbilityEntries): boolean {
  return entries.known.length + entries.attuned.length + entries.wired.length > 0;
}

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
    if (rule.actionId === "use-ability" && typeof rule.targetAbilityId === "string") {
      // A rule wiring a CUT ability goes with the ability (design §22.2).
      if (isRetiredAbilityId(rule.targetAbilityId)) return [];
      return [{ ...rule, targetAbilityId: currentAbilityId(rule.targetAbilityId) }];
    }
    if (rule.actionId === "switch-stance" && !rule.targetStanceId && raw.equippedStances?.reactive) return [{ ...rule, targetStanceId: raw.equippedStances.reactive }];
    return [rule];
  });
  const attunedStances = validStanceIds(legacy ? [defaults, ...rules.filter(r => r.actionId === "switch-stance" && isRuneRuleCompatible(r)).map(r => r.targetStanceId)].filter((id): id is string => !!id && id !== NO_STANCE_ID) : raw.attunedStances ?? []).filter(id => knownStances.includes(id));
  const defaultStance = defaults && attunedStances.includes(defaults) ? defaults : null;
  return {
    knownAbilities, knownStances, attunedAbilities, attunedStances,
    equippedStances: { default: defaultStance }, activeStance: defaultStance,
    runesEquipped: normalizeRuneLoadout(rules),
  };
}
