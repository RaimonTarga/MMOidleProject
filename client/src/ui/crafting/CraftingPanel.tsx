import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { BiomeTab } from './BiomeTab';
import { ForgeTab } from './ForgeTab';
import { UpgradeTab } from './UpgradeTab';
import { playerIdAtom } from '../../hud/atoms';
import '../crafting.css';

export type CraftTab = 'biome' | 'forge' | 'upgrade';

interface Props {
  tab: CraftTab;
  onTabChange: (tab: CraftTab) => void;
  onClose: () => void;
}

export function CraftingPanel({ tab, onTabChange, onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="craft-overlay" onClick={handleOverlayClick}>
      <div className="craft-panel">

        {/* Header */}
        <div className="craft-header">
          <span className="craft-title">Crafting</span>
          <button className="craft-close" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div className="craft-tabs">
          <button
            className={`craft-tab${tab === 'biome' ? ' craft-tab--active' : ''}`}
            onClick={() => onTabChange('biome')}
          >
            Biome Progress
          </button>
          <button
            className={`craft-tab${tab === 'forge' ? ' craft-tab--active' : ''}`}
            onClick={() => onTabChange('forge')}
          >
            Forge
          </button>
          <button
            className={`craft-tab${tab === 'upgrade' ? ' craft-tab--active' : ''}`}
            onClick={() => onTabChange('upgrade')}
          >
            Upgrade
          </button>
        </div>

        {/* Content */}
        {playerId ? (
          tab === 'biome'
            ? <BiomeTab />
            : tab === 'forge'
              ? <ForgeTab />
              : <UpgradeTab />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
