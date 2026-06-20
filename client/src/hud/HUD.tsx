import { StatPanel } from "./StatPanel";
import { PartyPanel } from "./PartyPanel";
import { CombatLogPanel } from "./CombatLogPanel";
import { DebugPanel } from "./DebugPanel";
import { BestiaryPanel } from "./bestiary/BestiaryPanel";
import { BestiaryDetailOverlay } from "./bestiary/BestiaryDetailOverlay";
import "./hud.css";

export function LeftSidebar() {
  return (
    <div className="sidebar sidebar-left">
      <StatPanel />
      <PartyPanel />
      <CombatLogPanel />
      <BestiaryPanel />
      <DebugPanel />
      <BestiaryDetailOverlay />
    </div>
  );
}
