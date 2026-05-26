import { createPortal } from 'react-dom';
import type { PlayerView } from '@mmo-idle/shared';
import { BackpackGrid } from './BackpackGrid';
import { EquipmentSlots } from './EquipmentSlots';
import { ItemDesc } from './ItemDesc';
import { useFocusWithDelay } from './useFocus';
import '../inventory.css';

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
