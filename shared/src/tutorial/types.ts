import type { PacketId, RowKind } from '../data/lineages/types';
import type { EssenceType } from '../items';
import type { EquippedRule } from '../runeDatabase';
import type { TutorialConceptId } from './concepts';

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
  | {
      kind: 'biome';
      biomeGroup: string;
      tier: number;
      pick?: 'first' | 'uncleared';
      modifier?: string;
      /**
       * Only nodes that pay this shard (design §24.3: every kill in a node pays its
       * dominant family's shard, so a shard farm must stand in that territory).
       */
      shard?: PacketId;
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
  | { type: 'abilityKnown'; abilityId: string }
  | { type: 'runeRecipeCrafted'; recipeId: string }
  | { type: 'bossCleared'; biomeGroup: string; tier: number }
  // ── Lineage trees (progression rework Phase 1; design §4, §5, §12) ─────────
  /** Lane shards, the kill-driven wallet a card and a gate are paid in. */
  | { type: 'shardAtLeast'; packet: PacketId; amount: number }
  /** A biome boss's capstone material — the only thing a boss kill mints. */
  | { type: 'capstoneAtLeast'; biome: string; amount: number }
  /**
   * The card is owned; with `rank`, owned at that rank or above (a RANKED card, the
   * T1 lean trio: design §26.1). A rank is never lost, so this stays monotone.
   */
  | { type: 'lineageCardOwned'; lineageId: string; cardId: string; rank?: number }
  | { type: 'lineageFormOwned'; lineageId: string; recipeId: string }
  | { type: 'lineageFormWorn'; lineageId: string; recipeId: string }
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
  | { type: 'configureRunes'; rules: EquippedRule[] }
  | { type: 'craftRune'; recipeId: string }
  /** Craft the ability recipe, then make it the only ability of its slot kind. */
  | { type: 'learnAbility'; recipeId: string; abilityId: string; slot: 'technique' | 'guard' }
  | { type: 'setAbilities'; techniques: string[]; guards: string[] }
  /**
   * Buy one lineage card. Permanent. Only legal once the lineage's base form is
   * WORN — holding the form is what opens the weapon page (`checkUnlockCard`).
   * Buying activates the card only into an EMPTY row (server-side), so every
   * purchase beat follows it with a `setActive` for the same card.
   *
   * `rank` (a RANKED card, the T1 lean trio: design §26.1): buy ranks until the
   * card is owned at this one. The same intent buys the next rank of an owned
   * ranked card (the page's Rank up); omitted means owning the card (rank I).
   */
  | { type: 'unlockCard'; lineageId: string; cardId: string; rank?: number }
  /**
   * Make an owned card the active one of its row. Free. A no-op right after a
   * purchase into an empty row; the swap a player who already filled the row
   * by hand needs (the weapon page sends the same intent after a buy).
   */
  | { type: 'setActive'; lineageId: string; row: RowKind; cardId: string }
  /** Pay a band's gate: essence, the crowned lane's shard, the boss capstone. */
  | { type: 'unlockForm'; lineageId: string; recipeId: string }
  /** Wear an owned form. Free, and it moves the slot like any equip. */
  | { type: 'wearForm'; lineageId: string; recipeId: string }
  /**
   * `until` turns one boss attempt into "keep fighting this boss until"; the
   * gate's three capstone materials are three kills, which is the one place the
   * guide repeats a fight. Without it the step ends on the first clear.
   */
  | { type: 'attemptBoss'; biomeGroup: string; tier: number; until?: TutorialCondition };

/** What a waiting beat shows as "current / target". */
export type TutorialProgressRef =
  | { type: 'questKills'; questId: string }
  | { type: 'biomeLevel'; biomeGroup: string; level: number }
  | { type: 'essenceFor'; recipeId: string }
  | { type: 'essence'; essence: EssenceType; amount: number }
  | { type: 'shard'; packet: PacketId; amount: number }
  | { type: 'capstone'; biome: string; amount: number };

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
  /**
   * The new ideas this beat's line puts in front of the player, at most two
   * (the first-hour checklist, docs/guided-tutorial-plan.md). Presentation
   * data: the bot never reads it; `tutorial.test.ts` counts it per level.
   */
  teaches?: TutorialConceptId[];
  /**
   * Shown AFTER the beat's steps are done, while the guide points: the card the
   * beat bought, then (with `ring`) that card's ring on the rhythm readout. The
   * client director only; the bot has nothing to read. Lines are generated from
   * data in `classScript.ts`, like every other line.
   */
  lesson?: TutorialLesson;
}

export interface TutorialLesson {
  lineageId: string;
  cardId: string;
  /** The line while the ring rests on the bought card ("look at what it says now"). */
  read: string;
  /** The line while the ring rests on the card's ring, under the HP bar (design §26.4). */
  ring?: string;
}

export interface TutorialScript {
  id: string;
  /** Class root this script is for; null for the class-agnostic opening alone. */
  classRoot: string | null;
  beats: TutorialBeat[];
}
