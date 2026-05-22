import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import type { PlayerState, EssenceType } from '@mmo-idle/shared';
import {
  RECIPE_DATABASE, NODE_BIOMES, BIOME_UNLOCK_THRESHOLDS,
  ESSENCE_TYPES, ESSENCE_COLORS,
} from '@mmo-idle/shared';
import type { ItemStats } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './crafting.css';

const SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', recovery: 'Recovery',
  mobility: 'Boots',
};

const STAT_LABELS: Record<string, string> = {
  attack: 'ATK', defense: 'DEF', maxHp: 'HP',
  hpRegen: 'REGEN', speed: 'SPD', attackRange: 'RNG', attackCooldown: 'CD ms',
};

function formatStats(stats: Partial<ItemStats>, aps?: number): string {
  const parts: string[] = [];
  if (aps !== undefined) parts.push(`${aps} APS`);
  parts.push(
    ...Object.entries(stats)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${(v as number) >= 0 ? '+' : ''}${v} ${STAT_LABELS[k] ?? k}`),
  );
  return parts.join('  ');
}

interface EssenceSummaryProps {
  essences: Record<EssenceType, number>;
}

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

interface Props {
  player: PlayerState | null;
  onClose: () => void;
}

export function CraftingPanel({ player, onClose }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
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

  const biomeGroup = player ? (NODE_BIOMES[player.nodeId]?.biomeGroup ?? null) : null;
  const biomeTier  = player ? (NODE_BIOMES[player.nodeId]?.biomeTier  ?? null) : null;
  const kills      = (player && biomeGroup) ? (player.biomeKills[biomeGroup] ?? 0) : 0;
  const unlockedTier = (player && biomeGroup) ? (player.recipeProgress[biomeGroup] ?? 0) : 0;

  const thresholds = biomeGroup ? (BIOME_UNLOCK_THRESHOLDS[biomeGroup] ?? []) : [];
  const nextThreshold = thresholds.find(t => t.tier > unlockedTier);

  const recipes = useMemo(() => {
    if (!biomeGroup) return [];
    return Array.from(RECIPE_DATABASE.values())
      .filter(r => r.recipeGroup === biomeGroup)
      .sort((a, b) => a.requiredTier - b.requiredTier || a.slot.localeCompare(b.slot));
  }, [biomeGroup]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const essences = player?.essences ?? { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };

  return createPortal(
    <div className="craft-overlay" onClick={handleOverlayClick}>
      <div className="craft-panel">

        <div className="craft-header">
          <span className="craft-title">Crafting</span>
          {feedback && (
            <span className={`craft-feedback${feedbackOk ? ' craft-feedback--ok' : ' craft-feedback--err'}`}>
              {feedback}
            </span>
          )}
          <button className="craft-close" onClick={onClose}>✕</button>
        </div>

        {player ? (
          <div className="craft-body">

            {/* Essence overview */}
            <EssenceSummary essences={essences} />

            {biomeGroup ? (
              <>
                {/* Biome progress header */}
                <div className="craft-biome">
                  <div className="craft-biome__title">
                    <span className="craft-biome__name">
                      {biomeGroup.charAt(0).toUpperCase() + biomeGroup.slice(1)} T{biomeTier}
                    </span>
                    <span className="craft-biome__kills">{kills} kills</span>
                  </div>
                  {nextThreshold ? (
                    <div className="craft-biome__progress">
                      <div
                        className="craft-biome__bar"
                        style={{ width: `${Math.min(100, (kills / nextThreshold.killsRequired) * 100)}%` }}
                      />
                      <span className="craft-biome__label">
                        T{nextThreshold.tier} recipes unlock at {nextThreshold.killsRequired} kills
                      </span>
                    </div>
                  ) : thresholds.length > 0 ? (
                    <div className="craft-biome__maxed">All tiers unlocked</div>
                  ) : null}
                </div>

                {recipes.length === 0 ? (
                  <div className="craft-empty">No recipes for this biome.</div>
                ) : (
                  <div className="craft-list">
                    {recipes.map(recipe => {
                      const unlocked = unlockedTier >= recipe.requiredTier;
                      const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
                      const canAfford = unlocked && costEntries.every(
                        ([type, amount]) => (essences[type] ?? 0) >= amount,
                      );
                      const tierInfo = thresholds.find(t => t.tier === recipe.requiredTier);

                      return (
                        <div
                          key={recipe.id}
                          className={[
                            'craft-recipe',
                            !unlocked             ? 'craft-recipe--locked'       : '',
                            unlocked && !canAfford ? 'craft-recipe--unaffordable' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          <div className="craft-recipe__top">
                            <span className="craft-recipe__name">{recipe.name}</span>
                            <span className="craft-recipe__slot">
                              {SLOT_LABELS[recipe.slot] ?? recipe.slot}
                            </span>
                            <span className="craft-recipe__tier">T{recipe.tier}</span>
                          </div>

                          <div className="craft-recipe__stats">
                            {formatStats(recipe.stats, recipe.slot === 'weapon' ? recipe.attacksPerSecond : undefined)}
                          </div>

                          {unlocked && (
                            <CostDisplay cost={recipe.cost} essences={essences} />
                          )}

                          <div className="craft-recipe__bottom">
                            {recipe.description && (
                              <span className="craft-recipe__desc">{recipe.description}</span>
                            )}
                            {unlocked ? (
                              <button
                                className="craft-recipe__btn"
                                disabled={!canAfford}
                                onClick={() => hudBus.requestCraftRecipe(recipe.id)}
                              >
                                {canAfford ? 'Craft' : 'Insufficient'}
                              </button>
                            ) : (
                              <span className="craft-recipe__locked-label">
                                {tierInfo
                                  ? `${tierInfo.killsRequired} kills to unlock`
                                  : `Tier ${recipe.requiredTier} required`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="craft-empty">Enter a zone to see its recipes.</div>
            )}
          </div>
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
