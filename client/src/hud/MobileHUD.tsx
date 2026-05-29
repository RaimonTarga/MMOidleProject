import { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { hudBus } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { MapPanel } from '../ui/MapPanel';
import { QuestPanel } from '../ui/QuestPanel';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { SettingsPanel } from './settings/SettingsPanel';
import {
  autoAtom,
  deathOverlayAtom,
  hpAtom,
  maxHpAtom,
  playerNameAtom,
  playerNodeIdAtom,
  settingsOpenAtom,
  shieldsAtom,
  skillPointsAtom,
  statusAtom,
} from './atoms';
import './hud.css';

export function MobileHUD() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return <MobileHUDContent />;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 1100px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

function MobileHUDContent() {
  const [treeOpen, setTreeOpen]   = useState(false);
  const [invOpen, setInvOpen]     = useState(false);
  const [craftTab, setCraftTab]   = useState<'biome' | 'forge' | 'upgrade' | null>(null);
  const [mapOpen, setMapOpen]     = useState(false);
  const [questOpen, setQuestOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);

  const status = useAtomValue(statusAtom);
  const playerName = useAtomValue(playerNameAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const shields = useAtomValue(shieldsAtom);
  const auto = useAtomValue(autoAtom);
  const skillPoints = useAtomValue(skillPointsAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const dead = useAtomValue(deathOverlayAtom).active;

  const hpPct       = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const hpBarColor  = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const totalShield = shields.reduce((s, sh) => s + sh.amount, 0);
  const shieldPct   = maxHp > 0
    ? Math.min(100 - hpPct, (totalShield / maxHp) * 100)
    : 0;

  const zoneLabel = (() => {
    if (!nodeId) return null;
    const info  = NODE_BIOMES[nodeId];
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
        <span className="mob-topbar__name">{playerName ?? '…'}</span>
        <div className="mob-topbar__hpblock">
          <div className="hp-bar-track" style={{ margin: 0, height: 6 }}>
            <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: hpBarColor }} />
            {shieldPct > 0 && (
              <div className="shield-bar-fill" style={{ width: `${shieldPct}%`, left: `${hpPct}%` }} />
            )}
          </div>
          <span className="mob-topbar__hptext">
            {nodeId ? `${Math.ceil(hp)}/${maxHp}` : '—'}
          </span>
        </div>
        {zoneLabel && <span className="mob-topbar__zone">{zoneLabel}</span>}
      </div>

      {/* ── AUTO combat button ──────────────────────────────────────────── */}
      <div className="mob-bottombar">
        <button
          className={`mob-auto-btn${auto ? ' active' : ''}`}
          onClick={() => hudBus.requestAutoToggle()}
        >
          <span className="mob-auto-btn__label">AUTO COMBAT</span>
          <span className="mob-auto-btn__state">{auto ? '● ACTIVE' : '○ OFF'}</span>
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
          <DrawerBtn label="SKILL TREE" active={treeOpen} highlight={!treeOpen && skillPoints > 0} onClick={() => openPanel(setTreeOpen, treeOpen)} />
          <DrawerBtn label="INVENTORY"  active={invOpen}   disabled={dead} onClick={() => { if (!dead) openPanel(setInvOpen, invOpen); }} />
          <DrawerBtn label="CRAFTING"   active={craftTab !== null} disabled={dead} onClick={() => { if (!dead) { setCraftTab(t => t ? null : 'forge'); setMenuOpen(false); } }} />
          <DrawerBtn label="MAP"        active={mapOpen}   onClick={() => openPanel(setMapOpen, mapOpen)} />
          <DrawerBtn label="QUESTS"     active={questOpen} onClick={() => openPanel(setQuestOpen, questOpen)} />
          <DrawerBtn label="SETTINGS"   active={settingsOpen} onClick={() => openPanel(setSettingsOpen, settingsOpen)} />
        </div>
      </div>

      {/* ── Panel overlays ──────────────────────────────────────────────── */}
      {treeOpen  && <SkillTreePanel onClose={() => setTreeOpen(false)} />}
      {invOpen   && <InventoryPanel onClose={() => setInvOpen(false)} />}
      {craftTab !== null && <CraftingPanel tab={craftTab} onTabChange={setCraftTab} onClose={() => setCraftTab(null)} />}
      {mapOpen   && <MapPanel       onClose={() => setMapOpen(false)} />}
      {questOpen && (
        <div className="mob-panel-overlay">
          <div className="mob-panel-overlay__inner">
            <button
              className="mob-panel-close"
              onClick={() => setQuestOpen(false)}
            >
              ✕ CLOSE
            </button>
            <QuestPanel />
          </div>
        </div>
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

function DrawerBtn({
  label, active, highlight, disabled, onClick,
}: {
  label: string;
  active: boolean;
  highlight?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`mob-drawer-btn${active ? ' active' : ''}${highlight ? ' mob-drawer-btn--has-points' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
