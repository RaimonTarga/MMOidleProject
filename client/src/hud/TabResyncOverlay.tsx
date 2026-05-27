import { useAtomValue } from 'jotai';
import { BIOME_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import { playerNodeIdAtom, tabResyncAtom } from './atoms';
import './nodeLoading.css';

function zoneLabel(nodeId: string | null): string {
  if (!nodeId) return 'Current area';
  const info = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
  return biome?.name ?? nodeId;
}

export function TabResyncOverlay() {
  const resync = useAtomValue(tabResyncAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  if (!resync.active) return null;

  return (
    <div
      className="node-loading-overlay tab-resync-overlay"
      role="status"
      aria-live="polite"
    >
      <div className="node-loading-overlay__panel">
        <div className="node-loading-overlay__title">Syncing…</div>
        <div className="node-loading-overlay__subtitle">{zoneLabel(nodeId)}</div>
      </div>
    </div>
  );
}
