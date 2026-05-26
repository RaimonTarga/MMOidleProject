import { useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { ESSENCE_TYPES, ESSENCE_COLORS } from "@mmo-idle/shared";
import { essencesAtom } from "./atoms";
import "./essence.css";

export function EssencePanel() {
  const essences = useAtomValue(essencesAtom);
  const [flashType, setFlashType] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const type = (e as CustomEvent<string>).detail;
      if (timerRef.current) clearTimeout(timerRef.current);
      setFlashType(type);
      timerRef.current = setTimeout(() => setFlashType(null), 1100);
    };
    window.addEventListener("hud:essenceGained", handler);
    return () => window.removeEventListener("hud:essenceGained", handler);
  }, []);

  return (
    <div className="sidebar-panel">
      <div className="panel-title">Essence</div>
      <div className="essence-list">
        {ESSENCE_TYPES.map((type) => (
          <div
            key={type}
            className={`essence-row${flashType === type ? " essence-row--flash" : ""}`}
            style={
              flashType === type
                ? ({
                    "--flash-color": ESSENCE_COLORS[type] + "30",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span
              className="essence-dot"
              style={{ background: ESSENCE_COLORS[type] }}
            />
            <span className="essence-name">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            <span
              className="essence-value"
              style={{ color: ESSENCE_COLORS[type] }}
            >
              {essences[type] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
