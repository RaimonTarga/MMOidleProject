import { useState, useRef, type ReactNode } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { hudBus } from '../hudBus';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { BuildPanel } from '../ui/BuildPanel';
import { MasteryPanel } from '../ui/MasteryPanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { MapPanel } from '../ui/MapPanel';
import { QuestPanel } from '../ui/QuestPanel';
import { StatPanel } from './StatPanel';
import { BiomeXpBar } from './BiomeXpBar';
import { ArchetypeMechanics } from './stat/mechanics';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { SettingsPanel } from './settings/SettingsPanel';
import { useIsMobile } from './useIsMobile';
import {
  autoAtom,
  bestiaryOpenAtom,
  buildPanelTabAtom,
  type BuildPanelTab,
  deathOverlayAtom,
  hpAtom,
  incomingDotAtom,
  maxHpAtom,
  pendingHealAtom,
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

/** Which destination is currently open. Self-overlaying panels and bottom sheets
 *  are both single-open; `null` = just the base HUD. */
type MobileView =
  | 'character'
  | 'skills'
  | 'bag'
  | 'craft'
  | 'map'
  | 'quests'
  | 'build'
  | 'mastery'
  | 'more'
  | null;

function MobileHUDContent() {
  const [view, setView] = useState<MobileView>(null);
  const [craftTab, setCraftTab] = useState<'biome' | 'forge' | 'upgrade'>('forge');
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [, setBuildPanelTab] = useAtom(buildPanelTabAtom);
  const setBestiaryOpen = useSetAtom(bestiaryOpenAtom);

  const status = useAtomValue(statusAtom);
  const playerName = useAtomValue(playerNameAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const shields = useAtomValue(shieldsAtom);
  const incomingDot = useAtomValue(incomingDotAtom);
  const pendingHeal = useAtomValue(pendingHealAtom);
  const auto = useAtomValue(autoAtom);
  const skillPoints = useAtomValue(skillPointsAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const dead = useAtomValue(deathOverlayAtom).active;

  // ── HP-bar layers (all as % of maxHp), mirroring the desktop StatPanel ──
  const hpPct       = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const hpBarColor  = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const totalShield = shields.reduce((s, sh) => s + sh.amount, 0);
  const shieldPct   = maxHp > 0 ? Math.min(100, (totalShield / maxHp) * 100) : 0;
  const dotPct      = maxHp > 0 ? Math.min(hpPct, (incomingDot / maxHp) * 100) : 0;
  const safePct     = Math.max(0, hpPct - dotPct);
  const healPct     = maxHp > 0 ? Math.min(100 - hpPct, (pendingHeal / maxHp) * 100) : 0;

  const zoneLabel = (() => {
    if (!nodeId) return null;
    const info  = NODE_BIOMES[nodeId];
    if (!info)  return null;
    const biome = BIOME_DATABASE.get(info.biomeGroup);
    return `${biome?.name ?? info.biomeGroup} T${info.biomeTier}`;
  })();

  const close = () => setView(null);

  function toggle(key: Exclude<MobileView, null>) {
    if ((key === 'bag' || key === 'craft') && dead) return;
    if (key === 'craft' && view !== 'craft') setCraftTab('forge');
    setView(v => (v === key ? null : key));
  }

  function openBuildTab(tab: BuildPanelTab) {
    setBuildPanelTab(tab);
    setView('build');
  }

  const tabs: { key: Exclude<MobileView, null>; icon: string; label: string; badge?: boolean; disabled?: boolean }[] = [
    { key: 'character', icon: '📊', label: 'Stats' },
    { key: 'skills',    icon: '🌳', label: 'Skills', badge: skillPoints > 0 },
    { key: 'bag',       icon: '🎒', label: 'Bag', disabled: dead },
    { key: 'craft',     icon: '⚒',  label: 'Craft', disabled: dead },
    { key: 'map',       icon: '🗺', label: 'Map' },
    { key: 'more',      icon: '☰',  label: 'More' },
  ];

  return (
    <>
      {/* ── Top status strip ────────────────────────────────────────────── */}
      <div className="mhud-top">
        <div className="mhud-top__row1">
          <span className={`status-dot ${status}`} />
          <span className="mhud-top__name">{playerName ?? '…'}</span>
          <div className="mhud-hp">
            {shieldPct > 0 && (
              <div className="hp-shield-strip">
                <div className="hp-shield-strip__fill" style={{ width: `${shieldPct}%` }} />
              </div>
            )}
            <div className="hp-bar-track">
              {healPct > 0 && (
                <div className="hp-layer hp-layer--regen" style={{ left: `${hpPct}%`, width: `${healPct}%` }} />
              )}
              <div className="hp-layer hp-layer--hp" style={{ width: `${safePct}%`, background: hpBarColor }} />
              {dotPct > 0 && (
                <div className="hp-layer hp-layer--dot" style={{ left: `${safePct}%`, width: `${dotPct}%` }} />
              )}
            </div>
          </div>
          <span className="mhud-hp__text">{nodeId ? `${Math.ceil(hp)}/${maxHp}` : '—'}</span>
          {zoneLabel && <span className="mhud-top__zone">{zoneLabel}</span>}
        </div>

        {/* Compact archetype mechanic — shares the desktop renderer */}
        <div className="mhud-mech">
          <ArchetypeMechanics />
        </div>
      </div>

      {/* ── Floating AUTO combat button ─────────────────────────────────── */}
      <button
        className={`mhud-auto${auto ? ' mhud-auto--on' : ''}`}
        onClick={() => hudBus.requestAutoToggle()}
      >
        <span className="mhud-auto__icon">{auto ? '❚❚' : '▶'}</span>
        <span className="mhud-auto__label">AUTO</span>
      </button>

      {/* ── Floating quest button (bottom-left) ─────────────────────────── */}
      <button
        className={`mhud-quest${view === 'quests' ? ' mhud-quest--active' : ''}`}
        aria-label="Current quest"
        onClick={() => setView(v => (v === 'quests' ? null : 'quests'))}
      >
        !
      </button>

      {/* ── Bottom region: biome XP bar + tab bar ───────────────────────── */}
      <div className="mhud-bottom">
        <div className="mhud-biomexp"><BiomeXpBar /></div>
        <nav className="mhud-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`mhud-tab${view === t.key ? ' mhud-tab--active' : ''}${t.badge ? ' mhud-tab--badge' : ''}`}
              disabled={t.disabled}
              onClick={() => toggle(t.key)}
            >
              <span className="mhud-tab__icon">{t.icon}</span>
              <span className="mhud-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Bottom sheets (content that isn't itself a full overlay) ─────── */}
      {view === 'character' && (
        <MobileSheet title="Character" onClose={close}>
          <StatPanel />
        </MobileSheet>
      )}
      {view === 'quests' && (
        <MobileSheet title="Quests" onClose={close}>
          <QuestPanel />
        </MobileSheet>
      )}
      {view === 'more' && (
        <MobileSheet title="More" onClose={close}>
          <div className="mhud-more">
            <button className="mhud-more__btn" onClick={() => openBuildTab('overview')}>Build Overview</button>
            <button className="mhud-more__btn" onClick={() => openBuildTab('abilities')}>Abilities</button>
            <button className="mhud-more__btn" onClick={() => openBuildTab('stances')}>Stances</button>
            <button className="mhud-more__btn" onClick={() => openBuildTab('rites')}>Rites</button>
            <button className="mhud-more__btn" onClick={() => openBuildTab('runes')}>Runes</button>
            <button className="mhud-more__btn" onClick={() => setView('mastery')}>Mastery</button>
            <button className="mhud-more__btn" onClick={() => { setBestiaryOpen(true); setView(null); }}>Bestiary</button>
            <button className="mhud-more__btn" onClick={() => { setSettingsOpen(true); setView(null); }}>Settings</button>
            <button className="mhud-more__btn" onClick={() => hudBus.toggleTacticalView()}>Tactical Mode</button>
          </div>
        </MobileSheet>
      )}

      {/* ── Self-overlaying panels (reused from desktop, full-screen) ───── */}
      {view === 'skills' && <SkillTreePanel onClose={close} />}
      {view === 'bag'    && <InventoryPanel onClose={close} />}
      {view === 'craft'  && (
        <CraftingPanel
          tab={craftTab}
          onTabChange={(t) => (t ? setCraftTab(t) : close())}
          onClose={close}
        />
      )}
      {view === 'map'    && <MapPanel onClose={close} />}
      {view === 'build' && <BuildPanel onClose={close} />}
      {view === 'mastery' && <MasteryPanel onClose={close} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

/** Bottom sheet: slides up, tap-backdrop / drag-down / ✕ to dismiss. */
function MobileSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  }
  function onTouchEnd() {
    if (dragY > 90) onClose();
    setDragY(0);
    startY.current = null;
  }

  return (
    <div className="mhud-sheet-backdrop" onClick={onClose}>
      <div
        className="mhud-sheet"
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="mhud-sheet__handlebar"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="mhud-sheet__grip" />
        </div>
        <div className="mhud-sheet__head">
          <span className="mhud-sheet__title">{title}</span>
          <button className="mhud-sheet__close" onClick={onClose}>✕</button>
        </div>
        <div className="mhud-sheet__body">{children}</div>
      </div>
    </div>
  );
}
