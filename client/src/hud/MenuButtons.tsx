import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { SKILL_TREE } from '@mmo-idle/shared';
import './hud.css';

const PLACEHOLDER_PANELS = ['Inventory', 'Crafting', 'Skills', 'Map'] as const;

export function RightSidebar() {
  const [hud, setHud]       = useState<HudState>({ status: 'connecting', player: null });
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => hudBus.subscribe(setHud), []);

  const player = hud.player;
  const className = player?.selectedClass
    ? (SKILL_TREE.get(player.selectedClass)?.name ?? player.selectedClass)
    : null;

  return (
    <div className="sidebar sidebar-right">

      {/* Passive Tree panel */}
      <div className="sidebar-panel">
        <div className="panel-title">Passive Tree</div>

        <button
          className={`auto-btn${treeOpen ? ' active' : ''}`}
          onClick={() => setTreeOpen(v => !v)}
        >
          {treeOpen ? 'CLOSE TREE' : 'OPEN TREE'}
        </button>

        {player && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Points</span>
              <span className="stat-value">{player.skillPoints}</span>
            </div>
            {className && (
              <div className="stat-row">
                <span className="stat-label">Class</span>
                <span className="stat-value">{className}</span>
              </div>
            )}
            {!className && (
              <div className="stat-row">
                <span className="stat-label" style={{ color: '#33334a', fontSize: 10 }}>
                  No class selected
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Placeholder panels */}
      {PLACEHOLDER_PANELS.map(name => (
        <div key={name} className="sidebar-panel">
          <div className="panel-title">{name}</div>
          <div className="panel-placeholder">Not yet implemented</div>
        </div>
      ))}

      {/* Skill tree overlay — rendered via portal in document.body */}
      {treeOpen && (
        <SkillTreePanel
          player={player}
          onClose={() => setTreeOpen(false)}
        />
      )}
    </div>
  );
}
