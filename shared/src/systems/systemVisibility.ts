import type { AttunedAbilities } from "../abilities";
import type { EssenceType } from "../items";

/**
 * Pure visibility policy over authoritative progression state. Keeping this in
 * shared lets every client surface use one tested unlock schedule.
 */
export interface SystemVisibilityInput {
  playerTier: number;
  globalMastery: number;
  knownAbilities: readonly string[];
  attunedAbilities: AttunedAbilities;
  essences?: Partial<Record<EssenceType, number>>;
  unlockedRecipes?: readonly string[];
  skillPoints?: number;
  passives?: Record<string, number>;
  biomeXP?: Record<string, number>;
  biomeLevel?: Record<string, number>;
  questProgress?: Record<string, number>;
  inventory?: readonly string[];
  hasEquipment?: boolean;
  runesOwned?: readonly string[];
}

export interface SystemVisibility {
  mastery: boolean;
  abilities: boolean;
  /** Materials reveal when the player first receives economy currency. */
  materials: boolean;
  /** Passive Tree reveals on its first point or an existing allocation. */
  passiveTree: boolean;
  /** Always visible so a solo player has the controls needed to join a party. */
  party: boolean;
  /** Combat Log and Bestiary reveal on first blood. */
  combatLog: boolean;
  bestiary: boolean;
  /** Tier quest/progression exists from the beginning. */
  progression: boolean;
  /** Inventory reveals with the first owned or equipped item. */
  inventory: boolean;
  /** Crafting reveals at the minimum payable essence balance: four of one type. */
  crafting: boolean;
  /** Map is a baseline UI feature, present from the beginning like Progression and Party. */
  map: boolean;
  /** Loadout reveals when there is something to arrange. */
  loadout: boolean;
}

function anyPositive(values: Record<string, number> | undefined): boolean {
  if (!values) return false;
  for (const value of Object.values(values)) if (value > 0) return true;
  return false;
}

export function masteryIsVisible(globalMastery: number): boolean {
  return globalMastery >= 1;
}

/**
 * Ownership fallbacks keep an already-used destination from disappearing.
 * Explicit milestones (Crafting, Mastery, Abilities) do not use the old
 * player-tier master override. Map is a baseline feature, not a milestone.
 */
export function resolveSystemVisibility(
  input: SystemVisibilityInput,
): SystemVisibility {
  const hasFought =
    anyPositive(input.biomeXP) ||
    anyPositive(input.questProgress) ||
    anyPositive(input.biomeLevel) ||
    input.playerTier >= 1;

  const materials =
    anyPositive(input.essences as Record<string, number> | undefined) ||
    (input.unlockedRecipes?.length ?? 0) > 0 ||
    input.globalMastery > 0 ||
    input.playerTier >= 1;

  const abilities =
    input.knownAbilities.length > 0 ||
    input.attunedAbilities.techniques.length > 0 ||
    input.attunedAbilities.guards.length > 0;

  const hasCraftingEssence = Object.values(input.essences ?? {})
    .some((amount) => amount >= 4);
  const hasCraftedSomething =
    (input.inventory?.length ?? 0) > 0 ||
    input.hasEquipment === true ||
    input.knownAbilities.length > 0;

  return {
    combatLog: hasFought,
    bestiary: hasFought,
    progression: true,
    inventory:
      (input.inventory?.length ?? 0) > 0 ||
      input.hasEquipment === true ||
      input.playerTier >= 1,
    crafting: hasCraftingEssence || hasCraftedSomething,
    map: true,
    loadout:
      abilities ||
      (input.runesOwned?.length ?? 0) > 0 ||
      input.playerTier >= 1,
    mastery: masteryIsVisible(input.globalMastery),
    abilities,
    materials,
    passiveTree:
      (input.skillPoints ?? 0) > 0 ||
      anyPositive(input.passives) ||
      input.playerTier >= 1,
    party: true,
  };
}
