import { atom, getDefaultStore } from 'jotai';
import {
  ABILITY_RECIPE_DATABASE,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  TUTORIAL_ANCHORS,
  abilityLoadoutFor,
  bossClearKey,
  nextStepOf,
  tutorialNodeFor,
  viewHasItem,
  wiredRunes,
  type EquippedRule,
  type PlayerView,
  type TutorialBeat,
  type TutorialNodeRef,
  type TutorialScript,
  type TutorialStep,
} from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import {
  buildOpenAtom,
  buildPanelTabAtom,
  clearDeathOverlay,
  craftTabAtom,
  deathOverlayAtom,
  dungeonAtom,
  localPlayerViewAtom,
} from '../hud/atoms';
import { closePrimaryOverlays, openPrimaryOverlay } from '../input/overlayStack';
import { bfsPath } from '../ui/map/pathing';
import { makeFiltersAtom } from '../ui/panelFilters';
import { tutorialFocusAtom, tutorialHighlightAtom } from './atoms';

/**
 * The guide's hands (docs/guided-tutorial-plan.md, "Director behavior").
 *
 * Every action goes through the same `hudBus` call the real button makes, after
 * opening the panel it lives in and pointing at each control on the way. The
 * server stays the only authority: a step is finished when the next delta says
 * so, never when the intent is sent. The bot harness performs the same steps
 * (bot/src/route/executor.ts); where it had to learn something the hard way
 * (clear a dungeon's guard before the altar, re-wire abilities after a loadout
 * change) this does the same.
 */

export type TutorialRunStatus = 'working' | 'waiting' | 'player' | 'stopped' | 'error' | 'dead';

export interface TutorialRun {
  beatId: string;
  status: TutorialRunStatus;
  /** Replaces the beat's line while set, e.g. "Heading there first." */
  message?: string;
}

export const tutorialRunAtom = atom<TutorialRun | null>(null);

/**
 * How long the ring rests on each control before the guide presses it. 650 ms
 * read as too fast in the designer's playtest (2026-09-29); long enough to
 * follow each click, short enough that a craft + equip beat stays snappy.
 */
const POINT_MS = 1000;
/** Crafting, equipping and loadout changes settle within a few deltas. */
const ACTION_TIMEOUT_MS = 8_000;
const TRAVEL_TIMEOUT_MS = 5 * 60_000;
const REST_TIMEOUT_MS = 3 * 60_000;
const GUARD_TIMEOUT_MS = 15 * 60_000;
const BOSS_TIMEOUT_MS = 15 * 60_000;

class TutorialStop extends Error {
  constructor(message: string, readonly status: 'stopped' | 'error' | 'dead') {
    super(message);
  }
}

class Aborted extends Error {}

const store = getDefaultStore();

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Aborted());
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Aborted());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Resolves true when `predicate` holds for the live view, false on timeout. */
function waitForView(
  predicate: (view: PlayerView) => boolean,
  signal: AbortSignal,
  timeoutMs = Infinity,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe = () => {};
    const finish = (result: boolean | Aborted) => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      if (result instanceof Aborted) reject(result);
      else resolve(result);
    };
    const check = () => {
      const view = store.get(localPlayerViewAtom);
      if (view && predicate(view)) finish(true);
    };
    const onAbort = () => finish(new Aborted());
    if (signal.aborted) {
      reject(new Aborted());
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    unsubscribe = store.sub(localPlayerViewAtom, check);
    if (Number.isFinite(timeoutMs)) timer = setTimeout(() => finish(false), timeoutMs);
    check();
  });
}

function requireView(): PlayerView {
  const view = store.get(localPlayerViewAtom);
  if (!view) throw new TutorialStop('Waiting for your character to load.', 'stopped');
  if (view.isDead || store.get(deathOverlayAtom).active) {
    throw new TutorialStop('You fell. That happens; press Next to get back up.', 'dead');
  }
  return view;
}

/** Waits like `waitForView`, but a death ends the wait as a `dead` stop. */
async function waitAlive(
  predicate: (view: PlayerView) => boolean,
  signal: AbortSignal,
  timeoutMs = Infinity,
): Promise<boolean> {
  const ok = await waitForView((v) => v.isDead || predicate(v), signal, timeoutMs);
  requireView();
  return ok;
}

async function point(anchor: string, signal: AbortSignal): Promise<void> {
  store.set(tutorialHighlightAtom, anchor);
  await pause(POINT_MS, signal);
}

