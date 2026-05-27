import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { BIOME_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import { nodeTelemetryAtom } from '../../hud/atoms';
import { GRID_ROWS, GRID_COLS } from './constants';
import { extractMetric, formatMetricValue, type TelemetryMetric } from './telemetryMetrics';

interface Props {
  metric: TelemetryMetric;
  pinnedNodeId: string | null;
  playerNodeId: string | null;
  onSelect: (nodeId: string) => void;
}

const MAX_BAR_PX = 120;
const INITIAL_ROT_X = 58;
const INITIAL_ROT_Y = -32;
const DRAG_THRESHOLD_PX = 4;

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

function nodeLabel(nodeId: string): { name: string; tierLabel: string } {
  const info = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
  if (!info || !biome) return { name: nodeId, tierLabel: '' };
  const tierLabel = info.biomeTier === 0 ? 'Starting Zone' : `T${info.biomeTier}`;
  return { name: biome.name, tierLabel };
}

function findBarAt(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY);
  const bar = (el as HTMLElement | null)?.closest<HTMLElement>('[data-histogram-node-id]');
  return bar?.dataset.histogramNodeId ?? null;
}

export function NodeTelemetryHistogram3D({
  metric,
  pinnedNodeId,
  playerNodeId,
  onSelect,
}: Props) {
  const snap = useAtomValue(nodeTelemetryAtom);
  const [rotX, setRotX] = useState(INITIAL_ROT_X);
  const [rotY, setRotY] = useState(INITIAL_ROT_Y);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; rx: number; ry: number; moved: boolean } | null>(null);

  const { entries, maxValue } = useMemo(() => {
    const out: Array<{
      id: string;
      row: number;
      col: number;
      value: number;
      flagged: boolean;
      orphan: boolean;
    }> = [];
    let max = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const id = `node-${r}-${c}`;
        const tRow = snap?.nodes[id];
        const value = tRow ? extractMetric(tRow, metric) : 0;
        if (value > max) max = value;
        out.push({
          id,
          row: r,
          col: c,
          value,
          flagged: !!tRow && tRow.leakFlags.length > 0,
          orphan: !!tRow && !tRow.occupied && tRow.idlePopulationMs > 0,
        });
      }
    }
    return { entries: out, maxValue: Math.max(1, max) };
  }, [snap, metric]);

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) d.moved = true;
      setRotY(d.ry + dx * 0.4);
      setRotX(clamp(25, 80, d.rx + dy * 0.3));
      if (d.moved && hover) setHover(null);
      return;
    }
    const id = findBarAt(e.clientX, e.clientY);
    if (id) {
      if (!hover || hover.id !== id || hover.x !== e.clientX || hover.y !== e.clientY) {
        setHover({ id, x: e.clientX, y: e.clientY });
      }
    } else if (hover) {
      setHover(null);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.moved) return;
    const id = findBarAt(e.clientX, e.clientY);
    if (id) onSelect(id);
  }

  function onPointerLeave() {
    setHover(null);
  }

  const tooltip = (() => {
    if (!hover) return null;
    const { name, tierLabel } = nodeLabel(hover.id);
    const row = snap?.nodes[hover.id];
    const value = row ? extractMetric(row, metric) : 0;
    return createPortal(
      <div
        className="map-histogram-tooltip"
        style={{ left: hover.x, top: hover.y - 12 }}
      >
        <div className="map-histogram-tooltip__name">
          {name}
          {tierLabel && <span className="map-histogram-tooltip__tier">{tierLabel}</span>}
        </div>
        <div className="map-histogram-tooltip__value">{formatMetricValue(value, metric)}</div>
        <div className="map-histogram-tooltip__id">{hover.id}</div>
      </div>,
      document.body,
    );
  })();

  return (
    <div
      className="map-histogram-viewport"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="map-histogram-world"
        style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
      >
        <div className="map-histogram-floor" />
        <div className="map-histogram-grid">
          {entries.map(({ id, value, flagged, orphan }) => {
            const h = Math.min(1, value / maxValue) * MAX_BAR_PX;
            return (
              <div key={id} className="map-histogram-cell">
                <button
                  type="button"
                  data-histogram-node-id={id}
                  className={[
                    'map-histogram-bar',
                    pinnedNodeId === id ? 'map-histogram-bar--pinned' : '',
                    playerNodeId === id ? 'map-histogram-bar--player' : '',
                    flagged ? 'map-histogram-bar--leak' : '',
                    orphan ? 'map-histogram-bar--orphan' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ height: `${h}px` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      {!snap && <div className="map-histogram-empty">No telemetry yet.</div>}
      {tooltip}
    </div>
  );
}
