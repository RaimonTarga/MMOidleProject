import { useAtomValue } from "jotai";
import { catalystLabel, GAME_CONFIG } from "@mmo-idle/shared";
import { catalystsAtom, catalystProgressAtom } from "./atoms";
import { HudPanel } from "./primitives";
import "./essence.css";

/**
 * Biome catalysts wallet. Mirrors EssencePanel but is keyed by biome group and
 * only lists groups the player has touched (any catalysts or in-progress). The
 * whole panel hides until the player earns their first catalyst progress so it
 * doesn't clutter early game.
 */
export function CatalystPanel() {
  const catalysts = useAtomValue(catalystsAtom);
  const progress = useAtomValue(catalystProgressAtom);

  const groups = Array.from(
    new Set([...Object.keys(catalysts), ...Object.keys(progress)]),
  )
    .filter((g) => (catalysts[g] ?? 0) > 0 || (progress[g] ?? 0) > 0)
    .sort();

  if (groups.length === 0) return null;

  const per = GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT;

  return (
    <HudPanel className="sidebar-panel economy-panel catalyst-panel">
      <div className="panel-title">Catalysts</div>
      <div className="essence-list">
        {groups.map((group) => {
          const owned = catalysts[group] ?? 0;
          const prog = progress[group] ?? 0;
          return (
            <div key={group} className="essence-row">
              <span className="essence-name">{catalystLabel(group)}</span>
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
