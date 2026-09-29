import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { BackpackGrid } from './BackpackGrid';
import { EquipmentSlots } from './EquipmentSlots';
import { StatSheet } from './StatSheet';
import { playerIdAtom } from '../../hud/atoms';
import { tutorialFocusAtom } from '../../tutorial/atoms';
import { useIsMobile } from '../../hud/useIsMobile';
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from '../../hud/primitives';
import { useComparePin } from './useFocus';
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
  const [section, setSection] = useState<InvSection>('bag');
  // On phones the sheet is its own tab: pinning an item takes you to it.
  const compare = useComparePin(() => { if (isMobile) setSection('stats'); });
  // The guided tutorial pins the item it is about to equip.
  const tutorialFocus = useAtomValue(tutorialFocusAtom);
  const { pinned, togglePin } = compare;
  useEffect(() => {
    if (tutorialFocus?.surface === 'inventory' && pinned !== tutorialFocus.definitionId) {
      togglePin(tutorialFocus.definitionId);
    }
  }, [tutorialFocus]); // eslint-disable-line react-hooks/exhaustive-deps

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
                <EquipmentSlots compare={compare} />
              </div>
            )}
            {showBag && (
              <div id="inventory-bag" className="inv-center" role={isMobile ? 'tabpanel' : undefined}>
                <BackpackGrid compare={compare} />
              </div>
            )}
            {showStats && (
              <div id="inventory-stats" className="inv-right" role={isMobile ? 'tabpanel' : undefined}>
                <StatSheet compare={compare} />
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
