import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  ABILITY_FRENZY_EFFECT_ID,
  abilityCooldownMs,
  abilityDef,
  abilityRankNumber,
  abilityRankNumeral,
  equippedForSlot,
  guardEffectIdForSlot,
  recoveryEffectIdForSlot,
  type AbilityDef,
  type AbilitySlot,
} from "@mmo-idle/shared";
import {
  abilityCastAtom,
  abilityFiredAtAtom,
  abilityCooldownStartedAtAtom,
  activeBuffsAtom,
  equippedAbilitiesAtom,
  playerTierAtom,
} from "./atoms";
import { GameIcon } from "../ui/GameIcon";
import { abilityIconSource } from "../ui/abilityIcons";
import { useIsMobile } from "./useIsMobile";
import { HudDock } from "./primitives";
import "./hud.css";

const ICON_SIZE = 46;
const SLOT_GAP = 10;
/** How long the just-fired flash plays after a fire. */
const PULSE_MS = 650;

/** Placeholder slot styling — colored shapes + a glyph, in the spirit of BuffBar.
 *  Swap `glyph` for real icon textures later without touching the layout. */
const SLOT_META: Record<AbilitySlot, { color: string; accent: string; glyph: string; label: string }> = {
  technique: { color: "#c9532f", accent: "#ff9a5a", glyph: "⚔", label: "Technique" },
  guard: { color: "#3866b0", accent: "#7fb2ff", glyph: "🛡", label: "Guard" },
};

/** Order slots so Technique sits left of Guard. */
const SLOT_ORDER: AbilitySlot[] = ["technique", "guard"];

interface SlotStatus {
  /** Fraction of the cooldown still REMAINING (0 = ready), drives the dark sweep. */
  remainingFrac: number;
  /** Brief flash right after the ability fires. */
  justFired: boolean;
  /** Guard boon is currently active (its buff is up), or a cast is winding up. */
  active: boolean;
}

type DesktopAbilityState = "cooling" | "active" | "triggered" | "ready";

function computeStatus(
  cooldownStartedAt: number,
  firedAt: number,
  cooldownMs: number,
  now: number,
  active: boolean,
): SlotStatus {
  let remainingFrac = 0;
  if (!active && cooldownStartedAt > 0 && cooldownMs > 0) {
    const elapsed = now - cooldownStartedAt;
    if (elapsed < cooldownMs) remainingFrac = 1 - elapsed / cooldownMs;
  }
  const justFired = firedAt > 0 && now - firedAt < PULSE_MS;
  return { remainingFrac, justFired, active };
}

/**
 * A casted Technique shows its WIND-UP in the same sweep the cooldown uses, but
 * filling instead of draining — the tile reads "something is happening now"
 * rather than "wait". The in-world cast bar over the player is the primary tell;
 * this keeps the HUD honest about which of two Techniques is mid-cast.
 */
function castStatus(startedAt: number, castMs: number, now: number): SlotStatus {
  const elapsed = Math.max(0, now - startedAt);
  const progress = castMs > 0 ? Math.min(1, elapsed / castMs) : 1;
  return { remainingFrac: 1 - progress, justFired: false, active: true };
}

