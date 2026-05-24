import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { HudState } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { MapPanel } from '../ui/MapPanel';
import { QuestPanel } from '../ui/QuestPanel';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import './hud.css';

export function MobileHUD() {
  const [hud, setHud]             = useState<HudState>({ status: 'connecting', player: null });
  const [treeOpen, setTreeOpen]   = useState(false);
  const [invOpen, setInvOpen]     = useState(false);
  const [craftTab, setCraftTab]   = useState<'biome' | 'forge' | null>(null);
  const [mapOpen, setMapOpen]     = useState(false);
  const [questOpen, setQuestOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => hudBus.subscribe(setHud), []);

  const { player, status } = hud;

  const hpPct       = player && player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const hpBarColor  = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const totalShield = player?.shields.reduce((s, sh) => s + sh.amount, 0) ?? 0;
  const shieldPct   = player && player.maxHp > 0
    ? Math.min(100 - hpPct, (totalShield / player.maxHp) * 100)
    : 0;

  const zoneLabel = (() => {
    if (!player) return null;
    const info  = NODE_BIOMES[player.nodeId];
    if (!info)  return null;
    const biome = BIOME_DATABASE.get(info.biomeGroup);
    return `${biome?.name ?? info.biomeGroup} T${info.biomeTier}`;
  })();

  function openPanel(setter: (v: boolean) => void, current: boolean) {
    setter(!current);
    setMenuOpen(false);
  }

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="mob-topbar">
        <span className={`status-dot ${status}`} />
        <span className="mob-topbar__name">{player?.name ?? '…'}</span>
        <div className="mob-topbar__hpblock">
          <div className="hp-bar-track" style={{ margin: 0, height: 6 }}>
            <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: hpBarColor }} />
            {shieldPct > 0 && (
              <div className="shield-bar-fill" style={{ width: `${shieldPct}%`, left: `${hpPct}%` }} />
            )}
          </div>
          <span className="mob-topbar__hptext">
            {player ? `${Math.ceil(player.hp)}/${player.maxHp}` : '—'}
          </span>
        </div>
        {zoneLabel && <span className="mob-topbar__zone">{zoneLabel}</span>}
      </div>

      {/* ── AUTO combat button ──────────────────────────────────────────── */}
      <div className="mob-bottombar">
        <button
          className={`mob-auto-btn${player?.auto ? ' active' : ''}`}
          onClick={() => hudBus.requestAutoToggle()}
        >
          <span className="mob-auto-btn__label">AUTO COMBAT</span>
          <span className="mob-auto-btn__state">{player?.auto ? '● ACTIVE' : '○ OFF'}</span>
        </button>
      </div>

      {/* ── Right-side menu drawer ──────────────────────────────────────── */}
      {menuOpen && (
        <div className="mob-drawer-backdrop" onClick={() => setMenuOpen(false)} />
      )}
      <div className={`mob-drawer${menuOpen ? ' mob-drawer--open' : ''}`}>
        <button className="mob-drawer-handle" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? '✕' : '☰'}
        </button>
        <div className="mob-drawer-menu">
          <DrawerBtn label="SKILL TREE" active={treeOpen}  onClick={() => openPanel(setTreeOpen, treeOpen)} />
          <DrawerBtn label="INVENTORY"  active={invOpen}   onClick={() => openPanel(setInvOpen, invOpen)} />
          <DrawerBtn label="CRAFTING"   active={craftTab !== null} onClick={() => { setCraftTab(t => t ? null : 'forge'); setMenuOpen(false); }} />
          <DrawerBtn label="MAP"        active={mapOpen}   onClick={() => openPanel(setMapOpen, mapOpen)} />
          <DrawerBtn label="QUESTS"     active={questOpen} onClick={() => openPanel(setQuestOpen, questOpen)} />
        </div>
      </div>

      {/* ── Panel overlays ──────────────────────────────────────────────── */}
      {treeOpen  && <SkillTreePanel player={player} onClose={() => setTreeOpen(false)} />}
      {invOpen   && <InventoryPanel player={player} onClose={() => setInvOpen(false)} />}
      {craftTab !== null && <CraftingPanel player={player} tab={craftTab} onTabChange={setCraftTab} onClose={() => setCraftTab(null)} />}
      {mapOpen   && <MapPanel       player={player} onClose={() => setMapOpen(false)} />}
      {questOpen && (
        <div className="mob-panel-overlay">
          <div className="mob-panel-overlay__inner">
            <button
              className="mob-panel-close"
              onClick={() => setQuestOpen(false)}
            >
              ✕ CLOSE
            </button>
            <QuestPanel player={player} />
          </div>
        </div>
      )}
    </>
  );
}

function DrawerBtn({
  label, active, onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`mob-drawer-btn${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
