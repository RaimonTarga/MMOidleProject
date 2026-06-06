import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  getRuleName,
  type ActionDef,
  type ConditionDef,
  type EquippedRule,
} from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { runesEquippedAtom, runesOwnedAtom } from '../hud/atoms';
import './skillTree.css';

interface Props {
  onClose: () => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  instinct: '#ff7a7a',
  linking: '#7ab8ff',
  wayfinding: '#7affc0',
  targeting: '#d6a8ff',
};

function ruleLabel(rule: EquippedRule): { title: string; subtitle: string } {
  const named = getRuleName(rule.conditionId, rule.actionId);
  const cond = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  const fallback = `${cond?.name ?? rule.conditionId} \u2192 ${action?.name ?? rule.actionId}`;
  return {
    title: named?.name ?? fallback,
    subtitle: named?.blurb ?? fallback,
  };
}

export function RunesPanel({ onClose }: Props) {
  const owned = useAtomValue(runesOwnedAtom);
  const equipped = useAtomValue(runesEquippedAtom);

  const [loadout, setLoadout] = useState<EquippedRule[]>(equipped);
  const [selCond, setSelCond] = useState<string | null>(null);
  const [selAction, setSelAction] = useState<string | null>(null);

  // The atom only changes reference when content actually differs (see atoms.ts
  // setRunesEquipped), so this resyncs on open / reconnect without clobbering
  // the user's own edits mid-interaction.
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

  function commit(next: EquippedRule[]): void {
    setLoadout(next);
    hudBus.requestSetRuneLoadout(next);
  }

  function addRule(): void {
    if (!selCond || !selAction) return;
    commit([...loadout, { conditionId: selCond, actionId: selAction }]);
  }

  function removeRule(index: number): void {
    commit(loadout.filter((_, i) => i !== index));
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
      <div className="skill-tree-panel" style={{ maxWidth: 760 }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Runes</span>
          <button className="skill-tree-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="skill-tree-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── Rule builder ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Column<ConditionDef>
              heading="WHEN…"
              items={conditions}
              selectedId={selCond}
              onSelect={setSelCond}
              renderMeta={(c) => c.blurb}
            />
            <div style={{ alignSelf: 'center', color: '#6868a8', fontSize: 20 }}>→</div>
            <Column<ActionDef>
              heading="…DO THIS"
              items={actions}
              selectedId={selAction}
              onSelect={setSelAction}
              accentFor={(a) => CATEGORY_COLOR[a.category]}
              renderMeta={(a) => a.blurb}
            />
          </div>

          {/* ── Preview + add ────────────────────────────────────────── */}
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
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#c0aee8', fontWeight: 'bold', fontSize: 14 }}>
                    {preview?.name ??
                      `${previewCond?.name ?? selCond} \u2192 ${previewAction?.name ?? selAction}`}
                  </div>
                  <div style={{ color: '#8888b0', fontSize: 11, marginTop: 3 }}>
                    {preview?.blurb ??
                      `${previewCond?.name ?? selCond} → ${previewAction?.name ?? selAction}`}
                  </div>
                </div>
                <button className="auto-btn" style={{ width: 'auto', padding: '6px 14px' }} onClick={addRule}>
                  ADD RULE
                </button>
              </div>
            ) : (
              <div style={{ color: '#6868a8', fontSize: 12 }}>
                Pick a condition and an action to wire a rule.
              </div>
            )}
          </div>

          {/* ── Loadout strip ────────────────────────────────────────── */}
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
              Equipped rules {loadout.length > 0 ? `(${loadout.length})` : ''}
            </div>
            {loadout.length === 0 ? (
              <div style={{ color: '#6868a8', fontSize: 12, fontStyle: 'italic' }}>
                No rules equipped — the AI runs a dumb baseline: hit the nearest thing, never
                flee, never leave the node.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loadout.map((rule, i) => {
                  const { title, subtitle } = ruleLabel(rule);
                  return (
                    <div
                      key={`${rule.conditionId}:${rule.actionId}:${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        border: '1px solid rgba(100, 85, 200, 0.22)',
                        borderRadius: 5,
                        padding: '8px 10px',
                        background: 'rgba(13, 11, 34, 0.7)',
                      }}
                    >
                      <span style={{ color: '#6868a8', fontSize: 11, width: 18 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#d8caf5', fontWeight: 'bold', fontSize: 13 }}>{title}</div>
                        <div style={{ color: '#8888b0', fontSize: 11, marginTop: 2 }}>{subtitle}</div>
                      </div>
                      <button
                        className="skill-tree-close"
                        onClick={() => removeRule(i)}
                        title="Remove rule"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Column<T extends { id: string; name: string }>({
  heading,
  items,
  selectedId,
  onSelect,
  accentFor,
  renderMeta,
}: {
  heading: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  accentFor?: (item: T) => string | undefined;
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
        {items.map((item) => {
          const selected = item.id === selectedId;
          const accent = accentFor?.(item) ?? '#7a7ad0';
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${selected ? accent : 'rgba(100, 85, 200, 0.22)'}`,
                borderRadius: 5,
                padding: '8px 10px',
                background: selected ? 'rgba(40, 30, 80, 0.8)' : 'rgba(13, 11, 34, 0.7)',
                color: selected ? '#fff' : '#b8a8e0',
                cursor: 'pointer',
                fontFamily: 'monospace',
                boxShadow: selected ? `0 0 0 1px ${accent}` : 'none',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{item.name}</div>
              {renderMeta && (
                <div style={{ color: '#8888b0', fontSize: 10, marginTop: 2 }}>
                  {renderMeta(item)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
