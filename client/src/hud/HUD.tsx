import { StatPanel } from "./StatPanel";
import { CombatLogPanel } from "./CombatLogPanel";
import { DebugPanel } from "./DebugPanel";
import "./hud.css";

export function LeftSidebar() {
  return (
    <div className="sidebar sidebar-left">
      <StatPanel />
      <CombatLogPanel />
      <DebugPanel />
    </div>
  );
}
