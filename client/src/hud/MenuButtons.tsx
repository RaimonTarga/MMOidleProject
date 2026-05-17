import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { SKILL_TREE } from '@mmo-idle/shared';
import './hud.css';

const PLACEHOLDER_PANELS = ['Skills', 'Map'] as const;

export function RightSidebar() {
  const [hud, setHud]               = useState<HudState>({ status: 'connecting', player: null });
  const [treeOpen, setTreeOpen]     = useState(false);
  const [invOpen, setInvOpen]       = useState(false);
  const [craftOpen, setCraftOpen]   = useState(false);

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

      {/* Inventory panel */}
      <div className="sidebar-panel">
        <div className="panel-title">Inventory</div>

        <button
          className={`auto-btn${invOpen ? ' active' : ''}`}
          onClick={() => setInvOpen(v => !v)}
        >
          {invOpen ? 'CLOSE BAG' : 'OPEN BAG'}
        </button>

        {player && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Bag</span>
              <span className="stat-value">{player.inventory.length} item{player.inventory.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Weapon</span>
              <span className="stat-value">
                {player.equipment.weapon
                  ? <span style={{ color: '#44ff88' }}>Equipped</span>
                  : <span className="dim">—</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Crafting panel */}
      <div className="sidebar-panel">
        <div className="panel-title">Crafting</div>

        <button
          className={`auto-btn${craftOpen ? ' active' : ''}`}
          onClick={() => setCraftOpen(v => !v)}
        >
          {craftOpen ? 'CLOSE FORGE' : 'OPEN FORGE'}
        </button>

        {player && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Essence</span>
              <span className="stat-value" style={{ color: '#bb88ff' }}>{player.essence}</span>
            </div>
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

      {/* Overlays — rendered via portal in document.body */}
      {treeOpen && (
        <SkillTreePanel
          player={player}
          onClose={() => setTreeOpen(false)}
        />
      )}
      {invOpen && (
        <InventoryPanel
          player={player}
          onClose={() => setInvOpen(false)}
        />
      )}
      {craftOpen && (
        <CraftingPanel
          player={player}
          onClose={() => setCraftOpen(false)}
        />
      )}
    </div>
  );
}