function report(beat: TutorialBeat, status: TutorialRunStatus, message?: string): void {
  store.set(tutorialRunAtom, { beatId: beat.id, status, message });
}

/** True once `step` is no longer the beat's first unsatisfied step. */
function stepPassed(script: TutorialScript, beat: TutorialBeat, step: TutorialStep) {
  return (view: PlayerView) => nextStepOf(script, beat, view) !== step;
}

async function travelTo(nodeId: string, beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  const view = requireView();
  if (view.nodeId === nodeId) return;
  const path = bfsPath(view.nodeId, nodeId);
  if (!path) throw new TutorialStop('The guide cannot find a way there from here.', 'error');
  report(beat, 'working', 'Heading there first.');
  // Travel is the one thing auto-combat must not hijack.
  if (view.auto) hudBus.requestSetAuto(false);
  hudBus.requestNavigateTo(path.slice(1));
  const arrived = await waitAlive((v) => v.nodeId === nodeId, signal, TRAVEL_TIMEOUT_MS);
  if (!arrived) throw new TutorialStop('The trip took too long. Press Next to try again.', 'error');
}

async function autoCombatOn(beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  if (requireView().auto) return;
  report(beat, 'working');
  await point(TUTORIAL_ANCHORS.autoCombat, signal);
  hudBus.requestSetAutoTraverse(false);
  hudBus.requestSetAuto(true);
  const on = await waitAlive((v) => v.auto, signal, ACTION_TIMEOUT_MS);
  if (!on) throw new TutorialStop('Auto Combat did not start. Press Next to try again.', 'error');
  store.set(tutorialHighlightAtom, null);
}

function resolveNode(ref: TutorialNodeRef): string {
  const node = tutorialNodeFor(ref, requireView());
  if (!node) throw new TutorialStop('The guide cannot find that zone.', 'error');
  return node;
}

async function farm(
  script: TutorialScript,
  beat: TutorialBeat,
  step: Extract<TutorialStep, { type: 'farm' }>,
  signal: AbortSignal,
): Promise<void> {
  const passed = stepPassed(script, beat, step);
  // Pick once, so the guide does not wander between nodes mid-farm.
  const target = resolveNode(step.at);
  while (!passed(requireView())) {
    await travelTo(target, beat, signal);
    await autoCombatOn(beat, signal);
    report(beat, 'waiting');
    await waitAlive((v) => passed(v) || !v.auto || v.nodeId !== target, signal);
    const view = requireView();
    if (passed(view)) return;
    // Walked off (e.g. a wandering chase): go back. Auto turned off by the player: hand back.
    if (view.nodeId === target && !view.auto) {
      throw new TutorialStop('Auto Combat stopped. Press Next to carry on.', 'stopped');
    }
  }
}

async function chooseClass(
  script: TutorialScript,
  beat: TutorialBeat,
  step: TutorialStep,
  signal: AbortSignal,
): Promise<void> {
  closePrimaryOverlays();
  report(beat, 'working');
  await point(TUTORIAL_ANCHORS.menuPassiveTree, signal);
  openPrimaryOverlay('skill-tree');
  store.set(tutorialHighlightAtom, TUTORIAL_ANCHORS.classChoices);
  report(beat, 'player');
  await waitAlive(stepPassed(script, beat, step), signal);
}

/** Open the Make list on one entry and press its button (Craft or Learn). */
async function makeEntry(
  kind: string,
  entryKey: string,
  press: () => void,
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  report(beat, 'working');
  closePrimaryOverlays();
  await point(TUTORIAL_ANCHORS.menuCrafting, signal);
  store.set(makeFiltersAtom, (prev) => ({ ...prev, kind: kind as never }));
  store.set(tutorialFocusAtom, { surface: 'make', entryKey });
  openPrimaryOverlay('crafting');
  await point(TUTORIAL_ANCHORS.makeRow(entryKey), signal);
  await point(TUTORIAL_ANCHORS.makeAction, signal);
  requireView();
  press();
  // Learning something can wake a UI unlock that reshuffles the rail; never
  // leave the ring on a button that may be gone by the next frame.
  store.set(tutorialHighlightAtom, null);
}

async function craft(recipeId: string, beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  if (viewHasItem(requireView(), recipeId)) return;
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) throw new TutorialStop(`Unknown recipe ${recipeId}.`, 'error');
  await makeEntry(recipe.slot, `gear:${recipeId}`, () => hudBus.requestCraftRecipe(recipeId), beat, signal);
  const made = await waitAlive((v) => viewHasItem(v, recipeId), signal, ACTION_TIMEOUT_MS);
  if (!made) throw new TutorialStop(`${recipe.name} was not crafted. Press Next to try again.`, 'error');
  store.set(tutorialHighlightAtom, null);
}

