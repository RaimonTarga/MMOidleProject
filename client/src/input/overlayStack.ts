import { getDefaultStore } from 'jotai';
import {
  craftTabAtom,
  debugPanelOpenAtom,
  inventoryOpenAtom,
  buildOpenAtom,
  runesOpenAtom,
  mapOpenAtom,
  masteryOpenAtom,
  questOpenAtom,
  releaseAnnouncementAtom,
  settingsOpenAtom,
  skillTreeOpenAtom,
} from '../hud/atoms';

export type PrimaryOverlay =
  | 'skill-tree'
  | 'build'
  | 'runes'
  | 'mastery'
  | 'inventory'
  | 'crafting'
  | 'map'
  | 'quests'
  | 'settings';

function primaryOverlayIsOpen(overlay: PrimaryOverlay): boolean {
  const store = getDefaultStore();
  switch (overlay) {
    case 'skill-tree': return store.get(skillTreeOpenAtom);
    case 'build': return store.get(buildOpenAtom);
    case 'runes': return store.get(runesOpenAtom);
    case 'mastery': return store.get(masteryOpenAtom);
    case 'inventory': return store.get(inventoryOpenAtom);
    case 'crafting': return store.get(craftTabAtom) !== null;
    case 'map': return store.get(mapOpenAtom);
    case 'quests': return store.get(questOpenAtom);
    case 'settings': return store.get(settingsOpenAtom);
  }
}

export function closePrimaryOverlays(): void {
  const store = getDefaultStore();
  store.set(skillTreeOpenAtom, false);
  store.set(buildOpenAtom, false);
  store.set(runesOpenAtom, false);
  store.set(masteryOpenAtom, false);
  store.set(inventoryOpenAtom, false);
  store.set(craftTabAtom, null);
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
    case 'runes': store.set(runesOpenAtom, true); break;
    case 'mastery': store.set(masteryOpenAtom, true); break;
    case 'inventory': store.set(inventoryOpenAtom, true); break;
    case 'crafting': store.set(craftTabAtom, 'make'); break;
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
  if (store.get(buildOpenAtom)) {
    store.set(buildOpenAtom, false);
    return;
  }
  if (store.get(runesOpenAtom)) {
    store.set(runesOpenAtom, false);
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
