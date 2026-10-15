import { BehaviorPanel } from './BehaviorPanel';
import { useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { hudBus } from '../hudBus';
import { ClassPanel } from '../ui/class/ClassPanel';
import { useThresholdsView } from '../ui/class/useThresholdsView';
import { StormGauge } from './StormGauge';
import { useClassScreen } from '../ui/class/useClassScreen';
import { classEmblemIconSource } from '../ui/conceptIcons';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { BuildPanel } from '../ui/BuildPanel';
import { MasteryPanel } from '../ui/MasteryPanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { CraftingPanel } from '../ui/CraftingPanel';
import { MapPanel } from '../ui/MapPanel';
import { QuestPanel } from '../ui/QuestPanel';
import { StatsView } from '../ui/stats/StatsPanel';
import { BiomeXpBar } from './BiomeXpBar';
import { ArchetypeMechanics } from './stat/mechanics';
import { BossFrame } from './BossFrame';
import { ReadoutBar } from './ReadoutBar';
import { FRAME_TOKENS } from '../render/readoutTokens';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { SettingsPanel } from './settings/SettingsPanel';
import { CharacterSelectPrompt } from './CharacterSelectPrompt';
import { useIsMobile } from './useIsMobile';
import { GameIcon, nodeIcon, type IconSource } from '../ui/GameIcon';
import { buildSectionIconSource, menuIconSource } from '../ui/systemIcons';
import { DialogHeader, GameDialog } from './primitives';
import { useSystemVisibility } from './useSystemVisibility';
import { useNewEntries } from '../ui/crafting/useNewEntries';
import { eligibleMakeKeys, useMakeEntries } from '../ui/crafting/useMakeEntries';
import type { UiUnlockSystem } from './uiUnlocks';
import {
  autoAtom,
  buildPanelTabAtom,
  bestiaryOpenAtom,
  deathOverlayAtom,
  hpAtom,
  incomingDotAtom,
  maxHpAtom,
  pendingHealAtom,
  playerNameAtom,
  playerIdAtom,
  playerNodeIdAtom,
  settingsOpenAtom,
  barrierAtom,
  barrierMaxAtom,
  barrierRechargingAtom,
  wardsAtom,
  skillPointsAtom,
  statusAtom,
  type BuildPanelTab,
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
  | 'class'
  | 'more'
  | null;

/** One row of the More sheet. `unlockSystem` both gates the row and lets the
 *  shared Phase 11 unlock sync wake it when the server reveals that system. */
interface MoreEntry {
  key: string;
  label: string;
  icon: IconSource | null;
  fallback: ReactNode;
  unlockSystem?: UiUnlockSystem;
  disabled?: boolean;
  badge?: boolean;
  onSelect: () => void;
}

function MobileHUDContent() {
  const [view, setView] = useState<MobileView>(null);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [charSelectPrompt, setCharSelectPrompt] = useState(false);
  const setBuildTab = useSetAtom(buildPanelTabAtom);
  const setBestiaryOpen = useSetAtom(bestiaryOpenAtom);

  const status = useAtomValue(statusAtom);
  const playerName = useAtomValue(playerNameAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const barrier = useAtomValue(barrierAtom);
  const barrierMax = useAtomValue(barrierMaxAtom);
  const barrierRecharging = useAtomValue(barrierRechargingAtom);
  const wards = useAtomValue(wardsAtom);
  const incomingDot = useAtomValue(incomingDotAtom);
  const pendingHeal = useAtomValue(pendingHealAtom);
  const auto = useAtomValue(autoAtom);
  const skillPoints = useAtomValue(skillPointsAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const dead = useAtomValue(deathOverlayAtom).active;

  // Phase 5 approved reveal gates, previously desktop-only. The same resolver
  // and ownership overrides run here, so a migrated save never loses a
  // destination it already owns.
  // Same resolver, same signals as the rail — the W7 rule that mobile must not
  // grow a second policy.
  const visibility = useSystemVisibility();

  // Same "what became makeable" signal the rail shows, and the same shared
  // state: clearing an entry in the craft sheet clears the tab's dot too.
  const makeEntries = useMakeEntries();
  const eligibleRecipeKeys = useMemo(() => eligibleMakeKeys(makeEntries), [makeEntries]);
  const playerId = useAtomValue(playerIdAtom);
  const classScreen = useClassScreen();
  const thresholds = useThresholdsView();
  const newRecipes = useNewEntries('craft', playerId, eligibleRecipeKeys);

  // ── HP-bar layers (all as % of maxHp), mirroring the desktop crown ──
  const hpPct       = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  // The barrier strip runs on its OWN scale (fraction of the pool), so an empty
  // barrier still shows the pool that is missing. Wards, which have no fixed
  // ceiling, are the bar's absorb band, measured against max HP.
  const barrierPct  = barrierMax > 0 ? Math.min(100, (barrier / barrierMax) * 100) : 0;
  const totalWard   = wards.reduce((s, w) => s + w.amount, 0);
  const dotPct      = maxHp > 0 ? Math.min(hpPct, (incomingDot / maxHp) * 100) : 0;
  const safePct     = Math.max(0, hpPct - dotPct);
  const healPct     = maxHp > 0 ? Math.min(100 - hpPct, (pendingHeal / maxHp) * 100) : 0;
  const lowHealth   = maxHp > 0 && hp > 0 && hp / maxHp <= FRAME_TOKENS.lowHealth.at;

  const zoneLabel = (() => {
    if (!nodeId) return null;
    const info  = NODE_BIOMES[nodeId];
    if (!info)  return null;
    const biome = BIOME_DATABASE.get(info.biomeGroup);
    return `${biome?.name ?? info.biomeGroup} T${info.biomeTier}`;
  })();

  // A gate can close behind the player (class reset, admin fixture). Fall back
  // to the base HUD rather than stranding an open dialog with no way back.
  useEffect(() => {
    if (!visibility.mastery && view === 'mastery') setView(null);
    if (!visibility.passiveTree && view === 'skills') setView(null);
    if (!visibility.inventory && view === 'bag') setView(null);
    if (!visibility.crafting && view === 'craft') setView(null);
    if (!visibility.loadout && view === 'build') setView(null);
    if (!visibility.map && view === 'map') setView(null);
    if (!classScreen.view && view === 'class') setView(null);
  }, [
    view,
    visibility.mastery,
    visibility.passiveTree,
    visibility.inventory,
    visibility.crafting,
    visibility.loadout,
    visibility.map,
    classScreen.view,
  ]);

  const close = () => setView(null);

  useEffect(() => {
    setView((current) => (current === 'class' ? null : current));
  }, [playerId]);

  function toggle(key: Exclude<MobileView, null>) {
    if ((key === 'bag' || key === 'craft') && dead) return;
    setView(v => (v === key ? null : key));
  }

  // Destinations that share a desktop navigation entry resolve to the same
  // approved atlas frame; the rest keep a glyph fallback in the identical
  // footprint, so later art needs no layout change.
  const tabs: {
    key: Exclude<MobileView, null>;
    icon: IconSource | null;
    fallback: ReactNode;
    label: string;
    badge?: boolean;
    disabled?: boolean;
    unlockSystems?: readonly UiUnlockSystem[];
  }[] = [
    // Stats and More have no destination in the approved navigation family, so
    // their glyph is the icon itself rather than a placeholder fallback.
    { key: 'character', icon: nodeIcon('📊'), fallback: '📊', label: 'Stats' },
    // Passive Tree reveals on the first skill point, matching the rail.
    ...(visibility.passiveTree
      ? [{
        key: 'skills' as const,
        icon: menuIconSource('passive-tree'),
        fallback: '🌳',
        label: 'Skills',
        badge: skillPoints > 0,
        unlockSystems: ['passiveTree'] as const,
      }]
      : []),
    // The staged arc governs the tab bar too, from the same resolver.
    ...(visibility.inventory
      ? [{
        key: 'bag' as const,
        icon: menuIconSource('inventory'),
        fallback: '🎒',
        label: 'Bag',
        disabled: dead,
        unlockSystems: ['inventory'] as const,
      }]
      : []),
    ...(visibility.crafting
      ? [{
        key: 'craft' as const,
        icon: menuIconSource('crafting'),
        fallback: '⚒',
        label: 'Craft',
        badge: newRecipes.count > 0,
        disabled: dead,
        unlockSystems: ['materials', 'crafting'] as const,
      }]
      : []),
    ...(visibility.map
      ? [{
        key: 'map' as const,
        icon: menuIconSource('map'),
        fallback: '🗺',
        label: 'Map',
        unlockSystems: ['map'] as const,
      }]
      : []),
    {
      key: 'more',
      icon: nodeIcon('☰'),
      fallback: '☰',
      label: 'More',
      badge: classScreen.hasNew,
      unlockSystems: [
        'loadout',
        'mastery',
        'combatLog',
        'bestiary',
      ] as const,
    },
  ];

  // Each arrangement tab gets its own row; they share one dialog, so a
  // row is "open the dialog on this tab".
  const buildRows: { tab: BuildPanelTab; label: string; gate: UiUnlockSystem; fallback: string }[] = [
    { tab: 'runes', label: 'Runes', gate: 'loadout', fallback: 'U' },
  ];

  const moreEntries: MoreEntry[] = [
    ...(classScreen.view
      ? [{
        key: 'class',
        label: classScreen.view.systemName,
        icon: classEmblemIconSource(classScreen.view.archetype),
        fallback: classScreen.view.systemName.charAt(0),
        badge: classScreen.hasNew,
        onSelect: () => setView('class'),
      }]
      : []),
    ...buildRows
      .filter((row) => visibility[row.gate])
      .map((row) => ({
        key: row.tab,
        label: row.label,
        icon: buildSectionIconSource(row.tab),
        fallback: row.fallback,
        unlockSystem: row.gate,
        onSelect: () => { setBuildTab(row.tab); setView('build'); },
      })),
    ...(visibility.mastery
      ? [{
        key: 'mastery',
        label: 'Mastery',
        icon: menuIconSource('mastery'),
        fallback: 'M',
        unlockSystem: 'mastery' as const,
        onSelect: () => setView('mastery'),
      }]
      : []),
    ...(visibility.bestiary
      ? [{
        key: 'bestiary' as const,
        label: 'Bestiary',
        icon: null,
        fallback: '☠',
        unlockSystem: 'bestiary' as const,
        onSelect: () => { setBestiaryOpen(true); setView(null); },
      }]
      : []),
    {
      key: 'settings',
      label: 'Settings',
      icon: menuIconSource('settings'),
      fallback: '⚙',
      onSelect: () => { setSettingsOpen(true); setView(null); },
    },
    {
      key: 'tactical',
      label: 'Tactical Mode',
      icon: menuIconSource('map'),
      fallback: 'T',
      onSelect: () => hudBus.toggleTacticalView(),
    },
    {
      key: 'character-select',
      label: 'Character Select',
      icon: nodeIcon('↩'),
      fallback: '↩',
      onSelect: () => { setCharSelectPrompt(true); setView(null); },
    },
  ];

  return (
    <>
      {/* ── Top status strip ────────────────────────────────────────────── */}
      <div className="mhud-top">
        <div className="mhud-top__row1">
          <span className={`status-dot ${status}`} />
          <span className="mhud-top__name">{playerName ?? '…'}</span>
          <div className="mhud-hp">
            {thresholds ? <StormGauge view={thresholds} /> : barrierMax > 0 && (
              <div className={`hp-shield-strip${barrierRecharging ? ' hp-shield-strip--recharging' : ''}`}>
                <div className="hp-shield-strip__fill" style={{ width: `${barrierPct}%` }} />
              </div>
            )}
            {/* The vitals (combat readout run, item 6): the shared readout bar — the
                chip, the wards' absorb band, the number inside, the low-health glow. */}
            <ReadoutBar
              size="vitals"
              hp={hp}
              maxHp={maxHp}
              absorb={totalWard}
              label={nodeId ? `${Math.ceil(hp)} / ${maxHp}` : '—'}
              lowHealth={lowHealth}
              ariaLabel={`Health ${Math.ceil(hp)} of ${maxHp}`}
              layers={
                <>
                  {healPct > 0 && (
                    <i className="hp-layer hp-layer--regen" style={{ left: `${hpPct}%`, width: `${healPct}%` }} />
                  )}
                  {dotPct > 0 && (
                    <i className="hp-layer hp-layer--dot" style={{ left: `${safePct}%`, width: `${dotPct}%` }} />
                  )}
                </>
              }
            />
          </div>
          {zoneLabel && <span className="mhud-top__zone">{zoneLabel}</span>}
        </div>

        {/* The boss row: under the vitals, the ring row's height (combat readout). */}
        <BossFrame placement="strip" />

        <div className="mhud-context">
          {/* Compact archetype mechanic — shares the desktop renderer */}
          <div className="mhud-mech">
            <ArchetypeMechanics compact />
          </div>
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
        data-ui-unlock-system="progression"
        aria-label="Current quest"
        onClick={() => setView(v => (v === 'quests' ? null : 'quests'))}
      >
        !
      </button>

      {/* ── Bottom region: biome XP bar + tab bar ───────────────────────── */}
      <div className="mhud-bottom">
        <div className="mhud-biomexp"><BiomeXpBar /></div>
        <nav className="mhud-tabs" aria-label="Primary destinations">
          {tabs.map(t => (
            <button
              key={t.key}
              aria-label={t.label}
              type="button"
              className={`mhud-tab${view === t.key ? ' mhud-tab--active' : ''}${t.badge ? ' mhud-tab--badge' : ''}`}
              data-ui-unlock-system={t.unlockSystems?.join(' ') || undefined}
              aria-pressed={view === t.key}
              disabled={t.disabled}
              onClick={() => toggle(t.key)}
            >
              <GameIcon
                className="mhud-tab__icon"
                source={t.icon}
                size={22}
                fallback={t.fallback}
                decorative
              />
              <span className="mhud-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Bottom sheets (content that isn't itself a full overlay) ─────── */}
      {view === 'character' && (
        <MobileSheet title="Stats" onClose={close}>
          {/* Design §26.4: the Stats panel of its own; HP and the mechanic
              already sit in the top strip. */}
          <StatsView />
          <BehaviorPanel />
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
            {moreEntries.map(entry => (
              <button
                key={entry.key}
                type="button"
                className="mhud-more__btn"
                data-ui-unlock-system={entry.unlockSystem}
                disabled={entry.disabled}
                onClick={entry.onSelect}
              >
                <GameIcon
                  className="mhud-more__icon"
                  source={entry.icon}
                  size={20}
                  fallback={entry.fallback}
                  decorative
                />
                <span className="mhud-more__label">
                  {entry.label}
                  {entry.badge && <span className="class-panel__new">NEW</span>}
                </span>
              </button>
            ))}
          </div>
        </MobileSheet>
      )}

      {/* ── Self-overlaying panels (reused from desktop, full-screen) ───── */}
      {view === 'skills' && <SkillTreePanel onClose={close} />}
      {view === 'bag'    && <InventoryPanel onClose={close} />}
      {view === 'craft' && <CraftingPanel tab="make" onClose={close} />}
      {view === 'map'    && <MapPanel onClose={close} />}
      {view === 'build' && <BuildPanel onClose={close} />}
      {view === 'mastery' && <MasteryPanel onClose={close} />}
      {view === 'class' && <ClassPanel onClose={close} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {charSelectPrompt && <CharacterSelectPrompt onCancel={() => setCharSelectPrompt(false)} />}
    </>
  );
}

/**
 * Bottom sheet: slides up, tap-backdrop / drag-down / Escape / ✕ to dismiss.
 * The boundary itself is the shared `GameDialog` in its `sheet` presentation,
 * so a sheet gets the same portal, focus entry/return, focus trap, Escape
 * handling, and `role="dialog"` as every desktop destination. Only the drag
 * affordance is mobile-specific.
 */
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
    <GameDialog
      size="sheet"
      className="mhud-sheet"
      onClose={onClose}
      style={dragY > 0
        ? { transform: `translateY(${dragY}px)`, transition: 'none', animation: 'none' }
        : undefined}
    >
      <div
        className="mhud-sheet__handlebar"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="mhud-sheet__grip" />
      </div>
      <DialogHeader title={title} closeLabel={`Close ${title}`} />
      <div className="mhud-sheet__body">{children}</div>
    </GameDialog>
  );
}
