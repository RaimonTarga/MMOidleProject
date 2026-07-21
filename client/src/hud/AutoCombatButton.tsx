import { useAtomValue } from "jotai";
import { hudBus } from "../hudBus";
import { autoAtom, playerIdAtom } from "./atoms";
import "./hud.css";

export function AutoCombatButton() {
  const playerId = useAtomValue(playerIdAtom);
  const auto = useAtomValue(autoAtom);
  if (!playerId) return null;

  return (
    <div className="combat-auto-root">
      <button
        type="button"
        className={`combat-auto-button combat-auto-button--${auto ? "on" : "off"}`}
        aria-pressed={auto}
        onClick={() => hudBus.requestAutoToggle()}
        title="Toggle server-side auto combat"
      >
        <span className="combat-auto-button__label">Auto Combat</span>
        <span className="combat-auto-button__state">{auto ? "ON" : "OFF"}</span>
      </button>
    </div>
  );
}
