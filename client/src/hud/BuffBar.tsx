import { Fragment, useMemo, useRef } from "react";
import { useAtomValue } from "jotai";
import type { BuffCategory, PlayerBuff, BuffShape } from "@mmo-idle/shared";
import { activeBuffsAtom, lastCleanseAtAtom } from "./atoms";
import { GameIcon } from "../ui/GameIcon";
import { statusIconSource } from "../ui/conceptIcons";
import { TooltipCard, useStatusStrip, type StripTileProps } from "./primitives";
import { buffTooltipContent } from "./statusTooltips";
import { useIsMobile } from "./useIsMobile";
import {
  CRITICAL_BUFF_IDS,
  SURGE_DEBUFF_IDS,
  buffKey,
  orderBuffs,
  useBuffTransitions,
  type BuffGhost,
  type BuffTileFx,
} from "./buffTransitions";
import "../hud/hud.css";
import "./statusFeedback.css";

const ICON_SIZE = 52;
/** Critical debuffs sit a size up so they are the first thing the eye lands on. */
const CRITICAL_ICON_SIZE = 62;
/** Stack count at which a surge debuff's resting glow is at full heat. */
const SURGE_FULL_STACKS = 10;
/** Shatter shards, as outward directions in degrees. */
const SHARD_ANGLES = [0, 60, 120, 180, 240, 300];
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

type EndReason = "ended" | "cleansed";

interface BuffIconProps {
  buff: PlayerBuff;
  interactive: boolean;
  /** Hover/focus handlers from the strip; the strip owns the tooltip. */
  stripProps?: StripTileProps | Record<string, never>;
  /** Present for a tile that has already left the list and is animating out. */
  ghost?: BuffGhost;
  onGhostDone?: () => void;
  /**
   * The buff has ended but the bar is frozen for inspection, so the tile keeps
   * its slot (and stays hoverable) in a spent state. `burst` replays the cleanse
   * shatter on it when it was stripped rather than expiring.
   */
  ended?: { reason: EndReason; burst?: number };
  fx?: BuffTileFx;
}