async function craftRune(recipeId: string, beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  if (requireView().runeRecipesCrafted.includes(recipeId)) return;
  const recipe = RUNE_RECIPE_DATABASE.get(recipeId);
  if (!recipe) throw new TutorialStop(`Unknown Rune recipe ${recipeId}.`, 'error');
  await makeEntry('rune', `rune:${recipeId}`, () => hudBus.requestCraftRuneRecipe(recipeId), beat, signal);
  const made = await waitAlive((v) => v.runeRecipesCrafted.includes(recipeId), signal, ACTION_TIMEOUT_MS);
  if (!made) throw new TutorialStop(`${recipe.name} was not made. Press Next to try again.`, 'error');
  store.set(tutorialHighlightAtom, null);
}

async function equip(definitionId: string, beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  const item = ITEM_DATABASE.get(definitionId);
  if (!item) throw new TutorialStop(`Unknown item ${definitionId}.`, 'error');
  if (requireView().equipment[item.slot] === definitionId) return;

  report(beat, 'working');
  closePrimaryOverlays();
  await point(TUTORIAL_ANCHORS.menuInventory, signal);
  store.set(tutorialFocusAtom, { surface: 'inventory', definitionId });
  openPrimaryOverlay('inventory');
  await point(TUTORIAL_ANCHORS.inventoryItem(definitionId), signal);
  await point(TUTORIAL_ANCHORS.inventoryAction, signal);
  requireView();
  hudBus.requestEquipItem(definitionId);
  const worn = await waitAlive((v) => v.equipment[item.slot] === definitionId, signal, ACTION_TIMEOUT_MS);
  if (!worn) throw new TutorialStop(`${item.name} was not equipped. Press Next to try again.`, 'error');
  // The pressed button now reads Unequip; do not leave the ring on it.
  store.set(tutorialHighlightAtom, null);
}

async function upgrade(
  step: Extract<TutorialStep, { type: 'upgrade' }>,
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  const item = ITEM_DATABASE.get(step.definitionId);
  if (!item) throw new TutorialStop(`Unknown item ${step.definitionId}.`, 'error');
  const plus = () => requireView().itemUpgrades[step.definitionId] ?? 0;
  if (plus() >= step.toPlus) return;

  report(beat, 'working');
  if (store.get(craftTabAtom) !== 'upgrade') {
    closePrimaryOverlays();
    await point(TUTORIAL_ANCHORS.menuUpgrade, signal);
    store.set(craftTabAtom, 'upgrade');
  }
  store.set(tutorialFocusAtom, { surface: 'upgrade', definitionId: step.definitionId });
  await point(TUTORIAL_ANCHORS.upgradeRow(step.definitionId), signal);
  while (plus() < step.toPlus) {
    const before = plus();
    await point(TUTORIAL_ANCHORS.upgradeAction, signal);
    hudBus.requestUpgradeItem(step.definitionId);
    const done = await waitAlive((v) => (v.itemUpgrades[step.definitionId] ?? 0) > before, signal, ACTION_TIMEOUT_MS);
    if (!done) throw new TutorialStop(`The ${item.name} upgrade did not go through. Press Next to try again.`, 'error');
  }
  store.set(tutorialHighlightAtom, null);
}

async function openBuildTab(tab: 'abilities' | 'runes', anchor: string, signal: AbortSignal): Promise<void> {
  if (store.get(buildOpenAtom) && store.get(buildPanelTabAtom) === tab) return;
  closePrimaryOverlays();
  await point(anchor, signal);
  store.set(buildPanelTabAtom, tab);
  store.set(buildOpenAtom, true);
}

async function sendRunes(rules: EquippedRule[], signal: AbortSignal): Promise<void> {
  const key = (list: readonly EquippedRule[]) =>
    JSON.stringify(list.map((r) => [r.conditionId, r.actionId, r.targetAbilityId ?? null]));
  if (key(requireView().runesEquipped) === key(rules)) return;
  hudBus.requestSetRuneLoadout(rules);
  const set = await waitAlive((v) => key(v.runesEquipped) === key(rules), signal, ACTION_TIMEOUT_MS);
  if (!set) throw new TutorialStop('The Runes did not change. Press Next to try again.', 'error');
}

/**
 * Ability loadout + wiring, in the order the bot's `applyBuild` found safe:
 * free the RP held by old ability Runes, change the abilities, then wire the
 * new ones.
 */
