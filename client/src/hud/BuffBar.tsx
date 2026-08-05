import { useAtomValue } from "jotai";
import type { BuffCategory, PlayerBuff, BuffShape } from "@mmo-idle/shared";
import { activeBuffsAtom } from "./atoms";
import { GameIcon } from "../ui/GameIcon";
import { statusIconSource } from "../ui/conceptIcons";
import "../hud/hud.css";

const ICON_SIZE = 52;
const SLOT_GAP = 8;

const SHAPE_STYLE: Record<BuffShape, React.CSSProperties> = {
  square: {},
  circle: { borderRadius: "50%" },
  diamond: {
    borderRadius: 2,
    clipPath: "polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)",
  },
  "small-square": { borderRadius: 1 },
};

const CATEGORY_TONE: Record<BuffCategory, string> = {
  cadence: "#ff7043",
  cooldown: "#66aaff",
  energy: "#b56cff",
  "dot-poison": "#75d13b",
  "dot-fire": "#ff6633",
  "dot-frost": "#73d7ff",
  "dot-frozen": "#b9efff",
  weapon: "#ffad42",
  neutral: "#aaa4bc",
  summoner: "#d9b44a",
};

function displayTone(buff: PlayerBuff): string {
  return buff.color.toLowerCase() === "#888888"
    ? CATEGORY_TONE[buff.category]
    : buff.color;
}

function BuffIcon({ buff }: { buff: PlayerBuff }) {
  const shapeStyle = SHAPE_STYLE[buff.shape];
  const icon = statusIconSource(buff.iconKey);
  const hasArt = icon !== null;
  const tone = displayTone(buff);
  const catClass =
    buff.category === "neutral"
      ? "buff-icon"
      : `buff-icon buff-cat-${buff.category}`;
  const hasDuration = buff.durationPct >= 0;
  const showStacks = buff.stacks > 1 || (buff.id === "debuff-dot" && buff.stacks > 0);

  // Sweep overlay: darkened area sweeps clockwise from the top as the buff elapses.
  // At 100% remaining → 0% dark (fully visible); at 0% remaining → 100% dark.
  const elapsed = hasDuration
    ? Math.max(0, Math.min(100, 100 - buff.durationPct))
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      {/* Icon with optional clock-sweep overlay */}
      <div
        style={{
          position: "relative",
          width: ICON_SIZE,
          height: ICON_SIZE,
          flexShrink: 0,
        }}
      >
        <div
          className={catClass}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: hasArt ? "transparent" : tone,
            border: hasArt ? "none" : "1.5px solid rgba(255,255,255,0.22)",
            borderRadius: hasArt ? 7 : shapeStyle.borderRadius,
            clipPath: hasArt ? undefined : shapeStyle.clipPath,
            boxShadow: `0 0 8px ${tone}66, 0 0 3px rgba(0,0,0,0.7)`,
            overflow: "hidden",
          }}
        >
          {/* Clockface darkening overlay — grows clockwise from the top as time elapses */}
          <GameIcon
            source={icon}
            size={ICON_SIZE - 4}
            fit="cover"
            fallback={null}
            style={{
              position: "absolute",
              inset: 2,
              borderRadius: 6,
            }}
            decorative
          />
          {hasDuration && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `conic-gradient(from -90deg, rgba(0,0,0,0.68) ${elapsed}%, transparent ${elapsed}%)`,
                borderRadius: "inherit",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Stack count badge: outside clipped shapes so diamond icons do not crop it. */}
        {showStacks && (
          <span
            style={{
              position: "absolute",
              bottom: -1,
              right: -3,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.78)",
              border: "1px solid rgba(255,255,255,0.55)",
              fontSize: 12,
              fontWeight: "bold",
              fontFamily: "monospace",
              color: "#fff",
              textAlign: "center",
              textShadow: "1px 1px 0 #000",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            {buff.stacks}
          </span>
        )}
      </div>

      {/* Short label */}
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          color: tone,
          textShadow: "1px 1px 0 #000",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {buff.label}
      </span>
    </div>
  );
}

export function BuffBar() {
  const buffs = useAtomValue(activeBuffsAtom);

  if (buffs.length === 0) return null;

  return (
    <div
      className="buff-bar-root"
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        display: "flex",
        flexDirection: "row",
        gap: SLOT_GAP,
        alignItems: "flex-start",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {buffs.map((buff) => (
        <BuffIcon key={`${buff.instanceKey ?? buff.iconKey}:${buff.id}`} buff={buff} />
      ))}
    </div>
  );
}
