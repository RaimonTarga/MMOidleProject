import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { autoPathAtom, nodeTelemetryAtom, playerNodeIdAtom } from '../../hud/atoms';
import { MAX_VIEW_C, MAX_VIEW_R, VIEWPORT, tileColor } from './constants';
import { bfsPath, clampView, parseNodeId } from './pathing';
import { NodeInfo } from './NodeInfo';
import { NodeTelemetryHistogram3D } from './NodeTelemetryHistogram3D';
import { NodeTelemetryPanel } from './NodeTelemetryPanel';
import { OverviewMap } from './OverviewMap';
import { TELEMETRY_METRICS, type TelemetryMetric } from './telemetryMetrics';
import '../map.css';

interface Props {
  onClose: () => void;
  highlightNodes?: string[];
  focusNodeId?: string | null;
}

type OpsView = 'heat' | '3d';

function heatOpacity(row: { tickCpuMs: number; idlePopulationMs: number } | undefined, maxCpu: number): number {
  if (!row || maxCpu <= 0) return 0;
  const load = row.tickCpuMs + row.idlePopulationMs;
  const normalized = load / maxCpu;
  return 0.15 + Math.min(1, normalized) * 0.4;
}

export function MapPanel({ onClose, highlightNodes, focusNodeId }: Props) {
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const telemetry = useAtomValue(nodeTelemetryAtom);
  const busAutoPath = useAtomValue(autoPathAtom);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const [opsMode, setOpsMode] = useState(false);
  const [opsView, setOpsView] = useState<OpsView>('heat');
  const [metric, setMetric] = useState<TelemetryMetric>('tickCpuMs');
  const [autoPath, setAutoPath] = useState<string[] | null>(null);

  useEffect(() => setAutoPath(busAutoPath), [busAutoPath]);

  useEffect(() => {
    if (!opsMode) {
      setPinnedNodeId(null);
      setOpsView('heat');
      setMetric('tickCpuMs');
    }
  }, [opsMode]);

  const pathSet = useMemo(() => new Set(autoPath ?? []), [autoPath]);
  const destNode = autoPath && autoPath.length > 0 ? autoPath[autoPath.length - 1] : null;

  const maxNodeCpu = useMemo(() => {
    if (!telemetry) return 0;
    let max = 0;
    for (const row of Object.values(telemetry.nodes)) {
      const load = row.tickCpuMs + row.idlePopulationMs;
      if (load > max) max = load;
    }
    return max;
  }, [telemetry]);

  const detailNodeId = opsMode ? (pinnedNodeId ?? hoveredId) : hoveredId;

  function handleTileClick(id: string, isCurrent: boolean) {
    if (opsMode) {
      setPinnedNodeId(id);
      return;
    }
    if (isCurrent || !playerNodeId) return;
    const path = bfsPath(playerNodeId, id);
    if (!path || path.length <= 1) return;
    hudBus.requestNavigateTo(path.slice(1));
    onClose();
  }

  const playerPos = playerNodeId ? parseNodeId(playerNodeId) : null;

  const [viewRow, setViewRow] = useState<number>(() => {
    const anchor = (focusNodeId ? parseNodeId(focusNodeId) : null) ?? playerPos;
    return anchor ? Math.max(0, Math.min(MAX_VIEW_R, anchor[0] - Math.floor(VIEWPORT / 2))) : 2;
  });
  const [viewCol, setViewCol] = useState<number>(() => {
    const anchor = (focusNodeId ? parseNodeId(focusNodeId) : null) ?? playerPos;
    return anchor ? Math.max(0, Math.min(MAX_VIEW_C, anchor[1] - Math.floor(VIEWPORT / 2))) : 2;
  });

  const skipFirstRecenter = useRef(!!focusNodeId);
  useEffect(() => {
    if (skipFirstRecenter.current) { skipFirstRecenter.current = false; return; }
    if (!playerPos) return;
    const [pr, pc] = playerPos;
    const outOfView = pr < viewRow || pr >= viewRow + VIEWPORT || pc < viewCol || pc >= viewCol + VIEWPORT;
    if (outOfView) {
      const [nr, nc] = clampView(pr - Math.floor(VIEWPORT / 2), pc - Math.floor(VIEWPORT / 2));
      setViewRow(nr);
      setViewCol(nc);
    }
  }, [playerNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  function pan(dr: number, dc: number) {
    setViewRow(r => Math.max(0, Math.min(MAX_VIEW_R, r + dr)));
    setViewCol(c => Math.max(0, Math.min(MAX_VIEW_C, c + dc)));
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const visibleTiles = useMemo(() =>
    Array.from({ length: VIEWPORT * VIEWPORT }, (_, i) => {
      const r = viewRow + Math.floor(i / VIEWPORT);
      const c = viewCol + (i % VIEWPORT);
      return { r, c, id: `node-${r}-${c}` };
    }),
    [viewRow, viewCol],
  );

  const panelClass = ['map-panel', 'map-panel--large', opsMode ? 'map-panel--ops' : '']
    .filter(Boolean)
    .join(' ');

  const opsSubtitle = opsView === '3d'
    ? 'Drag to rotate — click bar to pin'
    : 'Click pins stats — navigation disabled';

  return createPortal(
    <div className="map-overlay" onClick={handleOverlayClick}>
      <div className={panelClass}>

        <div className="map-header">
          <div className="map-header__title-wrap">
            <span className="map-title">{opsMode ? 'OPS MAP' : 'World Map'}</span>
            {opsMode && (
              <span className="map-ops-subtitle">{opsSubtitle}</span>
            )}
          </div>
          {opsMode && (
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
                  {TELEMETRY_METRICS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <OverviewMap viewRow={viewRow} viewCol={viewCol} playerNodeId={playerNodeId} pathSet={pathSet} destNode={destNode} />
          <button
            type="button"
            className={`map-ops-toggle${opsMode ? ' active' : ''}`}
            onClick={() => setOpsMode(v => !v)}
          >
            OPS
          </button>
          <button className="map-close" onClick={onClose}>✕</button>
        </div>

        <div className="map-body">
          {(!opsMode || opsView === 'heat') ? (
            <div className="map-grid-wrap">
              <button className="map-nav map-nav--up"    onClick={() => pan(-1,  0)} disabled={viewRow === 0}>▲</button>
              <button className="map-nav map-nav--left"  onClick={() => pan( 0, -1)} disabled={viewCol === 0}>◀</button>

              <div className="map-grid">
                {visibleTiles.map(({ id }) => {
                  const info          = NODE_BIOMES[id];
                  const biome         = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
                  const isCurrent     = playerNodeId === id;
                  const isHovered     = hoveredId === id;
                  const isPinned      = opsMode && pinnedNodeId === id;
                  const isDungeon     = info?.isDungeon === true;
                  const isDestination = id === destNode;
                  const isPath        = !opsMode && !isDestination && !isCurrent && pathSet.has(id);
                  const isHighlight   = !!highlightNodes?.includes(id);
                  const tierBadge     = info?.biomeTier === 0 ? '★' : `T${info?.biomeTier ?? '?'}`;
                  const row           = telemetry?.nodes[id];
                  const heat          = opsMode ? heatOpacity(row, maxNodeCpu) : 0;

                  return (
                    <div
                      key={id}
                      className={[
                        'map-tile',
                        isDungeon       ? 'map-tile--dungeon'       : '',
                        isCurrent       ? 'map-tile--current'       : '',
                        isHovered && !isCurrent ? 'map-tile--hovered' : '',
                        isPath          ? 'map-tile--path'          : '',
                        isDestination   ? 'map-tile--destination'   : '',
                        isHighlight     ? 'map-tile--highlight'     : '',
                        opsMode && heat > 0 ? 'map-tile--ops-heat' : '',
                        isPinned        ? 'map-tile--ops-pinned'    : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        background: tileColor(info?.biomeGroup ?? ''),
                        ...(opsMode && heat > 0 ? { ['--heat' as string]: String(heat) } : {}),
                      }}
                      onMouseEnter={() => setHoveredId(id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleTileClick(id, isCurrent)}
                      title={opsMode ? 'Click to pin telemetry' : (isCurrent ? undefined : 'Click to navigate here')}
                    >
                      <span className="map-tile__tier">{tierBadge}</span>
                      <span className="map-tile__name">{biome?.name ?? '?'}</span>
                      {isDungeon      && <span className="map-tile__dungeon-badge">DUNGEON</span>}
                      {isCurrent      && <span className="map-tile__you">▼ YOU</span>}
                      {isDestination  && !opsMode && <span className="map-tile__dest">★ DEST</span>}
                      {isPinned       && <span className="map-tile__ops-pin">◆ PIN</span>}
                    </div>
                  );
                })}
              </div>

              <button className="map-nav map-nav--right" onClick={() => pan( 0,  1)} disabled={viewCol === MAX_VIEW_C}>▶</button>
              <button className="map-nav map-nav--down"  onClick={() => pan( 1,  0)} disabled={viewRow === MAX_VIEW_R}>▼</button>
            </div>
          ) : (
            <NodeTelemetryHistogram3D
              metric={metric}
              pinnedNodeId={pinnedNodeId}
              playerNodeId={playerNodeId}
              onSelect={setPinnedNodeId}
            />
          )}

          <div className="map-info-panel">
            {opsMode
              ? (detailNodeId
                ? <NodeTelemetryPanel nodeId={detailNodeId} />
                : <div className="map-info__empty">Click a node to pin telemetry.</div>)
              : (hoveredId
                ? <NodeInfo nodeId={hoveredId} />
                : <div className="map-info__empty">Hover a zone to see details.</div>)}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
