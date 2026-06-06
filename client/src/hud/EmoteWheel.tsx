import { useAtomValue } from "jotai";
import {
  EMOTE_ASSETS,
  EMOTE_WHEEL_SLOTS,
  type EmoteWheelDirection,
} from "@mmo-idle/shared";
import { emoteWheelAtom } from "./atoms";

const SLOT_STYLE: Record<
  EmoteWheelDirection,
  { gridArea: string; justifySelf: string; alignSelf: string }
> = {
  up: { gridArea: "up", justifySelf: "center", alignSelf: "end" },
  down: { gridArea: "down", justifySelf: "center", alignSelf: "start" },
  left: { gridArea: "left", justifySelf: "end", alignSelf: "center" },
  right: { gridArea: "right", justifySelf: "start", alignSelf: "center" },
};

function Slot({
  direction,
  active,
}: {
  direction: EmoteWheelDirection;
  active: boolean;
}) {
  const emoteId = EMOTE_WHEEL_SLOTS[direction];
  const pos = SLOT_STYLE[direction];

  return (
    <div
      style={{
        gridArea: pos.gridArea,
        justifySelf: pos.justifySelf,
        alignSelf: pos.alignSelf,
        width: 72,
        height: 72,
        borderRadius: 12,
        border: active
          ? "2px solid rgba(180, 220, 255, 0.95)"
          : "1px solid rgba(80, 90, 120, 0.55)",
        background: active
          ? "rgba(40, 70, 120, 0.82)"
          : "rgba(12, 16, 28, 0.72)",
        boxShadow: active ? "0 0 18px rgba(100, 160, 255, 0.45)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        opacity: emoteId ? 1 : 0.35,
        transition: "border-color 120ms, background 120ms, box-shadow 120ms",
      }}
    >
      {emoteId ? (
        <img
          src={EMOTE_ASSETS[emoteId]}
          alt={emoteId}
          draggable={false}
          style={{ width: 44, height: 44, objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: 22, color: "rgba(160, 170, 190, 0.5)" }}>
          ·
        </span>
      )}
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.08em",
          color: "rgba(190, 200, 220, 0.75)",
          textTransform: "uppercase",
        }}
      >
        {direction}
      </span>
    </div>
  );
}

export function EmoteWheel() {
  const wheel = useAtomValue(emoteWheelAtom);
  if (!wheel.visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateAreas: `
            ". up ."
            "left hub right"
            ". down ."
          `,
          gridTemplateColumns: "80px 80px 80px",
          gridTemplateRows: "80px 80px 80px",
          gap: 8,
          padding: 16,
          borderRadius: 18,
          background: "rgba(6, 8, 18, 0.55)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            gridArea: "hub",
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "1px solid rgba(90, 100, 130, 0.45)",
            background: "rgba(20, 24, 40, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "rgba(170, 180, 200, 0.7)",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          EMOTE
        </div>
        {(["up", "down", "left", "right"] as const).map((dir) => (
          <Slot key={dir} direction={dir} active={wheel.highlight === dir} />
        ))}
      </div>
    </div>
  );
}
