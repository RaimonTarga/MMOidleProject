import { createPortal } from 'react-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { PlayerView } from '@mmo-idle/shared';
import type { ItemStats } from '@mmo-idle/shared';
import {
  NODE_BIOMES, BIOME_DATABASE, MONSTER_DATABASE, RECIPE_DATABASE,
  GAME_CONFIG, ESSENCE_COLORS, biomeXpForLevel, biomeLevelCap,
} from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './map.css';

const GRID_ROWS  = 11;
const GRID_COLS  = 11;
const VIEWPORT   = 5;   // visible tiles per axis
const MAX_VIEW_R = GRID_ROWS - VIEWPORT; // 6
const MAX_VIEW_C = GRID_COLS - VIEWPORT; // 6

const BIOME_TILE_COLORS: Record<string, string> = {
  clearing:   '#2e5e2e',
  forest:     '#1a4018',
  mountain:   '#3e3e50',
  plains:     '#4e5e1a',
  swamp:      '#1a3a0c',
  cave:       '#1a1a24',
  jungle:     '#0c3014',
  tundra:     '#222e48',
  desert:     '#5a4010',
  volcanic:   '#4a1010',
  necropolis: '#1e0e2a',
  abyss:      '#0a0612',
};

function tileColor(biomeGroup: string): string {
  return BIOME_TILE_COLORS[biomeGroup] ?? '#1a1a2e';
}
function hexDot(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
const STAT_LABELS: Record<string, string> = {
  attack: 'ATK', defense: 'DEF', maxHp: 'HP',
  hpRegen: 'REGEN', speed: 'SPD', attackRange: 'RNG', attackCooldown: 'CD',
};
function formatStat(stats: Partial<ItemStats>): string {
  return Object.entries(stats)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `+${v} ${STAT_LABELS[k] ?? k}`)
    .join(' · ');
}

// Parse "node-{r}-{c}" → [r, c] or null
function parseNodeId(id: string): [number, number] | null {
  const p = id.split('-');
  if (p.length !== 3) return null;
  const r = parseInt(p[1], 10);
  const c = parseInt(p[2], 10);
  return isNaN(r) || isNaN(c) ? null : [r, c];
}

// Clamp viewport so player node is visible
function clampView(r: number, c: number): [number, number] {
  return [
    Math.max(0, Math.min(MAX_VIEW_R, r)),
    Math.max(0, Math.min(MAX_VIEW_C, c)),
  ];
}

// ── BFS shortest path ─────────────────────────────────────────────────────────
// Returns the full path [from, ...intermediates, to], or null if unreachable.
function bfsPath(from: string, to: string): string[] | null {
  if (from === to) return [from];
  const parent = new Map<string, string>([[from, '']]);
  const queue: string[] = [from];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const rc = parseNodeId(cur);
    if (!rc) continue;
    const [r, c] = rc;
    for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]] as [number,number][]) {
      if (nr < 0 || nr > 10 || nc < 0 || nc > 10) continue;
      const nid = `node-${nr}-${nc}`;
      if (parent.has(nid) || !NODE_BIOMES[nid]) continue;
      parent.set(nid, cur);
      if (nid === to) {
        const path: string[] = [];
        let n: string = to;
        while (n !== '') { path.unshift(n); n = parent.get(n)!; }
        return path;
      }
      queue.push(nid);
    }
  }
  return null;
}

// ── NodeInfo ─────────────────────────────────────────────────────────────────

interface NodeInfoProps { nodeId: string; player: PlayerView | null; }

