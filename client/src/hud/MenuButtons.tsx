import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { MapPanel } from '../ui/MapPanel';
import { EssencePanel } from './EssencePanel';
import { QuestPanel } from '../ui/QuestPanel';
import { SKILL_TREE, NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import './hud.css';

export function RightSidebar() {
  const [hud, setHud]               = useState<HudState>({ status: 'connecting', player: null });
  const [treeOpen, setTreeOpen]             = useState(false);
  const [invOpen, setInvOpen]               = useState(false);
  const [craftTab, setCraftTab]             = useState<'biome' | 'forge' | null>(null);
  const [mapOpen, setMapOpen]               = useState(false);
  const [dbgPlayer, setDbgPlayer]           = useState(false);
  const [dbgEnemy, setDbgEnemy]             = useState(false);
  const [forgeBadge, setForgeBadge]         = useState(0);

  useEffect(() => hudBus.subscribe(setHud), []);
  useEffect(() => hudBus.subscribeRecipeUnlock(() => setForgeBadge(n => n + 1)), []);

  const player = hud.player;
  const className = player?.selectedClass
    ? (SKILL_TREE.get(player.selectedClass)?.name ?? player.selectedClass)
    : null;

  const zoneLabel = (() => {
    if (!player) return null;
    const info  = NODE_BIOMES[player.nodeId];
    if (!info)  return player.nodeId;
    const biome = BIOME_DATABASE.get(info.biomeGroup);
    return `${biome?.name ?? info.biomeGroup} T${info.biomeTier}`;
  })();

  return (
    <div className="sidebar sidebar-right">

      {/* Quest / Tier panel — always visible */}
      <QuestPanel player={player} />

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
          className={`auto-btn${craftTab === 'biome' ? ' active' : ''}`}
          onClick={() => setCraftTab(t => t === 'biome' ? null : 'biome')}
        >
          {craftTab === 'biome' ? 'CLOSE BIOME' : 'BIOME PROGRESS'}
        </button>
        <button
          className={`auto-btn${craftTab === 'forge' ? ' active' : ''}`}
          style={{ marginTop: 4, position: 'relative' }}
          onClick={() => { setCraftTab(t => t === 'forge' ? null : 'forge'); setForgeBadge(0); }}
        >
          {craftTab === 'forge' ? 'CLOSE FORGE' : 'OPEN FORGE'}
          {forgeBadge > 0 && craftTab !== 'forge' && (
            <span style={{
              position: 'absolute', top: 4, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: '#44ff88',
              boxShadow: '0 0 6px #44ff88',
              display: 'inline-block',
            }} />
          )}
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

        {zoneLabel && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Zone</span>
              <span className="stat-value">{zoneLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Debug panel */}
      <div className="sidebar-panel">
        <div className="panel-title">Debug</div>
        <button
          className={`auto-btn${dbgPlayer ? ' active' : ''}`}
          onClick={() => { setDbgPlayer(v => !v); hudBus.toggleDebugPlayerRange(); }}
        >
          {dbgPlayer ? 'HIDE MY RANGE' : 'SHOW MY RANGE'}
        </button>
        <button
          className={`auto-btn${dbgEnemy ? ' active' : ''}`}
          style={{ marginTop: 4 }}
          onClick={() => { setDbgEnemy(v => !v); hudBus.toggleDebugEnemyRanges(); }}
        >
          {dbgEnemy ? 'HIDE ENEMY RANGES' : 'SHOW ENEMY RANGES'}
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
      {craftTab !== null && (
        <CraftingPanel
          player={player}
          tab={craftTab}
          onTabChange={setCraftTab}
          onClose={() => setCraftTab(null)}
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
