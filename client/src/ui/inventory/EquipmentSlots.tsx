import { useAtomValue } from 'jotai';
import { EQUIPMENT_SLOTS, ITEM_DATABASE, coreEligibilityLabel, coreIsActive, isRestrictedCore } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { equipmentAtom, itemUpgradesAtom, selectedRangeAtom } from '../../hud/atoms';
import { SLOT_LABELS, tierColor } from './constants';
import { ItemIcon } from '../ItemIcon';
import type { FocusedItem } from './useFocus';

interface Props {
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}

export function EquipmentSlots({ focused, onFocus }: Props) {
  const equipment = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);

  return (
    <div className="inv-equip">
      <div className="inv-section-label">Equipped</div>
      <div className="inv-equip-grid">
        {EQUIPMENT_SLOTS.map((slot) => {
          const defId = equipment[slot];
          const def = defId ? ITEM_DATABASE.get(defId) : null;
          const filled = def != null;
          const isFocused = focused?.source === 'equipped' && focused.equipSlot === slot;
          const color = filled ? tierColor(def.tier) : null;
          const plus = defId ? (itemUpgrades[defId] ?? 0) : 0;
          const coreInactive = filled && slot === 'core'
            && isRestrictedCore(def.coreEligibility)
            && !coreIsActive(def.coreEligibility, selectedRange);

          return (
            <button
              type="button"
              key={slot}
              className={[
                'inv-equip-slot',
                filled ? 'inv-equip-slot--filled' : 'inv-equip-slot--empty',
                isFocused ? 'inv-equip-slot--focused' : '',
                coreInactive ? 'inv-equip-slot--inactive' : '',
              ].filter(Boolean).join(' ')}
              style={color ? { borderColor: `${color}88` } : undefined}
              title={coreInactive
                ? `Inactive — ${coreEligibilityLabel(def.coreEligibility).toLowerCase()}`
                : undefined}
              aria-label={filled ? `Unequip ${def.name}` : `${SLOT_LABELS[slot]} slot empty`}
              disabled={!filled}
              onMouseEnter={() => {
                if (filled && defId) onFocus({ defId, source: 'equipped', equipSlot: slot });
              }}
              onMouseLeave={() => onFocus(null)}
              onFocus={() => {
                if (filled && defId) onFocus({ defId, source: 'equipped', equipSlot: slot });
              }}
              onBlur={() => onFocus(null)}
              onClick={() => {
                if (filled) hudBus.requestUnequipItem(slot);
              }}
            >
              <span
                className="inv-equip-slot__icon"
                style={color ? { background: `${color}10` } : undefined}
              >
                {!filled && <span className="inv-equip-slot__dash">—</span>}
                {filled && (def?.icon
                  ? <ItemIcon frameName={def.icon} />
                  : <span className="inv-slot-tier-pip" style={{ background: `${color}cc` }} />
                )}
              </span>
              <span className="inv-equip-slot__footer">
                <span className="inv-equip-slot__type">{SLOT_LABELS[slot]}</span>
                {filled && (
                  <span className="inv-equip-slot__name">
                    {def.name}{plus > 0 ? ` +${plus}` : ''}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
