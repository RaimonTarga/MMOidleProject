import { useAtomValue } from 'jotai';
import { MakeTab } from './MakeTab';
import { UpgradeTab } from './UpgradeTab';
import { playerIdAtom } from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { GameIcon } from '../GameIcon';
import { craftingSectionIconSource, type CraftingSectionIcon } from '../systemIcons';
import '../crafting.css';

/**
 * Crafting and Upgrade are separate top-level destinations. They retain one
 * shell because they share connection state and layout, but there is no hidden
 * tab switcher: opening a destination lands directly on the requested job.
 */
export type CraftTab = 'make' | 'upgrade';

interface Props {
  tab: CraftTab;
  onClose: () => void;
}

export function CraftingPanel({ tab, onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const title = tab === 'make' ? 'Crafting' : 'Upgrade';
  const icon: CraftingSectionIcon = tab === 'make' ? 'forge' : 'upgrade';

  return (
    <GameDialog size="wide" className="crafting-dialog" onClose={onClose}>
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

      {/* Crafting owns its recipe-list scroll while Upgrade scrolls as one page. */}
      <div
        id={`craft-panel-${tab}`}
        className={`crafting-dialog__content crafting-dialog__content--${tab}`}
      >
        {playerId ? (
          tab === 'make' ? <MakeTab /> : <UpgradeTab />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}
      </div>
    </GameDialog>
  );
}
