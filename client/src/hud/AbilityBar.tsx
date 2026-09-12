import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  ABILITY_FRENZY_EFFECT_ID,
  NO_STANCE_ID,
  STANCE_SWITCH_COOLDOWN_MS,
  abilityCooldownMs,
  abilityDef,
  abilityRankNumber,
  abilityRankNumeral,
  attunedForFamily,
  guardEffectIdForAbility,
  recoveryEffectIdForAbility,
  stanceDef,
  type AbilityDef,
  type AbilityFamily,
} from "@mmo-idle/shared";
import {
  abilityCastAtom,
  abilityFiredAtAtom,
  abilityCooldownStartedAtAtom,
  activeBuffsAtom,
  activeStanceAtom,
  attackTargetIdAtom,
  attunedAbilitiesAtom,
  attunedStancesAtom,
  autoAtom,
  manualStanceOverrideAtom,
  playerTierAtom,
  queuedAbilityIdsAtom,
  runesEquippedAtom,
  stanceCooldownStartedAtAtom,
} from "./atoms";
import { GameIcon } from "../ui/GameIcon";
import { abilityIconSource } from "../ui/abilityIcons";
import { useIsMobile } from "./useIsMobile";
import { HudDock, TooltipCard, useHoverTooltip } from "./primitives";
import { useAbilityContext } from "../ui/describe/useAbilityContext";
import {
  abilityAccessibleLabel,
  abilityTooltipContent,
  cooldownRemainingMs,
  type AbilityRuntime,
} from "./statusTooltips";
import "./hud.css";
import { abilityTiming } from "../ui/describe/abilityTiming";
import { stanceIconSource } from "../ui/conceptIcons";
import { hudBus } from "../hudBus";
import {
  ABILITY_HOTKEY_ACTIONS,
  STANCE_HOTKEY_ACTIONS,
  bindingToLabel,
  keybindsAtom,
} from "../settings/keybinds";

const ICON_SIZE = 46;
const SLOT_GAP = 10;
/** How long the just-fired flash plays after a fire. */
const PULSE_MS = 650;

/** Placeholder slot styling — colored shapes + a glyph, in the spirit of BuffBar.
 *  Swap `glyph` for real icon textures later without touching the layout. */
const SLOT_META: Record<AbilityFamily, { color: string; accent: string; glyph: string; label: string }> = {
  technique: { color: "#c9532f", accent: "#ff9a5a", glyph: "⚔", label: "Technique" },
  guard: { color: "#3866b0", accent: "#7fb2ff", glyph: "🛡", label: "Guard" },
};

/** Order slots so Technique sits left of Guard. */
const SLOT_ORDER: AbilityFamily[] = ["technique", "guard"];

interface SlotStatus {
  /** Fraction of the cooldown still REMAINING (0 = ready), drives the dark sweep. */
  remainingFrac: number;
  /** Brief flash right after the ability fires. */
  justFired: boolean;
  /** Guard boon is currently active (its buff is up), or a cast is winding up. */
  active: boolean;
  /** Wind-up left, in ms — present only while this slot is mid-cast. */
  castRemainingMs?: number;
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
  return {
    remainingFrac: 1 - progress,
    justFired: false,
    active: true,
    castRemainingMs: Math.max(0, castMs - elapsed),
  };
}

