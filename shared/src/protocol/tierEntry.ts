import type { EquippedAbilities } from "../abilities";
import type { EquipmentMap, EssenceType } from "../items";
import type { EquippedRule } from "../runeDatabase";
import type { EquippedRites } from "../rites";
import type { EquippedStances } from "../stances";

/**
 * Explicit, inspectable state used by the development bot harness to enter a
 * tier without pretending that the preceding economy happened in this run.
 *
 * The server validates the structural parts of this payload and derives
 * unlockable content from the supplied progression. It is intentionally not a
 * generic save-file import: runtime state, cooldowns, targets and summons are
 * never part of a profile.
 */
export interface TierEntryWallet {
  essences: Record<EssenceType, number>;
  catalysts: Record<string, number>;
  catalystProgress?: Record<string, number>;
}

export type TierEntryEconomyPolicy =
  | "synthetic-combat-progression"
  | "authoritative-economy-continuation";

export interface TierEntryProfile {
  id: string;
  targetTier: number;
  classRoot: string;
  /** The selected tier-1 frame; the server also validates its parent root. */
  frameId: string;
  /** T2 profiles spawn at the T2 Sanctuary; later tiers may use their own hub. */
  spawnNodeId: string;
  economyPolicy: TierEntryEconomyPolicy;
  /** Exact wallet used at entry. Synthetic wallets are labeled in telemetry. */
  wallet: TierEntryWallet;

  level: number;
  skillPoints: number;
  currentSkillTier: number;
  biomeLevels: Record<string, number>;
  biomeXP: Record<string, number>;
  bossesCleared: string[];
  clearedNodes: string[];
  visitedNodes: string[];
  questProgress: Record<string, number>;

  inventory: string[];
  equipment: EquipmentMap;
  itemUpgrades: Record<string, number>;

  knownAbilities: string[];
  equippedAbilities: EquippedAbilities;
  runeRecipesCrafted: string[];
  runesEquipped: EquippedRule[];
  knownStances: string[];
  equippedStances: EquippedStances;
  knownRites: string[];
  equippedRites: EquippedRites;
}

/** The authoritative snapshot recorded at the beginning of a tier-entry run. */
export interface TierEntryInitialState {
  profileId: string;
  targetTier: number;
  economyPolicy: TierEntryEconomyPolicy;
  classRoot: string;
  frameId: string;
  spawnNodeId: string;
  biomeLevels: Record<string, number>;
  globalMastery: number;
  bossesCleared: string[];
  equipment: EquipmentMap;
  inventory: string[];
  itemUpgrades: Record<string, number>;
  knownAbilities: string[];
  equippedAbilities: EquippedAbilities;
  runeRecipesCrafted: string[];
  runesEquipped: EquippedRule[];
  knownStances: string[];
  equippedStances: EquippedStances;
  activeStance: string | null;
  knownRites: string[];
  equippedRites: EquippedRites;
  initialEssences: Record<EssenceType, number>;
  initialCatalysts: Record<string, number>;
}

export interface TierEntryApplyResult {
  success: boolean;
  profileId: string;
  targetTier?: number;
  reason?: string;
}
