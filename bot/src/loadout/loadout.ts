/**
 * NOT USED BY THE HARNESS. The bot's loadout is Rune rules only (`./runes.ts`,
 * `./apply.ts`). This build validator (rune rules; abilities went with
 * class-first D3) is kept only because the server's bench imports
 * `validateBuild` from this path: `server/bench/balance/ttkSurveySpec.ts`
 * (whose `prepareSurveyBot` about twenty server tests call),
 * `server/bench/poolRaise.ts` and `server/bench/lineage/laneBot.ts`. It goes
 * with those systems, together with its server importers.
 */
import {
  sanitizeRuneLoadout,
  type EquippedRule, type PlayerView,
} from "@mmo-idle/shared";

/** Full desired configuration. An empty list explicitly removes every rule. */
export interface DesiredBuild {
  runeRules: EquippedRule[];
}

export type BuildFailureCode = "MALFORMED_BUILD" | "MISSING_UNLOCK"
  | "GAME_REJECTION" | "STATE_SYNC_FAILURE" | "STALE_IMPLEMENTATION" | "ROUTE_LOGIC_FAILURE";
export interface BuildIssue { code: BuildFailureCode; reason: string }
export class BuildError extends Error {
  constructor(readonly code: BuildFailureCode, message: string, readonly detail: Record<string, unknown> = {}) {
    super(`${code}: ${message}`);
  }
}

export function observedBuild(self: PlayerView): DesiredBuild {
  return structuredClone({ runeRules: self.runesEquipped });
}

/** Fixed field order; array order is meaningful, object insertion order is not. */
export function buildKey(build: DesiredBuild): string {
  return JSON.stringify(build.runeRules.map(r => [r.conditionId, r.actionId]));
}

export function validateBuild(build: DesiredBuild, self: PlayerView): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const add = (code: BuildFailureCode, reason: string) => issues.push({ code, reason });
  if (!build || !Array.isArray(build.runeRules)
    || build.runeRules.some(r => !r || typeof r.conditionId !== "string" || typeof r.actionId !== "string")) {
    return [{ code: "MALFORMED_BUILD", reason: "Expected runeRules using the current schema." }];
  }
  for (const [index, rule] of build.runeRules.entries()) {
    if (!self.runesOwned.includes(rule.conditionId) || !self.runesOwned.includes(rule.actionId)) add("MISSING_UNLOCK", `Rune rule ${index} uses an unowned fragment`);
    const valid = sanitizeRuneLoadout([rule], new Set(self.runesOwned), self.combatArchetype);
    if (valid.length !== 1 || buildKey({ ...build, runeRules: valid }) !== buildKey({ ...build, runeRules: [rule] })) {
      add("MALFORMED_BUILD", `Rune rule ${index} has invalid compatibility, target or obsolete schema`);
    }
  }
  return issues;
}
