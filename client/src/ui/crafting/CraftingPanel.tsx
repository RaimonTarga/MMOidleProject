import { useAtomValue } from 'jotai';
import { MakeTab } from './MakeTab';
import { playerIdAtom } from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { GameIcon } from '../GameIcon';
import { craftingSectionIconSource, type CraftingSectionIcon } from '../systemIcons';
import { UpgradeTab } from '../lineage/UpgradePanel';
import '../crafting.css';

/**
 * The crafting shell's two destinations, each its own menu entry: Make (the
 * recipe browser) and Upgrade. The +N ladder that Upgrade used to hold is
 * retired on every slot (design §24.5); since design §26.4 the Upgrade slot
 * opens on the worn items, and the weapon opens its page there.
 */
export type CraftTab = 'make' | 'upgrade';

interface Props {
  tab: CraftTab;
  onClose: () => void;
}

export function CraftingPanel({ tab, onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const title = tab === 'upgrade' ? 'Upgrade' : 'Crafting';
  const icon: CraftingSectionIcon = tab === 'upgrade' ? 'upgrade' : 'forge';

  return (
    <GameDialog
      size="wide"
      className={tab === 'upgrade' ? 'crafting-dialog upgrade-dialog weapon-page-dialog' : 'crafting-dialog'}
      onClose={onClose}
    >
      <DialogHeader
        title={title}
        icon={
          <GameIcon
            source={craftingSectionIconSource(icon)}
            size={22}
            fallback={null}
            decorative
          />
        }
        closeLabel={`Close ${title.toLowerCase()}`}
      />

      {/* Crafting owns its recipe-list scroll; the Upgrade page owns its own. */}
      <div
        id={`craft-panel-${tab}`}
        className={`crafting-dialog__content crafting-dialog__content--${tab}`}
      >
        {!playerId ? (
          <div className="craft-empty">Not connected.</div>
        ) : tab === 'upgrade' ? (
          <UpgradeTab />
        ) : (
          <MakeTab />
        )}
      </div>
    </GameDialog>
  );
}
