import { createPortal } from 'react-dom';
import type { PlayerState, EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE, EQUIPMENT_SLOTS } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './inventory.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon:   'Weapon',
  armor:    'Armor',
  recovery: 'Recovery',
  mobility: 'Boots',
  ring1:    'Ring 1',
  ring2:    'Ring 2',
};

const STAT_LABELS: Record<string, string> = {
  attack:         'ATK',
  defense:        'DEF',
  maxHp:          'HP',
  hpRegen:        'REGEN',
  speed:          'SPD',
  attackRange:    'RNG',
  attackCooldown: 'CD ms',
};

function formatMods(mods: Record<string, number>): string {
  return Object.entries(mods)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${STAT_LABELS[k] ?? k}`)
    .join('   ');
}

// ── Equipment slots (left column) ─────────────────────────────────────────────

function EquipmentSlots({ player }: { player: PlayerState }) {
  return (
    <div className="inv-equip">
      <div className="inv-section-title">Equipped</div>
      {EQUIPMENT_SLOTS.map(slot => {
        const defId = player.equipment[slot];
        const def   = defId ? ITEM_DATABASE.get(defId) : null;
        const filled = def != null;

        return (
          <div
            key={slot}
            className={`inv-slot${filled ? ' inv-slot--filled' : ' inv-slot--empty'}`}
            onClick={filled ? () => hudBus.requestUnequipItem(slot) : undefined}
            title={filled ? `Click to unequip ${def!.name}` : `${SLOT_LABELS[slot]} — empty`}
          >
            <span className="inv-slot__label">{SLOT_LABELS[slot]}</span>
            {filled ? (
              <span className="inv-slot__item">
                <span className="inv-slot__name">{def!.name}</span>
                <span className="inv-slot__mods">{formatMods(def!.statModifiers)}</span>
                <span className="inv-slot__unequip-hint">click to unequip</span>
              </span>
            ) : (
              <span className="inv-slot__empty">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Inventory list (right column) ─────────────────────────────────────────────

function InventoryList({ player }: { player: PlayerState }) {
  const count = player.inventory.length;

  return (
    <div className="inv-list">
      <div className="inv-section-title">
        Backpack{count > 0 ? ` (${count})` : ''}
      </div>

      {count === 0 ? (
        <div className="inv-empty">Backpack is empty</div>
      ) : (
        <div className="inv-items">
          {player.inventory.map((defId, idx) => {
            const def = ITEM_DATABASE.get(defId);
            if (!def) return null;

            return (
              <div
                key={`${defId}-${idx}`}
                className="inv-item"
                onClick={() => hudBus.requestEquipItem(defId)}
                title={def.description ?? `Click to equip (${SLOT_LABELS[def.slot]})`}
              >
                <div className="inv-item__top">
                  <span className="inv-item__name">{def.name}</span>
                  <span className="inv-item__slot">{SLOT_LABELS[def.slot]}</span>
                </div>
                <div className="inv-item__mods">{formatMods(def.statModifiers)}</div>
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
  player: PlayerState | null;
  onClose: () => void;
}

export function InventoryPanel({ player, onClose }: Props) {
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
            <EquipmentSlots player={player} />
            <InventoryList player={player} />
          </div>
        ) : (
          <div className="inv-empty">Not connected</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
