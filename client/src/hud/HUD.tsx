import { StatPanel } from "./StatPanel";
import { PartyPanel } from "./PartyPanel";
import { CombatLogPanel } from "./CombatLogPanel";
import "./hud.css";

export function LeftSidebar() {
  return (
    <div className="sidebar sidebar-left">
      <StatPanel />
      <PartyPanel />
      <CombatLogPanel />
    </div>
  );
}
