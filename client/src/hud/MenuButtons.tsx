import { BehaviorPanel } from './BehaviorPanel';
import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { GameIcon, type IconSource } from "../ui/GameIcon";
import { hudBus } from "../hudBus";
import { SkillTreePanel } from "../ui/SkillTreePanel";
import { BuildPanel } from "../ui/BuildPanel";
import { buildSectionIconSource, menuIconSource } from "../ui/systemIcons";
import { MasteryPanel } from "../ui/MasteryPanel";
import { InventoryPanel } from "../ui/InventoryPanel";
import { CraftingPanel } from "../ui/CraftingPanel";
import { MapPanel } from "../ui/MapPanel";
import { MaterialsPanel } from "./MaterialsPanel";
import { QuestPanel } from "../ui/QuestPanel";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CharacterSelectPrompt } from "./CharacterSelectPrompt";
import { QuestOverlay } from "./quest/QuestOverlay";
import { HudPanel } from "./primitives";
import { useIsMobile } from "./useIsMobile";
import { masteryIsVisible } from "./systemVisibility";
import { useSystemVisibility } from "./useSystemVisibility";
import { useUnlockBadges } from "./unlockBadges";
import { useNewEntries } from "../ui/crafting/useNewEntries";
import { eligibleMakeKeys, useMakeEntries } from "../ui/crafting/useMakeEntries";
import type { UiUnlockSystem } from "./uiUnlocks";
import {
  closePrimaryOverlays,
  toggleBuildTab,
  togglePrimaryOverlay,
} from "../input/overlayStack";
import {
  activeStanceAtom,
  buildPanelTabAtom,
  catalystProgressAtom,
  catalystsAtom,
  essencesAtom,
  passivesAtom,
  unlockedRecipesAtom,
  biomeLevelAtom,
  biomeXPAtom,
  equipmentAtom,
  inventoryAtom,
  questProgressAtom,
  runesOwnedAtom,
  craftTabAtom,
  attunedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  deathOverlayAtom,
  buildOpenAtom,
  globalMasteryAtom,
  inventoryOpenAtom,
  mapHighlightNodesAtom,
  mapOpenAtom,
  masteryOpenAtom,
  playerIdAtom,
  settingsOpenAtom,
  skillPointsAtom,
  skillTreeOpenAtom,
  type BuildPanelTab,
} from "./atoms";
import "./hud.css";

interface RightNavButtonProps {
  label: string;
  icon: IconSource;
  selected: boolean;
  disabled?: boolean;
  badge?: boolean;
  /** An unvisited reveal (§16) reads gold and pulses; other badges stay green. */
  badgeTone?: "action" | "unlock";
  /**
   * Turns the pip into a count. A dot says "something is waiting"; a number says
   * how much, which is the difference between "I'll look later" and "three new
   * recipes landed".
   */
  badgeCount?: number;
  unlockSystems?: readonly UiUnlockSystem[];
  /** Sets the entry apart from the destinations above it, e.g. a session action. */
  standalone?: boolean;
  onClick: () => void;
}

/**
 * Icon-led navigation entry. Every destination is flat: Abilities, Stances,
 * Rites and Runes each get their own entry rather than hiding behind a wrapper
 * that expands into them.
 */
function RightNavButton({
  label,
  icon,
  selected,
  disabled,
  badge,
  badgeTone = "action",
  badgeCount,
  unlockSystems,
  standalone,
  onClick,
}: RightNavButtonProps) {
  return (
    <div className={`right-nav-entry${standalone ? " right-nav-entry--standalone" : ""}`}>
      <button
        type="button"
        className={`right-nav-button${selected ? " right-nav-button--selected" : ""}`}
        aria-pressed={selected}
        data-ui-unlock-system={unlockSystems?.join(" ") || undefined}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="right-nav-button__icon" aria-hidden>
          <GameIcon
            source={icon}
            size={20}
            fallback={label.charAt(0)}
            decorative
          />
        </span>
        <span className="right-nav-button__label">{label}</span>
        {badge && (
          badgeCount && badgeCount > 0 ? (
            <span
              className={`right-nav-button__badge right-nav-button__badge--${badgeTone} right-nav-button__badge--count`}
              aria-label={`${badgeCount} new`}
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          ) : (
            <span
              className={`right-nav-button__badge right-nav-button__badge--${badgeTone}`}
              aria-label={badgeTone === "unlock" ? "Newly unlocked, not yet opened" : "Action available"}
            />
          )
        )}
      </button>
    </div>
  );
}

