import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import type { EssenceType, PlayerView } from '@mmo-idle/shared';
import { BiomeTab } from './BiomeTab';
import { ForgeTab } from './ForgeTab';
import '../crafting.css';

interface Props {
  player: PlayerView | null;
  tab: 'biome' | 'forge';
  onTabChange: (tab: 'biome' | 'forge') => void;
  onClose: () => void;
}

export function CraftingPanel({ player, tab, onTabChange, onClose }: Props) {
  const [feedback, setFeedback]   = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: Event) => {
      const result = (e as CustomEvent<{ success: boolean; reason?: string }>).detail;
      if (timer) clearTimeout(timer);
      setFeedbackOk(result.success);
      setFeedback(result.success ? 'Item crafted!' : (result.reason ?? 'Crafting failed.'));
      timer = setTimeout(() => setFeedback(null), 3000);
    };

    window.addEventListener('hud:craftResult', handler);
    return () => {
      window.removeEventListener('hud:craftResult', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const essences = player?.essences ?? { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };

  return createPortal(
    <div className="craft-overlay" onClick={handleOverlayClick}>
      <div className="craft-panel">

        {/* Header */}
        <div className="craft-header">
          <span className="craft-title">Crafting</span>
          {feedback && (
            <span className={`craft-feedback${feedbackOk ? ' craft-feedback--ok' : ' craft-feedback--err'}`}>
              {feedback}
            </span>
          )}
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
        {player ? (
          tab === 'biome'
            ? <BiomeTab player={player} />
            : <ForgeTab player={player} essences={essences} />
        ) : (
          <div className="craft-empty">Not connected.</div>
        )}

      </div>
    </div>,
    document.body,
  );
}
