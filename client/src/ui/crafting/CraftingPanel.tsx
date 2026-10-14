import { useAtomValue } from 'jotai';
import { MakeTab } from './MakeTab';
import { playerIdAtom } from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { GameIcon } from '../GameIcon';
import { craftingSectionIconSource, type CraftingSectionIcon } from '../systemIcons';
import '../crafting.css';

/**
 * The crafting shell's destination: Make (the recipe browser). The Upgrade
 * destination went with the +N ladder (design §24.5) and the weapon page
 * (class-first rework D1).
 */
export type CraftTab = 'make';

interface Props {
  tab: CraftTab;
  onClose: () => void;
}

export function CraftingPanel({ tab, onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const title = 'Crafting';
  const icon: CraftingSectionIcon = 'forge';

  return (
    <GameDialog
      size="wide"
      className="crafting-dialog"
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

      {/* Crafting owns its recipe-list scroll. */}
      <div
        id={`craft-panel-${tab}`}
        className={`crafting-dialog__content crafting-dialog__content--${tab}`}
      >
        {!playerId ? (
          <div className="craft-empty">Not connected.</div>
        ) : (
          <MakeTab />
        )}
      </div>
    </GameDialog>
  );
}
