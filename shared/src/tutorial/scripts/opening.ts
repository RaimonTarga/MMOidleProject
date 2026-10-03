import { CLEARING_NODE_ID } from '../../world/nodeBiomes';
import type { TutorialConceptId } from '../concepts';
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
  teaches: { farm?: TutorialConceptId[]; craft?: TutorialConceptId[] },
  questProgress = false,
): TutorialBeat[] {
  return [
    {
      id: `farm:${recipeId}`,
      chapter: CHAPTER,
      say: lines.farm,
      waiting: lines.waiting,
      ...(teaches.farm ? { teaches: teaches.farm } : {}),
      progress: [
        ...(questProgress ? [{ type: 'questKills' as const, questId: 'tier-0' }] : []),
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
      ...(teaches.craft ? { teaches: teaches.craft } : {}),
      steps: [
        { type: 'craft', recipeIds: [recipeId] },
        { type: 'equip', definitionIds: [recipeId] },
      ],
    },
  ];
}

/**
 * The class-agnostic opening: the tier-0 quest with the club and the armor made
 * DURING it, the class pick, then the rest of the Clearing set. The bot's
 * `clearingOpening` (bot/src/routes/t1Common.ts) runs the quest first; the guide
 * does not, for the first-hour checklist (docs/guided-tutorial-plan.md): the ten
 * Wisps carry the Clearing to level 3 on their own, so crafting after them
 * skipped the club's and the armor's farm beats and put the class, the gear,
 * the armor and the charm in front of a new player within seconds. Made as the
 * levels arrive, they land two at a time. (Crafting and equipping need no tier
 * or class; the Make tab shows once the first essence is held.) The class script
 * opens with the guide's Rune loadout, right after the Clearing set.
 */
export const TUTORIAL_OPENING: TutorialScript = {
  id: 'tutorial-opening',
  classRoot: null,
  beats: [
    ...clearingPiece('primordial-club', 1, {
      farm: 'Tiny Wisps are harmless. Ten of them earn your first tier, and the first few pay for a weapon.',
      waiting: 'Auto Combat does the fighting. A few Wisps pay for a club.',
      craft: 'Any weapon beats none. Craft the club and wield it.',
    }, { farm: ['auto-combat', 'tier'], craft: ['gear'] }, true),
    ...clearingPiece('clearing-vest-t1', 2, {
      farm: 'Armor next: more health means fewer close calls.',
      waiting: 'A little more Clearing mastery opens the Bark Wrap.',
      craft: 'Craft the Bark Wrap and wear it.',
    }, { farm: ['armor'] }, true),
    {
      id: 'first-blood',
      chapter: CHAPTER,
      say: 'Now the rest of the ten Wisps, for your first tier.',
      waiting: 'Auto Combat does the fighting. Sit back and watch the count.',
      progress: [{ type: 'questKills', questId: 'tier-0' }],
      steps: [{ type: 'farm', at: CLEARING, until: { type: 'playerTierAtLeast', tier: 1 } }],
    },
    {
      id: 'choose-class',
      chapter: CHAPTER,
      say: 'Pick the class you like the look of. The guide has a route for every one.',
      waiting: 'Read the cards, then confirm your pick with Unlock.',
      teaches: ['class'],
      steps: [{ type: 'chooseClass' }],
    },
    ...clearingPiece('clearing-charm-t1', 3, {
      farm: 'A charm gets you back to full faster between fights.',
      waiting: 'The Herb Pouch opens at the next mastery level.',
      craft: 'Craft the Herb Pouch and carry it.',
    }, { farm: ['charm'] }),
    ...clearingPiece('clearing-boots-t1', 4, {
      farm: 'Last piece: boots, so less time walking and more time fighting.',
      waiting: 'The Soft Boots open at mastery 4, the Clearing\'s last level.',
      craft: 'Craft the Soft Boots and lace them up. That is the full Clearing set.',
    }, { farm: ['boots'] }),
  ],
};
