import type { EssenceType } from '../items';
import type { EquippedRule } from '../runeDatabase';

/**
 * Guided Tier-1 tutorial vocabulary (docs/guided-tutorial-plan.md).
 *
 * Step and condition shapes are deliberately the bot harness's route
 * vocabulary (`bot/src/route/types.ts`), restricted to what the client
 * director can perform. `bot/src/routes/tutorialRoutes.ts` flattens a script
 * into an ordinary bot `Route`, so the headless bot validates exactly the
 * script a player is guided through.
 */

export type TutorialNodeRef =
  | { kind: 'node'; nodeId: string }
  | { kind: 'biome'; biomeGroup: string; tier: number; pick?: 'first' | 'uncleared'; modifier?: string }
  | { kind: 'dungeon'; biomeGroup: string; tier: number };

/** One upgrade target inside `canAffordUpgrades`. */
export interface TutorialUpgradeTarget {
  definitionId: string;
  toPlus: number;
}

export type TutorialCondition =
  | { type: 'playerTierAtLeast'; tier: number }
  | { type: 'classSelected' }
  | { type: 'biomeLevelAtLeast'; biomeGroup: string; level: number }
  | { type: 'globalMasteryAtLeast'; value: number }
  | { type: 'essenceAtLeast'; essence: EssenceType; amount: number }
  | { type: 'catalystAtLeast'; family: string; amount: number }
  | { type: 'recipeUnlocked'; recipeId: string }
  | { type: 'canCraft'; recipeId: string }
  | { type: 'hasItem'; definitionId: string }
  | { type: 'equipped'; definitionId: string }
  | { type: 'itemAtLeastPlus'; definitionId: string; plus: number }
  | { type: 'abilityKnown'; abilityId: string }
  | { type: 'runeRecipeCrafted'; recipeId: string }
  | { type: 'bossCleared'; biomeGroup: string; tier: number }
  /**
   * Every listed item can be taken from its CURRENT level to its target right
   * now: Global Mastery, biome level, and the summed essence + catalyst cost
   * of all remaining levels. Monotone across the upgrades themselves: each one
   * spends exactly what it removes from the remaining cost.
   */
  | { type: 'canAffordUpgrades'; items: TutorialUpgradeTarget[] }
  | { type: 'allOf'; of: TutorialCondition[] }
  | { type: 'anyOf'; of: TutorialCondition[] }
  | { type: 'not'; of: TutorialCondition };

export type TutorialStep =
  /**
   * Auto-combat at `at` until `until` holds. The director travels there first;
   * location is an attribute of the work, never its own step, so resuming never
   * replays a trip. `until` must be monotone (see `TutorialBeat`).
   */
  | { type: 'farm'; at: TutorialNodeRef; until: TutorialCondition }
  /** The player picks on the skill tree; the guide only points. The bot adapter supplies the class. */
  | { type: 'chooseClass' }
  | { type: 'craft'; recipeIds: string[] }
  | { type: 'equip'; definitionIds: string[] }
  | { type: 'upgrade'; definitionId: string; toPlus: number }
  | { type: 'configureRunes'; rules: EquippedRule[] }
  | { type: 'craftRune'; recipeId: string }
  /** Craft the ability recipe, then make it the only ability of its slot kind. */
  | { type: 'learnAbility'; recipeId: string; abilityId: string; slot: 'technique' | 'guard' }
  | { type: 'setAbilities'; techniques: string[]; guards: string[] }
  | { type: 'attemptBoss'; biomeGroup: string; tier: number };

/** What a waiting beat shows as "current / target". */
export type TutorialProgressRef =
  | { type: 'questKills'; questId: string }
  | { type: 'biomeLevel'; biomeGroup: string; level: number }
  | { type: 'essenceFor'; recipeId: string }
  | { type: 'essence'; essence: EssenceType; amount: number }
  | { type: 'catalyst'; family: string; amount: number }
  | { type: 'upgradeCost'; items: TutorialUpgradeTarget[] };

/**
 * One press of Next.
 *
 * A beat is DONE when every step is satisfied (`stepSatisfied`). Resume is
 * "first beat that is not done", so step satisfaction must stay true once the
 * script has moved past it: farm conditions are authored monotone (e.g.
 * `anyOf(hasItem X, canCraft X)`, never a bare `canCraft`), and equip, Rune and
 * ability-loadout steps count as satisfied when a LATER step of the script has
 * superseded them.
 */
export interface TutorialBeat {
  id: string;
  /**
   * What the guide says before Next. A short phrase: the reason for a choice
   * when the choice is not obvious, otherwise just what happens next. Never a
   * mechanics explanation.
   */
  say: string;
  /** Shown instead of `say` while the beat is running a long wait. */
  waiting?: string;
  progress?: TutorialProgressRef[];
  /** Section heading for the panel (e.g. "The Plains"). */
  chapter: string;
  steps: TutorialStep[];
}

export interface TutorialScript {
  id: string;
  /** Class root this script is for; null for the class-agnostic opening alone. */
  classRoot: string | null;
  beats: TutorialBeat[];
}
