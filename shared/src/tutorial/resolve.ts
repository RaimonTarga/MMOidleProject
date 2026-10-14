import { ITEM_DATABASE } from '../itemDatabase';
import { bossClearKey } from '../systems/biomeProgress';
import {
  evaluateTutorialCondition,
  viewHasItem,
  type TutorialView,
} from './conditions';
import type { TutorialBeat, TutorialScript, TutorialStep } from './types';

/**
 * Resume-from-state (docs/guided-tutorial-plan.md, "Director behavior").
 *
 * Nothing about tutorial progress is persisted: the current beat is always the
 * first beat whose steps are not all satisfied by the live player view. That is
 * what lets a player opt out, play by hand, reload, or die, and have the guide
 * pick up at the right place.
 */

/**
 * Whether `step` needs no further action.
 *
 * `later` is every step after this one in the script: an equip step that a
 * later step has already replaced is satisfied, otherwise the Clearing club
 * would be re-equipped over the Plains broadsword on every resume.
 */
/** The steps after one step, without copying (resolution runs at delta rate over ~300 steps). */
export interface LaterSteps {
  some(predicate: (step: TutorialStep) => boolean): boolean;
}

function laterThan(all: readonly TutorialStep[], from: number): LaterSteps {
  return {
    some(predicate) {
      for (let i = from; i < all.length; i += 1) if (predicate(all[i])) return true;
      return false;
    },
  };
}

export function stepSatisfied(step: TutorialStep, view: TutorialView, later: LaterSteps): boolean {
  switch (step.type) {
    case 'farm':
      return evaluateTutorialCondition(step.until, view);
    case 'chooseClass':
      return view.selectedClass !== null;
    case 'craft':
      return step.recipeIds.every((id) => viewHasItem(view, id));
    case 'equip':
      return step.definitionIds.every((id) => {
        const slot = ITEM_DATABASE.get(id)?.slot;
        if (!slot) return false;
        const worn = view.equipment[slot];
        if (worn === id) return true;
        // A later step took the slot.
        return !!worn && later.some((next) =>
          next.type === 'equip' && next.definitionIds.includes(worn));
      });
    case 'attemptBoss':
      return step.until
        ? evaluateTutorialCondition(step.until, view)
        : view.bossesCleared.includes(bossClearKey(step.biomeGroup, step.tier));
  }
}

function flattenSteps(script: TutorialScript): TutorialStep[] {
  return script.beats.flatMap((beat) => beat.steps);
}

function beatOffset(script: TutorialScript, beatIndex: number): number {
  let offset = 0;
  for (let i = 0; i < beatIndex; i += 1) offset += script.beats[i].steps.length;
  return offset;
}

export function beatDone(script: TutorialScript, beatIndex: number, view: TutorialView): boolean {
  const all = flattenSteps(script);
  const offset = beatOffset(script, beatIndex);
  const beat = script.beats[beatIndex];
  return beat.steps.every((step, i) => stepSatisfied(step, view, laterThan(all, offset + i + 1)));
}

/** Index of the beat to show, or `script.beats.length` when the script is finished. */
export function resolveBeatIndex(script: TutorialScript, view: TutorialView): number {
  const all = flattenSteps(script);
  let offset = 0;
  for (let i = 0; i < script.beats.length; i += 1) {
    const steps = script.beats[i].steps;
    for (let j = 0; j < steps.length; j += 1) {
      if (!stepSatisfied(steps[j], view, laterThan(all, offset + j + 1))) return i;
    }
    offset += steps.length;
  }
  return script.beats.length;
}

/** The first unsatisfied step of a beat — what the director works on next. */
export function nextStepOf(script: TutorialScript, beat: TutorialBeat, view: TutorialView): TutorialStep | null {
  const index = script.beats.indexOf(beat);
  if (index < 0) return null;
  const all = flattenSteps(script);
  const offset = beatOffset(script, index);
  for (let i = 0; i < beat.steps.length; i += 1) {
    const step = beat.steps[i];
    if (!stepSatisfied(step, view, laterThan(all, offset + i + 1))) return step;
  }
  return null;
}
