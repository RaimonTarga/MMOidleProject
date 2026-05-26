import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { autoPathAtom, playerNodeIdAtom } from '../../hud/atoms';
import { MAX_VIEW_C, MAX_VIEW_R, VIEWPORT, tileColor } from './constants';
import { bfsPath, clampView, parseNodeId } from './pathing';
import { NodeInfo } from './NodeInfo';
import { OverviewMap } from './OverviewMap';
import '../map.css';

interface Props {
  onClose: () => void;
  highlightNodes?: string[];
  focusNodeId?: string | null;
}

export function MapPanel({ onClose, highlightNodes, focusNodeId }: Props) {
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const busAutoPath = useAtomValue(autoPathAtom);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [autoPath, setAutoPath] = useState<string[] | null>(null);

  // Keep path state in sync with GameScene via hudBus
  useEffect(() => setAutoPath(busAutoPath), [busAutoPath]);

  const pathSet = useMemo(() => new Set(autoPath ?? []), [autoPath]);
  const destNode = autoPath && autoPath.length > 0 ? autoPath[autoPath.length - 1] : null;

  function handleTileClick(id: string, isCurrent: boolean) {
    if (isCurrent || !playerNodeId) return;
    const path = bfsPath(playerNodeId, id);
    if (!path || path.length <= 1) return;
    hudBus.requestNavigateTo(path.slice(1)); // exclude the player's current node
    onClose();
  }

  // Derive player grid position
  const playerPos = playerNodeId ? parseNodeId(playerNodeId) : null;

  // Initialise viewport centered on focusNodeId if provided, otherwise on player.
  const [viewRow, setViewRow] = useState<number>(() => {
    const anchor = (focusNodeId ? parseNodeId(focusNodeId) : null) ?? playerPos;
    return anchor ? Math.max(0, Math.min(MAX_VIEW_R, anchor[0] - Math.floor(VIEWPORT / 2))) : 2;
  });
  const [viewCol, setViewCol] = useState<number>(() => {
    const anchor = (focusNodeId ? parseNodeId(focusNodeId) : null) ?? playerPos;
    return anchor ? Math.max(0, Math.min(MAX_VIEW_C, anchor[1] - Math.floor(VIEWPORT / 2))) : 2;
  });

  // Re-center when player's node changes, but keep an initial focused node centered.
  const skipFirstRecenter = useRef(!!focusNodeId);
  useEffect(() => {
    if (skipFirstRecenter.current) { skipFirstRecenter.current = false; return; }
    if (!playerPos) return;
    const [pr, pc] = playerPos;
    // Only re-center if player walked outside the current viewport
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

  return createPortal(
    <div className="map-overlay" onClick={handleOverlayClick}>
      <div className="map-panel map-panel--large">

        <div className="map-header">
          <span className="map-title">World Map</span>
          <OverviewMap viewRow={viewRow} viewCol={viewCol} playerNodeId={playerNodeId} pathSet={pathSet} destNode={destNode} />
          <button className="map-close" onClick={onClose}>✕</button>
        </div>

        <div className="map-body">

          {/* Grid + nav arrows */}
          <div className="map-grid-wrap">
            <button className="map-nav map-nav--up"    onClick={() => pan(-1,  0)} disabled={viewRow === 0}>▲</button>
            <button className="map-nav map-nav--left"  onClick={() => pan( 0, -1)} disabled={viewCol === 0}>◀</button>

            <div className="map-grid">
              {visibleTiles.map(({ r, c, id }) => {
                const info        = NODE_BIOMES[id];
                const biome       = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
                const isCurrent   = playerNodeId === id;
                const isHovered   = hoveredId === id;
                const isDungeon   = info?.isDungeon === true;
                const isDestination = id === destNode;
                const isPath      = !isDestination && !isCurrent && pathSet.has(id);
                const isHighlight = !!highlightNodes?.includes(id);
                const tierBadge   = info?.biomeTier === 0 ? '★' : `T${info?.biomeTier ?? '?'}`;

                return (
                  <div
                    key={id}
                    className={[
                      'map-tile',
                      isDungeon     ? 'map-tile--dungeon'     : '',
                      isCurrent     ? 'map-tile--current'     : '',
                      isHovered && !isCurrent ? 'map-tile--hovered' : '',
                      isPath        ? 'map-tile--path'        : '',
                      isDestination ? 'map-tile--destination' : '',
                      isHighlight   ? 'map-tile--highlight'   : '',
                    ].filter(Boolean).join(' ')}
                    style={{ background: tileColor(info?.biomeGroup ?? '') }}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleTileClick(id, isCurrent)}
                    title={isCurrent ? undefined : 'Click to navigate here'}
                  >
                    <span className="map-tile__tier">{tierBadge}</span>
                    <span className="map-tile__name">{biome?.name ?? '?'}</span>
                    {isDungeon    && <span className="map-tile__dungeon-badge">DUNGEON</span>}
                    {isCurrent    && <span className="map-tile__you">▼ YOU</span>}
                    {isDestination && <span className="map-tile__dest">★ DEST</span>}
                  </div>
                );
              })}
            </div>

            <button className="map-nav map-nav--right" onClick={() => pan( 0,  1)} disabled={viewCol === MAX_VIEW_C}>▶</button>
            <button className="map-nav map-nav--down"  onClick={() => pan( 1,  0)} disabled={viewRow === MAX_VIEW_R}>▼</button>
          </div>

          {/* Hover info */}
          <div className="map-info-panel">
            {hoveredId
              ? <NodeInfo nodeId={hoveredId} />
              : <div className="map-info__empty">Hover a zone to see details.</div>}
          </div>

        </div>
      </div>
    </div>,
    document.body,
  );
}
