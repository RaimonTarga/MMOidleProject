import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtomValue } from 'jotai';
import {
  BIOME_DATABASE,
  NODE_BIOMES,
  NODE_MODIFIERS,
  PACE_FAMILY_COLORS,
  PACE_FAMILY_LABELS,
  PACE_FAMILY_SUMMARIES,
  WORLD_MAP_BOUNDS,
  WORLD_NODE_LIST,
  WORLD_REGIONS,
  mapCoordForNodeId,
  worldNodeExits,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  autoPathAtom,
  bossFelledByNodeAtom,
  playerNodeIdAtom,
} from '../../hud/atoms';
import {
  DUNGEON_ICON,
  dungeonBadgeLabel,
  mapTierColor,
  tileColor,
} from './constants';
import { NodeInfo } from './NodeInfo';
import { BiomeIcon } from './BiomeIcon';
import { PaceIcon } from './PaceIcon';
import { atlasIcon, GameIcon } from '../GameIcon';
import { DEV_TOOLS_ENABLED } from '../../devTools';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import '../map.css';

interface Props {
  onClose: () => void;
  highlightNodes?: string[];
  focusNodeId?: string | null;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
}

const CELL_STEP = 82;
const NODE_SIZE = 70;
const MIN_SCALE = 0.35;
const MAX_SCALE = 1.65;
const DRAG_THRESHOLD_PX = 5;

