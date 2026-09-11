import { useEffect, useId, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { CONDITION_DATABASE, abilityDef, stanceDef } from "@mmo-idle/shared";
import {
  abilityFiredAtAtom,
  activeStanceAtom,
  autoAtom,
  autoIntentAtom,
  attunedAbilitiesAtom,
  knownStancesAtom,
  partyAtom,
  playerIdAtom,
} from "./atoms";
import { composeIntentPresentation } from "./intentPresentation";
import { GameIcon } from "../ui/GameIcon";
import {
  conceptAbilityIconSource,
  runeConditionIconSource,
  stanceIconSource,
} from "../ui/conceptIcons";
import { runeResponse } from "../ui/RuneClause";
import "./behaviorPanel.css";

const expandedAtom = atomWithStorage("hud.behavior.expanded", true);

export function BehaviorPanel() {
  const intent = useAtomValue(autoIntentAtom);
  const auto = useAtomValue(autoAtom);
  const playerId = useAtomValue(playerIdAtom);
  const party = useAtomValue(partyAtom);
  const abilities = useAtomValue(attunedAbilitiesAtom);
  const stance = useAtomValue(activeStanceAtom);
  const known = useAtomValue(knownStancesAtom);
  const fired = useAtomValue(abilityFiredAtAtom);
  const [expanded, setExpanded] = useAtom(expandedAtom);
  const detailsId = useId();
  const [now, setNow] = useState(Date.now);
  const recent = Object.entries(fired).sort((a, b) => b[1] - a[1])[0];
  useEffect(() => {
    setNow(Date.now());
    if (!recent) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, recent[1] + 2400 - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [recent?.[0], recent?.[1]]);
  const presentation = composeIntentPresentation(
    !!playerId,
    intent,
    party?.members ?? [],
  );
  const active = intent?.activeRune;
  const action = active ? runeResponse(active, abilities) : null;
  const trigger =
    active && active.conditionId !== "always"
      ? CONDITION_DATABASE.get(active.conditionId)
      : null;
  const justFired =
    recent && now - recent[1] < 2400 ? abilityDef(recent[0]) : null;
  const activeStance = stanceDef(stance);
  return (
    <section
      className="hud-panel behavior-panel"
      aria-label="Character behavior"
    >
      <button
        type="button"
        className="behavior-panel__heading"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>Behavior</span>
        <span>
          {auto ? "Auto" : "Manual"}{" "}
          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
        </span>
      </button>
      {known.length > 0 && (
        <div className="behavior-panel__stance" title={activeStance?.blurb}>
          <GameIcon
            source={stance ? stanceIconSource(stance) : null}
            size={24}
            decorative
            fallback="◇"
          />
          <strong>{activeStance?.name ?? "No stance"}</strong>
        </div>
      )}
      <div className="behavior-panel__action">
        {action && (
          <GameIcon source={action.icon} size={24} decorative fallback="◇" />
        )}
        <strong>{action?.name ?? presentation.action}</strong>
      </div>
      <div id={detailsId} hidden={!expanded}>
        {trigger ? (
          <p className="behavior-panel__trigger">
            <GameIcon
              source={runeConditionIconSource(trigger.id)}
              size={20}
              decorative
            />
            <span>{trigger.name}</span>
          </p>
        ) : !active && intent?.reason ? (
          <p className="behavior-panel__reason">{intent.reason}</p>
        ) : null}
        {justFired && (
          <div className="behavior-panel__event" aria-live="polite">
            <span
              key={`${recent[0]}:${recent[1]}`}
              className="behavior-panel__pulse"
            >
              <GameIcon
                source={conceptAbilityIconSource(justFired.id)}
                size={20}
                decorative
                fallback="◇"
              />
              {justFired.name} activated
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
