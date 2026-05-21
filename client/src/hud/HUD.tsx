import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import { StatPanel } from './StatPanel';
import { CombatLogPanel } from './CombatLogPanel';
import { DebugPanel } from './DebugPanel';
import './hud.css';

export function LeftSidebar() {
  const [hud, setHud] = useState<HudState>({ status: 'connecting', player: null });

  useEffect(() => hudBus.subscribe(setHud), []);

  return (
    <div className="sidebar sidebar-left">
      <StatPanel player={hud.player} status={hud.status} />
      <CombatLogPanel />
      <DebugPanel player={hud.player} />
    </div>
  );
}
