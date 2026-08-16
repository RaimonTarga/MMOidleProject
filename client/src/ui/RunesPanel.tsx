import { BuildRunesTab } from './BuildRunesTab';
import { DialogHeader, GameDialog } from '../hud/primitives';
import { GameIcon } from './GameIcon';
import { masterySectionIconSource } from './systemIcons';
import './buildPanel.css';

interface Props {
  onClose: () => void;
}

/** Top-level shell for rune rules, separate from the tactical loadout picker. */
export function RunesPanel({ onClose }: Props) {
  return (
    <GameDialog size="wide" className="build-dialog" onClose={onClose}>
      <DialogHeader
        title="Runes"
        icon={
          <GameIcon
            source={masterySectionIconSource('runes')}
            size={22}
            fallback={null}
            decorative
          />
        }
        closeLabel="Close runes"
      />
      <div id="runes-panel" className="build-dialog__body">
        <BuildRunesTab />
      </div>
    </GameDialog>
  );
}
