import { CLEARING_NODE_ID } from '../../world/nodeBiomes';
import type { TutorialBeat, TutorialNodeRef, TutorialScript } from '../types';

const CLEARING: TutorialNodeRef = { kind: 'node', nodeId: CLEARING_NODE_ID };
const CHAPTER = 'The Clearing';

/**
 * One Clearing piece as two presses of Next: fight until it is unlocked and
 * affordable, then craft and wear it. Split so a long wait always ends on Next.
 * The farm condition includes `hasItem` so it stays true after the craft spends
 * the essence (resume-from-state needs monotone conditions).
 */
function clearingPiece(
  recipeId: string,
  requiredBiomeLevel: number,
  lines: { farm: string; waiting: string; craft: string },
): TutorialBeat[] {
  return [
    {
      id: `farm:${recipeId}`,
      chapter: CHAPTER,
      say: lines.farm,
      waiting: lines.waiting,
      progress: [
        { type: 'biomeLevel', biomeGroup: 'clearing', level: requiredBiomeLevel },
        { type: 'essenceFor', recipeId },
      ],
      steps: [{
        type: 'farm',
        at: CLEARING,
        until: {
          type: 'anyOf',
          of: [
            { type: 'hasItem', definitionId: recipeId },
            { type: 'canCraft', recipeId },
          ],
        },
      }],
    },
    {
      id: `craft:${recipeId}`,
      chapter: CHAPTER,
      say: lines.craft,
      steps: [
        { type: 'craft', recipeIds: [recipeId] },
        { type: 'equip', definitionIds: [recipeId] },
      ],
    },
  ];
}

/**
 * The class-agnostic opening: tier-0 quest, class pick, Clearing set. Mirrors
 * the bot's `clearingOpening` (bot/src/routes/t1Common.ts) minus its Rune
 * step: the class script opens with the guide's Rune loadout, right after
 * the Clearing set.
 */
export const TUTORIAL_OPENING: TutorialScript = {
  id: 'tutorial-opening',
  classRoot: null,
  beats: [
    {
      id: 'first-blood',
      chapter: CHAPTER,
      say: 'Tiny Wisps are harmless. Ten of them earn your first tier.',
      waiting: 'Auto Combat does the fighting. Sit back and watch the count.',
      progress: [{ type: 'questKills', questId: 'tier-0' }],
      steps: [{ type: 'farm', at: CLEARING, until: { type: 'playerTierAtLeast', tier: 1 } }],
    },
    {
      id: 'choose-class',
      chapter: CHAPTER,
      say: 'Pick the class you like the look of. The guide has a route for every one.',
      waiting: 'Read the cards, then confirm your pick with Unlock.',
      steps: [{ type: 'chooseClass' }],
    },
    ...clearingPiece('primordial-club', 1, {
      farm: 'Bare hands will not last. The Clearing can pay for a club.',
      waiting: 'Keep fighting here until the club is unlocked and paid for.',
      craft: 'Any weapon beats none. Craft the club and wield it.',
    }),
    ...clearingPiece('clearing-vest-t1', 2, {
      farm: 'Armor next: more health means fewer close calls.',
      waiting: 'A little more Clearing mastery opens the Bark Wrap.',
      craft: 'Craft the Bark Wrap and wear it.',
    }),
    ...clearingPiece('clearing-charm-t1', 3, {
      farm: 'A charm gets you back to full faster between fights.',
      waiting: 'The Herb Pouch opens at the next mastery level.',
      craft: 'Craft the Herb Pouch and carry it.',
    }),
    ...clearingPiece('clearing-boots-t1', 4, {
      farm: 'Last piece: boots, so less time walking and more time fighting.',
      waiting: 'The Soft Boots open at mastery 4, the Clearing\'s last level.',
      craft: 'Craft the Soft Boots and lace them up. That is the full Clearing set.',
    }),
  ],
};
