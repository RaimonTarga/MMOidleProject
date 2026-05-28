import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType } from '@mmo-idle/shared';
import { RECIPE_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  equipmentAtom,
  essencesAtom,
  inventoryAtom,
  playerNodeIdAtom,
  playerTierAtom,
  unlockedRecipesAtom,
} from '../../hud/atoms';
import { SLOT_ABBR, SLOT_LABELS, biomeName, getStatEntries, tierColor } from './common';
import { CostDisplay, EssenceSummary } from './shared';

interface CraftResult { recipeId: string; success: boolean; }

export function ForgeTab() {
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);
  const [filterTier,  setFilterTier]  = useState<number | null>(null);
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);

  const nodeId            = useAtomValue(playerNodeIdAtom);
  const playerTier        = useAtomValue(playerTierAtom);
  const unlockedRecipeIds = useAtomValue(unlockedRecipesAtom);
  const essences          = useAtomValue(essencesAtom);
  const inventory         = useAtomValue(inventoryAtom);
  const equipment         = useAtomValue(equipmentAtom);

  const isTestRoom        = nodeId === TEST_ROOM_NODE_ID;
  const lastCraftedIdRef  = useRef<string | null>(null);
  const resultTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const result = (e as CustomEvent<{ success: boolean; reason?: string }>).detail;
      const recipeId = lastCraftedIdRef.current;
      if (!recipeId) return;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      setCraftResult({ recipeId, success: result.success });
      resultTimerRef.current = setTimeout(() => setCraftResult(null), 2200);
    };
    window.addEventListener('hud:craftResult', handler);
    return () => {
      window.removeEventListener('hud:craftResult', handler);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  const equippedSet = useMemo(() => new Set(Object.values(equipment).filter((id): id is string => id !== null)), [equipment]);
  const ownedSet    = useMemo(() => new Set([...inventory, ...equippedSet]), [inventory, equippedSet]);

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

  const tiers = useMemo(() => {
    const ts = new Set<number>();
    for (const r of unlockedRecipes) ts.add(r.tier);
    return Array.from(ts).sort((a, b) => a - b);
  }, [unlockedRecipes]);

  const filtered = useMemo(() => {
    const base = unlockedRecipes.filter(r =>
      (!filterBiome || r.recipeGroup === filterBiome) &&
      (!filterSlot  || r.slot        === filterSlot) &&
      (!filterTier  || r.tier        === filterTier),
    );
    return base.slice().sort((a, b) => {
      const cat = (r: typeof a) => {
        if (ownedSet.has(r.id)) return 2;
        const canAfford = (Object.entries(r.cost) as [EssenceType, number][])
          .every(([type, amt]) => (essences[type] ?? 0) >= amt);
        return canAfford ? 0 : 1;
      };
      return cat(a) - cat(b);
    });
  }, [unlockedRecipes, filterBiome, filterSlot, filterTier, ownedSet, essences]);

  const toggleBiome = (g: string) => setFilterBiome(v => v === g ? null : g);
  const toggleSlot  = (s: string) => setFilterSlot(v  => v === s ? null : s);
  const toggleTier  = (t: number) => setFilterTier(v  => v === t ? null : t);

  return (
    <div className="craft-body">
      <EssenceSummary essences={essences} />

      {/* Filters */}
      <div className="craft-filters">
        <div className="craft-filter-row">
          <button
            className={`craft-filter-chip${!filterBiome ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setFilterBiome(null)}
          >All</button>
          {biomeGroups.map(g => (
            <button
              key={g}
              className={`craft-filter-chip${filterBiome === g ? ' craft-filter-chip--active' : ''}`}
              onClick={() => toggleBiome(g)}
            >{biomeName(g)}</button>
          ))}
        </div>
        <div className="craft-filter-row">
          <button
            className={`craft-filter-chip${!filterSlot ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setFilterSlot(null)}
          >All Slots</button>
          {(['weapon', 'armor', 'recovery', 'mobility'] as const).map(s => (
            <button
              key={s}
              className={`craft-filter-chip craft-filter-chip--slot${filterSlot === s ? ' craft-filter-chip--active' : ''}`}
              data-slot={s}
              onClick={() => toggleSlot(s)}
            >{SLOT_LABELS[s]}</button>
          ))}
        </div>
        {tiers.length > 1 && (
          <div className="craft-filter-row">
            <button
              className={`craft-filter-chip${!filterTier ? ' craft-filter-chip--active' : ''}`}
              onClick={() => setFilterTier(null)}
            >All Tiers</button>
            {tiers.map(t => (
              <button
                key={t}
                className={`craft-filter-chip craft-filter-chip--tier${filterTier === t ? ' craft-filter-chip--active' : ''}`}
                style={filterTier === t
                  ? { color: tierColor(t), borderColor: `${tierColor(t)}aa`, background: `${tierColor(t)}18` }
                  : { color: `${tierColor(t)}bb` }
                }
                onClick={() => toggleTier(t)}
              >T{t}</button>
            ))}
          </div>
        )}
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
            const canAfford   = costEntries.every(([type, amount]) => (essences[type] ?? 0) >= amount);
            const owned       = ownedSet.has(recipe.id);
            const statEntries = getStatEntries(
              recipe.stats,
              recipe.slot === 'weapon' ? recipe.attacksPerSecond : undefined,
            );
            const result = craftResult?.recipeId === recipe.id ? craftResult : null;

            return (
              <div
                key={recipe.id}
                className={[
                  'craft-recipe',
                  owned                ? 'craft-recipe--owned'       : '',
                  !owned && !canAfford ? 'craft-recipe--unaffordable' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Craft result overlay */}
                {result && (
                  <div className={`craft-card-result craft-card-result--${result.success ? 'ok' : 'err'}`}>
                    <span className="craft-card-result__icon">{result.success ? '✓' : '✗'}</span>
                    <span className="craft-card-result__text">
                      {result.success ? 'Crafted!' : 'Not enough essence'}
                    </span>
                  </div>
                )}

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
                    {owned && <span className="craft-recipe__owned-badge">{equippedSet.has(recipe.id) ? 'EQUIPPED' : 'IN BAG'}</span>}
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
                      disabled={!canAfford || owned}
                      onClick={() => {
                        if (!owned) {
                          lastCraftedIdRef.current = recipe.id;
                          hudBus.requestCraftRecipe(recipe.id);
                        }
                      }}
                    >
                      {owned ? (equippedSet.has(recipe.id) ? 'Equipped' : 'In inventory') : canAfford ? 'Craft' : 'Insufficient'}
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
