import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import type { PlayerView, EssenceType } from '@mmo-idle/shared';
import {
  RECIPE_DATABASE, NODE_BIOMES, GAME_CONFIG,
  ESSENCE_TYPES, ESSENCE_COLORS, TEST_ROOM_NODE_ID, BIOME_DATABASE,
  biomeXpForLevel,
} from '@mmo-idle/shared';
import type { ItemStats } from '@mmo-idle/shared';
import type { Recipe } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './crafting.css';

const SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', recovery: 'Recovery', mobility: 'Boots',
};

const SLOT_ABBR: Record<string, string> = {
  weapon: 'WPN', armor: 'ARM', recovery: 'RCV', mobility: 'MOB',
};

const STAT_LABELS: Record<string, string> = {
  attack: 'ATK', defense: 'DEF', maxHp: 'HP',
  hpRegen: 'REGEN', speed: 'SPD', attackRange: 'RNG', attackCooldown: 'CD ms',
};

function getStatEntries(stats: Partial<ItemStats>, aps?: number): { value: string; label: string }[] {
  const entries: { value: string; label: string }[] = [];
  if (aps !== undefined) entries.push({ value: String(aps), label: 'APS' });
  for (const [k, v] of Object.entries(stats)) {
    if (v !== undefined) {
      entries.push({ value: `${(v as number) >= 0 ? '+' : ''}${v}`, label: STAT_LABELS[k] ?? k });
    }
  }
  return entries;
}

function biomeName(group: string): string {
  const biome = BIOME_DATABASE.get(group);
  if (biome) return biome.name;
  return group.charAt(0).toUpperCase() + group.slice(1);
}

// ── Shared sub-components ─────────────────────────────────────────────────────

interface EssenceSummaryProps { essences: Record<EssenceType, number>; }

function EssenceSummary({ essences }: EssenceSummaryProps) {
  return (
    <div className="craft-essence-summary">
      {ESSENCE_TYPES.map(type => (
        <span key={type} className="craft-essence-chip">
          <span className="craft-essence-chip__dot" style={{ background: ESSENCE_COLORS[type] }} />
          <span className="craft-essence-chip__value" style={{ color: ESSENCE_COLORS[type] }}>
            {essences[type]}
          </span>
        </span>
      ))}
    </div>
  );
}

interface CostDisplayProps {
  cost: Partial<Record<EssenceType, number>>;
  essences: Record<EssenceType, number>;
}

function CostDisplay({ cost, essences }: CostDisplayProps) {
  const entries = Object.entries(cost) as [EssenceType, number][];
  return (
    <div className="craft-cost">
      {entries.map(([type, amount]) => {
        const held = essences[type] ?? 0;
        const ok = held >= amount;
        return (
          <span
            key={type}
            className={`craft-cost__chip${ok ? ' craft-cost__chip--ok' : ' craft-cost__chip--low'}`}
          >
            <span className="craft-cost__dot" style={{ background: ESSENCE_COLORS[type] }} />
            <span className="craft-cost__amount">{amount}</span>
            <span className="craft-cost__held">({held})</span>
          </span>
        );
      })}
    </div>
  );
}

// ── Biome Tab ─────────────────────────────────────────────────────────────────

interface BiomeSectionProps {
  biomeGroup: string;
  player: PlayerView;
  recipes: Recipe[];
  isCurrent: boolean;
}

