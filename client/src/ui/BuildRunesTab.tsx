import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useAtom, useAtomValue } from "jotai";
import { ActionChip, EngravedMeter } from "../hud/primitives";
import {
  ACTION_DATABASE,
  addRuneRuleWithReplacement,
  analyzeRuneLoadoutConflicts,
  CONDITION_DATABASE,
  DEFAULT_RUNE_LOADOUT,
  NO_STANCE_ID,
  RUNE_RECIPE_DATABASE,
  STANCE_DATABASE,
  TEST_ROOM_NODE_ID,
  abilityDef,
  equippedForSlot,
  getRuleName,
  isRuneRuleCompatibleForArchetype,
  runeBudgetForGlobalMastery,
  runeChannelLabel,
  runicPointLoadoutCost,
  runeRuleCost,
  stanceDef,
  type AbilitySlot,
  type ActionDef,
  type ConditionDef,
  type EquippedAbilities,
  type EquippedRule,
  type EssenceType,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  biomeLevelAtom,
  bossesClearedAtom,
  combatArchetypeAtom,
  equippedAbilitiesAtom,
  equippedRitesAtom,
  essencesAtom,
  globalMasteryAtom,
  knownStancesAtom,
  playerNodeIdAtom,
  runesEquippedAtom,
  runesOwnedAtom,
} from "../hud/atoms";
import { BuildIcon, type BuildIconKind } from "./BuildIcon";
import { GameIcon, type IconSource } from "./GameIcon";
import { runeActionIconSource, runeConditionIconSource, stanceIconSource } from "./conceptIcons";
import { DetailLines } from "./describe/DetailLines";
import { actionLines, conditionLines } from "./describe";
import {
  runeFragmentIconSource,
} from "./systemIcons";
import { DialogTab, DialogTabs } from "../hud/primitives";
import "./crafting.css";
import "./buildPanel.css";

const CHANNEL_COLOR: Record<string, string> = {
  MOVEMENT: "#ffb36b",
  TARGETING: "#d6a8ff",
  OOC_MAINTENANCE: "#7ab8ff",
  RESOURCE_MAINTENANCE: "#73d7ff",
  GLOBAL_STRATEGY: "#7affc0",
  PATH_SAFETY: "#8fd48b",
  APPROACH_STYLE: "#8fd48b",
  TRAVEL_PATHING: "#7ad7ff",
  TRAVEL_RESPONSE: "#7ad7ff",
  CONTROL: "#ff7a9a",
  TECHNIQUE: "#ffd76b",
  TECHNIQUE_2: "#ffd76b",
  GUARD: "#9ad0ff",
  GUARD_2: "#9ad0ff",
  STANCE: "#c0ff9a",
};

interface RuneTarget {
  kind: BuildIconKind;
  label: string;
  title: string;
  text: string;
  missing: boolean;
}

/** Which ability slot each `fire-*` rune action drives. */
const ABILITY_FIRE_ACTIONS: Record<string, { slot: AbilitySlot; index: number }> = {
  "fire-technique": { slot: "technique", index: 0 },
  "fire-technique-2": { slot: "technique", index: 1 },
  "fire-guard": { slot: "guard", index: 0 },
  "fire-guard-2": { slot: "guard", index: 1 },
};

function resolveRuneTarget(
  actionId: string,
  equippedAbilities: EquippedAbilities,
  targetStanceId?: string,
): RuneTarget | null {
  // Each ability-fire action drives ONE slot index, so the preview has to name
  // the ability in that exact slot — otherwise a player wiring `fire-guard-2`
  // could not tell which of two equipped Guards they were actually triggering.
  const fireTarget = ABILITY_FIRE_ACTIONS[actionId];
  if (fireTarget) {
    const { slot, index } = fireTarget;
    const ability = abilityDef(equippedForSlot(equippedAbilities, slot)[index]);
    const slotName = slot === "technique" ? "Technique" : "Guard";
    const ordinal = index === 0 ? slotName : `${slotName} ${index + 1}`;
    return {
      kind: "ability",
      label: ability?.name ?? ordinal,
      title: ability ? `Triggers ${ordinal}: ${ability.name}` : `No ${ordinal} equipped`,
      text:
        ability?.blurb ??
        `Equip an ability in your ${ordinal.toLowerCase()} slot to make this rune do something.`,
      missing: !ability,
    };
  }
  if (actionId === "switch-stance") {
    if (targetStanceId === NO_STANCE_ID) {
      return {
        kind: "stance",
        label: "No Stance",
        title: "Switches to: No Stance",
        text: "Drop the current stance and fight without stance bonuses or penalties.",
        missing: false,
      };
    }
    const stance = stanceDef(targetStanceId);
    return {
      kind: "stance",
      label: stance?.name ?? "Choose a stance",
      title: stance ? `Switches to: ${stance.name}` : "No destination chosen",
      text: stance?.blurb ?? "Choose a learned stance from the destination wheel.",
      missing: !stance,
    };
  }
  return null;
}

