import { RECIPE_DATABASE } from '../data/recipes';
import type { TUTORIAL_ANCHORS } from './anchors';
import type { TutorialCondition, TutorialScript } from './types';

/**
 * The first-hour checklist (docs/guided-tutorial-plan.md, "The first-hour
 * checklist"): every new idea the guide's lines put in front of a player, and the
 * thing on screen that explains it. A beat names the ideas its line introduces in
 * `teaches`; `tutorial.test.ts` holds every level of every class script to at most
 * two, and every idea to exactly one introduction.
 *
 * An idea is something the player has to hold in their head from then on (a
 * system, a screen, a rule), not an item: a second charm is not a new idea, the
 * first charm is. Reasons for a choice that only restate a known idea ("the
 * Swamp armor resists poison") introduce nothing.
 */
export interface TutorialConcept {
  /** The idea in a few words, as the checklist table prints it. */
  name: string;
  /** What on screen explains it while the guide says so. */
  shownBy: string;
  /** The `TUTORIAL_ANCHORS` key the guide's ring rests on for it, when it has one. */
  anchor?: keyof typeof TUTORIAL_ANCHORS;
}

export const TUTORIAL_CONCEPTS = {
  'auto-combat': {
    name: 'Auto Combat fights for you',
    shownBy: 'the Auto Combat button, ringed and pressed',
    anchor: 'autoCombat',
  },
  tier: {
    name: 'A quest\'s kills earn the next tier',
    shownBy: 'the kill bar on the guide card',
  },
  class: {
    name: 'Your class',
    shownBy: 'the class cards on the Passive Tree',
    anchor: 'classChoices',
  },
  gear: {
    name: 'Zones pay essence; the Make tab turns it into gear you wear',
    shownBy: 'the essence bar on the guide card, then Make → Craft and Inventory → Equip',
    anchor: 'makeAction',
  },
  mastery: {
    name: 'Zone mastery opens recipes',
    shownBy: 'the Mastery level bar on the guide card',
  },
  armor: {
    name: 'Armor is health',
    shownBy: 'the health bar growing when it is worn',
  },
  charm: {
    name: 'A charm refills health between fights',
    shownBy: 'the health bar refilling between pulls',
  },
  boots: {
    name: 'Boots are speed',
    shownBy: 'the walk between pulls getting shorter',
  },
  runes: {
    name: 'Runes are standing orders; the higher rule of a lane wins',
    shownBy: 'the Runes board, built rule by rule',
    anchor: 'runesBoard',
  },
  zones: {
    name: 'The guide travels between zones',
    shownBy: 'the arrival banner naming the zone',
  },
  technique: {
    name: 'A Technique fires on its own every so often',
    shownBy: 'the Abilities tab, Attune',
    anchor: 'abilityAttune',
  },
  'ability-runes': {
    name: 'An ability fires from a Rune',
    shownBy: '"Use default timing" under the ability',
    anchor: 'abilityTiming',
  },
  'weapon-page': {
    name: 'A weapon has a page of cards',
    shownBy: 'the weapon page, opened from the equipped weapon',
    anchor: 'equipmentSlot',
  },
  shards: {
    name: 'Every kill pays its territory\'s shard',
    shownBy: 'the arrival banner and the map ("Pack territory · Gale Shards")',
  },
  lean: {
    name: 'Row 1, the lean: a stat while the form is worn, one active',
    shownBy: 'the lean card\'s sentence and the stat sheet beside it',
    anchor: 'lineageCard',
  },
  guard: {
    name: 'A Guard rescues you mid-fight',
    shownBy: 'the Abilities tab, Attune',
    anchor: 'abilityAttune',
  },
  evasion: {
    name: 'Evasion: harder to hit',
    shownBy: 'the Evasion row of the stat sheet',
  },
  poison: {
    name: 'Poison keeps hurting after the hit',
    shownBy: 'the poison tile on the buff bar',
  },
  hazards: {
    name: 'Hazard ground hurts, and a Rune walks around it',
    shownBy: 'the hazard patches on the Swamp floor',
  },
  'loadout-swap': {
    name: 'Abilities are swapped to fit the zone',
    shownBy: 'the Abilities tab, Unattune then Attune',
    anchor: 'abilityAttune',
  },
  verb: {
    name: 'Row 2, the verb: a moment, and the lean decides what happens then',
    shownBy: 'the verb card\'s sentence on the weapon page, rewritten by the lean',
    anchor: 'lineageCard',
  },
  'rhythm-ring': {
    name: 'A ring by the health bar shows the verb coming',
    shownBy: 'the verb\'s ring on the rhythm readout, ringed',
    anchor: 'rhythmRing',
  },
  orbit: {
    name: 'Orbit: circle out of reach while attacking',
    shownBy: 'the Runes board',
    anchor: 'runesBoard',
  },
  telegraphs: {
    name: 'A wound-up hit can be dodged',
    shownBy: 'the cast bar over a monster winding up',
  },
  'step-back': {
    name: 'Step Back dodges a wound-up hit',
    shownBy: 'Step Back at the top of the Runes board',
    anchor: 'runesBoard',
  },
  seals: {
    name: 'Two boss seals open Tier 2',
    shownBy: 'the tier-up after the second seal',
  },
  'boss-altar': {
    name: 'Clear the guard, then wake the boss at its altar',
    shownBy: 'the altar button, ringed',
    anchor: 'altar',
  },
  gate: {
    name: 'A gate turns the weapon into its next form',
    shownBy: 'the gate block at the bottom of the weapon page',
    anchor: 'lineageForm',
  },
  capstone: {
    name: 'Only the boss drops the gate\'s capstone',
    shownBy: 'the capstone pips on the gate block',
  },
} as const satisfies Record<string, TutorialConcept>;

