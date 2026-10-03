import { useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import { EQUIPMENT_SLOTS, ITEM_DATABASE, TEST_ROOM_NODE_ID, TUTORIAL_ANCHORS, coreEligibilityLabel, coreIsActive, isRestrictedCore, lineageForEquippedItem, relicIsUnlocked } from '@mmo-idle/shared';
import { equipmentAtom, lineagesAtom, playerNodeIdAtom, playerTierAtom, selectedRangeAtom } from '../../hud/atoms';
import { SLOT_LABELS, tierColor } from './constants';
import { lineageDisplayName } from '../lineage/lineageDisplayName';
import { ItemIcon } from '../ItemIcon';
import type { ComparePin } from './useFocus';

interface Props {
  compare: ComparePin;
  /** A slot holds a lineage (the item equipped is a lineage form) — open its tree. */
  onOpenLineage?: (slot: EquipmentSlot) => void;
}

export function EquipmentSlots({ compare, onOpenLineage }: Props) {
  const equipment = useAtomValue(equipmentAtom);
  const lineages = useAtomValue(lineagesAtom);
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
          const coreInactive = filled && slot === 'core'
            && isRestrictedCore(def.coreEligibility)
            && !coreIsActive(def.coreEligibility, selectedRange);
          const relicLocked = slot === 'relic'
            && !relicIsUnlocked(playerTier, playerNodeId === TEST_ROOM_NODE_ID);
          // The slot holds the lineage, not the item (design §2): a form's slot
          // reads as "<Lineage name>" with the worn form's own name underneath,
          // and tapping it opens the tree instead of pinning a compare card.
          // A parked slot (design §24.5: armour, charm, boots) has no tree to
          // open, even when an old save still holds one, so it reads as an item.
          const lineage = filled ? lineageForEquippedItem(defId) : undefined;
          const hasTree = !!lineage && !!lineages[lineage.id];

          return (
            <button
              type="button"
              key={slot}
              data-tutorial-anchor={TUTORIAL_ANCHORS.equipmentSlot(slot)}
              className={[
                'inv-equip-slot',
                filled ? 'inv-equip-slot--filled' : 'inv-equip-slot--empty',
                isShown ? 'inv-equip-slot--focused' : '',
                isPinned ? 'inv-equip-slot--pinned' : '',
                coreInactive ? 'inv-equip-slot--inactive' : '',
                relicLocked ? 'inv-equip-slot--inactive' : '',
                hasTree ? 'inv-equip-slot--lineage' : '',
              ].filter(Boolean).join(' ')}
              style={color ? { borderColor: `${color}88` } : undefined}
              title={relicLocked ? 'Relics unlock at Tier 4' : coreInactive
                ? `Inactive — ${coreEligibilityLabel(def.coreEligibility).toLowerCase()}`
                : hasTree ? `Open the ${lineageDisplayName(lineage!)} tree`
                  : undefined}
              aria-label={filled
                ? hasTree ? `Open the ${lineageDisplayName(lineage!)} tree` : `Show what ${def.name} gives you`
                : `${SLOT_LABELS[slot]} slot empty`}
              aria-pressed={filled && !hasTree ? isPinned : undefined}
              disabled={!filled}
              onMouseEnter={() => { if (filled && defId && !hasTree) compare.hover(defId); }}
              onMouseLeave={() => compare.hover(null)}
              onFocus={() => { if (filled && defId && !hasTree) compare.hover(defId); }}
              onBlur={() => compare.hover(null)}
              onClick={() => {
                if (!filled) return;
                if (hasTree) { onOpenLineage?.(slot); return; }
                if (defId) compare.togglePin(defId);
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
                <span className="inv-equip-slot__type">
                  {hasTree ? lineageDisplayName(lineage!) : SLOT_LABELS[slot]}
                </span>
                {filled && (
                  <span className="inv-equip-slot__name">
                    {def.name}
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
