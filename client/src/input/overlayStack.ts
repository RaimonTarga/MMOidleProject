import { getDefaultStore } from 'jotai';
import {
  craftTabAtom,
  debugPanelOpenAtom,
  inventoryOpenAtom,
  mapOpenAtom,
  questOpenAtom,
  releaseAnnouncementAtom,
  runesOpenAtom,
  abilitiesOpenAtom,
  stancesOpenAtom,
  ritesOpenAtom,
  settingsOpenAtom,
  skillTreeOpenAtom,
} from '../hud/atoms';

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
  if (store.get(runesOpenAtom)) {
    store.set(runesOpenAtom, false);
    return;
  }
  if (store.get(abilitiesOpenAtom)) {
    store.set(abilitiesOpenAtom, false);
    return;
  }
  if (store.get(stancesOpenAtom)) {
    store.set(stancesOpenAtom, false);
    return;
  }
  if (store.get(ritesOpenAtom)) {
    store.set(ritesOpenAtom, false);
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