function ruleLabel(
  rule: EquippedRule,
  equippedAbilities: EquippedAbilities,
): { title: string; subtitle: string; target: RuneTarget | null } {
  const target = resolveRuneTarget(rule.actionId, equippedAbilities, rule.targetStanceId);
  const named = getRuleName(rule.conditionId, rule.actionId);
  const cond = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  const fallback = `${cond?.name ?? rule.conditionId} -> ${action?.name ?? rule.actionId}`;
  if (target) {
    return {
      title: `${cond?.name ?? rule.conditionId} -> ${target.label}`,
      subtitle: target.missing ? target.text : `${action?.name ?? "Trigger"}: ${target.text}`,
      target,
    };
  }
  return {
    title: named?.name ?? fallback,
    subtitle: named?.blurb ?? fallback,
    target,
  };
}

function rpBadge(cost: number, tone: "normal" | "danger" = "normal") {
  return (
    <span
      style={{
        minWidth: 34,
        height: 28,
        padding: "0 6px",
        border: `1px solid ${tone === "danger" ? "#ff7a7a" : "#e0c15c"}`,
        borderRadius: 3,
        background: tone === "danger" ? "rgba(90, 20, 30, 0.75)" : "rgba(65, 47, 12, 0.85)",
        color: tone === "danger" ? "#ffc0c0" : "#ffe084",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: "bold",
        flexShrink: 0,
      }}
    >
      {cost} RP
    </span>
  );
}

/**
 * The rune budget: a bounded meter, so it takes the engraved grammar rather than
 * the conduit's motion. Over-spending turns the trough itself danger-red, which
 * is why the caller no longer needs a sentence of warning text beside it.
 *
 * V5 rebuilds this into the sticky header of the rule board; the grammar chosen
 * here is what it will inherit.
 */
function RunePointMeter({ spent, budget }: { spent: number; budget: number }) {
  const over = Math.max(0, spent - budget);
  const fraction = budget > 0 ? Math.min(1, spent / budget) : 0;
  return (
    <div className="rune-budget">
      <div className="rune-budget__row">
        <span className="build-section-title">Rune Points</span>
        <span className={`rune-budget__value${over > 0 ? ' rune-budget__value--over' : ''}`}>
          {spent} / {budget}
        </span>
      </div>
      <EngravedMeter
        className="rune-budget__meter"
        fraction={fraction}
        over={over > 0}
        label={over > 0
          ? `Rune points: ${spent} spent of ${budget}, ${over} over budget`
          : `Rune points: ${spent} spent of ${budget}`}
      />
    </div>
  );
}

