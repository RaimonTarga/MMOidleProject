import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import './hud.css';

export function AutoCombatButton() {
  const [hud, setHud] = useState<HudState>({ status: 'connecting', player: null });

  useEffect(() => hudBus.subscribe(setHud), []);

  const player = hud.player;
  if (!player) return null;

  return (
    <div style={{
      position:      'fixed',
      bottom:        'calc(16px + env(safe-area-inset-bottom, 0px))',
      left:          '50%',
      transform:     'translateX(-50%)',
      zIndex:        20,
      pointerEvents: 'auto',
    }}>
      <button
        className={`auto-btn${player.auto ? ' active' : ''}`}
        style={{ width: 'auto', padding: '12px 36px', fontSize: 14, letterSpacing: '1.5px', marginTop: 0 }}
        onClick={() => hudBus.requestAutoToggle()}
        title="Toggle server-side auto combat"
      >
        AUTO COMBAT: {player.auto ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
