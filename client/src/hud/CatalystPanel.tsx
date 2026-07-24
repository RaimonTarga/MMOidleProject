import { useAtomValue } from "jotai";
import { catalystLabel, GAME_CONFIG, PACE_FAMILIES, PACE_FAMILY_COLORS } from "@mmo-idle/shared";
import { GameIcon } from "../ui/GameIcon";
import { catalystIconSource } from "../ui/economyIcons";
import { catalystsAtom, catalystProgressAtom } from "./atoms";
import { HudPanel } from "./primitives";
import "./essence.css";

/**
 * Combat-family catalysts wallet. Keyed by pace family (Map Variety Stage A),
 * rendered in the fixed PACE_FAMILIES order with per-family color accents. Only
 * lists families the player has touched (any catalysts or in-progress); the whole
 * panel hides until the first catalyst progress so it doesn't clutter early game.
 */
export function CatalystPanel() {
  const catalysts = useAtomValue(catalystsAtom);
  const progress = useAtomValue(catalystProgressAtom);

  const families = PACE_FAMILIES.filter(
    (f) => (catalysts[f] ?? 0) > 0 || (progress[f] ?? 0) > 0,
  );

  if (families.length === 0) return null;

  const per = GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT;

  return (
    <HudPanel className="sidebar-panel economy-panel catalyst-panel">
      <div className="panel-title">Catalysts</div>
      <div className="essence-list">
        {families.map((family) => {
          const owned = catalysts[family] ?? 0;
          const prog = progress[family] ?? 0;
          return (
            <div key={family} className="essence-row">
              <GameIcon
                source={catalystIconSource(family)}
                size={18}
                fallback={null}
                decorative
                className="economy-icon catalyst-icon"
              />
              <span className="essence-name" style={{ color: PACE_FAMILY_COLORS[family] }}>
                {catalystLabel(family)}
              </span>
              <span className="essence-value">{owned}</span>
              <span className="essence-progress">
                {prog}/{per}
              </span>
            </div>
          );
        })}
      </div>
    </HudPanel>
  );
}