function BuffIcon({ buff, interactive, stripProps, ghost, onGhostDone, ended, fx }: BuffIconProps) {
  // Only on a pointer device. There is no hover on touch, so taking pointer
  // events there would buy nothing and cost a tap into the world wherever a buff
  // happens to be sitting. The tooltip itself belongs to the bar (see
  // `useStatusStrip`), so it survives this tile changing, moving or ending.
  const live = interactive && !ghost;
  const critical = CRITICAL_BUFF_IDS.has(buff.id);
  const size = critical ? CRITICAL_ICON_SIZE : ICON_SIZE;
  const shapeStyle = SHAPE_STYLE[buff.shape];
  const icon = statusIconSource(buff.iconKey);
  const hasArt = icon !== null;
  const tone = displayTone(buff);
  const catClass =
    buff.category === "neutral"
      ? "buff-icon"
      : `buff-icon buff-cat-${buff.category}`;
  const hasDuration = buff.durationPct >= 0;
  // A countdown's last unit is its most important state, so a buff that spends
  // charges opts in to showing "1" rather than going blank a hit early.
  const showStacks =
    buff.stacks > 1 ||
    (buff.showSingleStack === true && buff.stacks > 0) ||
    (buff.id === "debuff-dot" && buff.stacks > 0);
  // A surge debuff's resting glow deepens with its count, so a high stack reads
  // as hot at a glance even between gains.
  const heat = SURGE_DEBUFF_IDS.has(buff.id)
    ? Math.min(1, buff.stacks / SURGE_FULL_STACKS)
    : 0;
  const surging = fx !== undefined && fx.surgeN > 0;

  // Sweep overlay: darkened area sweeps clockwise from the top as the buff elapses.
  // At 100% remaining → 0% dark (fully visible); at 0% remaining → 100% dark.
  const elapsed = hasDuration
    ? Math.max(0, Math.min(100, 100 - buff.durationPct))
    : 0;

  const tileClass = [
    "buff-tile",
    critical ? "buff-tile--critical" : "",
    heat > 0 ? "buff-tile--heated" : "",
    ghost ? `buff-tile--${ghost.kind}` : "",
    ended ? `buff-tile--ended buff-tile--ended-${ended.reason}` : "",
  ].filter(Boolean).join(" ");
  const shattering = ghost?.kind === "shatter" || ended?.burst !== undefined;

  return (
    <div
      // The bar itself stays click-through so empty HUD space never eats a click
      // into the world; only this tile — the actual hover target — takes pointer
      // events back. Its bounding box is the icon plus its label, nothing more.
      className={tileClass}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: live ? "auto" : "none",
        ["--buff-tone" as string]: tone,
        ["--buff-heat" as string]: heat,
      }}
      tabIndex={live ? 0 : undefined}
      role={ghost ? undefined : "img"}
      aria-hidden={ghost ? true : undefined}
      aria-label={
        ghost
          ? undefined
          : `${buff.label}${critical ? ", critical" : ""}${showStacks ? `, ${buff.stacks} stacks` : ""}${ended ? `, ${ended.reason}` : ""}`
      }
      onAnimationEnd={(e) => {
        if (ghost && e.target === e.currentTarget) onGhostDone?.();
      }}
      {...(ghost ? {} : stripProps)}
    >
      {/* Icon with optional clock-sweep overlay */}
      <div
        className="buff-tile__frame"
        style={{
          position: "relative",
          width: size,
          height: size,
          flexShrink: 0,
        }}
      >
        {critical && <span className="buff-critical-halo" aria-hidden="true" />}
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
            size={size - 4}
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

        {/* One-shot overlays. Each is keyed by its counter, so a fresh gain or
            strip remounts it and the animation plays again from the start. */}
        {surging && (
          <span
            key={`surge-${fx.surgeN}`}
            className={`buff-surge buff-surge--${fx.surgeKind}`}
            aria-hidden="true"
          />
        )}
        {fx !== undefined && fx.burstN > 0 && (
          <span key={`burst-${fx.burstN}`} className="buff-cleanse-burst" aria-hidden="true" />
        )}
        {shattering && (
          <Fragment key={ended?.burst ?? "ghost"}>
            <span className="buff-cleanse-burst buff-cleanse-burst--final" aria-hidden="true" />
            {SHARD_ANGLES.map((deg) => (
              <span
                key={deg}
                className="buff-shard"
                style={{ ["--shard-angle" as string]: `${deg}deg` }}
                aria-hidden="true"
              />
            ))}
          </Fragment>
        )}

        {/* Stack count badge: outside clipped shapes so diamond icons do not crop it. */}
        {showStacks && (
          <span
            key={surging ? `badge-${fx.surgeN}` : "badge"}
            className={surging ? `buff-stack-badge buff-stack-badge--${fx.surgeKind}` : "buff-stack-badge"}
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
              zIndex: 3,
            }}
          >
            {buff.stacks}
          </span>
        )}
      </div>

      {/* Short label. A critical one sits on a dark pill so it stays legible
          over pale ground — it is the one label that must never be missed. */}
      <span
        className={critical ? "buff-critical-label" : undefined}
        style={{
          fontSize: critical ? 11 : 10,
          fontWeight: critical ? "bold" : undefined,
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
  const lastCleanseAt = useAtomValue(lastCleanseAtAtom);
  const isMobile = useIsMobile();
  const ordered = useMemo(() => orderBuffs(buffs), [buffs]);
  const { ghosts, fx, dropGhost } = useBuffTransitions(ordered, lastCleanseAt);

  // Why each recently-gone buff left, remembered past its exit animation: a tile
  // held open for inspection has to say "Cleansed" long after the shatter itself
  // has finished playing.
  const endReasons = useRef(new Map<string, EndReason>());
  for (const ghost of ghosts) {
    endReasons.current.set(ghost.key, ghost.kind === "shatter" ? "cleansed" : "ended");
  }

  const strip = useStatusStrip({
    items: ordered,
    keyOf: buffKey,
    enabled: !isMobile,
    renderTip: ({ key, item, ended }) => {
      // Rebuilt every render: the CURRENT block is the reason the player
      // hovered, and a stale stack count would be worse than no card at all.
      const content = buffTooltipContent(item);
      if (ended) {
        content.ended = endReasons.current.get(key) === "cleansed"
          ? { label: "Cleansed", note: "stripped off you", tone: "cleansed" }
          : { label: "Ended", note: "no longer on you" };
      }
      return <TooltipCard content={content} />;
    },
  });

  if (!strip.frozen) {
    // Thawed: a reason is only needed while its ghost or held tile is showing.
    const ghostKeys = new Set(ghosts.map((g) => g.key));
    for (const key of [...endReasons.current.keys()]) {
      if (!ghostKeys.has(key)) endReasons.current.delete(key);
    }
  }

  if (strip.entries.length === 0 && ghosts.length === 0) return null;

  const tiles: {
    key: string;
    buff: PlayerBuff;
    ghost?: BuffGhost;
    ended?: { reason: EndReason; burst?: number };
  }[] = strip.entries.map(({ key, item, ended }) => {
    if (!ended) return { key, buff: item };
    // A shatter still playing for this key replays on the held tile, keyed by its
    // start so an expiry upgraded to a cleanse restarts it.
    const shatter = ghosts.find((g) => g.key === key && g.kind === "shatter");
    return {
      key,
      buff: item,
      ended: { reason: endReasons.current.get(key) ?? "ended", burst: shatter?.at },
    };
  });
  // While frozen every departed buff already holds its slot as an ended tile,
  // so its exit ghost would only draw it a second time.
  if (!strip.frozen) {
    // Ghosts hold the slot they left from until their exit finishes, so the row
    // closes the gap after the fade instead of jumping under it.
    for (const ghost of [...ghosts].sort((a, b) => a.index - b.index)) {
      tiles.splice(Math.min(ghost.index, tiles.length), 0, {
        key: `ghost:${ghost.key}@${ghost.at}`,
        buff: ghost.buff,
        ghost,
      });
    }
  }

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
      {tiles.map(({ key, buff, ghost, ended }) => (
        <BuffIcon
          key={key}
          buff={buff}
          interactive={!isMobile}
          stripProps={ghost ? undefined : strip.tileProps(key)}
          ghost={ghost}
          onGhostDone={ghost ? () => dropGhost(ghost.key, ghost.at) : undefined}
          ended={ended}
          fx={ghost || ended ? undefined : fx.get(key)}
        />
      ))}
      {strip.node}
    </div>
  );
}
