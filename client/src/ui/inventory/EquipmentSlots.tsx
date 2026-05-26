import type { PlayerView } from '@mmo-idle/shared';
import { EQUIPMENT_SLOTS, ITEM_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { SLOT_LABELS, tierColor } from './constants';
import type { FocusedItem } from './useFocus';

interface Props {
  player: PlayerView;
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}

export function EquipmentSlots({ player, focused, onFocus }: Props) {
  return (
    <div className="inv-equip">
      <div className="inv-section-label">Equipped</div>
      <div className="inv-equip-grid">
        {EQUIPMENT_SLOTS.map(slot => {
          const defId = player.equipment[slot];
          const def   = defId ? ITEM_DATABASE.get(defId) : null;
          const filled    = def != null;
          const isFocused = focused?.source === 'equipped' && focused.equipSlot === slot;
          const color     = filled ? tierColor(def.tier) : null;

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
                {filled && <span className="inv-equip-slot__name">{def.name}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
