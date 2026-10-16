import { atom, getDefaultStore } from 'jotai';
import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  TUTORIAL_ANCHORS,
  evaluateTutorialCondition,
  bossClearKey,
  nextStepOf,
  tutorialNodeFor,
  viewHasItem,
  type PlayerView,
  type TutorialBeat,
  type TutorialNodeRef,
  type TutorialScript,
  type TutorialStep,
} from '@mmo-idle/shared';
import { playSfx } from '../audio/audioEngine';
import { hudBus } from '../hudBus';
import {
  clearDeathOverlay,
  deathOverlayAtom,
  dungeonAtom,
  localPlayerViewAtom,
} from '../hud/atoms';
import { closePrimaryOverlays, openPrimaryOverlay } from '../input/overlayStack';
import { bfsPath } from '../ui/map/pathing';
import { makeFiltersAtom } from '../ui/panelFilters';
import { tutorialFocusAtom, tutorialHighlightAtom, tutorialPressAtom } from './atoms';

/**
 * The guide's hands (docs/guided-tutorial-plan.md, "Director behavior").
 *
 * Every action goes through the same `hudBus` call the real button makes, after
 * opening the panel it lives in and pointing at each control on the way. The
 * server stays the only authority: a step is finished when the next delta says
 * so, never when the intent is sent. The bot harness performs the same steps
 * (bot/src/route/executor.ts); where it had to learn something the hard way
 * (clear a dungeon's guard before the altar) this does the same.
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

/** The ring's press pulse + the action cue, so a point and a click read differently. */
const PRESS_MS = 220;
async function pressPointed(signal: AbortSignal): Promise<void> {
  store.set(tutorialPressAtom, (n) => n + 1);
  playSfx('tutorial-action');
  await pause(PRESS_MS, signal);
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
  const path = bfsPath(view.nodeId, nodeId, view.playerTier);
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
  await pressPointed(signal);
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

/** Open the Make list on one entry and press its Craft button. */
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
  await pressPointed(signal);
  press();
  // Crafting something can wake a UI unlock that reshuffles the rail; never
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
  await pressPointed(signal);
  hudBus.requestEquipItem(definitionId);
  const worn = await waitAlive((v) => v.equipment[item.slot] === definitionId, signal, ACTION_TIMEOUT_MS);
  if (!worn) throw new TutorialStop(`${item.name} was not equipped. Press Next to try again.`, 'error');
  // The pressed button now reads Unequip; do not leave the ring on it.
  store.set(tutorialHighlightAtom, null);
}

/**
 * One trip to a boss: rest, travel, clear the guard, wake it, fight.
 *
 * `cleared` is the trip's own finish line, which is not always "this boss is
 * cleared": a step with `until` fights the same boss several times, so after the
 * first win the clear flag is already set and the trip has to end on something
 * else (see `attemptBoss`).
 */
async function bossRound(
  step: Extract<TutorialStep, { type: 'attemptBoss' }>,
  beat: TutorialBeat,
  signal: AbortSignal,
  cleared: (view: PlayerView) => boolean,
): Promise<void> {
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
      await pressPointed(signal);
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

/** How many trips one `attemptBoss` step with an `until` will make. */
const BOSS_ROUNDS = 6;

async function attemptBoss(
  step: Extract<TutorialStep, { type: 'attemptBoss' }>,
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  const key = bossClearKey(step.biomeGroup, step.tier);
  const { until } = step;
  if (!until) {
    await bossRound(step, beat, signal, (v) => v.bossesCleared.includes(key));
    return;
  }

  // "Keep fighting this boss until": the clear flag only lands once, so a trip
  // after the first ends when the altar goes on cooldown — the boss is down and
  // its drop is in the wallet.
  const node = resolveNode({ kind: 'dungeon', biomeGroup: step.biomeGroup, tier: step.tier });
  const onCooldown = () => {
    const dungeon = store.get(dungeonAtom);
    return !!dungeon && dungeon.nodeId === node && dungeon.status === 'cooldown';
  };
  const done = (v: PlayerView) => evaluateTutorialCondition(until, v);
  for (let round = 0; round < BOSS_ROUNDS && !done(requireView()); round += 1) {
    // The altar this beat just emptied has to reform before it can be woken.
    if (onCooldown()) {
      report(beat, 'waiting', 'The altar is reforming. Waiting for the next one.');
      await waitAlive((v) => done(v) || !onCooldown(), signal, GUARD_TIMEOUT_MS);
      if (done(requireView())) return;
    }
    await bossRound(step, beat, signal, (v) => done(v) || onCooldown());
  }
  if (!done(requireView())) {
    throw new TutorialStop('A few more of those. Press Next to go again.', 'stopped');
  }
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
