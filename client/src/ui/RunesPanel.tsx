import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  getRuleName,
  isRuneRuleCompatible,
  runeBudgetForTier,
  runeChannelLabel,
  runeLoadoutCost,
  runeRuleCost,
  type ActionDef,
  type ConditionDef,
  type EquippedRule,
} from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { playerTierAtom, runesEquippedAtom, runesOwnedAtom } from '../hud/atoms';
import './skillTree.css';

interface Props {
  onClose: () => void;
}

const CHANNEL_COLOR: Record<string, string> = {
  MOVEMENT: '#ffb36b',
  TARGETING: '#d6a8ff',
  OOC_MAINTENANCE: '#7ab8ff',
  GLOBAL_STRATEGY: '#7affc0',
};

function ruleLabel(rule: EquippedRule): { title: string; subtitle: string } {
  const named = getRuleName(rule.conditionId, rule.actionId);
  const cond = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  const fallback = `${cond?.name ?? rule.conditionId} -> ${action?.name ?? rule.actionId}`;
  return {
    title: named?.name ?? fallback,
    subtitle: named?.blurb ?? fallback,
  };
}

function rpBadge(cost: number, tone: 'normal' | 'danger' = 'normal') {
  return (
    <span
      style={{
        minWidth: 34,
        height: 28,
        padding: '0 6px',
        border: `1px solid ${tone === 'danger' ? '#ff7a7a' : '#e0c15c'}`,
        borderRadius: 3,
        background: tone === 'danger' ? 'rgba(90, 20, 30, 0.75)' : 'rgba(65, 47, 12, 0.85)',
        color: tone === 'danger' ? '#ffc0c0' : '#ffe084',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 'bold',
        flexShrink: 0,
      }}
    >
      {cost} RP
    </span>
  );
}

