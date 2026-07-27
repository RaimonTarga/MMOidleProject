import { getDefaultStore } from 'jotai';
import {
  activeStanceAtom,
  catalystProgressAtom,
  catalystsAtom,
  essencesAtom,
  passivesAtom,
  skillPointsAtom,
  unlockedRecipesAtom,
  equippedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  globalMasteryAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  playerIdAtom,
  playerTierAtom,
  biomeLevelAtom,
  biomeXPAtom,
  equipmentAtom,
  inventoryAtom,
  questProgressAtom,
  runesOwnedAtom,
} from './atoms';
import {
  resolveSystemVisibility,
  type SystemVisibility,
} from './systemVisibility';

export type UiUnlockSystem = keyof SystemVisibility;

const UI_UNLOCK_SYSTEMS: readonly UiUnlockSystem[] = [
  'mastery',
  'abilities',
  'stances',
  'rites',
  'materials',
  'passiveTree',
  'party',
  // Staged arc (§16). Each reveals on its own authoritative trigger and wakes
  // through the same mechanism — no second animation system.
  'combatLog',
  'bestiary',
  'progression',
  'inventory',
  'crafting',
  'map',
  'loadout',
  'abilityDock',
];
const UI_UNLOCK_ACTIVATION_FALLBACK_MS = 700;

function cssTimeMs(value: string, fallback: number): number {
  const match = /^([\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return fallback;
  return match[2] === 's' ? amount * 1000 : amount;
}

export function newlyVisibleUiSystems(
  previous: SystemVisibility,
  next: SystemVisibility,
): UiUnlockSystem[] {
  return UI_UNLOCK_SYSTEMS.filter(
    (system) => !previous[system] && next[system],
  );
}

/**
 * Projects authoritative reveal transitions onto every currently mounted
 * desktop target carrying a matching `data-ui-unlock-system` token.
 */
export function installUiUnlockSync(): () => void {
  const store = getDefaultStore();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targetTimers = new Map<HTMLElement, number>();
  const pendingFrames = new Map<UiUnlockSystem, number>();
  let playerId = store.get(playerIdAtom);
  let hydratingIdentity = false;
  let identityGeneration = 0;

  const readVisibility = (): SystemVisibility =>
    resolveSystemVisibility({
      playerTier: store.get(playerTierAtom),
      globalMastery: store.get(globalMasteryAtom),
      knownAbilities: store.get(knownAbilitiesAtom),
      equippedAbilities: store.get(equippedAbilitiesAtom),
      knownStances: store.get(knownStancesAtom),
      equippedStances: store.get(equippedStancesAtom),
      activeStance: store.get(activeStanceAtom),
      knownRites: store.get(knownRitesAtom),
      equippedRites: store.get(equippedRitesAtom),
      essences: store.get(essencesAtom),
      catalysts: store.get(catalystsAtom),
      catalystProgress: store.get(catalystProgressAtom),
      unlockedRecipes: store.get(unlockedRecipesAtom),
      skillPoints: store.get(skillPointsAtom),
      passives: store.get(passivesAtom),
      biomeXP: store.get(biomeXPAtom),
      biomeLevel: store.get(biomeLevelAtom),
      questProgress: store.get(questProgressAtom),
      inventory: store.get(inventoryAtom),
      hasEquipment: Object.values(store.get(equipmentAtom)).some((id) => !!id),
      runesOwned: store.get(runesOwnedAtom),
    });

  let previousVisibility = readVisibility();

  const clearTarget = (target: HTMLElement) => {
    const timer = targetTimers.get(target);
    if (timer !== undefined) window.clearTimeout(timer);
    targetTimers.delete(target);
    delete target.dataset.uiUnlockActivating;
  };

  const clearAll = () => {
    for (const frame of pendingFrames.values()) window.cancelAnimationFrame(frame);
    pendingFrames.clear();
    for (const target of targetTimers.keys()) clearTarget(target);
  };

  const beginActivation = (system: UiUnlockSystem) => {
    const pending = pendingFrames.get(system);
    if (pending !== undefined) {
      window.cancelAnimationFrame(pending);
      pendingFrames.delete(system);
    }
    if (document.hidden || reducedMotion.matches) return;

    const frame = window.requestAnimationFrame(() => {
      pendingFrames.delete(system);
      if (document.hidden || reducedMotion.matches) return;

      const targets = document.querySelectorAll<HTMLElement>(
        `[data-ui-unlock-system~="${system}"]`,
      );
      if (targets.length === 0) return;

      const duration = cssTimeMs(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--hud-unlock-activation-duration',
        ),
        UI_UNLOCK_ACTIVATION_FALLBACK_MS,
      );

      for (const target of targets) {
        clearTarget(target);
        // Restart the wake sequence when dev tools cross multiple reveal gates
        // quickly. Reflow is limited to this rare progression path.
        void target.offsetWidth;
        target.dataset.uiUnlockActivating = system;
        targetTimers.set(
          target,
          window.setTimeout(() => clearTarget(target), duration + 150),
        );
      }
    });
    pendingFrames.set(system, frame);
  };

  const syncVisibility = () => {
    const nextVisibility = readVisibility();
    if (!hydratingIdentity && playerId !== null) {
      for (const system of newlyVisibleUiSystems(previousVisibility, nextVisibility)) {
        beginActivation(system);
      }
    }
    previousVisibility = nextVisibility;
  };

  const syncIdentity = () => {
    const nextPlayerId = store.get(playerIdAtom);
    if (nextPlayerId === playerId) return;
    playerId = nextPlayerId;
    hydratingIdentity = true;
    previousVisibility = readVisibility();
    clearAll();
    const generation = ++identityGeneration;
    queueMicrotask(() => {
      if (generation !== identityGeneration) return;
      previousVisibility = readVisibility();
      hydratingIdentity = false;
    });
  };

  const cancelUnsafeMotion = () => {
    if (document.hidden || reducedMotion.matches) clearAll();
  };

  const visibilityAtoms = [
    playerTierAtom,
    globalMasteryAtom,
    knownAbilitiesAtom,
    equippedAbilitiesAtom,
    knownStancesAtom,
    equippedStancesAtom,
    activeStanceAtom,
    knownRitesAtom,
    equippedRitesAtom,
    essencesAtom,
    catalystsAtom,
    catalystProgressAtom,
    unlockedRecipesAtom,
    skillPointsAtom,
    passivesAtom,
    biomeXPAtom,
    biomeLevelAtom,
    questProgressAtom,
    inventoryAtom,
    equipmentAtom,
    runesOwnedAtom,
  ] as const;
  const unsubscribers = visibilityAtoms.map((visibilityAtom) =>
    store.sub(visibilityAtom, syncVisibility),
  );
  const unsubscribeIdentity = store.sub(playerIdAtom, syncIdentity);
  document.addEventListener('visibilitychange', cancelUnsafeMotion);
  reducedMotion.addEventListener('change', cancelUnsafeMotion);

  return () => {
    clearAll();
    for (const unsubscribe of unsubscribers) unsubscribe();
    unsubscribeIdentity();
    document.removeEventListener('visibilitychange', cancelUnsafeMotion);
    reducedMotion.removeEventListener('change', cancelUnsafeMotion);
  };
}
