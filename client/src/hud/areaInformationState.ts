import { atom, getDefaultStore } from 'jotai';
import { NODE_BIOMES, type PlayerView } from '@mmo-idle/shared';
import { deathOverlayAtom, playerIdAtom, playerNodeIdAtom, tabResyncAtom, visitedNodesAtom } from './atoms';
import { arrivalKind, ARRIVAL_DURATION_MS, type ArrivalKind } from './areaInformationModel';

export interface AreaArrival { nodeId: string; kind: ArrivalKind; startedAt: number; duration: number }
export const areaArrivalAtom = atom<AreaArrival | null>(null);

/** Called before player atoms update, so discovery uses the previous authoritative visit history. */
export function observeAreaArrival(player: PlayerView, stateSync: boolean): void {
  const store = getDefaultStore();
  const previousNode = store.get(playerNodeIdAtom);
  const suppressed = stateSync || document.hidden || player.isDead
    || store.get(deathOverlayAtom).active || store.get(tabResyncAtom).active
    || store.get(playerIdAtom) !== player.id || !previousNode;
  if (suppressed) {
    store.set(areaArrivalAtom, null);
    return;
  }
  if (previousNode === player.nodeId) return;
  if (!NODE_BIOMES[player.nodeId]) { store.set(areaArrivalAtom, null); return; }
  const kind = arrivalKind(player.nodeId, [...store.get(visitedNodesAtom), previousNode]);
  store.set(areaArrivalAtom, { nodeId: player.nodeId, kind, startedAt: Date.now(), duration: ARRIVAL_DURATION_MS[kind] });
}
