import { useAtomValue } from 'jotai';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { nodeLoadingAtom } from './atoms';
import './nodeLoading.css';

export function NodeLoadingOverlay() {
  const loading = useAtomValue(nodeLoadingAtom);
  if (!loading.active) return null;

  const info = loading.nodeId ? NODE_BIOMES[loading.nodeId] : null;
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
  const label = biome?.name ?? loading.nodeId ?? 'Unknown area';

  return (
    <div className="node-loading-overlay" role="status" aria-live="polite">
      <div className="node-loading-overlay__panel">
        <div className="node-loading-overlay__title">Loading area</div>
        <div className="node-loading-overlay__subtitle">{label}</div>
      </div>
    </div>
  );
}
