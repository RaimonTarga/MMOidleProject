import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType } from '@mmo-idle/shared';
import {
  RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  checkEvolve,
  checkReconstruct,
  isEvolvedRecipe,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  catalystsAtom,
  equipmentAtom,
  essencesAtom,
  inventoryAtom,
  itemUpgradesAtom,
  playerNodeIdAtom,
  playerTierAtom,
  unlockedRecipesAtom,
} from '../../hud/atoms';
import { SLOT_ABBR, SLOT_LABELS, biomeName, tierColor } from './common';
import { CostDisplay, EssenceSummary, affordsCatalysts } from './shared';
import { statEntries, formatMechanicEffects, formatWeaponEffects } from './itemDisplay';
import { ItemIcon } from '../ItemIcon';

interface CraftResult { recipeId: string; success: boolean; }

export function ForgeTab() {
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);
  const [filterTier,  setFilterTier]  = useState<number | null>(null);
  const [filterUltimate, setFilterUltimate] = useState(false);
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);

  const nodeId            = useAtomValue(playerNodeIdAtom);
  const playerTier        = useAtomValue(playerTierAtom);
  const unlockedRecipeIds = useAtomValue(unlockedRecipesAtom);
  const essences          = useAtomValue(essencesAtom);
  const catalysts         = useAtomValue(catalystsAtom);
  const inventory         = useAtomValue(inventoryAtom);
  const equipment         = useAtomValue(equipmentAtom);
  const itemUpgrades      = useAtomValue(itemUpgradesAtom);

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
        ? true
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
    // Already-crafted gear drops off the forge list entirely — owners manage it
    // from inventory/upgrade, not here.
    const base = unlockedRecipes.filter(r =>
      !ownedSet.has(r.id) &&
      (!filterUltimate || r.ultimate) &&
      (!filterBiome || r.recipeGroup === filterBiome) &&
      (!filterSlot  || r.slot        === filterSlot) &&
      (!filterTier  || r.tier        === filterTier),
    );
    return base.slice().sort((a, b) => {
      const cat = (r: typeof a) => {
        const canAfford = (Object.entries(r.cost) as [EssenceType, number][])
          .every(([type, amt]) => (essences[type] ?? 0) >= amt)
          && affordsCatalysts(r.catalystCost, catalysts);
        return canAfford ? 0 : 1;
      };
      return cat(a) - cat(b);
    });
  }, [unlockedRecipes, filterBiome, filterSlot, filterTier, filterUltimate, ownedSet, essences, catalysts]);

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
            className={`craft-filter-chip craft-filter-chip--ultimate${filterUltimate ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setFilterUltimate(v => !v)}
          >Ultimate</button>
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
          {(['weapon', 'armor', 'recovery', 'mobility', 'core'] as const).map(s => (
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
            const canAfford   = costEntries.every(([type, amount]) => (essences[type] ?? 0) >= amount)
              && affordsCatalysts(recipe.catalystCost, catalysts);
            const canCraft    = isTestRoom || canAfford;
            const owned       = ownedSet.has(recipe.id);
            const isEvolved   = isEvolvedRecipe(recipe);
            const evolveCheck = isEvolved
              ? checkEvolve({ recipe, inventory, itemUpgrades, essences, catalysts, isTestRoom })
              : null;
            const reconstructCheck = isEvolved && recipe.reconstructCost
              ? checkReconstruct({ recipe, essences, catalysts, isTestRoom })
              : null;
            const predecessor = recipe.evolvesFrom
              ? RECIPE_DATABASE.get(recipe.evolvesFrom)
              : undefined;
            const statList    = statEntries(
              recipe.stats,
              recipe.slot === 'weapon' ? recipe.attacksPerSecond : undefined,
            );
            const effectLines = [
              ...(recipe.slot === 'core' && recipe.rangeTag
                ? [recipe.rangeTag === 'universal' || recipe.rangeTag === 'party'
                    ? `Works at any range (${recipe.rangeTag})`
                    : `Full effect only at ${recipe.rangeTag.toUpperCase()} range`]
                : []),
              ...formatMechanicEffects(recipe.mechanicEffects),
              ...(recipe.slot === 'weapon' ? formatWeaponEffects(recipe.id) : []),
            ];
            const result = craftResult?.recipeId === recipe.id ? craftResult : null;

            return (
              <div
                key={recipe.id}
                className={[
                  'craft-recipe',
                  recipe.ultimate      ? 'craft-recipe--ultimate'    : '',
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

                <div
                  className="craft-recipe__icon"
                  data-slot={recipe.slot}
                  style={{
                    borderColor: `${tierColor(recipe.tier)}77`,
                    background:  `${tierColor(recipe.tier)}0d`,
                    color:       `${tierColor(recipe.tier)}cc`,
                  }}
                >
                  {recipe.icon
                    ? <ItemIcon frameName={recipe.icon} />
                    : SLOT_ABBR[recipe.slot] ?? recipe.slot.slice(0, 3).toUpperCase()}
                </div>

                <div className="craft-recipe__content">
                  <div className="craft-recipe__header">
                    <span className="craft-recipe__name">{recipe.name}</span>
                    <span className="craft-recipe__slot-badge" data-slot={recipe.slot}>
                      {SLOT_LABELS[recipe.slot] ?? recipe.slot}
                    </span>
                    <span className="craft-recipe__tier-badge">T{recipe.tier}</span>
                    {recipe.ultimate && (
                      <span className="craft-recipe__source">Void Overlord</span>
                    )}
                    {owned && <span className="craft-recipe__owned-badge">{equippedSet.has(recipe.id) ? 'EQUIPPED' : 'IN BAG'}</span>}
                  </div>

                  {statList.length > 0 && (
                    <div className="craft-recipe__stats">
                      {statList.map((e, i) => (
                        <span key={i} className="craft-stat-pill">
                          <span className="craft-stat-pill__value">{e.value}</span>
                          <span className="craft-stat-pill__label">{e.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {effectLines.length > 0 && (
                    <ul className="craft-recipe__effects">
                      {effectLines.map((line, i) => (
                        <li key={i} className="craft-recipe__effect-line">{line}</li>
                      ))}
                    </ul>
                  )}

                  <CostDisplay cost={recipe.cost} essences={essences} catalystCost={recipe.catalystCost} catalysts={catalysts} />

                  {isEvolved ? (
                    <>
                      {predecessor && (
                        <div className="craft-recipe__effect-line">
                          Evolves from {predecessor.name} +3 (consumed)
                        </div>
                      )}
                      {recipe.reconstructCost && (
                        <div className="craft-recipe__effect-line">
                          Reconstruct (no predecessor):{' '}
                          <CostDisplay cost={recipe.reconstructCost} essences={essences} catalystCost={recipe.reconstructCatalystCost} catalysts={catalysts} />
                        </div>
                      )}
                      <div className="craft-recipe__footer">
                        {recipe.description && (
                          <span className="craft-recipe__desc">{recipe.description}</span>
                        )}
                        <button
                          className="craft-recipe__btn"
                          disabled={owned || !(evolveCheck?.ok)}
                          title={evolveCheck?.reason}
                          onClick={() => {
                            if (!owned && evolveCheck?.ok) {
                              lastCraftedIdRef.current = recipe.id;
                              hudBus.requestEvolveItem(recipe.id, 'evolve');
                            }
                          }}
                        >
                          {owned ? 'Owned' : evolveCheck?.ok ? 'Evolve' : 'Need +3'}
                        </button>
                        {recipe.reconstructCost && (
                          <button
                            className="craft-recipe__btn"
                            disabled={owned || !(reconstructCheck?.ok)}
                            title={reconstructCheck?.reason}
                            onClick={() => {
                              if (!owned && reconstructCheck?.ok) {
                                lastCraftedIdRef.current = recipe.id;
                                hudBus.requestEvolveItem(recipe.id, 'reconstruct');
                              }
                            }}
                          >
                            {reconstructCheck?.ok ? 'Reconstruct' : 'Insufficient'}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="craft-recipe__footer">
                      {recipe.description && (
                        <span className="craft-recipe__desc">{recipe.description}</span>
                      )}
                      <button
                        className="craft-recipe__btn"
                        disabled={!canCraft || owned}
                        onClick={() => {
                          if (!owned) {
                            lastCraftedIdRef.current = recipe.id;
                            hudBus.requestCraftRecipe(recipe.id);
                          }
                        }}
                      >
                        {owned ? (equippedSet.has(recipe.id) ? 'Equipped' : 'In inventory') : canCraft ? 'Craft' : 'Insufficient'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
