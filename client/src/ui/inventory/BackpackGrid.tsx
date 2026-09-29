import { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import { EQUIPMENT_SLOTS, ITEM_DATABASE, TEST_ROOM_NODE_ID, TUTORIAL_ANCHORS, relicIsUnlocked } from '@mmo-idle/shared';
import { inventoryAtom, itemUpgradesAtom, playerNodeIdAtom, playerTierAtom } from '../../hud/atoms';
import { SLOT_LABELS, tierColor } from './constants';
import { ItemIcon } from '../ItemIcon';
import type { ComparePin } from './useFocus';
import { EMPTY_GEAR_FILTERS, backpackFiltersAtom } from '../panelFilters';

const COLS = 4;
const MIN_ROWS = 3;

interface Props {
  compare: ComparePin;
}

export function BackpackGrid({ compare }: Props) {
  const inventory    = useAtomValue(inventoryAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const [filters, setFilters] = useAtom(backpackFiltersAtom);

  // Highest tier first, then by name: the best of what you carry leads the grid.
  // `invIndex` keeps the position in the server's list for anything keyed by it.
  const items = useMemo(() => inventory
    .map((defId, invIndex) => ({ defId, def: ITEM_DATABASE.get(defId) ?? null, invIndex }))
    .sort((a, b) => (b.def?.tier ?? -1) - (a.def?.tier ?? -1)
      || (a.def?.name ?? '').localeCompare(b.def?.name ?? '')), [inventory]);

  // A facet only exists while you carry something that matches it.
  const slots = useMemo(
    () => EQUIPMENT_SLOTS.filter((slot) => items.some(({ def }) => def?.slot === slot)),
    [items],
  );
  const tiers = useMemo(() => {
    const ts = new Set<number>();
    for (const { def } of items) if (def) ts.add(def.tier);
    return Array.from(ts).sort((a, b) => b - a);
  }, [items]);

  // A remembered facet that no longer exists would filter invisibly.
  const filterSlot = filters.slot && slots.length > 1 && slots.includes(filters.slot) ? filters.slot : null;
  const filterTier = filters.tier !== null && tiers.length > 1 && tiers.includes(filters.tier) ? filters.tier : null;
  const isFiltered = filterSlot !== null || filterTier !== null;

  const filtered = useMemo(() => items.filter(({ def }) => {
    if (!def) return false;
    if (filterSlot && def.slot !== filterSlot) return false;
    if (filterTier && def.tier !== filterTier) return false;
    return true;
  }), [items, filterSlot, filterTier]);

  // Grid cells: filtered compact list or full padded grid
  const gridItems = useMemo(() => {
    if (isFiltered) return filtered;
    const rows = Math.max(MIN_ROWS, Math.ceil(items.length / COLS));
    return Array.from({ length: rows * COLS }, (_, i) =>
      i < items.length ? items[i] : { defId: null, def: null, invIndex: i });
  }, [isFiltered, filtered, items]);

  const setFilterSlot = (slot: EquipmentSlot | null) => setFilters(f => ({ ...f, slot }));
  const setFilterTier = (tier: number | null)        => setFilters(f => ({ ...f, tier }));
  const toggleSlot = (s: EquipmentSlot) => setFilterSlot(filterSlot === s ? null : s);
  const toggleTier = (t: number) => setFilterTier(filterTier === t ? null : t);

  return (
    <div className="inv-backpack">
      <div className="inv-section-label">
        Backpack{inventory.length > 0 ? ` (${inventory.length})` : ''}
      </div>

      {(slots.length > 1 || tiers.length > 1) && (
        <div className="inv-filters">
          {slots.length > 1 && (
            <div className="inv-filter-row">
              <button
                type="button"
                className={`inv-filter-chip${!filterSlot ? ' inv-filter-chip--active' : ''}`}
                aria-pressed={!filterSlot}
                onClick={() => setFilterSlot(null)}
              >All Slots</button>
              {slots.map(s => (
                <button
                  type="button"
                  key={s}
                  className={`inv-filter-chip inv-filter-chip--slot${filterSlot === s ? ' inv-filter-chip--active' : ''}`}
                  data-slot={s}
                  aria-pressed={filterSlot === s}
                  onClick={() => toggleSlot(s)}
                >{SLOT_LABELS[s]}</button>
              ))}
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
              <button
                type="button"
                className="inv-filter-chip inv-filter-chip--clear"
                disabled={!isFiltered}
                onClick={() => setFilters(EMPTY_GEAR_FILTERS)}
              >Clear filters</button>
            </div>
          )}
        </div>
      )}

      {isFiltered && filtered.length === 0 ? (
        <div className="inv-filter-empty">No items match the filter.</div>
      ) : (
        <div className="inv-backpack-grid">
          {gridItems.map(({ defId, def, invIndex }, i) => {
            const isShown  = !!defId && compare.shown === defId;
            const isPinned = !!defId && compare.pinned === defId;
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
                  isShown ? 'inv-item-slot--focused' : '',
                  isPinned ? 'inv-item-slot--pinned' : '',
                ].filter(Boolean).join(' ')}
                style={color ? { borderColor: `${color}77` } : undefined}
                aria-label={def ? `Compare ${def.name}${relicLocked ? ' (relics unlock at Tier 4)' : ''}` : 'Empty backpack slot'}
                aria-pressed={def ? isPinned : undefined}
                data-tutorial-anchor={defId ? TUTORIAL_ANCHORS.inventoryItem(defId) : undefined}
                disabled={!defId || !def}
                onMouseEnter={() => { if (def && defId) compare.hover(defId); }}
                onMouseLeave={() => compare.hover(null)}
                onFocus={() => { if (def && defId) compare.hover(defId); }}
                onBlur={() => compare.hover(null)}
                onClick={() => { if (defId) compare.togglePin(defId); }}
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
