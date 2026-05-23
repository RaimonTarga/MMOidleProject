import { createPortal } from 'react-dom';
import { useState, useRef } from 'react';
import type { PlayerState, EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE, EQUIPMENT_SLOTS } from '@mmo-idle/shared';
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

  const item = focused;  // capture non-null ref for closures
  const def = ITEM_DATABASE.get(item.defId);
  if (!def) return null;

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
      onMouseEnter={() => onFocus(item)}
      onMouseLeave={() => onFocus(null)}
    >
      <div className="inv-desc__header">
        <span className="inv-desc__name">{def.name}</span>
        <span className="inv-desc__slot">{SLOT_LABELS[def.slot]}</span>
      </div>
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
  player:  PlayerState;
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

          return (
            <div
              key={slot}
              className={[
                'inv-equip-slot',
                filled    ? 'inv-equip-slot--filled'  : 'inv-equip-slot--empty',
                isFocused ? 'inv-equip-slot--focused' : '',
              ].filter(Boolean).join(' ')}
              onMouseEnter={() => {
                if (filled && defId) onFocus({ defId, source: 'equipped', equipSlot: slot });
              }}
              onMouseLeave={() => onFocus(null)}
              onClick={() => { if (filled) hudBus.requestUnequipItem(slot); }}
            >
              <div className="inv-equip-slot__icon">
                {!filled && <span className="inv-equip-slot__dash">—</span>}
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

// ── Backpack grid ──────────────────────────────────────────────────────────────

const COLS = 4;
const MIN_ROWS = 3;

function BackpackGrid({ player, focused, onFocus }: {
  player:  PlayerState;
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}) {
  const count = player.inventory.length;
  const rows  = Math.max(MIN_ROWS, Math.ceil(count / COLS));
  const slots = Array.from({ length: rows * COLS }, (_, i) => {
    const defId = player.inventory[i] ?? null;
    return { defId, def: defId ? (ITEM_DATABASE.get(defId) ?? null) : null };
  });

  return (
    <div className="inv-backpack">
      <div className="inv-section-label">
        Backpack{count > 0 ? ` (${count})` : ''}
      </div>
      <div className="inv-backpack-grid">
        {slots.map(({ defId, def }, i) => {
          const isFocused = focused?.source === 'backpack' && focused.invIndex === i;
          return (
            <div
              key={i}
              className={[
                'inv-item-slot',
                def       ? 'inv-item-slot--filled'  : 'inv-item-slot--empty',
                isFocused ? 'inv-item-slot--focused' : '',
              ].filter(Boolean).join(' ')}
              onMouseEnter={() => {
                if (def && defId) onFocus({ defId, source: 'backpack', invIndex: i });
              }}
              onMouseLeave={() => onFocus(null)}
              onClick={() => { if (defId) hudBus.requestEquipItem(defId); }}
            >
              {def && (
                <>
                  <div className="inv-item-slot__icon" />
                  <div className="inv-item-slot__name">{def.name}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface Props {
  player: PlayerState | null;
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
