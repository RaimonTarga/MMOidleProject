import type { EssenceType } from '../items';
import type { TutorialConceptId } from './concepts';

/**
 * Guided Tier-1 tutorial vocabulary (docs/guided-tutorial-plan.md).
 *
 * Step and condition shapes are deliberately the bot harness's route
 * vocabulary (`bot/src/route/types.ts`), restricted to what the client
 * director can perform. No bot runs a script (the old adapter was removed);
 * `tutorial.test.ts` is the guide's check.
 */

export type TutorialNodeRef =
  | { kind: 'node'; nodeId: string }
  | {
      kind: 'biome';
      biomeGroup: string;
      tier: number;
      pick?: 'first' | 'uncleared';
      modifier?: string;
    }
  | { kind: 'dungeon'; biomeGroup: string; tier: number };

export type TutorialCondition =
  | { type: 'playerTierAtLeast'; tier: number }
  | { type: 'classSelected' }
  | { type: 'biomeLevelAtLeast'; biomeGroup: string; level: number }
  | { type: 'globalMasteryAtLeast'; value: number }
  | { type: 'essenceAtLeast'; essence: EssenceType; amount: number }
  | { type: 'recipeUnlocked'; recipeId: string }
  | { type: 'canCraft'; recipeId: string }
  | { type: 'hasItem'; definitionId: string }
  | { type: 'equipped'; definitionId: string }
  | { type: 'bossCleared'; biomeGroup: string; tier: number }
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
  /**
   * `unless` marks a craft or equip the guide no longer needs once it holds (the
   * player has moved past the piece's zone or tier): the step then counts as done
   * without the item. Monotone, like a farm's `until`.
   */
  | { type: 'craft'; recipeIds: string[]; unless?: TutorialCondition }
  | { type: 'equip'; definitionIds: string[]; unless?: TutorialCondition }
  /**
   * `until` turns one boss attempt into "keep fighting this boss until". Without
   * it the step ends on the first clear.
   */
  | { type: 'attemptBoss'; biomeGroup: string; tier: number; until?: TutorialCondition };

/** What a waiting beat shows as "current / target". */
export type TutorialProgressRef =
  | { type: 'questKills'; questId: string }
  | { type: 'biomeLevel'; biomeGroup: string; level: number }
  | { type: 'essenceFor'; recipeId: string }
  | { type: 'essence'; essence: EssenceType; amount: number };

/**
 * One press of Next.
 *
 * A beat is DONE when every step is satisfied (`stepSatisfied`). Resume is
 * "first beat that is not done", so step satisfaction must stay true once the
 * script has moved past it: farm conditions are authored monotone (e.g.
 * `anyOf(hasItem X, canCraft X)`, never a bare `canCraft`), and equip steps
 * count as satisfied when a LATER step of the script has superseded them.
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
  /**
   * The new ideas this beat's line puts in front of the player, at most two
   * (the first-hour checklist, docs/guided-tutorial-plan.md). Presentation
   * data: the bot never reads it; `tutorial.test.ts` counts it per level.
   */
  teaches?: TutorialConceptId[];
  /**
   * Runs without a press of Next: the panel starts the beat's steps as soon as
   * it is current, its line shows while it runs, and the panel moves on by
   * itself when they are done. Set on the gear beats (`scripts/gear.ts`) only.
   */
  auto?: true;
}

export interface TutorialScript {
  id: string;
  /** Class root this script is for; null for the class-agnostic opening alone. */
  classRoot: string | null;
  beats: TutorialBeat[];
}
