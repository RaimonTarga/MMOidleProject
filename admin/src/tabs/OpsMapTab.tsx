import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { BIOME_DATABASE, NODE_BIOMES, type NodeBiomeInfo } from '@mmo-idle/shared';
import { telemetryAtom } from '../state';
import { TELEMETRY_METRICS, type TelemetryMetric } from '@/lib/telemetry';
import { NodeTelemetryHistogram3D } from './opsmap/NodeTelemetryHistogram3D';
import { NodeTelemetryPanel } from './opsmap/NodeTelemetryPanel';
import '../ops-map.css';

const GRID_ROWS = 11;
const GRID_COLS = 11;
const OPS_HEAT_TILE_BACKGROUND = '#100303';

type OpsView = 'heat' | '3d';

function dungeonBadgeLabel(info: NodeBiomeInfo | undefined): string | null {
  if (!info?.isDungeon) return null;
  return info.bossTypeId === 'void-overlord' ? 'THRONE' : 'DUNGEON';
}

function heatOpacity(row: { tickCpuMs: number; idlePopulationMs: number } | undefined, maxCpu: number): number {
  if (!row || maxCpu <= 0) return 0;
  const load = row.tickCpuMs + row.idlePopulationMs;
  const normalized = load / maxCpu;
  return 0.15 + Math.min(1, normalized) * 0.4;
}

export function OpsMapTab() {
  const telemetry = useAtomValue(telemetryAtom);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const [opsView, setOpsView] = useState<OpsView>('heat');
  const [metric, setMetric] = useState<TelemetryMetric>('tickCpuMs');

  const maxNodeCpu = useMemo(() => {
    if (!telemetry) return 0;
    let max = 0;
    for (const row of Object.values(telemetry.nodes)) {
      const load = row.tickCpuMs + row.idlePopulationMs;
      if (load > max) max = load;
    }
    return max;
  }, [telemetry]);

  const allTiles = useMemo(() =>
    Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
      const r = Math.floor(i / GRID_COLS);
      const c = i % GRID_COLS;
      return { r, c, id: `node-${r}-${c}` };
    }),
    [],
  );

  const detailNodeId = pinnedNodeId ?? hoveredId;
  const opsSubtitle = opsView === '3d'
    ? 'Drag to rotate - click bar to pin'
    : 'Full 11x11 world - click pins stats';

  return (
    <div className="map-panel map-panel--large map-panel--ops">
      <div className="map-header">
        <div className="map-header__title-wrap">
          <span className="map-title">OPS MAP</span>
          <span className="map-ops-subtitle">{opsSubtitle}</span>
        </div>
        <div className="map-ops-controls">
          <div className="map-ops-tabs">
            <button
              type="button"
              className={`map-ops-tab${opsView === 'heat' ? ' active' : ''}`}
              onClick={() => setOpsView('heat')}
            >
              HEAT
            </button>
            <button
              type="button"
              className={`map-ops-tab${opsView === '3d' ? ' active' : ''}`}
              onClick={() => setOpsView('3d')}
            >
              3D
            </button>
          </div>
          {opsView === '3d' && (
            <select
              className="map-ops-metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as TelemetryMetric)}
            >
              {TELEMETRY_METRICS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="map-body">
        {opsView === 'heat' ? (
          <div className="map-grid-wrap map-grid-wrap--full">
            <div className="map-grid map-grid--full">
              {allTiles.map(({ id }) => {
                const info = NODE_BIOMES[id];
                const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
                const isHovered = hoveredId === id;
                const isPinned = pinnedNodeId === id;
                const isDungeon = info?.isDungeon === true;
                const dungeonBadge = dungeonBadgeLabel(info);
                const tierBadge = info?.biomeTier === 0 ? '★' : `T${info?.biomeTier ?? '?'}`;
                const row = telemetry?.nodes[id];
                const heat = heatOpacity(row, maxNodeCpu);

                return (
                  <div
                    key={id}
                    className={[
                      'map-tile',
                      isDungeon ? 'map-tile--dungeon' : '',
                      isHovered ? 'map-tile--hovered' : '',
                      heat > 0 ? 'map-tile--ops-heat' : '',
                      isPinned ? 'map-tile--ops-pinned' : '',
                    ].filter(Boolean).join(' ')}
                    style={{
                      background: OPS_HEAT_TILE_BACKGROUND,
                      ...(heat > 0 ? { ['--heat' as string]: String(heat) } : {}),
                    }}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setPinnedNodeId(id)}
                    title="Click to pin telemetry"
                  >
                    <span className="map-tile__tier">{tierBadge}</span>
                    <span className="map-tile__name">{biome?.name ?? '?'}</span>
                    {dungeonBadge && <span className="map-tile__dungeon-badge">{dungeonBadge}</span>}
                    {isPinned && <span className="map-tile__ops-pin">◆ PIN</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <NodeTelemetryHistogram3D
            metric={metric}
            pinnedNodeId={pinnedNodeId}
            onSelect={setPinnedNodeId}
          />
        )}

        <div className="map-info-panel">
          {detailNodeId
            ? <NodeTelemetryPanel nodeId={detailNodeId} />
            : <div className="map-info__empty">Click a node to pin telemetry.</div>}
        </div>
      </div>
    </div>
  );
}