async function applyAbilities(
  abilities: { techniques: string[]; guards: string[] },
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  report(beat, 'working');
  await openBuildTab('abilities', TUTORIAL_ANCHORS.menuAbilities, signal);
  const view = requireView();
  const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));
  if (!same(view.attunedAbilities.techniques, abilities.techniques) || !same(view.attunedAbilities.guards, abilities.guards)) {
    const unwired = view.runesEquipped.filter((rule) => rule.actionId !== 'use-ability');
    await sendRunes(unwired, signal);
    const added = [...abilities.techniques, ...abilities.guards].find((id) =>
      !view.attunedAbilities.techniques.includes(id) && !view.attunedAbilities.guards.includes(id));
    if (added) await point(TUTORIAL_ANCHORS.abilityAttune(added), signal);
    hudBus.requestSetAbilityLoadout(abilities);
    const set = await waitAlive(
      (v) => same(v.attunedAbilities.techniques, abilities.techniques) && same(v.attunedAbilities.guards, abilities.guards),
      signal,
      ACTION_TIMEOUT_MS,
    );
    if (!set) throw new TutorialStop('The abilities did not change. Press Next to try again.', 'error');
  }
  await sendRunes(wiredRunes(requireView().runesEquipped, abilities), signal);
  store.set(tutorialHighlightAtom, null);
}

async function learnAbility(
  step: Extract<TutorialStep, { type: 'learnAbility' }>,
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  if (!requireView().knownAbilities.includes(step.abilityId)) {
    if (!ABILITY_RECIPE_DATABASE.has(step.recipeId)) throw new TutorialStop(`Unknown recipe ${step.recipeId}.`, 'error');
    await makeEntry('technique', `technique:${step.recipeId}`, () => hudBus.requestCraftAbilityRecipe(step.recipeId), beat, signal);
    const learned = await waitAlive((v) => v.knownAbilities.includes(step.abilityId), signal, ACTION_TIMEOUT_MS);
    if (!learned) throw new TutorialStop('That ability was not learned. Press Next to try again.', 'error');
  }
  await applyAbilities(abilityLoadoutFor(step, requireView()), beat, signal);
}

async function configureRunes(
  step: Extract<TutorialStep, { type: 'configureRunes' }>,
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  report(beat, 'working');
  await openBuildTab('runes', TUTORIAL_ANCHORS.menuRunes, signal);
  await point(TUTORIAL_ANCHORS.runesBoard, signal);
  // The guide takes over the loadout (locked decision): its plan, plus wiring
  // for whatever abilities are attuned.
  await sendRunes(wiredRunes(step.rules, requireView().attunedAbilities), signal);
  store.set(tutorialHighlightAtom, null);
}