function AbilityIcon({
  ability,
  status,
  keyHint,
  queued,
  unavailable,
}: {
  ability: AbilityDef;
  status: SlotStatus;
  keyHint: string;
  queued: boolean;
  unavailable: boolean;
}) {
  const context = useAbilityContext();
  const timing = abilityTiming(ability, useAtomValue(attunedAbilitiesAtom), useAtomValue(runesEquippedAtom));
  const runtime: AbilityRuntime = {
    state: status.castRemainingMs !== undefined ? 'casting' : status.active ? 'active' : status.remainingFrac > 0 ? 'cooling' : 'ready',
    cooldownRemainingMs: cooldownRemainingMs(ability, context.playerTier, status.remainingFrac),
    castRemainingMs: status.castRemainingMs,
    runeTiming: timing.overrideText,
  };
  const { handlers, node } = useHoverTooltip(<TooltipCard content={abilityTooltipContent(ability, context, runtime)} />);
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
    <button
      type="button"
      aria-label={`${abilityAccessibleLabel(ability, context, runtime)}. Hotkey ${keyHint}${queued ? ". Queued; press again to cancel" : ""}`}
      onClick={() => hudBus.requestUseAbility(ability.id)}
      {...handlers}
      className={`mobile-combat-ability${queued ? " mobile-combat-ability--queued" : ""}${unavailable ? " mobile-combat-ability--unavailable" : ""}`}
      style={{
        pointerEvents: 'auto',
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
        <span className="combat-ability-slot__key-hint" aria-hidden="true">{keyHint}</span>
      </div>

      <span className="mobile-combat-ability__name" style={{ color: meta.accent }}>
        {ability.name} {rank}
      </span>
      {node}
    </button>
  );
}

interface DesktopAbilityFamilyProps {
  ability: AbilityDef;
  status: SlotStatus;
  keyHint?: string;
  queued: boolean;
  unavailable: boolean;
}

function DesktopAbilityFamily({
  ability,
  status,
  keyHint,
  queued,
  unavailable,
}: DesktopAbilityFamilyProps) {
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

  // The tile's visual state is a four-way including the just-fired flash, which
  // is a render cue rather than something the ability is DOING; the tooltip
  // collapses it back to the three states a player can act on.
  const runtime: AbilityRuntime = {
    state: status.castRemainingMs !== undefined
      ? "casting"
      : status.active
        ? "active"
        : cooling
          ? "cooling"
          : "ready",
    cooldownRemainingMs: cooldownRemainingMs(ability, playerTier, status.remainingFrac),
    castRemainingMs: status.castRemainingMs,
  };
  const abilityContext = useAbilityContext();
  const timing = abilityTiming(ability, useAtomValue(attunedAbilitiesAtom), useAtomValue(runesEquippedAtom));
  runtime.runeTiming = timing.overrideText;
  const label = abilityAccessibleLabel(ability, abilityContext, runtime);
  // No `title` alongside this: a native browser tooltip would race the custom
  // one and show the same thing twice, in two different visual languages.
  const { handlers, node } = useHoverTooltip(
    <TooltipCard content={abilityTooltipContent(ability, abilityContext, runtime)} />,
  );
  return (
    <button
      type="button"
      className={`combat-ability-slot combat-ability-slot--${ability.slot} combat-ability-slot--${state}${queued ? " combat-ability-slot--queued" : ""}${unavailable ? " combat-ability-slot--unavailable" : ""}`}
      data-ability-icon={ability.icon ?? ability.id}
      data-ability-state={state}
      role="listitem"
      aria-label={`${label}${keyHint ? `. Hotkey ${keyHint}` : ""}${queued ? ". Queued; press again to cancel" : ""}`}
      onClick={() => hudBus.requestUseAbility(ability.id)}
      {...handlers}
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
      {node}
    </button>
  );
}

function StanceCooldownSweep({ remainingPct }: { remainingPct: number }) {
  if (remainingPct <= 0) return null;
  return (
    <span
      className="combat-stance-control__cooldown-sweep"
      style={{
        background: `conic-gradient(from -90deg, rgba(0,0,0,0.7) ${remainingPct}%, transparent ${remainingPct}%)`,
      }}
      aria-hidden="true"
    />
  );
}

function StanceControl({ now }: { now: number }) {
  const attuned = useAtomValue(attunedStancesAtom);
  const active = useAtomValue(activeStanceAtom);
  const manual = useAtomValue(manualStanceOverrideAtom);
  const auto = useAtomValue(autoAtom);
  const cooldownStartedAt = useAtomValue(stanceCooldownStartedAtAtom);
  const bindings = useAtomValue(keybindsAtom);
  if (attuned.length === 0) return null;

  const cooldownElapsedMs = Math.max(0, now - cooldownStartedAt);
  const cooldownRemainingMs = cooldownStartedAt > 0
    ? Math.max(0, STANCE_SWITCH_COOLDOWN_MS - cooldownElapsedMs)
    : 0;
  const cooldownRemainingPct = (cooldownRemainingMs / STANCE_SWITCH_COOLDOWN_MS) * 100;
  const cooldownLabel = cooldownRemainingMs > 0
    ? `; stance switch ready in ${(cooldownRemainingMs / 1_000).toFixed(1)} seconds`
    : "";
  const neutralHotkey = bindingToLabel(bindings['stance.neutral']);

  return (
    <div className="combat-stance-control" role="group" aria-label="Live stance control">
      <button
        type="button"
        className={`combat-stance-control__button combat-stance-control__button--neutral${manual === NO_STANCE_ID ? " is-selected" : ""}${active === null ? " is-current" : ""}`}
        aria-label={`Neutral stance; hotkey ${neutralHotkey}${cooldownLabel}`}
        aria-pressed={manual === NO_STANCE_ID}
        title={`${auto
          ? `Neutral stance${active === null ? " — currently active" : ""}; Auto Combat retains Rune/default control`
          : `Neutral stance${active === null ? " — currently active" : ""}; hold no stance manually`}${cooldownLabel}`}
        onClick={() => hudBus.requestSetStanceControl(NO_STANCE_ID)}
      >
        <span className="combat-stance-control__icon"><GameIcon source={null} size={25} decorative fallback="◇" /></span>
        <StanceCooldownSweep remainingPct={cooldownRemainingPct} />
        <span className="combat-stance-control__key-hint" aria-hidden="true">{neutralHotkey.replace('Shift+', '⇧')}</span>
      </button>
      {attuned.map((stanceId, index) => {
        const stance = stanceDef(stanceId);
        if (!stance) return null;
        const selected = manual === stanceId;
        const current = active === stanceId;
        const hotkey = STANCE_HOTKEY_ACTIONS[index]
          ? bindingToLabel(bindings[STANCE_HOTKEY_ACTIONS[index]])
          : "—";
        return (
          <button
            key={stanceId}
            type="button"
            className={`combat-stance-control__button${selected ? " is-selected" : ""}${current ? " is-current" : ""}`}
            aria-pressed={selected}
            aria-label={`${stance.name}; hotkey ${hotkey}${cooldownLabel}`}
            title={`${auto
              ? `${stance.name}${current ? " — currently active" : ""}; Auto Combat retains Rune/default control`
              : `${stance.name}${current ? " — currently active" : ""}; select manually`}${cooldownLabel}`}
            onClick={() => hudBus.requestSetStanceControl(stanceId)}
          >
            <span className="combat-stance-control__icon">
              <GameIcon
                source={stanceIconSource(stance.id)}
                size={25}
                decorative
                fallback={stance.name.slice(0, 1)}
              />
            </span>
            <StanceCooldownSweep remainingPct={cooldownRemainingPct} />
            <span className="combat-stance-control__key-hint" aria-hidden="true">{hotkey.replace('Shift+', '⇧')}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AbilityBar() {
  const isMobile = useIsMobile();
  const equipped = useAtomValue(attunedAbilitiesAtom);
  const firedAt = useAtomValue(abilityFiredAtAtom);
  const cooldownStartedAt = useAtomValue(abilityCooldownStartedAtAtom);
  const buffs = useAtomValue(activeBuffsAtom);
  const cast = useAtomValue(abilityCastAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const queuedAbilityIds = useAtomValue(queuedAbilityIdsAtom);
  const targetId = useAtomValue(attackTargetIdAtom);
  const bindings = useAtomValue(keybindsAtom);
  const attunedStances = useAtomValue(attunedStancesAtom);

  // Tick a wall clock so ability and stance cooldown sweeps / flashes animate.
  // The bar only mounts while at least one combat control exists, so this stays cheap.
  const [now, setNow] = useState(() => Date.now());

  // Guard buffs are per-slot ids, so the tile for guard slot N lights up only
  // when THAT slot's buff is up. A Recovery guard has no DR buff of its own, so
  // it keys off its own per-slot Recovery effect id.
  const activeBuffIds = new Set<string>(buffs.map((b) => b.id));

  // Ordered so every Technique sits left of every Guard.
  const equippedDefs = SLOT_ORDER.flatMap((slot) =>
    attunedForFamily(equipped, slot).map((id, index) => ({
      ability: abilityDef(id),
      slot,
      index,
    })),
  ).filter((e): e is { ability: AbilityDef; slot: AbilityFamily; index: number } => !!e.ability);

  const hasAny = equippedDefs.length > 0;

  useEffect(() => {
    if (!hasAny && attunedStances.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(id);
  }, [hasAny, attunedStances.length]);

  const keyHints = ABILITY_HOTKEY_ACTIONS.map((action) => bindingToLabel(bindings[action]));
  if (!hasAny && attunedStances.length === 0) return null;

  const slots: { ability: AbilityDef; status: SlotStatus }[] = equippedDefs.map(
    ({ ability, slot, index }) => {
      if (cast?.abilityId === ability.id) {
        return { ability, status: castStatus(cast.startedAt, cast.castMs, now) };
      }
      const active =
        slot === "guard"
          ? activeBuffIds.has(guardEffectIdForAbility(ability.id) ?? "") ||
            activeBuffIds.has(recoveryEffectIdForAbility(ability.id) ?? "") ||
            (ability.id === "bramble-guard" && activeBuffIds.has("ability-bramble"))
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
      className="ability-bar-root combat-control-stack"
      data-ui-unlock-system="abilityDock"
      style={{
        position: "absolute",
        bottom: 16,
        left: 14,
        display: "flex",
        flexDirection: "column",
        gap: SLOT_GAP,
        alignItems: "flex-end",
        pointerEvents: "none",
        zIndex: 12,
      }}
    >
      <StanceControl now={now} />
      {hasAny && <div className="mobile-combat-abilities">
        {slots.map(({ ability, status }, index) => (
          <AbilityIcon
            key={ability.id}
            ability={ability}
            status={status}
            keyHint={keyHints[index] ?? "—"}
            queued={queuedAbilityIds.includes(ability.id)}
            unavailable={ability.slot === "technique" && ability.shape !== "instant" && ability.shape !== "self-cast" && !targetId}
          />
        ))}
      </div>}
    </div>
  );

  return (
    <HudDock
      className="desktop-hud desktop-combat-abilities"
      data-ui-unlock-system="abilityDock"
      role="group"
      aria-label="Combat controls"
    >
      <div className="combat-control-stack">
        <StanceControl now={now} />
        {hasAny && <div className="desktop-combat-abilities__layout" role="list">
          {slots.map(({ ability, status }, index) => (
            <DesktopAbilityFamily
              key={ability.id}
              ability={ability}
              status={status}
              keyHint={keyHints[index] ?? "—"}
              queued={queuedAbilityIds.includes(ability.id)}
              unavailable={ability.slot === "technique" && ability.shape !== "instant" && ability.shape !== "self-cast" && !targetId}
            />
          ))}
        </div>}
      </div>
    </HudDock>
  );
}
