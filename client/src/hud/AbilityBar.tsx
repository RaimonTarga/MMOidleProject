import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  ABILITY_GUARD_EFFECT_ID,
  ABILITY_SECOND_WIND_EFFECT_ID,
  abilityDef,
  type AbilityDef,
  type AbilitySlot,
} from "@mmo-idle/shared";
import {
  abilityFiredAtAtom,
  abilityCooldownStartedAtAtom,
  activeBuffsAtom,
  equippedAbilitiesAtom,
} from "./atoms";
import { UIIcon } from "../ui/UIIcon";
import { abilityIconFrame } from "../ui/abilityIcons";
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
  /** Guard boon is currently active (its buff is up). */
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

function AbilityIcon({ ability, status }: { ability: AbilityDef; status: SlotStatus }) {
  const meta = SLOT_META[ability.slot];
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
          <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{meta.glyph}</span>
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

        {/* Slot badge (placeholder until real icons land). */}
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
        {ability.name}
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
  const iconFrame = abilityIconFrame(ability);
  const remainingPct = Math.max(0, Math.min(100, status.remainingFrac * 100));
  const remainingSeconds = Math.ceil((status.remainingFrac * ability.cooldownMs) / 1000);
  const cooling = remainingPct > 0;
  const state: DesktopAbilityState = status.justFired
    ? "triggered"
    : status.active
      ? "active"
      : cooling
        ? "cooling"
        : "ready";
  const stateLabel = state === "cooling"
    ? "COOLING"
    : state === "triggered"
      ? "FIRED"
      : state === "active"
        ? "ACTIVE"
        : null;
  const tooltip = `${meta.label}: ${ability.name} — ${
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
        {/* The glyph remains as a fallback while the atlas loads or for abilities
            that do not have an icon frame yet. */}
        <span className="combat-ability-slot__glyph" aria-hidden>{meta.glyph}</span>
        <UIIcon
          frameName={iconFrame}
          size={44}
          className="combat-ability-slot__art"
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
        {stateLabel && (
          <span className="combat-ability-slot__state" aria-hidden="true">
            {stateLabel}
          </span>
        )}
        {keyHint && (
          <span className="combat-ability-slot__key-hint" aria-hidden="true">
            {keyHint}
          </span>
        )}
      </div>

      <div className="combat-ability-slot__name">{ability.name}</div>
    </div>
  );
}

export function AbilityBar() {
  const isMobile = useIsMobile();
  const equipped = useAtomValue(equippedAbilitiesAtom);
  const firedAt = useAtomValue(abilityFiredAtAtom);
  const cooldownStartedAt = useAtomValue(abilityCooldownStartedAtAtom);
  const buffs = useAtomValue(activeBuffsAtom);

  // Tick a wall clock so cooldown sweeps / flashes animate. The bar only mounts
  // content when an ability is equipped, so this stays cheap.
  const [now, setNow] = useState(() => Date.now());
  const guardActive = buffs.some(
    (b) => b.id === ABILITY_GUARD_EFFECT_ID || b.id === ABILITY_SECOND_WIND_EFFECT_ID,
  );

  const technique = abilityDef(equipped.technique);
  const guard = abilityDef(equipped.guard);
  const hasAny = !!technique || !!guard;

  useEffect(() => {
    if (!hasAny) return;
    const id = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(id);
  }, [hasAny]);

  if (!hasAny) return null;

  const slots: { ability: AbilityDef; status: SlotStatus }[] = [];
  for (const slot of SLOT_ORDER) {
    const ability = slot === "technique" ? technique : guard;
    if (!ability) continue;
    const active = slot === "guard" && guardActive;
    slots.push({
      ability,
      status: computeStatus(
        cooldownStartedAt[slot],
        firedAt[slot],
        ability.cooldownMs,
        now,
        active,
      ),
    });
  }

  if (isMobile) return (
    <div
      className="ability-bar-root"
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
