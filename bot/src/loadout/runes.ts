import { isRuneRuleCompatibleForArchetype, type EquippedRule, type PlayerView } from "@mmo-idle/shared";

/**
 * The harness's loadout: Rune rules only. Runes are free universal standing
 * orders (Flee, Recover First, Avoid Hazards, Keep Distance, focus, travel), so
 * a requested loadout is checked for shape, ownership and class compatibility,
 * and nothing is priced.
 */

export type BuildFailureCode = "MALFORMED_BUILD" | "MISSING_UNLOCK"
  | "GAME_REJECTION" | "STATE_SYNC_FAILURE" | "STALE_IMPLEMENTATION" | "ROUTE_LOGIC_FAILURE";
export interface BuildIssue { code: BuildFailureCode; reason: string }
export class BuildError extends Error {
  constructor(readonly code: BuildFailureCode, message: string, readonly detail: Record<string, unknown> = {}) {
    super(`${code}: ${message}`);
  }
}

/** One rule's identity: every field it carries, in a fixed key order. */
export function runeRuleKey(rule: EquippedRule): string {
  const fields = rule as unknown as Record<string, unknown>;
  return JSON.stringify(Object.keys(fields).sort().filter((key) => fields[key] !== undefined)
    .map((key) => [key, fields[key]]));
}

/**
 * A whole loadout's identity. Order is behavior: the first active rule claims
 * its channel, so the same rules in another order are another loadout.
 */
export function runeLoadoutKey(rules: readonly EquippedRule[]): string {
  return JSON.stringify(rules.map(runeRuleKey));
}

export function validateRuneLoadout(rules: EquippedRule[], self: PlayerView): BuildIssue[] {
  if (!Array.isArray(rules) || rules.some((r) => !r || typeof r.conditionId !== "string" || typeof r.actionId !== "string")) {
    return [{ code: "MALFORMED_BUILD", reason: "Expected an ordered list of { conditionId, actionId } Rune rules." }];
  }
  const issues: BuildIssue[] = [];
  const owned = new Set(self.runesOwned);
  for (const [index, rule] of rules.entries()) {
    if (!owned.has(rule.conditionId) || !owned.has(rule.actionId)) {
      issues.push({ code: "MISSING_UNLOCK", reason: `Rune rule ${index} uses an unowned fragment` });
    }
    if (!isRuneRuleCompatibleForArchetype(rule, self.combatArchetype)) {
      issues.push({ code: "MALFORMED_BUILD", reason: `Rune rule ${index} is unknown or does not fit ${self.combatArchetype ?? "a classless character"}` });
    }
  }
  return issues;
}
