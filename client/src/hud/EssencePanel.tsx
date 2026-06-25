import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { ESSENCE_TYPES, ESSENCE_COLORS, ESSENCE_LABELS } from "@mmo-idle/shared";
import type { EssenceType } from "@mmo-idle/shared";
import { essencesAtom } from "./atoms";
import "./essence.css";

export function EssencePanel() {
  const essences = useAtomValue(essencesAtom);

  // Per-type flash counter. Incrementing triggers a flash; odd → flash-a, even (>0) → flash-b.
  // Alternating the animation name forces the browser to restart it even mid-animation.
  const [flashKeys, setFlashKeys] = useState<Record<EssenceType, number>>(
    () => Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
  );

  const prevRef = useRef<Record<EssenceType, number>>(
    Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
  );

  useEffect(() => {
    const prev = prevRef.current;
    const gained = ESSENCE_TYPES.filter((t) => (essences[t] ?? 0) > (prev[t] ?? 0));

    for (const t of ESSENCE_TYPES) prevRef.current[t] = essences[t] ?? 0;

    if (gained.length === 0) return;

    setFlashKeys((fk) => {
      const next = { ...fk };
      for (const t of gained) next[t] = (next[t] ?? 0) + 1;
      return next;
    });
  }, [essences]);

  return (
    <div className="sidebar-panel">
      <div className="panel-title">Essence</div>
      <div className="essence-list">
        {ESSENCE_TYPES.map((type) => {
          const key = flashKeys[type];
          const flashClass = key > 0
            ? ` essence-row--flash-${key % 2 === 1 ? "a" : "b"}`
            : "";
          return (
            <div
              key={type}
              className={`essence-row${flashClass}`}
              style={{ "--flash-color": ESSENCE_COLORS[type] + "44" } as React.CSSProperties}
            >
              <span className="essence-dot" style={{ background: ESSENCE_COLORS[type] }} />
              <span className="essence-name">
                {ESSENCE_LABELS[type]}
              </span>
              <span className="essence-value" style={{ color: ESSENCE_COLORS[type] }}>
                {essences[type] ?? 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
