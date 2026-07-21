import type {
  EquippedAbilities,
  EquippedStances,
} from "@mmo-idle/shared";

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
}

export interface SystemVisibility {
  mastery: boolean;
  abilities: boolean;
  stances: boolean;
  rites: boolean;
}

export function masteryIsVisible(
  playerTier: number,
  globalMastery: number,
): boolean {
  return playerTier >= 1 || globalMastery > 0;
}

/** Approved Phase 5 reveal gates with ownership fallbacks for migrated saves. */
export function resolveSystemVisibility(
  input: SystemVisibilityInput,
): SystemVisibility {
  return {
    mastery: masteryIsVisible(input.playerTier, input.globalMastery),
    abilities:
      input.playerTier >= 1 ||
      input.knownAbilities.length > 0 ||
      input.equippedAbilities.technique !== null ||
      input.equippedAbilities.guard !== null,
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
  };
}
