import { useMemo, useState } from 'react';
import type { EquipmentSlot, PlayerView } from '@mmo-idle/shared';
import { ITEM_DATABASE, RECIPE_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { SLOT_LABELS, biomeName, tierColor } from './constants';
import type { FocusedItem } from './useFocus';

const COLS = 4;
const MIN_ROWS = 3;

interface Props {
  player: PlayerView;
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}

export function BackpackGrid({ player, focused, onFocus }: Props) {
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<EquipmentSlot | null>(null);
  const [filterTier,  setFilterTier]  = useState<number | null>(null);

  // Build rich item list with recipe metadata
  const items = useMemo(() => player.inventory.map((defId, i) => {
    const def    = ITEM_DATABASE.get(defId) ?? null;
    const recipe = def ? RECIPE_DATABASE.get(defId) : null;
    return { defId, def, recipe, invIndex: i };
  }), [player.inventory]);

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
    const count = player.inventory.length;
    const rows  = Math.max(MIN_ROWS, Math.ceil(count / COLS));
    return Array.from({ length: rows * COLS }, (_, i) => {
      if (i < items.length) return items[i];
      return { defId: null, def: null, recipe: null, invIndex: i };
    });
  }, [isFiltered, filtered, items, player.inventory.length]);

  const toggleBiome = (g: string) => setFilterBiome(v => v === g ? null : g);
  const toggleSlot  = (s: EquipmentSlot) => setFilterSlot(v => v === s ? null : s);
  const toggleTier  = (t: number) => setFilterTier(v => v === t ? null : t);

  return (
    <div className="inv-backpack">
      <div className="inv-section-label">
        Backpack{player.inventory.length > 0 ? ` (${player.inventory.length})` : ''}
      </div>

      {/* Filters — only show when there's something to filter */}
      {items.length > 1 && (
        <div className="inv-filters">
          {biomeGroups.length > 1 && (
            <div className="inv-filter-row">
              <button
                className={`inv-filter-chip${!filterBiome ? ' inv-filter-chip--active' : ''}`}
                onClick={() => setFilterBiome(null)}
              >All</button>
              {biomeGroups.map(g => (
                <button
                  key={g}
                  className={`inv-filter-chip${filterBiome === g ? ' inv-filter-chip--active' : ''}`}
                  onClick={() => toggleBiome(g)}
                >{biomeName(g)}</button>
              ))}
            </div>
          )}
          {(biomeGroups.length > 1 || tiers.length > 1 || true) && (
            <div className="inv-filter-row">
              <button
                className={`inv-filter-chip${!filterSlot ? ' inv-filter-chip--active' : ''}`}
                onClick={() => setFilterSlot(null)}
              >All Slots</button>
              {(['weapon', 'armor', 'recovery', 'mobility'] as const).map(s => (
                <button
                  key={s}
                  className={`inv-filter-chip inv-filter-chip--slot${filterSlot === s ? ' inv-filter-chip--active' : ''}`}
                  data-slot={s}
                  onClick={() => toggleSlot(s)}
                >{SLOT_LABELS[s]}</button>
              ))}
            </div>
          )}
          {tiers.length > 1 && (
            <div className="inv-filter-row">
              <button
                className={`inv-filter-chip${!filterTier ? ' inv-filter-chip--active' : ''}`}
                onClick={() => setFilterTier(null)}
              >All Tiers</button>
              {tiers.map(t => (
                <button
                  key={t}
                  className={`inv-filter-chip inv-filter-chip--tier${filterTier === t ? ' inv-filter-chip--active' : ''}`}
                  style={filterTier === t ? { color: tierColor(t), borderColor: `${tierColor(t)}aa`, background: `${tierColor(t)}18` } : { color: `${tierColor(t)}bb` }}
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

            return (
              <div
                key={defId ?? `empty-${i}`}
                className={[
                  'inv-item-slot',
                  def       ? 'inv-item-slot--filled'  : 'inv-item-slot--empty',
                  isFocused ? 'inv-item-slot--focused' : '',
                ].filter(Boolean).join(' ')}
                style={color ? { borderColor: `${color}77` } : undefined}
                onMouseEnter={() => {
                  if (def && defId) onFocus({ defId, source: 'backpack', invIndex: invIndex ?? i });
                }}
                onMouseLeave={() => onFocus(null)}
                onClick={() => { if (defId) hudBus.requestEquipItem(defId); }}
              >
                {def && (
                  <>
                    <div className="inv-item-slot__icon" style={{ background: `${color}0d` }}>
                      <span className="inv-slot-tier-pip" style={{ background: `${color}cc` }} />
                    </div>
                    <div className="inv-item-slot__name">{def.name}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
