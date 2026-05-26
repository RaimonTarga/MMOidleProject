import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType } from '@mmo-idle/shared';
import { RECIPE_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  essencesAtom,
  playerNodeIdAtom,
  playerTierAtom,
  unlockedRecipesAtom,
} from '../../hud/atoms';
import { SLOT_ABBR, SLOT_LABELS, biomeName, getStatEntries } from './common';
import { CostDisplay, EssenceSummary } from './shared';

export function ForgeTab() {
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const unlockedRecipeIds = useAtomValue(unlockedRecipesAtom);
  const essences = useAtomValue(essencesAtom);

  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;

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
        ? playerTier >= r.tier
        : unlockedRecipeIds.includes(r.id),
    ),
    [allRecipes, unlockedRecipeIds, playerTier, isTestRoom],
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
