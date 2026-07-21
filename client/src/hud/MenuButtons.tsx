import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { UIIcon } from "../ui/UIIcon";
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
  icon: string;
  selected: boolean;
  disabled?: boolean;
  badge?: boolean;
  onClick: () => void;
}

function RightNavButton({ label, icon, selected, disabled, badge, onClick }: RightNavButtonProps) {
  return (
    <button
      type="button"
      className={`right-nav-button${selected ? " right-nav-button--selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="right-nav-button__icon" aria-hidden>
        <UIIcon frameName={icon} size={20} />
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
          icon="UI_icons/passives-icon.png"
          selected={treeOpen}
          badge={!treeOpen && skillPoints > 0}
          onClick={() => togglePrimaryOverlay("skill-tree")}
        />
        {showMastery && (
          <RightNavButton
            label="Mastery"
            icon="UI_icons/progress-icon.png"
            selected={masteryOpen}
            onClick={() => togglePrimaryOverlay("mastery")}
          />
        )}
        <RightNavButton
          label="Build"
          icon="UI_icons/runes-icon.png"
          selected={buildOpen}
          onClick={() => togglePrimaryOverlay("build")}
        />
        <RightNavButton
          label="Inventory"
          icon="UI_icons/inventory-icon.png"
          selected={invOpen}
          disabled={dead}
          onClick={() => togglePrimaryOverlay("inventory")}
        />
        <RightNavButton
          label="Crafting"
          icon="UI_icons/forge-icon.png"
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
          icon="UI_icons/map-icon.png"
          selected={mapOpen}
          onClick={() => togglePrimaryOverlay("map")}
        />
        <RightNavButton
          label="Settings"
          icon="UI_icons/settings-icon.png"
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
