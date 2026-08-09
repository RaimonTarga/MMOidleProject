import { runeLoadoutCost, type EquippedRule } from "./runeDatabase";
import { riteLoadoutCost } from "./rites";

export interface RunicPointLoadout {
  rules: readonly EquippedRule[];
  rites: readonly string[];
}

/** One authoritative total for Rune rules, stance destinations, and Rites. */
export function runicPointLoadoutCost(loadout: RunicPointLoadout): number {
  return runeLoadoutCost([...loadout.rules]) + riteLoadoutCost(loadout.rites);
}

export function runicPointLoadoutFits(loadout: RunicPointLoadout, budget: number): boolean {
  return runicPointLoadoutCost(loadout) <= Math.max(0, budget);
}