export type TutorialConceptId = keyof typeof TUTORIAL_CONCEPTS;

/** Most new ideas one level of the first hour may introduce. */
export const TUTORIAL_CONCEPTS_PER_LEVEL = 2;

/** The zone a chapter plays in; chapters with none (the seals, the gate) are their own level. */
const CHAPTER_ZONE: Readonly<Record<string, string>> = {
  'The Clearing': 'clearing',
  'The Plains': 'plains',
  'The Forest': 'forest',
  'The Swamp': 'swamp',
  'The Mountain': 'mountain',
  'The Cave': 'cave',
};

export interface TutorialChecklistRow {
  /** "Clearing 0", "Forest 2", "The Seals": where the player is when the line shows. */
  level: string;
  beatId: string;
  say: string;
  teaches: readonly TutorialConceptId[];
}

function gatesIn(condition: TutorialCondition): TutorialCondition[] {
  switch (condition.type) {
    case 'allOf':
    case 'anyOf':
      return condition.of.flatMap(gatesIn);
    case 'not':
      return [];
    default:
      return [condition];
  }
}

/**
 * Each beat of a script with the level its line is shown at, read off the
 * script's OWN gates: a beat is reached only once every farm before it has met
 * its condition, so the chapter zone's level at a beat is the highest level any
 * earlier farm waited for. That is the earliest the guide can show the line; a
 * live run that overshoots a level only spreads the ideas further apart, except
 * that a farm finishing two levels at once lands two levels' lines together —
 * which the 1x sweep's own level-ups show (docs/guided-tutorial-plan.md).
 *
 * The seals and the gate are their own levels.
 */
export function tutorialChecklist(script: TutorialScript): TutorialChecklistRow[] {
  const levels: Record<string, number> = {};
  const rows: TutorialChecklistRow[] = [];
  for (const beat of script.beats) {
    const zone = CHAPTER_ZONE[beat.chapter];
    const zoneName = zone ? beat.chapter.replace(/^The /, '') : undefined;
    const level = zoneName ? `${zoneName} ${levels[zone!] ?? 0}` : beat.chapter;
    rows.push({ level, beatId: beat.id, say: beat.say, teaches: beat.teaches ?? [] });

    for (const step of beat.steps) {
      if (step.type !== 'farm') continue;
      for (const gate of gatesIn(step.until)) {
        if (gate.type === 'biomeLevelAtLeast') levels[gate.biomeGroup] = Math.max(levels[gate.biomeGroup] ?? 0, gate.level);
        if (gate.type === 'canCraft' || gate.type === 'recipeUnlocked') {
          const recipe = RECIPE_DATABASE.get(gate.recipeId);
          if (recipe) levels[recipe.recipeGroup] = Math.max(levels[recipe.recipeGroup] ?? 0, recipe.requiredBiomeLevel);
        }
      }
    }
  }
  return rows;
}