function clampScale(scale: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

export function MapPanel({ onClose, highlightNodes, focusNodeId }: Props) {
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const bossFelledByNode = useAtomValue(bossFelledByNodeAtom);
  const busAutoPath = useAtomValue(autoPathAtom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(
    new Map<
      number,
      { x: number; y: number; startX: number; startY: number }
    >(),
  );
  const movedRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    focusNodeId ?? playerNodeId ?? null,
  );
  const [autoPath, setAutoPath] = useState<string[] | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 24, y: 24, scale: 0.7 });
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [biomeFilter, setBiomeFilter] = useState('all');

  useEffect(() => setAutoPath(busAutoPath), [busAutoPath]);
  useEffect(() => {
    if (!selectedId && playerNodeId) setSelectedId(playerNodeId);
  }, [playerNodeId, selectedId]);

  const pathSet = useMemo(() => new Set(autoPath ?? []), [autoPath]);
  const highlightSet = useMemo(
    () => new Set(highlightNodes ?? []),
    [highlightNodes],
  );
  const destNode =
    autoPath && autoPath.length > 0 ? autoPath[autoPath.length - 1] : null;
  const worldWidth = WORLD_MAP_BOUNDS.cols * CELL_STEP;
  const worldHeight = WORLD_MAP_BOUNDS.rows * CELL_STEP;

  const fitWorld = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = clampScale(
      Math.min((rect.width - 48) / worldWidth, (rect.height - 48) / worldHeight),
    );
    setCamera({
      scale,
      x: (rect.width - worldWidth * scale) / 2,
      y: (rect.height - worldHeight * scale) / 2,
    });
  }, [worldHeight, worldWidth]);

  const centerNode = useCallback((nodeId: string | null | undefined) => {
    if (!nodeId) return;
    const coord = mapCoordForNodeId(nodeId);
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!coord || !rect) return;
    setCamera((current) => ({
      ...current,
      x:
        rect.width / 2 -
        (coord.col - WORLD_MAP_BOUNDS.minCol + 0.5) *
          CELL_STEP *
          current.scale,
      y:
        rect.height / 2 -
        (coord.row - WORLD_MAP_BOUNDS.minRow + 0.5) *
          CELL_STEP *
          current.scale,
    }));
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      fitWorld();
      requestAnimationFrame(() => centerNode(focusNodeId ?? playerNodeId));
    });
    return () => cancelAnimationFrame(frame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function zoomAt(nextScale: number, clientX?: number, clientY?: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const anchorX = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const anchorY = (clientY ?? rect.top + rect.height / 2) - rect.top;
    setCamera((current) => {
      const scale = clampScale(nextScale);
      const worldX = (anchorX - current.x) / current.scale;
      const worldY = (anchorY - current.y) / current.scale;
      return {
        scale,
        x: anchorX - worldX * scale,
        y: anchorY - worldY * scale,
      };
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
    });
    movedRef.current = false;

    if (pointersRef.current.size > 1) {
      movedRef.current = true;
      for (const pointerId of pointersRef.current.keys()) {
        if (!event.currentTarget.hasPointerCapture(pointerId)) {
          event.currentTarget.setPointerCapture(pointerId);
        }
      }
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous) return;
    const before = [...pointersRef.current.values()];
    pointersRef.current.set(event.pointerId, {
      ...previous,
      x: event.clientX,
      y: event.clientY,
    });
    const after = [...pointersRef.current.values()];

    if (after.length === 1) {
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      const distanceFromStart = Math.hypot(
        event.clientX - previous.startX,
        event.clientY - previous.startY,
      );
      if (!movedRef.current && distanceFromStart < DRAG_THRESHOLD_PX) return;
      if (!movedRef.current) {
        movedRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setCamera((current) => ({
        ...current,
        x: current.x + dx,
        y: current.y + dy,
      }));
      return;
    }

    if (before.length === 2 && after.length === 2) {
      const oldMid = {
        x: (before[0].x + before[1].x) / 2,
        y: (before[0].y + before[1].y) / 2,
      };
      const newMid = {
        x: (after[0].x + after[1].x) / 2,
        y: (after[0].y + after[1].y) / 2,
      };
      const oldDistance = Math.hypot(
        before[0].x - before[1].x,
        before[0].y - before[1].y,
      );
      const newDistance = Math.hypot(
        after[0].x - after[1].x,
        after[0].y - after[1].y,
      );
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect || oldDistance === 0) return;
      movedRef.current = true;
      setCamera((current) => {
        const scale = clampScale(current.scale * (newDistance / oldDistance));
        const oldLocalX = oldMid.x - rect.left;
        const oldLocalY = oldMid.y - rect.top;
        const newLocalX = newMid.x - rect.left;
        const newLocalY = newMid.y - rect.top;
        const worldX = (oldLocalX - current.x) / current.scale;
        const worldY = (oldLocalY - current.y) / current.scale;
        return {
          scale,
          x: newLocalX - worldX * scale,
          y: newLocalY - worldY * scale,
        };
      });
    }
  }

  function releasePointer(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTileClick(id: string, event: React.MouseEvent) {
    if (movedRef.current) return;
    if (DEV_TOOLS_ENABLED && event.shiftKey) {
      hudBus.requestTeleportToNode(id);
      onClose();
      return;
    }
    setSelectedId(id);
  }

  const biomeOptions = useMemo(
    () =>
      [...new Set(WORLD_NODE_LIST.map((node) => node.biomeGroup))]
        .sort()
        .filter((biome) => biome !== 'clearing' && biome !== 'sanctuary'),
    [],
  );
  const normalizedQuery = query.trim().toLowerCase();

  function nodeMatches(nodeId: string): boolean {
    const node = NODE_BIOMES[nodeId];
    if (!node) return false;
    if (tierFilter !== 'all' && node.regionId !== tierFilter) return false;
    if (biomeFilter !== 'all' && node.biomeGroup !== biomeFilter) return false;
    if (!normalizedQuery) return true;
    const modifier = NODE_MODIFIERS[nodeId];
    return [
      node.displayName,
      node.biomeGroup,
      modifier?.pace,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  }

  const regionLabels = useMemo(
    () =>
      [...WORLD_REGIONS.values()].map((region) => {
        const nodes = WORLD_NODE_LIST.filter(
          (node) => node.regionId === region.id,
        );
        return {
          ...region,
          row:
            nodes.reduce((sum, node) => sum + node.map.row, 0) / nodes.length,
          col:
            nodes.reduce((sum, node) => sum + node.map.col, 0) / nodes.length,
        };
      }),
    [],
  );

  return (
    <GameDialog size="wide" className="map-dialog" onClose={onClose}>
      <DialogHeader
        title="World Map"
        closeLabel="Close world map"
      />

      <div className="world-map-toolbar">
        <input
          className="world-map-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find biome, modifier, or place…"
          aria-label="Search world map"
        />
        <select
          value={tierFilter}
          onChange={(event) => setTierFilter(event.target.value)}
          aria-label="Filter by tier"
        >
          <option value="all">All tiers</option>
          {[...WORLD_REGIONS.values()].map((region) => (
            <option key={region.id} value={region.id}>Tier {region.tier}</option>
          ))}
        </select>
        <select value={biomeFilter} onChange={(event) => setBiomeFilter(event.target.value)}>
          <option value="all">All biomes</option>
          {biomeOptions.map((biome) => (
            <option key={biome} value={biome}>
              {BIOME_DATABASE.get(biome)?.name ?? biome}
            </option>
          ))}
        </select>
        <span className="world-map-toolbar__hint">Drag · wheel or pinch to zoom</span>
      </div>

      <div className="map-body map-body--world">
        <div
          ref={viewportRef}
          className="world-map-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onWheel={(event) => {
            event.preventDefault();
            zoomAt(
              camera.scale * Math.exp(-event.deltaY * 0.0012),
              event.clientX,
              event.clientY,
            );
          }}
        >
          <div className="world-map-void" />
          <div
            className="world-map-canvas"
            style={{
              width: worldWidth,
              height: worldHeight,
              transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
            }}
          >
            <svg
              className="world-map-routes"
              width={worldWidth}
              height={worldHeight}
              aria-hidden="true"
            >
              {WORLD_NODE_LIST.flatMap((node) => {
                const exits = worldNodeExits(node.id);
                return (['east', 'south'] as const).flatMap((direction) => {
                  const neighborId = exits[direction];
                  const neighbor = neighborId ? NODE_BIOMES[neighborId] : null;
                  if (!neighborId || !neighbor) return [];
                  const x1 =
                    (node.map.col - WORLD_MAP_BOUNDS.minCol) * CELL_STEP +
                    NODE_SIZE / 2;
                  const y1 =
                    (node.map.row - WORLD_MAP_BOUNDS.minRow) * CELL_STEP +
                    NODE_SIZE / 2;
                  const x2 =
                    (neighbor.map.col - WORLD_MAP_BOUNDS.minCol) * CELL_STEP +
                    NODE_SIZE / 2;
                  const y2 =
                    (neighbor.map.row - WORLD_MAP_BOUNDS.minRow) * CELL_STEP +
                    NODE_SIZE / 2;
                  const onPath =
                    pathSet.has(node.id) && pathSet.has(neighborId);
                  return (
                    <line
                      key={`${node.id}-${neighborId}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={
                        onPath
                          ? 'world-map-route world-map-route--path'
                          : 'world-map-route'
                      }
                    />
                  );
                });
              })}
            </svg>

            {regionLabels.map((region) => (
              <span
                key={region.id}
                className="world-map-region-label"
                style={{
                  left:
                    (region.col - WORLD_MAP_BOUNDS.minCol + 0.5) * CELL_STEP,
                  top:
                    (region.row - WORLD_MAP_BOUNDS.minRow + 0.5) * CELL_STEP,
                }}
              >
                {region.displayName}
              </span>
            ))}

            {WORLD_NODE_LIST.map((node) => {
              const info = NODE_BIOMES[node.id];
              const biome = BIOME_DATABASE.get(node.biomeGroup);
              const modifier = NODE_MODIFIERS[node.id];
              const isCurrent = playerNodeId === node.id;
              const isSelected = selectedId === node.id;
              const isDestination = node.id === destNode;
              const isPath = !isCurrent && pathSet.has(node.id);
              const isFelled =
                (bossFelledByNode[node.id]?.respawnAt ?? 0) > Date.now();
              const dungeonBadge = dungeonBadgeLabel(info);
              const matches = nodeMatches(node.id);

              return (
                <button
                  key={node.id}
                  type="button"
                  className={[
                    'world-map-node',
                    node.kind === 'dungeon' ? 'world-map-node--dungeon' : '',
                    node.kind === 'sanctuary' ? 'world-map-node--sanctuary' : '',
                    node.kind === 'tutorial' ? 'world-map-node--tutorial' : '',
                    isCurrent ? 'world-map-node--current' : '',
                    isSelected ? 'world-map-node--selected' : '',
                    isPath ? 'world-map-node--path' : '',
                    isDestination ? 'world-map-node--destination' : '',
                    highlightSet.has(node.id)
                      ? 'world-map-node--highlight'
                      : '',
                    isFelled ? 'world-map-node--felled' : '',
                    !matches ? 'world-map-node--filtered' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    left:
                      (node.map.col - WORLD_MAP_BOUNDS.minCol) * CELL_STEP,
                    top:
                      (node.map.row - WORLD_MAP_BOUNDS.minRow) * CELL_STEP,
                    background: tileColor(node.biomeGroup),
                  }}
                  onClick={(event) => handleTileClick(node.id, event)}
                  title={`${node.displayName}${DEV_TOOLS_ENABLED ? ' · Shift+Click to teleport' : ''}`}
                >
                  {node.kind !== 'tutorial' && (
                    <span
                      className="world-map-node__tier"
                      style={{
                        background: mapTierColor(node.biomeTier),
                        color: '#090a0d',
                      }}
                      title={`Tier ${node.biomeTier}`}
                    >
                      T{node.biomeTier}
                    </span>
                  )}
                  <BiomeIcon
                    biomeGroup={node.biomeGroup}
                    size={30}
                    className={[
                      'world-map-node__icon',
                      node.kind === 'dungeon'
                        ? 'world-map-node__icon--dungeon'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                  <span className="world-map-node__name">
                    {node.kind === 'sanctuary'
                      ? 'Sanctuary'
                      : biome?.name ?? node.biomeGroup}
                  </span>
                  {modifier && (
                    <span
                      className="world-map-node__pace"
                      style={{
                        background: PACE_FAMILY_COLORS[modifier.pace],
                      }}
                      title={`${PACE_FAMILY_LABELS[modifier.pace]} — ${PACE_FAMILY_SUMMARIES[modifier.pace]}`}
                    >
                      <PaceIcon pace={modifier.pace} size={16} />
                    </span>
                  )}
                  {dungeonBadge && (
                    <span className="world-map-node__dungeon" title="Dungeon">
                      <GameIcon
                        source={atlasIcon(DUNGEON_ICON)}
                        size={14}
                        fallback={null}
                        decorative
                      />
                    </span>
                  )}
                  {isCurrent && (
                    <span className="world-map-node__you">YOU</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="world-map-controls">
            <button
              type="button"
              onClick={() => zoomAt(camera.scale * 1.2)}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomAt(camera.scale / 1.2)}
              aria-label="Zoom out"
            >
              −
            </button>
            <button type="button" onClick={fitWorld}>FIT</button>
            <button
              type="button"
              onClick={() => centerNode(playerNodeId)}
              disabled={!playerNodeId}
            >
              YOU
            </button>
          </div>
        </div>

        <div className="map-info-panel world-map-info-panel">
          {selectedId ? (
            <NodeInfo
              nodeId={selectedId}
              playerNodeId={playerNodeId}
              onClose={onClose}
            />
          ) : (
            <div className="map-info__empty">Select a place to see details.</div>
          )}
        </div>
      </div>
    </GameDialog>
  );
}