export function RightSidebar() {
  const isMobile = useIsMobile();
  const [treeOpen, setTreeOpen] = useAtom(skillTreeOpenAtom);
  const [buildOpen, setBuildOpen] = useAtom(buildOpenAtom);
  const [masteryOpen, setMasteryOpen] = useAtom(masteryOpenAtom);
  const [invOpen, setInvOpen] = useAtom(inventoryOpenAtom);
  const [craftTab, setCraftTab] = useAtom(craftTabAtom);
  const buildTab = useAtomValue(buildPanelTabAtom);
  const [mapOpen, setMapOpen] = useAtom(mapOpenAtom);
  const [mapHighlightNodes, setMapHighlightNodes] = useAtom(mapHighlightNodesAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const skillPoints = useAtomValue(skillPointsAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const showMastery = masteryIsVisible(globalMastery);
  const visibility = useSystemVisibility();
  const playerId = useAtomValue(playerIdAtom);
  const badges = useUnlockBadges(visibility, playerId);

  // How many recipes became makeable and have not been looked at. Replaces a
  // local counter fed by the gear-unlock toast, which could only ever see gear:
  // techniques, stances, rites and runes unlock from biome levels and boss
  // clears, with no event to subscribe to. This shares its state with the craft
  // list, so looking at an entry there decrements the count here.
  const makeEntries = useMakeEntries();
  const eligibleKeys = useMemo(() => eligibleMakeKeys(makeEntries), [makeEntries]);
  const newRecipes = useNewEntries("craft", playerId, eligibleKeys);

  const dead = useAtomValue(deathOverlayAtom).active;
  const [charSelectPrompt, setCharSelectPrompt] = useState(false);

  useEffect(() => {
    if (!showMastery && masteryOpen) setMasteryOpen(false);
  }, [masteryOpen, setMasteryOpen, showMastery]);

  // A tablet rotating across the breakpoint unmounts this rail. Clear the
  // desktop dialog atoms so the state cannot describe an overlay that nothing
  // is rendering; MobileHUD owns mobile destinations through its own view.
  useEffect(() => {
    if (isMobile) closePrimaryOverlays();
  }, [isMobile]);

  // Abilities, Stances, Rites and Runes share one dialog but each owns a rail
  // entry: an entry is selected when that dialog is open on its tab.
  const buildEntries: {
    tab: BuildPanelTab;
    label: string;
    gate: UiUnlockSystem;
  }[] = [
    { tab: "abilities", label: "Abilities", gate: "abilities" },
    { tab: "stances", label: "Stances", gate: "stances" },
    { tab: "rites", label: "Rites", gate: "rites" },
    { tab: "runes", label: "Runes", gate: "loadout" },
  ];

  const toggleCraftDestination = (tab: 'make' | 'upgrade') => {
    if (craftTab === tab) {
      closePrimaryOverlays();
      return;
    }
    closePrimaryOverlays();
    setCraftTab(tab);
  };

  // The rail itself is `display: none` below the breakpoint, but its dialogs
  // portal to document.body and would escape that. MobileHUD owns every mobile
  // destination, so rendering here as well would stack a second copy of any
  // dialog whose open state is a shared atom (Settings).
  if (isMobile) return null;

  return (
    <div className="sidebar sidebar-right desktop-hud">
      {visibility.progression && (
      <QuestPanel
        showMastery={showMastery}
        onOpenMastery={() => togglePrimaryOverlay("mastery")}
      />
      )}

      <BehaviorPanel />

      <nav className="right-system-nav" aria-label="Character systems">
        {visibility.passiveTree && (
          <RightNavButton
            label="Passive Tree"
            icon={menuIconSource("passive-tree")}
            selected={treeOpen}
            badge={badges.has("passiveTree") || (!treeOpen && skillPoints > 0)}
            unlockSystems={["passiveTree"]}
            onClick={() => {
              badges.clear("passiveTree");
              togglePrimaryOverlay("skill-tree");
            }}
          />
        )}
        {buildEntries.map((entry) => visibility[entry.gate] && (
          <RightNavButton
            key={entry.tab}
            label={entry.label}
            icon={buildSectionIconSource(entry.tab)}
            selected={buildOpen && buildTab === entry.tab}
            badge={badges.has(entry.gate)}
            badgeTone="unlock"
            unlockSystems={[entry.gate]}
            onClick={() => {
              badges.clear(entry.gate);
              toggleBuildTab(entry.tab);
            }}
          />
        ))}
        {visibility.inventory && (
          <RightNavButton
            label="Inventory"
            icon={menuIconSource("inventory")}
            selected={invOpen}
            disabled={dead}
            badge={badges.has("inventory")}
            badgeTone="unlock"
            unlockSystems={["inventory"]}
            onClick={() => {
              badges.clear("inventory");
              togglePrimaryOverlay("inventory");
            }}
          />
        )}
        {visibility.crafting && (
          <RightNavButton
            label="Crafting"
            icon={menuIconSource("crafting")}
            selected={craftTab === "make"}
            disabled={dead}
            badge={badges.has("crafting") || newRecipes.count > 0}
            badgeCount={newRecipes.count}
            unlockSystems={["crafting"]}
            onClick={() => {
              badges.clear("crafting");
              toggleCraftDestination("make");
            }}
          />
        )}
        {visibility.crafting && (
          <RightNavButton
            label="Upgrade"
            icon={menuIconSource("upgrade")}
            selected={craftTab === "upgrade"}
            disabled={dead}
            unlockSystems={["crafting"]}
            onClick={() => toggleCraftDestination("upgrade")}
          />
        )}
        {visibility.map && (
          <RightNavButton
            label="Map"
            icon={menuIconSource("map")}
            selected={mapOpen}
            badge={badges.has("map")}
            badgeTone="unlock"
            unlockSystems={["map"]}
            onClick={() => {
              badges.clear("map");
              togglePrimaryOverlay("map");
            }}
          />
        )}
        {/* Settings never gates: it holds accessibility controls (§16). */}
        <RightNavButton
          label="Settings"
          icon={menuIconSource("settings")}
          selected={settingsOpen}
          onClick={() => togglePrimaryOverlay("settings")}
        />
      </nav>

      {visibility.materials && <MaterialsPanel />}

      {treeOpen && <SkillTreePanel onClose={() => setTreeOpen(false)} />}
      {buildOpen && <BuildPanel onClose={() => setBuildOpen(false)} />}
      {masteryOpen && <MasteryPanel onClose={() => setMasteryOpen(false)} />}
      {invOpen && <InventoryPanel onClose={() => setInvOpen(false)} />}
      {craftTab !== null && (
        <CraftingPanel
          tab={craftTab}
          onClose={() => setCraftTab(null)}
        />
      )}
      {mapOpen && (
        <MapPanel
          highlightNodes={mapHighlightNodes}
          focusNodeId={mapHighlightNodes[0] ?? null}
          onClose={() => {
            setMapOpen(false);
            setMapHighlightNodes([]);
          }}
        />
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} onSwitchCharacter={() => setCharSelectPrompt(true)} />}
      {charSelectPrompt && <CharacterSelectPrompt onCancel={() => setCharSelectPrompt(false)} />}
      <QuestOverlay />
    </div>
  );
}