export function BuildRunesTab() {
  const owned = useAtomValue(runesOwnedAtom);
  const equipped = useAtomValue(runesEquippedAtom);
  const gm = useAtomValue(globalMasteryAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const equippedAbilities = useAtomValue(equippedAbilitiesAtom);
  const knownStances = useAtomValue(knownStancesAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);

  const [loadout, setLoadout] = useState<EquippedRule[]>(equipped);
  const [selCond, setSelCond] = useState<string | null>(null);
  const [selAction, setSelAction] = useState<string | null>(null);
  const [selStance, setSelStance] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setLoadout(equipped);
  }, [equipped]);

  useEffect(() => {
    const handler = (event: Event) => {
      const result = (event as CustomEvent<{ system: string; success: boolean }>).detail;
      if (result.system === "runes" && !result.success) setLoadout(equipped);
    };
    window.addEventListener("hud:loadoutResult", handler);
    return () => window.removeEventListener("hud:loadoutResult", handler);
  }, [equipped]);

  const ownedSet = new Set(owned);
  const conditions: ConditionDef[] = [...CONDITION_DATABASE.values()].filter((c) =>
    ownedSet.has(c.id),
  );
  const actions: ActionDef[] = [...ACTION_DATABASE.values()].filter((a) =>
    ownedSet.has(a.id),
  );
  const viableActions = selCond
    ? actions.filter((a) =>
        isRuneRuleCompatibleForArchetype(
          { conditionId: selCond, actionId: a.id },
          combatArchetype,
        ),
      )
    : [];

  const pendingRule: EquippedRule | null = selCond && selAction
    ? {
        conditionId: selCond,
        actionId: selAction,
        ...(selAction === "switch-stance" && selStance ? { targetStanceId: selStance } : {}),
      }
    : null;
  const pendingCompatible = pendingRule
    ? isRuneRuleCompatibleForArchetype(pendingRule, combatArchetype)
      && (pendingRule.actionId !== "switch-stance" || !!pendingRule.targetStanceId)
    : false;
  const pendingCost = pendingRule ? runeRuleCost(pendingRule) : 0;
  /** What adding a rule to THIS destination actually spends, once a situation is chosen. */
  const stanceTokenCost = (stanceId: string): string =>
    selCond
      ? `${runeRuleCost({ conditionId: selCond, actionId: "switch-stance", targetStanceId: stanceId })} RP`
      : `+${STANCE_DATABASE.get(stanceId)?.runeCost ?? 0} RP`;
  const budget = runeBudgetForGlobalMastery(gm);
  const spent = runicPointLoadoutCost({ rules: loadout, rites: equippedRites });
  const pendingOverBudget = pendingRule
    ? runicPointLoadoutCost({ rules: addRuneRuleWithReplacement(loadout, pendingRule), rites: equippedRites }) > budget
    : false;
  const pendingTarget = selAction
    ? resolveRuneTarget(selAction, equippedAbilities, selStance ?? undefined)
    : null;
  const conflictsByRule = useMemo(() => {
    const byRule = new Map<number, ReturnType<typeof analyzeRuneLoadoutConflicts>[number]>();
    for (const conflict of analyzeRuneLoadoutConflicts(loadout)) byRule.set(conflict.ruleIndex, conflict);
    return byRule;
  }, [loadout]);

  function commit(next: EquippedRule[]): void {
    setLoadout(next);
    hudBus.requestSetRuneLoadout(next);
  }

  function addRule(): void {
    if (!pendingRule || !pendingCompatible || pendingOverBudget) return;
    commit(addRuneRuleWithReplacement(loadout, pendingRule));
  }

  function removeRule(index: number): void {
    commit(loadout.filter((_, i) => i !== index));
  }

  function moveRule(index: number, offset: -1 | 1): void {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= loadout.length) return;
    const next = [...loadout];
    const [rule] = next.splice(index, 1);
    next.splice(nextIndex, 0, rule);
    commit(next);
  }

  function resetDefaultLoadout(): void {
    commit(DEFAULT_RUNE_LOADOUT.map((rule) => ({ ...rule })));
    setSelCond(null);
    setSelAction(null);
    setSelStance(null);
    setConfirmReset(false);
  }

  const preview = selCond && selAction ? getRuleName(selCond, selAction) : null;
  const previewCond = selCond ? CONDITION_DATABASE.get(selCond) : null;
  const previewAction = selAction ? ACTION_DATABASE.get(selAction) : null;

  return (
    // Three bands: the budget you are spending against, a scrolling board, and a
    // composer pinned to the bottom. The whole tab used to scroll as one column
    // with ADD RULE at the very end, so building a rule meant scrolling past the
    // fragment lists to commit it and back up to see what you had made.
    <div className="build-tab-body build-rune-board" style={{ position: "relative" }}>
      <div className="build-rune-board__header">
        <RunePointMeter spent={spent} budget={budget} />
      </div>

      <div className="build-rune-board__scroll">
        <div id="build-rune-loadout">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span className="build-section-title">
                Priority rules {loadout.length > 0 ? `(${loadout.length})` : ""}
              </span>
              <button
                type="button"
                className="auto-btn"
                onClick={() => setConfirmReset(true)}
                style={{ width: "auto", minHeight: 24, padding: "4px 10px", fontSize: 10 }}
              >
                RESET DEFAULT
              </button>
            </div>

            {loadout.length === 0 ? (
              <div style={{ color: "#6868a8", fontSize: 12, fontStyle: "italic" }}>
                No rules equipped. Your character will only use fallback combat behavior.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {loadout.map((rule, i) => {
                  const { title, subtitle, target } = ruleLabel(rule, equippedAbilities);
                  const action = ACTION_DATABASE.get(rule.actionId);
                  const accent = action ? CHANNEL_COLOR[action.channel] : "#7a7ad0";
                  const compatible = isRuneRuleCompatibleForArchetype(rule, combatArchetype)
                    && (rule.actionId !== "switch-stance"
                      || rule.targetStanceId === NO_STANCE_ID
                      || knownStances.includes(rule.targetStanceId ?? ""));
                  const conflict = conflictsByRule.get(i);
                  const earlier = conflict ? loadout[conflict.earlierRuleIndex] : null;
                  const earlierLabel = earlier
                    ? `${CONDITION_DATABASE.get(earlier.conditionId)?.name ?? earlier.conditionId} → ${ACTION_DATABASE.get(earlier.actionId)?.name ?? earlier.actionId}`
                    : "";
                  return (
                    <div
                      key={`${rule.conditionId}:${rule.actionId}:${rule.targetStanceId ?? ""}:${i}`}
                      className={`rule-card${compatible ? '' : ' rule-card--invalid'}`}
                      style={{ '--rule-accent': compatible ? accent : 'var(--hud-danger)' } as CSSProperties}
                    >
                      <span className="rule-card__order">{i + 1}</span>

                      {/* WHEN this holds → DO that. The arrow is the rule, so it
                          is drawn rather than implied by two stacked lines. */}
                      <div className="rule-card__clause">
                        <span className="rule-card__when">
                          <span className="rule-card__tag">When</span>
                          <span className="rule-card__text">{title}</span>
                        </span>
                        <span className="rule-card__arrow" aria-hidden="true">→</span>
                        <span className="rule-card__do">
                          <span className="rule-card__tag">Do</span>
                          <span className="rule-card__text">
                            {compatible ? subtitle : 'Invalid pairing — remove or replace'}
                          </span>
                        </span>
                      </div>

                      {/* The rule's target, when it names one. Muted means the
                          thing it points at is not equipped. */}
                      {target && (
                        <span
                          className={`rule-card__target${target.missing ? ' rule-card__target--missing' : ''}`}
                          title={target.missing
                            ? `${target.label} is not equipped — this rule cannot fire`
                            : target.label}
                        >
                          <BuildIcon kind={target.kind} label={target.label} muted={target.missing} size={20} />
                          <span className="rule-card__target-name">{target.label}</span>
                        </span>
                      )}

                      {conflict && (
                        <span
                          className="rule-card__conflict"
                          title={conflict.kind === "suppressed"
                            ? `This rule can never fire while ${earlierLabel} is higher priority.`
                            : conflict.kind === "redundant"
                              ? `This repeats ${earlierLabel}.`
                              : `This can overlap ${earlierLabel}; priority decides when both apply.`}
                        >
                          {conflict.kind === "suppressed"
                            ? `SUPPRESSED BY #${conflict.earlierRuleIndex + 1}`
                            : conflict.kind === "redundant"
                              ? `DUPLICATES #${conflict.earlierRuleIndex + 1}`
                              : `PRIORITY WITH #${conflict.earlierRuleIndex + 1}`}
                        </span>
                      )}

                      {rpBadge(runeRuleCost(rule), compatible ? "normal" : "danger")}

                      <span className="rule-card__controls">
                        <ActionChip
                          label="Move rule higher"
                          fallback="▲"
                          size="sm"
                          disabled={i === 0}
                          onClick={() => moveRule(i, -1)}
                        />
                        <ActionChip
                          label="Move rule lower"
                          fallback="▼"
                          size="sm"
                          disabled={i === loadout.length - 1}
                          onClick={() => moveRule(i, 1)}
                        />
                        <ActionChip
                          label="Remove rule"
                          fallback="−"
                          size="sm"
                          tone="danger"
                          onClick={() => removeRule(i)}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Column<ConditionDef>
              heading={
                <>
                  <GameIcon
                    source={runeFragmentIconSource("condition")}
                    size={18}
                    fallback={null}
                    decorative
                  />
                  Situation
                </>
              }
              items={conditions}
              selectedId={selCond}
              onSelect={(id) => {
                setSelCond(id);
                if (
                  selAction &&
                  !isRuneRuleCompatibleForArchetype(
                    { conditionId: id, actionId: selAction },
                    combatArchetype,
                  )
                ) {
                  setSelAction(null);
                }
              }}
              costFor={(c) => c.cost}
              iconFor={(c) => runeConditionIconSource(c.id)}
              renderMeta={(c) => c.blurb}
              renderExtra={(c) => (
                <DetailLines className="build-rune-lines" lines={conditionLines(c.id)} />
              )}
            />
            <Column<ActionDef>
              heading={
                <>
                  <GameIcon
                    source={runeFragmentIconSource("action")}
                    size={18}
                    fallback={null}
                    decorative
                  />
                  Response
                </>
              }
              items={viableActions}
              selectedId={selAction}
              onSelect={(id) => {
                setSelAction(id);
                if (id !== "switch-stance") setSelStance(null);
              }}
              costFor={(a) => a.cost}
              iconFor={(a) => runeActionIconSource(a.id)}
              accentFor={(a) => CHANNEL_COLOR[a.channel]}
              emptyText={selCond ? "No responses fit this situation." : "Pick a situation first."}
              renderMeta={(a) => `${runeChannelLabel(a.channel)} - ${a.blurb}`}
              renderExtra={(a) => {
                const target = resolveRuneTarget(a.id, equippedAbilities, selStance ?? undefined);
                return (
                  <>
                    {target && (
                      <div className="build-rune-target">
                        <BuildIcon kind={target.kind} label={target.label} muted={target.missing} size={28} />
                        <div>
                          <div className="build-rune-target__label">{target.title}</div>
                          <div className="build-rune-target__text">{target.text}</div>
                        </div>
                      </div>
                    )}
                    {/* The distances the response actually moves you — authored
                        in shared/data/runeTuning so they are the same numbers
                        the auto-combat systems steer by. */}
                    <DetailLines className="build-rune-lines" lines={actionLines(a.id)} />
                  </>
                );
              }}
            />
          </div>

          {selAction === "switch-stance" && (
            <div className="stance-destination-wheel">
              {/* `Switch Stance` itself costs 0 RP, so each token quotes the WHOLE rule
                  price (condition + destination) once a situation is picked — the
                  surcharge alone would understate what pressing ADD RULE spends. */}
              <div className="stance-destination-wheel__title">
                {selCond ? "Choose destination sigil — cost shown is the whole rule" : "Choose destination sigil"}
              </div>
              <div className="stance-destination-wheel__track">
                <button
                  type="button"
                  className={`stance-destination-token${selStance === NO_STANCE_ID ? " stance-destination-token--selected" : ""}`}
                  onClick={() => setSelStance(NO_STANCE_ID)}
                  title="Drop the current stance and fight without stance bonuses or penalties."
                >
                  <GameIcon source={null} size={32} fallback="Ø" decorative />
                  <span>No Stance<small>{stanceTokenCost(NO_STANCE_ID)}</small></span>
                </button>
                {knownStances.map((id) => STANCE_DATABASE.get(id)).filter(Boolean).map((stance) => (
                  <button
                    key={stance!.id}
                    type="button"
                    className={`stance-destination-token${selStance === stance!.id ? " stance-destination-token--selected" : ""}`}
                    onClick={() => setSelStance(stance!.id)}
                    title={stance!.blurb}
                  >
                    <GameIcon source={stanceIconSource(stance!.id)} size={32} fallback={stance!.name.slice(0, 1)} decorative />
                    <span>{stance!.name}<small>{stanceTokenCost(stance!.id)}</small></span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Pinned: the thing you are building and the button that commits it stay
          on screen while you scroll the fragments you are building it from. */}
      <div className="rune-composer">
        {selCond && selAction ? (
          <div className="rune-composer__row">
            {pendingTarget ? (
              <BuildIcon kind={pendingTarget.kind} label={pendingTarget.label} muted={pendingTarget.missing} />
            ) : (
              rpBadge(pendingCost, pendingOverBudget ? "danger" : "normal")
            )}
            <div className="rune-composer__text">
              <div className="rune-composer__title">
                {pendingTarget?.title ??
                  preview?.name ??
                  `${previewCond?.name ?? selCond} -> ${previewAction?.name ?? selAction}`}
              </div>
              <div className={`rune-composer__blurb${pendingCompatible ? '' : ' rune-composer__blurb--bad'}`}>
                {!pendingCompatible
                  ? "That response does not make sense for this situation."
                  : pendingOverBudget
                    ? "This rule exceeds your current rune point budget."
                    : loadout.some((rule) => {
                      const action = ACTION_DATABASE.get(rule.actionId);
                      const pendingAction = ACTION_DATABASE.get(pendingRule?.actionId ?? "");
                      return rule.conditionId === pendingRule?.conditionId && action?.channel === pendingAction?.channel;
                    })
                      ? "This replaces the existing rule with the same situation and behavior channel."
                    : pendingTarget?.text ??
                      preview?.blurb ??
                      `${previewCond?.name ?? selCond} -> ${previewAction?.name ?? selAction}`}
              </div>
            </div>
            {rpBadge(pendingCost, pendingOverBudget ? "danger" : "normal")}
            <button
              className="auto-btn rune-composer__commit"
              onClick={addRule}
              disabled={!pendingCompatible || pendingOverBudget}
            >
              ADD RULE
            </button>
          </div>
        ) : (
          <div className="rune-composer__hint">Pick a situation and a response.</div>
        )}
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(4, 3, 12, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: "min(420px, 100%)",
              border: "1px solid rgba(224, 193, 92, 0.42)",
              borderRadius: 6,
              background: "rgba(13, 11, 34, 0.96)",
              boxShadow: "0 16px 60px rgba(0, 0, 0, 0.55)",
              padding: 16,
            }}
          >
            <div style={{ color: "#ffe084", fontWeight: "bold", fontSize: 15 }}>
              Reset Rune Loadout
            </div>
            <div style={{ color: "#b8a8e0", fontSize: 12, lineHeight: 1.5, marginTop: 8 }}>
              Restore the basic enemy-seeking setup? This replaces your current priority rules.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="auto-btn"
                onClick={() => setConfirmReset(false)}
                style={{ width: "auto", padding: "6px 12px" }}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="auto-btn active"
                onClick={resetDefaultLoadout}
                style={{ width: "auto", padding: "6px 12px" }}
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Column<T extends { id: string; name: string }>({
  heading,
  items,
  selectedId,
  onSelect,
  accentFor,
  costFor,
  iconFor,
  emptyText,
  renderMeta,
  renderExtra,
}: {
  heading: ReactNode;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  accentFor?: (item: T) => string | undefined;
  costFor: (item: T) => number;
  iconFor?: (item: T) => IconSource | null;
  emptyText?: string;
  renderMeta?: (item: T) => string;
  renderExtra?: (item: T) => ReactNode;
}) {
  return (
    <div style={{ flex: "1 1 280px" }}>
      <div
        className="build-section-title"
        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
      >
        {heading}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.length === 0 && (
          <div style={{ color: "#6868a8", fontSize: 12, padding: "8px 2px" }}>
            {emptyText ?? "Nothing available."}
          </div>
        )}
        {items.map((item) => {
          const selected = item.id === selectedId;
          const accent = accentFor?.(item) ?? "#7a7ad0";
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                border: `1px solid ${selected ? accent : "rgba(100, 85, 200, 0.22)"}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: 5,
                padding: "8px 10px",
                background: selected ? "rgba(40, 30, 80, 0.8)" : "rgba(13, 11, 34, 0.7)",
                color: selected ? "#fff" : "#b8a8e0",
                cursor: "pointer",
                fontFamily: "monospace",
                boxShadow: selected ? `0 0 0 1px ${accent}` : "none",
              }}
            >
              {iconFor && (
                <GameIcon
                  source={iconFor(item)}
                  size={32}
                  fit="cover"
                  fallback={null}
                  style={{ borderRadius: 4 }}
                  decorative
                />
              )}
              {rpBadge(costFor(item))}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: "bold", fontSize: 13 }}>{item.name}</span>
                {renderMeta && (
                  <span style={{ display: "block", color: "#8888b0", fontSize: 10, marginTop: 2 }}>
                    {renderMeta(item)}
                  </span>
                )}
                {renderExtra?.(item)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
