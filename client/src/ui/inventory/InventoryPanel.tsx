import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { BackpackGrid } from './BackpackGrid';
import { EquipmentSlots } from './EquipmentSlots';
import { StatSheet } from './StatSheet';
import { playerIdAtom } from '../../hud/atoms';
import { useIsMobile } from '../../hud/useIsMobile';
import { useFocusWithDelay } from './useFocus';
import '../inventory.css';

interface Props {
  onClose: () => void;
}

// On phones the desktop 3-column layout doesn't fit, so we show one column at a
// time behind a tab switcher.
type InvSection = 'gear' | 'bag' | 'stats';

export function InventoryPanel({ onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const isMobile = useIsMobile();
  const { focused, focus } = useFocusWithDelay();
  const [section, setSection] = useState<InvSection>('bag');

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const showGear  = !isMobile || section === 'gear';
  const showBag   = !isMobile || section === 'bag';
  const showStats = !isMobile || section === 'stats';

  return createPortal(
    <div className="inv-overlay" onClick={handleOverlayClick}>
      <div className="inv-panel">

        <div className="inv-header">
          <span className="inv-title">Inventory &amp; Equipment</span>
          <button className="inv-close" onClick={onClose}>✕</button>
        </div>

        {playerId ? (
          <>
            {isMobile && (
              <div className="inv-mobile-tabs">
                <button
                  className={`inv-mobile-tab${section === 'gear' ? ' inv-mobile-tab--active' : ''}`}
                  onClick={() => setSection('gear')}
                >Gear</button>
                <button
                  className={`inv-mobile-tab${section === 'bag' ? ' inv-mobile-tab--active' : ''}`}
                  onClick={() => setSection('bag')}
                >Bag</button>
                <button
                  className={`inv-mobile-tab${section === 'stats' ? ' inv-mobile-tab--active' : ''}`}
                  onClick={() => setSection('stats')}
                >Stats</button>
              </div>
            )}
            <div className="inv-body">
              {showGear && (
                <div className="inv-left">
                  <EquipmentSlots focused={focused} onFocus={focus} />
                </div>
              )}
              {showBag && (
                <div className="inv-center">
                  <BackpackGrid focused={focused} onFocus={focus} />
                </div>
              )}
              {showStats && (
                <div className="inv-right">
                  <StatSheet focused={focused} onFocus={focus} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="inv-placeholder">Not connected</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
