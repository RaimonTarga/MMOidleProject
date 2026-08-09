/** Rites are passive combat-boundary rules paid from the shared Runic Point pool. */
export interface RiteDef {
  id: string;
  name: string;
  blurb: string;
  runeCost: number;
  icon?: string;
}

export type EquippedRites = string[];

export function emptyEquippedRites(): EquippedRites {
  return [];
}

const rites: RiteDef[] = [
  {
    id: "lingering-battle",
    name: "Lingering Battle",
    blurb: "Remain in the post-combat state 50% longer, preserving combat continuity.",
    runeCost: 2,
    icon: "lingering-battle",
  },
  {
    id: "swift-repose",
    name: "Swift Repose",
    blurb: "Reach out-of-combat recovery 50% sooner after hostile contact ends.",
    runeCost: 2,
    icon: "swift-repose",
  },
  {
    id: "purification",
    name: "Purification",
    blurb: "When combat ends, remove all qualifying harmful effects and player DoTs.",
    runeCost: 3,
    icon: "purification",
  },
  {
    id: "mechanic-renewal",
    name: "Mechanic Renewal",
    blurb: "When combat ends, partially prepare your class mechanic for the next fight.",
    runeCost: 5,
    icon: "mechanic-renewal",
  },
  {
    id: "ability-reprieve",
    name: "Ability Reprieve",
    blurb: "When combat ends, reduce every equipped ability's remaining cooldown by 30%.",
    runeCost: 5,
    icon: "ability-reprieve",
  },
  {
    id: "blood-offering",
    name: "Blood Offering",
    blurb: "Recover 5% of maximum health whenever you receive kill credit.",
    runeCost: 3,
    icon: "blood-offering",
  },
];

export const RITE_DATABASE = new Map<string, RiteDef>(rites.map((r) => [r.id, r]));

export function riteDef(id: string | null | undefined): RiteDef | undefined {
  return id ? RITE_DATABASE.get(id) : undefined;
}

export function validRiteIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => RITE_DATABASE.has(id)))];
}

export function riteLoadoutCost(ids: readonly string[]): number {
  return validRiteIds(ids).reduce((sum, id) => sum + (RITE_DATABASE.get(id)?.runeCost ?? 0), 0);
}
