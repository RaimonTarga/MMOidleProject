import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { BiomeTab } from './BiomeTab';
import { ForgeTab } from './ForgeTab';
import { playerIdAtom } from '../../hud/atoms';
import '../crafting.css';

interface Props {
  tab: 'biome' | 'forge';
  onTabChange: (tab: 'biome' | 'forge') => void;
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
        </div>

        {/* Content */}
        {playerId ? (
          tab === 'biome'
            ? <BiomeTab />
            : <ForgeTab />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
