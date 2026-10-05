import { getDefaultStore } from 'jotai';
import {
  buildPanelTabAtom,
  craftTabAtom,
  debugPanelOpenAtom,
  inventoryOpenAtom,
  buildOpenAtom,
  mapOpenAtom,
  masteryOpenAtom,
  questOpenAtom,
  releaseAnnouncementAtom,
  settingsOpenAtom,
  skillTreeOpenAtom,
  statsOpenAtom,
} from '../hud/atoms';
import type { BuildPanelTab } from '../hud/atoms';

export type PrimaryOverlay =
  | 'skill-tree'
  | 'build'
  | 'mastery'
  | 'inventory'
  | 'crafting'
  | 'upgrade'
  | 'stats'
  | 'map'
  | 'quests'
  | 'settings';

function primaryOverlayIsOpen(overlay: PrimaryOverlay): boolean {
  const store = getDefaultStore();
  switch (overlay) {
    case 'skill-tree': return store.get(skillTreeOpenAtom);
    case 'build': return store.get(buildOpenAtom);
    case 'mastery': return store.get(masteryOpenAtom);
    case 'inventory': return store.get(inventoryOpenAtom);
    case 'crafting': return store.get(craftTabAtom) === 'make';
    case 'upgrade': return store.get(craftTabAtom) === 'upgrade';
    case 'stats': return store.get(statsOpenAtom);
    case 'map': return store.get(mapOpenAtom);
    case 'quests': return store.get(questOpenAtom);
    case 'settings': return store.get(settingsOpenAtom);
  }
}

export function closePrimaryOverlays(): void {
  const store = getDefaultStore();
  store.set(skillTreeOpenAtom, false);
  store.set(buildOpenAtom, false);
  store.set(masteryOpenAtom, false);
  store.set(inventoryOpenAtom, false);
  store.set(craftTabAtom, null);
  store.set(statsOpenAtom, false);
  store.set(mapOpenAtom, false);
  store.set(questOpenAtom, false);
  store.set(settingsOpenAtom, false);
}

/** Primary dialogs are mutually exclusive. Secondary overlays remain independent. */
export function openPrimaryOverlay(overlay: PrimaryOverlay): void {
  const store = getDefaultStore();
  closePrimaryOverlays();
  switch (overlay) {
    case 'skill-tree': store.set(skillTreeOpenAtom, true); break;
    case 'build': store.set(buildOpenAtom, true); break;
    case 'mastery': store.set(masteryOpenAtom, true); break;
    case 'inventory': store.set(inventoryOpenAtom, true); break;
    case 'crafting': store.set(craftTabAtom, 'make'); break;
    case 'upgrade': store.set(craftTabAtom, 'upgrade'); break;
    case 'stats': store.set(statsOpenAtom, true); break;
    case 'map': store.set(mapOpenAtom, true); break;
    case 'quests': store.set(questOpenAtom, true); break;
    case 'settings': store.set(settingsOpenAtom, true); break;
  }
}

export function togglePrimaryOverlay(overlay: PrimaryOverlay): void {
  if (primaryOverlayIsOpen(overlay)) {
    closePrimaryOverlays();
    return;
  }
  openPrimaryOverlay(overlay);
}

/**
 * Abilities, Stances, Rites and Runes are one dialog with four rail entries.
 * Pressing the entry you are already on closes it, the same as every other
 * destination; pressing a different one switches tab without a close/open.
 */
export function toggleBuildTab(tab: BuildPanelTab): void {
  const store = getDefaultStore();
  if (store.get(buildOpenAtom) && store.get(buildPanelTabAtom) === tab) {
    closePrimaryOverlays();
    return;
  }
  closePrimaryOverlays();
  store.set(buildPanelTabAtom, tab);
  store.set(buildOpenAtom, true);
}

export function closeTopmostOverlay(): void {
  const store = getDefaultStore();
  if (store.get(releaseAnnouncementAtom)) {
    store.set(releaseAnnouncementAtom, null);
    return;
  }
  if (store.get(settingsOpenAtom)) {
    store.set(settingsOpenAtom, false);
    return;
  }
  if (store.get(questOpenAtom)) {
    store.set(questOpenAtom, false);
    return;
  }
  if (store.get(mapOpenAtom)) {
    store.set(mapOpenAtom, false);
    return;
  }
  if (store.get(craftTabAtom)) {
    store.set(craftTabAtom, null);
    return;
  }
  if (store.get(statsOpenAtom)) {
    store.set(statsOpenAtom, false);
    return;
  }
  if (store.get(buildOpenAtom)) {
    store.set(buildOpenAtom, false);
    return;
  }
  if (store.get(masteryOpenAtom)) {
    store.set(masteryOpenAtom, false);
    return;
  }
  if (store.get(inventoryOpenAtom)) {
    store.set(inventoryOpenAtom, false);
    return;
  }
  if (store.get(skillTreeOpenAtom)) {
    store.set(skillTreeOpenAtom, false);
    return;
  }
  if (store.get(debugPanelOpenAtom)) {
    store.set(debugPanelOpenAtom, false);
  }
}
