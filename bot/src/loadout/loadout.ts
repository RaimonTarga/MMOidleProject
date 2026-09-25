import {
  ABILITY_DATABASE, STANCE_DATABASE, RITE_DATABASE, attunedAbilityIds,
  runicPointBreakdown, runeBudgetForGlobalMastery, sanitizeRuneLoadout, withReferenceAbilityWiring,
  type AttunedAbilities, type EquippedRule, type PlayerView,
} from "@mmo-idle/shared";

/** Full desired configuration. Empty lists explicitly remove a category. */
export interface DesiredBuild {
  abilities: AttunedAbilities;
  runeRules: EquippedRule[];
  stances: { attuned: string[]; default: string | null };
  rites: string[];
}

export type BuildFailureCode = "MALFORMED_BUILD" | "MISSING_UNLOCK" | "INSUFFICIENT_RP"
  | "GAME_REJECTION" | "STATE_SYNC_FAILURE" | "STALE_IMPLEMENTATION" | "ROUTE_LOGIC_FAILURE";
export interface BuildIssue { code: BuildFailureCode; reason: string }
export class BuildError extends Error {
  constructor(readonly code: BuildFailureCode, message: string, readonly detail: Record<string, unknown> = {}) {
    super(`${code}: ${message}`);
  }
}

export function observedBuild(self: PlayerView): DesiredBuild {
  return structuredClone({ abilities: self.attunedAbilities, runeRules: self.runesEquipped,
    stances: { attuned: self.attunedStances, default: self.equippedStances.default }, rites: self.equippedRites });
}

/** Fixed field order; array order is meaningful, object insertion order is not. */
export function buildKey(build: DesiredBuild): string {
  return JSON.stringify([build.abilities.techniques, build.abilities.guards,
    build.runeRules.map(r => [r.conditionId, r.actionId, r.targetAbilityId ?? null, r.targetStanceId ?? null]),
    build.stances.attuned, build.stances.default, build.rites]);
}

/** Priced as equipped: `applyBuild` adds reference wiring for unwired abilities. */
export function buildRP(build: DesiredBuild) {
  return runicPointBreakdown({ abilities: build.abilities,
    rules: withReferenceAbilityWiring(build.runeRules, build.abilities),
    stances: build.stances.attuned, rites: build.rites });
}

export function validateBuild(build: DesiredBuild, self: PlayerView): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const add = (code: BuildFailureCode, reason: string) => issues.push({ code, reason });
  const ids = (value: unknown): value is string[] => Array.isArray(value) && value.every(id => typeof id === "string");
  if (!build || !ids(build.abilities?.techniques) || !ids(build.abilities?.guards)
    || !ids(build.stances?.attuned) || !(build.stances.default === null || typeof build.stances.default === "string")
    || !ids(build.rites) || !Array.isArray(build.runeRules) || build.runeRules.some(r => !r || typeof r.conditionId !== "string" || typeof r.actionId !== "string")) {
    return [{ code: "MALFORMED_BUILD", reason: "Expected abilities, runeRules, stances and rites using the current schema." }];
  }
  for (const [family, values] of Object.entries(build.abilities)) {
    if (family !== "techniques" && family !== "guards") { add("MALFORMED_BUILD", `Unknown ability family ${family}`); continue; }
    if (new Set(values).size !== values.length) add("MALFORMED_BUILD", `Duplicate ${family}`);
    for (const id of values) {
      const def = ABILITY_DATABASE.get(id);
      if (!def || def.slot !== (family === "techniques" ? "technique" : "guard")) add("MALFORMED_BUILD", `Invalid ${family} ability ${id}`);
      else if (!self.knownAbilities.includes(id)) add("MISSING_UNLOCK", `Ability ${id} is not learned`);
    }
  }
  for (const [values, known, database, label] of [
    [build.stances.attuned, self.knownStances, STANCE_DATABASE, "stance"],
    [build.rites, self.knownRites, RITE_DATABASE, "rite"],
  ] as const) {
    if (new Set(values).size !== values.length) add("MALFORMED_BUILD", `Duplicate ${label}`);
    for (const id of values) {
      if (!database.has(id)) add("MALFORMED_BUILD", `Unknown ${label} ${id}`);
      else if (!known.includes(id)) add("MISSING_UNLOCK", `${label} ${id} is not learned`);
    }
  }
  if (build.stances.default !== null && !build.stances.attuned.includes(build.stances.default)) add("MALFORMED_BUILD", "Default stance must be attuned");
  for (const [index, rule] of build.runeRules.entries()) {
    if (!self.runesOwned.includes(rule.conditionId) || !self.runesOwned.includes(rule.actionId)) add("MISSING_UNLOCK", `Rune rule ${index} uses an unowned fragment`);
    const valid = sanitizeRuneLoadout([rule], new Set(self.runesOwned), Infinity, self.combatArchetype,
      new Set(build.stances.attuned), new Set(attunedAbilityIds(build.abilities)));
    if (valid.length !== 1 || buildKey({ ...build, runeRules: valid }) !== buildKey({ ...build, runeRules: [rule] })) {
      add("MALFORMED_BUILD", `Rune rule ${index} has invalid compatibility, target or obsolete schema`);
    }
  }
  const cost = buildRP(build).total;
  const budget = runeBudgetForGlobalMastery(self.globalMastery);
  if (cost > budget) add("INSUFFICIENT_RP", `Build costs ${cost} RP; budget is ${budget}`);
  return issues;
}
