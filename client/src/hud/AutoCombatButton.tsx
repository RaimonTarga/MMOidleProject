import { useAtomValue } from "jotai";
import { hudBus } from "../hudBus";
import { autoAtom, playerIdAtom } from "./atoms";
import "./hud.css";

export function AutoCombatButton() {
  const playerId = useAtomValue(playerIdAtom);
  const auto = useAtomValue(autoAtom);
  if (!playerId) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        pointerEvents: "auto",
      }}
    >
      <button
        className={`auto-btn${auto ? " active" : ""}`}
        style={{
          width: "auto",
          padding: "12px 36px",
          fontSize: 14,
          letterSpacing: "1.5px",
          marginTop: 0,
        }}
        onClick={() => hudBus.requestAutoToggle()}
        title="Toggle server-side auto combat"
      >
        AUTO COMBAT: {auto ? "ON" : "OFF"}
      </button>
    </div>
  );
}
