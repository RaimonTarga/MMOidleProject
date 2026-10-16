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

/** The steps after (or before) one step, without copying (resolution runs at delta rate over every step). */
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

function beforeThan(all: readonly TutorialStep[], until: number): LaterSteps {
  return {
    some(predicate) {
      for (let i = 0; i < until; i += 1) if (predicate(all[i])) return true;
      return false;
    },
  };
}

const NO_STEPS: LaterSteps = { some: () => false };

/**
 * A later step took `id`'s slot: what is worn there is first put on AFTER this
 * step. An item the script also put on earlier (the guide wears a piece again
 * in a later zone) does not count, or every piece between the two would be
 * skipped.
 */
function superseded(id: string, view: TutorialView, later: LaterSteps, earlier: LaterSteps): boolean {
  const slot = ITEM_DATABASE.get(id)?.slot;
  if (!slot) return false;
  const worn = view.equipment[slot];
  if (!worn || worn === id) return false;
  const putsOn = (step: TutorialStep) => step.type === 'equip' && step.definitionIds.includes(worn);
  return later.some(putsOn) && !earlier.some(putsOn);
}

/**
 * Whether `step` needs no further action.
 *
 * `later` is every step after this one in the script and `earlier` every step
 * before it: a craft or equip step whose slot a later step has already filled
 * is satisfied, otherwise the Clearing club would be made and re-equipped over
 * the Plains weapon on every resume. A craft or equip whose `unless` holds is
 * satisfied too.
 */
export function stepSatisfied(
  step: TutorialStep,
  view: TutorialView,
  later: LaterSteps,
  earlier: LaterSteps = NO_STEPS,
): boolean {
  switch (step.type) {
    case 'farm':
      return evaluateTutorialCondition(step.until, view);
    case 'chooseClass':
      return view.selectedClass !== null;
    case 'craft':
      if (step.unless && evaluateTutorialCondition(step.unless, view)) return true;
      return step.recipeIds.every((id) => viewHasItem(view, id) || superseded(id, view, later, earlier));
    case 'equip':
      if (step.unless && evaluateTutorialCondition(step.unless, view)) return true;
      return step.definitionIds.every((id) => {
        const slot = ITEM_DATABASE.get(id)?.slot;
        if (!slot) return false;
        return view.equipment[slot] === id || superseded(id, view, later, earlier);
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
  return beat.steps.every((step, i) => stepSatisfied(step, view, laterThan(all, offset + i + 1), beforeThan(all, offset + i)));
}

/** Index of the beat to show, or `script.beats.length` when the script is finished. */
export function resolveBeatIndex(script: TutorialScript, view: TutorialView): number {
  const all = flattenSteps(script);
  let offset = 0;
  for (let i = 0; i < script.beats.length; i += 1) {
    const steps = script.beats[i].steps;
    for (let j = 0; j < steps.length; j += 1) {
      if (!stepSatisfied(steps[j], view, laterThan(all, offset + j + 1), beforeThan(all, offset + j))) return i;
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
    if (!stepSatisfied(step, view, laterThan(all, offset + i + 1), beforeThan(all, offset + i))) return step;
  }
  return null;
}
