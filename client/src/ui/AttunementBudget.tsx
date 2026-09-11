import { runicPointBreakdown, type RunicPointLoadout } from "@mmo-idle/shared";
import { HelpTooltip } from "../hud/primitives";
import "./attunementPanel.css";

const CATEGORIES = [
  ["abilities", "Abilities"], ["stances", "Stances"], ["logic", "Logic"], ["rites", "Rites"], ["available", "Available"],
] as const;

/** Display-only segments; every reservation comes from the shared calculator. */
export function AttunementBudget({ loadout, budget }: { loadout: RunicPointLoadout; budget: number }) {
  const parts = runicPointBreakdown(loadout);
  const values = { ...parts, available: Math.max(0, budget - parts.total) };
  // Preserved over-budget saves show all reservations proportionally, plus an
  // explicit overage. Never truncate a category or invent negative free space.
  const scale = Math.max(1, budget, parts.total);
  return <header className="attunement-budget">
    <div className="attunement-budget__heading">
      <strong>Runic Points</strong><span className={parts.total > budget ? "attunement-over" : ""}>{parts.total} <span className="attunement-muted">/ {budget}</span></span>
    </div>
    <div className="attunement-budget__meter" role="img" aria-label={`Runic Points: ${parts.total} of ${budget} reserved. ${CATEGORIES.map(([key, label]) => `${label} ${values[key]}`).join(", ")}.${parts.total > budget ? ` Over budget by ${parts.total - budget}.` : ""}`}>
      {CATEGORIES.map(([key, label]) => values[key] > 0 && <span key={key} className={`attunement-budget__segment rp-${key}`} style={{ width: `${values[key] / scale * 100}%` }} title={`${label}: ${values[key]} RP`} />)}
    </div>
    <div className="attunement-budget__parts">
      {CATEGORIES.map(([key, label]) => <HelpTooltip key={key} tip={`${label}: ${values[key]} Runic Points`}>
        <span className="attunement-budget__legend"><i className={`rp-${key}`} aria-hidden="true" />{label} <b>{values[key]}</b></span>
      </HelpTooltip>)}
    </div>
    {parts.total > budget && <p className="attunement-over">Over budget by {parts.total - budget} RP. Your saved setup remains active; you can unattune gradually.</p>}
  </header>;
}
