import type { EquippedAbilities } from "../abilities";
import type { EquippedStances } from "../stances";
import type { EssenceType } from "../items";

/**
 * Lives in shared because it is pure policy over authoritative progression
 * state — no React, no DOM, no atoms. That also lets it be tested directly by
 * the repo's test runner, which only discovers shared/ and server/ suites.
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
  /** Economy wallets and progression, for the elements gated on first use. */
  essences?: Partial<Record<EssenceType, number>>;
  catalysts?: Record<string, number>;
  catalystProgress?: Record<string, number>;
  unlockedRecipes?: readonly string[];
  skillPoints?: number;
  /** Allocated passives; a non-empty record means the tree has been used. */
  passives?: Record<string, number>;
  /** True while grouped, or while another player shares the node. */
  hasCompany?: boolean;
  /**
   * Biome XP earned. This is the durable proxy for "has killed something":
   * §16 wants first-blood triggers, and there is no persisted kill counter, but
   * biome XP only ever accrues from kills and is saved with progression. An
   * in-memory "saw a kill this session" flag would be exactly the incidental
   * client state §16 forbids.
   */
  biomeXP?: Record<string, number>;
  biomeLevel?: Record<string, number>;
  questProgress?: Record<string, number>;
  /** Item ownership, for the Inventory reveal. */
  inventory?: readonly string[];
  hasEquipment?: boolean;
  /** Runes owned, one half of the Loadout reveal. */
  runesOwned?: readonly string[];
}

export interface SystemVisibility {
  mastery: boolean;
  abilities: boolean;
  stances: boolean;
  rites: boolean;
  /** The Materials rail panel — revealed by the first essence or catalyst. */
  materials: boolean;
  /** Passive Tree navigation — revealed by the first skill point. */
  passiveTree: boolean;
  /** Party panel — revealed when grouping first becomes possible. */
  party: boolean;

  // ── Staged arc (§16). A fresh character boots to Character, Auto Combat and
  // Settings; everything below assembles on its first authoritative trigger.
  /** Combat Log, Bestiary and Progression all reveal on first blood. */
  combatLog: boolean;
  bestiary: boolean;
  progression: boolean;
  /** Inventory — the first item owned. */
  inventory: boolean;
  /** Crafting — reuses the Materials gate rather than inventing a second one. */
  crafting: boolean;
  /** World map and the biome XP overlay — the first biome level. */
  map: boolean;
  /** Loadout — the first thing there is to arrange. */
  loadout: boolean;
  /** The ability dock; an empty dock before this is noise. */
  abilityDock: boolean;
}

function anyPositive(values: Record<string, number> | undefined): boolean {
  if (!values) return false;
  for (const value of Object.values(values)) if (value > 0) return true;
  return false;
}

export function masteryIsVisible(
  playerTier: number,
  globalMastery: number,
): boolean {
  return playerTier >= 1 || globalMastery > 0;
}

/**
 * Every gate keeps an ownership override, so no migrated save can lose a
 * destination it has already used. `playerTier >= 1` acts as a master override
 * on the early gates: whatever the playstyle, the core interface exists in full
 * by the first tier-up.
 */
export function resolveSystemVisibility(
  input: SystemVisibilityInput,
): SystemVisibility {
  // First blood. Biome XP and quest progress are both kill-derived and durable.
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
    input.playerTier >= 1 ||
    input.knownAbilities.length > 0 ||
    input.equippedAbilities.techniques.length > 0 ||
    input.equippedAbilities.guards.length > 0;

  return {
    combatLog: hasFought,
    bestiary: hasFought,
    progression: hasFought,
    inventory:
      (input.inventory?.length ?? 0) > 0 ||
      input.hasEquipment === true ||
      input.playerTier >= 1,
    crafting: materials,
    map: anyPositive(input.biomeLevel) || anyPositive(input.biomeXP) || input.playerTier >= 1,
    loadout:
      abilities ||
      (input.runesOwned?.length ?? 0) > 0 ||
      input.playerTier >= 1,
    abilityDock: abilities,
    mastery: masteryIsVisible(input.playerTier, input.globalMastery),
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
    // Every economy gate keeps an ownership override: holding nothing right now
    // must not hide a system from a player who has clearly already used it.
    materials,
    passiveTree:
      (input.skillPoints ?? 0) > 0 ||
      anyPositive(input.passives) ||
      input.playerTier >= 1,
    party: input.hasCompany === true,
  };
}
