import { createPortal } from 'react-dom';
import { useState, useMemo } from 'react';
import type { PlayerState } from '@mmo-idle/shared';
import type { ItemStats } from '@mmo-idle/shared';
import {
  NODE_BIOMES, BIOME_DATABASE, MONSTER_DATABASE, RECIPE_DATABASE,
  BIOME_UNLOCK_THRESHOLDS, ESSENCE_COLORS,
} from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import './map.css';

const ROWS = 5;
const COLS = 5;

// Handpicked tile colors for map readability — distinct from each other
// while retaining the biome's visual identity.
const BIOME_TILE_COLORS: Record<string, string> = {
  clearing: '#2e5e2e',
  forest:   '#1a4018',
  mountain: '#3e3e50',
  plains:   '#4e5e1a',
  swamp:    '#1a3a0c',
  cave:     '#1a1a24',
  jungle:   '#0c3014',
  tundra:   '#222e48',
  desert:   '#5a4010',
  volcanic: '#4a1010',
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

// ── Sub-component: info panel shown when hovering a node ────────────────────

interface NodeInfoProps {
  nodeId: string;
  player: PlayerState | null;
}

function NodeInfo({ nodeId, player }: NodeInfoProps) {
  const info = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;

  const recipes = useMemo(() =>
    Array.from(RECIPE_DATABASE.values())
      .filter(r => r.recipeGroup === info?.biomeGroup)
      .sort((a, b) => a.requiredTier - b.requiredTier || a.slot.localeCompare(b.slot)),
    [info?.biomeGroup],
  );

  if (!info || !biome) {
    return <div className="map-info__empty">Unknown zone.</div>;
  }

  const { biomeGroup, biomeTier } = info;
  const accentColor = tileColor(biomeGroup);

  const monsterIds = biome.monsterPoolByTier[biomeTier] ?? [];
  const monsters = monsterIds
    .map(id => MONSTER_DATABASE.get(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  const thresholds = BIOME_UNLOCK_THRESHOLDS[biomeGroup] ?? [];
  const kills = player ? (player.biomeKills[biomeGroup] ?? 0) : 0;
  const unlockedTier = player ? (player.recipeProgress[biomeGroup] ?? 0) : 0;

  const tierLabel = biomeTier === 0 ? 'Starting Zone' : `Tier ${biomeTier}`;

  // Group recipes by requiredTier
  const recipesByTier = recipes.reduce<Record<number, typeof recipes>>((acc, r) => {
    (acc[r.requiredTier] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="map-node-info">

      <div className="map-node-info__header" style={{ borderLeftColor: accentColor }}>
        <span className="map-node-info__name">{biome.name}</span>
        <span className="map-node-info__tier">{tierLabel}</span>
      </div>

      {/* Monsters */}
      {monsters.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Monsters</div>
          {monsters.map(m => (
            <div key={m.id} className="map-monster-row">
              <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
              <span className="map-monster-name">{m.name}</span>
              <span className="map-monster-stats">
                HP {m.stats.hp} · ATK {m.stats.attack} · PLT {m.stats.plating} · SPD {m.stats.speed}
              </span>
              <span
                className="map-monster-drop"
                style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}
              >
                +{m.rewards.essence}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Crafting progress */}
      {thresholds.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">
            Crafting Progress
            {kills > 0 && <span className="map-kills-badge">{kills} kills</span>}
          </div>
          {thresholds.map(({ tier, killsRequired }) => {
            const pct = Math.min(100, (kills / killsRequired) * 100);
            const unlocked = kills >= killsRequired;
            return (
              <div key={tier} className="map-progress-row">
                <div className="map-progress-bar-wrap">
                  <div
                    className={`map-progress-bar${unlocked ? ' map-progress-bar--done' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`map-progress-label${unlocked ? ' map-progress-label--done' : ''}`}>
                  T{tier} {unlocked ? '✓' : `${kills}/${killsRequired}`}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {/* Recipes */}
      {recipes.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Recipes</div>
          {Object.entries(recipesByTier).map(([tierStr, group]) => {
            const tier = Number(tierStr);
            const tierUnlocked = unlockedTier >= tier;
            const threshold = thresholds.find(t => t.tier === tier);
            return (
              <div key={tier} className="map-recipe-group">
                <div className={`map-recipe-group__header${tierUnlocked ? ' unlocked' : ''}`}>
                  T{tier} — {tierUnlocked
                    ? 'Unlocked'
                    : threshold
                      ? `${threshold.killsRequired} kills to unlock`
                      : 'Locked'}
                </div>
                {group.map(r => (
                  <div key={r.id} className={`map-recipe-row${tierUnlocked ? '' : ' locked'}`}>
                    <span className="map-recipe-name">{r.name}</span>
                    <span className="map-recipe-stat">{formatStat(r.stats)}</span>
                    <span className="map-recipe-cost">
                      {(Object.entries(r.cost) as [EssenceType, number][]).map(([type, amt]) => (
                        <span key={type} style={{ color: ESSENCE_COLORS[type], marginRight: 4 }}>
                          {amt} {type}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      )}

      {monsters.length === 0 && recipes.length === 0 && (
        <div className="map-info__empty">No content in this zone yet.</div>
      )}

    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  player: PlayerState | null;
  onClose: () => void;
}

export function MapPanel({ player, onClose }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="map-overlay" onClick={handleOverlayClick}>
      <div className="map-panel">

        <div className="map-header">
          <span className="map-title">World Map</span>
          <button className="map-close" onClick={onClose}>✕</button>
        </div>

        <div className="map-body">

          {/* 5×5 tile grid */}
          <div className="map-grid">
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const r = Math.floor(i / COLS);
              const c = i % COLS;
              const id = `node-${r}-${c}`;
              const info = NODE_BIOMES[id];
              const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;
              const isCurrent = player?.nodeId === id;
              const isHovered = hoveredId === id;
              const tierBadge = info?.biomeTier === 0 ? '★' : `T${info?.biomeTier ?? '?'}`;

              return (
                <div
                  key={id}
                  className={[
                    'map-tile',
                    isCurrent ? 'map-tile--current' : '',
                    isHovered && !isCurrent ? 'map-tile--hovered' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ background: tileColor(info?.biomeGroup ?? '') }}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <span className="map-tile__tier">{tierBadge}</span>
                  <span className="map-tile__name">{biome?.name ?? '?'}</span>
                  {isCurrent && <span className="map-tile__you">▼ YOU</span>}
                </div>
              );
            })}
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
