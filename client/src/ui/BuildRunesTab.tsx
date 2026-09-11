import { triggerSentence } from "./describe/abilityText";
import { ABILITY_DATABASE } from "@mmo-idle/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  DEFAULT_RUNE_LOADOUT,
  NO_STANCE_ID,
  analyzeRuneLoadoutConflicts,
  isRuneRuleCompatibleForArchetype,
  runeBudgetForGlobalMastery,
  runeChannelLabel,
  runeRuleCost,
  runicPointLoadoutCost,
  stanceDef,
  type EquippedRule,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  combatArchetypeAtom,
  attunedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  globalMasteryAtom,
  attunedStancesAtom,
  runesEquippedAtom,
  runesOwnedAtom,
} from "../hud/atoms";
import { AttunementBudget } from "./AttunementBudget";
import { GameIcon } from "./GameIcon";
import { runeConditionIconSource, stanceIconSource } from "./conceptIcons";
import { RuneClause, runeResponse } from "./RuneClause";
import { composeRuneEdit } from "@mmo-idle/shared";
import "./buildPanel.css";
import "./runeBoard.css";

type Draft = EquippedRule & { index: number | null };
export function BuildRunesTab() {
  const owned = useAtomValue(runesOwnedAtom);
  const equipped = useAtomValue(runesEquippedAtom);
  const abilities = useAtomValue(attunedAbilitiesAtom);
  const stances = useAtomValue(attunedStancesAtom);
  const defaultStance = useAtomValue(equippedStancesAtom).default;
  const rites = useAtomValue(equippedRitesAtom);
  const archetype = useAtomValue(combatArchetypeAtom);
  const gm = useAtomValue(globalMasteryAtom);
  const [rules, setRules] = useState(equipped);
  const [draft, setDraft] = useState<Draft | null>(null);
  const editorScroll = useRef<HTMLDivElement>(null);
  const conditionSection = useRef<HTMLElement>(null);
  const responseSection = useRef<HTMLElement>(null);
  const destinationSection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!draft) return;
    editorScroll.current?.scrollTo({ top: 0 });
    const step = !draft.conditionId ? conditionSection.current
      : !draft.actionId ? responseSection.current
      : destinationSection.current;
    step?.focus({ preventScroll: true });
    step?.scrollIntoView({ block: "nearest" });
  }, [draft?.conditionId, draft?.actionId]);
  const [reset, setReset] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setRules(equipped);
    setDraft(null);
  }, [equipped]);
  useEffect(() => {
    const handler = (event: Event) => {
      const result = (
        event as CustomEvent<{ system: string; success: boolean }>
      ).detail;
      if (result.system === "runes" && !result.success) {
        setRules(equipped);
        setError(
          "The setup could not be applied. Your saved rules have been restored.",
        );
      }
    };
    window.addEventListener("hud:loadoutResult", handler);
    return () => window.removeEventListener("hud:loadoutResult", handler);
  }, [equipped]);
  const budget = runeBudgetForGlobalMastery(gm);
  const spent = runicPointLoadoutCost({ rules, rites, abilities, stances });
  const groups = useMemo(() => {
    const result = new Map<Parameters<typeof runeChannelLabel>[0], number[]>();
    rules.forEach((r, i) => {
      const c = ACTION_DATABASE.get(r.actionId)?.channel;
      if (c) result.set(c, [...(result.get(c) ?? []), i]);
    });
    return [...result.entries()];
  }, [rules]);
  const conflicts = analyzeRuneLoadoutConflicts(rules);
  const conditions = [...CONDITION_DATABASE.values()].filter((c) =>
    owned.includes(c.id),
  );
  const actions = [...ACTION_DATABASE.values()].filter((a) => {
    if (
      !owned.includes(a.id) ||
      !draft?.conditionId ||
      !isRuneRuleCompatibleForArchetype(
        { conditionId: draft.conditionId, actionId: a.id },
        archetype,
      )
    )
      return false;
    return (a.id !== "use-ability" || abilities.techniques.length + abilities.guards.length > 0) && (a.id !== "switch-stance" || stances.length > 0);
  });
  const pending: EquippedRule | null =
    draft?.conditionId && draft.actionId
      ? {
          conditionId: draft.conditionId,
          actionId: draft.actionId,
          ...(draft.targetAbilityId ? { targetAbilityId: draft.targetAbilityId } : {}),
          ...(draft.targetStanceId
            ? { targetStanceId: draft.targetStanceId }
            : {}),
        }
      : null;
  const response = pending ? runeResponse(pending, abilities) : null;
  const next = pending ? composeRuneEdit(rules, pending, draft!.index) : rules;
  const nextSpent = runicPointLoadoutCost({ rules: next, rites, abilities, stances });
  const valid =
    pending &&
    !response?.missing &&
    isRuneRuleCompatibleForArchetype(pending, archetype) &&
    (pending.actionId !== "switch-stance" ||
      pending.targetStanceId === NO_STANCE_ID ||
      stances.includes(pending.targetStanceId ?? ""));
  const replaces =
    pending &&
    rules.some(
      (r, i) =>
        i !== draft?.index &&
        r.conditionId === pending.conditionId &&
        (pending.actionId !== "use-ability" || r.targetAbilityId === pending.targetAbilityId) &&
        ACTION_DATABASE.get(r.actionId)?.channel ===
          ACTION_DATABASE.get(pending.actionId)?.channel,
    );
  function commit(value: EquippedRule[]) {
    setError("");
    setRules(value);
    setDraft(null);
    hudBus.requestSetRuneLoadout(value);
  }
  function move(index: number, other: number) {
    const value = [...rules];
    [value[index], value[other]] = [value[other], value[index]];
    commit(value);
  }
  return (
    <div className="build-tab-body rune-workspace">
      <AttunementBudget loadout={{ rules, rites, abilities, stances }} budget={budget} />
      {error && (
        <p className="rune-error" role="alert">
          {error}
        </p>
      )}
      {draft ? (
        <>
          <div className="rune-toolbar">
            <strong>{draft.index === null ? "New rule" : "Edit rule"}</strong>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
          <div ref={editorScroll} className="rune-workspace__scroll rune-editor">
            <section ref={conditionSection} tabIndex={-1} aria-label="When">
              <h3>When</h3>
              {draft.conditionId ? <div className="rune-step-summary">
                <GameIcon source={runeConditionIconSource(draft.conditionId)} size={28} decorative fallback="◇" />
                <span title={CONDITION_DATABASE.get(draft.conditionId)?.blurb}><strong>{CONDITION_DATABASE.get(draft.conditionId)?.name ?? draft.conditionId}</strong><small>{CONDITION_DATABASE.get(draft.conditionId)?.cost} RP</small></span>
                <button type="button" aria-label="Change When condition" onClick={() => setDraft({ index: draft.index, conditionId: "", actionId: "" })}>↶ Change</button>
              </div> : <div className="rune-choice-grid">
                {conditions.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    aria-pressed={draft.conditionId === c.id}
                    onClick={() => {
                      const fits =
                        draft.actionId &&
                        isRuneRuleCompatibleForArchetype(
                          { conditionId: c.id, actionId: draft.actionId },
                          archetype,
                        );
                      setDraft({
                        ...draft,
                        conditionId: c.id,
                        actionId: fits ? draft.actionId : "",
                        targetStanceId: fits ? draft.targetStanceId : undefined,
                      });
                    }}
                  >
                    <GameIcon
                      source={runeConditionIconSource(c.id)}
                      size={28}
                      decorative
                      fallback="◇"
                    />
                    <span>{c.name}</span>
                    <small>{c.cost} RP</small>
                  </button>
                ))}
              </div>}
            </section>
            <section ref={responseSection} tabIndex={-1} aria-label="Do">
              <h3>Do</h3>
              {!draft.conditionId && (
                <p className="rune-detail">
                  Choose a situation to see the responses that fit.
                </p>
              )}
              {draft.actionId ? <div className="rune-step-summary">
                <GameIcon source={runeResponse({ conditionId: draft.conditionId, actionId: draft.actionId }, abilities).icon} size={28} decorative fallback="◇" />
                <span title={response?.detail}><strong>{ACTION_DATABASE.get(draft.actionId)?.name ?? draft.actionId}</strong><small>{ACTION_DATABASE.get(draft.actionId)?.cost} RP</small></span>
                <button type="button" aria-label="Change Do response" onClick={() => setDraft({ ...draft, actionId: "", targetAbilityId: undefined, targetStanceId: undefined })}>↶ Change</button>
              </div> : <div className="rune-choice-grid">
                {actions.map((a) => {
                  const view = runeResponse(
                    { conditionId: draft.conditionId, actionId: a.id },
                    abilities,
                  );
                  return (
                    <button
                      type="button"
                      key={a.id}
                      aria-pressed={draft.actionId === a.id}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          actionId: a.id,
                          targetStanceId:
                            a.id === "switch-stance"
                              ? draft.targetStanceId
                              : undefined,
                        })
                      }
                    >
                      <GameIcon
                        source={view.icon}
                        size={28}
                        decorative
                        fallback="◇"
                      />
                      <span>
                        {a.id === "switch-stance" ? "Switch stance" : view.name}
                      </span>
                      <small>{a.cost} RP</small>
                    </button>
                  );
                })}
              </div>}
              {response && draft.actionId !== "use-ability" && draft.actionId !== "switch-stance" && <p className="rune-detail">{response.detail}</p>}
            </section>
            {draft.actionId === "use-ability" && <section ref={destinationSection} tabIndex={-1} aria-label="Choose attuned ability" className="rune-editor__destinations"><h3>Choose attuned ability</h3><div className="rune-choice-grid">{[...abilities.techniques, ...abilities.guards].map(id => <button className="rune-ability-choice" type="button" key={id} aria-pressed={draft.targetAbilityId === id} onClick={() => setDraft({ ...draft, targetAbilityId: id })}>{ABILITY_DATABASE.get(id)?.name}<small>Default: {triggerSentence(ABILITY_DATABASE.get(id)!.trigger)}</small></button>)}</div><p>Attunement is already paid. This rule costs only its logic.</p></section>}
            {draft.actionId === "switch-stance" && (
              <section
                ref={destinationSection}
                tabIndex={-1}
                aria-label="Choose stance"
                className="rune-editor__destinations"
              >
                <h3>Choose stance</h3>
                <div className="rune-choice-grid">
                  {[NO_STANCE_ID, ...stances].map((id) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={draft.targetStanceId === id}
                      onClick={() => setDraft({ ...draft, targetStanceId: id })}
                    >
                      <GameIcon
                        source={
                          id === NO_STANCE_ID ? null : stanceIconSource(id)
                        }
                        size={28}
                        decorative
                        fallback="◇"
                      />
                      <span>{stanceDef(id)?.name ?? "No stance"}</span>
                      <small>
                        {runeRuleCost({
                          conditionId: draft.conditionId,
                          actionId: "switch-stance",
                          targetStanceId: id,
                        })}{" "}
                        RP total
                      </small>
                    </button>
                  ))}
                </div>
                <p className="rune-detail">
                  ↩ Otherwise return to{" "}
                  {stanceDef(defaultStance)?.name ?? "No stance"}.
                </p>
              </section>
            )}
          </div>
          <footer className="rune-draft" aria-live="polite">
            {pending ? (
              <RuneClause rule={pending} abilities={abilities} />
            ) : (
              <span>
                {draft.conditionId
                  ? `${CONDITION_DATABASE.get(draft.conditionId)?.name} → Choose a response`
                  : "Choose a situation → Choose a response"}
              </span>
            )}
            <div className="rune-toolbar">
              <span>
                {pending
                  ? `${runeRuleCost(pending)} RP · Setup ${nextSpent} / ${budget}`
                  : "Your saved setup stays active while you edit."}
              </span>
              <button
                type="button"
                disabled={!valid || (nextSpent > budget && nextSpent >= spent)}
                onClick={() => commit(next)}
              >
                {replaces
                  ? "Replace rule"
                  : draft.index === null
                    ? "Add rule"
                    : "Save rule"}
              </button>
            </div>
            {pending && !valid && (
              <span className="rune-detail">
                {pending.actionId === "switch-stance" && !pending.targetStanceId
                  ? "Choose the stance to switch to."
                  : response?.missing
                    ? "Attune the target ability before adding this rule."
                    : "Choose a compatible response."}
              </span>
            )}
            {nextSpent > budget && pending && (
              <span className="rune-error">
                Free {nextSpent - budget} RP to use this setup.
              </span>
            )}
            {replaces && (
              <span className="rune-detail">
                Replaces the existing{" "}
                {CONDITION_DATABASE.get(pending!.conditionId)?.name} rule in{" "}
                {runeChannelLabel(
                  ACTION_DATABASE.get(pending!.actionId)!.channel,
                )}
                .
              </span>
            )}
          </footer>
        </>
      ) : (
        <>
          <div className="rune-toolbar">
            <strong>Rune priorities</strong>
            <button
              type="button"
              className="rune-add-rule"
              onClick={() =>
                setDraft({ index: null, conditionId: "", actionId: "" })
              }
            >
              + Add rule
            </button>
          </div>
          <div className="rune-workspace__scroll">
            {rules.length === 0 && (
              <p className="rune-detail">
                No custom rules. Your character uses its default combat
                behavior.
              </p>
            )}
            {groups.map(([channel, indices]) => (
              <section
                className="rune-group"
                key={channel}
                aria-label={`${runeChannelLabel(channel)} priority`}
              >
                <h3>
                  {runeChannelLabel(channel)}
                  <span>{indices.length > 1 ? (channel === "ABILITY" ? "Execution priority ↓" : "First match ↓") : ""}</span>
                </h3>
                <ol className="rune-priority-track">
                  {indices.map((index, rank) => {
                    const rule = rules[index];
                    const warning = conflicts.find(
                      (c) =>
                        c.ruleIndex === index &&
                        (c.kind === "suppressed" || c.kind === "redundant"),
                    );
                    const missing = runeResponse(rule, abilities).missing;
                    return (
                      <li
                        key={`${index}:${rule.conditionId}:${rule.actionId}`}
                        className="rune-rule"
                      >
                        <span
                          className="rune-rule__rank"
                          aria-label={`Priority ${rank + 1}`}
                        >
                          {rank + 1}
                        </span>
                        <button
                          type="button"
                          className="rune-rule__edit"
                          onClick={() => setDraft({ index, ...rule })}
                          aria-label={`Edit ${CONDITION_DATABASE.get(rule.conditionId)?.name} to ${runeResponse(rule, abilities).name}`}
                        >
                          <RuneClause rule={rule} abilities={abilities} />
                          {rule.actionId === "use-ability" && <small>{runeResponse(rule, abilities).detail}</small>}
                          {rule.actionId === "switch-stance" && (
                            <small>
                              ↩ Default:{" "}
                              {stanceDef(defaultStance)?.name ?? "No stance"}
                            </small>
                          )}
                          {missing && (
                            <small className="rune-error">
                              Target unavailable · edit this rule
                            </small>
                          )}
                          {warning && (
                            <small className="rune-error">
                              {warning.kind === "redundant"
                                ? "Duplicates an earlier rule"
                                : "Blocked by an earlier rule"}{" "}
                              in this group
                            </small>
                          )}
                        </button>
                        <span className="rune-rule__cost">
                          {runeRuleCost(rule)} RP
                        </span>
                        <div className="rune-rule__controls">
                          <button
                            type="button"
                            aria-label="Move rule higher"
                            disabled={rank === 0}
                            onClick={() => move(index, indices[rank - 1])}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label="Move rule lower"
                            disabled={rank === indices.length - 1}
                            onClick={() => move(index, indices[rank + 1])}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            aria-label="Remove rule"
                            onClick={() =>
                              commit(rules.filter((_, i) => i !== index))
                            }
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
          <footer className="rune-toolbar rune-workspace__footer">
            <span className="rune-detail">
              Rules are tried in priority order. Ability cooldowns and combat execution limits still apply.
            </span>
            {reset ? (
              <span className="rune-reset">
                <span>Restore the basic rules?</span>
                <button
                  type="button"
                  onClick={() => {
                    commit(DEFAULT_RUNE_LOADOUT.map((r) => ({ ...r })));
                    setReset(false);
                  }}
                >
                  Restore
                </button>
                <button type="button" onClick={() => setReset(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setReset(true)}>
                Reset defaults
              </button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
