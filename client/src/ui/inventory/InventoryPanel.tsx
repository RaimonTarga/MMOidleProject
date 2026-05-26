import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { BackpackGrid } from './BackpackGrid';
import { EquipmentSlots } from './EquipmentSlots';
import { ItemDesc } from './ItemDesc';
import { playerIdAtom } from '../../hud/atoms';
import { useFocusWithDelay } from './useFocus';
import '../inventory.css';

interface Props {
  onClose: () => void;
}

export function InventoryPanel({ onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);
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

        {playerId ? (
          <div className="inv-body">
            <div className="inv-left">
              <EquipmentSlots focused={focused} onFocus={focus} />
            </div>
            <div className="inv-right">
              <BackpackGrid focused={focused} onFocus={focus} />
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
