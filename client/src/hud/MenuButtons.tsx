import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { hudBus } from "../hudBus";
import { SkillTreePanel } from "../ui/SkillTreePanel";
import { InventoryPanel } from "../ui/InventoryPanel";
import { CraftingPanel } from "../ui/CraftingPanel";
import { MapPanel } from "../ui/MapPanel";
import { EssencePanel } from "./EssencePanel";
import { QuestPanel } from "../ui/QuestPanel";
import { SettingsPanel } from "./settings/SettingsPanel";
import { QuestOverlay } from "./quest/QuestOverlay";
import { SKILL_TREE, NODE_BIOMES, BIOME_DATABASE } from "@mmo-idle/shared";
import {
  craftTabAtom,
  equipmentAtom,
  inventoryAtom,
  inventoryOpenAtom,
  mapHighlightNodesAtom,
  mapOpenAtom,
  playerNodeIdAtom,
  selectedClassAtom,
  settingsOpenAtom,
  skillPointsAtom,
  skillTreeOpenAtom,
} from "./atoms";
import "./hud.css";

export function RightSidebar() {
  const [treeOpen, setTreeOpen] = useAtom(skillTreeOpenAtom);
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
  const skillPoints = useAtomValue(skillPointsAtom);
  const inventory = useAtomValue(inventoryAtom);
  const equipment = useAtomValue(equipmentAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);

  const className = selectedClass
    ? (SKILL_TREE.get(selectedClass)?.name ?? selectedClass)
    : null;

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
          onClick={() => setTreeOpen((v) => !v)}
        >
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
                <span
                  className="stat-label"
                  style={{ color: "#33334a", fontSize: 10 }}
                >
                  No class selected
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <EssencePanel />

      <div className="sidebar-panel">
        <div className="panel-title">Inventory</div>

        <button
          className={`auto-btn${invOpen ? " active" : ""}`}
          onClick={() => setInvOpen((v) => !v)}
        >
          {invOpen ? "CLOSE BAG" : "OPEN BAG"}
        </button>

        {nodeId && (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Bag</span>
              <span className="stat-value">
                {inventory.length} item
                {inventory.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Weapon</span>
              <span className="stat-value">
                {equipment.weapon ? (
                  <span style={{ color: "#44ff88" }}>Equipped</span>
                ) : (
                  <span className="dim">—</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-panel">
        <div className="panel-title">Crafting</div>

        <button
          className={`auto-btn${craftTab === "biome" ? " active" : ""}`}
          onClick={() => setCraftTab((t) => (t === "biome" ? null : "biome"))}
        >
          {craftTab === "biome" ? "CLOSE BIOME" : "BIOME PROGRESS"}
        </button>
        <button
          className={`auto-btn${craftTab === "forge" ? " active" : ""}`}
          style={{ marginTop: 4, position: "relative" }}
          onClick={() => {
            setCraftTab((t) => (t === "forge" ? null : "forge"));
            setForgeBadge(0);
          }}
        >
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
          className={`auto-btn${craftTab === "upgrade" ? " active" : ""}`}
          style={{ marginTop: 4 }}
          onClick={() => setCraftTab((t) => (t === "upgrade" ? null : "upgrade"))}
        >
          {craftTab === "upgrade" ? "CLOSE UPGRADE" : "UPGRADE ITEMS"}
        </button>
      </div>

      <div className="sidebar-panel">
        <div className="panel-title">Map</div>

        <button
          className={`auto-btn${mapOpen ? " active" : ""}`}
          onClick={() => setMapOpen((v) => !v)}
        >
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
          onClick={() => setSettingsOpen((v) => !v)}
        >
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