function AbilityIcon({ ability, status }: { ability: AbilityDef; status: SlotStatus }) {
  const meta = SLOT_META[ability.slot];
  const icon = abilityIconSource(ability);
  // The rank numeral rides the tile because it is the same learned ability the
  // whole way up — a player needs to see that Sweep got deeper, not go looking
  // for a second Sweep.
  const rank = abilityRankNumeral(abilityRankNumber(ability, useAtomValue(playerTierAtom)));
  const remainingPct = Math.max(0, Math.min(100, status.remainingFrac * 100));
  const cooling = remainingPct > 0;
  const glowClass = status.justFired
    ? " ability-icon--fired"
    : status.active
      ? " ability-icon--active"
      : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ position: "relative", width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0 }}>
        <div
          className={`ability-icon${glowClass}`}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 6,
            background: `linear-gradient(150deg, ${meta.accent}, ${meta.color})`,
            border: "1.5px solid rgba(255,255,255,0.22)",
            boxShadow: status.active
              ? `0 0 14px ${meta.accent}cc, 0 0 3px rgba(0,0,0,0.7)`
              : `0 0 8px ${meta.color}88, 0 0 3px rgba(0,0,0,0.7)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            lineHeight: 1,
            filter: cooling ? "saturate(0.7) brightness(0.85)" : undefined,
          }}
        >
          <GameIcon
            source={icon}
            size={44}
            fit="cover"
            fallback={<span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{meta.glyph}</span>}
            style={{ borderRadius: 5 }}
            decorative
          />
          {/* Cooldown sweep: darkens the REMAINING fraction, shrinking clockwise to ready. */}
          {cooling && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: `conic-gradient(from -90deg, rgba(0,0,0,0.62) ${remainingPct}%, transparent ${remainingPct}%)`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Slot badge remains readable over either artwork or the fallback glyph. */}
        <span
          style={{
            position: "absolute",
            top: -3,
            left: -3,
            minWidth: 14,
            height: 14,
            padding: "0 3px",
            borderRadius: 7,
            background: "rgba(0,0,0,0.78)",
            border: `1px solid ${meta.accent}`,
            fontSize: 10,
            fontWeight: "bold",
            fontFamily: "monospace",
            color: meta.accent,
            textAlign: "center",
            lineHeight: "13px",
            zIndex: 2,
          }}
        >
          {ability.slot === "technique" ? "T" : "G"}
        </span>
      </div>

      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          color: meta.accent,
          textShadow: "1px 1px 0 #000",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {ability.name} {rank}
      </span>
    </div>
  );
}

interface DesktopAbilitySlotProps {
  ability: AbilityDef;
  status: SlotStatus;
  /** Reserved for real activation bindings; omitted while abilities remain automatic. */
  keyHint?: string;
}

function DesktopAbilitySlot({
  ability,
  status,
  keyHint,
}: DesktopAbilitySlotProps) {
  const meta = SLOT_META[ability.slot];
  const icon = abilityIconSource(ability);
  const playerTier = useAtomValue(playerTierAtom);
  const rank = abilityRankNumeral(abilityRankNumber(ability, playerTier));
  const remainingPct = Math.max(0, Math.min(100, status.remainingFrac * 100));
  const remainingSeconds = Math.ceil(
    (status.remainingFrac * abilityCooldownMs(ability, playerTier)) / 1000,
  );
  const cooling = remainingPct > 0;
  const state: DesktopAbilityState = status.justFired
    ? "triggered"
    : status.active
      ? "active"
      : cooling
        ? "cooling"
        : "ready";
  const tooltip = `${meta.label}: ${ability.name} ${rank} — ${
    state === "cooling" ? `cooling, ${remainingSeconds}s remaining` : state
  }`;
  return (
    <div
      className={`combat-ability-slot combat-ability-slot--${ability.slot} combat-ability-slot--${state}`}
      data-ability-icon={ability.icon ?? ability.id}
      data-ability-state={state}
      role="listitem"
      aria-label={tooltip}
      title={tooltip}
    >
      <div className="combat-ability-slot__icon">
        <GameIcon
          source={icon}
          size={44}
          fallback={<span className="combat-ability-slot__glyph">{meta.glyph}</span>}
          className="combat-ability-slot__art"
          decorative
        />
        {cooling && (
          <div
            className="combat-ability-slot__cooldown-sweep"
            style={{
              background: `conic-gradient(from -90deg, rgba(0,0,0,0.74) ${remainingPct}%, transparent ${remainingPct}%)`,
            }}
          />
        )}
        {cooling && <span className="combat-ability-slot__cooldown-time">{remainingSeconds}</span>}
        {keyHint && (
          <span className="combat-ability-slot__key-hint" aria-hidden="true">
            {keyHint}
          </span>
        )}
      </div>

      <div className="combat-ability-slot__name">{ability.name} {rank}</div>
    </div>
  );
}

export function AbilityBar() {
  const isMobile = useIsMobile();
  const equipped = useAtomValue(equippedAbilitiesAtom);
  const firedAt = useAtomValue(abilityFiredAtAtom);
  const cooldownStartedAt = useAtomValue(abilityCooldownStartedAtAtom);
  const buffs = useAtomValue(activeBuffsAtom);
  const cast = useAtomValue(abilityCastAtom);
  const playerTier = useAtomValue(playerTierAtom);

  // Tick a wall clock so cooldown sweeps / flashes animate. The bar only mounts
  // content when an ability is equipped, so this stays cheap.
  const [now, setNow] = useState(() => Date.now());

  // Guard buffs are per-slot ids, so the tile for guard slot N lights up only
  // when THAT slot's buff is up. A Recovery guard has no DR buff of its own, so
  // it keys off its own per-slot Recovery effect id.
  const activeBuffIds = new Set(buffs.map((b) => b.id));

  // Ordered so every Technique sits left of every Guard.
  const equippedDefs = SLOT_ORDER.flatMap((slot) =>
    equippedForSlot(equipped, slot).map((id, index) => ({
      ability: abilityDef(id),
      slot,
      index,
    })),
  ).filter((e): e is { ability: AbilityDef; slot: AbilitySlot; index: number } => !!e.ability);

  const hasAny = equippedDefs.length > 0;

  useEffect(() => {
    if (!hasAny) return;
    const id = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(id);
  }, [hasAny]);

  if (!hasAny) return null;

  const slots: { ability: AbilityDef; status: SlotStatus }[] = equippedDefs.map(
    ({ ability, slot, index }) => {
      if (cast?.abilityId === ability.id) {
        return { ability, status: castStatus(cast.startedAt, cast.castMs, now) };
      }
      const active =
        slot === "guard"
          ? activeBuffIds.has(guardEffectIdForSlot(index)) ||
            activeBuffIds.has(recoveryEffectIdForSlot(index)) ||
            activeBuffIds.has("ability-bramble")
          : activeBuffIds.has(ABILITY_FRENZY_EFFECT_ID) &&
            ability.shape === "instant";
      return {
        ability,
        status: computeStatus(
          cooldownStartedAt[ability.id] ?? 0,
          firedAt[ability.id] ?? 0,
          abilityCooldownMs(ability, playerTier),
          now,
          active,
        ),
      };
    },
  );

  if (isMobile) return (
    <div
      className="ability-bar-root"
      data-ui-unlock-system="abilityDock"
      style={{
        position: "absolute",
        bottom: 16,
        left: 14,
        display: "flex",
        flexDirection: "row",
        gap: SLOT_GAP,
        alignItems: "flex-end",
        pointerEvents: "none",
        zIndex: 12,
      }}
    >
      {slots.map(({ ability, status }) => (
        <AbilityIcon key={ability.id} ability={ability} status={status} />
      ))}
    </div>
  );

  return (
    <HudDock
      className="desktop-hud desktop-combat-abilities"
      data-ui-unlock-system="abilityDock"
      role="group"
      aria-label="Automatic abilities"
    >
      <div className="desktop-combat-abilities__layout" role="list">
        {slots.map(({ ability, status }) => (
          <DesktopAbilitySlot key={ability.id} ability={ability} status={status} />
        ))}
      </div>
    </HudDock>
  );
}
