import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { BackpackGrid } from './BackpackGrid';
import { EquipmentSlots } from './EquipmentSlots';
import { StatSheet } from './StatSheet';
import { playerIdAtom } from '../../hud/atoms';
import { useIsMobile } from '../../hud/useIsMobile';
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from '../../hud/primitives';
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

  const showGear = !isMobile || section === 'gear';
  const showBag = !isMobile || section === 'bag';
  const showStats = !isMobile || section === 'stats';

  return (
    <GameDialog size="wide" className="inventory-dialog" onClose={onClose}>
      <DialogHeader title="Inventory & Equipment" closeLabel="Close inventory" />

      {playerId ? (
        <>
          {isMobile && (
            <DialogTabs label="Inventory sections" className="inv-mobile-tabs">
              <DialogTab
                selected={section === 'gear'}
                controls="inventory-gear"
                onSelect={() => setSection('gear')}
              >
                Gear
              </DialogTab>
              <DialogTab
                selected={section === 'bag'}
                controls="inventory-bag"
                onSelect={() => setSection('bag')}
              >
                Bag
              </DialogTab>
              <DialogTab
                selected={section === 'stats'}
                controls="inventory-stats"
                onSelect={() => setSection('stats')}
              >
                Stats
              </DialogTab>
            </DialogTabs>
          )}
          <div className="inv-body">
            {showGear && (
              <div id="inventory-gear" className="inv-left" role={isMobile ? 'tabpanel' : undefined}>
                <EquipmentSlots focused={focused} onFocus={focus} />
              </div>
            )}
            {showBag && (
              <div id="inventory-bag" className="inv-center" role={isMobile ? 'tabpanel' : undefined}>
                <BackpackGrid focused={focused} onFocus={focus} />
              </div>
            )}
            {showStats && (
              <div id="inventory-stats" className="inv-right" role={isMobile ? 'tabpanel' : undefined}>
                <StatSheet focused={focused} onFocus={focus} />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="inv-placeholder">Not connected</div>
      )}
    </GameDialog>
  );
}
