import { runeLoadoutCost, type EquippedRule } from "./runeDatabase";
import { riteLoadoutCost } from "./rites";
import { ABILITY_DATABASE, emptyAttunedAbilities, type AttunedAbilities } from "./abilities";
import { stanceDef } from "./stances";

export interface RunicPointLoadout {
  rules: readonly EquippedRule[];
  abilities: AttunedAbilities;
  stances: readonly string[];
  rites: readonly string[];
}
export function attunedAbilityIds(abilities: AttunedAbilities): string[] {
  return [...new Set([...abilities.techniques, ...abilities.guards])];
}
export function runicPointBreakdown(loadout: RunicPointLoadout) {
  const abilities = attunedAbilityIds(loadout.abilities).reduce((n, id) => n + (ABILITY_DATABASE.get(id)?.attunementCost ?? 0), 0);
  const stances = [...new Set(loadout.stances)].reduce((n, id) => n + (stanceDef(id)?.runeCost ?? 0), 0);
  const logic = runeLoadoutCost([...loadout.rules]);
  const rites = riteLoadoutCost(loadout.rites);
  return { abilities, stances, logic, rites, total: abilities + stances + logic + rites };
}
/** Authoritative shared reservation across all four active build categories. */
export function runicPointLoadoutCost(loadout: RunicPointLoadout): number {
  return runicPointBreakdown(loadout).total;
}
export function runicPointLoadoutFits(loadout: RunicPointLoadout, budget: number): boolean {
  return runicPointLoadoutCost(loadout) <= Math.max(0, budget);
}
/** Project progression into the single cost contract. */
export function runicLoadoutFromProgression(prog: {
  runesEquipped?: EquippedRule[]; attunedAbilities?: AttunedAbilities;
  attunedStances?: string[]; equippedRites?: string[];
}): RunicPointLoadout {
  return { rules: prog.runesEquipped ?? [], abilities: prog.attunedAbilities ?? emptyAttunedAbilities(), stances: prog.attunedStances ?? [], rites: prog.equippedRites ?? [] };
}
/** Preserved over-budget saves remain usable, but edits may only reduce their cost. */
export function runicPointEditAllowed(previous: RunicPointLoadout, next: RunicPointLoadout, budget: number): boolean {
  const cost = runicPointLoadoutCost(next);
  return cost <= budget || cost < runicPointLoadoutCost(previous);
}
