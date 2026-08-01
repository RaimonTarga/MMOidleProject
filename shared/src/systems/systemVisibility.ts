import type { EquippedAbilities } from "../abilities";
import type { EquippedStances } from "../stances";
import type { EssenceType } from "../items";

/**
 * Pure visibility policy over authoritative progression state. Keeping this in
 * shared lets every client surface use one tested unlock schedule.
 */
export interface SystemVisibilityInput {
  playerTier: number;
  globalMastery: number;
  knownAbilities: readonly string[];
  equippedAbilities: EquippedAbilities;
  knownStances: readonly string[];
  equippedStances: EquippedStances;
  activeStance: string | null;
  knownRites: readonly string[];
  equippedRites: readonly string[];
  essences?: Partial<Record<EssenceType, number>>;
  catalysts?: Record<string, number>;
  catalystProgress?: Record<string, number>;
  unlockedRecipes?: readonly string[];
  runeRecipesCrafted?: readonly string[];
  /** Nodes entered through a world transition; Map unlocks on first travel. */
  visitedNodes?: readonly string[];
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
  stances: boolean;
  rites: boolean;
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
  /** Map reveals after the first world-gate crossing. */
  map: boolean;
  /** Loadout reveals when there is something to arrange. */
  loadout: boolean;
  /** Ability dock shares the crafted-ability gate. */
  abilityDock: boolean;
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
 * Explicit milestones (Map, Crafting, Mastery, Abilities) do not use the old
 * player-tier master override.
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
    anyPositive(input.catalysts) ||
    anyPositive(input.catalystProgress) ||
    (input.unlockedRecipes?.length ?? 0) > 0 ||
    input.globalMastery > 0 ||
    input.playerTier >= 1;

  const abilities =
    input.knownAbilities.length > 0 ||
    input.equippedAbilities.techniques.length > 0 ||
    input.equippedAbilities.guards.length > 0;

  const hasCraftingEssence = Object.values(input.essences ?? {})
    .some((amount) => amount >= 4);
  const hasCraftedSomething =
    (input.inventory?.length ?? 0) > 0 ||
    input.hasEquipment === true ||
    input.knownAbilities.length > 0 ||
    input.knownStances.length > 0 ||
    input.knownRites.length > 0 ||
    (input.runeRecipesCrafted?.length ?? 0) > 0;

  return {
    combatLog: hasFought,
    bestiary: hasFought,
    progression: true,
    inventory:
      (input.inventory?.length ?? 0) > 0 ||
      input.hasEquipment === true ||
      input.playerTier >= 1,
    crafting: hasCraftingEssence || hasCraftedSomething,
    map: (input.visitedNodes?.length ?? 0) > 0,
    loadout:
      abilities ||
      (input.runesOwned?.length ?? 0) > 0 ||
      input.playerTier >= 1,
    abilityDock: abilities,
    mastery: masteryIsVisible(input.globalMastery),
    abilities,
    stances:
      input.playerTier >= 2 ||
      input.knownStances.length > 0 ||
      input.equippedStances.default !== null ||
      input.equippedStances.reactive !== null ||
      input.activeStance !== null,
    rites:
      input.playerTier >= 3 ||
      input.knownRites.length > 0 ||
      input.equippedRites.length > 0,
    materials,
    passiveTree:
      (input.skillPoints ?? 0) > 0 ||
      anyPositive(input.passives) ||
      input.playerTier >= 1,
    party: true,
  };
}
