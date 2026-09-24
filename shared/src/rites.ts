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

/** Retained acquisition identity only; never an active/equippable Rite. */
export const RETIRED_RITE_IDS = new Set(["blood-offering"]);
const LEGACY_RITE_IDS: Record<string,string> = {
  "quickened-breath":"swift-repose", "cleansing-breath":"purification",
  "lingering-momentum":"lingering-battle", "hunters-instinct":"blood-offering",
};
export function migrateSavedRiteIds(ids: readonly string[] | undefined, preserveAcquisition = false): string[] {
  return [...new Set((ids ?? []).map(id => LEGACY_RITE_IDS[id] ?? id))]
    .filter(id => RITE_DATABASE.has(id) || (preserveAcquisition && RETIRED_RITE_IDS.has(id)));
}
