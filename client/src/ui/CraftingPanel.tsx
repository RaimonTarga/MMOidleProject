import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import type { PlayerState } from '@mmo-idle/shared';
import { RECIPE_DATABASE } from '@mmo-idle/shared';
import type { ItemStats } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './crafting.css';

const SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', recovery: 'Recovery',
  mobility: 'Boots', ring1: 'Ring 1', ring2: 'Ring 2',
};

const STAT_LABELS: Record<string, string> = {
  attack: 'ATK', defense: 'DEF', maxHp: 'HP',
  hpRegen: 'REGEN', speed: 'SPD', attackRange: 'RNG', attackCooldown: 'CD ms',
};

function formatStats(stats: Partial<ItemStats>): string {
  return Object.entries(stats)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${(v as number) >= 0 ? '+' : ''}${v} ${STAT_LABELS[k] ?? k}`)
    .join('  ');
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

  const recipes = useMemo(() => {
    if (!player) return [];
    return Array.from(RECIPE_DATABASE.values()).filter(
      recipe => (player.recipeProgress[recipe.recipeGroup] ?? 0) >= recipe.requiredTier,
    );
  }, [player]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

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
            <div className="craft-essence">
              <span className="craft-essence__label">Essence</span>
              <span className="craft-essence__value">{player.essence}</span>
            </div>

            {recipes.length === 0 ? (
              <div className="craft-empty">No recipes unlocked.</div>
            ) : (
              <div className="craft-list">
                {recipes.map(recipe => {
                  const canAfford = player.essence >= recipe.cost.essence;
                  return (
                    <div
                      key={recipe.id}
                      className={`craft-recipe${canAfford ? '' : ' craft-recipe--unaffordable'}`}
                    >
                      <div className="craft-recipe__top">
                        <span className="craft-recipe__name">{recipe.name}</span>
                        <span className="craft-recipe__slot">
                          {SLOT_LABELS[recipe.slot] ?? recipe.slot}
                        </span>
                        <span className="craft-recipe__tier">T{recipe.tier}</span>
                      </div>
                      <div className="craft-recipe__stats">{formatStats(recipe.stats)}</div>
                      <div className="craft-recipe__bottom">
                        {recipe.description && (
                          <span className="craft-recipe__desc">{recipe.description}</span>
                        )}
                        <button
                          className="craft-recipe__btn"
                          disabled={!canAfford}
                          onClick={() => hudBus.requestCraftRecipe(recipe.id)}
                        >
                          Craft — {recipe.cost.essence} essence
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
