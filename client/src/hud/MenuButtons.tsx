import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { atlasIcon, GameIcon, type IconSource } from "../ui/GameIcon";
import { hudBus } from "../hudBus";
import { SkillTreePanel } from "../ui/SkillTreePanel";
import { BuildPanel } from "../ui/BuildPanel";
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
import type { UiUnlockSystem } from "./uiUnlocks";
import {
  closePrimaryOverlays,
  openPrimaryOverlay,
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
  globalMasteryAtom,
  inventoryOpenAtom,
  mapHighlightNodesAtom,
  mapOpenAtom,
  masteryOpenAtom,
  playerIdAtom,
  playerTierAtom,
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
  unlockSystems?: readonly UiUnlockSystem[];
  /** Rendered beneath the entry while it is open. Omit for flat destinations. */
  sections?: NavSection[];
  onClick: () => void;
}

/**
 * Icon-led navigation entry. Destinations that have sections reveal them here
 * while open, so "Crafting → Upgrade" is one action instead of open-then-tab.
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
          <span
            className={`right-nav-button__badge right-nav-button__badge--${badgeTone}`}
            aria-label={badgeTone === "unlock" ? "Newly unlocked, not yet opened" : "Action available"}
          />
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
  const [masteryOpen, setMasteryOpen] = useAtom(masteryOpenAtom);
  const [invOpen, setInvOpen] = useAtom(inventoryOpenAtom);
  const [craftTab, setCraftTab] = useAtom(craftTabAtom);
  const [buildTab, setBuildTab] = useAtom(buildPanelTabAtom);
  const [mapOpen, setMapOpen] = useAtom(mapOpenAtom);
  const [mapHighlightNodes, setMapHighlightNodes] = useAtom(mapHighlightNodesAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [forgeBadge, setForgeBadge] = useState(0);
  const skillPoints = useAtomValue(skillPointsAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const showMastery = masteryIsVisible(playerTier, globalMastery);
  const visibility = useSystemVisibility();
  const badges = useUnlockBadges(visibility, useAtomValue(playerIdAtom));

  useEffect(
    () => hudBus.subscribeRecipeUnlock(() => setForgeBadge((n) => n + 1)),
    [],
  );

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

  // Section shortcuts, surfaced in the rail while their dialog is open. Build's
  // gated sections reuse the same `data-ui-unlock-system` tokens as the tabs
  // they mirror, so a reveal wakes the rail entry too.
  const craftSections: NavSection[] = [
    { key: "make", label: "Make", selected: craftTab === "make", onSelect: () => setCraftTab("make") },
    { key: "upgrade", label: "Upgrade", selected: craftTab === "upgrade", onSelect: () => setCraftTab("upgrade") },
  ];

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
    { key: "runes", label: "Runes", selected: buildTab === "runes", onSelect: () => setBuildTab("runes") },
  ];

  // The rail itself is `display: none` below the breakpoint, but its dialogs
  // portal to document.body and would escape that. MobileHUD owns every mobile
  // destination, so rendering here as well would stack a second copy of any
  // dialog whose open state is a shared atom (Settings).
  if (isMobile) return null;

  return (
    <div className="sidebar sidebar-right desktop-hud">
      {visibility.progression && (
      <QuestPanel
        onFindDungeon={(nodeIds) => {
          setMapHighlightNodes(nodeIds);
          openPrimaryOverlay("map");
        }}
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
            icon={atlasIcon("UI_icons/runes-icon.png")}
            selected={buildOpen}
            badge={badges.has("loadout")}
            badgeTone="unlock"
            unlockSystems={["loadout", "abilities", "stances", "rites"]}
            sections={buildSections}
            onClick={() => {
              badges.clear("loadout");
              togglePrimaryOverlay("build");
            }}
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
            selected={craftTab !== null}
            disabled={dead}
            badge={badges.has("crafting") || (forgeBadge > 0 && craftTab === null)}
            unlockSystems={["crafting"]}
            sections={craftSections}
            onClick={() => {
              badges.clear("crafting");
              togglePrimaryOverlay("crafting");
              setForgeBadge(0);
            }}
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
      {masteryOpen && <MasteryPanel onClose={() => setMasteryOpen(false)} />}
      {invOpen && <InventoryPanel onClose={() => setInvOpen(false)} />}
      {craftTab !== null && (
        <CraftingPanel
          tab={craftTab}
          onTabChange={setCraftTab}
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
