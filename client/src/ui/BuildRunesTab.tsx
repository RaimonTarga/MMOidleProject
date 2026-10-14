import { TUTORIAL_ANCHORS, tutorialRuleKey } from "@mmo-idle/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  DEFAULT_RUNE_LOADOUT,
  analyzeRuneLoadoutConflicts,
  isRuneRuleCompatibleForArchetype,
  runeChannelLabel,
  type EquippedRule,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  combatArchetypeAtom,
  runesEquippedAtom,
  runesOwnedAtom,
} from "../hud/atoms";
import { GameIcon } from "./GameIcon";
import { runeConditionIconSource } from "./conceptIcons";
import { RuneClause, runeResponse } from "./RuneClause";
import { composeRuneEdit } from "@mmo-idle/shared";
import "./buildPanel.css";
import "./runeBoard.css";

type Draft = EquippedRule & { index: number | null };
export function BuildRunesTab() {
  const owned = useAtomValue(runesOwnedAtom);
  const equipped = useAtomValue(runesEquippedAtom);
  const archetype = useAtomValue(combatArchetypeAtom);
  const [rules, setRules] = useState(equipped);
  const [draft, setDraft] = useState<Draft | null>(null);
  const editorScroll = useRef<HTMLDivElement>(null);
  const conditionSection = useRef<HTMLElement>(null);
  const responseSection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!draft) return;
    editorScroll.current?.scrollTo({ top: 0 });
    const step = !draft.conditionId ? conditionSection.current
      : !draft.actionId ? responseSection.current
      : null;
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
    return true;
  });
  const pending: EquippedRule | null =
    draft?.conditionId && draft.actionId
      ? {
          conditionId: draft.conditionId,
          actionId: draft.actionId,
          ...(draft.waitOutMode ? { waitOutMode: draft.waitOutMode } : {}),
        }
      : null;
  const response = pending ? runeResponse(pending, archetype) : null;
  const next = pending ? composeRuneEdit(rules, pending, draft!.index) : rules;
  const valid =
    pending &&
    !response?.missing &&
    isRuneRuleCompatibleForArchetype(pending, archetype);
  const replaces =
    pending &&
    rules.some(
      (r, i) =>
        i !== draft?.index &&
        r.conditionId === pending.conditionId &&
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
    <div className="build-tab-body rune-workspace" data-tutorial-anchor={TUTORIAL_ANCHORS.runesBoard}>
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
                <span title={CONDITION_DATABASE.get(draft.conditionId)?.blurb}><strong>{CONDITION_DATABASE.get(draft.conditionId)?.name ?? draft.conditionId}</strong></span>
                <button type="button" aria-label="Change When condition" onClick={() => setDraft({ index: draft.index, conditionId: "", actionId: "" })}>↶ Change</button>
              </div> : <div className="rune-choice-grid">
                {conditions.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    data-tutorial-anchor={TUTORIAL_ANCHORS.runesWhen(c.id)}
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
                <GameIcon source={runeResponse({ conditionId: draft.conditionId, actionId: draft.actionId }).icon} size={28} decorative fallback="◇" />
                <span title={response?.detail}><strong>{ACTION_DATABASE.get(draft.actionId)?.name ?? draft.actionId}</strong></span>
                <button type="button" aria-label="Change Do response" onClick={() => setDraft({ ...draft, actionId: "", waitOutMode: undefined })}>↶ Change</button>
              </div> : <div className="rune-choice-grid">
                {actions.map((a) => {
                  const view = runeResponse(
                    { conditionId: draft.conditionId, actionId: a.id },
                  );
                  return (
                    <button
                      type="button"
                      key={a.id}
                      data-tutorial-anchor={TUTORIAL_ANCHORS.runesDo(a.id)}
                      aria-pressed={draft.actionId === a.id}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          actionId: a.id,
                          waitOutMode: undefined,
                        })
                      }
                    >
                      <GameIcon
                        source={view.icon}
                        size={28}
                        decorative
                        fallback="◇"
                      />
                      <span>{view.name}</span>
                    </button>
                  );
                })}
              </div>}
              {response && <p className="rune-detail">{response.detail}</p>}
            </section>
            {draft.actionId === "wait-it-out" && <section aria-label="Wait mode"><button type="button" aria-pressed={draft.waitOutMode !== "heat-managed"} onClick={() => setDraft({ ...draft, waitOutMode: "all" })}>All eligible statuses</button><button type="button" disabled={draft.conditionId !== "always"} aria-pressed={draft.waitOutMode === "heat-managed"} onClick={() => setDraft({ ...draft, waitOutMode: "heat-managed" })}>Manage Heat</button><p>Always only. Ordinary Volcano: 25 Heat to request a break; resume at 10. Current fights finish first.</p></section>}
          </div>
          <footer className="rune-draft" aria-live="polite">
            {pending ? (
              <RuneClause rule={pending} />
            ) : (
              <span>
                {draft.conditionId
                  ? `${CONDITION_DATABASE.get(draft.conditionId)?.name} → Choose a response`
                  : "Choose a situation → Choose a response"}
              </span>
            )}
            <div className="rune-toolbar">
              <span>Your saved setup stays active while you edit.</span>
              <button
                type="button"
                data-tutorial-anchor={TUTORIAL_ANCHORS.runesCommit}
                disabled={!valid}
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
                {response?.missing
                  ? "This response no longer exists."
                  : "Choose a compatible response."}
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
              data-tutorial-anchor={TUTORIAL_ANCHORS.runesAdd}
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
                  <span>{indices.length > 1 ? "First match ↓" : ""}</span>
                </h3>
                <ol className="rune-priority-track">
                  {indices.map((index, rank) => {
                    const rule = rules[index];
                    const warning = conflicts.find(
                      (c) =>
                        c.ruleIndex === index &&
                        (c.kind === "suppressed" || c.kind === "redundant"),
                    );
                    const missing = runeResponse(rule).missing;
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
                          aria-label={`Edit ${CONDITION_DATABASE.get(rule.conditionId)?.name} to ${runeResponse(rule).name}`}
                        >
                          <RuneClause rule={rule} />
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
                        <div className="rune-rule__controls">
                          <button
                            type="button"
                            aria-label="Move rule higher"
                            data-tutorial-anchor={TUTORIAL_ANCHORS.runesUp(tutorialRuleKey(rule))}
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
                            data-tutorial-anchor={TUTORIAL_ANCHORS.runesRemove(tutorialRuleKey(rule))}
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