async function attemptBoss(
  step: Extract<TutorialStep, { type: 'attemptBoss' }>,
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  const key = bossClearKey(step.biomeGroup, step.tier);
  const cleared = (v: PlayerView) => v.bossesCleared.includes(key);
  if (cleared(requireView())) return;
  const dungeonNode = resolveNode({ kind: 'dungeon', biomeGroup: step.biomeGroup, tier: step.tier });

  // Slow and safe: walk in at full health.
  const rested = (v: PlayerView) => v.hp >= v.maxHp;
  if (!rested(requireView())) {
    if (requireView().auto) hudBus.requestSetAuto(false);
    report(beat, 'waiting', 'Resting to full health before going in.');
    await waitAlive(rested, signal, REST_TIMEOUT_MS);
  }

  await travelTo(dungeonNode, beat, signal);
  const dungeon = () => {
    const d = store.get(dungeonAtom);
    return d && d.nodeId === dungeonNode ? d : null;
  };

  // Someone else just won here: the altar reforms (and the guard with it) first.
  if (dungeon()?.status === 'cooldown') {
    report(beat, 'waiting', 'This boss was just beaten; its altar is reforming. Waiting it out.');
    await waitAlive(() => dungeon()?.status !== 'cooldown', signal, GUARD_TIMEOUT_MS);
  }

  // Clear the guard first: waking the boss turns every guardian still standing
  // on you at once (the bot learned this against 11+ attackers).
  if ((dungeon()?.guardianAlive ?? 0) > 0) {
    await autoCombatOn(beat, signal);
    report(beat, 'waiting', 'Clearing the guards first.');
    const guardDown = await waitAlive((v) => cleared(v) || (dungeon()?.guardianAlive ?? 1) === 0, signal, GUARD_TIMEOUT_MS);
    if (!guardDown) throw new TutorialStop('The guards are holding out. Press Next to keep at it.', 'stopped');
  }
  if (cleared(requireView())) return;

  const d = dungeon();
  if (d && d.status === 'idle') {
    // Walk to the altar and wake the boss, the way a player does.
    hudBus.requestSetAuto(false);
    report(beat, 'working', 'To the altar.');
    const near = (v: PlayerView) => {
      const altar = dungeon()?.altar;
      if (!altar) return false;
      const dx = v.pos.x - altar.x;
      const dy = v.pos.y - altar.y;
      return dx * dx + dy * dy <= altar.activationRadius * altar.activationRadius;
    };
    for (let attempt = 0; attempt < 4 && !near(requireView()); attempt += 1) {
      hudBus.requestMoveTo({ x: d.altar.x, y: d.altar.y });
      await waitAlive(near, signal, 15_000);
    }
    if (!near(requireView())) throw new TutorialStop('Could not reach the altar. Press Next to try again.', 'error');
    report(beat, 'waiting', 'Waiting for the altar to settle.');
    await waitAlive(() => dungeon()?.canActivate === true || dungeon()?.status !== 'idle', signal, GUARD_TIMEOUT_MS);
    if (dungeon()?.status === 'idle') {
      report(beat, 'working');
      await point(TUTORIAL_ANCHORS.altar, signal);
      for (let attempt = 0; attempt < 3 && dungeon()?.status === 'idle'; attempt += 1) {
        hudBus.requestActivateDungeonAltar();
        await waitAlive(() => dungeon()?.status !== 'idle', signal, 4_000);
      }
      store.set(tutorialHighlightAtom, null);
    }
  }

  await autoCombatOn(beat, signal);
  report(beat, 'waiting', 'Boss fight! Auto Combat has it; the Runes handle dodging and healing.');
  const won = await waitAlive(cleared, signal, BOSS_TIMEOUT_MS);
  if (!won) throw new TutorialStop('That fight dragged on. Press Next to go again.', 'stopped');
}

async function performStep(
  script: TutorialScript,
  beat: TutorialBeat,
  step: TutorialStep,
  signal: AbortSignal,
): Promise<void> {
  switch (step.type) {
    case 'farm':
      return farm(script, beat, step, signal);
    case 'chooseClass':
      return chooseClass(script, beat, step, signal);
    case 'craft':
      for (const id of step.recipeIds) await craft(id, beat, signal);
      return;
    case 'equip':
      for (const id of step.definitionIds) await equip(id, beat, signal);
      return;
    case 'upgrade':
      return upgrade(step, beat, signal);
    case 'configureRunes':
      return configureRunes(step, beat, signal);
    case 'craftRune':
      return craftRune(step.recipeId, beat, signal);
    case 'learnAbility':
      return learnAbility(step, beat, signal);
    case 'setAbilities':
      return applyAbilities(abilityLoadoutFor(step, requireView()), beat, signal);
    case 'attemptBoss':
      return attemptBoss(step, beat, signal);
  }
}

function clearPointers(): void {
  store.set(tutorialHighlightAtom, null);
  store.set(tutorialFocusAtom, null);
}

/**
 * Runs one beat to completion. Resolves when every step is satisfied, when the
 * guide has to hand back to the player (`stopped`/`error`/`dead`, reported
 * through `tutorialRunAtom`), or silently when `signal` aborts.
 */
export async function runBeat(script: TutorialScript, beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  try {
    for (let guard = 0; guard < 50; guard += 1) {
      const step = nextStepOf(script, beat, requireView());
      if (!step) break;
      await performStep(script, beat, step, signal);
    }
    // Let the result land on screen before the panel closes.
    await pause(POINT_MS, signal);
    closePrimaryOverlays();
    clearPointers();
    store.set(tutorialRunAtom, null);
  } catch (error) {
    clearPointers();
    if (error instanceof Aborted) return;
    if (error instanceof TutorialStop) {
      report(beat, error.status, error.message);
      return;
    }
    report(beat, 'error', 'Something went wrong. Press Next to try again.');
    console.error('[tutorial] beat failed', beat.id, error);
  }
}

/** The Next press on the "you fell" card: the same as the death overlay's own button. */
export function respawnForTutorial(): void {
  clearDeathOverlay();
  store.set(tutorialRunAtom, null);
}

/** Stops whatever the guide is doing and removes its pointers. */
export function resetTutorialRun(): void {
  clearPointers();
  store.set(tutorialRunAtom, null);
}
