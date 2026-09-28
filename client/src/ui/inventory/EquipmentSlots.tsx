import { useAtomValue } from 'jotai';
import { EQUIPMENT_SLOTS, ITEM_DATABASE, TEST_ROOM_NODE_ID, coreEligibilityLabel, coreIsActive, isRestrictedCore, relicIsUnlocked } from '@mmo-idle/shared';
import { equipmentAtom, itemUpgradesAtom, playerNodeIdAtom, playerTierAtom, selectedRangeAtom } from '../../hud/atoms';
import { SLOT_LABELS, tierColor } from './constants';
import { ItemIcon } from '../ItemIcon';
import type { ComparePin } from './useFocus';

interface Props {
  compare: ComparePin;
}

export function EquipmentSlots({ compare }: Props) {
  const equipment = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const playerNodeId = useAtomValue(playerNodeIdAtom);

  return (
    <div className="inv-equip">
      <div className="inv-section-label">Equipped</div>
      <div className="inv-equip-grid">
        {EQUIPMENT_SLOTS.map((slot) => {
          const defId = equipment[slot];
          const def = defId ? ITEM_DATABASE.get(defId) : null;
          const filled = def != null;
          const isShown = !!defId && compare.shown === defId;
          const isPinned = !!defId && compare.pinned === defId;
          const color = filled ? tierColor(def.tier) : null;
          const plus = defId ? (itemUpgrades[defId] ?? 0) : 0;
          const coreInactive = filled && slot === 'core'
            && isRestrictedCore(def.coreEligibility)
            && !coreIsActive(def.coreEligibility, selectedRange);
          const relicLocked = slot === 'relic'
            && !relicIsUnlocked(playerTier, playerNodeId === TEST_ROOM_NODE_ID);

          return (
            <button
              type="button"
              key={slot}
              className={[
                'inv-equip-slot',
                filled ? 'inv-equip-slot--filled' : 'inv-equip-slot--empty',
                isShown ? 'inv-equip-slot--focused' : '',
                isPinned ? 'inv-equip-slot--pinned' : '',
                coreInactive ? 'inv-equip-slot--inactive' : '',
                relicLocked ? 'inv-equip-slot--inactive' : '',
              ].filter(Boolean).join(' ')}
              style={color ? { borderColor: `${color}88` } : undefined}
              title={relicLocked ? 'Relics unlock at Tier 4' : coreInactive
                ? `Inactive — ${coreEligibilityLabel(def.coreEligibility).toLowerCase()}`
                : undefined}
              aria-label={filled ? `Show what ${def.name} gives you` : `${SLOT_LABELS[slot]} slot empty`}
              aria-pressed={filled ? isPinned : undefined}
              disabled={!filled}
              onMouseEnter={() => { if (filled && defId) compare.hover(defId); }}
              onMouseLeave={() => compare.hover(null)}
              onFocus={() => { if (filled && defId) compare.hover(defId); }}
              onBlur={() => compare.hover(null)}
              onClick={() => { if (filled && defId) compare.togglePin(defId); }}
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
