import { useState } from 'react';
import type { PlayerState } from '@mmo-idle/shared';
import { TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';

// ── Entry model ───────────────────────────────────────────────────────────────
// Add new section builders below; the component renders any DebugSection[]
// without changes.  Press ` (backtick) in-game to toggle the panel.

type DebugValue = string | number | boolean | null | undefined;
type DebugEntry =
  | { kind: 'row';     key: string; value: DebugValue }
  | { kind: 'divider'; label: string };

interface DebugSection {
  id:      string;
  label:   string;
  entries: DebugEntry[];
}

const row = (key: string, value: DebugValue): DebugEntry => ({ kind: 'row', key, value });
const div = (label: string):                  DebugEntry => ({ kind: 'divider', label });

// ── Section builders ──────────────────────────────────────────────────────────

function buildCadenceSection(p: PlayerState): DebugSection {
  const count     = p.cadenceCount;
  const threshold = p.cadenceThreshold;
  const armed     = p.cadenceEmpoweredArmed;
  const until     = armed ? 0 : Math.max(0, (threshold - 1) - count);

  const timeline = Array.from({ length: 8 }, (_, i) => {
    const delta = i - until;
    return delta >= 0 && delta % threshold === 0 ? 'F' : '·';
  }).join(' ');

  const entries: DebugEntry[] = [
    row('variant',   p.selectedSubVariant ?? '—'),
    row('range',     p.selectedRange      ?? '—'),
    div('── cycle ──'),
    row('count',     count),
    row('threshold', threshold),
    row('armed',     armed),
    row('until fin', armed ? 'NEXT HIT' : `${until} hit${until === 1 ? '' : 's'}`),
    row('timeline',  timeline),
  ];

  if (p.cadenceSpeedStacks > 0 || 'cadence.speed-stack' in p.passives) {
    entries.push(row('speed stk', p.cadenceSpeedStacks));
  }

  const cadencePassives = Object.entries(p.passives).filter(([k]) => k.startsWith('cadence.'));
  if (cadencePassives.length > 0) {
    entries.push(div('── passives ──'));
    for (const [key, val] of cadencePassives) {
      entries.push(row(key.replace('cadence.', ''), val));
    }
  }

  return { id: 'cadence', label: 'CADENCE', entries };
}

function buildPlayerSection(p: PlayerState): DebugSection {
  const sinceAtk = p.lastAttackAt > 0 ? `${Date.now() - p.lastAttackAt}ms ago` : '—';
  return {
    id: 'player', label: 'PLAYER',
    entries: [
      row('archetype', p.combatArchetype ?? '—'),
      row('nodeId',    p.nodeId),
      row('auto',      p.auto),
      div('── combat ──'),
      row('attack',    p.attack),
      row('atkCD',     `${p.attackCooldown}ms`),
      row('style',     p.attackStyle),
      row('lastAtk',   sinceAtk),
      row('hp',        `${p.hp} / ${p.maxHp}`),
    ],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { player: PlayerState | null; }

function fmt(v: DebugValue): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3);
  return String(v);
}

export function DebugPanel({ player }: Props) {
  const [open,      setOpen]      = useState(false);
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const [confirmReset, setConfirmReset] = useState(false);

  const sections: DebugSection[] = [];
  if (open && player) {
    if (player.combatArchetype === 'cadence' && player.cadenceThreshold > 0) {
      sections.push(buildCadenceSection(player));
    }
    sections.push(buildPlayerSection(player));
  }

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const inTestRoom = player?.nodeId === TEST_ROOM_NODE_ID;

  return (
    <div className="debug-panel">
      <button className="debug-panel__toggle" onClick={() => setOpen(o => !o)}>
        <span className="debug-panel__title">DEBUG</span>
        <span className="debug-panel__chevron">{open ? '▼' : '▶'}</span>
      </button>

      {open && import.meta.env.DEV && (
        <div className="debug-section">
          <button
            className={`debug-btn${inTestRoom ? ' active' : ''}`}
            onClick={() => {
              if (inTestRoom) hudBus.requestLeaveTestRoom();
              else            hudBus.requestGoToTestRoom();
            }}
          >
            {inTestRoom ? 'LEAVE TEST ROOM' : 'GO TO TEST ROOM'}
          </button>
        </div>
      )}

      {open && (
        <div className="debug-section">
          {!confirmReset ? (
            <button
              className="debug-btn"
              style={{ color: '#ff6666' }}
              onClick={() => setConfirmReset(true)}
            >
              RESET PROGRESS
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="debug-div" style={{ padding: '4px 0', color: '#ff9944' }}>
                Wipes skills, items &amp; biome XP. Confirm?
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="debug-btn"
                  style={{ flex: 1, color: '#ff4444' }}
                  onClick={() => { hudBus.requestResetProgress(); setConfirmReset(false); }}
                >
                  YES, RESET
                </button>
                <button
                  className="debug-btn"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmReset(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {open && sections.map(section => (
        <div key={section.id} className="debug-section">
          <button className="debug-section__hdr" onClick={() => toggle(section.id)}>
            <span>{section.label}</span>
            <span className="debug-section__chevron">{collapsed.has(section.id) ? '▶' : '▼'}</span>
          </button>

          {!collapsed.has(section.id) && (
            <div className="debug-section__body">
              {section.entries.map((entry, i) =>
                entry.kind === 'divider' ? (
                  <div key={i} className="debug-div">{entry.label}</div>
                ) : (
                  <div key={i} className="debug-row">
                    <span className="debug-key">{entry.key}</span>
                    <span className="debug-val">{fmt(entry.value)}</span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ))}

      {open && !player && (
        <div className="debug-div" style={{ padding: '6px 0' }}>No player data</div>
      )}
    </div>
  );
}
