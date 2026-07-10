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
import {
  SKILL_TREE,
  NODE_BIOMES,
  BIOME_DATABASE,
  runeBudgetForGlobalMastery,
  upgradeCeilingFromGlobalMastery,
  MAX_ITEM_TIER,
} from "@mmo-idle/shared";
import {
  craftTabAtom,
  deathOverlayAtom,
  buildOpenAtom,
  buildPanelTabAtom,
  type BuildPanelTab,
  globalMasteryAtom,
  inventoryOpenAtom,
  mapHighlightNodesAtom,
  mapOpenAtom,
  masteryOpenAtom,
  playerNodeIdAtom,
  selectedClassAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  settingsOpenAtom,
  skillPointsAtom,
  skillTreeOpenAtom,
  unlockedSkillsAtom,
} from "./atoms";
import "./hud.css";

export function RightSidebar() {
  const [treeOpen, setTreeOpen] = useAtom(skillTreeOpenAtom);
  const [buildOpen, setBuildOpen] = useAtom(buildOpenAtom);
  const [buildPanelTab, setBuildPanelTab] = useAtom(buildPanelTabAtom);
  const [masteryOpen, setMasteryOpen] = useAtom(masteryOpenAtom);
  const [invOpen, setInvOpen] = useAtom(inventoryOpenAtom);
  const [craftTab, setCraftTab] = useAtom(craftTabAtom);
  const [mapOpen, setMapOpen] = useAtom(mapOpenAtom);
  const [mapHighlightNodes, setMapHighlightNodes] = useAtom(mapHighlightNodesAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [tacticalMode, setTacticalMode] = useState(false);
  const [forgeBadge, setForgeBadge] = useState(0);

  useEffect(
    () => hudBus.subscribeRecipeUnlock(() => setForgeBadge((n) => n + 1)),
    [],
  );

  useEffect(
    () => hudBus.subscribeTacticalView(setTacticalMode),
    [],
  );

  const selectedClass = useAtomValue(selectedClassAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const skillPoints = useAtomValue(skillPointsAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const dead = useAtomValue(deathOverlayAtom).active;

  function openBuildTab(tab: BuildPanelTab): void {
    if (buildOpen && buildPanelTab === tab) {
      setBuildOpen(false);
      return;
    }
    setBuildPanelTab(tab);
    setBuildOpen(true);
  }

  const className = (() => {
    if (!selectedClass) return null;
    const t3Node = unlockedSkills.map(id => SKILL_TREE.get(id)).find(n => n?.tier === 3);
    if (t3Node) return t3Node.name;
    if (selectedRange) return SKILL_TREE.get(selectedRange)?.name ?? selectedRange;
    if (selectedSubVariant) {
      for (const node of SKILL_TREE.values()) {
        if (node.tier === 1 && node.classId === selectedClass && node.subVariantId === selectedSubVariant)
          return node.name;
      }
    }
    return SKILL_TREE.get(selectedClass)?.name ?? selectedClass;
  })();

  const zoneLabel = (() => {
    if (!nodeId) return null;
    const info = NODE_BIOMES[nodeId];
    if (!info) return nodeId;
    const biome = BIOME_DATABASE.get(info.biomeGroup);
    return `${biome?.name ?? info.biomeGroup} T${info.biomeTier}`;
  })();

  return (
    <div className="sidebar sidebar-right">
      <QuestPanel
        onFindDungeon={(nodeIds) => {
          setMapHighlightNodes(nodeIds);
          setMapOpen(true);
        }}
      />

      <div className="sidebar-panel">
        <div className="panel-title">Passive Tree</div>

        <button
          className={`auto-btn${treeOpen ? " active" : ""}${!treeOpen && skillPoints > 0 ? " auto-btn--has-points" : ""}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setTreeOpen((v) => !v)}
        >
          <UIIcon frameName="UI_icons/passives-icon.png" size={18} />
          {treeOpen ? "CLOSE TREE" : "OPEN TREE"}
        </button>

        {nodeId && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Points</span>
              <span className="stat-value">{skillPoints}</span>
            </div>
            {className && (
              <div className="stat-row">
                <span className="stat-label">Class</span>
                <span className="stat-value">{className}</span>
              </div>
            )}
            {!className && (
              <div className="stat-row">
                <span className="stat-label">Class</span>
                <span className="stat-value" style={{ color: "#666" }}>Vagrant</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-panel">
        <div className="panel-title">Mastery</div>
        <button
          className={`auto-btn${masteryOpen ? " active" : ""}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setMasteryOpen((v) => !v)}
        >
          <UIIcon frameName="UI_icons/progress-icon.png" size={18} />
          {masteryOpen ? "CLOSE MASTERY" : "OPEN MASTERY"}
        </button>
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Global</span>
            <span className="stat-value">{globalMastery}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Upgrade Cap</span>
            <span className="stat-value">
              {(() => {
                const caps = Array.from({ length: MAX_ITEM_TIER }, (_, i) =>
                  upgradeCeilingFromGlobalMastery(globalMastery, i + 1),
                );
                const unlocked = caps
                  .map((cap, i) => ({ tier: i + 1, cap }))
                  .filter(({ cap }) => cap > 0);
                return unlocked.length === 0
                  ? "+0"
                  : unlocked.map(({ tier, cap }) => `T${tier} +${cap}`).join(" ");
              })()}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Rune Points</span>
            <span className="stat-value">{runeBudgetForGlobalMastery(globalMastery)}</span>
          </div>
        </div>
      </div>

      <div className="sidebar-panel">
        <div className="panel-title">Build</div>
        {([
          ["overview", "Overview", "UI_icons/progress-icon.png"],
          ["abilities", "Abilities", "UI_icons/passives-icon.png"],
          ["stances", "Stances", "UI_icons/passives-icon.png"],
          ["rites", "Rites", "UI_icons/passives-icon.png"],
          ["runes", "Runes", "UI_icons/runes-icon.png"],
        ] as const).map(([tab, label, icon], index) => (
          <button
            key={tab}
            className={`auto-btn${buildOpen && buildPanelTab === tab ? " active" : ""}`}
            style={{
              marginTop: index === 0 ? 0 : 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => openBuildTab(tab)}
          >
            <UIIcon frameName={icon} size={18} />
            {buildOpen && buildPanelTab === tab ? `CLOSE ${label.toUpperCase()}` : label.toUpperCase()}
          </button>
        ))}
      </div>

      <EssencePanel />

      <CatalystPanel />

      <div className="sidebar-panel">
        <div className="panel-title">Inventory</div>

        <button
          className={`auto-btn${invOpen ? " active" : ""}${dead ? " auto-btn--disabled" : ""}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={dead}
          onClick={() => {
            if (!dead) setInvOpen((v) => !v);
          }}
        >
          <UIIcon frameName="UI_icons/inventory-icon.png" size={18} />
          {invOpen ? "CLOSE BAG" : "OPEN BAG"}
        </button>

        <button
            className={`auto-btn${craftTab === "forge" ? " active" : ""}${dead ? " auto-btn--disabled" : ""}`}
            style={{ marginTop: 4, position: "relative", display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={dead}
            onClick={() => {
              if (dead) return;
              setCraftTab((t) => (t === "forge" ? null : "forge"));
              setForgeBadge(0);
            }}
          >
            <UIIcon frameName="UI_icons/forge-icon.png" size={18} />
            {craftTab === "forge" ? "CLOSE FORGE" : "OPEN FORGE"}
            {forgeBadge > 0 && craftTab !== "forge" && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#44ff88",
                  boxShadow: "0 0 6px #44ff88",
                  display: "inline-block",
                }}
              />
            )}
          </button>
          <button
            className={`auto-btn${craftTab === "upgrade" ? " active" : ""}${dead ? " auto-btn--disabled" : ""}`}
            style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={dead}
            onClick={() => {
              if (!dead) setCraftTab((t) => (t === "upgrade" ? null : "upgrade"));
            }}
          >
            <UIIcon frameName="UI_icons/upgrade-icon.png" size={18} />
            {craftTab === "upgrade" ? "CLOSE UPGRADE" : "UPGRADE ITEMS"}
          </button>
          <button
            className={`auto-btn${craftTab === "biome" ? " active" : ""}${dead ? " auto-btn--disabled" : ""}`}
            style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={dead}
            onClick={() => {
              if (!dead) setCraftTab((t) => (t === "biome" ? null : "biome"));
            }}
          >
            <UIIcon frameName="UI_icons/progress-icon.png" size={18} />
            {craftTab === "biome" ? "CLOSE BIOME" : "BIOME PROGRESS"}
          </button>
      </div>

      <div className="sidebar-panel">
        <div className="panel-title">Map</div>

        <button
          className={`auto-btn${mapOpen ? " active" : ""}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setMapOpen((v) => !v)}
        >
          <UIIcon frameName="UI_icons/map-icon.png" size={18} />
          {mapOpen ? "CLOSE MAP" : "OPEN MAP"}
        </button>

        {zoneLabel && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Zone</span>
              <span className="stat-value">{zoneLabel}</span>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-panel">
        <div className="panel-title">Settings</div>
        <button
          className={`auto-btn${settingsOpen ? " active" : ""}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <UIIcon frameName="UI_icons/settings-icon.png" size={18} />
          {settingsOpen ? "CLOSE SETTINGS" : "OPEN SETTINGS"}
        </button>
      </div>

      <div className="sidebar-panel">
        <button
          className={`auto-btn${tacticalMode ? " active" : ""}`}
          onClick={() => hudBus.toggleTacticalView()}
        >
          {tacticalMode ? "HIDE TACTICAL MODE" : "TACTICAL MODE"}
        </button>
      </div>

      {treeOpen && <SkillTreePanel onClose={() => setTreeOpen(false)} />}
      {buildOpen && <BuildPanel onClose={() => setBuildOpen(false)} />}
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
