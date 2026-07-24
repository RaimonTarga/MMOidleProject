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
import { EssencePanel } from "./EssencePanel";
import { CatalystPanel } from "./CatalystPanel";
import { QuestPanel } from "../ui/QuestPanel";
import { SettingsPanel } from "./settings/SettingsPanel";
import { QuestOverlay } from "./quest/QuestOverlay";
import { HudPanel } from "./primitives";
import { masteryIsVisible } from "./systemVisibility";
import type { UiUnlockSystem } from "./uiUnlocks";
import { openPrimaryOverlay, togglePrimaryOverlay } from "../input/overlayStack";
import {
  craftTabAtom,
  deathOverlayAtom,
  buildOpenAtom,
  globalMasteryAtom,
  inventoryOpenAtom,
  mapHighlightNodesAtom,
  mapOpenAtom,
  masteryOpenAtom,
  playerTierAtom,
  settingsOpenAtom,
  skillPointsAtom,
  skillTreeOpenAtom,
} from "./atoms";
import "./hud.css";

interface RightNavButtonProps {
  label: string;
  icon: IconSource;
  selected: boolean;
  disabled?: boolean;
  badge?: boolean;
  unlockSystems?: readonly UiUnlockSystem[];
  onClick: () => void;
}

function RightNavButton({
  label,
  icon,
  selected,
  disabled,
  badge,
  unlockSystems,
  onClick,
}: RightNavButtonProps) {
  return (
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
      {badge && <span className="right-nav-button__badge" aria-label="New unlock available" />}
    </button>
  );
}

export function RightSidebar() {
  const [treeOpen, setTreeOpen] = useAtom(skillTreeOpenAtom);
  const [buildOpen, setBuildOpen] = useAtom(buildOpenAtom);
  const [masteryOpen, setMasteryOpen] = useAtom(masteryOpenAtom);
  const [invOpen, setInvOpen] = useAtom(inventoryOpenAtom);
  const [craftTab, setCraftTab] = useAtom(craftTabAtom);
  const [mapOpen, setMapOpen] = useAtom(mapOpenAtom);
  const [mapHighlightNodes, setMapHighlightNodes] = useAtom(mapHighlightNodesAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [tacticalMode, setTacticalMode] = useState(false);
  const [forgeBadge, setForgeBadge] = useState(0);
  const skillPoints = useAtomValue(skillPointsAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const showMastery = masteryIsVisible(playerTier, globalMastery);

  useEffect(
    () => hudBus.subscribeRecipeUnlock(() => setForgeBadge((n) => n + 1)),
    [],
  );

  useEffect(
    () => hudBus.subscribeTacticalView(setTacticalMode),
    [],
  );

  const dead = useAtomValue(deathOverlayAtom).active;

  useEffect(() => {
    if (!showMastery && masteryOpen) setMasteryOpen(false);
  }, [masteryOpen, setMasteryOpen, showMastery]);

  return (
    <div className="sidebar sidebar-right desktop-hud">
      <QuestPanel
        onFindDungeon={(nodeIds) => {
          setMapHighlightNodes(nodeIds);
          openPrimaryOverlay("map");
        }}
      />

      <nav className="right-system-nav" aria-label="Character systems">
        <RightNavButton
          label="Passive Tree"
          icon={atlasIcon("UI_icons/passives-icon.png")}
          selected={treeOpen}
          badge={!treeOpen && skillPoints > 0}
          onClick={() => togglePrimaryOverlay("skill-tree")}
        />
        {showMastery && (
          <RightNavButton
            label="Mastery"
            icon={atlasIcon("UI_icons/progress-icon.png")}
            selected={masteryOpen}
            unlockSystems={["mastery"]}
            onClick={() => togglePrimaryOverlay("mastery")}
          />
        )}
        <RightNavButton
          label="Build"
          icon={atlasIcon("UI_icons/runes-icon.png")}
          selected={buildOpen}
          unlockSystems={["abilities", "stances", "rites"]}
          onClick={() => togglePrimaryOverlay("build")}
        />
        <RightNavButton
          label="Inventory"
          icon={atlasIcon("UI_icons/inventory-icon.png")}
          selected={invOpen}
          disabled={dead}
          onClick={() => togglePrimaryOverlay("inventory")}
        />
        <RightNavButton
          label="Crafting"
          icon={atlasIcon("UI_icons/forge-icon.png")}
          selected={craftTab !== null}
          disabled={dead}
          badge={forgeBadge > 0 && craftTab === null}
          onClick={() => {
            togglePrimaryOverlay("crafting");
            setForgeBadge(0);
          }}
        />
        <RightNavButton
          label="Map"
          icon={atlasIcon("UI_icons/map-icon.png")}
          selected={mapOpen}
          onClick={() => togglePrimaryOverlay("map")}
        />
        <RightNavButton
          label="Settings"
          icon={atlasIcon("UI_icons/settings-icon.png")}
          selected={settingsOpen}
          onClick={() => togglePrimaryOverlay("settings")}
        />
      </nav>

      <EssencePanel />

      <CatalystPanel />

      <HudPanel className="sidebar-panel tactical-mode-panel">
        <button
          type="button"
          className={`auto-btn${tacticalMode ? " active" : ""}`}
          onClick={() => hudBus.toggleTacticalView()}
        >
          {tacticalMode ? "HIDE TACTICAL MODE" : "TACTICAL MODE"}
        </button>
      </HudPanel>

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
