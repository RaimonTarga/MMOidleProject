import { useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
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
import { atlasIcon, GameIcon, nodeIcon, type IconSource } from '../ui/GameIcon';
import { DialogHeader, GameDialog } from './primitives';
import { useSystemVisibility } from './useSystemVisibility';
import { useNewEntries } from '../ui/crafting/useNewEntries';
import { eligibleMakeKeys, useMakeEntries } from '../ui/crafting/useMakeEntries';
import type { UiUnlockSystem } from './uiUnlocks';
import {
  activeStanceAtom,
  autoAtom,
  catalystProgressAtom,
  catalystsAtom,
  essencesAtom,
  passivesAtom,
  unlockedRecipesAtom,
  bestiaryOpenAtom,
  buildPanelTabAtom,
  type BuildPanelTab,
  deathOverlayAtom,
  equippedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  hpAtom,
  incomingDotAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  maxHpAtom,
  pendingHealAtom,
  playerNameAtom,
  playerIdAtom,
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

/** One row of the More sheet. `unlockSystem` both gates the row and lets the
 *  shared Phase 11 unlock sync wake it when the server reveals that system. */
interface MoreEntry {
  key: string;
  label: string;
  icon: IconSource | null;
  fallback: ReactNode;
  unlockSystem?: UiUnlockSystem;
  onSelect: () => void;
}

function MobileHUDContent() {
  const [view, setView] = useState<MobileView>(null);
  const [craftTab, setCraftTab] = useState<'make' | 'upgrade'>('make');
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

  const knownAbilities = useAtomValue(knownAbilitiesAtom);
  const equippedAbilities = useAtomValue(equippedAbilitiesAtom);
  const knownStances = useAtomValue(knownStancesAtom);
  const equippedStances = useAtomValue(equippedStancesAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const knownRites = useAtomValue(knownRitesAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const catalystProgress = useAtomValue(catalystProgressAtom);
  const unlockedRecipes = useAtomValue(unlockedRecipesAtom);
  const passives = useAtomValue(passivesAtom);

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
  const newRecipes = useNewEntries('craft', playerId, eligibleRecipeKeys);

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

  // A gate can close behind the player (class reset, admin fixture). Fall back
  // to the base HUD rather than stranding an open dialog with no way back.
  useEffect(() => {
    if (!visibility.mastery && view === 'mastery') setView(null);
    if (!visibility.passiveTree && view === 'skills') setView(null);
    if (!visibility.inventory && view === 'bag') setView(null);
    if (!visibility.crafting && view === 'craft') setView(null);
    if (!visibility.map && view === 'map') setView(null);
  }, [
    view,
    visibility.mastery,
    visibility.passiveTree,
    visibility.inventory,
    visibility.crafting,
    visibility.map,
  ]);

  const close = () => setView(null);

  function toggle(key: Exclude<MobileView, null>) {
    if ((key === 'bag' || key === 'craft') && dead) return;
    if (key === 'craft' && view !== 'craft') setCraftTab('make');
    setView(v => (v === key ? null : key));
  }

  function openBuildTab(tab: BuildPanelTab) {
    setBuildPanelTab(tab);
    setView('build');
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
        icon: atlasIcon('UI_icons/passives-icon.png'),
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
        icon: atlasIcon('UI_icons/inventory-icon.png'),
        fallback: '🎒',
        label: 'Bag',
        disabled: dead,
        unlockSystems: ['inventory'] as const,
      }]
      : []),
    ...(visibility.crafting
      ? [{
        key: 'craft' as const,
        icon: atlasIcon('UI_icons/forge-icon.png'),
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
        icon: atlasIcon('UI_icons/map-icon.png'),
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
      unlockSystems: [
        'loadout',
        'abilities',
        'stances',
        'rites',
        'mastery',
        'combatLog',
        'bestiary',
        'abilityDock',
      ] as const,
    },
  ];

  const moreEntries: MoreEntry[] = [
    ...(visibility.loadout
      ? [{
        key: 'overview' as const,
        label: 'Loadout',
        icon: atlasIcon('UI_icons/runes-icon.png'),
        fallback: 'B',
        unlockSystem: 'loadout' as const,
        onSelect: () => openBuildTab('overview'),
      }]
      : []),
    ...(visibility.abilities
      ? [{
        key: 'abilities',
        label: 'Abilities',
        icon: null,
        fallback: 'A',
        unlockSystem: 'abilities' as const,
        onSelect: () => openBuildTab('abilities'),
      }]
      : []),
    ...(visibility.stances
      ? [{
        key: 'stances',
        label: 'Stances',
        icon: null,
        fallback: 'S',
        unlockSystem: 'stances' as const,
        onSelect: () => openBuildTab('stances'),
      }]
      : []),
    ...(visibility.rites
      ? [{
        key: 'rites',
        label: 'Rites',
        icon: null,
        fallback: 'R',
        unlockSystem: 'rites' as const,
        onSelect: () => openBuildTab('rites'),
      }]
      : []),
    {
      key: 'runes',
      label: 'Runes',
      icon: atlasIcon('UI_icons/runes-icon.png'),
      fallback: 'R',
      onSelect: () => openBuildTab('runes'),
    },
    ...(visibility.mastery
      ? [{
        key: 'mastery',
        label: 'Mastery',
        icon: atlasIcon('UI_icons/progress-icon.png'),
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
      icon: atlasIcon('UI_icons/settings-icon.png'),
      fallback: '⚙',
      onSelect: () => { setSettingsOpen(true); setView(null); },
    },
    {
      key: 'tactical',
      label: 'Tactical Mode',
      icon: atlasIcon('UI_icons/map-icon.png'),
      fallback: 'T',
      onSelect: () => hudBus.toggleTacticalView(),
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
          <ArchetypeMechanics compact />
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
            {moreEntries.map(entry => (
              <button
                key={entry.key}
                type="button"
                className="mhud-more__btn"
                data-ui-unlock-system={entry.unlockSystem}
                onClick={entry.onSelect}
              >
                <GameIcon
                  className="mhud-more__icon"
                  source={entry.icon}
                  size={20}
                  fallback={entry.fallback}
                  decorative
                />
                <span className="mhud-more__label">{entry.label}</span>
              </button>
            ))}
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
      {view === 'build' && <BuildPanel progressiveDisclosure onClose={close} />}
      {view === 'mastery' && <MasteryPanel onClose={close} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
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
