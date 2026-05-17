import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { MapPanel } from '../ui/MapPanel';
import { EssencePanel } from './EssencePanel';
import { SKILL_TREE } from '@mmo-idle/shared';
import './hud.css';

export function RightSidebar() {
  const [hud, setHud]               = useState<HudState>({ status: 'connecting', player: null });
  const [treeOpen, setTreeOpen]     = useState(false);
  const [invOpen, setInvOpen]       = useState(false);
  const [craftOpen, setCraftOpen]   = useState(false);
  const [mapOpen, setMapOpen]       = useState(false);

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

      {/* Essence panel */}
      <EssencePanel player={player} />

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

      </div>

      {/* Map panel */}
      <div className="sidebar-panel">
        <div className="panel-title">Map</div>

        <button
          className={`auto-btn${mapOpen ? ' active' : ''}`}
          onClick={() => setMapOpen(v => !v)}
        >
          {mapOpen ? 'CLOSE MAP' : 'OPEN MAP'}
        </button>
      </div>

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
      {mapOpen && (
        <MapPanel
          player={player}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
