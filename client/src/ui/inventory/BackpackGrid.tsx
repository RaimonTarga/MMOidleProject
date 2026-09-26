import { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE, RECIPE_DATABASE, TEST_ROOM_NODE_ID, relicIsUnlocked } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { inventoryAtom, itemUpgradesAtom, playerNodeIdAtom, playerTierAtom } from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './constants';
import { ItemIcon } from '../ItemIcon';
import type { FocusedItem } from './useFocus';
import { EMPTY_GEAR_FILTERS, backpackFiltersAtom } from '../panelFilters';

const COLS = 4;
const MIN_ROWS = 3;

interface Props {
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}

export function BackpackGrid({ focused, onFocus }: Props) {
  const inventory    = useAtomValue(inventoryAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const [filters, setFilters] = useAtom(backpackFiltersAtom);

  // Build rich item list with recipe metadata
  const items = useMemo(() => inventory.map((defId, i) => {
    const def    = ITEM_DATABASE.get(defId) ?? null;
    const recipe = def ? RECIPE_DATABASE.get(defId) : null;
    return { defId, def, recipe, invIndex: i };
  }), [inventory]);

  const biomeGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const { recipe } of items) {
      if (recipe?.recipeGroup) groups.add(recipe.recipeGroup);
    }
    return Array.from(groups).sort();
  }, [items]);

  const tiers = useMemo(() => {
    const ts = new Set<number>();
    for (const { def } of items) {
      if (def) ts.add(def.tier);
    }
    return Array.from(ts).sort((a, b) => a - b);
  }, [items]);

  // A remembered facet that no longer exists would filter invisibly.
  const filterBiome = filters.biome && biomeGroups.length > 1 && biomeGroups.includes(filters.biome) ? filters.biome : null;
  const filterSlot  = filters.slot;
  const filterTier  = filters.tier !== null && tiers.length > 1 && tiers.includes(filters.tier) ? filters.tier : null;

  const isFiltered = filterBiome !== null || filterSlot !== null || filterTier !== null;

  const filtered = useMemo(() => items.filter(({ def, recipe }) => {
    if (!def) return false;
    if (filterBiome && recipe?.recipeGroup !== filterBiome) return false;
    if (filterSlot  && def.slot !== filterSlot)              return false;
    if (filterTier  && def.tier !== filterTier)              return false;
    return true;
  }), [items, filterBiome, filterSlot, filterTier]);

  // Grid cells: filtered compact list or full padded grid
  const gridItems = useMemo(() => {
    if (isFiltered) return filtered;
    const count = inventory.length;
    const rows  = Math.max(MIN_ROWS, Math.ceil(count / COLS));
    return Array.from({ length: rows * COLS }, (_, i) => {
      if (i < items.length) return items[i];
      return { defId: null, def: null, recipe: null, invIndex: i };
    });
  }, [isFiltered, filtered, items, inventory.length]);

  const setFilterBiome = (biome: string | null)        => setFilters(f => ({ ...f, biome }));
  const setFilterSlot  = (slot: EquipmentSlot | null) => setFilters(f => ({ ...f, slot }));
  const setFilterTier  = (tier: number | null)        => setFilters(f => ({ ...f, tier }));
  const toggleBiome = (g: string) => setFilterBiome(filterBiome === g ? null : g);
  const toggleSlot  = (s: EquipmentSlot) => setFilterSlot(filterSlot === s ? null : s);
  const toggleTier  = (t: number) => setFilterTier(filterTier === t ? null : t);

  return (
    <div className="inv-backpack">
      <div className="inv-section-label">
        Backpack{inventory.length > 0 ? ` (${inventory.length})` : ''}
      </div>

      {/* Filters — only show when there's something to filter */}
      {(items.length > 1 || isFiltered) && (
        <div className="inv-filters">
          {biomeGroups.length > 1 && (
            <div className="inv-filter-row">
              <button
                type="button"
                className={`inv-filter-chip${!filterBiome ? ' inv-filter-chip--active' : ''}`}
                aria-pressed={!filterBiome}
                onClick={() => setFilterBiome(null)}
              >All</button>
              {biomeGroups.map(g => (
                <button
                  type="button"
                  key={g}
                  className={`inv-filter-chip${filterBiome === g ? ' inv-filter-chip--active' : ''}`}
                  aria-pressed={filterBiome === g}
                  onClick={() => toggleBiome(g)}
                >{biomeName(g)}</button>
              ))}
            </div>
          )}
          {(biomeGroups.length > 1 || tiers.length > 1 || true) && (
            <div className="inv-filter-row">
              <button
                type="button"
                className={`inv-filter-chip${!filterSlot ? ' inv-filter-chip--active' : ''}`}
                aria-pressed={!filterSlot}
                onClick={() => setFilterSlot(null)}
              >All Slots</button>
              {(['weapon', 'armor', 'recovery', 'mobility'] as const).map(s => (
                <button
                  type="button"
                  key={s}
                  className={`inv-filter-chip inv-filter-chip--slot${filterSlot === s ? ' inv-filter-chip--active' : ''}`}
                  data-slot={s}
                  aria-pressed={filterSlot === s}
                  onClick={() => toggleSlot(s)}
                >{SLOT_LABELS[s]}</button>
              ))}
              <button
                type="button"
                className="inv-filter-chip inv-filter-chip--clear"
                disabled={!isFiltered}
                onClick={() => setFilters(EMPTY_GEAR_FILTERS)}
              >Clear filters</button>
            </div>
          )}
          {tiers.length > 1 && (
            <div className="inv-filter-row">
              <button
                type="button"
                className={`inv-filter-chip${!filterTier ? ' inv-filter-chip--active' : ''}`}
                aria-pressed={!filterTier}
                onClick={() => setFilterTier(null)}
              >All Tiers</button>
              {tiers.map(t => (
                <button
                  type="button"
                  key={t}
                  className={`inv-filter-chip inv-filter-chip--tier${filterTier === t ? ' inv-filter-chip--active' : ''}`}
                  style={filterTier === t ? { color: tierColor(t), borderColor: `${tierColor(t)}aa`, background: `${tierColor(t)}18` } : { color: `${tierColor(t)}bb` }}
                  aria-pressed={filterTier === t}
                  onClick={() => toggleTier(t)}
                >T{t}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {isFiltered && filtered.length === 0 ? (
        <div className="inv-filter-empty">No items match the filter.</div>
      ) : (
        <div className="inv-backpack-grid">
          {gridItems.map(({ defId, def, invIndex }, i) => {
            const isFocused = focused?.source === 'backpack' && focused.invIndex === invIndex;
            const color     = def ? tierColor(def.tier) : null;
            const plus      = defId ? (itemUpgrades[defId] ?? 0) : 0;
            const relicLocked = def?.slot === 'relic'
              && !relicIsUnlocked(playerTier, playerNodeId === TEST_ROOM_NODE_ID);

            return (
              <button
                type="button"
                key={defId ?? `empty-${i}`}
                className={[
                  'inv-item-slot',
                  def       ? 'inv-item-slot--filled'  : 'inv-item-slot--empty',
                  isFocused ? 'inv-item-slot--focused' : '',
                ].filter(Boolean).join(' ')}
                style={color ? { borderColor: `${color}77` } : undefined}
                aria-label={relicLocked ? `${def?.name ?? 'Relic'} locked until Tier 4` : def ? `Equip ${def.name}` : 'Empty backpack slot'}
                disabled={!defId || !def || relicLocked}
                onMouseEnter={() => {
                  if (def && defId) onFocus({ defId, source: 'backpack', invIndex: invIndex ?? i });
                }}
                onMouseLeave={() => onFocus(null)}
                onFocus={() => {
                  if (def && defId) onFocus({ defId, source: 'backpack', invIndex: invIndex ?? i });
                }}
                onBlur={() => onFocus(null)}
                onClick={() => { if (defId) hudBus.requestEquipItem(defId); }}
              >
                {def && (
                  <>
                    <span className="inv-item-slot__icon" style={{ background: `${color}0d` }}>
                      {def.icon
                        ? <ItemIcon frameName={def.icon} />
                        : <span className="inv-slot-tier-pip" style={{ background: `${color}cc` }} />
                      }
                    </span>
                    <span className="inv-item-slot__name">
                      {def.name}{plus > 0 ? ` +${plus}` : ''}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
