import { NODE_BIOMES } from '@mmo-idle/shared';
import { GRID_COLS, GRID_ROWS, VIEWPORT, tileColor } from './constants';
import { parseNodeId } from './pathing';

interface OverviewProps {
  viewRow: number; viewCol: number;
  playerNodeId: string | null;
  pathSet: Set<string>;
  destNode: string | null;
}

export function OverviewMap({ viewRow, viewCol, playerNodeId, pathSet, destNode }: OverviewProps) {
  const playerPos = playerNodeId ? parseNodeId(playerNodeId) : null;
  return (
    <div className="map-overview">
      {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
        const r = Math.floor(i / GRID_COLS);
        const c = i % GRID_COLS;
        const id   = `node-${r}-${c}`;
        const info = NODE_BIOMES[id];
        const inView  = r >= viewRow && r < viewRow + VIEWPORT && c >= viewCol && c < viewCol + VIEWPORT;
        const isPlayer = playerPos?.[0] === r && playerPos?.[1] === c;
        const isDest  = id === destNode;
        const isPath  = !isDest && pathSet.has(id);
        return (
          <div
            key={id}
            className={[
              'map-overview-cell',
              inView   ? 'map-overview-cell--inview' : '',
              isPlayer ? 'map-overview-cell--player' : '',
              info?.isDungeon ? 'map-overview-cell--dungeon' : '',
              isPath   ? 'map-overview-cell--path' : '',
              isDest   ? 'map-overview-cell--destination' : '',
            ].filter(Boolean).join(' ')}
            style={{ background: tileColor(info?.biomeGroup ?? '') }}
          />
        );
      })}
    </div>
  );
}