function NodeInfo({ nodeId, player }: NodeInfoProps) {
  const info  = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;

  const recipes = useMemo(() =>
    Array.from(RECIPE_DATABASE.values())
      .filter(r => r.recipeGroup === info?.biomeGroup)
      .sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel || a.slot.localeCompare(b.slot)),
    [info?.biomeGroup],
  );

  if (!info || !biome) return <div className="map-info__empty">Unknown zone.</div>;

  const { biomeGroup, biomeTier } = info;
  const isDungeon   = info.isDungeon === true;
  const accentColor = isDungeon ? '#882222' : tileColor(biomeGroup);

  const monsterIds = biome.monsterPoolByTier[biomeTier] ?? [];
  const monsters   = monsterIds.map(id => MONSTER_DATABASE.get(id)).filter((m): m is NonNullable<typeof m> => m !== undefined);

  const bossIds = isDungeon ? (biome.bossPoolByTier?.[biomeTier] ?? []) : [];
  const bosses  = bossIds.map(id => MONSTER_DATABASE.get(id)).filter((m): m is NonNullable<typeof m> => m !== undefined);

  const biomeXP    = player ? (player.biomeXP[biomeGroup] ?? 0) : 0;
  const biomeLevel = player ? (player.biomeLevel[biomeGroup] ?? 0) : 0;
  const levelCap   = biomeLevelCap(player?.playerTier ?? 0, biomeGroup);
  const tierLabel  = biomeTier === 0 ? 'Starting Zone' : `Tier ${biomeTier}`;

  const recipesByLevel = recipes.reduce<Record<number, typeof recipes>>((acc, r) => {
    (acc[r.requiredBiomeLevel] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="map-node-info">
      <div className="map-node-info__header" style={{ borderLeftColor: accentColor }}>
        <span className="map-node-info__name">{biome.name}</span>
        <span className="map-node-info__tier">{tierLabel}</span>
        {isDungeon && <span className="map-node-info__dungeon-tag">DUNGEON</span>}
      </div>

      {isDungeon && <div className="map-dungeon-warning">Enemies: ×2 HP · ×1.6 ATK</div>}

      {bosses.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title map-info-section__title--boss">Boss</div>
          {bosses.map(m => (
            <div key={m.id} className="map-monster-row map-monster-row--boss">
              <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
              <span className="map-monster-name map-monster-name--boss">{m.name}</span>
              <span className="map-monster-stats">HP {m.stats.hp} · ATK {m.stats.attack} · PLT {m.stats.plating}</span>
              <span className="map-monster-drop" style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>+{m.rewards.essence}</span>
            </div>
          ))}
        </section>
      )}

      {monsters.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Monsters</div>
          {monsters.map(m => (
            <div key={m.id} className="map-monster-row">
              <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
              <span className="map-monster-name">{m.name}</span>
              <span className="map-monster-stats">HP {m.stats.hp} · ATK {m.stats.attack} · PLT {m.stats.plating} · SPD {m.stats.speed}</span>
              <span className="map-monster-drop" style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>+{m.rewards.essence}</span>
            </div>
          ))}
        </section>
      )}

      {recipes.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">
            Biome Progress
            <span className="map-kills-badge">Lv {biomeLevel}{biomeLevel >= levelCap ? ' (max)' : ''}</span>
          </div>
          {biomeLevel < levelCap && (() => {
            const xpThisTier = biomeXpForLevel(biomeLevel);
            const xpNextTier = biomeXpForLevel(biomeLevel + 1);
            const xpInLevel  = biomeXP - xpThisTier;
            const xpNeeded   = xpNextTier - xpThisTier;
            const pct = Math.min(100, (xpInLevel / xpNeeded) * 100);
            return (
              <div className="map-progress-row">
                <div className="map-progress-bar-wrap">
                  <div className="map-progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="map-progress-label">
                  {xpInLevel} / {xpNeeded} XP to Lv {biomeLevel + 1}
                </span>
              </div>
            );
          })()}
        </section>
      )}

      {recipes.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Recipes</div>
          {Object.entries(recipesByLevel).map(([lvlStr, group]) => {
            const reqLevel    = Number(lvlStr);
            const lvlUnlocked = biomeLevel >= reqLevel;
            return (
              <div key={reqLevel} className="map-recipe-group">
                <div className={`map-recipe-group__header${lvlUnlocked ? ' unlocked' : ''}`}>
                  {lvlUnlocked ? `Lv ${reqLevel} — Unlocked` : `Lv ${reqLevel} required`}
                </div>
                {group.map(r => (
                  <div key={r.id} className={`map-recipe-row${lvlUnlocked ? '' : ' locked'}`}>
                    <span className="map-recipe-name">{r.name}</span>
                    <span className="map-recipe-stat">{formatStat(r.stats)}</span>
                    <span className="map-recipe-cost">
                      {(Object.entries(r.cost) as [EssenceType, number][]).map(([type, amt]) => (
                        <span key={type} style={{ color: ESSENCE_COLORS[type], marginRight: 4 }}>{amt} {type}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      )}

      {monsters.length === 0 && recipes.length === 0 && !isDungeon && (
        <div className="map-info__empty">No content in this zone yet.</div>
      )}
    </div>
  );
}

// ── Overview minimap ──────────────────────────────────────────────────────────

interface OverviewProps {
  viewRow: number; viewCol: number;
  playerNodeId: string | null;
  pathSet: Set<string>;
  destNode: string | null;
}

function OverviewMap({ viewRow, viewCol, playerNodeId, pathSet, destNode }: OverviewProps) {
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

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  player: PlayerView | null;
  onClose: () => void;
  highlightNodes?: string[];
  focusNodeId?: string | null;
}

export function MapPanel({ player, onClose, highlightNodes, focusNodeId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [autoPath, setAutoPath] = useState<string[] | null>(null);

  // Keep path state in sync with GameScene via hudBus
  useEffect(() => hudBus.subscribe(s => setAutoPath(s.autoPath ?? null)), []);

  const pathSet = useMemo(() => new Set(autoPath ?? []), [autoPath]);
  const destNode = autoPath && autoPath.length > 0 ? autoPath[autoPath.length - 1] : null;

  function handleTileClick(id: string, isCurrent: boolean) {
    if (isCurrent || !player?.nodeId) return;
    const path = bfsPath(player.nodeId, id);
    if (!path || path.length <= 1) return;
    hudBus.requestNavigateTo(path.slice(1)); // exclude the player's current node
    onClose();
  }

  // Derive player grid position
  const playerPos = player?.nodeId ? parseNodeId(player.nodeId) : null;

  // Initialise viewport centered on focusNodeId if provided, otherwise on player
  const [viewRow, setViewRow] = useState<number>(() => {
    const anchor = (focusNodeId ? parseNodeId(focusNodeId) : null) ?? playerPos;
    return anchor ? Math.max(0, Math.min(MAX_VIEW_R, anchor[0] - Math.floor(VIEWPORT / 2))) : 2;
  });
  const [viewCol, setViewCol] = useState<number>(() => {
    const anchor = (focusNodeId ? parseNodeId(focusNodeId) : null) ?? playerPos;
    return anchor ? Math.max(0, Math.min(MAX_VIEW_C, anchor[1] - Math.floor(VIEWPORT / 2))) : 2;
  });

  // Re-center when player's node changes — but skip the initial fire if we opened
  // focused on a specific node (focusNodeId), so that node stays centered on mount.
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
  }, [player?.nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <OverviewMap viewRow={viewRow} viewCol={viewCol} playerNodeId={player?.nodeId ?? null} pathSet={pathSet} destNode={destNode} />
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
                const isCurrent   = player?.nodeId === id;
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
              ? <NodeInfo nodeId={hoveredId} player={player} />
              : <div className="map-info__empty">Hover a zone to see details.</div>}
          </div>

        </div>
      </div>
    </div>,
    document.body,
  );
}