function BiomeSection({ biomeGroup, player, recipes, isCurrent }: BiomeSectionProps) {
  const level    = player.biomeLevel[biomeGroup] ?? 0;
  const xp       = player.biomeXP[biomeGroup] ?? 0;
  const levelCap = GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER[player.playerTier] ?? 999;
  const xpThisTier  = biomeXpForLevel(level);
  const xpNextTier  = biomeXpForLevel(level + 1);
  const xpInLevel   = xp - xpThisTier;
  const xpNeeded    = xpNextTier - xpThisTier;
  const pct = level >= levelCap
    ? 100
    : Math.min(100, (xpInLevel / xpNeeded) * 100);
  const label = biomeName(biomeGroup);

  return (
    <div className={`craft-biome-section${isCurrent ? ' craft-biome-section--current' : ''}`}>
      <div className="craft-biome-section__header">
        <span className="craft-biome-section__name">{label}</span>
        {isCurrent && <span className="craft-biome-section__tag">CURRENT</span>}
        <span className="craft-biome-section__level">
          Lv {level}{level >= levelCap ? ' (cap)' : ''}
        </span>
      </div>

      <div className="craft-biome__progress">
        <div className="craft-biome__bar" style={{ width: `${pct}%` }} />
        {level < levelCap && (
          <span className="craft-biome__label">{xpInLevel} / {xpNeeded} XP</span>
        )}
      </div>

      {recipes.length > 0 && (
        <div className="craft-unlock-path">
          {recipes.map(r => {
            const unlocked   = player.unlockedRecipes.includes(r.id);
            const tierLocked = r.tier > player.playerTier;
            return (
              <div
                key={r.id}
                className={[
                  'craft-unlock-row',
                  unlocked   ? 'craft-unlock-row--unlocked'   : '',
                  tierLocked ? 'craft-unlock-row--tier-locked' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="craft-unlock-row__level">Lv {r.requiredBiomeLevel}</span>
                <span className="craft-unlock-row__name">{r.name}</span>
                <span className="craft-unlock-row__slot" data-slot={r.slot}>
                  {SLOT_LABELS[r.slot] ?? r.slot}
                </span>
                <span className="craft-unlock-row__tier">T{r.tier}</span>
                <span className={`craft-unlock-row__status${unlocked ? ' craft-unlock-row__status--ok' : tierLocked ? ' craft-unlock-row__status--tier' : ''}`}>
                  {unlocked ? '✓' : tierLocked ? 'TIER' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface BiomeTabProps { player: PlayerView; }

function BiomeTab({ player }: BiomeTabProps) {
  const isTestRoom = player.nodeId === TEST_ROOM_NODE_ID;

  const currentBiomeGroup = isTestRoom
    ? null
    : (NODE_BIOMES[player.nodeId]?.biomeGroup ?? null);

  const trackedBiomes = useMemo(() => {
    const groups = new Set<string>(currentBiomeGroup ? [currentBiomeGroup] : []);
    for (const g of Object.keys(player.biomeXP)) groups.add(g);
    return Array.from(groups).sort();
  }, [player.biomeXP, currentBiomeGroup]);

  const recipesByBiome = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    for (const recipe of RECIPE_DATABASE.values()) {
      const arr = map.get(recipe.recipeGroup) ?? [];
      arr.push(recipe);
      map.set(recipe.recipeGroup, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel || a.slot.localeCompare(b.slot));
    }
    return map;
  }, []);

  if (isTestRoom) {
    return (
      <div className="craft-body">
        <div className="craft-biome-section">
          <div className="craft-biome__maxed">
            {`Test Forge T${player.playerTier} — all T${player.playerTier} recipes available.`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="craft-body">
      {trackedBiomes.length === 0 && (
        <div className="craft-empty">No biome progress yet — kill monsters to earn XP.</div>
      )}
      {currentBiomeGroup && (
        <BiomeSection
          biomeGroup={currentBiomeGroup}
          player={player}
          recipes={recipesByBiome.get(currentBiomeGroup) ?? []}
          isCurrent
        />
      )}
      {trackedBiomes.filter(g => g !== currentBiomeGroup).map(g => (
        <BiomeSection
          key={g}
          biomeGroup={g}
          player={player}
          recipes={recipesByBiome.get(g) ?? []}
          isCurrent={false}
        />
      ))}
    </div>
  );
}

// ── Forge Tab ─────────────────────────────────────────────────────────────────

interface ForgeTabProps {
  player: PlayerView;
  essences: Record<EssenceType, number>;
}

function ForgeTab({ player, essences }: ForgeTabProps) {
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);

  const isTestRoom = player.nodeId === TEST_ROOM_NODE_ID;

  const allRecipes = useMemo(() =>
    Array.from(RECIPE_DATABASE.values()).sort((a, b) =>
      a.recipeGroup.localeCompare(b.recipeGroup) ||
      a.tier - b.tier ||
      a.requiredBiomeLevel - b.requiredBiomeLevel ||
      a.slot.localeCompare(b.slot),
    ),
    [],
  );

  const unlockedRecipes = useMemo(() =>
    allRecipes.filter(r =>
      isTestRoom
        ? player.playerTier >= r.tier
        : player.unlockedRecipes.includes(r.id),
    ),
    [allRecipes, player.unlockedRecipes, player.playerTier, isTestRoom],
  );

  const biomeGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const r of unlockedRecipes) groups.add(r.recipeGroup);
    return Array.from(groups).sort();
  }, [unlockedRecipes]);

  const filtered = useMemo(() =>
    unlockedRecipes.filter(r =>
      (!filterBiome || r.recipeGroup === filterBiome) &&
      (!filterSlot  || r.slot        === filterSlot),
    ),
    [unlockedRecipes, filterBiome, filterSlot],
  );

  const toggleBiome = (g: string) => setFilterBiome(v => v === g ? null : g);
  const toggleSlot  = (s: string) => setFilterSlot(v  => v === s ? null : s);

  return (
    <div className="craft-body">
      <EssenceSummary essences={essences} />

      {/* Filters */}
      <div className="craft-filters">
        <div className="craft-filter-row">
          <button
            className={`craft-filter-chip${!filterBiome ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setFilterBiome(null)}
          >
            All
          </button>
          {biomeGroups.map(g => (
            <button
              key={g}
              className={`craft-filter-chip${filterBiome === g ? ' craft-filter-chip--active' : ''}`}
              onClick={() => toggleBiome(g)}
            >
              {biomeName(g)}
            </button>
          ))}
        </div>
        <div className="craft-filter-row">
          <button
            className={`craft-filter-chip${!filterSlot ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setFilterSlot(null)}
          >
            All Slots
          </button>
          {(['weapon', 'armor', 'recovery', 'mobility'] as const).map(s => (
            <button
              key={s}
              className={`craft-filter-chip craft-filter-chip--slot${filterSlot === s ? ' craft-filter-chip--active' : ''}`}
              data-slot={s}
              onClick={() => toggleSlot(s)}
            >
              {SLOT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe list */}
      {unlockedRecipes.length === 0 ? (
        <div className="craft-empty">No recipes unlocked yet.</div>
      ) : filtered.length === 0 ? (
        <div className="craft-empty">No recipes match the current filter.</div>
      ) : (
        <div className="craft-list">
          {filtered.map(recipe => {
            const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
            const canAfford = costEntries.every(([type, amount]) => (essences[type] ?? 0) >= amount);
            const statEntries = getStatEntries(
              recipe.stats,
              recipe.slot === 'weapon' ? recipe.attacksPerSecond : undefined,
            );

            return (
              <div
                key={recipe.id}
                className={`craft-recipe${!canAfford ? ' craft-recipe--unaffordable' : ''}`}
              >
                <div className="craft-recipe__icon" data-slot={recipe.slot}>
                  {SLOT_ABBR[recipe.slot] ?? recipe.slot.slice(0, 3).toUpperCase()}
                </div>

                <div className="craft-recipe__content">
                  <div className="craft-recipe__header">
                    <span className="craft-recipe__name">{recipe.name}</span>
                    <span className="craft-recipe__slot-badge" data-slot={recipe.slot}>
                      {SLOT_LABELS[recipe.slot] ?? recipe.slot}
                    </span>
                    <span className="craft-recipe__tier-badge">T{recipe.tier}</span>
                  </div>

                  {statEntries.length > 0 && (
                    <div className="craft-recipe__stats">
                      {statEntries.map((e, i) => (
                        <span key={i} className="craft-stat-pill">
                          <span className="craft-stat-pill__value">{e.value}</span>
                          <span className="craft-stat-pill__label">{e.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <CostDisplay cost={recipe.cost} essences={essences} />

                  <div className="craft-recipe__footer">
                    {recipe.description && (
                      <span className="craft-recipe__desc">{recipe.description}</span>
                    )}
                    <button
                      className="craft-recipe__btn"
                      disabled={!canAfford}
                      onClick={() => hudBus.requestCraftRecipe(recipe.id)}
                    >
                      {canAfford ? 'Craft' : 'Insufficient'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  player: PlayerView | null;
  tab: 'biome' | 'forge';
  onTabChange: (tab: 'biome' | 'forge') => void;
  onClose: () => void;
}

export function CraftingPanel({ player, tab, onTabChange, onClose }: Props) {
  const [feedback, setFeedback]   = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: Event) => {
      const result = (e as CustomEvent<{ success: boolean; reason?: string }>).detail;
      if (timer) clearTimeout(timer);
      setFeedbackOk(result.success);
      setFeedback(result.success ? 'Item crafted!' : (result.reason ?? 'Crafting failed.'));
      timer = setTimeout(() => setFeedback(null), 3000);
    };

    window.addEventListener('hud:craftResult', handler);
    return () => {
      window.removeEventListener('hud:craftResult', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const essences = player?.essences ?? { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };

  return createPortal(
    <div className="craft-overlay" onClick={handleOverlayClick}>
      <div className="craft-panel">

        {/* Header */}
        <div className="craft-header">
          <span className="craft-title">Crafting</span>
          {feedback && (
            <span className={`craft-feedback${feedbackOk ? ' craft-feedback--ok' : ' craft-feedback--err'}`}>
              {feedback}
            </span>
          )}
          <button className="craft-close" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div className="craft-tabs">
          <button
            className={`craft-tab${tab === 'biome' ? ' craft-tab--active' : ''}`}
            onClick={() => onTabChange('biome')}
          >
            Biome Progress
          </button>
          <button
            className={`craft-tab${tab === 'forge' ? ' craft-tab--active' : ''}`}
            onClick={() => onTabChange('forge')}
          >
            Forge
          </button>
        </div>

        {/* Content */}
        {player ? (
          tab === 'biome'
            ? <BiomeTab player={player} />
            : <ForgeTab player={player} essences={essences} />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
