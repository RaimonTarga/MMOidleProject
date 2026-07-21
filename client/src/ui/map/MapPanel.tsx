import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { NODE_BIOMES, BIOME_DATABASE, formatRespawnRemaining } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { autoPathAtom, bossFelledByNodeAtom, playerNodeIdAtom } from '../../hud/atoms';
import { MAX_VIEW_C, MAX_VIEW_R, VIEWPORT, dungeonBadgeLabel, tileColor } from './constants';
import { clampView, parseNodeId } from './pathing';
import { NodeInfo } from './NodeInfo';
import { BiomeIcon } from './BiomeIcon';
import { OverviewMap } from './OverviewMap';
import { useMapClock } from './useMapClock';
import { DEV_TOOLS_ENABLED } from '../../devTools';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import '../map.css';

interface Props {
  onClose: () => void;
  highlightNodes?: string[];
  focusNodeId?: string | null;
}

const SHOW_DEV_TELEPORT = DEV_TOOLS_ENABLED;

export function MapPanel({ onClose, highlightNodes, focusNodeId }: Props) {
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const bossFelledByNode = useAtomValue(bossFelledByNodeAtom);
  const mapNow = useMapClock();
  const busAutoPath = useAtomValue(autoPathAtom);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(focusNodeId ?? playerNodeId ?? null);
  const [autoPath, setAutoPath] = useState<string[] | null>(null);

  useEffect(() => setAutoPath(busAutoPath), [busAutoPath]);

  // Default the selection to the player's node once it's known (panel opens populated).
  useEffect(() => {
    if (!selectedId && playerNodeId) setSelectedId(playerNodeId);
  }, [playerNodeId, selectedId]);

  const pathSet = useMemo(() => new Set(autoPath ?? []), [autoPath]);
  const destNode = autoPath && autoPath.length > 0 ? autoPath[autoPath.length - 1] : null;

  // Clicking a tile selects it (shows details). Travel is an explicit button in
  // NodeInfo, so selecting never moves the player or closes the panel.
  function handleTileClick(id: string, e: React.MouseEvent) {
    if (SHOW_DEV_TELEPORT && e.shiftKey) {
      hudBus.requestTeleportToNode(id);
      onClose();
      return;
    }
    setSelectedId(id);
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

  const visibleTiles = useMemo(() =>
    Array.from({ length: VIEWPORT * VIEWPORT }, (_, i) => {
      const r = viewRow + Math.floor(i / VIEWPORT);
      const c = viewCol + (i % VIEWPORT);
      return { r, c, id: `node-${r}-${c}` };
    }),
    [viewRow, viewCol],
  );

  return (
    <GameDialog size="wide" className="map-dialog" onClose={onClose}>
      <DialogHeader
        title="World Map"
        closeLabel="Close world map"
        actions={
          <OverviewMap
            viewRow={viewRow}
            viewCol={viewCol}
            playerNodeId={playerNodeId}
            pathSet={pathSet}
            destNode={destNode}
            bossFelledByNode={bossFelledByNode}
          />
        }
      />

      <div className="map-body">
        <div className="map-grid-wrap">
          <button className="map-nav map-nav--up"    onClick={() => pan(-1,  0)} disabled={viewRow === 0}>▲</button>
          <button className="map-nav map-nav--left"  onClick={() => pan( 0, -1)} disabled={viewCol === 0}>◀</button>

            <div className="map-grid">
              {visibleTiles.map(({ id }) => {
                const info          = NODE_BIOMES[id];
                const biome         = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
                const isCurrent     = playerNodeId === id;
                const isHovered     = hoveredId === id;
                const isSelected    = selectedId === id;
                const isDungeon     = info?.isDungeon === true;
                const dungeonBadge  = dungeonBadgeLabel(info);
                const isDestination = id === destNode;
                const isPath        = !isDestination && !isCurrent && pathSet.has(id);
                const isHighlight   = !!highlightNodes?.includes(id);
                const tierBadge     = info?.biomeTier === 0 ? '★' : `T${info?.biomeTier ?? '?'}`;
                const felled        = bossFelledByNode[id];
                const isOverlordFelled =
                  felled?.monsterTypeId === 'void-overlord' && felled.respawnAt > mapNow;

                return (
                  <div
                    key={id}
                    className={[
                      'map-tile',
                      isDungeon       ? 'map-tile--dungeon'       : '',
                      isOverlordFelled ? 'map-tile--felled'       : '',
                      isSelected      ? 'map-tile--selected'      : '',
                      isCurrent       ? 'map-tile--current'       : '',
                      isHovered && !isCurrent ? 'map-tile--hovered' : '',
                      isPath          ? 'map-tile--path'          : '',
                      isDestination   ? 'map-tile--destination'   : '',
                      isHighlight     ? 'map-tile--highlight'     : '',
                    ].filter(Boolean).join(' ')}
                    style={{ background: tileColor(info?.biomeGroup ?? '') }}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => handleTileClick(id, e)}
                    title={SHOW_DEV_TELEPORT ? 'Click to view details. Shift+Click to teleport.' : 'Click to view details'}
                  >
                    <span className="map-tile__tier">{tierBadge}</span>
                    {info && <BiomeIcon biomeGroup={info.biomeGroup} size={38} className="map-tile__icon" />}
                    <span className="map-tile__name">{biome?.name ?? '?'}</span>
                    {dungeonBadge   && <span className="map-tile__dungeon-badge">{dungeonBadge}</span>}
                    {isOverlordFelled && (
                      <>
                        <span className="map-tile__felled-badge">[FELLED]</span>
                        <span className="map-tile__felled-timer">
                          {formatRespawnRemaining(felled.respawnAt, mapNow)}
                        </span>
                      </>
                    )}
                    {isCurrent      && <span className="map-tile__you">▼ YOU</span>}
                    {isDestination  && <span className="map-tile__dest">★ DEST</span>}
                  </div>
                );
              })}
            </div>

            <button className="map-nav map-nav--right" onClick={() => pan( 0,  1)} disabled={viewCol === MAX_VIEW_C}>▶</button>
            <button className="map-nav map-nav--down"  onClick={() => pan( 1,  0)} disabled={viewRow === MAX_VIEW_R}>▼</button>
        </div>

        <div className="map-info-panel">
          {selectedId
            ? <NodeInfo nodeId={selectedId} playerNodeId={playerNodeId} onClose={onClose} />
            : <div className="map-info__empty">Select a zone to see details.</div>}
        </div>
      </div>
    </GameDialog>
  );
}
