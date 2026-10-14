import { isRetiredAbilityId, normalizeAttunedAbilities, validAbilityIds } from "./abilities";
import { normalizeRuneLoadout, type EquippedRule } from "./runeDatabase";

/**
 * What a save still holds for the abilities the ability pass CUT (design §22.2,
 * `RETIRED_ABILITY_IDS`): learned or attuned. `migrateAttunement` drops all of
 * it silently; the load
 * path reads this first so it can log one line per character that had any.
 * Ids are reported as the save spelled them (a renamed id that resolves to a cut
 * one, `heavy-strike`, is reported as written).
 */
export interface RetiredAbilityEntries {
  known: string[];
  attuned: string[];
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
  return {
    known: [...new Set((raw.knownAbilities ?? []).filter(retired))],
    attuned: [...new Set(attunedRaw.filter(retired))],
  };
}

/** True when {@link retiredAbilityEntries} found anything to drop. */
export function hasRetiredAbilityEntries(entries: RetiredAbilityEntries): boolean {
  return entries.known.length + entries.attuned.length > 0;
}

/** The only reader of retired ability slot addressing. Never used by live combat. */
export function migrateAttunement(raw: {
  attunedAbilities?: unknown; equippedAbilities?: unknown;
  knownAbilities?: string[];
  runesEquipped?: EquippedRule[];
}) {
  const knownAbilities = validAbilityIds(raw.knownAbilities ?? []);
  const abilities = normalizeAttunedAbilities(raw.attunedAbilities ?? raw.equippedAbilities);
  const attunedAbilities = {
    techniques: abilities.techniques.filter(id => knownAbilities.includes(id)),
    guards: abilities.guards.filter(id => knownAbilities.includes(id)),
  };
  // Rules naming the retired Use Ability and Fire Technique / Fire Guard
  // actions are unknown now; the load path's sanitize drops them.
  return {
    knownAbilities, attunedAbilities,
    runesEquipped: normalizeRuneLoadout(Array.isArray(raw.runesEquipped) ? raw.runesEquipped : []),
  };
}
