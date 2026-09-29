import type { AttunedAbilities } from '../abilities';
import { withReferenceAbilityWiring } from '../abilityWiring';
import { ITEM_DATABASE } from '../itemDatabase';
import type { EquippedRule } from '../runeDatabase';
import { attunedAbilityIds } from '../runicPoints';
import { bossClearKey } from '../systems/biomeProgress';
import { evaluateTutorialCondition, viewHasItem, type TutorialView } from './conditions';
import type { TutorialBeat, TutorialScript, TutorialStep } from './types';

/**
 * Resume-from-state (docs/guided-tutorial-plan.md, "Director behavior").
 *
 * Nothing about tutorial progress is persisted: the current beat is always the
 * first beat whose steps are not all satisfied by the live player view. That is
 * what lets a player opt out, play by hand, reload, or die, and have the guide
 * pick up at the right place.
 */

function sameRule(a: EquippedRule, b: EquippedRule): boolean {
  return a.conditionId === b.conditionId
    && a.actionId === b.actionId
    && (a.targetAbilityId ?? null) === (b.targetAbilityId ?? null);
}

/**
 * `rules` appear in `loadout` in the same relative order. Order is part of the
 * plan: Rune lanes are first-rule-wins, and the default loadout holds the same
 * rules as the guide's opening but with flee below chase, where it never fires.
 */
function loadoutIncludes(loadout: readonly EquippedRule[], rules: readonly EquippedRule[]): boolean {
  let at = 0;
  for (const rule of rules) {
    while (at < loadout.length && !sameRule(loadout[at], rule)) at += 1;
    if (at >= loadout.length) return false;
    at += 1;
  }
  return true;
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/** The ability loadout a step leaves behind, given the loadout before it. */
function abilitiesAfter(
  step: Extract<TutorialStep, { type: 'learnAbility' | 'setAbilities' }>,
  before: { techniques: readonly string[]; guards: readonly string[] },
): { techniques: string[]; guards: string[] } {
  if (step.type === 'setAbilities') return { techniques: [...step.techniques], guards: [...step.guards] };
  return step.slot === 'guard'
    ? { techniques: [...before.techniques], guards: [step.abilityId] }
    : { techniques: [step.abilityId], guards: [...before.guards] };
}

/**
 * The Rune loadout to send alongside an ability loadout: `rules` without
 * `use-ability` rules for abilities no longer attuned, plus each attuned
 * ability's reference rule when nothing wires it yet. Abilities have no built-in
 * trigger (src/abilityWiring.ts), so an unwired ability never fires. The bot's
 * `applyBuild` does the same.
 */
export function wiredRunes(rules: readonly EquippedRule[], abilities: AttunedAbilities): EquippedRule[] {
  const attuned = new Set(attunedAbilityIds(abilities));
  return withReferenceAbilityWiring(
    rules.filter((rule) => rule.actionId !== 'use-ability' || attuned.has(rule.targetAbilityId ?? '')),
    abilities,
  );
}

function abilitiesWired(view: TutorialView): boolean {
  return attunedAbilityIds(view.attunedAbilities).every((id) =>
    view.runesEquipped.some((rule) => rule.actionId === 'use-ability' && rule.targetAbilityId === id));
}

function abilityLoadoutMatches(
  step: Extract<TutorialStep, { type: 'learnAbility' | 'setAbilities' }>,
  view: TutorialView,
): boolean {
  const current = view.attunedAbilities;
  const matches = step.type === 'learnAbility'
    ? (step.slot === 'guard' ? current.guards : current.techniques).includes(step.abilityId)
    : sameSet(current.techniques, step.techniques) && sameSet(current.guards, step.guards);
  return matches && abilitiesWired(view);
}

/**
 * Whether `step` needs no further action.
 *
 * `later` is every step after this one in the script: an equip, Rune or ability
 * loadout step that a later step has already replaced is satisfied, otherwise
 * the Clearing club would be re-equipped over the Plains broadsword on every
 * resume.
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
        return !!worn && later.some((next) => next.type === 'equip' && next.definitionIds.includes(worn));
      });
    case 'upgrade':
      return viewHasItem(view, step.definitionId)
        && (view.itemUpgrades[step.definitionId] ?? 0) >= step.toPlus;
    case 'configureRunes':
      return loadoutIncludes(view.runesEquipped, step.rules)
        || later.some((next) => next.type === 'configureRunes' && loadoutIncludes(view.runesEquipped, next.rules));
    case 'craftRune':
      return view.runeRecipesCrafted.includes(step.recipeId);
    case 'learnAbility':
    case 'setAbilities': {
      if (step.type === 'learnAbility' && !view.knownAbilities.includes(step.abilityId)) return false;
      if (abilityLoadoutMatches(step, view)) return true;
      return later.some((next) =>
        (next.type === 'learnAbility' || next.type === 'setAbilities') && abilityLoadoutMatches(next, view));
    }
    case 'attemptBoss':
      return view.bossesCleared.includes(bossClearKey(step.biomeGroup, step.tier));
  }
}

/** The loadout `step` should send, given the live one. Exposed so the client and bot agree. */
export function abilityLoadoutFor(
  step: Extract<TutorialStep, { type: 'learnAbility' | 'setAbilities' }>,
  view: Pick<TutorialView, 'attunedAbilities'>,
): { techniques: string[]; guards: string[] } {
  return abilitiesAfter(step, view.attunedAbilities);
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
