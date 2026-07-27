import { StatPanel } from "./StatPanel";
import { PartyPanel } from "./PartyPanel";
import { CombatLogPanel } from "./CombatLogPanel";
import { DebugPanel } from "./DebugPanel";
import { BestiaryPanel } from "./bestiary/BestiaryPanel";
import { BestiaryDetailOverlay } from "./bestiary/BestiaryDetailOverlay";
import { useSystemVisibility } from "./useSystemVisibility";
import "./hud.css";
import "./rail.css";

/**
 * The rail is `display: none` below the breakpoint, so its panels are desktop
 * surfaces. It still mounts on mobile because `BestiaryDetailOverlay` portals
 * to document.body and is the bestiary surface MobileHUD's More menu opens.
 * Anything added here that portals out must be mobile-safe for the same reason.
 */
export function LeftSidebar() {
  const visibility = useSystemVisibility();
  return (
    <div className="sidebar sidebar-left desktop-hud">
      <StatPanel />
      {visibility.party && <PartyPanel />}
      {visibility.combatLog && (
        <div data-ui-unlock-system="combatLog"><CombatLogPanel /></div>
      )}
      {visibility.bestiary && (
        <div data-ui-unlock-system="bestiary"><BestiaryPanel /></div>
      )}
      <DebugPanel />
      <BestiaryDetailOverlay />
    </div>
  );
}
