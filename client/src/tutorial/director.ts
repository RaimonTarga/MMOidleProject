import { atom, getDefaultStore } from 'jotai';
import {
  ABILITY_RECIPE_DATABASE,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  ABILITY_DATABASE,
  ACTION_DATABASE,
  CONDITION_DATABASE,
  TUTORIAL_ANCHORS,
  abilityLoadoutFor,
  attunedAbilityIds,
  composeRuneEdit,
  referenceAbilityRule,
  tutorialRuleKey,
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
import { playSfx } from '../audio/audioEngine';
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
import { tutorialFocusAtom, tutorialHighlightAtom, tutorialPressAtom, tutorialRuneDraftAtom } from './atoms';

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
  await pressPointed(signal);
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
  await pressPointed(signal);
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
    await pressPointed(signal);
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

function abilityName(id: string): string {
  return ABILITY_DATABASE.get(id)?.name ?? id;
}

function ruleLabel(rule: EquippedRule): string {
  const when = CONDITION_DATABASE.get(rule.conditionId as never)?.name ?? rule.conditionId;
  const what = rule.actionId === 'use-ability'
    ? abilityName(rule.targetAbilityId ?? '')
    : ACTION_DATABASE.get(rule.actionId as never)?.name ?? rule.actionId;
  return `${when} → ${what}`;
}

const sameRule = (a: EquippedRule, b: EquippedRule) => tutorialRuleKey(a) === tutorialRuleKey(b);

/**
 * The next ↑ press that brings `current` closer to `target`'s order. The board
 * only reorders within a lane (same channel), exactly like its arrows.
 */
function nextUpMove(current: readonly EquippedRule[], target: readonly EquippedRule[]): { index: number; other: number } | null {
  const channel = (rule: EquippedRule) => ACTION_DATABASE.get(rule.actionId as never)?.channel ?? '';
  for (const lane of new Set(current.map(channel))) {
    const laneIdx = current.map((rule, i) => ({ rule, i })).filter(({ rule }) =>
      channel(rule) === lane && target.some((t) => sameRule(t, rule)));
    const desired = target.filter((rule) => channel(rule) === lane);
    for (let pos = 0; pos < desired.length && pos < laneIdx.length; pos += 1) {
      if (sameRule(laneIdx[pos].rule, desired[pos])) continue;
      const from = laneIdx.findIndex(({ rule }) => sameRule(rule, desired[pos]));
      if (from <= pos) break;
      return { index: laneIdx[from].i, other: laneIdx[from - 1].i };
    }
  }
  return null;
}

/**
 * Walks the Rune board to `target` the way a player would, one visible action
 * at a time (designer request 2026-09-29: show the steps, don't insta-equip):
 * x the rules that go, then + Add rule → When → Do (→ ability) → Add rule for
 * each new one, then ↑ to fix priority within a lane. Each action sends exactly
 * what that button sends. Anything the board cannot express (order across
 * lanes) is settled quietly at the end.
 */
async function buildRunesOnBoard(target: EquippedRule[], beat: TutorialBeat, signal: AbortSignal): Promise<void> {
  await openBuildTab('runes', TUTORIAL_ANCHORS.menuRunes, signal);

  for (let guard = 0; guard < 20; guard += 1) {
    const current = requireView().runesEquipped;
    const extra = current.find((rule) => !target.some((t) => sameRule(t, rule)));
    if (!extra) break;
    report(beat, 'working', `Removing the rule ${ruleLabel(extra)}.`);
    await point(TUTORIAL_ANCHORS.runesRemove(tutorialRuleKey(extra)), signal);
    await pressPointed(signal);
    await sendRunes(current.filter((rule) => !sameRule(rule, extra)), signal);
  }

  for (const rule of target) {
    if (requireView().runesEquipped.some((r) => sameRule(r, rule))) continue;
    report(beat, 'working', `New rule: ${ruleLabel(rule)}.`);
    await point(TUTORIAL_ANCHORS.runesAdd, signal);
    await pressPointed(signal);
    store.set(tutorialRuneDraftAtom, { conditionId: '', actionId: '' });
    await point(TUTORIAL_ANCHORS.runesWhen(rule.conditionId), signal);
    await pressPointed(signal);
    store.set(tutorialRuneDraftAtom, { conditionId: rule.conditionId, actionId: '' });
    await point(TUTORIAL_ANCHORS.runesDo(rule.actionId), signal);
    await pressPointed(signal);
    store.set(tutorialRuneDraftAtom, { conditionId: rule.conditionId, actionId: rule.actionId });
    if (rule.actionId === 'use-ability' && rule.targetAbilityId) {
      await point(TUTORIAL_ANCHORS.runesAbility(rule.targetAbilityId), signal);
      await pressPointed(signal);
      store.set(tutorialRuneDraftAtom, { conditionId: rule.conditionId, actionId: rule.actionId, targetAbilityId: rule.targetAbilityId });
    }
    await point(TUTORIAL_ANCHORS.runesCommit, signal);
    await pressPointed(signal);
    store.set(tutorialRuneDraftAtom, null);
    await sendRunes(composeRuneEdit(requireView().runesEquipped, rule, null), signal);
  }

  for (let guard = 0; guard < 40; guard += 1) {
    const current = requireView().runesEquipped;
    const move = nextUpMove(current, target);
    if (!move) break;
    report(beat, 'working', `Moving ${ruleLabel(current[move.index])} up: higher rules win.`);
    await point(TUTORIAL_ANCHORS.runesUp(tutorialRuleKey(current[move.index])), signal);
    await pressPointed(signal);
    const next = [...current];
    [next[move.index], next[move.other]] = [next[move.other], next[move.index]];
    await sendRunes(next, signal);
  }

  await sendRunes(target, signal);
  store.set(tutorialHighlightAtom, null);
}

/**
 * Ability loadout the way a player does it on the Abilities tab: Unattune what
 * leaves, Attune what joins, then "Use default timing" on each new ability so a
 * Rune fires it (abilities have no built-in trigger). Unattuning first frees
 * the RP the new ones need, like the bot's `applyBuild`.
 */
async function applyAbilities(
  abilities: { techniques: string[]; guards: string[] },
  beat: TutorialBeat,
  signal: AbortSignal,
): Promise<void> {
  const wanted = [...abilities.techniques, ...abilities.guards];
  const attunedIn = (v: PlayerView, id: string) =>
    v.attunedAbilities.techniques.includes(id) || v.attunedAbilities.guards.includes(id);
  const family = (id: string): 'techniques' | 'guards' =>
    ABILITY_DATABASE.get(id)?.slot === 'guard' ? 'guards' : 'techniques';

  const send = async (next: { techniques: string[]; guards: string[] }, done: (v: PlayerView) => boolean, what: string) => {
    hudBus.requestSetAbilityLoadout(next);
    const ok = await waitAlive(done, signal, ACTION_TIMEOUT_MS);
    if (!ok) throw new TutorialStop(`${what} did not go through. Press Next to try again.`, 'error');
  };

  for (const id of attunedAbilityIds(requireView().attunedAbilities).filter((a) => !wanted.includes(a))) {
    await openBuildTab('abilities', TUTORIAL_ANCHORS.menuAbilities, signal);
    report(beat, 'working', `Unattuning ${abilityName(id)} to make room.`);
    await point(TUTORIAL_ANCHORS.abilityAttune(id), signal);
    await pressPointed(signal);
    const current = requireView().attunedAbilities;
    const key = family(id);
    await send({ ...current, [key]: current[key].filter((a) => a !== id) }, (v) => !attunedIn(v, id), `Unattuning ${abilityName(id)}`);
  }

  for (const id of wanted.filter((a) => !attunedIn(requireView(), a))) {
    await openBuildTab('abilities', TUTORIAL_ANCHORS.menuAbilities, signal);
    report(beat, 'working', `Attuning ${abilityName(id)}.`);
    await point(TUTORIAL_ANCHORS.abilityAttune(id), signal);
    await pressPointed(signal);
    const current = requireView().attunedAbilities;
    const key = family(id);
    await send({ ...current, [key]: [...current[key], id] }, (v) => attunedIn(v, id), `Attuning ${abilityName(id)}`);
  }

  for (const id of wanted) {
    const rule = referenceAbilityRule(id);
    const runes = requireView().runesEquipped;
    if (!rule || runes.some((r) => r.actionId === 'use-ability' && r.targetAbilityId === id)) continue;
    await openBuildTab('abilities', TUTORIAL_ANCHORS.menuAbilities, signal);
    report(beat, 'working', `Giving ${abilityName(id)} a Rune, so it fires on its own in a fight.`);
    await point(TUTORIAL_ANCHORS.abilityTiming(id), signal);
    await pressPointed(signal);
    await sendRunes([...runes, rule], signal);
  }

  // Quiet settle: drop Rune rules for abilities no longer attuned.
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
  // The guide takes over the loadout (locked decision): its plan, plus wiring
  // for whatever abilities are attuned.
  await buildRunesOnBoard(wiredRunes(step.rules, requireView().attunedAbilities), beat, signal);
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
  store.set(tutorialRuneDraftAtom, null);
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
