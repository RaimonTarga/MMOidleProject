import { createPortal } from 'react-dom';
import { useState, useRef, useMemo } from 'react';
import type { PlayerView, EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE, EQUIPMENT_SLOTS, RECIPE_DATABASE, BIOME_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './inventory.css';

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon:   'Weapon',
  armor:    'Armor',
  recovery: 'Recovery',
  mobility: 'Boots',
};

const STAT_LABELS: Record<string, string> = {
  attack:         'ATK',
  defense:        'DEF',
  maxHp:          'HP',
  hpRegen:        'REGEN',
  speed:          'SPD',
  attackRange:    'RNG',
  attackCooldown: 'CD',
};

// Matches PLAYER_SHADOW_RAMP in sprites.ts
const TIER_COLORS: Record<number, string> = {
  0: '#444444',
  1: '#ff4444',
  2: '#ff8800',
  3: '#ffee00',
  4: '#44ff88',
  5: '#00ddcc',
  6: '#4488ff',
};

function tierColor(tier: number): string {
  return TIER_COLORS[tier] ?? '#444444';
}

function biomeName(group: string): string {
  const biome = BIOME_DATABASE.get(group);
  return biome ? biome.name : group.charAt(0).toUpperCase() + group.slice(1);
}

interface FocusedItem {
  defId:      string;
  source:     'backpack' | 'equipped';
  invIndex?:  number;
  equipSlot?: EquipmentSlot;
}

function useFocusWithDelay() {
  const [focused, setFocused] = useState<FocusedItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function focus(item: FocusedItem | null) {
    if (timer.current) clearTimeout(timer.current);
    if (item) {
      setFocused(item);
    } else {
      timer.current = setTimeout(() => setFocused(null), 120);
    }
  }

  return { focused, focus };
}

// ── Item description panel ─────────────────────────────────────────────────────

function ItemDesc({ focused, onFocus }: {
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}) {
  if (!focused) {
    return (
      <div className="inv-desc inv-desc--empty">
        Hover an item to see details
      </div>
    );
  }

  const item = focused;
  const def = ITEM_DATABASE.get(item.defId);
  if (!def) return null;

  const recipe = RECIPE_DATABASE.get(item.defId);
  const color  = tierColor(def.tier);

  const stats: { label: string; value: string }[] = [];
  if (def.attacksPerSecond !== undefined) {
    stats.push({ label: 'APS', value: String(def.attacksPerSecond) });
  }
  for (const [k, v] of Object.entries(def.statModifiers)) {
    stats.push({ label: STAT_LABELS[k] ?? k, value: `${v > 0 ? '+' : ''}${v}` });
  }

  const isEquipped = item.source === 'equipped';

  function handleAction() {
    if (isEquipped && item.equipSlot) {
      hudBus.requestUnequipItem(item.equipSlot);
    } else {
      hudBus.requestEquipItem(item.defId);
    }
  }

  return (
    <div
      className="inv-desc"
      style={{ borderColor: `${color}55` }}
      onMouseEnter={() => onFocus(item)}
      onMouseLeave={() => onFocus(null)}
    >
      <div className="inv-desc__header">
        <span className="inv-desc__name">{def.name}</span>
        <span className="inv-desc__tier-badge" style={{ color, borderColor: `${color}66`, background: `${color}18` }}>
          T{def.tier}
        </span>
        <span className="inv-desc__slot">{SLOT_LABELS[def.slot]}</span>
      </div>
      {recipe?.recipeGroup && (
        <div className="inv-desc__biome">{biomeName(recipe.recipeGroup)}</div>
      )}
      <div className="inv-desc__divider" />
      {stats.length > 0 && (
        <div className="inv-desc__stats">
          {stats.map(s => (
            <span key={s.label} className="inv-desc__stat">
              <span className="inv-desc__stat-value">{s.value}</span>
              <span className="inv-desc__stat-label">{s.label}</span>
            </span>
          ))}
        </div>
      )}
      {def.description && (
        <div className="inv-desc__text">{def.description}</div>
      )}
      <button
        className={`inv-desc__btn${isEquipped ? ' inv-desc__btn--unequip' : ''}`}
        onClick={handleAction}
      >
        {isEquipped ? 'Unequip' : 'Equip'}
      </button>
    </div>
  );
}

// ── Equipment slots ────────────────────────────────────────────────────────────

function EquipmentSlots({ player, focused, onFocus }: {
  player:  PlayerView;
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}) {
  return (
    <div className="inv-equip">
      <div className="inv-section-label">Equipped</div>
      <div className="inv-equip-grid">
        {EQUIPMENT_SLOTS.map(slot => {
          const defId = player.equipment[slot];
          const def   = defId ? ITEM_DATABASE.get(defId) : null;
          const filled    = def != null;
          const isFocused = focused?.source === 'equipped' && focused.equipSlot === slot;
          const color     = filled ? tierColor(def!.tier) : null;

          return (
            <div
              key={slot}
              className={[
                'inv-equip-slot',
                filled    ? 'inv-equip-slot--filled'  : 'inv-equip-slot--empty',
                isFocused ? 'inv-equip-slot--focused' : '',
              ].filter(Boolean).join(' ')}
              style={color ? { borderColor: `${color}88` } : undefined}
              onMouseEnter={() => {
                if (filled && defId) onFocus({ defId, source: 'equipped', equipSlot: slot });
              }}
              onMouseLeave={() => onFocus(null)}
              onClick={() => { if (filled) hudBus.requestUnequipItem(slot); }}
            >
              <div
                className="inv-equip-slot__icon"
                style={color ? { background: `${color}10` } : undefined}
              >
                {!filled && <span className="inv-equip-slot__dash">—</span>}
                {color && (
                  <span className="inv-slot-tier-pip" style={{ background: `${color}cc` }} />
                )}
              </div>
              <div className="inv-equip-slot__footer">
                <span className="inv-equip-slot__type">{SLOT_LABELS[slot]}</span>
                {filled && <span className="inv-equip-slot__name">{def!.name}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Backpack grid with filters ─────────────────────────────────────────────────

const COLS = 4;
const MIN_ROWS = 3;

function BackpackGrid({ player, focused, onFocus }: {
  player:  PlayerView;
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}) {
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);
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
  const toggleSlot  = (s: string) => setFilterSlot(v  => v === s ? null : s);
  const toggleTier  = (t: number) => setFilterTier(v  => v === t ? null : t);

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

// ── Panel ──────────────────────────────────────────────────────────────────────

interface Props {
  player: PlayerView | null;
  onClose: () => void;
}

export function InventoryPanel({ player, onClose }: Props) {
  const { focused, focus } = useFocusWithDelay();

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="inv-overlay" onClick={handleOverlayClick}>
      <div className="inv-panel">

        <div className="inv-header">
          <span className="inv-title">Inventory &amp; Equipment</span>
          <button className="inv-close" onClick={onClose}>✕</button>
        </div>

        {player ? (
          <div className="inv-body">
            <div className="inv-left">
              <EquipmentSlots player={player} focused={focused} onFocus={focus} />
            </div>
            <div className="inv-right">
              <BackpackGrid player={player} focused={focused} onFocus={focus} />
              <ItemDesc focused={focused} onFocus={focus} />
            </div>
          </div>
        ) : (
          <div className="inv-placeholder">Not connected</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
