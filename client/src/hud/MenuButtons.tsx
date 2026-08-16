import { useEffect, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { atlasIcon, GameIcon, type IconSource } from "../ui/GameIcon";
import { hudBus } from "../hudBus";
import { SkillTreePanel } from "../ui/SkillTreePanel";
import { BuildPanel } from "../ui/BuildPanel";
import { RunesPanel } from "../ui/RunesPanel";
import { MasteryPanel } from "../ui/MasteryPanel";
import { InventoryPanel } from "../ui/InventoryPanel";
import { CraftingPanel } from "../ui/CraftingPanel";
import { MapPanel } from "../ui/MapPanel";
import { MaterialsPanel } from "./MaterialsPanel";
import { QuestPanel } from "../ui/QuestPanel";
import { SettingsPanel } from "./settings/SettingsPanel";
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
  equippedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  deathOverlayAtom,
  buildOpenAtom,
  runesOpenAtom,
  globalMasteryAtom,
  inventoryOpenAtom,
  mapHighlightNodesAtom,
  mapOpenAtom,
  masteryOpenAtom,
  playerIdAtom,
  settingsOpenAtom,
  skillPointsAtom,
  skillTreeOpenAtom,
} from "./atoms";
import "./hud.css";

/** A destination's sections, surfaced in the rail while that dialog is open. */
interface NavSection {
  key: string;
  label: string;
  selected: boolean;
  unlockSystems?: readonly UiUnlockSystem[];
  onSelect: () => void;
}

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
  /** Rendered beneath the entry while it is open. Omit for flat destinations. */
  sections?: NavSection[];
  onClick: () => void;
}

/**
 * Icon-led navigation entry. Destinations that have sections reveal them here
 * while open, so related loadout choices stay one action away.
 * The entry itself still opens on its default section in a single click, so
 * flat destinations cost no extra step.
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
  sections,
  onClick,
}: RightNavButtonProps) {
  const showSections = selected && !!sections && sections.length > 0;

  return (
    <div className={`right-nav-entry${showSections ? " right-nav-entry--expanded" : ""}`}>
      <button
        type="button"
        className={`right-nav-button${selected ? " right-nav-button--selected" : ""}`}
        aria-pressed={selected}
        aria-expanded={sections && sections.length > 0 ? selected : undefined}
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
        {sections && sections.length > 0 && (
          <span className="right-nav-button__chevron" aria-hidden>{selected ? "▾" : "▸"}</span>
        )}
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

      {showSections && (
        <ul className="right-nav-sections">
          {sections.map((section) => (
            <li key={section.key}>
              <button
                type="button"
                className={`right-nav-section${section.selected ? " right-nav-section--selected" : ""}`}
                aria-current={section.selected ? "true" : undefined}
                data-ui-unlock-system={section.unlockSystems?.join(" ") || undefined}
                onClick={section.onSelect}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RightSidebar() {
  const isMobile = useIsMobile();
  const [treeOpen, setTreeOpen] = useAtom(skillTreeOpenAtom);
  const [buildOpen, setBuildOpen] = useAtom(buildOpenAtom);
  const [runesOpen, setRunesOpen] = useAtom(runesOpenAtom);
  const [masteryOpen, setMasteryOpen] = useAtom(masteryOpenAtom);
  const [invOpen, setInvOpen] = useAtom(inventoryOpenAtom);
  const [craftTab, setCraftTab] = useAtom(craftTabAtom);
  const [buildTab, setBuildTab] = useAtom(buildPanelTabAtom);
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

  useEffect(() => {
    if (!showMastery && masteryOpen) setMasteryOpen(false);
  }, [masteryOpen, setMasteryOpen, showMastery]);

  // A tablet rotating across the breakpoint unmounts this rail. Clear the
  // desktop dialog atoms so the state cannot describe an overlay that nothing
  // is rendering; MobileHUD owns mobile destinations through its own view.
  useEffect(() => {
    if (isMobile) closePrimaryOverlays();
  }, [isMobile]);

  // Loadout keeps the choices changed together; Runes is now its own destination.
  const buildSections: NavSection[] = [
    { key: "overview", label: "Overview", selected: buildTab === "overview", onSelect: () => setBuildTab("overview") },
    ...(visibility.abilities
      ? [{ key: "abilities", label: "Abilities", selected: buildTab === "abilities", unlockSystems: ["abilities"] as const, onSelect: () => setBuildTab("abilities") }]
      : []),
    ...(visibility.stances
      ? [{ key: "stances", label: "Stances", selected: buildTab === "stances", unlockSystems: ["stances"] as const, onSelect: () => setBuildTab("stances") }]
      : []),
    ...(visibility.rites
      ? [{ key: "rites", label: "Rites", selected: buildTab === "rites", unlockSystems: ["rites"] as const, onSelect: () => setBuildTab("rites") }]
      : []),
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

      <nav className="right-system-nav" aria-label="Character systems">
        {visibility.passiveTree && (
          <RightNavButton
            label="Passive Tree"
            icon={atlasIcon("UI_icons/passives-icon.png")}
            selected={treeOpen}
            badge={badges.has("passiveTree") || (!treeOpen && skillPoints > 0)}
            unlockSystems={["passiveTree"]}
            onClick={() => {
              badges.clear("passiveTree");
              togglePrimaryOverlay("skill-tree");
            }}
          />
        )}
        {visibility.loadout && (
          <RightNavButton
            label="Loadout"
            icon={atlasIcon("UI_icons/abilities/sweep.png")}
            selected={buildOpen}
            badge={badges.has("loadout")}
            badgeTone="unlock"
            unlockSystems={["loadout", "abilities", "stances", "rites", "abilityDock"]}
            sections={buildSections}
            onClick={() => {
              badges.clear("loadout");
              togglePrimaryOverlay("build");
            }}
          />
        )}
        {visibility.loadout && (
          <RightNavButton
            label="Runes"
            icon={atlasIcon("UI_icons/runes-icon.png")}
            selected={runesOpen}
            unlockSystems={["loadout"]}
            onClick={() => togglePrimaryOverlay("runes")}
          />
        )}
        {visibility.inventory && (
          <RightNavButton
            label="Inventory"
            icon={atlasIcon("UI_icons/inventory-icon.png")}
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
            icon={atlasIcon("UI_icons/forge-icon.png")}
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
            icon={atlasIcon("UI_icons/craft-upgrade-icon.png")}
            selected={craftTab === "upgrade"}
            disabled={dead}
            unlockSystems={["crafting"]}
            onClick={() => toggleCraftDestination("upgrade")}
          />
        )}
        {visibility.map && (
          <RightNavButton
            label="Map"
            icon={atlasIcon("UI_icons/map-icon.png")}
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
          icon={atlasIcon("UI_icons/settings-icon.png")}
          selected={settingsOpen}
          onClick={() => togglePrimaryOverlay("settings")}
        />
      </nav>

      {visibility.materials && <MaterialsPanel />}

      {treeOpen && <SkillTreePanel onClose={() => setTreeOpen(false)} />}
      {buildOpen && (
        <BuildPanel
          progressiveDisclosure
          onClose={() => setBuildOpen(false)}
        />
      )}
      {runesOpen && <RunesPanel onClose={() => setRunesOpen(false)} />}
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
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      <QuestOverlay />
    </div>
  );
}