function RunePointMeter({ spent, budget }: { spent: number; budget: number }) {
  const over = Math.max(0, spent - budget);
  return (
    <div
      style={{
        border: '1px solid rgba(100, 85, 200, 0.25)',
        borderRadius: 6,
        padding: '9px 10px',
        background: 'rgba(13, 11, 34, 0.7)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            color: '#c0aee8',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Rune Points
        </span>
        <span style={{ color: over > 0 ? '#ff7a7a' : '#ffe084', fontSize: 12, fontWeight: 'bold' }}>
          {spent} / {budget}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: budget }, (_, i) => {
          const used = i < Math.min(spent, budget);
          return (
            <span
              key={i}
              title={used ? 'Spent rune point' : 'Available rune point'}
              style={{
                width: 18,
                height: 10,
                borderRadius: 2,
                border: `1px solid ${used ? '#e0c15c' : '#46d8a4'}`,
                background: used ? 'rgba(224, 193, 92, 0.9)' : 'rgba(70, 216, 164, 0.18)',
                boxShadow: used ? '0 0 8px rgba(224, 193, 92, 0.22)' : 'none',
              }}
            />
          );
        })}
        {Array.from({ length: over }, (_, i) => (
          <span
            key={`over-${i}`}
            title="Over budget"
            style={{
              width: 18,
              height: 10,
              borderRadius: 2,
              border: '1px solid #ff7a7a',
              background: 'rgba(255, 122, 122, 0.85)',
              boxShadow: '0 0 8px rgba(255, 122, 122, 0.28)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function RunesPanel({ onClose }: Props) {
  const owned = useAtomValue(runesOwnedAtom);
  const equipped = useAtomValue(runesEquippedAtom);
  const playerTier = useAtomValue(playerTierAtom);

  const [loadout, setLoadout] = useState<EquippedRule[]>(equipped);
  const [selCond, setSelCond] = useState<string | null>(null);
  const [selAction, setSelAction] = useState<string | null>(null);

  useEffect(() => {
    setLoadout(equipped);
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
        isRuneRuleCompatible({ conditionId: selCond, actionId: a.id }),
      )
    : [];

  const pendingRule =
    selCond && selAction ? { conditionId: selCond, actionId: selAction } : null;
  const pendingCompatible = pendingRule
    ? isRuneRuleCompatible(pendingRule)
    : false;
  const pendingCost = pendingRule ? runeRuleCost(pendingRule) : 0;
  const budget = runeBudgetForTier(playerTier);
  const spent = runeLoadoutCost(loadout);
  const pendingOverBudget = pendingRule
    ? spent + pendingCost > budget
    : false;

  function commit(next: EquippedRule[]): void {
    setLoadout(next);
    hudBus.requestSetRuneLoadout(next);
  }

  function addRule(): void {
    if (!pendingRule || !pendingCompatible || pendingOverBudget) return;
    commit([...loadout, pendingRule]);
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

  const preview =
    selCond && selAction ? getRuleName(selCond, selAction) : null;
  const previewCond = selCond ? CONDITION_DATABASE.get(selCond) : null;
  const previewAction = selAction ? ACTION_DATABASE.get(selAction) : null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 820 }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Runes</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="skill-tree-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RunePointMeter spent={spent} budget={budget} />

          <div>
            <div
              style={{
                color: '#c0aee8',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Priority rules {loadout.length > 0 ? `(${loadout.length})` : ''}
            </div>
            {loadout.length === 0 ? (
              <div style={{ color: '#6868a8', fontSize: 12, fontStyle: 'italic' }}>
                No rules equipped. Your character will only use the fallback combat behavior.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loadout.map((rule, i) => {
                  const { title, subtitle } = ruleLabel(rule);
                  const action = ACTION_DATABASE.get(rule.actionId);
                  const accent = action ? CHANNEL_COLOR[action.channel] : '#7a7ad0';
                  const compatible = isRuneRuleCompatible(rule);
                  return (
                    <div
                      key={`${rule.conditionId}:${rule.actionId}:${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        border: `1px solid ${compatible ? 'rgba(100, 85, 200, 0.22)' : 'rgba(255, 122, 122, 0.5)'}`,
                        borderLeft: `4px solid ${compatible ? accent : '#ff7a7a'}`,
                        borderRadius: 5,
                        padding: '8px 10px',
                        background: 'rgba(13, 11, 34, 0.7)',
                      }}
                    >
                      <span style={{ color: '#6868a8', fontSize: 11, width: 18 }}>{i + 1}</span>
                      {rpBadge(runeRuleCost(rule), compatible ? 'normal' : 'danger')}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#d8caf5', fontWeight: 'bold', fontSize: 13 }}>{title}</div>
                        <div style={{ color: compatible ? '#8888b0' : '#ffaaa0', fontSize: 11, marginTop: 2 }}>
                          {compatible ? subtitle : 'Invalid pairing. Remove or replace this rule.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <PriorityButton
                          label="Move rule higher"
                          disabled={i === 0}
                          onClick={() => moveRule(i, -1)}
                        >
                          ↑
                        </PriorityButton>
                        <PriorityButton
                          label="Move rule lower"
                          disabled={i === loadout.length - 1}
                          onClick={() => moveRule(i, 1)}
                        >
                          ↓
                        </PriorityButton>
                      </div>
                      <button
                        className="skill-tree-close"
                        onClick={() => removeRule(i)}
                        title="Remove rule"
                      >
                        x
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Column<ConditionDef>
              heading="Situation"
              items={conditions}
              selectedId={selCond}
              onSelect={(id) => {
                setSelCond(id);
                if (selAction && !isRuneRuleCompatible({ conditionId: id, actionId: selAction })) {
                  setSelAction(null);
                }
              }}
              costFor={(c) => c.cost}
              renderMeta={(c) => c.blurb}
            />
            <div style={{ alignSelf: 'center', color: '#6868a8', fontSize: 20 }}>then</div>
            <Column<ActionDef>
              heading="Response"
              items={viableActions}
              selectedId={selAction}
              onSelect={setSelAction}
              costFor={(a) => a.cost}
              accentFor={(a) => CHANNEL_COLOR[a.channel]}
              emptyText={selCond ? 'No responses fit this situation.' : 'Pick a situation first.'}
              renderMeta={(a) => `${runeChannelLabel(a.channel)} - ${a.blurb}`}
            />
          </div>

          <div
            style={{
              border: '1px solid rgba(100, 85, 200, 0.25)',
              borderRadius: 6,
              padding: '10px 12px',
              background: 'rgba(20, 16, 45, 0.5)',
            }}
          >
            {selCond && selAction ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {rpBadge(pendingCost, pendingOverBudget ? 'danger' : 'normal')}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#c0aee8', fontWeight: 'bold', fontSize: 14 }}>
                    {preview?.name ??
                      `${previewCond?.name ?? selCond} -> ${previewAction?.name ?? selAction}`}
                  </div>
                  <div style={{ color: pendingCompatible ? '#8888b0' : '#ffaaa0', fontSize: 11, marginTop: 3 }}>
                    {!pendingCompatible
                      ? 'That response does not make sense for this situation.'
                      : pendingOverBudget
                        ? 'This rule exceeds your current rune point budget.'
                        : preview?.blurb ??
                          `${previewCond?.name ?? selCond} -> ${previewAction?.name ?? selAction}`}
                  </div>
                </div>
                <button
                  className="auto-btn"
                  style={{ width: 'auto', padding: '6px 14px' }}
                  onClick={addRule}
                  disabled={!pendingCompatible || pendingOverBudget}
                >
                  ADD RULE
                </button>
              </div>
            ) : (
              <div style={{ color: '#6868a8', fontSize: 12 }}>
                Pick a situation and a response.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body,
  );
}

function PriorityButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24,
        height: 20,
        borderRadius: 3,
        border: `1px solid ${disabled ? 'rgba(100, 85, 200, 0.16)' : 'rgba(122, 184, 255, 0.48)'}`,
        background: disabled ? 'rgba(13, 11, 34, 0.35)' : 'rgba(24, 31, 62, 0.9)',
        color: disabled ? '#4a466f' : '#bcd8ff',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function Column<T extends { id: string; name: string }>({
  heading,
  items,
  selectedId,
  onSelect,
  accentFor,
  costFor,
  emptyText,
  renderMeta,
}: {
  heading: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  accentFor?: (item: T) => string | undefined;
  costFor: (item: T) => number;
  emptyText?: string;
  renderMeta?: (item: T) => string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          color: '#c0aee8',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {heading}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.length === 0 && (
          <div style={{ color: '#6868a8', fontSize: 12, padding: '8px 2px' }}>
            {emptyText ?? 'Nothing available.'}
          </div>
        )}
        {items.map((item) => {
          const selected = item.id === selectedId;
          const accent = accentFor?.(item) ?? '#7a7ad0';
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                border: `1px solid ${selected ? accent : 'rgba(100, 85, 200, 0.22)'}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: 5,
                padding: '8px 10px',
                background: selected ? 'rgba(40, 30, 80, 0.8)' : 'rgba(13, 11, 34, 0.7)',
                color: selected ? '#fff' : '#b8a8e0',
                cursor: 'pointer',
                fontFamily: 'monospace',
                boxShadow: selected ? `0 0 0 1px ${accent}` : 'none',
              }}
            >
              {rpBadge(costFor(item))}
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 'bold', fontSize: 13 }}>{item.name}</span>
                {renderMeta && (
                  <span style={{ display: 'block', color: '#8888b0', fontSize: 10, marginTop: 2 }}>
                    {renderMeta(item)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
